export const ACHIEVEMENTS = [
  {
    id: 'rm_5_years',
    title: '世间五彩，我执纯白',
    hint: '您已执教皇家马德里超过五个赛季，这是一项不凡的成绩。'
  },
  {
    id: 'ac_milan_5_years',
    title: '挖野菜，不是形容你的吧？',
    hint: '您已执教AC米兰超过五个赛季，开销不大，创造神话。'
  },
  {
    id: 'dortmund_5_years',
    title: '很高兴你也喜欢EMMA并有自己的见解！',
    hint: '您已执教多特蒙德超过五个赛季。'
  },
  {
    id: 'chelsea_5_years',
    title: '英超名菜终结者',
    hint: '您已执教切尔西超过五个赛季，终结了该球队炒教练的历史！'
  },
  {
    id: 'mourinho_arsenal',
    title: '知难而上，你先别问难从哪里来',
    hint: '使用“穆里尼奥”的名字在阿森纳任职。'
  },
  {
    id: 'arsenal_5_years',
    title: '北伦敦的天空是红色的',
    hint: '您已执教阿森纳超过五个赛季。'
  },
  {
    id: 'manutd_5_years',
    title: '红魔曼曼复兴路',
    hint: '您已执教曼联超过五个赛季，且没有被下课。'
  },
  {
    id: 'gerrard_manutd',
    title: '最速下课传说',
    hint: '使用“杰拉德”的名字在曼联任职。'
  },
  {
    id: 'alonso_manutd_fired',
    title: '比爱更深的是恨',
    hint: '也许下次，在你执教水平不精的时候，换个不那么红魔的俱乐部试试。'
  },
  {
    id: 'alonso_letter_accept',
    title: 'My hero. My mate.',
    hint: '获得杰拉德的来信并前往利物浦执教。'
  },
  {
    id: 'alonso_letter_reject',
    title: '昔时已是来时路',
    hint: '你没有选择回头。'
  },
  {
    id: 'arteta_ex_husband',
    title: '前夫哥，救一下',
    hint: '触发“你的前夫很关心你”事件'
  },
  {
    id: 'ucl_champion',
    title: '你站在欧洲之巅。',
    hint: '带领球队，获得欧冠冠军。'
  },
  {
    id: 'double_crown',
    title: '被欢呼与被铭记的',
    hint: '带领球队，在同一赛季中取得双冠王'
  }
];

export const ACHIEVEMENT_MAP = ACHIEVEMENTS.reduce((acc, a) => {
  acc[a.id] = a;
  return acc;
}, {});

export function getAchievementDef(id) {
  return ACHIEVEMENT_MAP[id] || null;
}
