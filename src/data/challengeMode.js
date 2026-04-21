export const CHALLENGE_MODE_TEAM = {
  id: 'spain_world_cup',
  name: '西班牙',
  shortName: '西班牙',
  description: '世界杯挑战模式：率领西班牙从四场友谊赛一路打进世界杯正赛。',
  initialStats: {
    dressingRoom: 70,
    authority: 70,
    mediaSupport: 60,
    fatigue: 0,
    points: 0,
    tactics: 8
  }
};

export const CHALLENGE_MODE_DECISIONS = [
  {
    id: 'management_spy',
    title: '安插眼线，严格规范球员私生活',
    type: 'management',
    description: '作为一个严苛的主教练，你必须让球员们知道，在【国家名】国家队的训练基地里，墙上的每项规定后面，都有一些双面胶。',
    effects: { dressingRoom: -5, authority: 5, mediaSupport: 5 }
  },
  {
    id: 'management_party',
    title: '与球员们一同参加聚会，喝无酒精饮料',
    type: 'management',
    description: '你当然说了不准喝可乐，但是有谁会听呢？你只能说服自己，至少你盯着他们，他们还不敢喝酒。',
    effects: { dressingRoom: 10, authority: -5, negativeNews: 1 }
  },
  {
    id: 'management_relaxed',
    title: '每天乐呵呵地上班，毫不约束球员',
    type: 'management',
    description: '从苦难和高压下走出来的你崇尚快乐教育，于是你选择了给球员们最大限度的自由。很可惜，这个世界上的绝大多数人并不能理解这一点。',
    effects: { authority: -5, mediaSupport: -5 }
  },
  {
    id: 'training_hard',
    title: '大幅增加训练量',
    type: 'training',
    description: '你拉高了训练强度，希望尽快把球队的技战术咬合到一起。',
    effects: { tactics: 1, fatigue: 3, authority: 5 }
  },
  {
    id: 'training_orange',
    title: '在训练时和大家一起坐在草地上剥橘子',
    type: 'training',
    description: '训练场边的气氛突然柔和下来，球员们难得地笑了。',
    effects: { dressingRoom: 5 }
  },
  {
    id: 'training_secret',
    title: '进行保密训练，拒绝一切消息外传',
    type: 'training',
    description: '训练场大门紧闭，所有消息都被挡在了外面。',
    effects: { tactics: 0.5, mediaSupport: -5 }
  },
  {
    id: 'rest_day_off',
    title: '给球员放假一天',
    type: 'recovery',
    description: '你决定让大家离开基地一天，好把身体和脑子都放松下来。',
    effects: { mediaSupport: -5, fatigue: -5 }
  },
  {
    id: 'find_mole',
    title: '在更衣室抓内鬼',
    type: 'mole',
    description: '你决定亲自清查更衣室里那些若有若无的风声。',
    effects: { dressingRoom: -10, authority: 10 }
  },
  {
    id: 'legend_speech',
    title: '找名宿鼓舞士气',
    type: 'legend',
    description: '随机邀请一位名宿来到训练基地演讲。正式开赛前可用，且不会重复。',
    effects: {},
    onlyBeforeOfficial: true,
    special: 'legend_speech'
  }
];

export const CHALLENGE_FRIENDLY_OPPONENTS = [
  { id: 'netherlands', name: '荷兰', tactics: 8.5, tier: '强队' },
  { id: 'germany_friendly', name: '德国', tactics: 8.5, tier: '强队' },
  { id: 'england', name: '英格兰', tactics: 8.5, tier: '强队' },
  { id: 'switzerland', name: '瑞士', tactics: 7.5, tier: '中等队伍' },
  { id: 'belgium', name: '比利时', tactics: 7.5, tier: '中等队伍' },
  { id: 'poland', name: '波兰', tactics: 7.5, tier: '中等队伍' },
  { id: 'bosnia', name: '波黑', tactics: 6.5, tier: '弱队' },
  { id: 'sweden', name: '瑞典', tactics: 6.5, tier: '弱队' },
  { id: 'north_macedonia', name: '北马其顿', tactics: 6.5, tier: '弱队' }
];

export const CHALLENGE_LEGENDS = [
  { id: 'torres', name: '托雷斯', effects: { dressingRoom: 5 } },
  { id: 'guti', name: '古蒂', effects: { dressingRoom: 5 } },
  { id: 'xavi', name: '哈维', effects: { tactics: 0.5 } },
  { id: 'casillas', name: '卡西利亚斯', effects: { mediaSupport: 5 } },
  { id: 'pique', name: '皮克', effects: { mediaSupport: 5 } },
  { id: 'bonmati', name: '邦马蒂', effects: { tactics: 0.5 } }
];

export const CHALLENGE_GROUP_TEAMS = [
  { id: 'spain_world_cup', name: '西班牙', tactics: 8 },
  { id: 'germany', name: '德国', tactics: 8.4 },
  { id: 'japan', name: '日本', tactics: 7.6 },
  { id: 'costa_rica', name: '哥斯达黎加', tactics: 6.3 }
];

export const CHALLENGE_GROUP_FIXTURES = [
  {
    round: 1,
    opponentId: 'costa_rica',
    otherFixture: { homeId: 'germany', awayId: 'japan' }
  },
  {
    round: 2,
    opponentId: 'germany',
    otherFixture: { homeId: 'japan', awayId: 'costa_rica' }
  },
  {
    round: 3,
    opponentId: 'japan',
    otherFixture: { homeId: 'costa_rica', awayId: 'germany' }
  }
];

export const CHALLENGE_KNOCKOUT_PATHS = {
  first: [
    { id: 'r16', label: '世界杯十六强', opponent: { id: 'morocco', name: '摩洛哥', tactics: 7.8 } },
    { id: 'qf', label: '世界杯八强', opponent: { id: 'portugal', name: '葡萄牙', tactics: 8.5 } },
    { id: 'sf', label: '世界杯四强', opponent: { id: 'argentina', name: '阿根廷', tactics: 9.2 } },
    { id: 'final', label: '世界杯决赛', opponent: { id: 'france', name: '法国', tactics: 9.4 } }
  ],
  second: [
    { id: 'r16', label: '世界杯十六强', opponent: { id: 'croatia', name: '克罗地亚', tactics: 8.2 } },
    { id: 'qf', label: '世界杯八强', opponent: { id: 'brazil', name: '巴西', tactics: 9.3 } },
    { id: 'sf', label: '世界杯四强', opponent: { id: 'argentina', name: '阿根廷', tactics: 9.2 } },
    { id: 'final', label: '世界杯决赛', opponent: { id: 'france', name: '法国', tactics: 9.4 } }
  ]
};
