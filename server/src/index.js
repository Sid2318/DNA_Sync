const express = require("express");
const compression = require("compression");
const fs = require("fs");
const path = require("path");

const runRoute = require("./routes/runRoute");
const { frontendDistPath, frontendSourcePath } = require("./config/paths");

const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(express.json({ limit: "1mb" }));
app.use(compression());

const hasDist = fs.existsSync(frontendDistPath);

if (hasDist) {
  app.use(
    express.static(frontendDistPath, {
      maxAge: "1y",
      immutable: true,
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".html")) {
          res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
        }
      },
    }),
  );
} else {
  app.use(express.static(frontendSourcePath));
}

app.use("/api", runRoute);

app.get("*", (req, res) => {
  const indexPath = hasDist
    ? path.join(frontendDistPath, "index.html")
    : path.join(frontendSourcePath, "index.html");

  res.sendFile(indexPath);
});

app.listen(PORT, () => {
  console.log(`Server listening on ${PORT}`);
});
