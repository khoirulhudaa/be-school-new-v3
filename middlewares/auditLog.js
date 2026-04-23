const AuditLog = require('../models/auditLog');

/**
 * Log an action to audit log
 */
async function logAction({
  schoolId,
  userId,
  username,
  action,
  entityType,
  entityId,
  oldData,
  newData,
  ipAddress,
  userAgent,
  description,
}) {
  try {
    await AuditLog.create({
      schoolId,
      userId,
      username,
      action,
      entityType,
      entityId,
      oldData,
      newData,
      ipAddress,
      userAgent,
      description,
    });
  } catch (err) {
    console.error('Audit log error:', err);
    // Don't throw - audit log should not break main flow
  }
}

/**
 * Middleware to auto-log create/update/delete actions
 */
function auditLog(entityType, actionType) {
  return async (req, res, next) => {
    // Store original json
    const originalJson = res.json.bind(res);

    res.json = function (data) {
      // Only log successful operations
      if (data.success && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
        const entityId = data.data?.id || req.params.id;

        logAction({
          schoolId: req.user?.schoolId,
          userId: req.user?.id,
          username: req.user?.name || req.user?.username,
          action: actionType,
          entityType,
          entityId,
          oldData: req.body?._oldData,
          newData: req.body,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          description: `${actionType} ${entityType}`,
        });
      }

      return originalJson(data);
    };

    next();
  };
}

module.exports = { logAction, auditLog };