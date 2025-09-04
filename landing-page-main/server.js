const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files (CSS, JS, images, etc.)
app.use(express.static(path.join(__dirname)));

// Route for /download
app.get("/download", (req, res) => {
  res.sendFile(path.join(__dirname, "download.html"));
});

// Route for root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Route for /update
app.get("/update", (req, res) => {
  res.sendFile(path.join(__dirname, "update", "index.html"));
});

// General route for /update/:filename
app.get("/update/:filename", (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, "update", `${filename}.html`);

  res.sendFile(filePath, (err) => {
    if (err) {
      // If file doesn't exist, serve 404 or redirect to update index
      res.status(404).sendFile(path.join(__dirname, "update", "index.html"));
    }
  });
});

// Catch-all handler for other routes - serve index.html (SPA behavior)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Download page available at http://localhost:${PORT}/download`);
});
