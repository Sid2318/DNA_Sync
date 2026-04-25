const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "../../..");
const frontendDistPath = path.join(projectRoot, "frontend", "dist");
const frontendSourcePath = path.join(projectRoot, "frontend");

const executableCandidates = [];
const envExecutablePath = process.env.DNA_EXECUTABLE_PATH;

if (envExecutablePath) {
  executableCandidates.push(
    path.isAbsolute(envExecutablePath)
      ? envExecutablePath
      : path.join(projectRoot, envExecutablePath),
  );
}

executableCandidates.push(
  path.join(projectRoot, "cpp", "bin", "dna_system.exe"),
  path.join(projectRoot, "cpp", "bin", "dna_system"),
  path.join(projectRoot, "cpp", "bin", "main.exe"),
  path.join(projectRoot, "cpp", "bin", "main"),
  path.join(projectRoot, "main.exe"),
  path.join(projectRoot, "main"),
);

function resolveExecutablePath() {
  for (const candidate of executableCandidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

module.exports = {
  projectRoot,
  frontendDistPath,
  frontendSourcePath,
  executableCandidates,
  resolveExecutablePath,
};
