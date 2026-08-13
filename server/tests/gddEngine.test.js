/**
 * GDD engine tests. Run with `npm test` (node:test, no extra dependency).
 *
 * The behaviour under test is the one that used to break every non-cereal
 * field check: getCropParams threw for anything but rice/wheat/maize, so a
 * cotton or coconut field errored out before the yield model was consulted.
 */
const test = require('node:test');
const assert = require('node:assert');

const gddEngine = require('../services/gddEngine');
const cropParams = require('../data/cropParams.json');

test('crop table is generated and covers the trained crops', () => {
  assert.ok(Object.keys(cropParams.crops).length >= 50);
  assert.ok(cropParams.familyDefaults.other, 'family defaults must include a catch-all');
  assert.match(cropParams._generated_by, /export_crop_params\.py/);
});

test('getCropParams resolves every listed crop exactly', () => {
  for (const crop of Object.keys(cropParams.crops)) {
    const params = gddEngine.getCropParams(crop);
    assert.strictEqual(params.resolved, 'exact', crop);
    assert.ok(params.base < params.upper, crop);
    assert.ok(params.maturityGdd > 0, crop);
  }
});

test('getCropParams never throws for an unknown crop', () => {
  const params = gddEngine.getCropParams('dragonfruit');
  assert.strictEqual(params.resolved, 'family_default');
  assert.ok(params.maturityGdd > 0);
});

test('getCropParams handles aliases and casing', () => {
  assert.strictEqual(gddEngine.canonicalCrop('Paddy'), 'rice');
  assert.strictEqual(gddEngine.canonicalCrop('  COTTON '), 'cotton(lint)');
  assert.strictEqual(gddEngine.canonicalCrop('ganna'), 'sugarcane');
  assert.strictEqual(gddEngine.getCropParams('paddy').crop, 'rice');
});

test('crop-specific thresholds actually differ', () => {
  const wheat = gddEngine.getCropParams('wheat');
  const bajra = gddEngine.getCropParams('bajra');
  assert.ok(bajra.upper > wheat.upper, 'millet must tolerate more heat than wheat');
  assert.ok(bajra.waterNeedMm < wheat.waterNeedMm);
});

test('deriveSeason maps the Indian cropping calendar', () => {
  assert.strictEqual(gddEngine.deriveSeason(new Date('2025-07-15'), 'rice'), 'Kharif');
  assert.strictEqual(gddEngine.deriveSeason(new Date('2025-11-10'), 'wheat'), 'Rabi');
  assert.strictEqual(gddEngine.deriveSeason(new Date('2025-04-01'), 'maize'), 'Summer');
});

test('deriveSeason reports perennials as Whole Year', () => {
  assert.strictEqual(gddEngine.deriveSeason(new Date('2025-07-15'), 'coconut'), 'Whole Year');
  assert.strictEqual(gddEngine.deriveSeason(new Date('2025-07-15'), 'banana'), 'Whole Year');
});

test('deriveSeason survives a missing or invalid sowing date', () => {
  assert.strictEqual(gddEngine.deriveSeason(undefined, 'rice'), 'Kharif');
  assert.strictEqual(gddEngine.deriveSeason('not-a-date', 'rice'), 'Kharif');
});

test('GDD accumulation still respects base and upper caps', () => {
  // 40C capped to upper=35 for rice, base 10 => (35+20)/2 - 10 = 17.5/day
  const days = [{ tmax: 40, tmin: 20 }];
  const { base, upper } = gddEngine.getCropParams('rice');
  assert.strictEqual(gddEngine.accumulateGdd(days, base, upper), 17.5);
});

test('GDD is never negative', () => {
  const { base, upper } = gddEngine.getCropParams('wheat');
  assert.strictEqual(gddEngine.computeDailyGdd(2, -5, base, upper), 0);
});

test('stage thresholds map GDD progress', () => {
  assert.strictEqual(gddEngine.computeStage(0.1), 'seedling');
  assert.strictEqual(gddEngine.computeStage(0.5), 'flowering');
  assert.strictEqual(gddEngine.computeStage(1.0), 'mature');
});
