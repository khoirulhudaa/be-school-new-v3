const SchoolProfile = require('../models/profileSekolah');
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

exports.getSchoolProfile = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'schoolId wajib disertakan di query parameter' 
      });
    }

    const profile = await SchoolProfile.findOne({
      where: { 
        schoolId: parseInt(schoolId),
        isActive: true 
      },
    });

    return res.status(200).json({ 
      success: true, 
      message: profile ? 'Profil berhasil ditemukan' : 'Profil belum dibuat untuk sekolah ini',
      data: profile || null 
    });

  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createSchoolProfile = async (req, res) => {
  try {
    const {
      schoolId, heroTitle, heroSubTitle, linkYoutube, youtubeUrls, headmasterWelcome, headmasterName, schoolName,
      studentCount, teacherCount, roomCount, achievementCount, latitude, longitude,
      address, phoneNumber, email, kepalaSekolahPhone, kepalaSekolahEmail,
      socialInstagram, socialFacebook, socialTwitter,
      seoTitle, seoDescription, seoKeywords, ogTitle, ogDescription, ogImage
    } = req.body;

    if (!schoolId || !heroTitle || !headmasterWelcome || !headmasterName || !schoolName) {
      return res.status(400).json({
        success: false,
        message: 'schoolId, heroTitle, headmasterWelcome, headmasterName, dan schoolName wajib diisi'
      });
    }

    if (!kepalaSekolahPhone || !kepalaSekolahEmail) {
      return res.status(400).json({
        success: false,
        message: 'No. WA dan Email Kepala Sekolah wajib diisi'
      });
    }

    const existing = await SchoolProfile.findOne({ where: { schoolId: parseInt(schoolId) } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Profil untuk schoolId ini sudah ada' });
    }

    let photoHeadmasterUrl = null;
    let heroImageUrl = null;
    let logoUrl = null;

    // Fungsi pembantu untuk upload ke Cloudinary agar kode tidak duplikat
    const uploadToCloudinary = (fileBuffer) => {
      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'school_profiles' },
          (error, result) => error ? reject(error) : resolve(result)
        );
        streamifier.createReadStream(fileBuffer).pipe(uploadStream);
      });
    };

    if (req.files?.photoHeadmasterUrl?.[0]) {
      const res = await uploadToCloudinary(req.files.photoHeadmasterUrl[0].buffer);
      photoHeadmasterUrl = res.secure_url;
    }

    if (req.files?.heroImage?.[0]) {
      const res = await uploadToCloudinary(req.files.heroImage[0].buffer);
      heroImageUrl = res.secure_url;
    }

    if (req.files?.logo?.[0]) {
      const res = await uploadToCloudinary(req.files.logo[0].buffer);
      logoUrl = res.secure_url;
    }

    // Parse youtubeUrls if it's a JSON string
    let parsedYoutubeUrls = null;
    if (youtubeUrls) {
      try {
        parsedYoutubeUrls = typeof youtubeUrls === 'string' ? JSON.parse(youtubeUrls) : youtubeUrls;
      } catch (e) {
        parsedYoutubeUrls = null;
      }
    }

    const newProfile = await SchoolProfile.create({
      schoolId: parseInt(schoolId),
      heroTitle, heroSubTitle, linkYoutube, youtubeUrls: parsedYoutubeUrls, headmasterWelcome, headmasterName, schoolName,
      photoHeadmasterUrl,
      heroImageUrl,
      studentCount: parseInt(studentCount) || 0,
      teacherCount: parseInt(teacherCount) || 0,
      roomCount: parseInt(roomCount) || 0,
      achievementCount: parseInt(achievementCount) || 0,
      latitude: parseFloat(latitude) || null,
      longitude: parseFloat(longitude) || null,
      address: address || null,
      phoneNumber: phoneNumber || null,
      email: email || null,
      logoUrl,
      kepalaSekolahPhone: kepalaSekolahPhone || null,
      kepalaSekolahEmail: kepalaSekolahEmail || null,
      socialInstagram: socialInstagram || null,
      socialFacebook: socialFacebook || null,
      socialTwitter: socialTwitter || null,
      seoTitle: seoTitle || null,
      seoDescription: seoDescription || null,
      seoKeywords: seoKeywords || null,
      ogTitle: ogTitle || null,
      ogDescription: ogDescription || null,
      ogImage: ogImage || null,
    });

    res.status(201).json({ success: true, data: newProfile });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSchoolProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await SchoolProfile.findByPk(id);

    if (!profile) {
      return res.status(404).json({ success: false, message: 'Profil tidak ditemukan' });
    }

    const {
      heroTitle, heroSubTitle, linkYoutube, youtubeUrls, headmasterWelcome, headmasterName, schoolName,
      studentCount, teacherCount, roomCount, achievementCount, latitude, longitude,
      address, phoneNumber, email, kepalaSekolahPhone, kepalaSekolahEmail,
      socialInstagram, socialFacebook, socialTwitter,
      seoTitle, seoDescription, seoKeywords, ogTitle, ogDescription, ogImage
    } = req.body;

    // Update fields yang dikirim
    if (heroTitle !== undefined) profile.heroTitle = heroTitle;
    if (heroSubTitle !== undefined) profile.heroSubTitle = heroSubTitle;
    if (linkYoutube !== undefined) profile.linkYoutube = linkYoutube;

    // Handle youtubeUrls as JSON array
    if (youtubeUrls !== undefined) {
      if (typeof youtubeUrls === 'string') {
        try {
          profile.youtubeUrls = JSON.parse(youtubeUrls);
        } catch (e) {
          profile.youtubeUrls = null;
        }
      } else {
        profile.youtubeUrls = youtubeUrls;
      }
    }

    if (headmasterWelcome !== undefined) profile.headmasterWelcome = headmasterWelcome;
    if (headmasterName !== undefined) profile.headmasterName = headmasterName;
    if (schoolName !== undefined) profile.schoolName = schoolName;

    if (studentCount !== undefined) profile.studentCount = parseInt(studentCount) || 0;
    if (teacherCount !== undefined) profile.teacherCount = parseInt(teacherCount) || 0;
    if (roomCount !== undefined) profile.roomCount = parseInt(roomCount) || 0;
    if (achievementCount !== undefined) profile.achievementCount = parseInt(achievementCount) || 0;
    if (latitude !== undefined) profile.latitude = parseFloat(latitude) || null;
    if (longitude !== undefined) profile.longitude = parseFloat(longitude) || null;

    if (address !== undefined) profile.address = address || null;
    if (phoneNumber !== undefined) profile.phoneNumber = phoneNumber || null;
    if (email !== undefined) profile.email = email || null;

    if (kepalaSekolahPhone !== undefined) profile.kepalaSekolahPhone = kepalaSekolahPhone || null;
    if (kepalaSekolahEmail !== undefined) profile.kepalaSekolahEmail = kepalaSekolahEmail || null;
    if (socialInstagram !== undefined) profile.socialInstagram = socialInstagram || null;
    if (socialFacebook !== undefined) profile.socialFacebook = socialFacebook || null;
    if (socialTwitter !== undefined) profile.socialTwitter = socialTwitter || null;
    if (seoTitle !== undefined) profile.seoTitle = seoTitle || null;
    if (seoDescription !== undefined) profile.seoDescription = seoDescription || null;
    if (seoKeywords !== undefined) profile.seoKeywords = seoKeywords || null;
    if (ogTitle !== undefined) profile.ogTitle = ogTitle || null;
    if (ogDescription !== undefined) profile.ogDescription = ogDescription || null;
    if (ogImage !== undefined) profile.ogImage = ogImage || null;


    // Ganti foto kepala sekolah jika dikirim file baru
    if (req.files?.photoHeadmasterUrl?.[0]) {
      // Hapus yang lama jika ada
      if (profile.photoHeadmasterUrl) {
        try {
          const publicId = profile.photoHeadmasterUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`school_profiles/${publicId}`);
        } catch (e) {
          console.log('Gagal hapus foto kepsek lama:', e.message);
        }
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'school_profiles' },
          (error, result) => error ? reject(error) : resolve(result)
        );
        streamifier.createReadStream(req.files.photoHeadmasterUrl[0].buffer).pipe(uploadStream);
      });
      profile.photoHeadmasterUrl = result.secure_url;
    }

    // Ganti hero image jika dikirim file baru
    if (req.files?.heroImage?.[0]) {
      // Hapus yang lama jika ada
      if (profile.heroImageUrl) {
        try {
          const publicId = profile.heroImageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`school_profiles/${publicId}`);
        } catch (e) {
          console.log('Gagal hapus hero image lama:', e.message);
        }
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'school_profiles' },
          (error, result) => error ? reject(error) : resolve(result)
        );
        streamifier.createReadStream(req.files.heroImage[0].buffer).pipe(uploadStream);
      });
      profile.heroImageUrl = result.secure_url;
    }

    // === 3. Ganti logo sekolah (Sama dengan heroImage) ===
    if (req.files?.logo?.[0]) {
      if (profile.logoUrl) {
        try {
          const publicId = profile.logoUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`school_profiles/${publicId}`);
        } catch (e) {
          console.log('Gagal hapus logo lama:', e.message);
        }
      }

      const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          { resource_type: 'image', folder: 'school_profiles' },
          (error, result) => error ? reject(error) : resolve(result)
        );
        streamifier.createReadStream(req.files.logo[0].buffer).pipe(uploadStream);
      });
      profile.logoUrl = result.secure_url;
    }

    await profile.save();
    res.json({ success: true, data: profile });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSchoolProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const profile = await SchoolProfile.findByPk(id);

    if (!profile) {
      return res.status(200).json({ success: false, message: 'Data sudah tidak ada atau tidak ditemukan' });
    }

    profile.isActive = false;
    await profile.save();

    res.json({ success: true, message: 'Profil sekolah berhasil dinonaktifkan' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};