// const redisClient = require('../config/redis');

// const cacheMiddleware = (durationSeconds = 60) => {
//   return async (req, res, next) => {
//     const key = `cache:${req.originalUrl || req.url}`;
//     console.log('originalURL REDIS 1:', req.originalUrl)
//     console.log('originalURL REDIS 2:', req.url)
//     try {

//       if (!redisClient.isReady) {
//         console.warn('Redis not ready, skipping cache');
//         return next();
//       }

//       const cached = await redisClient.get(key);
//       if (cached) {
//         console.log(`Cache HIT: ${key}`);
//         res.set('X-Cache-Status', 'HIT');
//         return res.json(JSON.parse(cached));
//       }

//       // Override res.json agar bisa kita simpan ke cache
//       const oldJson = res.json;
//       res.json = function (data) {
//         // Hanya cache jika status 200 dan ada data
//         if (res.statusCode === 200 && data?.success) {
//           redisClient.setEx(key, durationSeconds, JSON.stringify(data));
//           res.set('X-Cache-Status', 'SET'); 
//           console.log(`Cache SET: ${key} (${durationSeconds}s)`);
//         }
//         return oldJson.call(this, data);
//       };

//       next();
//     } catch (err) {
//       console.error('Redis cache error:', err);
//       next(); // lanjut tanpa cache jika redis mati
//     }
//   };
// };

// module.exports = cacheMiddleware;


const redisClient = require('../config/redis');

const cacheMiddleware = (durationSeconds = 60) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl || req.url}`;
    // console.log('originalURL REDIS 1:', req.originalUrl);
    // console.log('originalURL REDIS 2:', req.url);

    try {
      // ioredis: cek koneksi pakai .status bukan .isReady
      if (redisClient.status !== 'ready') {
        console.warn('Redis not ready, skipping cache');
        return next();
      }

      const cached = await redisClient.get(key);
      if (cached) {
        console.log(`Cache HIT: ${key}`);
        res.set('X-Cache-Status', 'HIT');
        return res.json(JSON.parse(cached));
      }

      const oldJson = res.json;
      res.json = function (data) {
        if (res.statusCode === 200 && data?.success) {
          // ioredis: set(key, value, 'EX', seconds)
          redisClient.set(key, JSON.stringify(data), 'EX', durationSeconds);
          res.set('X-Cache-Status', 'SET');
          // console.log(`Cache SET: ${key} (${durationSeconds}s)`);
        }
        return oldJson.call(this, data);
      };

      next();
    } catch (err) {
      console.error('Redis cache error:', err);
      next();
    }
  };
};

module.exports = cacheMiddleware;