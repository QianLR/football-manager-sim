import React, { useEffect, useMemo, useRef, useState } from 'react';

const MATCH_SEGMENTS = [
  { id: 'first_01', label: '上上半场', kind: 'play', half: 1, move: 1, ball: { x: 30, y: 50 }, arrow: '→', note: '比赛刚刚开始，双方还在试探。' },
  { id: 'first_02', label: '上上半场', kind: 'play', half: 1, move: 2, ball: { x: 38, y: 42 }, arrow: '↗', note: '西班牙把球推到右侧肋部。' },
  { id: 'first_03', label: '上上半场', kind: 'play', half: 1, move: 3, ball: { x: 46, y: 34 }, arrow: '↘', note: '对手回收，中路出现一点空间。' },
  { id: 'first_04', label: '上上半场', kind: 'play', half: 1, move: 4, ball: { x: 55, y: 45 }, arrow: '→', note: '球越过中线，双方阵型开始拉扯。' },
  { id: 'first_05', label: '上上半场', kind: 'play', half: 1, move: 5, ball: { x: 63, y: 58 }, arrow: '↙', note: '一次传递被迫转向，边路球员开始回撤。' },
  { id: 'first_cooling', label: '补水时间', kind: 'pause', ball: { x: 47, y: 36 }, arrow: '→', note: '上半场第一次补水，球员们围到场边看着你。' },
  { id: 'first_06', label: '上下半场 + 补时', kind: 'play', half: 1, move: 6, ball: { x: 58, y: 64 }, arrow: '↖', note: '补水后节奏重新提起，球被拉回中路。' },
  { id: 'first_07', label: '上下半场 + 补时', kind: 'play', half: 1, move: 7, ball: { x: 49, y: 52 }, arrow: '↗', note: '球员们穿插跑动，试图把对手防线拽开。' },
  { id: 'first_08', label: '上下半场 + 补时', kind: 'play', half: 1, move: 8, ball: { x: 61, y: 39 }, arrow: '↘', note: '一次直塞的路线被提前看穿。' },
  { id: 'first_09', label: '上下半场 + 补时', kind: 'play', half: 1, move: 9, ball: { x: 70, y: 48 }, arrow: '↗', note: '最后几分钟，球被送到更靠近禁区的位置。' },
  { id: 'first_10', label: '上下半场 + 补时', kind: 'play', half: 1, move: 10, ball: { x: 76, y: 36 }, arrow: '↙', note: '上半场补时，机会在边路一闪而过。' },
  { id: 'halftime', label: '中场休息', kind: 'pause', ball: { x: 50, y: 50 }, arrow: '•', note: '中场哨响，你有一点时间重新布置。' },
  { id: 'second_01', label: '下上半场', kind: 'play', half: 2, move: 1, ball: { x: 69, y: 52 }, arrow: '←', note: '下半场开始，对手试图先把球控制下来。' },
  { id: 'second_02', label: '下上半场', kind: 'play', half: 2, move: 2, ball: { x: 60, y: 43 }, arrow: '↙', note: '西班牙逼抢上来，球权开始摇摆。' },
  { id: 'second_03', label: '下上半场', kind: 'play', half: 2, move: 3, ball: { x: 50, y: 60 }, arrow: '↖', note: '中场区域变得拥挤，传球线路不断改变。' },
  { id: 'second_04', label: '下上半场', kind: 'play', half: 2, move: 4, ball: { x: 43, y: 47 }, arrow: '→', note: '队友从身后套上，球被重新推向前场。' },
  { id: 'second_05', label: '下上半场', kind: 'play', half: 2, move: 5, ball: { x: 54, y: 32 }, arrow: '↘', note: '一次横向转移让场面突然开阔。' },
  { id: 'second_cooling', label: '补水时间', kind: 'pause', ball: { x: 55, y: 38 }, arrow: '→', note: '第二次补水，疲惫开始写在每个人脸上。' },
  { id: 'second_06', label: '下下半场 + 补时', kind: 'play', half: 2, move: 6, ball: { x: 61, y: 44 }, arrow: '↗', note: '最后阶段，球场上的每一次移动都变得沉重。' },
  { id: 'second_07', label: '下下半场 + 补时', kind: 'play', half: 2, move: 7, ball: { x: 72, y: 35 }, arrow: '↓', note: '球被送到禁区前沿，防线正在后退。' },
  { id: 'second_08', label: '下下半场 + 补时', kind: 'play', half: 2, move: 8, ball: { x: 73, y: 56 }, arrow: '↙', note: '对手封住传中路线，球只能再次回敲。' },
  { id: 'second_09', label: '下下半场 + 补时', kind: 'play', half: 2, move: 9, ball: { x: 63, y: 64 }, arrow: '↖', note: '补时阶段，所有人都在用最后一点体力跑动。' },
  { id: 'second_10', label: '下下半场 + 补时', kind: 'play', half: 2, move: 10, ball: { x: 52, y: 49 }, arrow: '■', note: '终场前，球回到中路，哨声已经在嘴边。' },
  { id: 'final_whistle', label: '结束', kind: 'end', ball: { x: 50, y: 50 }, arrow: '■', note: '终场哨即将响起。' }
];

const ATTACK_INSTRUCTIONS = [
  { id: 'possession', text: '传控', description: '把球留在脚下，把节奏握在手里。' },
  { id: 'high_press', text: '高位逼抢', description: '从第一分钟开始压上去，不给对手舒服出球的机会。至于我们自己的体能，先假装它不存在。' },
  { id: 'wing_flight', text: '两翼齐飞', description: '把球分到边路，让边锋和边后卫轮番冲击。世界上没有解决不了的问题，如果有，那就再传中一次。' },
  { id: 'lofted_ball', text: '起小高球', description: '不走地面，不走常规路线，把球轻轻挑到危险区域。' },
  { id: 'central_penetration', text: '中路渗透', description: '耐心地在中路寻找缝隙，用短传和跑位撕开防线。前提是大家真的知道自己该往哪里跑。' },
  { id: 'counter_attack', text: '防守反击', description: '先稳住阵型，把空间留给对手犯错。' },
  { id: 'inverted_fullbacks', text: '边后卫内收', description: '让边后卫来到中路参与组织，制造人数优势。听起来很现代，执行起来很容易让所有人同时迷路。' },
  { id: 'set_piece_raid', text: '定位球奇袭', description: '把希望寄托在角球、任意球和混乱之中。足球比赛有时不需要流畅，只需要有人在禁区里碰到一下。' }
];

const DEFENSE_INSTRUCTIONS = [
  { id: 'low_block', text: '低位防守', description: '把阵型收回来，先保护禁区。' },
  { id: 'midfield_grind', text: '中场绞杀', description: '把对抗集中在中场，不让对手轻松推进。球可能会变得很碎，但至少碎得比较均匀。' },
  { id: 'mark_core', text: '盯防核心', description: '指定球员重点照顾对方核心。只要他不舒服，对手就会不舒服；当然，被指定的人也会非常不舒服。' },
  { id: 'block_wings', text: '边路封锁', description: '限制对手从边路推进，逼他们回到中路解决问题。你相信拥堵可以制造混乱，而混乱有时会站在你这边。' },
  { id: 'offside_trap', text: '造越位', description: '让后防线大胆前提。这个战术最美的时候像艺术，最糟的时候像集体失忆。' },
  { id: 'pack_box', text: '收缩禁区', description: '把人堆到危险区域，优先处理射门和传中。' },
  { id: 'hard_tackles', text: '强硬对抗', description: '用身体接管比赛节奏。裁判的尺度会决定这到底是铁血防守，还是一场逐渐失控的犯规展览。' }
];

