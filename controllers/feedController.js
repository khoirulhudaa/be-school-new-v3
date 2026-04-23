const InstagramFeed = require('../models/feed');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.getAllFeeds = async (req, res) => {
  try {
    const schoolId = req.schoolId || req.query.schoolId;
    if (!schoolId) {
      return res.status(400).json({ success: false, message: 'schoolId wajib ada' });
    }

    const feeds = await InstagramFeed.findAll({
      where: { schoolId: parseInt(schoolId), isActive: true },
      order: [['postDate', 'DESC']],
    });

    res.json({ success: true, data: feeds });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createFeed = async (req, res) => {
  try {
    const { schoolId, username, caption, postLink, postDate, mediaType } = req.body;

    if (!schoolId || !postDate) {
      return res.status(400).json({ success: false, message: 'schoolId dan postDate wajib diisi' });
    }

    let mediaUrl = null;
    if (req.file) {
      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { 
            resource_type: 'auto', 
            folder: 'instagram_feeds' 
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });
      mediaUrl = result.secure_url;
    }

    const newFeed = await InstagramFeed.create({
      schoolId: parseInt(schoolId),
      username: username || "sman25jkt_official",
      caption,
      postLink,
      postDate,
      mediaType: mediaType || 'image',
      mediaUrl,
    });

    res.status(201).json({ success: true, data: newFeed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateFeed = async (req, res) => {
  try {
    const { id } = req.params;
    const feed = await InstagramFeed.findByPk(id);

    if (!feed) return res.status(404).json({ success: false, message: 'Feed tidak ditemukan' });

    const { username, caption, postLink, postDate, mediaType } = req.body;

    if (username) feed.username = username;
    if (caption) feed.caption = caption;
    if (postLink) feed.postLink = postLink;
    if (postDate) feed.postDate = postDate;
    if (mediaType) feed.mediaType = mediaType;

    if (req.file) {
      // Hapus media lama
      if (feed.mediaUrl) {
        const publicId = feed.mediaUrl.split('/').pop().split('.')[0];
        const resourceType = feed.mediaType === 'video' ? 'video' : 'image';
        await cloudinary.uploader.destroy(`instagram_feeds/${publicId}`, { resource_type: resourceType });
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { 
            resource_type: 'auto', 
            folder: 'instagram_feeds' 
          },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);
      });
      feed.mediaUrl = result.secure_url;
    }

    await feed.save();
    res.json({ success: true, data: feed });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteFeed = async (req, res) => {
  try {
    const { id } = req.params;
    const feed = await InstagramFeed.findByPk(id);
    if (!feed) return res.status(404).json({ success: false, message: 'Data tidak ditemukan' });

    feed.isActive = false;
    await feed.save();
    res.json({ success: true, message: 'Feed berhasil dinonaktifkan' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};