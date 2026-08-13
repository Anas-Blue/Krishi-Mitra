const mongoose = require('mongoose');

const SoilSchema = new mongoose.Schema(
  {
    nitrogen: Number,
    phosphorus: Number,
    potassium: Number,
    ph: Number,
    testedOn: Date,
  },
  { _id: false }
);

const LocationSchema = new mongoose.Schema(
  {
    district: { type: String, required: true },
    state: { type: String, required: true },
    lat: { type: Number, required: true },
    lon: { type: Number, required: true },
  },
  { _id: false }
);

const CurrentStateSchema = new mongoose.Schema(
  {
    stage: {
      type: String,
      enum: ['seedling', 'vegetative', 'flowering', 'grain_filling', 'mature'],
      default: 'seedling',
    },
    cumGdd: { type: Number, default: 0 },
    gddPct: { type: Number, default: 0 },
    predictedHarvestDate: Date,
    yieldEstimate: Number,
    yieldRangeLow: Number,
    yieldRangeHigh: Number,
    stressFactor: Number,
    lastCheckedAt: Date,
  },
  { _id: false }
);

const YieldHistorySchema = new mongoose.Schema(
  {
    date: { type: Date, default: Date.now },
    estimate: Number,
    trigger: String,
  },
  { _id: false }
);

const PhotoSchema = new mongoose.Schema(
  {
    url: String,
    uploadedAt: { type: Date, default: Date.now },
    detectedCrop: String,
    detectedStage: String,
    problems: [String],
  },
  { _id: false }
);

const FieldSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Field name is required'],
      trim: true,
      maxlength: 100,
    },
    crop: {
      type: String,
      enum: ['rice', 'wheat', 'maize'],
      required: true,
    },
    variety: { type: String, trim: true },
    sowingDate: { type: Date, required: true },
    areaAcre: { type: Number, required: true, min: 0.1 },
    location: { type: LocationSchema, required: true },
    soil: { type: SoilSchema, default: () => ({}) },
    current: { type: CurrentStateSchema, default: () => ({}) },
    yieldHistory: { type: [YieldHistorySchema], default: [] },
    photos: { type: [PhotoSchema], default: [] },
    status: {
      type: String,
      enum: ['active', 'harvested'],
      default: 'active',
    },
    actualYield: Number,
  },
  { timestamps: true }
);

FieldSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model('Field', FieldSchema);