function getTeamInitials(name) {
  const text = String(name || '').trim();
  if (!text) return 'OPP';
  const known = {
    西班牙: 'ESP',
    荷兰: 'NED',
    德国: 'GER',
    英格兰: 'ENG',
    瑞士: 'SUI',
    比利时: 'BEL',
    波兰: 'POL',
    波黑: 'BIH',
    瑞典: 'SWE',
    北马其顿: 'MKD',
    佛得角: 'CPV',
    沙特阿拉伯: 'KSA',
    乌拉圭: 'URU',
    奥地利: 'AUT',
    阿尔及利亚: 'ALG',
    墨西哥: 'MEX',
    哥伦比亚: 'COL',
    加纳: 'GHA',
    澳大利亚: 'AUS',
    埃及: 'EGY',
    伊朗: 'IRN',
    巴拉圭: 'PAR',
    土耳其: 'TUR',
    美国: 'USA',
    加拿大: 'CAN',
    摩洛哥: 'MAR',
    克罗地亚: 'CRO',
    葡萄牙: 'POR',
    巴西: 'BRA',
    阿根廷: 'ARG',
    法国: 'FRA',
    挪威: 'NOR'
  };
  if (known[text]) return known[text];
  if (/^[A-Za-z\s]+$/.test(text)) {
    return text
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase())
      .join('') || 'OPP';
  }
  return text.slice(0, 2);
}

function getPlayerPositions(segmentIndex) {
  const t = segmentIndex % 10;
  const spainShapes = [
    [{ x: 18, y: 28 }, { x: 24, y: 52 }, { x: 18, y: 74 }, { x: 39, y: 34 }, { x: 45, y: 58 }, { x: 55, y: 46 }],
    [{ x: 22, y: 22 }, { x: 30, y: 48 }, { x: 23, y: 78 }, { x: 47, y: 31 }, { x: 53, y: 61 }, { x: 62, y: 43 }],
    [{ x: 28, y: 28 }, { x: 36, y: 55 }, { x: 31, y: 72 }, { x: 58, y: 25 }, { x: 50, y: 49 }, { x: 68, y: 66 }],
    [{ x: 31, y: 20 }, { x: 41, y: 47 }, { x: 35, y: 80 }, { x: 64, y: 35 }, { x: 55, y: 58 }, { x: 73, y: 46 }],
    [{ x: 27, y: 35 }, { x: 44, y: 40 }, { x: 34, y: 66 }, { x: 70, y: 30 }, { x: 61, y: 54 }, { x: 76, y: 68 }],
    [{ x: 21, y: 31 }, { x: 34, y: 58 }, { x: 27, y: 79 }, { x: 62, y: 39 }, { x: 50, y: 63 }, { x: 71, y: 50 }],
    [{ x: 24, y: 24 }, { x: 39, y: 52 }, { x: 26, y: 73 }, { x: 57, y: 29 }, { x: 66, y: 48 }, { x: 74, y: 61 }],
    [{ x: 30, y: 33 }, { x: 43, y: 57 }, { x: 33, y: 76 }, { x: 67, y: 37 }, { x: 58, y: 63 }, { x: 78, y: 49 }],
    [{ x: 25, y: 29 }, { x: 36, y: 50 }, { x: 29, y: 69 }, { x: 60, y: 24 }, { x: 69, y: 56 }, { x: 75, y: 39 }],
    [{ x: 20, y: 34 }, { x: 32, y: 54 }, { x: 24, y: 76 }, { x: 52, y: 36 }, { x: 61, y: 60 }, { x: 70, y: 48 }]
  ];
  const opponentShapes = [
    [{ x: 82, y: 27 }, { x: 76, y: 50 }, { x: 82, y: 73 }, { x: 65, y: 36 }, { x: 64, y: 62 }, { x: 55, y: 51 }],
    [{ x: 78, y: 22 }, { x: 70, y: 46 }, { x: 77, y: 77 }, { x: 60, y: 34 }, { x: 62, y: 60 }, { x: 52, y: 52 }],
    [{ x: 74, y: 30 }, { x: 66, y: 53 }, { x: 73, y: 72 }, { x: 57, y: 42 }, { x: 59, y: 68 }, { x: 49, y: 56 }],
    [{ x: 80, y: 34 }, { x: 69, y: 44 }, { x: 78, y: 69 }, { x: 55, y: 34 }, { x: 56, y: 62 }, { x: 47, y: 49 }],
    [{ x: 84, y: 25 }, { x: 72, y: 55 }, { x: 83, y: 78 }, { x: 59, y: 47 }, { x: 54, y: 72 }, { x: 49, y: 40 }],
    [{ x: 77, y: 30 }, { x: 69, y: 50 }, { x: 79, y: 72 }, { x: 61, y: 33 }, { x: 54, y: 55 }, { x: 48, y: 65 }],
    [{ x: 81, y: 28 }, { x: 71, y: 51 }, { x: 80, y: 75 }, { x: 58, y: 36 }, { x: 56, y: 63 }, { x: 50, y: 47 }],
    [{ x: 76, y: 24 }, { x: 68, y: 45 }, { x: 77, y: 74 }, { x: 55, y: 39 }, { x: 52, y: 67 }, { x: 46, y: 55 }],
    [{ x: 82, y: 32 }, { x: 73, y: 53 }, { x: 81, y: 70 }, { x: 60, y: 35 }, { x: 57, y: 60 }, { x: 50, y: 43 }],
    [{ x: 79, y: 26 }, { x: 70, y: 50 }, { x: 78, y: 73 }, { x: 61, y: 38 }, { x: 58, y: 64 }, { x: 51, y: 54 }]
  ];

  return {
    spain: spainShapes[t],
    opponent: opponentShapes[t]
  };
}

function WhistleIcon() {
  return (
    <svg viewBox="0 0 64 40" className="w-14 h-10" aria-hidden="true">
      <path
        d="M8 18h11l7-9h24l5 7v13l-7 6H24l-6-8H8z"
        fill="white"
        stroke="black"
        strokeWidth="4"
        strokeLinejoin="round"
      />
      <circle cx="38" cy="22" r="7" fill="white" stroke="black" strokeWidth="4" />
      <path d="M50 9h8v8" fill="none" stroke="black" strokeWidth="4" strokeLinecap="square" />
      <path d="M6 14v17" stroke="black" strokeWidth="4" strokeLinecap="square" />
    </svg>
  );
}

function getArrowStyle(arrow) {
  const angles = {
    '→': 0,
    '←': 180,
    '↑': -90,
    '↓': 90,
    '↗': -35,
    '↘': 35,
    '↙': 145,
    '↖': -145
  };
  return {
    transform: `rotate(${angles[arrow] ?? 0}deg)`,
    opacity: arrow === '■' || arrow === '•' ? 0 : 1
  };
}

