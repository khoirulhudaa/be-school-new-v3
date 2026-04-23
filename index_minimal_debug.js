require("dotenv").config();
const express = require("express");
const app = express();

// Catch ALL errors
process.on('unhandledRejection', (reason) => {
  console.error('[UNHANDLED]:', reason);
});

// Catch errors at the app level
app.use((req, res, next) => {
  try {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
    next();
  } catch(e) {
    console.error('Request middleware error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// Test route FIRST
app.get("/testing", (req, res) => {
  console.log('/testing hit');
  res.json({ success: true, message: "Direct /testing works" });
});

app.get("/", (req, res) => {
  console.log('/ hit');
  res.json({ success: true, message: "Direct / works" });
});

// NOW load routes with error catching
try {
  const apiRoutes = require("./routes");

  // Wrap apiRoutes with error handler
  const wrappedRouter = express.Router();

  // Add error catching middleware
  wrappedRouter.use((err, req, res, next) => {
    console.error('Router error:', err);
    console.error('Stack:', err.stack);
    res.status(500).json({ success: false, message: err.message });
  });

  // Use routes
  wrappedRouter.use("/", apiRoutes);

  app.use(wrappedRouter);

  console.log("Routes loaded OK");
} catch(e) {
  console.error("Route loading failed:", e.message);
  console.error(e.stack);
}

const port = process.env.PORT || 5006;
app.listen(port, "0.0.0.0", () => {
  console.log("Server on port", port);
});