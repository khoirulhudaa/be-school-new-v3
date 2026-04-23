const router = require("./routes");
console.log("Router type:", typeof router);
console.log("Router keys:", Object.keys(router));
console.log("Router mounted:", router.stack ? router.stack.length : 'unknown');

// Try to require auth routes directly
try {
  const authRouter = require("./routes/authRoutes");
  console.log("AuthRouter:", typeof authRouter);
} catch(e) {
  console.log("AuthRouter error:", e.message);
}

// Try to get /testing
const req = { method: 'GET', path: '/testing', url: '/testing', query: {}, body: {}, params: {}, headers: {}, get: () => '' };
const res = {
  json: (data) => console.log("Response:", JSON.stringify(data)),
  status: (code) => ({ json: (data) => console.log("Error:", data) })
};

// Check if router has testing
console.log("\nStack:", router.stack.map(l => l.route ? l.route.path : l.regexp));