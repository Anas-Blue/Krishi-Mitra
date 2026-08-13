/**
 * Validator tests, focused on the crop-aware yield gate.
 *
 * The old flat 0.3-12 t/ha range was a cereal range applied to every crop, so
 * it silently forced HOLD on every sugarcane, banana and coconut field.
 */
const test = require('node:test');
const assert = require('node:assert');

const { validate } = require('../services/validatorService');

const ok = (extra) => validate({ finalAction: 'APPLY', ...extra });

test('accepts a normal cereal yield', () => {
  assert.ok(ok({ crop: 'rice', yieldEstimate: 3.2 }).passed);
});

test('accepts high-yield crops that the old flat range rejected', () => {
  assert.ok(ok({ crop: 'sugarcane', yieldEstimate: 57 }).passed, 'sugarcane');
  assert.ok(ok({ crop: 'banana', yieldEstimate: 18 }).passed, 'banana');
  assert.ok(ok({ crop: 'potato', yieldEstimate: 15 }).passed, 'potato');
  assert.ok(ok({ crop: 'coconut', yieldEstimate: 8900 }).passed, 'coconut (nuts/ha)');
});

test('accepts low-yield crops the old floor rejected', () => {
  assert.ok(ok({ crop: 'cardamom', yieldEstimate: 0.1 }).passed);
});

test('still rejects genuinely impossible values', () => {
  assert.strictEqual(ok({ crop: 'rice', yieldEstimate: 500 }).passed, false);
  assert.strictEqual(ok({ crop: 'rice', yieldEstimate: 0.001 }).passed, false);
  assert.strictEqual(ok({ crop: 'cardamom', yieldEstimate: 50 }).passed, false);
});

test('names the crop and unit in the rejection reason', () => {
  const result = ok({ crop: 'coconut', yieldEstimate: 5_000_000 });
  assert.strictEqual(result.passed, false);
  assert.match(result.reason, /coconut/);
  assert.match(result.reason, /nuts\/ha/);
});

test('unknown crop falls back to a wide range rather than blocking', () => {
  assert.ok(ok({ crop: 'dragonfruit', yieldEstimate: 20 }).passed);
  assert.strictEqual(ok({ crop: 'dragonfruit', yieldEstimate: 1e6 }).passed, false);
});

test('missing yield estimate is not a failure', () => {
  assert.ok(ok({ crop: 'rice', yieldEstimate: null }).passed);
  assert.ok(ok({ crop: 'rice', yieldEstimate: undefined }).passed);
});

test('other validator rules still apply', () => {
  assert.strictEqual(validate({ crop: 'rice', dose: 100, finalAction: 'APPLY' }).passed, false);
  assert.strictEqual(validate({ crop: 'rice', cumGdd: -5, finalAction: 'APPLY' }).passed, false);
  assert.strictEqual(validate({ crop: 'rice', finalAction: 'LAUNCH_ROCKET' }).passed, false);
  assert.strictEqual(
    validate({ crop: 'rice', finalAction: 'APPLY', activeHazard: true }).passed,
    false
  );
});
