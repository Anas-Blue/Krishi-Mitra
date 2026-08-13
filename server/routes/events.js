const express = require('express');
const Event = require('../models/Event');
const authenticate = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

const router = express.Router();
router.use(authenticate);

// GET /events or GET /events?fieldId=:id
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter = { userId: req.user._id };
    if (req.query.fieldId) filter.fieldId = req.query.fieldId;

    const events = await Event.find(filter)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate('fieldId', 'name crop location');

    return successResponse(res, { events });
  })
);

// GET /events/unread-count
router.get(
  '/unread-count',
  asyncHandler(async (req, res) => {
    const count = await Event.countDocuments({ userId: req.user._id, read: false });
    return successResponse(res, { count });
  })
);

// PATCH /events/:id/read
router.patch(
  '/:id/read',
  asyncHandler(async (req, res) => {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );
    if (!event) return errorResponse(res, 'Event not found', 404);
    return successResponse(res, { event });
  })
);

module.exports = router;
