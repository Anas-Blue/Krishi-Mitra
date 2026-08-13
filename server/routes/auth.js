const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const authenticate = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const { successResponse, errorResponse } = require('../utils/response');

const router = express.Router();

const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('phone').matches(/^\d{10}$/).withMessage('Phone must be 10 digits'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').optional().isIn(['farmer', 'admin']),
  body('language').optional().isIn(['en', 'hi']),
];

// POST /auth/register
router.post(
  '/register',
  registerValidation,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return errorResponse(res, errors.array()[0].msg, 400);
    }

    const { name, phone, password, role, language, district, state } = req.body;

    const existing = await User.findOne({ phone });
    if (existing) {
      return errorResponse(res, 'Phone number already registered', 409);
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      phone,
      passwordHash,
      role: role || 'farmer',
      language: language || 'en',
      district,
      state,
    });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    return successResponse(res, { token, user: sanitizeUser(user) }, 201);
  })
);

// POST /auth/login
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) {
      return errorResponse(res, 'Phone and password required', 400);
    }

    const user = await User.findOne({ phone }).select('+passwordHash');
    if (!user) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return errorResponse(res, 'Invalid credentials', 401);
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '30d' });
    return successResponse(res, { token, user: sanitizeUser(user) });
  })
);

// GET /auth/me
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  return successResponse(res, { user: sanitizeUser(req.user) });
}));

function sanitizeUser(user) {
  const obj = user.toObject ? user.toObject() : { ...user };
  delete obj.passwordHash;
  return obj;
}

module.exports = router;
