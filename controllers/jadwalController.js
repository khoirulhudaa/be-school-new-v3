const Schedule = require('../models/jadwal');

exports.getAllSchedules = async (req, res) => {
  try {
    const { schoolId } = req.query;

    if (!schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'schoolId wajib disertakan di query' 
      });
    }

    const schedules = await Schedule.findAll({
      where: { 
        schoolId: parseInt(schoolId),
        isActive: true 
      },
      order: [['day', 'ASC'], ['startTime', 'ASC']],
    });

    res.json({ success: true, data: schedules });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createSchedule = async (req, res) => {
  try {
    const { day, startTime, endTime, subject, className, teacher, room, description, schoolId } = req.body;

    if (!day || !startTime || !endTime || !subject || !className || !schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'day, startTime, endTime, subject, className, dan schoolId wajib diisi' 
      });
    }

    const newSchedule = await Schedule.create({ 
      day, 
      startTime,
      endTime,
      subject,
      className,
      teacher,
      room,
      description,
      schoolId: parseInt(schoolId)
    });

    res.status(201).json({ success: true, data: newSchedule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { day, startTime, endTime, subject, className, teacher, room, description } = req.body;

    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
    }

    // Update field yang dikirim
    if (day) schedule.day = day;
    if (startTime) schedule.startTime = startTime;
    if (endTime) schedule.endTime = endTime;
    if (subject) schedule.subject = subject;
    if (className) schedule.className = className;
    if (teacher !== undefined) schedule.teacher = teacher;
    if (room !== undefined) schedule.room = room;
    if (description !== undefined) schedule.description = description;

    await schedule.save();

    res.json({ success: true, data: schedule });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;

    const schedule = await Schedule.findByPk(id);
    if (!schedule) {
      return res.status(404).json({ success: false, message: 'Jadwal tidak ditemukan' });
    }

    schedule.isActive = false;
    await schedule.save();

    res.json({ success: true, message: 'Jadwal berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};