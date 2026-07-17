import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';

const storage = new Map();
globalThis.window = {
  localStorage: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value))
  }
};

const server = await createServer({
  appType: 'custom',
  logLevel: 'silent',
  server: { middlewareMode: true }
});

try {
  const [{ LanguageProvider }, { GameContext }, { default: ChallengeEventCard }, { default: ChallengeDashboard }, translations] = await Promise.all([
    server.ssrLoadModule('/src/i18n/LanguageContext.jsx'),
    server.ssrLoadModule('/src/context/GameContextInstance.js'),
    server.ssrLoadModule('/src/components/ChallengeEventCard.jsx'),
    server.ssrLoadModule('/src/components/ChallengeDashboard.jsx'),
    server.ssrLoadModule('/src/i18n/translations.js')
  ]);

  const resultEvent = {
    id: 'challenge_result',
    title: '友谊赛失利',
    description: '你与比利时完成了一场友谊赛。比分：1 - 3。结果：负。输球之后，更衣室有些垂头丧气，媒体也开始不太看好你。友谊赛输球让媒体找到了新的切入口，负面新闻增加了。',
    effectsPreview: { dressingRoom: -5, mediaSupport: -5, authority: -5, fatigue: 5 },
    options: [{ text: '继续', effects: {} }]
  };

  const baseChallenge = {
    phase: 'friendlies',
    friendlyMatchesPlayed: 2,
    matchCounter: 2,
    friendlyHistory: [],
    negativeNews: [{ id: 'news_1' }],
    complaintLetters: 1,
    complaintLetterHistory: []
  };

  function render(language, Component, extraState = {}) {
    storage.set('gsm_language_v1', language);
    const state = {
      selectedGameMode: 'challenge',
      currentTeam: { name: '西班牙' },
      playerName: '111',
      currentEvent: null,
      activeDecisionsTaken: [],
      decisionCountThisMonth: 0,
      challenge: baseChallenge,
      stats: { dressingRoom: 70, authority: 65, mediaSupport: 55, fatigue: 8, tactics: 9.5, points: 0 },
      ...extraState
    };
    return renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(
          GameContext.Provider,
          { value: { state, dispatch: () => {} } },
          React.createElement(Component)
        )
      )
    );
  }

  const englishResult = render('en', ChallengeEventCard, { currentEvent: resultEvent });
  const chineseResult = render('zh', ChallengeEventCard, { currentEvent: resultEvent });
  const englishDashboard = render('en', ChallengeDashboard);
  const chineseDashboard = render('zh', ChallengeDashboard);
  const translatedDescription = translations.translateRenderedText(resultEvent.description);
  const challengeResultSamples = [
    '你没能带领西班牙从小组出线。最后一场比分：1 - 2。最终排名：第4。输球之后，更衣室有些垂头丧气，媒体也开始不太看好你。友谊赛输球让媒体找到了新的切入口，负面新闻增加了。',
    '西班牙对阵乌拉圭的比分为：1 - 2，结果为：负。目前小组排名第3。输球之后，更衣室有些垂头丧气，媒体也开始不太看好你。',
    '西班牙以2 - 1击败德国，继续朝世界杯冠军前进。赢球让更衣室和媒体都更加坚定地站在了你这边。',
    '西班牙以0 - 2输给法国，最终获得世界杯第四名。输球之后，更衣室有些垂头丧气，媒体也开始不太看好你。',
    '西班牙以0 - 1没能跨过德国这一关，世界杯征程结束了。输球之后，更衣室有些垂头丧气，媒体也开始不太看好你。',
    '常规时间双方战成1 - 1，比赛进入点球大战。西班牙在点球大战中以4 - 3击败德国，继续朝世界杯冠军前进。赢球让更衣室和媒体都更加坚定地站在了你这边。',
    '常规时间双方战成1 - 1，比赛进入点球大战。西班牙在点球大战中以3 - 4不敌法国，最终获得世界杯亚军。更衣室里很安静，没人愿意第一个摘下脖子上的银牌。',
    '西班牙以2 - 1击败德国，赢下了三四名决赛。赢球让更衣室和媒体都更加坚定地站在了你这边。'
  ];

  assert.match(englishResult, /FRIENDLY LOSS/i);
  assert.doesNotMatch(englishResult, /FRIENDLYLOST/i);
  assert.match(englishResult, /Result: Loss/);
  assert.match(englishResult, /A Friendly Defeat Gives the Media a New Angle/);
  assert.doesNotMatch(englishResult, /[\u3400-\u9fff]/);
  assert.match(chineseResult, /友谊赛失利/);
  assert.match(chineseResult, /结果：负/);
  assert.doesNotMatch(chineseResult, /Friendly against|Result: Loss/);

  assert.match(englishDashboard, /SPAIN \| MANAGER:111/i);
  assert.match(englishDashboard, />STATUS</i);
  assert.match(englishDashboard, />EXPAND</i);
  assert.doesNotMatch(englishDashboard, /[\u3400-\u9fff]/);
  assert.match(chineseDashboard, /西班牙 \| 主帅：111/);
  assert.match(chineseDashboard, />状态</);
  assert.match(chineseDashboard, />展开</);

  assert.match(translatedDescription, /Result: Loss/);
  assert.match(translatedDescription, /After Defeat, the Dressing Room Is Dejected/);
  assert.match(translatedDescription, /A Friendly Defeat Gives the Media a New Angle/);
  assert.doesNotMatch(translatedDescription, /[\u3400-\u9fff]/);
  for (const sample of challengeResultSamples) {
    assert.doesNotMatch(translations.translateRenderedText(sample), /[\u3400-\u9fff]/);
  }

  console.log('Challenge mode bilingual regression: passed');
} finally {
  await server.close();
}
