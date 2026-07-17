import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { translateRenderedText } from '../src/i18n/translations.js';

const samples = [
  ['你们将在欧冠迎战：Arsenal（对手技战术：7）。', 'Champions League Opponent: Arsenal (Opponent Tactical Level: 7).'],
  ['你们将在欧冠迎战：阿森纳。', 'Champions League Opponent: Arsenal.'],
  ['欧冠淘汰赛：十六强', 'Champions League Knockout: Round of 16'],
  ['抽签球缓缓打开——你们将迎战：阿森纳。', 'The Ball Opens—You Will Face Arsenal.'],
  ['阿森纳在常规时间内以两球领先结束了比赛，切尔西的球员颓丧地坐在地上。', 'Arsenal Finish Two Goals Ahead in Regulation; Chelsea’s Players Sit Dejected.'],
  ['点球大战！阿森纳与切尔西鏖战到最后一刻！双方都不想输掉这场比赛，但最后，阿森纳取得了胜利。', 'Penalty Shootout! Arsenal and Chelsea Fight to the End, but Arsenal Prevail.']
];

for (const [source, expected] of samples) {
  const translated = translateRenderedText(source);
  assert.equal(translated, expected);
  assert.doesNotMatch(translated, /[\u3400-\u9fff]/);
}

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
  const [{ LanguageProvider }, { GameContext }, { default: EventCard }] = await Promise.all([
    server.ssrLoadModule('/src/i18n/LanguageContext.jsx'),
    server.ssrLoadModule('/src/context/GameContextInstance.js'),
    server.ssrLoadModule('/src/components/EventCard.jsx')
  ]);
  const currentEvent = {
    id: 'ucl_r16',
    title: '欧冠淘汰赛：十六强',
    description: '你们将在欧冠迎战：Arsenal（对手技战术：7）。',
    options: [{ text: '开球', effects: {}, uclAction: 'UCL_MATCH' }]
  };

  function render(language) {
    storage.set('gsm_language_v1', language);
    const state = {
      currentEvent,
      activeDecisionsTaken: [],
      currentTeam: { id: 'chelsea', name: '切尔西' },
      specialMechanicState: {},
      uclTeams16: [],
      uclDrawCandidates: [],
      decisionPoints: 0,
      playerName: '111',
      coachingPhilosophy: '控球'
    };
    return renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(
          GameContext.Provider,
          { value: { state, dispatch: () => {} } },
          React.createElement(EventCard)
        )
      )
    );
  }

  const englishCard = render('en');
  const chineseCard = render('zh');
  assert.match(englishCard, /Champions League Knockout: Round of 16/);
  assert.match(englishCard, /Opponent Tactical Level: 7/);
  assert.doesNotMatch(englishCard, /[\u3400-\u9fff]/);
  assert.match(chineseCard, /欧冠淘汰赛：十六强/);
  assert.match(chineseCard, /对手技战术：7/);
} finally {
  await server.close();
}

console.log('Champions League bilingual regression: passed');