function buildScoreSeed(matchResult) {
  const fixedScore = Array.isArray(matchResult?.fixedScore)
    ? [
        Math.max(0, Math.round(Number(matchResult.fixedScore[0]) || 0)),
        Math.max(0, Math.round(Number(matchResult.fixedScore[1]) || 0))
      ]
    : null;
  const openingOptions = [[0, 0], [1, 0], [0, 1]];
  const firstCoolingScore = fixedScore || openingOptions[Math.floor(Math.random() * openingOptions.length)];
  const result = matchResult?.result || 'D';
  const randomOpponentGoals = typeof matchResult?.opponentGoals === 'number'
    ? matchResult.opponentGoals
    : Math.floor(Math.random() * 3);

  return {
    result,
    fixedScore,
    firstCoolingScore,
    opponentFinalGoals: Math.max(0, Math.min(3, randomOpponentGoals))
  };
}

function getMatchResultFromScore(score) {
  const spainGoals = Number(score?.[0] || 0);
  const opponentGoals = Number(score?.[1] || 0);
  if (spainGoals > opponentGoals) return 'W';
  if (spainGoals < opponentGoals) return 'L';
  return 'D';
}

function getInstructionProfile(instructionLog) {
  const active = Array.isArray(instructionLog) ? instructionLog : [];
  const attackCount = active.filter(item => item?.mode === 'attack').length;
  const defenseCount = active.filter(item => item?.mode === 'defense').length;
  const riskyAttackCount = active.filter(item => ['high_press', 'wing_flight', 'offside_trap'].includes(item?.instructionId)).length;
  const lowRiskDefenseCount = active.filter(item => ['low_block', 'pack_box', 'midfield_grind', 'block_wings'].includes(item?.instructionId)).length;
  const setPieceCount = active.filter(item => item?.instructionId === 'set_piece_raid').length;
  const counterCount = active.filter(item => item?.instructionId === 'counter_attack').length;
  return {
    attackCount,
    defenseCount,
    riskyAttackCount,
    lowRiskDefenseCount,
    setPieceCount,
    counterCount
  };
}

function getSegmentGoalEvent({ segment, liveScore, matchResult, teamStats, instructionLog }) {
  if (!segment || segment.kind !== 'play') return null;
  if (Array.isArray(matchResult?.fixedScore)) return null;

  const playerStrength = Number.isFinite(Number(matchResult?.playerStrength))
    ? Number(matchResult.playerStrength)
    : Number(teamStats?.tactics || 0);
  const opponentStrength = Number.isFinite(Number(matchResult?.opponentStrength))
    ? Number(matchResult.opponentStrength)
    : Number(matchResult?.opponent?.tactics || 8);
  const diff = playerStrength - opponentStrength;
  const profile = getInstructionProfile(instructionLog);
  const scoreDiff = Number(liveScore?.[0] || 0) - Number(liveScore?.[1] || 0);
  const late = segment.half === 2 && segment.move >= 6;
  const veryLate = segment.half === 2 && segment.move >= 8;
  const fatigue = Number(teamStats?.fatigue || 0);
  const fatigueDrag = clampValue(fatigue / 220, 0, 0.28);
  const fatigueCollapse = clampValue(Math.max(0, fatigue - 10) / 40, 0, 0.5);
  const comebackMultiplier = 1 - Math.min(0.45, Math.max(0, fatigue - 20) / 50);

  let spainChance = 0.038 + playerStrength * 0.0048 + clampValue(diff, -4, 4) * 0.009;
  let opponentChance = 0.030 + opponentStrength * 0.0038 - clampValue(diff, -4, 4) * 0.007;

  spainChance += profile.attackCount * 0.014;
  opponentChance += profile.riskyAttackCount * 0.010;
  opponentChance -= profile.lowRiskDefenseCount * 0.012;
  spainChance -= Math.max(0, profile.defenseCount - profile.counterCount) * 0.004;
  spainChance += profile.setPieceCount * 0.010;

  spainChance *= 1 - fatigueDrag;
  opponentChance *= 1 + fatigueDrag * 0.8;

  if (scoreDiff < 0) spainChance += (late ? 0.024 : 0.014) * comebackMultiplier;
  if (scoreDiff > 0) {
    spainChance -= late ? 0.020 : 0.010;
    opponentChance += late ? 0.014 : 0.006;
  }
  if (scoreDiff >= 2) {
    spainChance -= 0.020;
    opponentChance += veryLate ? 0.014 : 0.007;
  }
  if (scoreDiff <= -1) {
    opponentChance += fatigueCollapse * 0.015;
  }
  if (scoreDiff <= -2) {
    spainChance += (veryLate ? 0.020 : 0.010) * comebackMultiplier;
    opponentChance += fatigueCollapse * 0.035;
    opponentChance -= 0.012;
  }
  if (scoreDiff <= -3) {
    opponentChance += fatigueCollapse * 0.060;
  }

  if (matchResult?.dominanceOptions?.dominance && diff > 0) {
    const opponentStrengthValue = Number(matchResult?.opponentStrength || opponentStrength);
    if (matchResult.dominanceOptions.overwhelming) {
      opponentChance *= 0.35;
    } else if (opponentStrengthValue <= 8.5) {
      opponentChance *= 0.58;
    } else {
      opponentChance *= 0.76;
    }
    spainChance += 0.006;
  }

  spainChance = clampValue(spainChance, 0.008, 0.165);
  opponentChance = clampValue(opponentChance, 0.004, 0.130);

  const totalChance = clampValue(spainChance + opponentChance, 0, 0.22);
  const r = Math.random();
  if (r >= totalChance) return null;
  return {
    team: r < spainChance ? 'spain' : 'opponent',
    segmentIndex: MATCH_SEGMENTS.findIndex(item => item.id === segment.id)
  };
}

function getScoreTargets({ scoreSeed, instructionLog, teamStats }) {
  if (scoreSeed.fixedScore) {
    return {
      firstCooling: scoreSeed.fixedScore,
      halftime: scoreSeed.fixedScore,
      secondCooling: scoreSeed.fixedScore,
      finalScore: scoreSeed.fixedScore
    };
  }

  const firstCooling = scoreSeed.firstCoolingScore || [0, 0];
  const result = scoreSeed.result || 'D';
  const opponentFinalGoals = Math.max(scoreSeed.opponentFinalGoals ?? 0, firstCooling[1]);
  const attackInstructions = instructionLog.filter(item => item.mode === 'attack').length;
  const dressingRoom = Number(teamStats?.dressingRoom ?? 0);
  const winMargin = dressingRoom >= 80 || attackInstructions >= 2 ? 2 : 1;
  const drawGoals = Math.max(opponentFinalGoals, firstCooling[0], firstCooling[1]);
  const lossOpponentGoals = Math.max(opponentFinalGoals, firstCooling[0] + 1, 1);
  const finalScore = result === 'W'
    ? [opponentFinalGoals + winMargin, opponentFinalGoals]
    : result === 'L'
      ? [Math.max(firstCooling[0], lossOpponentGoals - 1), lossOpponentGoals]
      : [drawGoals, drawGoals];
  let halftime = firstCooling;

  if (result === 'W') {
    halftime = firstCooling[0] < firstCooling[1]
      ? [firstCooling[1], firstCooling[1]]
      : [Math.max(firstCooling[0], firstCooling[1] + 1), firstCooling[1]];
  } else if (result === 'L' && firstCooling[0] > firstCooling[1]) {
    halftime = [firstCooling[0], firstCooling[0]];
  }

  return {
    firstCooling,
    halftime,
    secondCooling: finalScore,
    finalScore
  };
}

