const POSITIVE_TRAIT_IDS = ['calm', 'passionate', 'stable', 'loyal', 'multilingual', 'manage_up'];
const NEGATIVE_TRAIT_IDS = ['party_star', 'ambitious', 'flirtatious', 'mixer', 'canteen_legend', 'mole'];
const SPECIAL_TRAIT_IDS = ['eco_guardian'];

function isKnownTrait(value, ids) {
  return typeof value === 'string' && ids.includes(value);
}

function stableIndex(seed, salt, length) {
  const text = `${salt}:${seed || 'legacy_youth_player'}`;
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % length;
}

function stableTrait(ids, seed, salt) {
  return ids[stableIndex(seed, salt, ids.length)];
}

export function repairYouthTraits(player) {
  if (!player || typeof player !== 'object') return player;
  const seed = String(player.id || player.name || 'legacy_youth_player');
  const positiveTraitId = isKnownTrait(player.positiveTraitId, POSITIVE_TRAIT_IDS)
    ? player.positiveTraitId
    : stableTrait(POSITIVE_TRAIT_IDS, seed, 'positive');
  const specialTraitId = isKnownTrait(player.specialTraitId, SPECIAL_TRAIT_IDS)
    ? player.specialTraitId
    : null;
  const negativeTraitId = isKnownTrait(player.negativeTraitId, NEGATIVE_TRAIT_IDS)
    ? player.negativeTraitId
    : specialTraitId
      ? null
      : stableTrait(NEGATIVE_TRAIT_IDS, seed, 'negative');

  if (
    positiveTraitId === player.positiveTraitId
    && negativeTraitId === player.negativeTraitId
    && specialTraitId === player.specialTraitId
  ) {
    return player;
  }

  return {
    ...player,
    positiveTraitId,
    negativeTraitId,
    specialTraitId
  };
}

export const YOUTH_TRAIT_ID_SETS = {
  positive: POSITIVE_TRAIT_IDS,
  negative: NEGATIVE_TRAIT_IDS,
  special: SPECIAL_TRAIT_IDS
};
