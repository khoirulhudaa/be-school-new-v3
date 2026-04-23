require('dotenv').config();

const { Queue } = require('bullmq');
const Redis = require('ioredis');

const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
});

const attendanceQueue = new Queue('attendance-queue', {
  connection
});

module.exports = attendanceQueue;