function getSegmentIndex(id) {
  return MATCH_SEGMENTS.findIndex(item => item.id === id);
}

function getPlayableIndexes(startId, endId) {
  const startIndex = getSegmentIndex(startId);
  const endIndex = getSegmentIndex(endId);
  return MATCH_SEGMENTS
    .map((item, index) => ({ item, index }))
    .filter(({ item, index }) => item.kind === 'play' && index >= startIndex && index <= endIndex)
    .map(({ index }) => index);
}

function pickGoalIndexes(playableIndexes, goalCount) {
  if (goalCount <= 0) return [];
  if (goalCount >= playableIndexes.length) return playableIndexes;
  const picked = [];
  for (let i = 0; i < goalCount; i += 1) {
    const slot = Math.round(((i + 1) * (playableIndexes.length - 1)) / (goalCount + 1));
    picked.push(playableIndexes[slot]);
  }
  return picked;
}

function buildGoalEvents({ scoreSeed, instructionLog, teamStats }) {
  const targets = getScoreTargets({ scoreSeed, instructionLog, teamStats });
  const periods = [
    { startId: 'first_01', endId: 'first_05', target: targets.firstCooling },
    { startId: 'first_06', endId: 'first_10', target: targets.halftime },
    { startId: 'second_01', endId: 'second_05', target: targets.secondCooling },
    { startId: 'second_06', endId: 'second_10', target: targets.finalScore }
  ];
  let previous = [0, 0];
  const events = [];

  periods.forEach(period => {
    const playableIndexes = getPlayableIndexes(period.startId, period.endId);
    const spainGoals = Math.max(0, period.target[0] - previous[0]);
    const opponentGoals = Math.max(0, period.target[1] - previous[1]);
    const goalTeams = [
      ...Array.from({ length: spainGoals }, () => 'spain'),
      ...Array.from({ length: opponentGoals }, () => 'opponent')
    ];
    const goalIndexes = pickGoalIndexes(playableIndexes, goalTeams.length);

    goalTeams.forEach((team, index) => {
      events.push({
        team,
        segmentIndex: goalIndexes[index] ?? playableIndexes[playableIndexes.length - 1]
      });
    });
    previous = period.target;
  });

  return events.sort((a, b) => a.segmentIndex - b.segmentIndex);
}

function getScoreState({ segmentIndex, scoreSeed, instructionLog, teamStats }) {
  const goalEvents = buildGoalEvents({ scoreSeed, instructionLog, teamStats });
  const score = [0, 0];
  let currentGoal = null;

  goalEvents.forEach(event => {
    if (event.segmentIndex <= segmentIndex) {
      if (event.team === 'spain') score[0] += 1;
      if (event.team === 'opponent') score[1] += 1;
    }
    if (event.segmentIndex === segmentIndex) {
      currentGoal = event;
    }
  });

  return {
    score,
    goal: currentGoal
  };
}

function clampValue(value, min, max) {
  const n = typeof value === 'number' ? value : 0;
  return Math.min(max, Math.max(min, n));
}

function pickPenaltyDetail(scored) {
  const options = scored
    ? [
        { outcome: 'goal', ballClass: 'left-high', text: '打向左上角，门将判断对了方向也够不到。' },
        { outcome: 'goal', ballClass: 'right-low', text: '推向右下角，球贴着草皮钻进网窝。' },
        { outcome: 'goal', ballClass: 'center', text: '一记勺子点球，门将已经倒下，只能在地上回头看球。' },
        { outcome: 'goal', ballClass: 'right-high', text: '小碎步骗过门将，随后把球抽进右上角。' },
        { outcome: 'goal', ballClass: 'left-low', text: '助跑很短，角度很刁，球从门将指尖前溜进左下角。' }
      ]
    : [
        { outcome: 'saved', ballClass: 'left-low', text: '门将判断准确，单手将球托出底线。' },
        { outcome: 'saved', ballClass: 'right-low', text: '射向右下角，门将横身扑出，把球按在草皮前。' },
        { outcome: 'saved', ballClass: 'center', text: '罚球队员想骗门将，门将没有被骗，稳稳把球抱住。' },
        { outcome: 'missed', ballClass: 'right-high', text: '追求右上角，球越过横梁，飞向看台第一排。' },
        { outcome: 'missed', ballClass: 'post', text: '球击中立柱弹出，声音清脆得让替补席一起沉默。' }
      ];
  return options[Math.floor(Math.random() * options.length)];
}

function getPenaltyBallPositionClass(kick) {
  if (!kick) return 'left-1/2 top-[252px] max-sm:top-[218px]';
  const ballClass = kick.detail?.ballClass;
  if (ballClass === 'left-high') return 'left-[38%] top-[30px]';
  if (ballClass === 'right-high') return 'left-[62%] top-[30px]';
  if (ballClass === 'left-low') return 'left-[40%] top-16';
  if (ballClass === 'right-low') return 'left-[61%] top-16';
  if (ballClass === 'center') return 'left-1/2 top-10';
  if (ballClass === 'post') return 'left-[68%] top-[42px]';
  return kick.scored ? 'left-[52%] top-[30px]' : 'left-[70%] top-[72px]';
}

function getPenaltyKickLabel(kick) {
  if (!kick) return '-';
  if (kick.scored) return 'GOAL';
  return kick.detail?.outcome === 'saved' ? 'SAVED' : 'MISS';
}

function getPenaltyDisplaySlots(kicks, shownCount) {
  const actualKicks = Array.isArray(kicks) ? kicks : [];
  const order = actualKicks[0]?.kicker === 'opponent'
    ? ['opponent', 'spain']
    : ['spain', 'opponent'];
  const extraShown = Math.max(0, shownCount - 10);
  const visibleCount = 10 + Math.ceil(extraShown / 2) * 2;

  return Array.from({ length: Math.max(10, Math.min(visibleCount, actualKicks.length + (actualKicks.length % 2))) }, (_, index) => {
    if (actualKicks[index]) return actualKicks[index];
    const round = Math.floor(index / 2) + 1;
    return {
      round,
      kicker: order[index % 2],
      placeholder: true
    };
  });
}

function shouldEndPenaltyShootout({ spainGoals, opponentGoals, round, kicker }) {
  if (round > 5 && kicker === 'opponent' && spainGoals !== opponentGoals) return true;
  if (round > 5) return false;

  const spainKicksTaken = round - (kicker === 'spain' ? 0 : 1);
  const opponentKicksTaken = round - (kicker === 'opponent' ? 0 : 1);
  const spainRemaining = 5 - spainKicksTaken;
  const opponentRemaining = 5 - opponentKicksTaken;

  return spainGoals > opponentGoals + opponentRemaining
    || opponentGoals > spainGoals + spainRemaining;
}

