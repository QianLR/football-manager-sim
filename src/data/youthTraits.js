export const YOUTH_POSITIVE_TRAITS = [
  { id: 'calm', label: '冷静的' },
  { id: 'passionate', label: '热情的' },
  { id: 'stable', label: '稳定的' },
  { id: 'loyal', label: '忠诚的' },
  { id: 'multilingual', label: '多语言的' },
  { id: 'manage_up', label: '向上管理的' }
];

export const YOUTH_NEGATIVE_TRAITS = [
  { id: 'party_star', label: '派对之星' },
  { id: 'ambitious', label: '野心家' },
  { id: 'flirtatious', label: '多情种' },
  { id: 'mixer', label: '串子' },
  { id: 'canteen_legend', label: '食堂传奇' },
  { id: 'mole', label: '内鬼' }
];

export const YOUTH_SPECIAL_TRAITS = [
  { id: 'eco_guardian', label: '环保卫士' }
];

export const YOUTH_TRAIT_EFFECT_TEXT = {
  calm: '如果你下课，将触发一次保护。如果是数值清零下课：管理层支持/更衣室稳定+20。如果是降级下课：不触发降级，留任。',
  passionate: '每月额外提升2球队资金。',
  stable: '当技战术水平因为随机事件被削减时，有50%的概率抵消这次削减。',
  loyal: '如果你给他队长袖标，他的勤恳会每赛季自动提升2点。',
  multilingual: '每月额外提升2媒体支持。',
  manage_up: '每月额外提升2管理层支持。',
  party_star: '伤病风险每季度额外增加1。',
  ambitious: '被按板凳时不能提升能力。',
  flirtatious: '每次调情额外增加1小报消息。',
  mixer: '每月结束后，额外触发一个随机事件。',
  canteen_legend: '每季度额外消耗5球队资金。',
  mole: '内鬼：每季度自动触发一次“在更衣室抓内鬼”事件，如果被抓到，则-20更衣室稳定度。抓到后则不再触发。）',
  eco_guardian: '每个赛季有一个季度会失踪；不会影响欧冠比赛。'
};
