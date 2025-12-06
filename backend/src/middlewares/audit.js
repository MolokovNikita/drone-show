const { AuditLog } = require('../models');

const auditLog = (action, entityType = null) => {
  return async (req, res, next) => {
    const originalSend = res.json;
    
    res.json = function(data) {
      // Log after response is sent
      setImmediate(async () => {
        try {
          const entityId = req.params.id || req.body?.id || null;
          const oldValues = req.method === 'PUT' || req.method === 'PATCH' ? req.body : null;
          const newValues = req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH' ? req.body : null;

          await AuditLog.create({
            userId: req.user?.id || null,
            action: action || `${req.method} ${req.path}`,
            entityType,
            entityId,
            oldValues,
            newValues,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent')
          });
        } catch (error) {
          console.error('Audit log error:', error);
        }
      });

      return originalSend.call(this, data);
    };

    next();
  };
};

module.exports = { auditLog };

