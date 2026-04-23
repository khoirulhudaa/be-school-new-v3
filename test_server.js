require('dotenv').config();
const { optionalAuth } = require('./middlewares/protect');
const { protect } = require('./middlewares/protect');

console.log('optionalAuth:', typeof optionalAuth);
console.log('protect:', typeof protect);
console.log('optionalAuth is function:', typeof optionalAuth === 'function');
console.log('protect is function:', typeof protect === 'function');

const ctrl = require('./controllers/studentLocationController');
console.log('Controller:', typeof ctrl);
console.log('getAllLocations:', typeof ctrl.getAllLocations);

// Now try loading the route
try {
  const routes = require('./routes/studentLocationRoutes');
  console.log('Routes loaded:', typeof routes);
} catch(e) {
  console.log('Route error:', e.message);
}