function buildPenaltyShootout({ spainFirst, teamStats, matchResult, setup }) {
  const opponent = matchResult?.opponent || {};
  const tacticsEdge = Number(teamStats?.tactics || 0) - Number(opponent.tactics || 8);
  const composure = ((Number(teamStats?.authority || 0) - 50) * 0.0015)
    + ((Number(teamStats?.dressingRoom || 0) - 50) * 0.001);
  const fatiguePenalty = Math.min(0.08, Number(teamStats?.fatigue || 0) * 0.0015);
  const orderBonus = spainFirst ? 0.10 : -0.005;
  const sideBonus = setup?.choice === 'side' ? 0.10 : 0;
  const spainChance = clampValue(0.74 + (tacticsEdge * 0.022) + composure - fatiguePenalty + orderBonus + sideBonus, 0.56, 0.89);
  const opponentChance = clampValue(0.74 - (tacticsEdge * 0.016) + ((Number(opponent.tactics || 8) - 8) * 0.01), 0.56, 0.89);

  let spainGoals = 0;
  let opponentGoals = 0;
  const kicks = [];
  const order = spainFirst ? ['spain', 'opponent'] : ['opponent', 'spain'];

  for (let round = 1; round <= 5; round += 1) {
    for (const kicker of order) {
      const scored = Math.random() < (kicker === 'spain' ? spainChance : opponentChance);
      const detail = pickPenaltyDetail(scored);
      if (scored && kicker === 'spain') spainGoals += 1;
      if (scored && kicker === 'opponent') opponentGoals += 1;
      kicks.push({ round, kicker, scored, detail, spainGoals, opponentGoals });
      if (shouldEndPenaltyShootout({ spainGoals, opponentGoals, round, kicker })) {
        return kicks;
      }
    }
  }

  let round = 6;
  while (spainGoals === opponentGoals && kicks.length < 20) {
    for (const kicker of order) {
      const scored = Math.random() < (kicker === 'spain' ? spainChance : opponentChance);
      const detail = pickPenaltyDetail(scored);
      if (scored && kicker === 'spain') spainGoals += 1;
      if (scored && kicker === 'opponent') opponentGoals += 1;
      kicks.push({ round, kicker, scored, detail, spainGoals, opponentGoals });
    }
    round += 1;
  }

  if (spainGoals === opponentGoals) {
    const spainWins = Math.random() < 0.5;
    for (const kicker of order) {
      const scored = kicker === 'spain' ? spainWins : !spainWins;
      const detail = pickPenaltyDetail(scored);
      if (scored && kicker === 'spain') spainGoals += 1;
      if (scored && kicker === 'opponent') opponentGoals += 1;
      kicks.push({ round, kicker, scored, detail, spainGoals, opponentGoals });
    }
  }

  return kicks;
}

function summarizePenaltyShootout(kicks) {
  const last = kicks[kicks.length - 1] || { spainGoals: 0, opponentGoals: 0 };
  return {
    won: (last.spainGoals || 0) > (last.opponentGoals || 0),
    playerGoals: last.spainGoals || 0,
    opponentGoals: last.opponentGoals || 0,
    scoreText: `${last.spainGoals || 0} - ${last.opponentGoals || 0}`
  };
}

