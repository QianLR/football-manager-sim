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
  const [{ LanguageProvider }, { GameContext }, { default: ChallengeEventCard }, challengeData, complaintI18n] = await Promise.all([
    server.ssrLoadModule('/src/i18n/LanguageContext.jsx'),
    server.ssrLoadModule('/src/context/GameContextInstance.js'),
    server.ssrLoadModule('/src/components/ChallengeEventCard.jsx'),
    server.ssrLoadModule('/src/data/challengeMode.js'),
    server.ssrLoadModule('/src/i18n/complaintLetters.js')
  ]);

  const arsenalLetter = challengeData.CHALLENGE_COMPLAINT_LETTERS.find(letter => letter.id === 'arsenal_letter_1');
  const noticeEvent = {
    id: 'challenge_complaint_notice',
    title: '投诉信',
    description: '您收到一封投诉信。',
    options: [{ text: '点击打开', effects: {} }]
  };
  const letterEvent = {
    id: 'challenge_complaint_arsenal_letter_1',
    letterId: 'arsenal_letter_1',
    title: arsenalLetter.title,
    description: arsenalLetter.description.replaceAll('[名字]', 'Xabi Alonso'),
    options: [{ text: '继续', effects: { mediaSupport: -10 } }]
  };

  function render(language, currentEvent) {
    storage.set('gsm_language_v1', language);
    const state = {
      selectedGameMode: 'challenge',
      currentEvent,
      activeDecisionsTaken: [],
      decisionCountThisMonth: 0,
      challenge: {},
      stats: {}
    };
    return renderToStaticMarkup(
      React.createElement(
        LanguageProvider,
        null,
        React.createElement(
          GameContext.Provider,
          { value: { state, dispatch: () => {} } },
          React.createElement(ChallengeEventCard)
        )
      )
    );
  }

  const noticeEnglish = render('en', noticeEvent);
  const letterEnglish = render('en', letterEvent);
  const letterChinese = render('zh', letterEvent);
  const recoveredArchiveEnglish = complaintI18n.localizeComplaintLetter({
    letter: arsenalLetter,
    language: 'en',
    playerName: '111',
    fallbackDescription: '已损坏的旧存档正文 Player Starter Friendly'
  });

  assert.match(noticeEnglish, /You Have Received a Complaint Letter\./);
  assert.doesNotMatch(letterEnglish, /You Have Received a Complaint Letter\.|您收到一封投诉信。/);
  assert.match(letterEnglish, /Why Do Our Players Start Every Match/);
  assert.doesNotMatch(letterChinese, /You Have Received a Complaint Letter\.|Why Do Our Players Start Every Match/);
  assert.match(letterChinese, /很不高兴打扰你/);
  assert.match(recoveredArchiveEnglish.description, /Dear 111,/);
  assert.match(recoveredArchiveEnglish.description, /Why Do Our Players Start Every Match/);
  assert.doesNotMatch(recoveredArchiveEnglish.description, /已损坏|Player Starter Friendly/);

  console.log('Complaint letter bilingual regression: passed');
} finally {
  await server.close();
}
