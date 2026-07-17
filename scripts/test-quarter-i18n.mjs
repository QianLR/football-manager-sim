import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { translateRenderedText } from '../src/i18n/translations.js';

const quarters = ['一', '二', '三', '四'];
const expectedNumbers = ['1', '2', '3', '4'];
const descriptions = [
  '你以第1名和55分交出了第{quarter}个季度的答卷。高层对你的执教很满意。',
  '你以第2名和42分交出了第{quarter}个季度的答卷。很明显，管理层对这个成绩并不满意，他们要求更高的排名。即使那扇象征高层核心的大门总是对你紧闭，你也能听到会议中已有试图更换你的窃窃私语。',
  '你以第3名和38分交出了第{quarter}个季度的答卷。很明显，管理层对这个成绩并不满意，他们要求更高的排名。你出席了高层的会议，大家对俱乐部的未来展开了讨论。坐在椅子上的三小时里，你能感受到许多不怀好意的目光。'
];

quarters.forEach((quarter, index) => {
  const expectedQuarter = expectedNumbers[index];
  const translatedTitle = translateRenderedText(`第${quarter}个季度答卷`);
  assert.equal(translatedTitle, `Quarter ${expectedQuarter} Review`);
  assert.doesNotMatch(translatedTitle, /[\u3400-\u9fff]/);

  descriptions.forEach((template, descriptionIndex) => {
    const translated = translateRenderedText(template.replace('{quarter}', quarter));
    assert.match(translated, new RegExp(`Quarter ${expectedQuarter}`));
    assert.match(translated, new RegExp(`${descriptionIndex + 1}(?:st|nd|rd) Place`));
    assert.doesNotMatch(translated, /[\u3400-\u9fff]/);
  });
});

assert.equal(translateRenderedText('第二季度'), 'Quarter 2');
assert.equal(translateRenderedText('第三个月'), 'Month 3');
assert.equal(translateRenderedText('第四年'), 'Year 4');

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
    id: 'quarter_expectation_report',
    title: '第二个季度答卷',
    description: '你以第1名和55分交出了第二个季度的答卷。高层对你的执教很满意。',
    options: [{ text: '确定', effects: {} }]
  };

  function render(language) {
    storage.set('gsm_language_v1', language);
    const state = {
      currentEvent,
      activeDecisionsTaken: [],
      currentTeam: { id: 'arsenal', name: '阿森纳' },
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
  assert.match(englishCard, /Quarter 2 Review/);
  assert.match(englishCard, /Quarter 2 in 1st Place with 55 Points/);
  assert.doesNotMatch(englishCard, /Quarter 二|季度答卷/);
  assert.match(chineseCard, /第二个季度答卷/);
  assert.match(chineseCard, /第1名和55分/);
} finally {
  await server.close();
}

console.log('Quarter bilingual regression: passed');
