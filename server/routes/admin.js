const express = require('express');
const User = require('../models/User');
const Field = require('../models/Field');
const Event = require('../models/Event');
const authenticate = require('../middleware/auth');
const adminOnly = require('../middleware/adminOnly');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse } = require('../utils/response');
const { runFieldCheck } = require('../services/fieldCheckService');

const router = express.Router();
router.use(authenticate, adminOnly);

// GET /admin/stats
router.get(
  '/stats',
  asyncHandler(async (req, res) => {
    const [totalFarmers, totalFields, activeFields, highAlerts] = await Promise.all([
      User.countDocuments({ role: 'farmer' }),
      Field.countDocuments(),
      Field.countDocuments({ status: 'active' }),
      Event.countDocuments({ severity: 'high', read: false }),
    ]);

    // Average yield across all fields with an estimate
    const yieldAgg = await Field.aggregate([
      { $match: { 'current.yieldEstimate': { $exists: true, $ne: null } } },
      { $group: { _id: null, avgYield: { $avg: '$current.yieldEstimate' } } },
    ]);
    const avgYield = yieldAgg[0]?.avgYield || 0;

    // Crop distribution
    const cropDist = await Field.aggregate([
      { $group: { _id: '$crop', count: { $sum: 1 } } },
    ]);

    return successResponse(res, {
      totalFarmers,
      totalFields,
      activeFields,
      highAlerts,
      avgYield: Math.round(avgYield * 100) / 100,
      cropDistribution: cropDist,
    });
  })
);

// GET /admin/fields
router.get(
  '/fields',
  asyncHandler(async (req, res) => {
    const fields = await Field.find()
      .sort({ createdAt: -1 })
      .populate('userId', 'name phone district state');
    return successResponse(res, { fields });
  })
);

// GET /admin/farmers
router.get(
  '/farmers',
  asyncHandler(async (req, res) => {
    const farmers = await User.find({ role: 'farmer' }).sort({ createdAt: -1 });
    // Attach field count per farmer
    const farmersWithCount = await Promise.all(
      farmers.map(async (farmer) => {
        const fieldCount = await Field.countDocuments({ userId: farmer._id });
        return { ...farmer.toObject(), fieldCount };
      })
    );
    return successResponse(res, { farmers: farmersWithCount });
  })
);

// GET /admin/alerts
router.get(
  '/alerts',
  asyncHandler(async (req, res) => {
    const alerts = await Event.find({ severity: 'high' })
      .sort({ createdAt: -1 })
      .limit(200)
      .populate('fieldId', 'name crop location')
      .populate('userId', 'name phone');
    return successResponse(res, { alerts });
  })
);

// GET /admin/yield-map
router.get(
  '/yield-map',
  asyncHandler(async (req, res) => {
    const yieldByState = await Field.aggregate([
      { $match: { 'current.yieldEstimate': { $exists: true, $ne: null } } },
      {
        $group: {
          _id: '$location.state',
          avgYield: { $avg: '$current.yieldEstimate' },
          count: { $sum: 1 },
        },
      },
      { $sort: { avgYield: -1 } },
    ]);
    return successResponse(res, { yieldByState });
  })
);

// POST /admin/run-all-checks
router.post(
  '/run-all-checks',
  asyncHandler(async (req, res) => {
    const activeFields = await Field.find({ status: 'active' }).select('_id');
    let success = 0, failed = 0;
    for (const field of activeFields) {
      try {
        await runFieldCheck(field._id);
        success++;
      } catch {
        failed++;
      }
    }
    return successResponse(res, {
      message: `Completed checks on ${activeFields.length} fields`,
      success,
      failed,
    });
  })
);

module.exports = router;
