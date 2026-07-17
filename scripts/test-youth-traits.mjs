import assert from 'node:assert/strict';
import { repairYouthTraits, YOUTH_TRAIT_ID_SETS } from '../src/utils/youthTraitRepair.js';
import { translateRenderedText } from '../src/i18n/translations.js';

const legacyPlayer = {
  id: 'legacy-youth-17',
  name: '',
  positiveTraitId: null,
  negativeTraitId: null,
  specialTraitId: null
};
const repairedOnce = repairYouthTraits(legacyPlayer);
const repairedTwice = repairYouthTraits(legacyPlayer);

assert.ok(YOUTH_TRAIT_ID_SETS.positive.includes(repairedOnce.positiveTraitId));
assert.ok(YOUTH_TRAIT_ID_SETS.negative.includes(repairedOnce.negativeTraitId));
assert.equal(repairedOnce.specialTraitId, null);
assert.deepEqual(repairedOnce, repairedTwice);

const existingPlayer = {
  id: 'existing-youth',
  positiveTraitId: 'loyal',
  negativeTraitId: 'ambitious',
  specialTraitId: null
};
assert.equal(repairYouthTraits(existingPlayer), existingPlayer);

const specialPlayer = {
  id: 'special-youth',
  positiveTraitId: 'calm',
  negativeTraitId: null,
  specialTraitId: 'eco_guardian'
};
assert.equal(repairYouthTraits(specialPlayer), specialPlayer);

const damagedPlayer = repairYouthTraits({
  id: 'damaged-youth',
  positiveTraitId: 'missing_positive',
  negativeTraitId: 'missing_negative',
  specialTraitId: 'missing_special'
});
assert.ok(YOUTH_TRAIT_ID_SETS.positive.includes(damagedPlayer.positiveTraitId));
assert.ok(YOUTH_TRAIT_ID_SETS.negative.includes(damagedPlayer.negativeTraitId));
assert.equal(damagedPlayer.specialTraitId, null);

for (const [chinese, english] of [
  ['冷静的', 'Calm'],
  ['忠诚的', 'Loyal'],
  ['野心家', 'Ambitious'],
  ['内鬼', 'Mole'],
  ['环保卫士', 'Eco Guardian']
]) {
  assert.equal(translateRenderedText(chinese), english);
}

console.log('Youth trait repair regression: passed');
