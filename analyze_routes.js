require("dotenv").config();
const router = require("./routes");

console.log("Router type:", typeof router);
console.log("Stack length:", router.stack.length);

// Analyze each layer
router.stack.forEach((layer, i) => {
  if (layer.route) {
    console.log(`Layer ${i}: Route ${layer.route.path}`);
  } else if (layer.name === 'router') {
    console.log(`Layer ${i}: Router (mount path: ${layer.regexp})`);
  } else {
    console.log(`Layer ${i}: Middleware (${layer.name})`);
  }
});

// Test each route path
const paths = ['/testing', '/', '/auth/login', '/berita', '/test-unique'];
paths.forEach(path => {
  try {
    const match = router.match(path);
    console.log(`\nPath ${path} matches:`);
    if (match && match.route) {
      console.log("  Route found:", match.route.path);
    } else if (match) {
      match.path.forEach((layer, i) => {
        console.log(`  Layer ${i}: ${layer.route ? layer.route.path : layer.name}`);
      });
    }
  } catch(e) {
    console.log(`Path ${path} error:`, e.message);
  }
});