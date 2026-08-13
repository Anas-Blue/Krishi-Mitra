/**
 * Seed script — inserts demo farmer, admin, and a demo rice field at Barabanki.
 * Idempotent: skips if demo farmer already exists.
 * Run: node seed/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const dns = require('dns');
try {
  dns.setServers(['8.8.8.8', '8.8.4.4']);
} catch (_) {}
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const Field = require('../models/Field');
const { runFieldCheck } = require('../services/fieldCheckService');

const DEMO_FARMER = {
  name: 'Ram Prasad',
  phone: '9999999999',
  password: 'demo1234',
  role: 'farmer',
  language: 'hi',
  district: 'Barabanki',
  state: 'Uttar Pradesh',
};

const DEMO_ADMIN = {
  name: 'KVK Officer',
  phone: '8888888888',
  password: 'admin1234',
  role: 'admin',
  language: 'en',
  district: 'Lucknow',
  state: 'Uttar Pradesh',
};

// Demo field: Rice, Barabanki, sown 2 July (PRD §18)
const DEMO_FIELD = {
  name: 'Barabanki Rice Field',
  crop: 'rice',
  variety: 'Swarna',
  sowingDate: new Date('2025-07-02'),
  areaAcre: 2.5,
  location: {
    district: 'Barabanki',
    state: 'Uttar Pradesh',
    lat: 26.9255,
    lon: 81.2045,
  },
  soil: {
    nitrogen: 120,
    phosphorus: 45,
    potassium: 200,
    ph: 6.8,
    testedOn: new Date('2025-05-15'),
  },
};

async function seed() {
  const MONGO_URI = process.env.MONGO_URI;
  if (!MONGO_URI) {
    console.error('ERROR: MONGO_URI not set. Copy .env.example to .env and fill it in.');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('Connected to MongoDB');

  // Farmer
  let farmer = await User.findOne({ phone: DEMO_FARMER.phone });
  if (!farmer) {
    const passwordHash = await bcrypt.hash(DEMO_FARMER.password, 12);
    farmer = await User.create({ ...DEMO_FARMER, passwordHash });
    console.log(`Created demo farmer: ${farmer.phone}`);
  } else {
    console.log(`Demo farmer already exists: ${farmer.phone}`);
  }

  // Admin
  let admin = await User.findOne({ phone: DEMO_ADMIN.phone });
  if (!admin) {
    const passwordHash = await bcrypt.hash(DEMO_ADMIN.password, 12);
    admin = await User.create({ ...DEMO_ADMIN, passwordHash });
    console.log(`Created demo admin: ${admin.phone}`);
  } else {
    console.log(`Demo admin already exists: ${admin.phone}`);
  }

  // Demo field
  let field = await Field.findOne({ userId: farmer._id, name: DEMO_FIELD.name });
  if (!field) {
    field = await Field.create({ ...DEMO_FIELD, userId: farmer._id });
    console.log(`Created demo field: ${field.name}`);

    console.log('Running initial field check (may take a moment)...');
    try {
      const result = await runFieldCheck(field._id);
      console.log(`Initial check done. Stage: ${result.stage}, GDD: ${result.cumGdd}`);
    } catch (err) {
      console.warn(`Initial check failed (will retry on next scheduled run): ${err.message}`);
    }
  } else {
    console.log(`Demo field already exists: ${field.name}`);
  }

  await mongoose.disconnect();
  console.log('\nSeed complete!');
  console.log('Demo farmer → phone: 9999999999  password: demo1234');
  console.log('Demo admin  → phone: 8888888888  password: admin1234');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
