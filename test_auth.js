try {
  const auth = require('./routes/authRoutes');
  console.log('AuthRoutes type:', typeof auth);
  console.log('AuthRoutes keys:', Object.keys(auth));
  console.log('AuthRoutes stack length:', auth.stack ? auth.stack.length : 'N/A');

  // Test if it matches /auth/login
  const req = { method: 'GET', path: '/auth/login', url: '/auth/login', query: {}, body: {}, params: {}, headers: {}, get: () => '' };
  const match = auth.handle(req, {}, (err) => {
    if (err) {
      console.log('No match error:', err.message);
    } else {
      console.log('Match succeeded');
    }
  });
  console.log('Match result:', match);
} catch(e) {
  console.error('AuthRoutes error:', e.message);
  console.error(e.stack);
}