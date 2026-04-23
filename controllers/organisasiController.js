const SchoolOrganization = require('../models/organisasi');
const GuruTendik = require('../models/guruTendik'); 

exports.getAllSchoolOrganizations = async (req, res) => {
  try {
    const { schoolId } = req.query;
    if (!schoolId) return res.status(400).json({ success: false, message: 'schoolId wajib' });

    // Ambil semua data posisi yang aktif
    const organizations = await SchoolOrganization.findAll({
      where: { schoolId: parseInt(schoolId), isActive: true },
      include: [{ model: GuruTendik }],
      order: [['id', 'ASC']], 
    });

    // Fungsi untuk merubah array flat menjadi Tree
    const buildTree = (data, parentId = null) => {
      return data
        .filter(item => item.parentId === parentId)
        .map(item => ({
          ...item.toJSON(),
          Children: buildTree(data, item.id)
        }));
    };

    const treeData = buildTree(organizations);
    res.json({ success: true, data: treeData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createSchoolOrganization = async (req, res) => {
  try {
    const { position, parentId, assignedEmployeeId, description, schoolId } = req.body;

    if (!position || !schoolId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Position dan schoolId wajib diisi' 
      });
    }

    
    if (assignedEmployeeId) {
      const employee = await GuruTendik.findOne({ where: { id: assignedEmployeeId, schoolId: parseInt(schoolId) } });
      if (!employee) {
        return res.status(400).json({ 
          success: false, 
          message: 'Assigned employee tidak ditemukan atau tidak termasuk di school ini' 
        });
      }
    }

    
    if (parentId) {
      const parent = await SchoolOrganization.findOne({ where: { id: parentId, schoolId: parseInt(schoolId) } });
      if (!parent) {
        return res.status(400).json({ 
          success: false, 
          message: 'Parent position tidak ditemukan' 
        });
      }
    }

    const newOrganization = await SchoolOrganization.create({ 
      position, 
      parentId,
      assignedEmployeeId,
      description,
      schoolId: parseInt(schoolId)
    });

    res.json({ success: true, data: newOrganization });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateSchoolOrganization = async (req, res) => {
  try {
    const { id } = req.params;
    const { position, parentId, assignedEmployeeId, description } = req.body;

    const organization = await SchoolOrganization.findByPk(id);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Position organisasi tidak ditemukan' });
    }

    
    if (position) organization.position = position;
    if (parentId !== undefined) organization.parentId = parentId;
    if (assignedEmployeeId !== undefined) {
      if (assignedEmployeeId) {
        const employee = await GuruTendik.findOne({ where: { id: assignedEmployeeId, schoolId: organization.schoolId } });
        if (!employee) {
          return res.status(400).json({ 
            success: false, 
            message: 'Assigned employee tidak ditemukan atau tidak termasuk di school ini' 
          });
        }
      }
      organization.assignedEmployeeId = assignedEmployeeId;
    }
    if (description !== undefined) organization.description = description;

    
    if (parentId) {
      const parent = await SchoolOrganization.findOne({ where: { id: parentId, schoolId: organization.schoolId } });
      if (!parent) {
        return res.status(400).json({ 
          success: false, 
          message: 'Parent position tidak ditemukan' 
        });
      }
      
      if (parentId === parseInt(id)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Parent tidak boleh sama dengan dirinya sendiri' 
        });
      }
    }

    await organization.save();

    res.json({ success: true, data: organization });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteSchoolOrganization = async (req, res) => {
  try {
    const { id } = req.params;

    const organization = await SchoolOrganization.findByPk(id);
    if (!organization) {
      return res.status(404).json({ success: false, message: 'Position organisasi tidak ditemukan' });
    }

    
    const children = await SchoolOrganization.findAll({ where: { parentId: id } });
    if (children.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Tidak bisa menghapus position yang memiliki sub-position' 
      });
    }

    
    organization.isActive = false;
    await organization.save();

    res.json({ success: true, message: 'Position organisasi berhasil dihapus (soft delete)' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};