export default function ChallengeMatchAnimation({ opponentName, stageTitle, matchResult, teamStats, onFinish }) {
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [showWhistle, setShowWhistle] = useState(true);
  const [instructionLog, setInstructionLog] = useState([]);
  const [instructionMode, setInstructionMode] = useState(null);
  const [selectedInstructionId, setSelectedInstructionId] = useState(null);
  const [penaltyStage, setPenaltyStage] = useState('match');
  const [coinCanChoose, setCoinCanChoose] = useState(false);
  const [penaltySetup, setPenaltySetup] = useState(null);
  const [penaltyKicks, setPenaltyKicks] = useState([]);
  const [penaltyKickIndex, setPenaltyKickIndex] = useState(0);
  const [showSkipPenaltyConfirm, setShowSkipPenaltyConfirm] = useState(false);
  const [penaltyChoiceMode, setPenaltyChoiceMode] = useState(null);
  const [coinFlipped, setCoinFlipped] = useState(false);
  const [penaltyShootoutStarted, setPenaltyShootoutStarted] = useState(false);
  const [liveScore, setLiveScore] = useState(() => Array.isArray(matchResult?.fixedScore) ? matchResult.fixedScore : [0, 0]);
  const [goalEventsBySegment, setGoalEventsBySegment] = useState({});
  const processedGoalSegmentsRef = useRef(new Set());

  const segment = MATCH_SEGMENTS[segmentIndex] || MATCH_SEGMENTS[0];
  const progress = Math.min(100, Math.round(((segmentIndex + 1) / MATCH_SEGMENTS.length) * 100));
  const goalEvent = goalEventsBySegment[segmentIndex] || null;
  const displayBall = goalEvent
    ? { x: goalEvent.team === 'spain' ? 97 : 3, y: Math.min(72, Math.max(28, segment.ball.y)) }
    : segment.ball;
  const spainInitials = useMemo(() => getTeamInitials('西班牙'), []);
  const opponentInitials = useMemo(() => getTeamInitials(opponentName), [opponentName]);
  const playerPositions = useMemo(() => getPlayerPositions(segmentIndex), [segmentIndex]);
  const penaltyRequired = matchResult?.matchType === 'knockout'
    && segment.kind === 'end'
    && liveScore[0] === liveScore[1];

  useEffect(() => {
    const id = setTimeout(() => setShowWhistle(false), 900);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    if (segment.kind !== 'play') return;
    if (showWhistle) return;
    if (processedGoalSegmentsRef.current.has(segmentIndex)) return;
    processedGoalSegmentsRef.current.add(segmentIndex);

    const event = getSegmentGoalEvent({
      segment,
      liveScore,
      matchResult,
      teamStats,
      instructionLog
    });

    setGoalEventsBySegment(events => ({ ...events, [segmentIndex]: event }));
    if (event?.team) {
      setLiveScore(score => [
        score[0] + (event.team === 'spain' ? 1 : 0),
        score[1] + (event.team === 'opponent' ? 1 : 0)
      ]);
    }
  }, [instructionLog, liveScore, matchResult, segment, segmentIndex, showWhistle, teamStats]);

  useEffect(() => {
    if (segment.kind === 'pause') return undefined;

    if (segment.kind === 'end') {
      const id = setTimeout(() => {
        if (penaltyRequired && penaltyStage === 'match') {
          setCoinCanChoose(false);
          setCoinFlipped(false);
          setPenaltyChoiceMode(null);
          setPenaltyStage('coin');
          return;
        }
        if (penaltyStage !== 'match') return;
        onFinish && onFinish({
          score: liveScore,
          result: getMatchResultFromScore(liveScore),
          instructions: instructionLog
        });
      }, 1200);
      return () => clearTimeout(id);
    }

    const id = setTimeout(() => {
      setSegmentIndex(index => Math.min(MATCH_SEGMENTS.length - 1, index + 1));
    }, goalEvent ? 1300 : 900);
    return () => clearTimeout(id);
  }, [goalEvent?.team, liveScore[0], liveScore[1], penaltyRequired, penaltyStage, segment.id, segment.kind, onFinish]);

  useEffect(() => {
    if (penaltyStage !== 'shootout') return undefined;
    if (!penaltyShootoutStarted) return undefined;
    if (penaltyKickIndex < penaltyKicks.length) {
      const id = setTimeout(() => setPenaltyKickIndex(index => Math.min(penaltyKicks.length, index + 1)), 2300);
      return () => clearTimeout(id);
    }

    const id = setTimeout(() => {
      setPenaltyStage('complete');
      onFinish && onFinish({
        score: liveScore,
        result: getMatchResultFromScore(liveScore),
        instructions: instructionLog,
        penaltyShootout: summarizePenaltyShootout(penaltyKicks)
      });
    }, 1200);
    return () => clearTimeout(id);
  }, [instructionLog, liveScore, onFinish, penaltyKickIndex, penaltyKicks, penaltyShootoutStarted, penaltyStage]);

  useEffect(() => {
    setInstructionMode(null);
    setSelectedInstructionId(null);
  }, [segment.id]);

  const handleInstruction = (instruction, mode) => {
    setInstructionLog(prev => [
      ...prev,
      {
        segmentId: segment.id,
        instructionId: instruction.id,
        mode,
        text: `${mode === 'attack' ? '进攻' : '防守'}：${instruction.text}`
      }
    ]);
    setInstructionMode(null);
    setSelectedInstructionId(null);
    setSegmentIndex(index => Math.min(MATCH_SEGMENTS.length - 1, index + 1));
  };

  const activeInstructions = instructionMode === 'attack'
    ? ATTACK_INSTRUCTIONS
    : instructionMode === 'defense'
      ? DEFENSE_INSTRUCTIONS
      : [];
  const selectedInstruction = activeInstructions.find(item => item.id === selectedInstructionId) || null;
  const shownPenaltyKicks = penaltyKicks.slice(0, penaltyKickIndex);
  const latestPenaltyKick = shownPenaltyKicks[shownPenaltyKicks.length - 1] || null;
  const penaltyScore = latestPenaltyKick
    ? [latestPenaltyKick.spainGoals || 0, latestPenaltyKick.opponentGoals || 0]
    : [0, 0];
  const nextPenaltyKick = penaltyKicks[penaltyKickIndex] || null;
  const visiblePenaltyKicks = getPenaltyDisplaySlots(penaltyKicks, penaltyKickIndex);
  const penaltyBallPositionClass = getPenaltyBallPositionClass(latestPenaltyKick);

  const startPenaltyShootout = (setup) => {
    const kicks = buildPenaltyShootout({
      spainFirst: setup.spainFirst,
      teamStats,
      matchResult,
      setup
    });
    setPenaltySetup(setup);
    setPenaltyKicks(kicks);
    setPenaltyKickIndex(0);
    setPenaltyChoiceMode(null);
    setPenaltyShootoutStarted(false);
    setPenaltyStage('shootout');
  };

  const finishPenaltyShootoutNow = () => {
    const setup = penaltySetup || {
      choice: 'skip',
      spainFirst: Math.random() < 0.5,
      side: Math.random() < 0.5 ? '左侧球门' : '右侧球门'
    };
    const kicks = penaltyKicks.length > 0
      ? penaltyKicks
      : buildPenaltyShootout({
        spainFirst: setup.spainFirst,
        teamStats,
        matchResult,
        setup
      });

    setShowSkipPenaltyConfirm(false);
    setPenaltySetup(setup);
    setPenaltyKicks(kicks);
    setPenaltyKickIndex(kicks.length);
    setPenaltyShootoutStarted(false);
    setPenaltyStage('complete');
    onFinish && onFinish({
      score: liveScore,
      instructions: instructionLog,
      penaltyShootout: summarizePenaltyShootout(kicks)
    });
  };

  const handleOpponentCoinChoice = () => {
    const opponentChoosesOrder = Math.random() < 0.55;
    startPenaltyShootout({
      choice: opponentChoosesOrder ? 'opponent_order' : 'opponent_side',
      spainFirst: opponentChoosesOrder ? false : Math.random() < 0.5,
      side: opponentChoosesOrder ? (Math.random() < 0.5 ? '左侧球门' : '右侧球门') : '左侧球门'
    });
  };

  const handleFlipCoin = () => {
    setCoinCanChoose(Math.random() < 0.5);
    setCoinFlipped(true);
    setPenaltyChoiceMode(null);
  };

  const penaltyButtonBaseClass = 'border-2 border-black px-3 py-2 font-mono text-[13px] font-bold text-left shadow-[2px_2px_0_#111] hover:translate-x-px hover:translate-y-px hover:shadow-[1px_1px_0_#111]';
  const penaltyButtonClass = `${penaltyButtonBaseClass} bg-white text-black`;
  const penaltyPrimaryButtonClass = `${penaltyButtonBaseClass} bg-black text-white`;
  const penaltyPanelClass = 'border-2 border-black bg-[#f8f8f8] p-2.5 mt-2.5';

  if (penaltyStage !== 'match') {
    return (
      <div className="w-full max-w-[920px] border-2 border-black bg-white p-3.5 shadow-[6px_6px_0_#111] font-mono text-[#111]">
        <style>
          {`
            @keyframes penalty-coin-flip {
              0% { transform: rotateY(0deg) translateY(0); }
              50% { transform: rotateY(180deg) translateY(-16px); }
              100% { transform: rotateY(360deg) translateY(0); }
            }
          `}
        </style>
        {showSkipPenaltyConfirm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/45">
            <div className="bg-white border-2 border-black shadow-[4px_4px_0_#111] max-w-[460px] w-full p-3.5">
              <div className="font-semibold text-[15px] mb-2">跳过点球动画</div>
              <div className="text-xs leading-relaxed text-gray-800 mb-3">
                跳过动画会直接给出点球结果，你确定要捂住眼睛不看球员们的表现吗？
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={finishPenaltyShootoutNow}
                  className={penaltyPrimaryButtonClass}
                >
                  确定跳过
                </button>
                <button
                  onClick={() => setShowSkipPenaltyConfirm(false)}
                  className={penaltyButtonClass}
                >
                  继续观看
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 border-b-[3px] border-black pb-2.5 mb-3">
          <div>
            <h3 className="m-0 text-lg font-semibold leading-tight">点球大战</h3>
            <div className="text-xs leading-normal text-left">淘汰赛常规时间 {liveScore[0]}-{liveScore[1]} 后进入点球</div>
          </div>
          <div className="text-xs leading-normal sm:text-right">
            西班牙 vs {opponentName || '对手'}
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2.5 w-full max-w-[460px] mx-auto mb-3 border-2 border-black bg-black text-white p-2">
          <div className="font-bold text-center text-[13px]">{spainInitials}</div>
          <div className="bg-white text-black border-2 border-white text-[22px] font-bold leading-none px-3 py-1 min-w-[92px] text-center">
            {penaltyScore[0]} - {penaltyScore[1]}
          </div>
          <div className="font-bold text-center text-[13px]">{opponentInitials}</div>
        </div>

        {penaltyStage === 'coin' ? (
          <section className={`${penaltyPanelClass} min-h-[360px]`}>
            <div
              className="relative h-[260px] overflow-hidden border-2 border-black"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,.35) 0 2px, transparent 2px 100%), linear-gradient(#92d681, #73c66f)',
                backgroundSize: '64px 100%, 100% 100%'
              }}
            >
              <div className="absolute left-1/2 top-1/2 w-[130px] h-[130px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80" />
              {coinFlipped ? (
                <div className="absolute left-1/2 top-[18px] -translate-x-1/2 border-2 border-black bg-white px-3 py-2 text-xs font-bold whitespace-nowrap">
                  {coinCanChoose ? '硬币站在西班牙这边' : `硬币落向了${opponentName || '对手'}那边`}
                </div>
              ) : null}
              <div className="absolute left-[calc(50%-12px)] top-[calc(50%-78px)] w-6 h-6 rounded-full border-2 border-black bg-[#f3d45b] animate-[penalty-coin-flip_850ms_infinite_linear]" />
              <div className="absolute left-[calc(50%-140px)] top-[calc(50%-29px)] w-[58px] h-[58px] rounded-full border-2 border-black bg-[#df3333] text-white text-xs font-bold flex items-center justify-center">
                ESP
              </div>
              <div className="absolute left-[calc(50%-29px)] top-[calc(50%-29px)] w-[58px] h-[58px] rounded-full border-2 border-black bg-black text-white text-xs font-bold flex items-center justify-center">
                裁判
              </div>
              <div className="absolute left-[calc(50%+82px)] top-[calc(50%-29px)] w-[58px] h-[58px] rounded-full border-2 border-black bg-white text-black text-xs font-bold flex items-center justify-center">
                {opponentInitials}
              </div>
            </div>
            <div className={penaltyPanelClass}>
              <div className="text-[13px] leading-relaxed">
                {!coinFlipped
                  ? '点击抛硬币，50% 概率获得选择权。'
                  : penaltyChoiceMode === 'order'
                  ? '你选择了罚球顺序。请选择西班牙先罚还是后罚。'
                  : coinCanChoose
                    ? '硬币站在了你这边。你可以选择罚球顺序，也可以选择在哪一侧球门进行点球大战。'
                    : `硬币没有站在你这边。${opponentName || '对手'}将先做选择。`}
              </div>
              {!coinFlipped ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
                  <button onClick={handleFlipCoin} className={penaltyPrimaryButtonClass}>
                    抛硬币
                  </button>
                  <button onClick={() => setShowSkipPenaltyConfirm(true)} className={penaltyButtonClass}>
                    跳过动画
                  </button>
                </div>
              ) : coinCanChoose ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
                  {penaltyChoiceMode === 'order' ? (
                    <>
                      <button
                        onClick={() => startPenaltyShootout({ choice: 'order', spainFirst: true, side: Math.random() < 0.5 ? '左侧球门' : '右侧球门' })}
                        className={penaltyPrimaryButtonClass}
                      >
                        西班牙先罚
                      </button>
                      <button
                        onClick={() => startPenaltyShootout({ choice: 'order', spainFirst: false, side: Math.random() < 0.5 ? '左侧球门' : '右侧球门' })}
                        className={penaltyButtonClass}
                      >
                        西班牙后罚
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => setPenaltyChoiceMode('order')}
                        className={penaltyButtonClass}
                      >
                        挑罚球顺序
                      </button>
                      <button
                        onClick={() => startPenaltyShootout({ choice: 'side', spainFirst: Math.random() < 0.5, side: '左侧球门' })}
                        className={penaltyButtonClass}
                      >
                        挑边：使用左侧球门
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
                  <button onClick={handleOpponentCoinChoice} className={penaltyPrimaryButtonClass}>
                    接受对方选择
                  </button>
                  <button onClick={() => setShowSkipPenaltyConfirm(true)} className={penaltyButtonClass}>
                    跳过动画
                  </button>
                </div>
              )}
              {coinCanChoose ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
                  <button onClick={() => setShowSkipPenaltyConfirm(true)} className={penaltyButtonClass}>
                    跳过动画
                  </button>
                </div>
              ) : null}
            </div>
          </section>
        ) : null}

        {penaltyStage === 'shootout' || penaltyStage === 'complete' ? (
          <section className={penaltyPanelClass}>
            <div
              className="relative h-[420px] max-sm:h-[360px] overflow-hidden border-2 border-black"
              style={{
                background: 'linear-gradient(90deg, rgba(255,255,255,.35) 0 2px, transparent 2px 100%), linear-gradient(#82cc76, #6fbd68)',
                backgroundSize: '72px 100%, 100% 100%'
              }}
            >
              <div className="absolute left-1/2 top-0 w-[270px] h-12 -translate-x-1/2 border-2 border-black border-t-0 bg-white" />
              <div className="absolute left-1/2 top-10 w-[70px] h-7 -translate-x-1/2 border-2 border-black bg-[#f1d552] text-[11px] font-bold flex items-center justify-center">
                门将
              </div>
              <div className="absolute left-1/2 top-[250px] max-sm:top-[218px] w-2.5 h-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-2 border-black" />
              <div
                className={`absolute left-1/2 top-[304px] max-sm:top-[270px] -translate-x-1/2 -translate-y-1/2 w-[54px] h-[54px] rounded-full border-2 border-black text-xs font-bold flex items-center justify-center transition-colors ${
                  (nextPenaltyKick?.kicker || latestPenaltyKick?.kicker) === 'spain'
                    ? 'bg-[#df3333] text-white'
                    : 'bg-white text-black'
                }`}
              >
                {(nextPenaltyKick?.kicker || latestPenaltyKick?.kicker) === 'spain' ? 'ESP' : opponentInitials}
              </div>
              <div
                className={`absolute w-[22px] h-[22px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black bg-white transition-[left,top] duration-500 ease-out ${penaltyBallPositionClass}`}
              />
              {latestPenaltyKick ? (
                <div className="absolute left-1/2 bottom-3.5 -translate-x-1/2 min-w-[280px] max-w-[88%] border-2 border-black bg-white px-3 py-2 text-xs font-bold text-center leading-relaxed">
                  第{latestPenaltyKick.round}轮 · {latestPenaltyKick.kicker === 'spain' ? '西班牙' : opponentName || '对手'}
                  {latestPenaltyKick.scored ? '命中' : latestPenaltyKick.detail?.outcome === 'saved' ? '被扑出' : '罚失'}。
                  {latestPenaltyKick.detail?.text || ''}
                </div>
              ) : (
                <div className="absolute left-1/2 bottom-3.5 -translate-x-1/2 min-w-[280px] border-2 border-black bg-white px-3 py-2 text-xs font-bold text-center">
                  球员们从中圈一个个走向禁区
                </div>
              )}
            </div>
            <div className="grid grid-cols-5 gap-1.5 mt-2.5">
              {visiblePenaltyKicks.map((kick, index) => (
                <div
                  key={`${kick.round}_${kick.kicker}_${index}`}
                  className={`border-2 border-black text-center text-[11px] font-bold px-1 py-1.5 ${
                    kick.placeholder
                      ? 'bg-[#eee] text-gray-500'
                      : index < penaltyKickIndex
                      ? kick.scored
                        ? 'bg-[#d8f5d2]'
                        : 'bg-[#ffd9d9]'
                      : 'bg-[#eee] text-gray-500'
                  }`}
                >
                  {kick.kicker === 'spain' ? 'ESP' : opponentInitials} {!kick.placeholder && index < penaltyKickIndex ? getPenaltyKickLabel(kick) : '-'}
                </div>
              ))}
            </div>
            {penaltyStage !== 'complete' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-2.5">
                {!penaltyShootoutStarted ? (
                  <button
                    onClick={() => setPenaltyShootoutStarted(true)}
                    className={penaltyPrimaryButtonClass}
                  >
                    开始罚球
                  </button>
                ) : null}
                <button
                  onClick={() => setShowSkipPenaltyConfirm(true)}
                  className={penaltyButtonClass}
                >
                  跳过动画
                </button>
              </div>
            ) : null}
          </section>
        ) : null}
      </div>
    );
  }

  return (
    <div className="retro-box p-2">
      <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-2">
        <div>
          <h3 className="text-base font-bold font-mono uppercase">{stageTitle || '比赛进行中'}</h3>
          <div className="text-[11px] text-gray-700 font-mono">西班牙 vs {opponentName || '对手'}</div>
        </div>
        <div className="text-right text-xs font-mono">
          <div>{segment.label}</div>
          <div>{progress}%</div>
        </div>
      </div>

      <div className="mb-2 flex justify-center font-mono">
        <div className="border-2 border-black bg-black text-white px-2 py-1">
          <div className="grid grid-cols-[2.5rem_auto_2.5rem] items-center gap-2">
            <div className="text-center text-xs font-bold">{spainInitials}</div>
            <div className="border border-white px-2 py-0.5 text-sm font-bold tracking-widest bg-white text-black leading-none">
              {liveScore[0]}-{liveScore[1]}
            </div>
            <div className="text-center text-xs font-bold">{opponentInitials}</div>
          </div>
        </div>
      </div>

      <div className="relative border-2 border-black bg-green-200 h-64 overflow-hidden">
        <div className="absolute inset-y-0 left-1/2 w-0 border-l-2 border-white/80" />
        <div className="absolute left-1/2 top-1/2 w-16 h-16 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white/80" />
        <div className="absolute inset-y-6 left-0 w-12 border-y-2 border-r-2 border-white/80" />
        <div className="absolute inset-y-6 right-0 w-12 border-y-2 border-l-2 border-white/80" />
        <div className="absolute left-3 top-3 bottom-3 w-[42%] border border-black/20 bg-white/10" />
        <div className="absolute right-3 top-3 bottom-3 w-[42%] border border-black/20 bg-white/10" />

        <div className="absolute left-3 top-3 text-xs font-mono font-bold bg-white border-2 border-black px-2 py-1">
          西班牙
        </div>
        <div className="absolute right-3 top-3 text-xs font-mono font-bold bg-white border-2 border-black px-2 py-1">
          {opponentName || '对手'}
        </div>

        {playerPositions.spain.map((pos, idx) => (
          <div
            key={`spain_${idx}`}
            className="absolute w-8 h-8 rounded-full border-2 border-black bg-red-500 text-white text-[10px] font-mono font-bold flex items-center justify-center transition-all duration-700"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {spainInitials}
          </div>
        ))}
        {playerPositions.opponent.map((pos, idx) => (
          <div
            key={`opp_${idx}`}
            className="absolute w-8 h-8 rounded-full border-2 border-black bg-white text-black text-[10px] font-mono font-bold flex items-center justify-center transition-all duration-700"
            style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)' }}
          >
            {opponentInitials}
          </div>
        ))}

        <div
          className="absolute w-6 h-6 rounded-full border-2 border-black bg-white text-black text-xs font-bold flex items-center justify-center transition-all duration-700"
          style={{ left: `${displayBall.x}%`, top: `${displayBall.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          ●
        </div>
        <div
          className="absolute w-16 h-0 border-t-2 border-black transition-all duration-700 origin-left"
          style={{
            left: `${Math.min(82, segment.ball.x + 5)}%`,
            top: `${Math.max(12, segment.ball.y - 3)}%`,
            ...getArrowStyle(goalEvent ? '■' : segment.arrow)
          }}
        >
          <div className="absolute right-0 top-[-5px] w-2.5 h-2.5 border-t-2 border-r-2 border-black rotate-45" />
        </div>
        {goalEvent ? (
          <div className="absolute left-1/2 top-12 -translate-x-1/2 border-2 border-black bg-white px-3 py-1 text-[11px] font-mono font-bold shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
            {goalEvent.team === 'spain' ? '西班牙进球' : `${opponentName || '对手'}进球`}
          </div>
        ) : null}
        {showWhistle ? (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
            <div className="relative border-2 border-black bg-white px-5 py-3 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] text-center">
              <div className="flex justify-center">
                <WhistleIcon />
              </div>
              <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-6 h-12 border-y-2 border-l-2 border-black rounded-l-full animate-pulse" />
              <div className="absolute -right-8 top-1/2 -translate-y-1/2 w-6 h-12 border-y-2 border-r-2 border-black rounded-r-full animate-pulse" />
            </div>
          </div>
        ) : null}
      </div>

      <div className="mt-2 border-2 border-black bg-white p-2">
        <div className="flex items-center justify-between gap-2 text-xs font-mono mb-1">
          <span className="font-bold">{segment.label}</span>
          <span>{segment.note}</span>
        </div>
        <div className="retro-progress-container">
          <div className="retro-progress-bar" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {segment.kind === 'pause' ? (
        <div className="mt-2 border-2 border-black bg-yellow-100 p-2">
          <div className="font-bold text-sm font-mono mb-1">{segment.label}指示</div>
          <div className="text-xs font-mono text-gray-800 mb-2">
            球员们正在等你说点什么。你可以要求他们执行进攻战术，也可以要求球队执行防守战术。
          </div>
          {!instructionMode ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                onClick={() => setInstructionMode('attack')}
                className="retro-btn text-xs text-left py-2 px-2"
              >
                你希望球员执行进攻
              </button>
              <button
                onClick={() => setInstructionMode('defense')}
                className="retro-btn text-xs text-left py-2 px-2"
              >
                你希望球队执行防守
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-xs font-bold font-mono">
                  {instructionMode === 'attack' ? '进攻战术' : '防守战术'}
                </div>
                <button
                  onClick={() => {
                    setInstructionMode(null);
                    setSelectedInstructionId(null);
                  }}
                  className="retro-btn text-[10px] py-0.5 px-2"
                >
                  返回
                </button>
              </div>
              <div className="grid grid-cols-1 gap-2">
                {activeInstructions.map(instruction => (
                  <button
                    key={instruction.id}
                    onClick={() => setSelectedInstructionId(instruction.id)}
                    className={`text-left py-2 px-2 border-2 font-mono ${
                      selectedInstructionId === instruction.id
                        ? 'bg-black text-white border-black'
                        : 'retro-btn'
                    }`}
                  >
                    <div className="text-xs font-bold font-mono">{instruction.text}</div>
                  </button>
                ))}
              </div>
              {selectedInstruction ? (
                <div className="border-2 border-black bg-gray-50 p-2">
                  <div className="text-xs font-bold font-mono mb-1">{selectedInstruction.text}</div>
                  <div className="text-xs font-mono text-gray-800 leading-relaxed mb-2">
                    {selectedInstruction.description}
                  </div>
                  <button
                    onClick={() => handleInstruction(selectedInstruction, instructionMode)}
                    className="retro-btn-primary text-xs py-1 px-2"
                  >
                    执行该战术
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : null}

      {instructionLog.length > 0 ? (
        <div className="mt-2 text-[10px] font-mono text-gray-600">
          已做指示：{instructionLog.map(item => item.text).join(' / ')}
        </div>
      ) : null}
    </div>
  );
}
