const { spawn } = require("child_process");
const {
  executableCandidates,
  resolveExecutablePath,
} = require("../config/paths");

const MAX_BYTES = 2 * 1024 * 1024;
const PROCESS_TIMEOUT_MS = 10_000;

function buildExecutableNotFoundError() {
  const err = new Error("DNA executable not found.");
  err.statusCode = 500;
  err.payload = {
    error:
      "Executable not found. Compile the C++ app first or set DNA_EXECUTABLE_PATH.",
    searched: executableCandidates,
  };
  return err;
}

function normalizeInput(input) {
  let inputToSend = typeof input === "string" ? input : "";

  if (!inputToSend.trim()) {
    return "7\n";
  }

  if (!inputToSend.endsWith("\n")) {
    inputToSend += "\n";
  }

  return inputToSend;
}

function normalizeOptions(options) {
  if (options === undefined || options === null) {
    return "";
  }

  if (typeof options === "string") {
    const trimmed = options.trim();
    return trimmed ? `\n${trimmed}\n` : "";
  }

  // Only forward explicit stdin scripts, not arbitrary option objects.
  if (
    typeof options === "object" &&
    typeof options.stdinScript === "string" &&
    options.stdinScript.trim()
  ) {
    return `\n${options.stdinScript.trim()}\n`;
  }

  return "";
}

function buildTruncatedError(reason, stdoutBuffers, stderrBuffers) {
  const err = new Error(reason);
  err.statusCode = 500;
  err.payload = {
    error: reason,
    partial: Buffer.concat(stdoutBuffers).toString(),
    stderr: Buffer.concat(stderrBuffers).toString(),
  };
  return err;
}

function runDnaProcess(input, options) {
  const exePath = resolveExecutablePath();
  if (!exePath) {
    return Promise.reject(buildExecutableNotFoundError());
  }

  return new Promise((resolve, reject) => {
    const child = spawn(exePath, [], { stdio: ["pipe", "pipe", "pipe"] });

    let stdoutBuffers = [];
    let stderrBuffers = [];
    let stdoutBytes = 0;
    let stderrBytes = 0;
    let truncated = false;
    let truncateReason = "";
    let settled = false;
    let killTimer = null;

    const finishWithError = (err) => {
      if (settled) {
        return;
      }

      settled = true;
      if (killTimer) {
        clearTimeout(killTimer);
      }
      reject(err);
    };

    const finishWithSuccess = (payload) => {
      if (settled) {
        return;
      }

      settled = true;
      if (killTimer) {
        clearTimeout(killTimer);
      }
      resolve(payload);
    };

    child.stdout.on("data", (chunk) => {
      if (truncated) {
        return;
      }

      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      stdoutBytes += buf.length;

      if (stdoutBytes <= MAX_BYTES) {
        stdoutBuffers.push(buf);
        return;
      }

      const allowed = MAX_BYTES - (stdoutBytes - buf.length);
      if (allowed > 0) {
        stdoutBuffers.push(buf.slice(0, allowed));
      }

      truncated = true;
      truncateReason = `Process output exceeded ${MAX_BYTES} bytes and was terminated.`;
      try {
        child.kill();
      } catch (e) {}
    });

    child.stderr.on("data", (chunk) => {
      if (truncated) {
        return;
      }

      const buf = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
      stderrBytes += buf.length;

      if (stderrBytes <= MAX_BYTES) {
        stderrBuffers.push(buf);
        return;
      }

      const allowed = MAX_BYTES - (stderrBytes - buf.length);
      if (allowed > 0) {
        stderrBuffers.push(buf.slice(0, allowed));
      }

      truncated = true;
      truncateReason = `Process error output exceeded ${MAX_BYTES} bytes and was terminated.`;
      try {
        child.kill();
      } catch (e) {}
    });

    child.on("error", (err) => {
      const error = new Error(`Failed to start process: ${err.message}`);
      error.statusCode = 500;
      error.payload = { error: error.message };
      finishWithError(error);
    });

    child.on("close", (code) => {
      if (truncated) {
        finishWithError(
          buildTruncatedError(truncateReason, stdoutBuffers, stderrBuffers),
        );
        return;
      }

      const outStr = Buffer.concat(stdoutBuffers).toString();
      const errStr = Buffer.concat(stderrBuffers).toString();

      if (code !== 0) {
        const error = new Error(errStr || `Process exited ${code}`);
        error.statusCode = 500;
        error.payload = { error: error.message };
        finishWithError(error);
        return;
      }

      finishWithSuccess({ output: outStr });
    });

    const inputToSend = normalizeInput(input);
    const optionsToSend = normalizeOptions(options);

    try {
      child.stdin.write(inputToSend);
      if (optionsToSend) {
        child.stdin.write(optionsToSend);
      }
      child.stdin.end();
    } catch (e) {
      const error = new Error(`Failed to write process input: ${e.message}`);
      error.statusCode = 500;
      error.payload = { error: error.message };
      finishWithError(error);
      return;
    }

    killTimer = setTimeout(() => {
      truncated = true;
      truncateReason = `Process timed out after ${PROCESS_TIMEOUT_MS}ms and was terminated.`;
      try {
        child.kill();
      } catch (e) {}
    }, PROCESS_TIMEOUT_MS);
  });
}

module.exports = {
  runDnaProcess,
};
