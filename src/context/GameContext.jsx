import React, { useReducer, useEffect } from 'react';
import teamsData from '../data/teams.json';
import eventsData from '../data/events.json';
import { getLeagueRoster, getUclSeedPool } from '../data/leagues';

import { GameContext } from './GameContextInstance';

const initialState = {
  gameState: 'start', // start, playing, gameover, victory
  currentTeam: null,
  playerName: '',
  coachingPhilosophy: '', // Added coaching philosophy
  stats: {},
  month: 1,
  quarter: 1,
  year: 1,
  decisionPoints: 3,
  estimatedRanking: 1,
  history: [],
  currentEvent: null,
  activeDecisionsTaken: [], // Track decision types taken this month
  decisionHistory: [], // Track all decisions taken for condition checking
  randomEventsThisYear: [],
  lastRandomEventId: null,
  specialMechanicState: {
    canteenOpen: true, // Man Utd
    canteenChangedThisSeason: { open: false, close: false }, // Man Utd
    roofClosed: false, // Real Madrid
    roofChangedThisSeason: { open: false, close: false },
    milanLegendsUsedThisSeason: [],
    bayernDressingRoomRevealed: false,
    bayernCommitteeRemoved: false,
    kopFreezeTriggered: false,
    kopFreezeRemainingQuarters: 0,
    kopFreezeDurationQuarters: 1,
    youthCalmUsed: false,
    manCityAutoFlirtUsedTypesThisSeason: [],
    unionWeaponEventsTriggered: []
  },
  activeBuffs: [], // List of active buff/debuff IDs
  hiddenBuffs: [],
  tabloidCount: 0,
  decisionCountThisMonth: 0, // Track number of decisions taken this month
  easterEggTriggered: false,
  artetaEasterEggTriggered: false,
  pointsThisQuarter: 0,
  queuedEvent: null,
  pendingGameState: null,
  pendingSave: null,
  pendingSeasonReset: false,
  gameoverOverrideText: null,
  relegationFinalRanking: null,
  youthRandomEventSeasonYear: 0,
  mixerYouthEventSeasonYear: 0,
  mixerMediaEducateCount: 0,
  tabloidStalkingUnlocked: false,
  coffeeRefUsedThisQuarter: false,
  explodeUsedThisQuarter: false,
  achievementsUnlocked: {},
  achievementToastQueue: [],
  opponentTacticsBoostThisMonth: 0,
  leagueOpponents: [],
  leagueOpponentCursor: 0,
  crossLeagueTacticsInflation: 0,
  leagueSchedule: [],
  leagueRoundCursor: 0,
  leagueMatchResults: {},
  uclActive: false,
  uclAlive: false,
  uclStage: null,
  uclSeasonYear: null,
  uclTeams16: [],
  uclDrawCandidates: [],
  uclOpponentQueue: [],
  uclCurrentOpponent: null,
  uclQualifiedThisSeason: false,
  uclQualifiedNextSeason: false,
  uclWonSeasonYear: null,
  season2TutorialShown: false,
  injuryTutorialShown: false,
  uclTutorialShown: false,
  youthTutorialShown: false,
  youthOnboardingShown: false,
  youthAcademyUnlocked: false,
  youthAcademyUnlockPending: false,
  youthAcademyPlayer: null,
  youthSquadPlayers: [],
  youthRefreshUsedThisQuarter: false,
  youthSeasonFreePointsGrantedYear: 0,
  leagueChampionYears: [],
  uclChampionYears: []
};

function makeYouthId() {
  return `ya_${Math.random().toString(36).slice(2, 10)}${Date.now().toString(36).slice(2, 6)}`;
}

function clampInt(n, min, max) {
  const v = typeof n === 'number' ? Math.round(n) : 0;
  return Math.max(min, Math.min(max, v));
}

const YOUTH_POSITIVE_TRAITS = [
  { id: 'calm', label: '冷静的' },
  { id: 'passionate', label: '热情的' },
  { id: 'stable', label: '稳定的' },
  { id: 'loyal', label: '忠诚的' },
  { id: 'multilingual', label: '多语言的' },
  { id: 'manage_up', label: '向上管理的' }
];

const YOUTH_NEGATIVE_TRAITS = [
  { id: 'party_star', label: '派对之星' },
  { id: 'ambitious', label: '野心家' },
  { id: 'flirtatious', label: '多情种' },
  { id: 'mixer', label: '串子' },
  { id: 'canteen_legend', label: '食堂传奇' },
  { id: 'mole', label: '内鬼' }
];

const YOUTH_SPECIAL_TRAITS = [
  { id: 'eco_guardian', label: '环保卫士' }
];

function pickRandomTraitId(list, excludeId) {
  const arr = Array.isArray(list) ? list.filter(Boolean) : [];
  if (arr.length === 0) return null;
  const pool = excludeId ? arr.filter(t => t && t.id !== excludeId) : arr;
  const src = pool.length > 0 ? pool : arr;
  return src[Math.floor(Math.random() * src.length)]?.id || null;
}

function rollYouthTraits({ prevPositiveId = null, prevNegativeId = null, prevSpecialId = null } = {}) {
  const positiveTraitId = pickRandomTraitId(YOUTH_POSITIVE_TRAITS, prevPositiveId);

  const shouldRollSpecial = Math.random() < 0.02;
  if (shouldRollSpecial) {
    const specialTraitId = pickRandomTraitId(YOUTH_SPECIAL_TRAITS, prevSpecialId);
    return {
      positiveTraitId,
      negativeTraitId: null,
      specialTraitId
    };
  }

  const negativeTraitId = pickRandomTraitId(YOUTH_NEGATIVE_TRAITS, prevNegativeId);
  return {
    positiveTraitId,
    negativeTraitId,
    specialTraitId: null
  };
}

function getYouthSquadMax(_teamId) {
  void _teamId;
  return 1;
}

function getYouthSquadAddLimit(_teamId, _funds) {
  void _teamId;
  void _funds;
  return 1;
}

function clampFunds(value, teamId) {
  const v = typeof value === 'number' ? value : 0;
  return teamId === 'fc_barcelona' ? v : Math.max(0, v);
}

function computeYouthTechTacticsDelta(playerTech, teamTactics) {
  if (playerTech === null || playerTech === undefined) return 0;
  const tech = clampNumber(playerTech ?? 0, 0, 10);
  const tactics = clampNumber(teamTactics ?? 0, 0, 10);
  const diff = tech - tactics;
  if (diff > 2) return 1;
  if (diff > 0) return 0.5;
  if (diff < -2) return -1;
  if (diff < 0) return -0.5;
  return 0;
}

function getBestYouthStarterTech(squadPlayers, ctx) {
  const arr = Array.isArray(squadPlayers) ? squadPlayers.map(normalizeYouthPlayer).filter(Boolean) : [];
  let best = null;
  for (let i = 0; i < arr.length; i += 1) {
    const p = arr[i];
    if (!p || p.role !== 'starter') continue;
    if (
      !ctx?.ucl &&
      (p.specialTraitId || '') === 'eco_guardian' &&
      p.ecoMissingSeasonYear &&
      p.ecoMissingQuarter &&
      p.ecoMissingSeasonYear === clampInt(ctx?.year ?? 0, 0, 99) &&
      p.ecoMissingQuarter === clampInt(ctx?.quarter ?? 0, 0, 3)
    ) {
      continue;
    }
    const t = clampNumber(p.tech ?? 0, 0, 10);
    if (best === null || t > best) best = t;
  }
  return best;
}

function generateYouthPlayer({ freePoints = 0, techMin = 5, techMax = 5 } = {}) {
  const attrs = { unity: 1, authority: 1, diligence: 1 };
  const keys = ['unity', 'authority', 'diligence'];
  for (let i = 0; i < 2; i += 1) {
    const k = keys[Math.floor(Math.random() * keys.length)];
    attrs[k] = clampInt((attrs[k] ?? 0) + 1, 0, 10);
  }

  const lo = clampInt(Math.min(techMin, techMax), 0, 10);
  const hi = clampInt(Math.max(techMin, techMax), 0, 10);
  const tech = clampNumber(lo + Math.floor(Math.random() * (hi - lo + 1)), 0, 10);

  const traits = rollYouthTraits();
  return {
    id: makeYouthId(),
    name: '',
    age: 17,
    unity: clampInt(attrs.unity, 0, 10),
    authority: clampInt(attrs.authority, 0, 10),
    diligence: clampInt(attrs.diligence, 0, 10),
    tech,
    freePoints: clampInt(freePoints, 0, 9999),
    starterMatches: 0,
    benchMatches: 0,
    role: 'bench',
    hasArmband: false,
    positiveTraitId: traits.positiveTraitId,
    negativeTraitId: traits.negativeTraitId,
    specialTraitId: traits.specialTraitId,
    traitRerollUsed: false,
    moleCaughtCount: 0,
    ecoMissingSeasonYear: 0,
    ecoMissingQuarter: 0
  };
}

function normalizeYouthPlayer(raw) {
  if (!raw || typeof raw !== 'object') return null;
  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : makeYouthId(),
    name: typeof raw.name === 'string' ? raw.name : '',
    age: clampInt(raw.age ?? 17, 0, 99),
    unity: clampInt(raw.unity ?? 0, 0, 10),
    authority: clampInt(raw.authority ?? 0, 0, 10),
    diligence: clampInt(raw.diligence ?? 0, 0, 10),
    tech: clampNumber(raw.tech ?? 4, 0, 10),
    freePoints: clampInt(raw.freePoints ?? 0, 0, 9999),
    starterMatches: clampInt(raw.starterMatches ?? 0, 0, 999999),
    benchMatches: clampInt(raw.benchMatches ?? 0, 0, 999999),
    role: (raw.role === 'starter' || raw.role === 'bench') ? raw.role : 'bench',
    hasArmband: Boolean(raw.hasArmband),
    positiveTraitId: (typeof raw.positiveTraitId === 'string' && raw.positiveTraitId) ? raw.positiveTraitId : null,
    negativeTraitId: (typeof raw.negativeTraitId === 'string' && raw.negativeTraitId) ? raw.negativeTraitId : null,
    specialTraitId: (typeof raw.specialTraitId === 'string' && raw.specialTraitId) ? raw.specialTraitId : null,
    traitRerollUsed: Boolean(raw.traitRerollUsed),
    moleCaughtCount: clampInt(raw.moleCaughtCount ?? 0, 0, 999999),
    ecoMissingSeasonYear: clampInt(raw.ecoMissingSeasonYear ?? 0, 0, 99),
    ecoMissingQuarter: clampInt(raw.ecoMissingQuarter ?? 0, 0, 3)
  };
}

function getYouthTraitMult(player) {
  return player && player.hasArmband ? 2 : 1;
}

function getYouthTraitMonthlyBonuses(squadPlayers) {
  const arr = Array.isArray(squadPlayers) ? squadPlayers.map(normalizeYouthPlayer).filter(Boolean) : [];
  let funds = 0;
  let mediaSupport = 0;
  let boardSupport = 0;
  arr.forEach(p => {
    const mult = getYouthTraitMult(p);
    if ((p.positiveTraitId || '') === 'passionate') funds = Math.max(funds, 2 * mult);
    if ((p.positiveTraitId || '') === 'multilingual') mediaSupport = Math.max(mediaSupport, 2 * mult);
    if ((p.positiveTraitId || '') === 'manage_up') boardSupport = Math.max(boardSupport, 2 * mult);
  });
  return { funds, mediaSupport, boardSupport };
}

function getYouthTraitQuarterlyModifiers(squadPlayers) {
  const arr = Array.isArray(squadPlayers) ? squadPlayers.map(normalizeYouthPlayer).filter(Boolean) : [];
  let injuryRisk = 0;
  let funds = 0;
  arr.forEach(p => {
    const mult = getYouthTraitMult(p);
    if ((p.negativeTraitId || '') === 'party_star') injuryRisk = Math.max(injuryRisk, 1 * mult);
    if ((p.negativeTraitId || '') === 'canteen_legend') funds = Math.min(funds, -5 * mult);
  });
  return { injuryRisk, funds };
}

function getYouthFlirtExtraTabloid(squadPlayers) {
  const arr = Array.isArray(squadPlayers) ? squadPlayers.map(normalizeYouthPlayer).filter(Boolean) : [];
  let extra = 0;
  arr.forEach(p => {
    const mult = getYouthTraitMult(p);
    if ((p.negativeTraitId || '') === 'flirtatious') extra = Math.max(extra, 1 * mult);
  });
  return extra;
}

function hasYouthPositiveTrait(squadPlayers, id) {
  const arr = Array.isArray(squadPlayers) ? squadPlayers.map(normalizeYouthPlayer).filter(Boolean) : [];
  return arr.some(p => (p.positiveTraitId || '') === id);
}

function hasYouthNegativeTrait(squadPlayers, id) {
  const arr = Array.isArray(squadPlayers) ? squadPlayers.map(normalizeYouthPlayer).filter(Boolean) : [];
  return arr.some(p => (p.negativeTraitId || '') === id);
}

function isRandomEventId(id, teamId) {
  if (!id) return false;
  const g = (eventsData && eventsData.randomEvents && Array.isArray(eventsData.randomEvents.global)) ? eventsData.randomEvents.global : [];
  const t = (eventsData && eventsData.randomEvents && eventsData.randomEvents.teamSpecific && Array.isArray(eventsData.randomEvents.teamSpecific[teamId]))
    ? eventsData.randomEvents.teamSpecific[teamId]
    : [];
  return g.some(e => e && e.id === id) || t.some(e => e && e.id === id);
}

function tryApplyYouthCalmProtection({ stats, specialMechanicState, youthSquadPlayers, teamId }) {
  const used = Boolean(specialMechanicState?.youthCalmUsed);
  if (used) return { applied: false, stats, specialMechanicState };
  const hasCalm = hasYouthPositiveTrait(youthSquadPlayers, 'calm');
  if (!hasCalm) return { applied: false, stats, specialMechanicState };

  const nextStats = { ...(stats || {}) };
  nextStats.boardSupport = Math.max(0, Math.min(100, (nextStats.boardSupport ?? 0) + 20));
  nextStats.dressingRoom = Math.max(0, Math.min(100, (nextStats.dressingRoom ?? 0) + 20));
  const nextSpecial = { ...(specialMechanicState || {}), youthCalmUsed: true };
  nextStats.funds = clampFunds(nextStats.funds ?? 0, teamId);
  return { applied: true, stats: nextStats, specialMechanicState: nextSpecial };
}

function getYouthSquadProfile(squadPlayers) {
  const arr = Array.isArray(squadPlayers) ? squadPlayers.map(normalizeYouthPlayer).filter(Boolean) : [];
  const profile = {
    bestUnity: 0,
    bestAuthority: 0,
    bestDiligence: 0,
    monthlyDressingRoomBonus: 0,
    monthlyAuthorityBonus: 0,
    quarterlyTacticsBonus: 0,
    seasonTacticsDrop: 2,
    hasArmbandUnity10: false,
    hasArmbandAuthority10: false,
    hasArmbandDiligence10: false
  };

  let maxSeasonDropReduction = 0;

  arr.forEach(p => {
    if (!p) return;

    const unity = clampInt(p.unity ?? 0, 0, 10);
    const authority = clampInt(p.authority ?? 0, 0, 10);
    const diligence = clampInt(p.diligence ?? 0, 0, 10);
    const mult = p.hasArmband ? 2 : 1;

    profile.bestUnity = Math.max(profile.bestUnity, unity);
    profile.bestAuthority = Math.max(profile.bestAuthority, authority);
    profile.bestDiligence = Math.max(profile.bestDiligence, diligence);

    const dressingRoomBase = unity >= 7 ? 3 : (unity >= 5 ? 2 : 0);
    profile.monthlyDressingRoomBonus = Math.max(profile.monthlyDressingRoomBonus, dressingRoomBase * mult);

    const authorityBase = authority >= 7 ? 2 : 0;
    profile.monthlyAuthorityBonus = Math.max(profile.monthlyAuthorityBonus, authorityBase * mult);

    const quarterlyTacticsBase = diligence >= 7 ? 0.5 : 0;
    profile.quarterlyTacticsBonus = Math.max(profile.quarterlyTacticsBonus, quarterlyTacticsBase * mult);

    const seasonDropReductionBase = diligence >= 5 ? 1 : 0;
    maxSeasonDropReduction = Math.max(maxSeasonDropReduction, seasonDropReductionBase * mult);

    if (p.hasArmband && unity === 10) profile.hasArmbandUnity10 = true;
    if (p.hasArmband && authority === 10) profile.hasArmbandAuthority10 = true;
    if (p.hasArmband && diligence === 10) profile.hasArmbandDiligence10 = true;
  });

  profile.seasonTacticsDrop = clampInt(2 - maxSeasonDropReduction, 0, 2);

  return profile;
}

function applyYouthMatchesToSquad(squadPlayers, matchesPlayed, opts) {
  const arr = Array.isArray(squadPlayers) ? squadPlayers.map(normalizeYouthPlayer).filter(Boolean) : [];
  const matches = clampInt(matchesPlayed ?? 0, 0, 999);
  if (matches <= 0 || arr.length === 0) return arr;

  return arr.map(p => {
    const isEcoMissing = Boolean(
      !opts?.ucl &&
      (p.specialTraitId || '') === 'eco_guardian' &&
      p.ecoMissingSeasonYear &&
      p.ecoMissingQuarter &&
      p.ecoMissingSeasonYear === clampInt(opts?.year ?? 0, 0, 99) &&
      p.ecoMissingQuarter === clampInt(opts?.quarter ?? 0, 0, 3)
    );
    if (isEcoMissing) return p;

    const prevStarter = clampInt(p.starterMatches ?? 0, 0, 999999);
    const prevBench = clampInt(p.benchMatches ?? 0, 0, 999999);

    let nextStarter = prevStarter;
    let nextBench = prevBench;
    if (p.role === 'starter') nextStarter += matches;
    else nextBench += matches;

    const prevStarterSteps = Math.floor(prevStarter / 10);
    const nextStarterSteps = Math.floor(nextStarter / 10);
    const starterGain = Math.max(0, nextStarterSteps - prevStarterSteps) * 0.5;

    const prevBenchSteps = Math.floor(prevBench / 30);
    const nextBenchSteps = Math.floor(nextBench / 30);
    const benchGain = ((p.negativeTraitId || '') === 'ambitious' && p.role !== 'starter')
      ? 0
      : (Math.max(0, nextBenchSteps - prevBenchSteps) * 0.5);

    const gain = starterGain + benchGain;

    return {
      ...p,
      starterMatches: nextStarter,
      benchMatches: nextBench,
      tech: clampNumber((p.tech ?? 0) + gain, 0, 10)
    };
  });
}

function buildUclIntroEvent() {
  return {
    id: 'ucl_intro',
    title: '欧冠十六强',
    description: '欧冠淘汰赛抽签即将开始。你们已进入十六强，第三季度的随机事件将由欧冠淘汰赛赛程替代。',
    options: [{ text: '开始欧冠', effects: {}, uclAction: 'UCL_INTRO' }]
  };
}

function buildUclDrawEvent({ candidatesCount }) {
  const n = Math.max(1, candidatesCount || 1);
  return {
    id: 'ucl_draw_r16',
    title: '欧冠抽签：十六强',
    description: '欧冠十六强抽签开始。根据同联赛回避制度，本轮不会抽到同联赛对手。请选择一个抽签球。',
    uclDraw: true,
    options: Array.from({ length: n }).map((_, idx) => ({
      text: `抽签球 ${idx + 1}`,
      effects: {},
      uclAction: 'UCL_DRAW'
    }))
  };
}

function buildUclDrawResultEvent({ opponent }) {
  const oppName = opponent?.name || '未知对手';
  return {
    id: 'ucl_draw_result',
    title: '抽签结果',
    description: `抽签球缓缓打开——你们将迎战：${oppName}。`,
    options: [{ text: '进入比赛', effects: {}, uclAction: 'UCL_START_R16' }]
  };
}

function uclStageLabel(stage) {
  if (stage === 'r16') return '十六强';
  if (stage === 'qf') return '八强';
  if (stage === 'sf') return '四强';
  if (stage === 'final') return '决赛';
  return '淘汰赛';
}

function buildUclMatchEvent({ stage, opponent }) {
  const oppName = opponent?.name || '未知对手';
  const oppT = opponent?.tactics;
  const suffix = (typeof oppT === 'number') ? `（对手技战术：${oppT}）` : '';
  return {
    id: `ucl_${stage}`,
    title: `欧冠淘汰赛：${uclStageLabel(stage)}`,
    description: `你们将在欧冠迎战：${oppName}${suffix}。`,
    options: [{ text: '开球', effects: {}, uclAction: 'UCL_MATCH' }]
  };
}

function buildUclResultEvent({ stage, opponent, won, detailDescription }) {
  const oppName = opponent?.name || '未知对手';
  const title = won ? '晋级！' : '遗憾出局';
  const desc = detailDescription
    ? detailDescription
    : (won
      ? `你们在欧冠${uclStageLabel(stage)}击败了${oppName}，成功晋级。`
      : `你们在欧冠${uclStageLabel(stage)}不敌${oppName}，遗憾出局。`);
  return {
    id: `ucl_${stage}_result_${won ? 'win' : 'lose'}`,
    title,
    description: desc,
    options: [{ text: '继续', effects: {} }]
  };
}

function buildUclChampionEvent() {
  return {
    id: 'ucl_champion',
    title: '欧冠冠军！',
    description: '你们赢下了欧冠决赛，捧起了大耳朵杯！',
    options: [{ text: '继续', effects: {} }]
  };
}

function _buildInjuryRiskTutorialEvent() {
  return {
    id: 'tutorial_injury_risk',
    title: '新机制：伤病风险',
    description: '从第二赛季开始，伤病风险将加入你的管理范围。伤病风险每个季度结算会增加1点；当达到5点时将触发伤病潮，降低技战术水平与更衣室稳定性。你可以通过决策来主动管理它。',
    options: [{ text: '我知道了', effects: {} }]
  };
}

function _buildSeason2StarterTutorialEvent() {
  return {
    id: 'tutorial_season2_starter',
    title: '新赛季提示',
    description: '从第二赛季开始，有些事情会变得不一样了：\n\n1）【训练】里会出现新的选项，它们可能会带来额外收益，也可能带来额外代价。\n2）伤病风险会成为需要你长期关注的指标；当它累计到5点时，球队将迎来伤病潮。\n3）你依然可以通过“调情”获得一些灵感与信息，但圈内人也会更加谨慎——别把它当成每次都稳赚的捷径。',
    options: [{ text: '我知道了', effects: {} }]
  };
}

function _buildUclTutorialEvent() {
  return {
    id: 'tutorial_ucl',
    title: '新机制：欧冠淘汰赛',
    description: '你已获得欧冠席位。每个赛季的第二季度结算后将进入欧冠十六强：先抽签决定对手（十六强有同联赛回避），随后第三季度将由欧冠淘汰赛赛程替代随机事件。祝你好运。',
    options: [{ text: '我知道了', effects: {} }]
  };
}

function _buildYouthAcademyTutorialEvent(nextEvent) {
  const option = { text: '我知道了', effects: {} };
  if (nextEvent) option.nextEvent = nextEvent;
  return {
    id: 'tutorial_youth_academy',
    title: '新机制：青训系统',
    description: '青训系统已解锁。\n\n1）你可以从【青训】入口查看青训营与已加入一线队的青训球员。\n2）青训营每次只会出现1名候选人；你可以选择【并入队】、【出售】或花费资金【刷新】候选人（每个季度只能刷新一次）。\n3）青训球员加入一线队后可设置为首发/替补，比赛与时间会推动他们成长；每支球队最多只能有1名青训入队。',
    options: [option]
  };
}

function buildUclTeams16(state) {
  const seeds = getUclSeedPool();
  const playerId = state.currentTeam?.id;
  const playerLeagueId = state.currentTeam?.leagueId;
  const playerTactics = clampNumber(state.stats?.tactics, 0, 10);
  const playerDressingRoom = clampNumber(state.stats?.dressingRoom, 0, 100);
  const crossInflation = clampNumber(state.crossLeagueTacticsInflation || 0, 0, 1);

  const BIG_CLUB_IDS = new Set([
    'man_utd',
    'arsenal',
    'liverpool',
    'chelsea',
    'real_madrid',
    'dortmund',
    'ac_milan'
  ]);

  const tacticsOf = (seed) => {
    if (!seed) return 0;
    if (seed.id === playerId) return playerTactics;

    if (seed.leagueId && seed.leagueId === playerLeagueId) {
      const found = (state.leagueOpponents || []).find(o => o.id === seed.id);
      if (found && typeof found.tactics === 'number') return clampNumber(found.tactics, 0, 9.5);
    }

    if (typeof seed.opponentBaseTactics === 'number') {
      return clampNumber(seed.opponentBaseTactics, 0, 9.5);
    }

    const idx = typeof seed.leagueIndex === 'number' ? seed.leagueIndex : 4;
    const baseline = clampNumber(9 - (idx - 1) * 0.5, 6.5, 9);
    const raw = Math.round(gaussianRandom(baseline, 0.6) * 2) / 2;
    return clampNumber(raw + crossInflation, 0, 9.5);
  };

  const dressingRoomOf = (seed) => {
    if (!seed) return 0;
    if (seed.id === playerId) return playerDressingRoom;
    if (BIG_CLUB_IDS.has(seed.id)) return 60;
    // non-big-clubs: use a middle baseline (keeps UCL ties meaningful)
    return 50;
  };

  const expanded = seeds.map(s => ({
    id: s.id,
    name: s.name,
    leagueId: s.leagueId,
    tactics: tacticsOf(s),
    dressingRoom: dressingRoomOf(s)
  }));

  expanded.sort((a, b) => (b.tactics || 0) - (a.tactics || 0));

  let top16 = expanded.slice(0, 16);
  if (playerId && !top16.some(t => t.id === playerId)) {
    top16 = [{ id: playerId, name: state.currentTeam?.name || '你', leagueId: playerLeagueId, tactics: playerTactics, dressingRoom: playerDressingRoom }, ...top16.slice(0, 15)];
  }

  const withoutPlayer = top16.filter(t => t.id !== playerId);
  shuffleInPlace(withoutPlayer);

  return {
    teams16: top16,
    opponentQueue: withoutPlayer
  };
}

const SAVE_VERSION = 1;
const AUTO_SAVE_KEY = 'gsm_save_auto_latest';
const MANUAL_SAVE_KEY_PREFIX = 'gsm_save_manual_';
const MANUAL_SLOTS_KEY = 'gsm_save_manual_slots_v2';
const GLOBAL_ACHIEVEMENTS_KEY = 'gsm_achievements_global_v1';

function buildSavePayload(state, type, slot) {
  const meta = {
    type,
    slot: slot ?? null,
    savedAt: new Date().toISOString(),
    playerName: state.playerName || '',
    teamId: state.currentTeam?.id || null,
    teamName: state.currentTeam?.name || null,
    year: state.year,
    quarter: state.quarter,
    month: state.month,
    points: state.stats?.points,
    boardSupport: state.stats?.boardSupport,
    dressingRoom: state.stats?.dressingRoom,
    mediaSupport: state.stats?.mediaSupport,
    authority: state.stats?.authority,
    funds: state.stats?.funds,
    tactics: state.stats?.tactics,
    injuryRisk: state.stats?.injuryRisk,
    tabloidCount: state.tabloidCount
  };

  const stateToSave = { ...state };
  delete stateToSave.pendingSave;

  return {
    version: SAVE_VERSION,
    meta,
    state: stateToSave
  };
}

function _buildChoiceOutcomeEvent({ baseEvent, option, effectsPreview, nextEvent }) {
  return {
    id: `outcome_${baseEvent?.id || 'event'}_${option?.id || 'choice'}`,
    title: baseEvent?.title || '后果',
    description: option?.outcomeText || '',
    effects: {},
    effectsPreview: effectsPreview || {},
    isOutcome: true,
    options: [{ text: '确定', effects: {}, nextEvent }]
  };
}

function buildInjuryCrisisEvent(nextEvent) {
  const option = { text: '接受现实', effects: { tactics: -2, dressingRoom: -15 } };
  if (nextEvent) option.nextEvent = nextEvent;
  return {
    id: 'injury_crisis',
    title: '伤病潮',
    description: '训练强度与赛程压力叠加，球队突然迎来一波伤病潮。更衣室里充满焦虑，战术安排也被迫打乱。',
    options: [option]
  };
}

function hydrateLoadedState(raw) {
  if (!raw || typeof raw !== 'object') return null;

  const next = { ...initialState, ...raw, pendingSave: null, season2TutorialShown: raw.season2TutorialShown || false };

  if (next.currentTeam && typeof next.currentTeam === 'string') {
    const found = teamsData.find(t => t.id === next.currentTeam);
    next.currentTeam = found || null;
  }

  if (next.gameState === 'victory') next.gameState = 'playing';

  const nextStats = { ...(next.stats || {}) };
  if (nextStats.injuryRisk === undefined) nextStats.injuryRisk = 0;
  if (nextStats.points === undefined) nextStats.points = 0;
  next.stats = nextStats;

  if (!Array.isArray(next.hiddenBuffs)) next.hiddenBuffs = [];

  if (!Array.isArray(next.activeBuffs)) next.activeBuffs = [];
  if (next.activeBuffs.includes('kop_call')) {
    next.activeBuffs = next.activeBuffs
      .map(id => (id === 'kop_call' ? 'kop_freeze_season' : id))
      .filter((id, idx, arr) => arr.indexOf(id) === idx);
  }

  if (!next.specialMechanicState || typeof next.specialMechanicState !== 'object') {
    next.specialMechanicState = { ...initialState.specialMechanicState };
  }
  if (!Array.isArray(next.specialMechanicState.manCityAutoFlirtUsedTypesThisSeason)) {
    next.specialMechanicState.manCityAutoFlirtUsedTypesThisSeason = [];
  }

  if (!Array.isArray(next.specialMechanicState.unionWeaponEventsTriggered)) {
    next.specialMechanicState.unionWeaponEventsTriggered = [];
  }

  if (next.specialMechanicState.unionWeaponEventsTriggered.length === 0 && Array.isArray(next.activeBuffs)) {
    const inferred = [];
    if (next.activeBuffs.includes('union_stun_gun')) inferred.push('union_weapon_1');
    if (next.activeBuffs.includes('union_stun_iron')) inferred.push('union_weapon_1', 'union_weapon_2');
    if (next.activeBuffs.includes('union_wood_iron_stun')) inferred.push('union_weapon_1', 'union_weapon_2', 'union_weapon_3', 'union_weapon_4');
    if (inferred.length > 0) {
      next.specialMechanicState.unionWeaponEventsTriggered = Array.from(new Set(inferred));
    }
  }

  if (next.specialMechanicState.youthCalmUsed === undefined) next.specialMechanicState.youthCalmUsed = false;

  // Migrate Mourinho legacy issues debuff split (older saves may have only legacy_issues)
  if (next.currentTeam?.id === 'man_city') {
    if (next.activeBuffs.includes('legacy_issues') && !next.activeBuffs.includes('legacy_issues_mop')) {
      next.activeBuffs = next.activeBuffs.map(id => (id === 'legacy_issues' ? 'legacy_issues_mop' : id));
    }
  }
  if (next.currentTeam?.id === 'arsenal') {
    if (next.activeBuffs.includes('legacy_issues_mop') && !next.activeBuffs.includes('legacy_issues')) {
      next.activeBuffs = next.activeBuffs.map(id => (id === 'legacy_issues_mop' ? 'legacy_issues' : id));
    }
  }
  next.activeBuffs = next.activeBuffs.filter((id, idx, arr) => arr.indexOf(id) === idx);

  if (next.youthRandomEventSeasonYear === undefined) next.youthRandomEventSeasonYear = 0;
  if (next.mixerYouthEventSeasonYear === undefined) next.mixerYouthEventSeasonYear = 0;
  if (next.mixerMediaEducateCount === undefined) next.mixerMediaEducateCount = 0;

  if (next.currentTeam?.id === 'liverpool') {
    const name = next.playerName;
    const hasKop = next.activeBuffs.includes('kop_freeze_quarter') || next.activeBuffs.includes('kop_freeze_season');
    if (!hasKop) {
      if (isKloppName(name)) {
        next.activeBuffs.push('kop_freeze_season');
        next.specialMechanicState = { ...next.specialMechanicState, kopFreezeDurationQuarters: 4 };
      } else {
        next.activeBuffs.push('kop_freeze_quarter');
        next.specialMechanicState = { ...next.specialMechanicState, kopFreezeDurationQuarters: 1 };
      }
    }

    if (isAlonsoName(name) && !next.activeBuffs.includes('istanbul_kiss')) {
      next.activeBuffs.push('istanbul_kiss');
    }

    next.activeBuffs = next.activeBuffs.filter((id, idx, arr) => arr.indexOf(id) === idx);
  }
  if (next.specialMechanicState.bayernDressingRoomRevealed === undefined) next.specialMechanicState.bayernDressingRoomRevealed = false;
  if (next.specialMechanicState.bayernCommitteeRemoved === undefined) next.specialMechanicState.bayernCommitteeRemoved = false;

  if (next.currentTeam?.id === 'bayern_munich') {
    if (!Array.isArray(next.activeBuffs)) next.activeBuffs = [];
    if (!next.specialMechanicState.bayernCommitteeRemoved && !next.activeBuffs.includes('bayern_committee')) next.activeBuffs.push('bayern_committee');
    if (!next.activeBuffs.includes('bayern_history_proof')) next.activeBuffs.push('bayern_history_proof');
  }

  if (
    next.currentTeam?.id === 'bayern_munich' &&
    !next.specialMechanicState?.bayernCommitteeRemoved &&
    next.currentEvent?.id !== 'bayern_committee_trust'
  ) {
    const hasFiveYearsAchievement = Boolean(next.achievementsUnlocked && next.achievementsUnlocked['bayern_5_years']);
    const coachedFiveSeasons = Boolean((next.year ?? 1) >= 6 || hasFiveYearsAchievement);
    if (coachedFiveSeasons) {
      const after = next.currentEvent || next.queuedEvent || null;
      const remainingQueued = next.currentEvent ? next.queuedEvent : null;
      next.currentEvent = {
        id: 'bayern_committee_trust',
        title: '通知',
        description: '您已赢得球员们的信任。',
        options: [{ text: '确定', effects: { special_bayern_remove_committee: true }, nextEvent: after }]
      };
      next.queuedEvent = remainingQueued;
    }
  }
  if (!Array.isArray(next.achievementToastQueue)) next.achievementToastQueue = [];
  if (next.opponentTacticsBoostThisMonth === undefined) next.opponentTacticsBoostThisMonth = 0;
  if (next.crossLeagueTacticsInflation === undefined) next.crossLeagueTacticsInflation = 0;
  if (next.uclActive === undefined) next.uclActive = false;
  if (next.uclAlive === undefined) next.uclAlive = false;
  if (next.uclStage === undefined) next.uclStage = null;
  if (next.uclSeasonYear === undefined) next.uclSeasonYear = null;
  if (!Array.isArray(next.uclTeams16)) next.uclTeams16 = [];
  if (!Array.isArray(next.uclDrawCandidates)) next.uclDrawCandidates = [];
  if (!Array.isArray(next.uclOpponentQueue)) next.uclOpponentQueue = [];
  if (next.uclCurrentOpponent === undefined) next.uclCurrentOpponent = null;
  if (next.uclQualifiedThisSeason === undefined) next.uclQualifiedThisSeason = false;
  if (next.uclQualifiedNextSeason === undefined) next.uclQualifiedNextSeason = false;
  if (next.uclWonSeasonYear === undefined) next.uclWonSeasonYear = null;
  if (next.season2TutorialShown === undefined) next.season2TutorialShown = false;
  if (next.injuryTutorialShown === undefined) next.injuryTutorialShown = false;
  if (next.uclTutorialShown === undefined) next.uclTutorialShown = false;
  if (next.youthTutorialShown === undefined) next.youthTutorialShown = false;
  if (next.youthOnboardingShown === undefined) next.youthOnboardingShown = false;

  if (!Array.isArray(next.leagueChampionYears)) next.leagueChampionYears = [];
  if (!Array.isArray(next.uclChampionYears)) next.uclChampionYears = [];

  if (next.youthAcademyUnlocked === undefined) next.youthAcademyUnlocked = false;
  if (next.youthAcademyUnlockPending === undefined) next.youthAcademyUnlockPending = Boolean((next.year ?? 1) >= 3);
  if (next.youthAcademyPlayer === undefined) next.youthAcademyPlayer = null;
  if (!Array.isArray(next.youthSquadPlayers)) next.youthSquadPlayers = [];
  if (next.youthRefreshUsedThisQuarter === undefined) next.youthRefreshUsedThisQuarter = false;
  if (next.youthSeasonFreePointsGrantedYear === undefined) next.youthSeasonFreePointsGrantedYear = 0;

  {
    const leagueYears = new Set((Array.isArray(next.leagueChampionYears) ? next.leagueChampionYears : []).filter(v => typeof v === 'number'));
    const uclYears = new Set((Array.isArray(next.uclChampionYears) ? next.uclChampionYears : []).filter(v => typeof v === 'number'));

    if (typeof next.uclWonSeasonYear === 'number') {
      uclYears.add(next.uclWonSeasonYear);
    }

    if (
      next.currentEvent?.id === 'season_settlement' &&
      next.currentEvent?.champion &&
      typeof next.currentEvent?.seasonYear === 'number'
    ) {
      leagueYears.add(next.currentEvent.seasonYear);
    }

    if (next.gameState === 'double_crown') {
      const inferredSeasonYear = (typeof next.uclWonSeasonYear === 'number')
        ? next.uclWonSeasonYear
        : ((typeof next.year === 'number') ? (next.year - 1) : null);
      if (typeof inferredSeasonYear === 'number') {
        leagueYears.add(inferredSeasonYear);
        uclYears.add(inferredSeasonYear);
      } else {
        leagueYears.add(-1);
        uclYears.add(-1);
      }
    }

    if (next.achievementsUnlocked && next.achievementsUnlocked['double_crown']) {
      if (leagueYears.size === 0) leagueYears.add(-1);
      if (uclYears.size === 0) uclYears.add(-1);
    }

    if (next.achievementsUnlocked && next.achievementsUnlocked['ucl_champion']) {
      if (uclYears.size === 0) uclYears.add(-1);
    }

    if (next.achievementsUnlocked && next.achievementsUnlocked['manutd_year1_champion']) {
      leagueYears.add(1);
    }

    next.leagueChampionYears = Array.from(leagueYears);
    next.uclChampionYears = Array.from(uclYears);
  }

  if (next.currentTeam?.id === 'fc_barcelona') {
    next.youthAcademyUnlocked = true;
    next.youthAcademyUnlockPending = false;
  }

  next.youthAcademyPlayer = normalizeYouthPlayer(next.youthAcademyPlayer);
  next.youthSquadPlayers = next.youthSquadPlayers
    .map(p => {
      if (!p || typeof p !== 'object') return p;
      // Back-compat: older saves may not have freePoints for squad youth.
      if (p.freePoints === undefined) return { ...p, freePoints: 1 };
      return p;
    })
    .map(normalizeYouthPlayer)
    .filter(Boolean)
    .slice(0, getYouthSquadMax(next.currentTeam?.id));

  if (next.easterEggTriggered === undefined) next.easterEggTriggered = false;

  const isAlonsoForHydrate = (() => {
    const n = String(next.playerName || '').trim().toLowerCase();
    return n === '阿隆索' || n === '哈维阿隆索' || n === 'xabi alonso' || n === 'alonso';
  })();

  const teamIdForHydrate = next.currentTeam?.id;
  if (
    next.gameState === 'gameover' &&
    isAlonsoForHydrate &&
    teamIdForHydrate &&
    teamIdForHydrate !== 'man_utd' &&
    teamIdForHydrate !== 'liverpool' &&
    next.currentEvent?.id !== 'gerrard_letter'
  ) {
    next.easterEggTriggered = false;
  }

  if (!next.specialMechanicState || typeof next.specialMechanicState !== 'object') {
    next.specialMechanicState = { ...initialState.specialMechanicState };
  }
  if (!Array.isArray(next.specialMechanicState.milanLegendsUsedThisSeason)) {
    next.specialMechanicState.milanLegendsUsedThisSeason = [];
  }

  const shouldRebuildOpponents =
    !Array.isArray(next.leagueOpponents) ||
    (Array.isArray(next.leagueOpponents) && next.leagueOpponents.length > 0 && String(next.leagueOpponents[0]?.id || '').startsWith('opp_'));

  if (shouldRebuildOpponents) {
    const teamTactics = next.stats?.tactics;
    const leagueId = next.currentTeam?.leagueId || 'epl';
    const teamId = next.currentTeam?.id;
    next.leagueOpponents = buildLeagueOpponents({ leagueId, playerTeamId: teamId, playerTactics: teamTactics });
  }

  if (Array.isArray(next.leagueOpponents)) {
    next.leagueOpponents = next.leagueOpponents.map(o => {
      const baseTactics = (typeof o?.baseTactics === 'number')
        ? clampNumber(o.baseTactics, 0, 10)
        : clampNumber((o?.tactics ?? 0), 0, 10);
      const tactics = (typeof o?.tactics === 'number')
        ? clampNumber(o.tactics, 0, 10)
        : baseTactics;
      return { ...o, baseTactics, tactics };
    });
  }
  if (next.leagueOpponentCursor === undefined) next.leagueOpponentCursor = 0;
  if (!Array.isArray(next.leagueSchedule) || next.leagueSchedule.length === 0) {
    const leagueId = next.currentTeam?.leagueId || 'epl';
    const teamId = next.currentTeam?.id;
    next.leagueSchedule = buildLeagueSchedule({ leagueId, playerTeamId: teamId, opponents: next.leagueOpponents });
  } else {
    const teamId = next.currentTeam?.id;
    if (teamId) next.leagueSchedule = enforcePlayerStrictAlternation(next.leagueSchedule, teamId, true);
  }
  if (next.leagueRoundCursor === undefined) next.leagueRoundCursor = 0;
  if (!next.leagueMatchResults || typeof next.leagueMatchResults !== 'object') next.leagueMatchResults = {};
  if (next.explodeUsedThisQuarter === undefined) next.explodeUsedThisQuarter = false;

  return next;
}

function estimateRankingFromPoints(points, monthsPlayed, leagueSize = 20) {
  const played = Math.max(0, monthsPlayed || 0);
  if (played === 0) return 1;

  const size = Math.max(2, leagueSize || 20);

  // 3 quarters * 3 months = 9 months per season. Champion pace ~84 points.
  const championPacePerMonth = 28 / 3;
  const target = championPacePerMonth * played;
  const diff = target - (points || 0);

  if (diff <= 0) return 1;

  // Roughly map points gap to ranking gap. Previously we capped at 8, which locked
  // the UI when league table is unavailable (e.g., after team switch / legacy saves).
  const pointsPerRank = 3;
  const estimatedRanking = 1 + Math.floor(diff / pointsPerRank);

  return Math.min(size, Math.max(1, estimatedRanking));
}

function gaussianRandom(mean, stdDev) {
  let u = 0;
  let v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + z * stdDev;
}

function clampNumber(value, min, max) {
  const v = typeof value === 'number' ? value : 0;
  return Math.min(max, Math.max(min, v));
}

function sampleMatchPoints(homeStrength, awayStrength) {
  const diff = (homeStrength || 0) - (awayStrength || 0);
  const absDiff = Math.abs(diff);
  const baseDraw = 0.34;
  const drawProb = clampNumber(baseDraw - absDiff * 0.05, 0.18, 0.40);
  const k = 0.75;
  const homeWinRaw = 1 / (1 + Math.exp(-diff * k));
  const homeWinProb = (1 - drawProb) * homeWinRaw;

  const r = Math.random();
  if (r < homeWinProb) return { homePoints: 3, awayPoints: 0 };
  if (r < homeWinProb + drawProb) return { homePoints: 1, awayPoints: 1 };
  return { homePoints: 0, awayPoints: 3 };
}

function shuffleInPlace(arr) {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

function getRoundsThisMonth(leagueSize, monthInSeason) {
  const size = leagueSize || 20;
  const m = monthInSeason || 1;
  if (size === 18) {
    return m <= 7 ? 4 : 3;
  }
  return m <= 2 ? 5 : 4;
}

function getPlayerSideInRound(round, playerId) {
  const fixtures = round?.fixtures || [];
  for (let i = 0; i < fixtures.length; i += 1) {
    const f = fixtures[i];
    if (f.homeId === playerId) return 'home';
    if (f.awayId === playerId) return 'away';
  }
  return null;
}

function enforcePlayerStrictAlternation(rounds, playerId, startHome) {
  if (!Array.isArray(rounds) || !playerId) return rounds;

  const out = rounds.map(r => ({
    ...(r || {}),
    fixtures: Array.isArray(r?.fixtures) ? r.fixtures.map(f => ({ ...(f || {}) })) : []
  }));

  const startIsHome = Boolean(startHome);
  for (let i = 0; i < out.length; i += 1) {
    const wantHome = startIsHome ? (i % 2 === 0) : (i % 2 !== 0);
    const wantSide = wantHome ? 'home' : 'away';
    const side = getPlayerSideInRound(out[i], playerId);
    if (!side || side === wantSide) continue;

    const fixtures = out[i].fixtures || [];
    const idx = fixtures.findIndex(f => f && (f.homeId === playerId || f.awayId === playerId));
    if (idx < 0) continue;
    const f = fixtures[idx];
    fixtures[idx] = { homeId: f.awayId, awayId: f.homeId };
    out[i].fixtures = fixtures;
  }

  return out;
}

function generateSingleRoundRobin(teamIds) {
  const teams = teamIds.slice();
  const n = teams.length;
  if (n < 2) return [];
  if (n % 2 !== 0) teams.push('bye');

  const fixed = teams[0];
  let rot = teams.slice(1);
  const rounds = [];
  const roundsCount = teams.length - 1;

  for (let r = 0; r < roundsCount; r += 1) {
    const fixtures = [];
    const a = fixed;
    const b = rot[0];
    if (a !== 'bye' && b !== 'bye') {
      if (r % 2 === 0) fixtures.push({ homeId: a, awayId: b });
      else fixtures.push({ homeId: b, awayId: a });
    }

    for (let i = 1; i < rot.length / 2; i += 1) {
      const t1 = rot[i];
      const t2 = rot[rot.length - i];
      if (t1 === 'bye' || t2 === 'bye') continue;
      if ((r + i) % 2 === 0) fixtures.push({ homeId: t1, awayId: t2 });
      else fixtures.push({ homeId: t2, awayId: t1 });
    }

    rounds.push({ fixtures });
    rot = [rot[rot.length - 1], ...rot.slice(0, rot.length - 1)];
  }

  return rounds;
}

function invertRound(round) {
  const fixtures = (round?.fixtures || []).map(f => ({ homeId: f.awayId, awayId: f.homeId }));
  return { fixtures };
}

function buildLeagueSchedule({ leagueId, playerTeamId, opponents }) {
  const roster = getLeagueRoster(leagueId) || [];
  const ordered = roster
    .filter(t => t && t.id)
    .slice()
    .sort((a, b) => (a.leagueIndex || 0) - (b.leagueIndex || 0))
    .map(t => t.id);

  const teamIds = ordered.includes(playerTeamId)
    ? ordered
    : [playerTeamId, ...((opponents || []).map(o => o.id))];

  const firstHalf = generateSingleRoundRobin(teamIds);
  const secondHalf = firstHalf.map(invertRound);

  const schedule = [...firstHalf, ...secondHalf];
  return enforcePlayerStrictAlternation(schedule, playerTeamId, true);
}

function buildLeagueOpponents({ leagueId, playerTeamId, playerTactics }) {
  const roster = getLeagueRoster(leagueId) || [];
  const base = roster
    .filter(t => t && t.id && t.id !== playerTeamId)
    .slice()
    .sort((a, b) => (a.leagueIndex || 0) - (b.leagueIndex || 0));
  if (base.length === 0) return [];

  const pt = clampNumber(playerTactics, 0, 10);
  const mean = pt >= 9
    ? clampNumber(8.2 + (pt - 9) * 0.4, 0, 9)
    : pt;
  const stdDev = pt >= 9 ? 0.65 : 1.0;

  return base.map(t => {
    const seeded = typeof t.opponentBaseTactics === 'number' ? t.opponentBaseTactics : null;
    const raw = seeded !== null ? seeded : (Math.round(gaussianRandom(mean, stdDev) * 2) / 2);
    // avoid too-easy leagues: keep a reasonable floor, but still allow weak teams
    const baseTactics = clampNumber(raw, 3, 10);
    return {
      id: t.id,
      name: t.name,
      leagueIndex: t.leagueIndex,
      baseTactics,
      tactics: baseTactics,
      points: 0
    };
  });
}

function computeRankingFromLeague({ playerPoints, playerTactics, opponents }) {
  const rows = [
    { id: 'player', points: playerPoints || 0, tactics: playerTactics || 0 },
    ...((opponents || []).map(o => ({ id: o.id, points: o.points || 0, tactics: o.tactics || 0 })))
  ];

  rows.sort((a, b) => {
    if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
    if ((b.tactics || 0) !== (a.tactics || 0)) return (b.tactics || 0) - (a.tactics || 0);
    return String(a.id).localeCompare(String(b.id));
  });

  const idx = rows.findIndex(r => r.id === 'player');
  return idx >= 0 ? idx + 1 : 1;
}

function monthsPlayedFromState(state) {
  if (!state) return 0;
  return (state.quarter - 1) * 3 + (state.month - 1);
}

function redirectNegativeStatEffect(stats, key, delta) {
  if (!stats) return { key, delta };
  if (delta >= 0) return { key, delta };
  if (key === 'authority' && stats.authority === 0) return { key: 'boardSupport', delta };
  if (key === 'mediaSupport' && stats.mediaSupport === 0) return { key: 'dressingRoom', delta };
  return { key, delta };
}

function enforceRainbowArmband(stats, activeBuffs) {
  if (!stats || stats.mediaSupport === undefined) return;
  if (!activeBuffs || !activeBuffs.includes('rainbow_armband')) return;
  stats.mediaSupport = Math.max(10, stats.mediaSupport);
}

function enforceEmmaCamera(stats, activeBuffs) {
  if (!stats || stats.mediaSupport === undefined) return;
  if (!activeBuffs || !activeBuffs.includes('dortmund_emma_camera')) return;
  stats.mediaSupport = Math.max(40, stats.mediaSupport);
}

function enforceYouthUnity10Floor(stats, youthSquadPlayers) {
  if (!stats || stats.dressingRoom === undefined) return;
  const youthProfile = getYouthSquadProfile(youthSquadPlayers);
  if (!youthProfile.hasArmbandUnity10) return;
  stats.dressingRoom = Math.max(40, clampNumber(stats.dressingRoom, 0, 100));
}

function applyKopFreeze({ stats, activeBuffs, specialMechanicState }) {
  if (!stats) return { stats, specialMechanicState };
  const buffs = Array.isArray(activeBuffs) ? activeBuffs : [];
  const hasKopQuarter = buffs.includes('kop_freeze_quarter');
  const hasKopSeason = buffs.includes('kop_freeze_season');
  if (!hasKopQuarter && !hasKopSeason) return { stats, specialMechanicState };

  const nextSpecial = { ...(specialMechanicState || {}) };
  if (typeof nextSpecial.kopFreezeTriggered !== 'boolean') nextSpecial.kopFreezeTriggered = false;
  if (typeof nextSpecial.kopFreezeRemainingQuarters !== 'number') nextSpecial.kopFreezeRemainingQuarters = 0;

  const duration = hasKopSeason ? 4 : 1;
  nextSpecial.kopFreezeDurationQuarters = duration;

  const boardSupport = typeof stats.boardSupport === 'number' ? stats.boardSupport : 0;
  if (!nextSpecial.kopFreezeTriggered && boardSupport < 20) {
    nextSpecial.kopFreezeTriggered = true;
    nextSpecial.kopFreezeRemainingQuarters = duration;
  }

  if ((nextSpecial.kopFreezeRemainingQuarters || 0) > 0) {
    const nextStats = { ...stats, boardSupport: Math.max(20, boardSupport) };
    return { stats: nextStats, specialMechanicState: nextSpecial };
  }

  return { stats, specialMechanicState: nextSpecial };
}

function syncDerivedBuffs({ activeBuffs, stats, teamId, specialMechanicState }) {
  const dynamicBuffs = ['media_darling', 'media_hostile', 'turmoil', 'closed_canteen'];
  const next = new Set((activeBuffs || []).filter(b => !dynamicBuffs.includes(b)));

  if (stats && stats.mediaSupport !== undefined) {
    if (stats.mediaSupport > 80) {
      next.add('media_darling');
    } else if (stats.mediaSupport < 40) {
      next.add('media_hostile');
    }
  }

  if (stats && stats.dressingRoom !== undefined && stats.dressingRoom < 40) {
    next.add('turmoil');
  }

  if (teamId === 'man_utd' && specialMechanicState && specialMechanicState.canteenOpen === false) {
    next.add('closed_canteen');
  }

  return Array.from(next);
}

function buildTabloidBreakingEvent(nextEvent = null) {
  return {
    id: 'tabloid_breaking',
    title: 'Breaking！！',
    description: '月亮报为您带来有关[俱乐部名字]主教练[教练名字]的独家报道，就在今日头版。点击即可查看！',
    options: [
      {
        text: '点击查看',
        effects: {},
        nextEvent: {
          id: 'tabloid_headline',
          title: '头条新闻',
          description: '你的丑闻被曝光，引来轩然大波。管理层对你很不满意，你在新闻报道中的口碑也下降了。',
          effects: { mediaSupport: -15, boardSupport: -10 },
          nextEvent
        }
      }
    ]
  };
}

function buildMusialaBayernEasterEggEvent() {
  return {
    id: 'musiala_bayern_easter_egg',
    title: '欢迎执教',
    description: '队员们对你的上任面面相觑。最后，管理层拨通了穆勒的电话，对方骑着马赶来，迅速把你带走了，并告诉你闲着的时候可以来打线上羊头牌，而不是坐在主教练的位置上。',
    options: [{ text: '好吧……', effects: {}, setPendingGameState: 'start' }]
  };
}

 function isXaviName(name) {
   const n = (name || '').trim().toLowerCase();
   return n === '哈维' || n === 'xavi' || n === 'xavier';
 }

 function isGuardiolaName(name) {
   const n = (name || '').trim().toLowerCase();
   return n === '瓜迪奥拉' || n === 'guardiola' || n === 'pep guardiola';
 }

 function isCruyffName(name) {
   const n = (name || '').trim().toLowerCase();
   return n === '克鲁伊夫' || n === 'cruyff' || n === 'johan cruyff';
 }

 function isAncelottiName(name) {
   const n = (name || '').trim().toLowerCase();
   return n === '安切洛蒂' || n === 'ancelotti' || n === 'carlo ancelotti';
 }

function isMourinhoName(name) {
  const n = (name || '').trim().toLowerCase();
  return n === '穆里尼奥' || n === 'mourinho' || n === 'jose mourinho';
}

function isGerrardName(name) {
  const n = (name || '').trim().toLowerCase();
  return n === '杰拉德' || n === 'gerrard' || n === 'steven gerrard';
}

function isAlonsoName(name) {
  const n = (name || '').trim().toLowerCase();
  return n === '阿隆索' || n === '哈维阿隆索' || n === 'xabi alonso' || n === 'alonso';
}

function isArtetaName(name) {
  const n = (name || '').trim().toLowerCase();
  return n === '阿尔特塔' || n === '米克尔阿尔特塔' || n === 'arteta' || n === 'mikel arteta';
}

function isMaldiniName(name) {
  const n = (name || '').trim().toLowerCase();
  return n === '马尔蒂尼' || n === 'maldini' || n === 'paolo maldini';
}

function isNestaName(name) {
  const n = (name || '').trim().toLowerCase();
  return n === '内斯塔' || n === 'nesta' || n === 'alessandro nesta';
}

function isKloppName(name) {
  const n = (name || '').trim().toLowerCase();
  return n === '克洛普' || n === 'klopp' || n === 'jurgen klopp' || n === 'jürgen klopp';
}

function isNevilleName(name) {
  const n = (name || '').trim().toLowerCase();
  return n === '内维尔' || n === 'neville' || n === 'gary neville';
}

function isCarragherName(name) {
  const n = (name || '').trim().toLowerCase();
  return n === '卡拉格' || n === 'carragher' || n === 'jamie carragher';
}

function isMusialaName(name) {
  const n = (name || '').trim().toLowerCase();
  return n === '穆夏拉' || n === '穆西亚拉' || n === 'musiala';
}

function isInzaghiName(name) {
  const n = (name || '').trim().toLowerCase();
  return n === '因扎吉' || n === 'inzaghi' || n === 'filippo inzaghi' || n === 'simone inzaghi' || n === '皮波因扎吉' || n === '西蒙尼因扎吉';
}

function isPiqueName(name) {
  const n = (name || '').trim().toLowerCase();
  return n === '皮克' || n === '杰拉德皮克' || n === 'pique' || n === 'piqué' || n === 'gerard pique' || n === 'gerard piqué';
}

function isKakaName(name) {
  const n = (name || '').trim().toLowerCase();
  return n === '卡卡' || n === 'kaka' || n === 'kaká';
}

 function applyYouthPromotionAchievements(state, promotedPlayer) {
  const p = normalizeYouthPlayer(promotedPlayer);
  if (!p) return state;

  const teamId = state.currentTeam?.id;
  const n = (p.name || '').trim().toLowerCase();
  let next = state;

  if (teamId === 'real_madrid') {
    if (n === '劳尔' || n === 'raul') {
      next = unlockAchievementInState(next, 'youth_raul_madridista');
    }
  }

  {
    const coachNameNorm = (state.playerName || '').trim().toLowerCase();
    if (coachNameNorm && n && coachNameNorm === n) {
      next = unlockAchievementInState(next, 'youth_inheritance');
    }
  }

  if (teamId === 'fc_barcelona') {
    if (n === '伊涅斯塔' || n === '小白' || n === 'iniesta' || n === 'andres iniesta' || n === 'andrés iniesta') {
      next = unlockAchievementInState(next, 'youth_iniesta_croquette');
    }
  }

  if (teamId === 'bayern_munich') {
    if (n === '穆勒' || n === 'muller' || n === 'müller' || n === 'thomas muller' || n === 'thomas müller') {
      next = unlockAchievementInState(next, 'youth_muller_bayern');
    }
  }
  if (teamId === 'liverpool') {
    if (n === '杰拉德' || n === 'gerrard' || n === 'steven gerrard') {
      next = unlockAchievementInState(next, 'youth_gerrard_liverpool');
    }
    if (n === '若塔' || n === 'jota' || n === 'diogo jota') {
      next = unlockAchievementInState(next, 'youth_jota_liverpool');
    }
  }
  if (teamId === 'ac_milan') {
    if (n === '马尔蒂尼' || n === 'maldini' || n === 'paolo maldini') {
      next = unlockAchievementInState(next, 'youth_maldini_milan');
    }
  }
  if (teamId === 'man_utd') {
    if (n === '弗格森' || n === 'ferguson' || n === 'sir alex ferguson') {
      next = unlockAchievementInState(next, 'youth_ferguson_manutd');
    }
    if (n === '贝克汉姆' || n === 'beckham' || n === 'david beckham') {
      next = unlockAchievementInState(next, 'youth_beckham_manutd');
    }
  }
  if (teamId === 'chelsea') {
    if (n === '特里' || n === 'terry' || n === 'john terry') {
      next = unlockAchievementInState(next, 'youth_terry_chelsea');
    }
  }
  if (teamId === 'dortmund') {
    if (n === '罗伊斯' || n === 'reus' || n === 'marco reus') {
      next = unlockAchievementInState(next, 'youth_reus_dortmund');
    }
  }
  if (teamId === 'arsenal') {
    if (n === '威尔希尔' || n === 'wilshere' || n === 'jack wilshere') {
      next = unlockAchievementInState(next, 'youth_wilshere_arsenal');
    }
  }

  if ((p.negativeTraitId || '') === 'mixer') {
    const mixerNameSet = new Set([
      '菲戈',
      '欧文',
      '多纳鲁马',
      '卡尔',
      '阿诺德',
      '莫拉塔',
      '格策',
      'figo',
      'owen',
      'donnarumma',
      'karl',
      'arnold',
      'morata',
      'gotze',
      'götze'
    ]);
    if (mixerNameSet.has((p.name || '').trim()) || mixerNameSet.has(n)) {
      next = unlockAchievementInState(next, 'youth_mixer_deserved');
    }
  }

  const tactics = clampNumber(state.stats?.tactics ?? 0, 0, 10);
  const tech = clampNumber(p.tech ?? 0, 0, 10);
  if (tech < tactics) {
    next = unlockAchievementInState(next, 'youth_shortcoming');
  }

  return next;
 }

function unlockAchievementInState(state, id) {
  if (!id) return state;
  if (state?.achievementsUnlocked && state.achievementsUnlocked[id]) return state;

  const unlockedAt = new Date().toISOString();
  const nextUnlocked = {
    ...(state.achievementsUnlocked || {}),
    [id]: { unlockedAt, seen: false }
  };

  const nextQueue = [...(state.achievementToastQueue || []), { id, unlockedAt }];

  return {
    ...state,
    achievementsUnlocked: nextUnlocked,
    achievementToastQueue: nextQueue
  };
}

function buildArtetaExHusbandEvent({ firedBy }) {
  const effects = firedBy === 'dressingRoom' ? { dressingRoom: 10 } : { boardSupport: 10 };
  return {
    id: 'arteta_ex_husband',
    title: '你的前夫很关心你',
    description: '下课风波？阿森纳名宿范佩西表示：你们应该给他时间\n近日，有关阿森纳俱乐部要解雇主帅的消息沸沸扬扬。阿森纳名宿（也是曼联的）范佩西表示，阿森纳不应该解雇阿尔特塔。他说：“你们应该相信他，给他更多时间。为什么？你问我为什么？因为我就是相信他能行的。”',
    effects
  };
}

function buildQuarterExpectationEvent({ quarter, ranking, points, metExpectation, authority }) {
  const quarterTextMap = { 1: '一', 2: '二', 3: '三', 4: '四' };
  const quarterText = quarterTextMap[quarter] || String(quarter);

  if (metExpectation) {
    return {
      id: 'quarter_expectation_report',
      title: `第${quarterText}个季度答卷`,
      description: `你以第${ranking}名和${points}分交出了第${quarterText}个季度的答卷。高层对你的执教很满意。`,
      effects: { boardSupport: 10 }
    };
  }

  if (authority < 70) {
    return {
      id: 'quarter_expectation_report',
      title: `第${quarterText}个季度答卷`,
      description: `你以第${ranking}名和${points}分交出了第${quarterText}个季度的答卷。很明显，管理层对这个成绩并不满意，他们要求更高的排名。即使那扇象征高层核心的大门总是对你紧闭，你也能听到会议中已有试图更换你的窃窃私语。`,
      effects: { boardSupport: -25 }
    };
  }

  return {
    id: 'quarter_expectation_report',
    title: `第${quarterText}个季度答卷`,
    description: `你以第${ranking}名和${points}分交出了第${quarterText}个季度的答卷。很明显，管理层对这个成绩并不满意，他们要求更高的排名。你出席了高层的会议，大家对俱乐部的未来展开了讨论。坐在椅子上的三小时里，你能感受到许多不怀好意的目光。`,
    effects: { boardSupport: -25 }
  };
}

function buildSeasonSettlementEvent({ seasonYear, ranking, points, champion, uclQualifiedNextSeason }) {
  const uclLine = uclQualifiedNextSeason
    ? '你拿到了下赛季的欧冠席位。'
    : '你没有拿到下赛季的欧冠资格。';
  if (champion) {
    return {
      id: 'season_settlement',
      seasonYear,
      ranking,
      champion: true,
      title: `第${seasonYear}赛季结算`,
      description: `你以第${ranking}名和${points}分结束了第${seasonYear}个赛季。冠军属于你。${uclLine}`,
      effects: {}
    };
  }

  return {
    id: 'season_settlement',
    seasonYear,
    ranking,
    champion: false,
    title: `第${seasonYear}赛季结算`,
    description: `你以第${ranking}名和${points}分结束了第${seasonYear}个赛季。赛季结束，新的挑战即将开始。${uclLine}`,
    effects: {}
  };
}

function buildGerrardLetterEvent() {
  return {
    id: 'gerrard_letter',
    title: '杰拉德的来信',
    description: '亲爱的Xabi，\n我很抱歉听到你离开[俱乐部]的消息。虽然现在才给你发消息可能有些晚，但我想问……你愿意来利物浦执教吗？你知道的，这里的所有人都希望你来（包括我）。如果你愿意，我一定会说服他们立刻给你offer的！',
    options: [
      { text: 'You’ll never walk alone（前往利物浦执教）', effects: {}, switchTeamId: 'liverpool', grantBuff: 'istanbul_kiss' },
      { text: '礼貌拒绝（正式下课，重新开始新游戏）', effects: {}, setPendingGameState: 'gameover' }
    ]
  };
}

function _buildTabloidStalkingIntroEvent() {
  return {
    id: 'tabloid_stalking_intro',
    title: '月亮报的盯梢',
    description: '月亮报一直在悉心打探足球圈的各种八卦，其中自然也包括教练。作为站稳了脚跟的豪门主帅，你的门口被安排了连夜盯梢的小报记者。同时，也许是你的竞争对手意识到了这点——当你去打探消息的时候，这些老奸巨猾的家伙变得更加沉默了。',
    options: [{ text: '我知道了', effects: {} }]
  };
}

function cloneAndReplaceEventText(event, state) {
  if (!event) return null;
  const cloned = { ...event };

  const leagueId = state?.currentTeam?.leagueId;
  const leagueName = leagueId === 'epl'
    ? '英超'
    : (leagueId === 'laliga'
      ? '西甲'
      : (leagueId === 'serie_a'
        ? '意甲'
        : (leagueId === 'bundesliga' ? '德甲' : '联赛')));

  const youthArr = Array.isArray(state?.youthSquadPlayers) ? state.youthSquadPlayers.map(normalizeYouthPlayer).filter(Boolean) : [];
  const primaryYouth = youthArr.length > 0 ? youthArr[0] : null;
  const youthName = String(primaryYouth?.name || '').trim() || '未命名';

  if (primaryYouth?.id) {
    cloned.youthTargetId = primaryYouth.id;
    cloned.youthTargetName = youthName;
  }

  if (cloned.description) {
    cloned.description = cloned.description
      .replace(/\[名字\]/g, state.playerName)
      .replace(/\[青训名字\]/g, youthName)
      .replace(/\[俱乐部\]/g, state.currentTeam.name)
      .replace(/\[执教理念\]/g, state.coachingPhilosophy)
      .replace(/\[教练名字\]/g, state.playerName)
      .replace(/\[俱乐部名字\]/g, state.currentTeam.name)
      .replace(/\[联赛名\]/g, leagueName);
  }

  if (cloned.options) {
    cloned.options = cloned.options.map(opt => ({
      ...opt,
      text: opt.text
        .replace(/\[名字\]/g, state.playerName)
        .replace(/\[青训名字\]/g, youthName)
        .replace(/\[俱乐部\]/g, state.currentTeam.name)
        .replace(/\[执教理念\]/g, state.coachingPhilosophy)
        .replace(/\[教练名字\]/g, state.playerName)
        .replace(/\[俱乐部名字\]/g, state.currentTeam.name)
        .replace(/\[联赛名\]/g, leagueName),
      outcomeText: opt.outcomeText
        ? String(opt.outcomeText)
          .replace(/\[名字\]/g, state.playerName)
          .replace(/\[青训名字\]/g, youthName)
          .replace(/\[俱乐部\]/g, state.currentTeam.name)
          .replace(/\[执教理念\]/g, state.coachingPhilosophy)
          .replace(/\[教练名字\]/g, state.playerName)
          .replace(/\[俱乐部名字\]/g, state.currentTeam.name)
          .replace(/\[联赛名\]/g, leagueName)
        : opt.outcomeText,
      confirmText: opt.confirmText
        ? String(opt.confirmText)
          .replace(/\[名字\]/g, state.playerName)
          .replace(/\[青训名字\]/g, youthName)
          .replace(/\[俱乐部\]/g, state.currentTeam.name)
          .replace(/\[执教理念\]/g, state.coachingPhilosophy)
          .replace(/\[教练名字\]/g, state.playerName)
          .replace(/\[俱乐部名字\]/g, state.currentTeam.name)
          .replace(/\[联赛名\]/g, leagueName)
        : opt.confirmText
    }));
  }

  return cloned;
}

function appendEventToTail(baseEvent, tailEvent) {
  if (!baseEvent) return tailEvent || null;
  if (!tailEvent) return baseEvent;

  const seen = new Set();

  const visit = (ev) => {
    if (!ev) return tailEvent;
    const id = typeof ev.id === 'string' ? ev.id : null;
    if (id && seen.has(id)) return ev;
    if (id) seen.add(id);

    if (Array.isArray(ev.options) && ev.options.length > 0) {
      return {
        ...ev,
        options: ev.options.map(opt => {
          if (!opt) return opt;
          if (opt.nextEvent) {
            return { ...opt, nextEvent: visit(opt.nextEvent) };
          }
          return { ...opt, nextEvent: tailEvent };
        })
      };
    }

    if (ev.nextEvent) {
      return { ...ev, nextEvent: visit(ev.nextEvent) };
    }

    return { ...ev, nextEvent: tailEvent };
  };

  return visit(baseEvent);
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return {
        ...state,
        gameState: action.payload?.gameState || 'playing'
      };

    case 'MARK_SEASON2_TUTORIAL_SHOWN': {
      if (state.season2TutorialShown) return state;
      return {
        ...state,
        season2TutorialShown: true
      };
    }

    case 'MARK_YOUTH_ONBOARDING_SHOWN': {
      if (state.youthOnboardingShown) return state;
      return {
        ...state,
        youthOnboardingShown: true
      };
    }

    case 'DEQUEUE_ACHIEVEMENT_TOAST': {
      if (!state.achievementToastQueue || state.achievementToastQueue.length === 0) return state;
      return {
        ...state,
        achievementToastQueue: state.achievementToastQueue.slice(1)
      };
    }

    case 'MARK_ALL_ACHIEVEMENTS_SEEN': {
      const prev = state.achievementsUnlocked || {};
      const next = { ...prev };
      Object.keys(next).forEach(id => {
        next[id] = { ...(next[id] || {}), seen: true };
      });
      return {
        ...state,
        achievementsUnlocked: next
      };
    }

    case 'HIDE_BUFF': {
      const id = action.payload?.id;
      if (!id) return state;
      const prev = Array.isArray(state.hiddenBuffs) ? state.hiddenBuffs : [];
      if (prev.includes(id)) return state;
      return {
        ...state,
        hiddenBuffs: [...prev, id]
      };
    }

    case 'START_GAME': {
      const team = teamsData.find(t => t.id === action.payload.teamId);

      // Easter egg: Gerrard coaching Man Utd -> instant gameover
      if (team && team.id === 'man_utd' && isGerrardName(action.payload.playerName)) {
        return unlockAchievementInState({
          ...initialState,
          gameState: 'gameover',
          currentTeam: team,
          playerName: action.payload.playerName,
          coachingPhilosophy: action.payload.coachingPhilosophy,
          stats: { ...team.initialStats, injuryRisk: 0 },
          gameoverOverrideText: '你不愿意执教曼联，曼联球迷也对你深恶痛绝。恭喜你，你达成了最速下课传说！'
        }, 'gerrard_manutd');
      }

      const baseStats = team ? { ...team.initialStats, injuryRisk: 0 } : { injuryRisk: 0 };
      const baseBuffs = [];
      let nextStartSpecialState = { ...initialState.specialMechanicState };

      // Easter egg: Mourinho coaching Arsenal / Man City (with confirmation) -> debuff + lower stats
      if (team && isMourinhoName(action.payload.playerName) && action.payload.confirmMourinho === true) {
        if (team.id === 'arsenal') {
          baseStats.boardSupport = Math.max(0, Math.min(100, (baseStats.boardSupport ?? 0) - 50));
          baseBuffs.push('legacy_issues');
        }
        if (team.id === 'man_city') {
          baseStats.dressingRoom = Math.max(0, Math.min(100, (baseStats.dressingRoom ?? 0) - 50));
          baseBuffs.push('legacy_issues_mop');
        }
      }

      if (team && team.id === 'chelsea') {
        baseBuffs.push('chelsea_sack_pressure');
      }
      if (team && team.id === 'dortmund') {
        baseBuffs.push('dortmund_emma_camera');
        baseBuffs.push('dortmund_unlicensed');
      }
      if (team && team.id === 'fc_barcelona') {
        baseBuffs.push('barca_board_take');
      }

      if (team && team.id === 'man_city') {
        baseBuffs.push('man_city_auto_flirt');
      }

      if (team && team.id === 'ac_milan') {
        const used = Array.isArray(nextStartSpecialState.milanLegendsUsedThisSeason)
          ? nextStartSpecialState.milanLegendsUsedThisSeason.slice()
          : [];
        const all = ['milan_baresi', 'milan_nesta', 'milan_maldini'];
        const remaining = all.filter(id => !used.includes(id));
        if (remaining.length > 0) {
          const picked = remaining[Math.floor(Math.random() * remaining.length)];
          used.push(picked);
          nextStartSpecialState = { ...nextStartSpecialState, milanLegendsUsedThisSeason: used };
          baseBuffs.push(picked);
        }
      }

      if (team && team.id === 'bayern_munich') {
        baseBuffs.push('bayern_committee');
        baseBuffs.push('bayern_history_proof');
        nextStartSpecialState = { ...nextStartSpecialState, bayernDressingRoomRevealed: false, bayernCommitteeRemoved: false };
      }

      if (team && team.id === 'liverpool') {
        if (isKloppName(action.payload.playerName)) {
          baseBuffs.push('kop_freeze_season');
          nextStartSpecialState = { ...nextStartSpecialState, kopFreezeDurationQuarters: 4 };
        } else {
          baseBuffs.push('kop_freeze_quarter');
          nextStartSpecialState = { ...nextStartSpecialState, kopFreezeDurationQuarters: 1 };
        }

        if (isAlonsoName(action.payload.playerName)) {
          baseBuffs.push('istanbul_kiss');
        }
      }

      const leagueId = team?.leagueId || 'epl';
      const leagueOpponents = buildLeagueOpponents({ leagueId, playerTeamId: team?.id, playerTactics: baseStats.tactics });
      const leagueSchedule = buildLeagueSchedule({ leagueId, playerTeamId: team?.id, opponents: leagueOpponents });

      let nextStartState = {
        ...initialState,
        gameState: 'playing',
        currentTeam: team,
        playerName: action.payload.playerName,
        coachingPhilosophy: action.payload.coachingPhilosophy,
        stats: baseStats,
        activeBuffs: baseBuffs,
        easterEggTriggered: false,
        specialMechanicState: nextStartSpecialState,
        leagueOpponents,
        leagueOpponentCursor: 0,
        leagueSchedule,
        leagueRoundCursor: 0,
        leagueMatchResults: {},
        currentEvent: {
          id: 'intro',
          title: '欢迎执教',
          description: '经过漫长的拉扯和谈判，教练[名字]终于下树，[俱乐部]将在[执教理念]的理念下迎来新的挑战。这位新教练能在此坚持多久呢？[俱乐部]能夺得本赛季的冠军吗？让我们拭目以待！',
          options: [{ text: '开始', effects: {} }]
        }
      };

      if (team && team.id === 'fc_barcelona') {
        nextStartState = {
          ...nextStartState,
          youthAcademyUnlocked: true,
          youthAcademyUnlockPending: false,
          youthAcademyPlayer: generateYouthPlayer({ techMin: 4, techMax: 8 }),
          youthSquadPlayers: [],
          youthRefreshUsedThisQuarter: false
        };
      }

      if (team && team.id === 'dortmund') {
        nextStartState.decisionPoints = 2;
      }

      if (team && team.id === 'arsenal' && isMourinhoName(action.payload.playerName)) {
        nextStartState = unlockAchievementInState(nextStartState, 'mourinho_arsenal');
      }

       if (team && team.id === 'chelsea' && isMourinhoName(action.payload.playerName)) {
         nextStartState = unlockAchievementInState(nextStartState, 'mourinho_chelsea');
         if (!Array.isArray(nextStartState.activeBuffs)) nextStartState.activeBuffs = [];
         if (!nextStartState.activeBuffs.includes('special_one')) nextStartState.activeBuffs.push('special_one');
       }

       if (team && team.id === 'fc_barcelona' && isXaviName(action.payload.playerName)) {
         nextStartState = unlockAchievementInState(nextStartState, 'xavi_barca');
       }
       if (team && team.id === 'fc_barcelona' && isGuardiolaName(action.payload.playerName)) {
         nextStartState = unlockAchievementInState(nextStartState, 'guardiola_barca');
       }
       if (team && team.id === 'fc_barcelona' && isCruyffName(action.payload.playerName)) {
         nextStartState = unlockAchievementInState(nextStartState, 'cruyff_barca');
       }

       if (isAncelottiName(action.payload.playerName)) {
         nextStartState = unlockAchievementInState(nextStartState, 'ancelotti_eye');
       }

      if (team && team.id === 'ac_milan' && isMaldiniName(action.payload.playerName)) {
        nextStartState = unlockAchievementInState(nextStartState, 'maldini_coach_milan');
      }
      if (team && team.id === 'ac_milan' && isNestaName(action.payload.playerName)) {
        nextStartState = unlockAchievementInState(nextStartState, 'nesta_coach_milan');
      }
      if (team && team.id === 'ac_milan' && isKakaName(action.payload.playerName) && Array.isArray(baseBuffs) && baseBuffs.includes('milan_nesta')) {
        nextStartState = unlockAchievementInState(nextStartState, 'kaka_milan_nesta');
      }

      if (team && team.id === 'real_madrid' && isPiqueName(action.payload.playerName)) {
        nextStartState = unlockAchievementInState(nextStartState, 'pique_real_madrid');
      }

      if (team && team.id === 'man_city' && isGuardiolaName(action.payload.playerName)) {
        nextStartState = unlockAchievementInState(nextStartState, 'guardiola_man_city');
      }
      if (team && team.id === 'man_city' && isMourinhoName(action.payload.playerName) && action.payload.confirmMourinho === true) {
        nextStartState = unlockAchievementInState(nextStartState, 'mourinho_man_city');
      }

      if (isNevilleName(action.payload.playerName) || isCarragherName(action.payload.playerName)) {
        nextStartState = unlockAchievementInState(nextStartState, 'neville_carragher_coach');
      }
      if (isInzaghiName(action.payload.playerName)) {
        nextStartState = unlockAchievementInState(nextStartState, 'inzaghi_coach');
      }

      return nextStartState;
    }

    case 'OPEN_GERRARD_LETTER':
        return {
            ...state,
            gameState: 'playing',
            currentEvent: buildGerrardLetterEvent(),
            queuedEvent: null,
            pendingGameState: 'gameover',
            easterEggTriggered: true
        };

    case 'OPEN_ARTETA_EX_HUSBAND': {
        const firedBy = state.stats?.dressingRoom <= 0 ? 'dressingRoom' : 'boardSupport';
        return unlockAchievementInState({
            ...state,
            gameState: 'playing',
            currentEvent: buildArtetaExHusbandEvent({ firedBy }),
            queuedEvent: null,
            pendingGameState: null,
            artetaEasterEggTriggered: true
        }, 'arteta_ex_husband');
    }

    case 'REQUEST_MANUAL_SAVE':
        return {
            ...state,
            pendingSave: { type: 'manual', slot: action.payload?.slot }
        };

    case 'REQUEST_AUTO_SAVE':
        return {
            ...state,
            pendingSave: { type: 'auto' }
        };

    case 'CLEAR_PENDING_SAVE':
        return {
            ...state,
            pendingSave: null
        }

    case 'LOAD_GAME': {
        const next = hydrateLoadedState(action.payload);
        if (next) {
            let loaded = next;
            const team = teamsData.find(t => t.id === loaded.currentTeam.id);
            if (team) {
                const leagueId = team.leagueId || 'epl';
                const leagueOpponents = buildLeagueOpponents({ leagueId, playerTeamId: team.id, playerTactics: loaded.stats.tactics });
                const leagueSchedule = buildLeagueSchedule({ leagueId, playerTeamId: team.id, opponents: leagueOpponents });
                loaded.leagueOpponents = leagueOpponents;
                loaded.leagueSchedule = leagueSchedule;
            }

            const y = Number(loaded.year ?? 1);
            if (y >= 6) {
              const teamId = loaded.currentTeam?.id;
              if (teamId === 'real_madrid') loaded = unlockAchievementInState(loaded, 'rm_5_years');
              else if (teamId === 'ac_milan') loaded = unlockAchievementInState(loaded, 'ac_milan_5_years');
              else if (teamId === 'fc_barcelona') loaded = unlockAchievementInState(loaded, 'barca_5_years');
              else if (teamId === 'dortmund') loaded = unlockAchievementInState(loaded, 'dortmund_5_years');
              else if (teamId === 'chelsea') loaded = unlockAchievementInState(loaded, 'chelsea_5_years');
              else if (teamId === 'liverpool') loaded = unlockAchievementInState(loaded, 'liverpool_5_years');
              else if (teamId === 'arsenal') loaded = unlockAchievementInState(loaded, 'arsenal_5_years');
              else if (teamId === 'man_utd') loaded = unlockAchievementInState(loaded, 'manutd_5_years');
              else if (teamId === 'bayern_munich') loaded = unlockAchievementInState(loaded, 'bayern_5_years');
              else if (teamId === 'man_city') loaded = unlockAchievementInState(loaded, 'man_city_5_years');
            }

            return loaded;
        }
        return state;
    }

    case 'UPDATE_STATS': {
      let newStats = { ...state.stats };
      Object.keys(action.payload).forEach(key => {
        const redirected = redirectNegativeStatEffect(newStats, key, action.payload[key]);
        const targetKey = redirected.key;
        const delta = redirected.delta;

        if (newStats[targetKey] !== undefined) {
          newStats[targetKey] += delta;
          
          // Clamp values
          if (['boardSupport', 'dressingRoom', 'mediaSupport', 'authority'].includes(targetKey)) {
             newStats[targetKey] = Math.max(0, Math.min(100, newStats[targetKey]));
          } else if (targetKey === 'tactics') {
             newStats[targetKey] = Math.max(0, Math.min(10, newStats[targetKey]));
          } else if (targetKey === 'funds') {
             newStats[targetKey] = clampFunds(newStats[targetKey], state.currentTeam?.id); // Funds cannot be negative
          } else if (targetKey === 'injuryRisk') {
             newStats[targetKey] = Math.max(0, newStats[targetKey]);
          }
        }
      });

      enforceRainbowArmband(newStats, state.activeBuffs);
      enforceEmmaCamera(newStats, state.activeBuffs);
      enforceYouthUnity10Floor(newStats, state.youthSquadPlayers);

      let nextSpecialStateAfterUpdate = state.specialMechanicState;
      {
        const adjusted = applyKopFreeze({
          stats: newStats,
          activeBuffs: state.activeBuffs,
          specialMechanicState: nextSpecialStateAfterUpdate
        });
        newStats = adjusted.stats;
        nextSpecialStateAfterUpdate = adjusted.specialMechanicState;
      }

      const nextBuffsAfterUpdate = syncDerivedBuffs({
        activeBuffs: state.activeBuffs,
        stats: newStats,
        teamId: state.currentTeam?.id,
        specialMechanicState: nextSpecialStateAfterUpdate
      });
      
      // Check Game Over conditions
      let nextGameStateAfterUpdate = state.gameState;
      if (newStats.boardSupport <= 0 || newStats.dressingRoom <= 0) {
        nextGameStateAfterUpdate = 'gameover';
      }

      let nextEstimatedRankingAfterUpdate = state.estimatedRanking;
      if (!state.pendingSeasonReset && newStats.points !== state.stats.points) {
        const played = monthsPlayedFromState(state);
        const leagueSize = getLeagueRoster(state.currentTeam?.leagueId || 'epl')?.length || 20;
        nextEstimatedRankingAfterUpdate = estimateRankingFromPoints(newStats.points, played, leagueSize);
      }

      let nextStateAfterUpdate = {
        ...state,
        stats: newStats,
        gameState: nextGameStateAfterUpdate,
        activeBuffs: nextBuffsAfterUpdate,
        estimatedRanking: nextEstimatedRankingAfterUpdate,
        specialMechanicState: nextSpecialStateAfterUpdate
      };

      if (nextGameStateAfterUpdate === 'gameover' && !state.gameoverOverrideText) {
        const teamId = state.currentTeam?.id;

        if (!state.artetaEasterEggTriggered && teamId === 'arsenal' && isArtetaName(state.playerName)) {
          const firedBy = newStats.dressingRoom <= 0 ? 'dressingRoom' : 'boardSupport';
          nextStateAfterUpdate = unlockAchievementInState({
            ...nextStateAfterUpdate,
            gameState: 'playing',
            currentEvent: buildArtetaExHusbandEvent({ firedBy }),
            queuedEvent: null,
            pendingGameState: null,
            artetaEasterEggTriggered: true
          }, 'arteta_ex_husband');
        } else if (
          !state.easterEggTriggered &&
          isAlonsoName(state.playerName) &&
          teamId &&
          teamId !== 'man_utd' &&
          teamId !== 'liverpool'
        ) {
          nextStateAfterUpdate = {
            ...nextStateAfterUpdate,
            gameState: 'playing',
            currentEvent: buildGerrardLetterEvent(),
            queuedEvent: null,
            pendingGameState: 'gameover',
            easterEggTriggered: true
          };
        }
      }

      if (nextGameStateAfterUpdate === 'gameover' && state.currentTeam?.id === 'man_utd' && isAlonsoName(state.playerName)) {
        nextStateAfterUpdate = unlockAchievementInState(nextStateAfterUpdate, 'alonso_manutd_fired');
      }

      if (state.year >= 2 && (newStats.injuryRisk ?? 0) >= 5) {
        const after = nextStateAfterUpdate.currentEvent || nextStateAfterUpdate.queuedEvent || null;
        const remainingQueued = nextStateAfterUpdate.currentEvent ? nextStateAfterUpdate.queuedEvent : null;
        nextStateAfterUpdate = {
          ...nextStateAfterUpdate,
          stats: { ...newStats, injuryRisk: Math.max(0, (newStats.injuryRisk ?? 0) - 5) },
          currentEvent: buildInjuryCrisisEvent(after),
          queuedEvent: remainingQueued
        };
      }

      return nextStateAfterUpdate;
    }

    case 'TAKE_DECISION': {
        const { decisionId, type, effects, optionId, optionDescription } = action.payload;

        let effectiveEffects = effects;

        const youthProfile = getYouthSquadProfile(state.youthSquadPlayers);

        if (decisionId === 'training' && youthProfile.hasArmbandDiligence10) {
          const base = effectiveEffects || {};
          const t = typeof base.tactics === 'number' ? base.tactics : 0;
          effectiveEffects = { ...base, tactics: t + 0.5 };
        }

        if (youthProfile.hasArmbandAuthority10 && effectiveEffects && typeof effectiveEffects.authority === 'number' && effectiveEffects.authority < 0) {
          effectiveEffects = { ...effectiveEffects, authority: 0 };
        }

        if (
          decisionId === 'flirtation' &&
          state.year >= 2 &&
          (optionId === 'rival_coach' || optionId === 'foreign_coach')
        ) {
          effectiveEffects = { ...(effectiveEffects || {}), tabloid: 1, tactics: 0.5 };
          delete effectiveEffects.chance_tabloid;
        }

        if (decisionId === 'flirtation' && optionId !== 'legend_flirt') {
          const extraTabloid = getYouthFlirtExtraTabloid(state.youthSquadPlayers);
          if (extraTabloid > 0) {
            const base = effectiveEffects || {};
            const t = typeof base.tabloid === 'number' ? base.tabloid : 0;
            effectiveEffects = { ...base, tabloid: t + extraTabloid };
          }
        }
        
        // Check if decision limit reached (max 3 per month)
        if (state.decisionCountThisMonth >= 3) {
            return state;
        }

        // coffee_ref: only once per quarter
        if (decisionId === 'coffee_ref' && state.coffeeRefUsedThisQuarter) {
            return state;
        }

        if (decisionId === 'press_conference' && optionId === 'explode' && state.explodeUsedThisQuarter) {
            return state;
        }

        // Check if decision type already taken
        if (state.activeDecisionsTaken.includes(type)) {
            return state;
        }

        // Check authority requirement for using funds
        const ignoreFundsAuthority = Boolean(state.activeBuffs?.includes('special_one'));
        if (
          effectiveEffects?.funds < 0 &&
          !ignoreFundsAuthority &&
          state.stats.authority < 70 &&
          !(state.currentTeam?.id === 'bayern_munich' && decisionId === 'goat_head_sign')
        ) {
            return state;
        }

        if (
          state.currentTeam?.id !== 'fc_barcelona' &&
          effectiveEffects?.funds < 0 &&
          (state.stats.funds + effectiveEffects.funds) < 0
        ) {
          return state;
        }

        // Special mechanics: each season can open/close once
        if (effects.special_canteen) {
            const actionKey = effects.special_canteen;
            if (state.specialMechanicState?.canteenChangedThisSeason?.[actionKey]) {
                return state;
            }
        }

        if (effects.special_roof) {
            const actionKey = effects.special_roof;
            if (state.specialMechanicState?.roofChangedThisSeason?.[actionKey]) {
                return state;
            }
        }

        // Month Update: Advance time and apply effects
        const statsAfterDecision = { ...state.stats };
        let opponentTacticsBoostThisMonthAfterDecision = state.opponentTacticsBoostThisMonth || 0;
        let nextLeagueOpponentsAfterDecision = state.leagueOpponents;
        let nextCrossLeagueTacticsInflation = state.crossLeagueTacticsInflation || 0;
        // Special logic for "explode" (set board support to 1)
        if (effectiveEffects.set_board_support_to_1) {
            statsAfterDecision.boardSupport = 1;
            statsAfterDecision.mediaSupport = 100;
        }

        // Handle Buffs/Debuffs from decisions (if any)
        let newActiveBuffs = [...state.activeBuffs];
        if (effectiveEffects.special_rainbow_armband) {
            if (!newActiveBuffs.includes('rainbow_armband')) {
                newActiveBuffs.push('rainbow_armband');
            }
        }

        let pointsThisQuarterAfterDecision = state.pointsThisQuarter;
        if (effectiveEffects.points_bonus) {
            statsAfterDecision.points += effectiveEffects.points_bonus;
            pointsThisQuarterAfterDecision += effectiveEffects.points_bonus;
        }

        Object.keys(effectiveEffects).forEach(key => {
             if (key === 'set_board_support_to_1' || key === 'chance_tabloid' || key === 'special_rainbow_armband' || key === 'points_bonus' || key === 'opponents_tactics_boost' || key === 'special_bayern_reveal_dressing_room') return; // Skip special flags

             if (statsAfterDecision[key] !== undefined) {
                const redirected = redirectNegativeStatEffect(statsAfterDecision, key, effectiveEffects[key]);
                const targetKey = redirected.key;
                const delta = redirected.delta;

                // If we just set boardSupport to 1, don't add/subtract from it in this loop for this decision
                if (effectiveEffects.set_board_support_to_1 && key === 'boardSupport') {
                    return;
                }

                // If we just set mediaSupport to 100, don't add/subtract from it in this loop for this decision
                if (effectiveEffects.set_board_support_to_1 && key === 'mediaSupport') {
                    return;
                }

                if (statsAfterDecision[targetKey] === undefined) return;

                statsAfterDecision[targetKey] += delta;
                
                // Clamp values immediately after decision
                if (['boardSupport', 'dressingRoom', 'mediaSupport', 'authority'].includes(targetKey)) {
                    statsAfterDecision[targetKey] = Math.max(0, Math.min(100, statsAfterDecision[targetKey]));
                } else if (targetKey === 'tactics') {
                    statsAfterDecision[targetKey] = Math.max(0, Math.min(10, statsAfterDecision[targetKey]));
                } else if (targetKey === 'funds') {
                    statsAfterDecision[targetKey] = clampFunds(statsAfterDecision[targetKey], state.currentTeam?.id);
                } else if (targetKey === 'injuryRisk') {
                    statsAfterDecision[targetKey] = Math.max(0, statsAfterDecision[targetKey]);
                }
             }
        });

        if (effectiveEffects.opponents_tactics_boost) {
            opponentTacticsBoostThisMonthAfterDecision += effectiveEffects.opponents_tactics_boost;
            opponentTacticsBoostThisMonthAfterDecision = Math.max(0, opponentTacticsBoostThisMonthAfterDecision);
        }
        
        // Handle special effects like tabloid count
        let newTabloidCount = state.tabloidCount;
        
        // Handle chance_tabloid (50% chance for +1)
        if (effectiveEffects.chance_tabloid) {
            if (Math.random() < 0.5) {
                newTabloidCount += 1;
            }
        } else if (effectiveEffects.tabloid) {
             newTabloidCount += effectiveEffects.tabloid;
        }

        newTabloidCount = Math.max(0, newTabloidCount);

        // Handle special mechanics (Canteen/Roof)
        let newSpecialState = { ...state.specialMechanicState };
        if (effectiveEffects.special_canteen) {
            newSpecialState.canteenOpen = effects.special_canteen === 'open';
            newSpecialState.canteenChangedThisSeason = {
                ...(newSpecialState.canteenChangedThisSeason || { open: false, close: false }),
                [effectiveEffects.special_canteen]: true
            };
        }
        if (effectiveEffects.special_roof) {
            newSpecialState.roofClosed = effectiveEffects.special_roof === 'close';
            newSpecialState.roofChangedThisSeason = {
                ...(newSpecialState.roofChangedThisSeason || { open: false, close: false }),
                [effectiveEffects.special_roof]: true
            };
        }

        if (state.currentTeam?.id === 'bayern_munich' && effectiveEffects.special_bayern_reveal_dressing_room) {
          newSpecialState.bayernDressingRoomRevealed = true;
        }

        // Check for tabloid scandal
        let scandalEvent = null;
        if (newTabloidCount >= 3) {
            newTabloidCount = 0;
            scandalEvent = buildTabloidBreakingEvent();
        }

        {
          const adjusted = applyKopFreeze({
            stats: statsAfterDecision,
            activeBuffs: newActiveBuffs,
            specialMechanicState: newSpecialState
          });
          newSpecialState = adjusted.specialMechanicState;
          if (adjusted.stats) {
            statsAfterDecision.boardSupport = adjusted.stats.boardSupport;
          }
        }

        const nextCoffeeRefUsedThisQuarterAfterDecision = state.coffeeRefUsedThisQuarter || decisionId === 'coffee_ref';
        const nextExplodeUsedThisQuarterAfterDecision = state.explodeUsedThisQuarter || (decisionId === 'press_conference' && optionId === 'explode');

        let flavorEvent = null;
        if (decisionId === 'flirtation' && optionId === 'legend_flirt') {
            flavorEvent = {
                id: 'istanbul_kiss_flavor',
                title: '伊斯坦布尔之吻',
                description: '你就是想亲曾经的队长，媒体们有什么可说的呢？他们只能多拍几张照片而已。管理层对你很满意，更衣室也更加相信你了。即使你心里很清楚，哪怕是曾经如胶似漆的那些年，当转会通知下达的那一刻，也会被干净利落地一刀两断——虽然现在看起来是没断成的。',
                effects: {}
            };
        } else if (decisionId === 'goat_head_sign') {
            const decisionDef = (eventsData.activeDecisions || []).find(d => d.id === decisionId);
            const decisionTitle = decisionDef?.title || '打羊头牌';
            flavorEvent = {
                id: 'decision_flavor_goat_head_sign',
                title: decisionTitle,
                description: '你和球员们一起打了牌。一些被隐瞒的故事在你面前缓缓揭开……',
                effects: {}
            };
        } else if (optionDescription) {
            const decisionDef = (eventsData.activeDecisions || []).find(d => d.id === decisionId);
            const decisionTitle = decisionDef?.title || '发布会';
            flavorEvent = {
                id: `decision_flavor_${decisionId}_${optionId || 'default'}`,
                title: decisionTitle,
                description: optionDescription,
                effects: {}
            };
        }

        enforceRainbowArmband(statsAfterDecision, newActiveBuffs);
        enforceEmmaCamera(statsAfterDecision, newActiveBuffs);
        enforceYouthUnity10Floor(statsAfterDecision, state.youthSquadPlayers);

        const syncedBuffsAfterDecision = syncDerivedBuffs({
          activeBuffs: newActiveBuffs,
          stats: statsAfterDecision,
          teamId: state.currentTeam?.id,
          specialMechanicState: newSpecialState
        });
        
        // Record decision history for conditions (e.g. "flirt_rival")
        // We store "type_optionId" or just "type" if no option
        const decisionRecord = optionId ? `${type}_${optionId}` : type;

        let nextCurrentEventAfterDecision = null;
        let nextQueuedEventAfterDecision = state.queuedEvent;

        if (flavorEvent) {
            nextCurrentEventAfterDecision = flavorEvent;
            if (scandalEvent) {
                nextQueuedEventAfterDecision = scandalEvent;
            }
        } else {
            nextCurrentEventAfterDecision = scandalEvent;
        }

        if (state.year >= 2 && (statsAfterDecision.injuryRisk ?? 0) >= 5) {
            statsAfterDecision.injuryRisk = Math.max(0, (statsAfterDecision.injuryRisk ?? 0) - 5);
            const after = nextCurrentEventAfterDecision || nextQueuedEventAfterDecision || null;
            const remainingQueued = nextCurrentEventAfterDecision ? nextQueuedEventAfterDecision : null;
            nextCurrentEventAfterDecision = buildInjuryCrisisEvent(after);
            nextQueuedEventAfterDecision = remainingQueued;
        }

        let nextStateAfterDecision = {
            ...state,
            stats: statsAfterDecision,
            decisionPoints: state.decisionPoints - 1, // Keep for backward compatibility if needed, but logic relies on count now
            decisionCountThisMonth: state.decisionCountThisMonth + 1,
            activeDecisionsTaken: [...state.activeDecisionsTaken, type],
            decisionHistory: [...state.decisionHistory, decisionRecord],
            tabloidCount: newTabloidCount,
            specialMechanicState: newSpecialState,
            activeBuffs: syncedBuffsAfterDecision,
            pointsThisQuarter: pointsThisQuarterAfterDecision,
            currentEvent: nextCurrentEventAfterDecision,
            queuedEvent: nextQueuedEventAfterDecision,
            coffeeRefUsedThisQuarter: nextCoffeeRefUsedThisQuarterAfterDecision,
            explodeUsedThisQuarter: nextExplodeUsedThisQuarterAfterDecision,
            opponentTacticsBoostThisMonth: opponentTacticsBoostThisMonthAfterDecision,
            leagueOpponents: nextLeagueOpponentsAfterDecision,
            crossLeagueTacticsInflation: nextCrossLeagueTacticsInflation
        };

        if (
          state.currentTeam?.id === 'ac_milan' &&
          decisionId === 'press_conference' &&
          optionId === 'explode' &&
          clampNumber(state.stats?.mediaSupport, 0, 100) > 80
        ) {
          nextStateAfterDecision = unlockAchievementInState(nextStateAfterDecision, 'milan_explode_high_media');
        }

        return nextStateAfterDecision;
    }

    case 'YOUTH_SET_NAME': {
        const scope = action.payload?.scope;
        const rawName = String(action.payload?.name ?? '');
        const name = rawName.trim().slice(0, 10);

        if (scope === 'academy') {
          const p = normalizeYouthPlayer(state.youthAcademyPlayer);
          if (!p) return state;
          return { ...state, youthAcademyPlayer: { ...p, name } };
        }

        if (scope === 'squad') {
          const id = action.payload?.id;
          if (!id) return state;
          const arr = Array.isArray(state.youthSquadPlayers) ? state.youthSquadPlayers.map(normalizeYouthPlayer).filter(Boolean) : [];
          const idx = arr.findIndex(p => p.id === id);
          if (idx < 0) return state;
          const currentName = String(arr[idx]?.name ?? '').trim();
          if (currentName) return state;
          const next = arr.map(p => (p.id === id ? { ...p, name } : p));
          return { ...state, youthSquadPlayers: next };
        }

        return state;
    }

    case 'YOUTH_SET_TRAITS': {
        const scope = action.payload?.scope;
        const apply = (p) => {
          if (!p) return p;
          if (p.traitRerollUsed) return p;
          const next = { ...p, traitRerollUsed: true };
          if (action.payload?.positiveTraitId !== undefined) next.positiveTraitId = action.payload.positiveTraitId;
          if (action.payload?.negativeTraitId !== undefined) next.negativeTraitId = action.payload.negativeTraitId;
          if (action.payload?.specialTraitId !== undefined) next.specialTraitId = action.payload.specialTraitId;
          return next;
        };

        if (scope === 'academy') {
          const p = normalizeYouthPlayer(state.youthAcademyPlayer);
          if (!p) return state;
          return { ...state, youthAcademyPlayer: apply(p) };
        }

        if (scope === 'squad') {
          const id = action.payload?.id;
          if (!id) return state;
          const arr = Array.isArray(state.youthSquadPlayers) ? state.youthSquadPlayers.map(normalizeYouthPlayer).filter(Boolean) : [];
          const exists = arr.some(p => p.id === id);
          if (!exists) return state;
          const next = arr.map(p => (p.id === id ? apply(p) : p));
          return { ...state, youthSquadPlayers: next };
        }

        return state;
    }

    case 'YOUTH_APPLY_DRAFT': {
        const nextAcademy = normalizeYouthPlayer(action.payload?.academyPlayer);
        const currentSquad = Array.isArray(state.youthSquadPlayers)
          ? state.youthSquadPlayers.map(normalizeYouthPlayer).filter(Boolean)
          : [];
        const currentById = new Map(currentSquad.map(p => [p.id, p]));

        const mergeDynamic = (draftPlayer) => {
          const d = normalizeYouthPlayer(draftPlayer);
          if (!d) return null;
          const cur = currentById.get(d.id);
          if (!cur) return d;
          // Preserve dynamic fields that can change outside the modal (matches/events/season rollover)
          // while keeping draft-controlled fields (role/armband/traits/name).
          return {
            ...d,
            age: clampInt(cur.age ?? d.age, 0, 99),
            tech: clampNumber(cur.tech ?? d.tech, 0, 10),
            freePoints: clampInt(d.freePoints ?? cur.freePoints, 0, 9999),
            starterMatches: clampInt(cur.starterMatches ?? d.starterMatches, 0, 999999),
            benchMatches: clampInt(cur.benchMatches ?? d.benchMatches, 0, 999999),
            moleCaughtCount: clampInt(cur.moleCaughtCount ?? d.moleCaughtCount, 0, 999999),
            ecoMissingSeasonYear: clampInt(cur.ecoMissingSeasonYear ?? d.ecoMissingSeasonYear, 0, 99),
            ecoMissingQuarter: clampInt(cur.ecoMissingQuarter ?? d.ecoMissingQuarter, 0, 3)
          };
        };

        const nextSquad = Array.isArray(action.payload?.squadPlayers)
          ? action.payload.squadPlayers.map(mergeDynamic).filter(Boolean).slice(0, getYouthSquadMax(state.currentTeam?.id))
          : currentSquad.slice(0, getYouthSquadMax(state.currentTeam?.id));
        return {
          ...state,
          youthAcademyPlayer: nextAcademy,
          youthSquadPlayers: nextSquad
        };
    }

    case 'YOUTH_ALLOCATE_POINT': {
        const scope = action.payload?.scope;
        const key = action.payload?.key;
        if (!['unity', 'authority', 'diligence'].includes(key)) return state;

        const apply = (player) => {
          const p = normalizeYouthPlayer(player);
          if (!p) return null;
          if ((p.freePoints ?? 0) <= 0) return p;
          if ((p[key] ?? 0) >= 10) return p;
          return {
            ...p,
            freePoints: clampInt((p.freePoints ?? 0) - 1, 0, 9999),
            [key]: clampInt((p[key] ?? 0) + 1, 0, 10)
          };
        };

        if (scope === 'academy') {
          // Free points can only be allocated to squad youth.
          return state;
        }

        if (scope === 'squad') {
          const id = action.payload?.id;
          if (!id) return state;
          const arr = Array.isArray(state.youthSquadPlayers) ? state.youthSquadPlayers.map(normalizeYouthPlayer).filter(Boolean) : [];
          const next = arr.map(p => (p.id === id ? apply(p) : p)).filter(Boolean);
          return { ...state, youthSquadPlayers: next };
        }

        return state;
    }

    case 'YOUTH_SET_ROLE': {
        const id = action.payload?.id;
        const role = action.payload?.role;
        if (!id) return state;
        if (role !== 'starter' && role !== 'bench') return state;
        const arr = Array.isArray(state.youthSquadPlayers) ? state.youthSquadPlayers.map(normalizeYouthPlayer).filter(Boolean) : [];
        const next = arr.map(p => (p.id === id ? { ...p, role } : p));
        return { ...state, youthSquadPlayers: next };
    }

    case 'YOUTH_TOGGLE_ARMBAND': {
        const id = action.payload?.id;
        if (!id) return state;
        const arr = Array.isArray(state.youthSquadPlayers) ? state.youthSquadPlayers.map(normalizeYouthPlayer).filter(Boolean) : [];
        const exists = arr.some(p => p.id === id);
        if (!exists) return state;
        const currentlyOn = arr.some(p => p.id === id && p.hasArmband);
        if (!currentlyOn) {
          const target = arr.find(p => p.id === id);
          const auth = clampInt(target?.authority ?? 0, 0, 10);
          if (auth < 5) return state;
        }
        const next = arr.map(p => {
          if (p.id === id) return { ...p, hasArmband: !currentlyOn };
          return { ...p, hasArmband: false };
        });
        return { ...state, youthSquadPlayers: next };
    }

    case 'YOUTH_PROMOTE': {
        const payloadPlayer = normalizeYouthPlayer(action.payload?.player);
        const p = payloadPlayer || normalizeYouthPlayer(state.youthAcademyPlayer);
        if (!p) return state;
        if (!String(p.name || '').trim()) return state;
        const arr = Array.isArray(state.youthSquadPlayers) ? state.youthSquadPlayers.map(normalizeYouthPlayer).filter(Boolean) : [];
        const limit = getYouthSquadAddLimit(state.currentTeam?.id, state.stats?.funds);
        if (arr.length >= limit) return state;
        // Squad-only system: joining the squad grants 1 free point.
        const promoted = { ...p, freePoints: clampInt((p.freePoints ?? 0) + 1, 0, 9999) };
        const nextSquad = [...arr, { ...promoted, role: 'bench', hasArmband: false }].slice(0, getYouthSquadMax(state.currentTeam?.id));
        const nextState = { ...state, youthAcademyPlayer: null, youthSquadPlayers: nextSquad };
        return applyYouthPromotionAchievements(nextState, promoted);
    }

    case 'YOUTH_SELL': {
        const scope = action.payload?.scope;
        const calcPrice = (player) => {
          const tech = clampNumber(player?.tech ?? 0, 0, 10);
          return 10 + Math.max(0, tech - 4) * 10;
        };

        if (scope === 'academy') {
          const p = normalizeYouthPlayer(state.youthAcademyPlayer);
          if (!p) return state;
          const price = calcPrice(p);
          return {
            ...state,
            youthAcademyPlayer: null,
            stats: { ...(state.stats || {}), funds: clampFunds((state.stats?.funds ?? 0) + price, state.currentTeam?.id) }
          };
        }

        if (scope === 'squad') {
          const id = action.payload?.id;
          if (!id) return state;
          const arr = Array.isArray(state.youthSquadPlayers) ? state.youthSquadPlayers.map(normalizeYouthPlayer).filter(Boolean) : [];
          const p = arr.find(pp => pp.id === id);
          if (!p) return state;
          const price = calcPrice(p);
          const next = arr.filter(pp => pp.id !== id);
          return {
            ...state,
            youthSquadPlayers: next,
            stats: { ...(state.stats || {}), funds: clampFunds((state.stats?.funds ?? 0) + price, state.currentTeam?.id) }
          };
        }

        return state;
    }

    case 'YOUTH_REFRESH': {
        if (!state.youthAcademyUnlocked) return state;
        if (state.youthAcademyPlayer) return state;
        if (state.youthRefreshUsedThisQuarter) return state;
        const funds = state.stats?.funds ?? 0;
        if (funds < 30) return state;
        const squad = Array.isArray(state.youthSquadPlayers) ? state.youthSquadPlayers.map(normalizeYouthPlayer).filter(Boolean) : [];
        const isBarca = state.currentTeam?.id === 'fc_barcelona';
        if (!isBarca && squad.length > 0) return state;
        return {
          ...state,
          youthAcademyPlayer: state.currentTeam?.id === 'fc_barcelona'
            ? generateYouthPlayer({ techMin: 4, techMax: 8 })
            : generateYouthPlayer(),
          youthRefreshUsedThisQuarter: true,
          stats: { ...(state.stats || {}), funds: clampFunds(funds - 30, state.currentTeam?.id) }
        };
    }

    case 'NEXT_MONTH': {
        let nextMonth = state.month + 1;
        let nextQuarter = state.quarter;
        let nextYear = state.year;
        let eventToTrigger = null;
        let statsAfterMonth = { ...state.stats };
        let nextSpecialState = { ...state.specialMechanicState };
        let settlementEvent = null;
        let victory = false;
        let quarterEstimatedRanking = null;
        let seasonSettlementPoints = null;
        let nextTabloidCount = state.tabloidCount;
        let nextActiveBuffs = [...state.activeBuffs];
        let pointsThisQuarterAfterMonth = state.pointsThisQuarter;
        let forcedEvent = null;
        let nextRelegationFinalRanking = state.relegationFinalRanking;
        let nextYouthRandomEventSeasonYear = state.youthRandomEventSeasonYear;
        let nextMixerYouthEventSeasonYear = state.mixerYouthEventSeasonYear;
        let nextMixerMediaEducateCount = state.mixerMediaEducateCount;
        let queuedEvent = null;
        let nextRandomEventsThisYear = [...(state.randomEventsThisYear || [])];
        let nextLastRandomEventId = state.lastRandomEventId;
        let pendingGameState = null;
        let forcedGameStateAfterMonth = null;
        let shouldAutoSave = false;
        let nextEstimatedRanking = state.estimatedRanking;
        let nextPendingSeasonReset = state.pendingSeasonReset;
        let nextCoffeeRefUsedThisQuarter = state.coffeeRefUsedThisQuarter;
        let nextExplodeUsedThisQuarter = state.explodeUsedThisQuarter;

        let nextYouthRefreshUsedThisQuarter = Boolean(state.youthRefreshUsedThisQuarter);
        const youthMaxThisMonth = getYouthSquadMax(state.currentTeam?.id);
        let nextYouthSquadPlayers = Array.isArray(state.youthSquadPlayers) ? state.youthSquadPlayers.map(normalizeYouthPlayer).filter(Boolean).slice(0, youthMaxThisMonth) : [];

        let nextUclActive = state.uclActive;
        let nextUclAlive = state.uclAlive;
        let nextUclStage = state.uclStage;
        let nextUclSeasonYear = state.uclSeasonYear;
        let nextUclTeams16 = Array.isArray(state.uclTeams16) ? state.uclTeams16.slice() : [];
        let nextUclDrawCandidates = Array.isArray(state.uclDrawCandidates) ? state.uclDrawCandidates.slice() : [];
        let nextUclOpponentQueue = Array.isArray(state.uclOpponentQueue) ? state.uclOpponentQueue.slice() : [];
        let nextUclCurrentOpponent = state.uclCurrentOpponent;

        let nextUclQualifiedThisSeason = state.uclQualifiedThisSeason;
        let nextUclQualifiedNextSeason = state.uclQualifiedNextSeason;

        if (state.currentTeam?.id === 'bayern_munich') {
          if (!state.specialMechanicState?.bayernCommitteeRemoved) {
            nextSpecialState = { ...nextSpecialState, bayernDressingRoomRevealed: false };
          }
        }

        // Monthly Canteen Check (Man Utd)
        if (state.currentTeam.id === 'man_utd' && !nextSpecialState.canteenOpen) {
             // Delayed penalty for closed canteen
             statsAfterMonth.dressingRoom = Math.max(0, statsAfterMonth.dressingRoom - 10);
             if (!nextActiveBuffs.includes('closed_canteen')) nextActiveBuffs.push('closed_canteen');
        } else {
             nextActiveBuffs = nextActiveBuffs.filter(b => b !== 'closed_canteen');
        }
        
        // Media Support Monthly Effect
        if (statsAfterMonth.mediaSupport > 80) {
            statsAfterMonth.boardSupport = Math.min(100, statsAfterMonth.boardSupport + 10);
            if (!nextActiveBuffs.includes('media_darling')) nextActiveBuffs.push('media_darling');
            nextActiveBuffs = nextActiveBuffs.filter(b => b !== 'media_hostile');
        } else if (statsAfterMonth.mediaSupport < 40) {
            // Check for Rainbow Armband protection
            if (nextActiveBuffs.includes('rainbow_armband')) {
                 statsAfterMonth.mediaSupport = Math.max(10, statsAfterMonth.mediaSupport);
            }
            
            statsAfterMonth.boardSupport = Math.max(0, statsAfterMonth.boardSupport - 10);
            if (!nextActiveBuffs.includes('media_hostile')) nextActiveBuffs.push('media_hostile');
            nextActiveBuffs = nextActiveBuffs.filter(b => b !== 'media_darling');
        } else {
            nextActiveBuffs = nextActiveBuffs.filter(b => b !== 'media_darling' && b !== 'media_hostile');
        }

        const youthMonthlyProfile = getYouthSquadProfile(nextYouthSquadPlayers);
        if (youthMonthlyProfile.monthlyAuthorityBonus > 0) {
          statsAfterMonth.authority = Math.max(0, Math.min(100, (statsAfterMonth.authority ?? 0) + youthMonthlyProfile.monthlyAuthorityBonus));
        }
        if (youthMonthlyProfile.monthlyDressingRoomBonus > 0) {
          statsAfterMonth.dressingRoom = Math.max(0, Math.min(100, (statsAfterMonth.dressingRoom ?? 0) + youthMonthlyProfile.monthlyDressingRoomBonus));
        }

        if (nextActiveBuffs.includes('union_stun_iron')) {
          statsAfterMonth.authority = Math.max(0, Math.min(100, (statsAfterMonth.authority ?? 0) + 5));
        }

        {
          const teamId = state.currentTeam?.id;
          const bonus = getYouthTraitMonthlyBonuses(nextYouthSquadPlayers);
          if (bonus.boardSupport > 0) statsAfterMonth.boardSupport = Math.max(0, Math.min(100, (statsAfterMonth.boardSupport ?? 0) + bonus.boardSupport));
          if (bonus.mediaSupport > 0) statsAfterMonth.mediaSupport = Math.max(0, Math.min(100, (statsAfterMonth.mediaSupport ?? 0) + bonus.mediaSupport));
          if (bonus.funds > 0) statsAfterMonth.funds = clampFunds((statsAfterMonth.funds ?? 0) + bonus.funds, teamId);
        }

        // Dressing Room Turmoil (< 40)
        if (statsAfterMonth.dressingRoom < 40) {
            if (!nextActiveBuffs.includes('turmoil')) nextActiveBuffs.push('turmoil');

            if (state.currentTeam?.id === 'bayern_munich') {
              if (!state.specialMechanicState?.bayernCommitteeRemoved) {
                statsAfterMonth.dressingRoom = Math.max(0, statsAfterMonth.dressingRoom - 5);
              }
            }

            // 动乱期间管理层支持、话语权每个结算期都会下降，小报消息每个月+1
            statsAfterMonth.boardSupport = Math.max(0, statsAfterMonth.boardSupport - 5);
            {
                const redirected = redirectNegativeStatEffect(statsAfterMonth, 'authority', -5);
                const targetKey = redirected.key;
                const delta = redirected.delta;
                if (statsAfterMonth[targetKey] !== undefined) {
                    statsAfterMonth[targetKey] += delta;
                    if (['boardSupport', 'dressingRoom', 'mediaSupport', 'authority'].includes(targetKey)) {
                        statsAfterMonth[targetKey] = Math.max(0, Math.min(100, statsAfterMonth[targetKey]));
                    }
                }
            }

            nextTabloidCount += 1;
            if (nextTabloidCount >= 3) {
                nextTabloidCount = 0;
                forcedEvent = buildTabloidBreakingEvent();
            }
        } else {
            nextActiveBuffs = nextActiveBuffs.filter(b => b !== 'turmoil');
        }

        if (state.currentTeam?.id === 'ac_milan') {
            if (nextActiveBuffs.includes('milan_baresi')) {
                statsAfterMonth.boardSupport = Math.max(0, Math.min(100, (statsAfterMonth.boardSupport ?? 0) + 10));
            }
            if (nextActiveBuffs.includes('milan_nesta')) {
                statsAfterMonth.dressingRoom = Math.max(0, Math.min(100, (statsAfterMonth.dressingRoom ?? 0) + 10));
            }
            if (nextActiveBuffs.includes('milan_maldini')) {
                statsAfterMonth.mediaSupport = Math.max(0, Math.min(100, (statsAfterMonth.mediaSupport ?? 0) + 10));
            }
        }

        if (state.currentTeam?.id === 'chelsea' && nextActiveBuffs.includes('chelsea_sack_pressure')) {
            const auth = clampNumber(statsAfterMonth.authority, 0, 100);
            const over = Math.max(0, auth - 60);
            if (over > 0) {
                statsAfterMonth.boardSupport = Math.max(0, clampNumber(statsAfterMonth.boardSupport, 0, 100) - over);
            }
        }

        let pointsGainedThisMonth = 0;
        let nextLeagueMatchResults = { ...(state.leagueMatchResults || {}) };
        let nextLeagueOpponents = Array.isArray(state.leagueOpponents)
          ? state.leagueOpponents.map(o => ({ ...o }))
          : [];

        const leagueIdThisMonth = state.currentTeam?.leagueId || 'epl';
        const leagueSize = getLeagueRoster(leagueIdThisMonth)?.length || 20;
        const monthInSeason = (state.quarter - 1) * 3 + state.month;
        const roundsThisMonth = getRoundsThisMonth(leagueSize, monthInSeason);
        const awayPenalty = 0.35;
        const opponentBoost = state.opponentTacticsBoostThisMonth || 0;
        let nextLeagueSchedule = Array.isArray(state.leagueSchedule) ? state.leagueSchedule : [];
        let nextLeagueRoundCursor = state.leagueRoundCursor || 0;

        const oppById = new Map(nextLeagueOpponents.map(o => [o.id, o]));
        const playerId = state.currentTeam?.id;

        const leagueCursorStart = nextLeagueRoundCursor;

        for (let r = 0; r < roundsThisMonth; r += 1) {
          const roundIndex = nextLeagueRoundCursor;
          const round = nextLeagueSchedule[nextLeagueRoundCursor];
          if (!round) break;

          let playerResultThisRound = null;

          const fixtures = round.fixtures || [];
          fixtures.forEach(f => {
            const homeId = f.homeId;
            const awayId = f.awayId;

            const homeIsPlayer = homeId === playerId;
            const awayIsPlayer = awayId === playerId;

            const bestStarterTech = getBestYouthStarterTech(nextYouthSquadPlayers, { year: state.year, quarter: state.quarter, ucl: false });
            const playerTacticsDelta = computeYouthTechTacticsDelta(bestStarterTech, statsAfterMonth.tactics);
            const playerTacticsForMatch = clampNumber((statsAfterMonth.tactics ?? 0) + playerTacticsDelta, 0, 10);

            const homeBase = homeIsPlayer ? playerTacticsForMatch : clampNumber(oppById.get(homeId)?.tactics, 0, 10);
            const awayBase = awayIsPlayer ? playerTacticsForMatch : clampNumber(oppById.get(awayId)?.tactics, 0, 10);

            const homeEff = homeBase;
            const awayEff = awayBase - awayPenalty;

            let homeEffWithBoost = homeEff;
            let awayEffWithBoost = awayEff;
            if (homeIsPlayer) {
              awayEffWithBoost += opponentBoost;
            }
            if (awayIsPlayer) {
              homeEffWithBoost += opponentBoost;
            }

            let homePoints = 0;
            let awayPoints = 0;
            ({ homePoints, awayPoints } = sampleMatchPoints(homeEffWithBoost, awayEffWithBoost));

            if (homeIsPlayer) {
              pointsGainedThisMonth += homePoints;
              if (homePoints === 3) playerResultThisRound = 'W';
              else if (homePoints === 1) playerResultThisRound = 'D';
              else playerResultThisRound = 'L';
            } else {
              const o = oppById.get(homeId);
              if (o) o.points = (o.points || 0) + homePoints;
            }

            if (awayIsPlayer) {
              pointsGainedThisMonth += awayPoints;
              if (awayPoints === 3) playerResultThisRound = 'W';
              else if (awayPoints === 1) playerResultThisRound = 'D';
              else playerResultThisRound = 'L';
            } else {
              const o = oppById.get(awayId);
              if (o) o.points = (o.points || 0) + awayPoints;
            }
          });

          if (playerResultThisRound) {
            nextLeagueMatchResults[roundIndex] = playerResultThisRound;
          }

          nextLeagueRoundCursor += 1;
        }

        const leagueMatchesPlayedThisMonth = Math.max(0, nextLeagueRoundCursor - leagueCursorStart);
        nextYouthSquadPlayers = applyYouthMatchesToSquad(nextYouthSquadPlayers, leagueMatchesPlayedThisMonth, { year: state.year, quarter: state.quarter, ucl: false });

        nextLeagueOpponents = Array.from(oppById.values()).map(o => {
          const rr = Math.random();
          let delta = 0;
          if (rr < 1 / 3) delta = -0.5;
          else if (rr < 2 / 3) delta = 0;
          else delta = 0.5;
          const base = (typeof o?.baseTactics === 'number') ? o.baseTactics : (o?.tactics || 0);
          const baseTactics = clampNumber(base, 0, 10);
          return { ...o, baseTactics, tactics: clampNumber(baseTactics + delta, 0, 10) };
        });

        statsAfterMonth.points += pointsGainedThisMonth;
        pointsThisQuarterAfterMonth += pointsGainedThisMonth;

        // Quarter logic
        let didFinishQuarter = false;
        if (nextMonth > 3) {
            didFinishQuarter = true;
            nextMonth = 1;
            nextQuarter += 1;
            shouldAutoSave = true;
            nextCoffeeRefUsedThisQuarter = false;
            nextExplodeUsedThisQuarter = false;
            nextYouthRefreshUsedThisQuarter = false;

            {
              const idx = nextYouthSquadPlayers.findIndex(p => (p?.negativeTraitId || '') === 'mole' && clampInt(p?.moleCaughtCount ?? 0, 0, 999999) < 1);
              if (idx >= 0) {
                const effects = { dressingRoom: -10, boardSupport: 2, authority: 5, mediaSupport: -2 };
                Object.keys(effects).forEach(key => {
                  const redirected = redirectNegativeStatEffect(statsAfterMonth, key, effects[key]);
                  const targetKey = redirected.key;
                  const delta = redirected.delta;
                  if (statsAfterMonth[targetKey] !== undefined) {
                    statsAfterMonth[targetKey] += delta;
                    if (['boardSupport', 'dressingRoom', 'mediaSupport', 'authority'].includes(targetKey)) {
                      statsAfterMonth[targetKey] = Math.max(0, Math.min(100, statsAfterMonth[targetKey]));
                    } else if (targetKey === 'tactics') {
                      statsAfterMonth[targetKey] = Math.max(0, Math.min(10, statsAfterMonth[targetKey]));
                    } else if (targetKey === 'funds') {
                      statsAfterMonth[targetKey] = clampFunds(statsAfterMonth[targetKey], state.currentTeam?.id);
                    } else if (targetKey === 'injuryRisk') {
                      statsAfterMonth[targetKey] = Math.max(0, statsAfterMonth[targetKey]);
                    }
                  }
                });

                if (Math.random() < 0.1) {
                  statsAfterMonth.dressingRoom = Math.max(0, Math.min(100, (statsAfterMonth.dressingRoom ?? 0) - 20));
                  nextYouthSquadPlayers = nextYouthSquadPlayers.map((p, i) => (i === idx ? { ...p, moleCaughtCount: 1 } : p));
                }
              }
            }

            if (nextActiveBuffs.includes('union_stun_gun')) {
              statsAfterMonth.authority = Math.max(0, Math.min(100, (statsAfterMonth.authority ?? 0) + 5));
            }

            if (state.currentTeam?.id === 'ac_milan' && (nextQuarter === 2 || nextQuarter === 3)) {
              const all = ['milan_baresi', 'milan_nesta', 'milan_maldini'];
              const usedFromState = Array.isArray(nextSpecialState?.milanLegendsUsedThisSeason)
                ? nextSpecialState.milanLegendsUsedThisSeason.filter(Boolean)
                : [];
              const usedFromBuffs = all.filter(id => nextActiveBuffs.includes(id));
              const used = Array.from(new Set([...usedFromState, ...usedFromBuffs]));
              const remaining = all.filter(id => !used.includes(id));
              if (remaining.length > 0) {
                const picked = remaining[Math.floor(Math.random() * remaining.length)];
                used.push(picked);
                nextSpecialState = { ...(nextSpecialState || {}), milanLegendsUsedThisSeason: used };
                if (!nextActiveBuffs.includes(picked)) nextActiveBuffs.push(picked);
              } else {
                nextSpecialState = { ...(nextSpecialState || {}), milanLegendsUsedThisSeason: used };
              }
            }

            {
              const youthQuarterlyProfile = getYouthSquadProfile(nextYouthSquadPlayers);
              if (youthQuarterlyProfile.quarterlyTacticsBonus > 0) {
                statsAfterMonth.tactics = Math.max(0, Math.min(10, (statsAfterMonth.tactics ?? 0) + youthQuarterlyProfile.quarterlyTacticsBonus));
              }
            }

            {
              const q = getYouthTraitQuarterlyModifiers(nextYouthSquadPlayers);
              if (q.funds !== 0) {
                statsAfterMonth.funds = clampFunds((statsAfterMonth.funds ?? 0) + q.funds, state.currentTeam?.id);
              }

              if (q.injuryRisk > 0) {
                if (statsAfterMonth.injuryRisk === undefined) statsAfterMonth.injuryRisk = 0;
                statsAfterMonth.injuryRisk = Math.max(0, (statsAfterMonth.injuryRisk ?? 0) + q.injuryRisk);
              }
            }

            if (state.year >= 2) {
                if (statsAfterMonth.injuryRisk === undefined) statsAfterMonth.injuryRisk = 0;
                statsAfterMonth.injuryRisk += 1;

                if (statsAfterMonth.injuryRisk >= 5) {
                    statsAfterMonth.injuryRisk = Math.max(0, statsAfterMonth.injuryRisk - 5);
                    const nextEvent = forcedEvent ? forcedEvent : null;
                    forcedEvent = buildInjuryCrisisEvent(nextEvent);
                }
            }
            
            // --- Quarterly Settlement Logic ---

            // Ranking estimation for quarter end
            if (Array.isArray(nextLeagueOpponents) && nextLeagueOpponents.length > 0) {
                quarterEstimatedRanking = computeRankingFromLeague({
                  playerPoints: statsAfterMonth.points,
                  playerTactics: statsAfterMonth.tactics,
                  opponents: nextLeagueOpponents
                });
            } else {
                const monthsPlayedAtQuarterEnd = state.quarter * 3;
                quarterEstimatedRanking = estimateRankingFromPoints(statsAfterMonth.points, monthsPlayedAtQuarterEnd, leagueSize);
            }
            
            // 3. Check Expectations
            const expectation = state.currentTeam.expectations.ranking;
            const metExpectation = quarterEstimatedRanking <= expectation;
            let mediaChange = 0;

            // Special Mechanic: Real Madrid Roof
            if (state.currentTeam.id === 'real_madrid' && nextSpecialState.roofClosed) {
                if (quarterEstimatedRanking === 1) mediaChange += 20;
                else mediaChange -= 20;
            }
            
            // Apply changes with clamping
            // Media support check for roof
            if (mediaChange !== 0) {
                 const redirected = redirectNegativeStatEffect(statsAfterMonth, 'mediaSupport', mediaChange);
                 const targetKey = redirected.key;
                 const delta = redirected.delta;
                 if (statsAfterMonth[targetKey] !== undefined) {
                     statsAfterMonth[targetKey] += delta;
                     if (['boardSupport', 'dressingRoom', 'mediaSupport', 'authority'].includes(targetKey)) {
                         statsAfterMonth[targetKey] = Math.max(0, Math.min(100, statsAfterMonth[targetKey]));
                     }
                 }
            }

            settlementEvent = buildQuarterExpectationEvent({
                quarter: state.quarter,
                ranking: quarterEstimatedRanking,
                points: statsAfterMonth.points,
                metExpectation,
                authority: statsAfterMonth.authority
            });
            
            // Check for Victory (End of Season)
            if (state.quarter === 3) { // Assuming 3 quarters per season
                if (quarterEstimatedRanking === 1) {
                    victory = true;
                }
            }

            pointsThisQuarterAfterMonth = 0;
        }
        
        // Year logic
        if (nextQuarter > 3) {
            // Mark season reset to be applied after confirming season settlement event
            nextPendingSeasonReset = true;
            seasonSettlementPoints = statsAfterMonth.points;
            pointsThisQuarterAfterMonth = 0;

            // Keep UI time/schedule on the current season until the season settlement is confirmed.
            nextMonth = state.month;
            nextQuarter = state.quarter;
            nextYear = state.year;
            nextCoffeeRefUsedThisQuarter = state.coffeeRefUsedThisQuarter;
            nextExplodeUsedThisQuarter = state.explodeUsedThisQuarter;
        }

        let nextAchievementsState = state;
        if (nextYear >= 6 && nextYear !== state.year) {
          if (state.currentTeam?.id === 'real_madrid') {
            nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'rm_5_years');
          }
          if (state.currentTeam?.id === 'ac_milan') {
            nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'ac_milan_5_years');
          }
          if (state.currentTeam?.id === 'fc_barcelona') {
            nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'barca_5_years');
          }
          if (state.currentTeam?.id === 'dortmund') {
            nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'dortmund_5_years');
          }
          if (state.currentTeam?.id === 'chelsea') {
            nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'chelsea_5_years');
          }
          if (state.currentTeam?.id === 'liverpool') {
            nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'liverpool_5_years');
          }
          if (state.currentTeam?.id === 'arsenal') {
            nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'arsenal_5_years');
          }
          if (state.currentTeam?.id === 'man_utd') {
            nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'manutd_5_years');
          }
          if (state.currentTeam?.id === 'bayern_munich') {
            nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'bayern_5_years');
          }
        }

        if (nextYear === 2 && nextYear !== state.year && victory && state.currentTeam?.id === 'man_utd') {
          nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'manutd_year1_champion');
        }

        if (nextYear !== state.year) {
            nextRandomEventsThisYear = [];
            nextLastRandomEventId = null;
        }

        // Update ranking every month based on league table when available.
        if (nextPendingSeasonReset) {
            nextEstimatedRanking = quarterEstimatedRanking ?? nextEstimatedRanking;
        } else if (Array.isArray(nextLeagueOpponents) && nextLeagueOpponents.length > 0) {
            nextEstimatedRanking = computeRankingFromLeague({
              playerPoints: statsAfterMonth.points,
              playerTactics: statsAfterMonth.tactics,
              opponents: nextLeagueOpponents
            });
        } else {
            const monthsPlayed = (nextQuarter - 1) * 3 + (nextMonth - 1);
            nextEstimatedRanking = estimateRankingFromPoints(statsAfterMonth.points, monthsPlayed, leagueSize);
        }

        // Random Event Logic
        const globalEvents = eventsData.randomEvents.global;
        const teamEvents = eventsData.randomEvents.teamSpecific[state.currentTeam.id] || [];
        const allEvents = [...globalEvents, ...teamEvents];

        let autoFlirtEvent = null;
        if (didFinishQuarter && Array.isArray(nextActiveBuffs) && nextActiveBuffs.includes('man_city_auto_flirt')) {
          const flirtDecision = Array.isArray(eventsData.activeDecisions)
            ? eventsData.activeDecisions.find(d => d && d.id === 'flirtation')
            : null;
          const opts = Array.isArray(flirtDecision?.options) ? flirtDecision.options : [];
          const types = ['rival_coach', 'foreign_coach', 'player'];
          const used = Array.isArray(nextSpecialState.manCityAutoFlirtUsedTypesThisSeason)
            ? nextSpecialState.manCityAutoFlirtUsedTypesThisSeason.slice()
            : [];
          const pool = used.length < 3 ? types.filter(t => !used.includes(t)) : types;
          const pickedType = pool.length > 0
            ? pool[Math.floor(Math.random() * pool.length)]
            : types[Math.floor(Math.random() * types.length)];

          if (used.length < 3 && !used.includes(pickedType)) {
            used.push(pickedType);
            nextSpecialState.manCityAutoFlirtUsedTypesThisSeason = used;
          }

          const pickedOpt = opts.find(o => o && o.id === pickedType) || null;
          if (pickedOpt && pickedOpt.effects) {
            let eff = { ...(pickedOpt.effects || {}) };
            if (state.year >= 2 && (pickedType === 'rival_coach' || pickedType === 'foreign_coach')) {
              eff = { ...(eff || {}), tabloid: 1, tactics: 0.5 };
              delete eff.chance_tabloid;
            }
            {
              const extraTabloid = getYouthFlirtExtraTabloid(nextYouthSquadPlayers);
              if (extraTabloid > 0) {
                const baseTab = typeof eff.tabloid === 'number' ? eff.tabloid : 0;
                eff = { ...(eff || {}), tabloid: baseTab + extraTabloid };
              }
            }

            const typeLabel = pickedType === 'rival_coach'
              ? '同联赛教练'
              : (pickedType === 'foreign_coach' ? '其他联赛教练' : '球员');
            autoFlirtEvent = {
              id: `man_city_auto_flirt_${state.year}_${state.quarter}_${state.month}`,
              title: '人老实话不多',
              description: `季度自动触发：和${typeLabel}调情。` + (pickedOpt.description ? `\n\n${pickedOpt.description}` : ''),
              options: [{
                id: pickedType,
                text: '继续',
                effects: eff,
                decisionRecord: `risk_${pickedType}`
              }]
            };
          }
        }
        
        const unionTriggered = new Set(
          Array.isArray(nextSpecialState?.unionWeaponEventsTriggered)
            ? nextSpecialState.unionWeaponEventsTriggered
            : []
        );

        // Filter events based on conditions
        const validEvents = allEvents.filter(event => {
            if (event?.id && unionTriggered.has(event.id)) return false;
            if (!event.condition) return true;

            if (event.condition.year && state.year < event.condition.year) {
                return false;
            }
            
            if (event.condition.type === 'decision_history') {
                // Check if specific decision option was taken
                // e.g. value="risk", detail="rival_coach" -> "risk_rival_coach"
                const requiredDecision = `${event.condition.value}_${event.condition.detail}`;
                return state.decisionHistory.includes(requiredDecision);
            }

            if (event.condition.type === 'min_stat') {
                const key = event.condition.key;
                const min = event.condition.value;
                if (!key || typeof min !== 'number') return true;
                const v = clampNumber(state.stats?.[key], 0, 100);
                return v >= min;
            }

            if (event.condition.buff && !(state.activeBuffs && state.activeBuffs.includes(event.condition.buff))) {
              return false;
            }

            if (Array.isArray(event.condition.teamIds) && event.condition.teamIds.length > 0) {
              if (!event.condition.teamIds.includes(state.currentTeam?.id)) return false;
            }

            if (Array.isArray(event.condition.notTeamIds) && event.condition.notTeamIds.length > 0) {
              if (event.condition.notTeamIds.includes(state.currentTeam?.id)) return false;
            }

            return true;
        });

        // Always trigger at least 1 random event each month.
        // At quarter end, trigger 3 random events in sequence.
        const isSeasonEnd = state.quarter === 3 && settlementEvent;

        // At season end, enter the season settlement screen immediately.
        // For other quarters, still trigger 3 random events.
        const willEnterUclAfterQ2 = Boolean(state.year >= 2 && state.quarter === 2 && nextQuarter === 3 && nextUclSeasonYear !== state.year);
        const canEnterUclAfterQ2 = Boolean(willEnterUclAfterQ2 && nextUclQualifiedThisSeason);
        const uclMatchScheduledThisMonth = Boolean(
          nextUclActive &&
          nextUclAlive &&
          nextQuarter === 3 &&
          ((nextMonth === 2 && nextUclStage === 'qf') ||
            (nextMonth === 3 && (nextUclStage === 'sf' || nextUclStage === 'final')))
        );
        const shouldSuppressRandomForUcl = Boolean(
          nextUclActive && nextUclAlive && nextQuarter === 3 && (nextMonth === 1 || uclMatchScheduledThisMonth)
        );
        const baseRandomEventCount = (isSeasonEnd || shouldSuppressRandomForUcl || canEnterUclAfterQ2) ? 0 : (settlementEvent ? 3 : 1);

        const youthPool = (eventsData && eventsData.randomEvents && Array.isArray(eventsData.randomEvents.youth))
          ? eventsData.randomEvents.youth
          : [];
        const youthMixerPool = (eventsData && eventsData.randomEvents && Array.isArray(eventsData.randomEvents.youthMixer))
          ? eventsData.randomEvents.youthMixer
          : [];

        const hasAnyYouthInSquad = Array.isArray(nextYouthSquadPlayers) && nextYouthSquadPlayers.length > 0;
        const primaryYouth = hasAnyYouthInSquad ? normalizeYouthPlayer(nextYouthSquadPlayers[0]) : null;
        const primaryYouthName = String(primaryYouth?.name || '').trim();

        const canReplaceWithYouthEvent = Boolean(
          baseRandomEventCount > 0 &&
          hasAnyYouthInSquad &&
          youthPool.length > 0 &&
          clampInt(nextYouthRandomEventSeasonYear ?? 0, 0, 99) !== clampInt(state.year ?? 0, 0, 99)
        );

        const youthReplaceCount = canReplaceWithYouthEvent ? 1 : 0;
        const normalRandomEventCount = Math.max(0, baseRandomEventCount - youthReplaceCount);
        const randomEventCount = normalRandomEventCount;
        const sourcePool = validEvents.length > 0 ? validEvents : allEvents;
        const pickedEvents = [];
        let availablePool = sourcePool.filter(ev => ev && ev.id && !nextRandomEventsThisYear.includes(ev.id) && ev.id !== nextLastRandomEventId);

        // If only the last unused event is the immediate previous one, allow it (better than forcing a reset).
        if (availablePool.length === 0) {
            const allowImmediateRepeatIfNeeded = sourcePool.filter(ev => ev && ev.id && !nextRandomEventsThisYear.includes(ev.id));
            if (allowImmediateRepeatIfNeeded.length > 0) {
                availablePool = allowImmediateRepeatIfNeeded;
            } else {
                // All events in the pool have been used this year -> restart yearly tracking, still avoiding immediate repeat when possible.
                nextRandomEventsThisYear = [];
                const withoutImmediateRepeat = sourcePool.filter(ev => ev && ev.id && ev.id !== nextLastRandomEventId);
                availablePool = withoutImmediateRepeat.length > 0 ? withoutImmediateRepeat : sourcePool;
            }
        }

        for (let i = 0; i < randomEventCount; i++) {
            if (!availablePool || availablePool.length === 0) break;
            const pickedIndex = Math.floor(Math.random() * availablePool.length);
            const picked = availablePool[pickedIndex];
            availablePool.splice(pickedIndex, 1);

            const prepared = cloneAndReplaceEventText(picked, state);
            if (prepared) {
                pickedEvents.push(prepared);
                if (prepared.id && !nextRandomEventsThisYear.includes(prepared.id)) {
                    nextRandomEventsThisYear.push(prepared.id);
                }
                nextLastRandomEventId = prepared.id;
            }

            if (availablePool.length === 0) break;
        }

        if (youthReplaceCount === 1) {
          const youthAvailable = youthPool
            .filter(ev => {
              if (!ev || !ev.id) return false;
              if (nextRandomEventsThisYear.includes(ev.id)) return false;
              if (ev.id === nextLastRandomEventId) return false;
              const excluded = Array.isArray(ev.excludeYouthNames) ? ev.excludeYouthNames : [];
              if (primaryYouthName && excluded.includes(primaryYouthName)) return false;
              return true;
            });
          if (youthAvailable.length > 0) {
            const pickedIndex = Math.floor(Math.random() * youthAvailable.length);
            const picked = youthAvailable[pickedIndex];
            const prepared = cloneAndReplaceEventText(picked, state);
            if (prepared) {
              pickedEvents.unshift(prepared);
              if (prepared.id && !nextRandomEventsThisYear.includes(prepared.id)) {
                nextRandomEventsThisYear.push(prepared.id);
              }
              nextLastRandomEventId = prepared.id;
              nextYouthRandomEventSeasonYear = state.year;
            }
          }
        }

        const shouldTriggerMixerYouthEvent = Boolean(
          state.quarter === 2 &&
          settlementEvent &&
          hasYouthNegativeTrait(nextYouthSquadPlayers, 'mixer') &&
          youthMixerPool.length > 0 &&
          clampInt(nextMixerMediaEducateCount ?? 0, 0, 999999) < 3 &&
          clampInt(nextMixerYouthEventSeasonYear ?? 0, 0, 99) !== clampInt(state.year ?? 0, 0, 99)
        );

        if (shouldTriggerMixerYouthEvent) {
          const mixerAvailable = youthMixerPool
            .filter(ev => {
              if (!ev || !ev.id) return false;
              if (nextRandomEventsThisYear.includes(ev.id)) return false;
              if (ev.id === nextLastRandomEventId) return false;
              const excluded = Array.isArray(ev.excludeYouthNames) ? ev.excludeYouthNames : [];
              if (primaryYouthName && excluded.includes(primaryYouthName)) return false;
              return true;
            });
          if (mixerAvailable.length > 0) {
            const pickedIndex = Math.floor(Math.random() * mixerAvailable.length);
            const picked = mixerAvailable[pickedIndex];
            const prepared = cloneAndReplaceEventText(picked, state);
            if (prepared) {
              prepared.youthMixerEvent = true;
              pickedEvents.push(prepared);
              if (prepared.id && !nextRandomEventsThisYear.includes(prepared.id)) {
                nextRandomEventsThisYear.push(prepared.id);
              }
              nextLastRandomEventId = prepared.id;
              nextMixerYouthEventSeasonYear = state.year;
            }
          }
        }

        if (pickedEvents.length > 0) {
            for (let i = 0; i < pickedEvents.length - 1; i++) {
                const nextEv = pickedEvents[i + 1];
                if (pickedEvents[i].options && pickedEvents[i].options.length > 0) {
                    pickedEvents[i].options = pickedEvents[i].options.map(opt => {
                        if (opt.nextEvent) return opt;
                        return { ...opt, nextEvent: nextEv };
                    });
                } else {
                    pickedEvents[i].nextEvent = nextEv;
                }
            }
            eventToTrigger = pickedEvents[0];
        }

        // Qualify for UCL every season from year 2: after Q2 settlement (before Q3 begins)
        if (canEnterUclAfterQ2) {
            const { teams16, opponentQueue } = buildUclTeams16(state);
            const playerLeagueId = state.currentTeam?.leagueId;
            const playerId = state.currentTeam?.id;
            const drawCandidates = (teams16 || []).filter(t => t && t.id && t.id !== playerId && t.leagueId !== playerLeagueId);
            nextUclActive = true;
            nextUclAlive = true;
            nextUclStage = 'intro';
            nextUclSeasonYear = state.year;
            nextUclTeams16 = teams16;
            nextUclDrawCandidates = drawCandidates;
            nextUclOpponentQueue = opponentQueue;
            nextUclCurrentOpponent = null;

            const intro = buildUclIntroEvent();
            if (settlementEvent) {
                const prevNext = settlementEvent.nextEvent;
                settlementEvent = { ...settlementEvent, nextEvent: { ...intro, nextEvent: prevNext } };
            } else {
                if (eventToTrigger) intro.nextEvent = eventToTrigger;
                eventToTrigger = intro;
            }
        }

        // UCL knockout matches are scheduled at the start of each month in Q3 (they replace random events).
        // Use nextMonth/nextQuarter (the newly advanced time) so the UI date stays consistent and we don't
        // show next season before the final.
        if (nextUclActive && nextUclAlive && nextQuarter === 3) {
            let stageToPlay = null;
            if (nextMonth === 2 && nextUclStage === 'qf') stageToPlay = 'qf';
            else if (nextMonth === 3 && nextUclStage === 'sf') stageToPlay = 'sf';
            else if (nextMonth === 3 && nextUclStage === 'final') stageToPlay = 'final';

            if (stageToPlay) {
                const opp = nextUclOpponentQueue.shift();
                if (opp) {
                    nextUclCurrentOpponent = opp;
                    const uclEvent = buildUclMatchEvent({ stage: stageToPlay, opponent: opp });

                    // If this is the final in Q3M3, chain the quarter/season settlement after the UCL match.
                    if (settlementEvent && stageToPlay === 'final') {
                        const seasonEndRanking = quarterEstimatedRanking ?? nextEstimatedRanking;
                        const qualifiedNextSeason = seasonEndRanking <= 4;
                        nextUclQualifiedNextSeason = qualifiedNextSeason;

                        const leagueId = state.currentTeam?.leagueId || 'epl';
                        const relegationLine = leagueId === 'bundesliga' ? 17 : 18;
                        const shouldRelegate = typeof seasonEndRanking === 'number' && seasonEndRanking >= relegationLine;
                        if (shouldRelegate) {
                          const applied = tryApplyYouthCalmProtection({
                            stats: statsAfterMonth,
                            specialMechanicState: nextSpecialState,
                            youthSquadPlayers: nextYouthSquadPlayers,
                            teamId: state.currentTeam?.id
                          });
                          if (applied.applied) {
                            statsAfterMonth = applied.stats;
                            nextSpecialState = applied.specialMechanicState;
                          } else {
                            forcedGameStateAfterMonth = 'relegation_resign';
                            nextRelegationFinalRanking = seasonEndRanking;
                          }
                        }

                        if (qualifiedNextSeason) {
                            statsAfterMonth.funds = clampFunds((statsAfterMonth.funds ?? 0) + 2, state.currentTeam?.id);
                        }

                        const seasonSettlementEvent = buildSeasonSettlementEvent({
                            seasonYear: state.year,
                            ranking: seasonEndRanking,
                            points: (seasonSettlementPoints ?? statsAfterMonth.points),
                            champion: victory,
                            uclQualifiedNextSeason: qualifiedNextSeason
                        });

                        if (eventToTrigger) {
                            seasonSettlementEvent.options = seasonSettlementEvent.options.map(opt => ({ ...opt, nextEvent: eventToTrigger }));
                        }

                        uclEvent.options = uclEvent.options.map(opt => ({ ...opt, nextEvent: seasonSettlementEvent }));
                        settlementEvent = null;
                        eventToTrigger = uclEvent;
                    } else {
                        if (eventToTrigger) {
                            queuedEvent = eventToTrigger;
                        }
                        eventToTrigger = uclEvent;
                    }
                }
            }
        }

        // Settlement report takes priority, but chains into any other event
        if (settlementEvent) {
            // At season end, show season settlement (and optionally end the game after confirming)
            if (state.quarter === 3) {
                const seasonEndRanking = quarterEstimatedRanking ?? nextEstimatedRanking;
                const qualifiedNextSeason = seasonEndRanking <= 4;
                nextUclQualifiedNextSeason = qualifiedNextSeason;

                const leagueId = state.currentTeam?.leagueId || 'epl';
                const relegationLine = leagueId === 'bundesliga' ? 17 : 18;
                const shouldRelegate = typeof seasonEndRanking === 'number' && seasonEndRanking >= relegationLine;
                if (shouldRelegate) {
                  const applied = tryApplyYouthCalmProtection({
                    stats: statsAfterMonth,
                    specialMechanicState: nextSpecialState,
                    youthSquadPlayers: nextYouthSquadPlayers,
                    teamId: state.currentTeam?.id
                  });
                  if (applied.applied) {
                    statsAfterMonth = applied.stats;
                    nextSpecialState = applied.specialMechanicState;
                  } else {
                    forcedGameStateAfterMonth = 'relegation_resign';
                    nextRelegationFinalRanking = seasonEndRanking;
                  }
                }

                if (qualifiedNextSeason) {
                    statsAfterMonth.funds = clampFunds((statsAfterMonth.funds ?? 0) + 2, state.currentTeam?.id);
                }

                const seasonSettlementEvent = buildSeasonSettlementEvent({
                    seasonYear: state.year,
                    ranking: seasonEndRanking,
                    points: (seasonSettlementPoints ?? statsAfterMonth.points),
                    champion: victory,
                    uclQualifiedNextSeason: qualifiedNextSeason
                });

                if (victory && state.uclWonSeasonYear === state.year) {
                    // Double crown (league + UCL) end screen: skip season settlement
                    nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'double_crown');
                    if (state.currentTeam?.id === 'dortmund' && isKloppName(state.playerName)) {
                        nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'klopp_dortmund_double_crown');
                    }
                    statsAfterMonth.points = 0;
                    statsAfterMonth.tactics = Math.max(0, Math.min(10, (statsAfterMonth.tactics ?? 0) - 2));
                    statsAfterMonth.funds = clampFunds((statsAfterMonth.funds ?? 0) + 10, state.currentTeam?.id);

                    if (state.currentTeam?.id === 'ac_milan') {
                      const all = ['milan_baresi', 'milan_nesta', 'milan_maldini'];
                      const milanLegendIds = new Set(all);
                      nextActiveBuffs = nextActiveBuffs.filter(b => !milanLegendIds.has(b));
                      const picked = all[Math.floor(Math.random() * all.length)];
                      nextActiveBuffs.push(picked);
                      nextSpecialState = { ...(nextSpecialState || {}), milanLegendsUsedThisSeason: [picked] };
                    }

                    // Apply season rollover immediately so "continue coaching" starts a new season.
                    nextMonth = 1;
                    nextQuarter = 1;
                    nextYear = (state.year ?? 1) + 1;

                    if (nextYear >= 6 && nextYear !== state.year) {
                      if (state.currentTeam?.id === 'real_madrid') {
                        nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'rm_5_years');
                      }
                      if (state.currentTeam?.id === 'ac_milan') {
                        nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'ac_milan_5_years');
                      }
                      if (state.currentTeam?.id === 'fc_barcelona') {
                        nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'barca_5_years');
                      }
                      if (state.currentTeam?.id === 'dortmund') {
                        nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'dortmund_5_years');
                      }
                      if (state.currentTeam?.id === 'chelsea') {
                        nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'chelsea_5_years');
                      }
                      if (state.currentTeam?.id === 'liverpool') {
                        nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'liverpool_5_years');
                      }
                      if (state.currentTeam?.id === 'arsenal') {
                        nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'arsenal_5_years');
                      }
                      if (state.currentTeam?.id === 'man_utd') {
                        nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'manutd_5_years');
                      }
                      if (state.currentTeam?.id === 'bayern_munich') {
                        nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'bayern_5_years');
                      }
                      if (state.currentTeam?.id === 'man_city') {
                        nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'man_city_5_years');
                      }
                    }
                    nextCoffeeRefUsedThisQuarter = false;
                    nextExplodeUsedThisQuarter = false;
                    nextRandomEventsThisYear = [];
                    nextLastRandomEventId = null;
                    pointsThisQuarterAfterMonth = 0;

                    // Youth academy should unlock at the start of season 3 for all teams.
                    // Double-crown flow skips season settlement, so we must apply the unlock here.
                    if (nextYear >= 3) {
                      nextYouthRefreshUsedThisQuarter = false;
                      nextAchievementsState = {
                        ...nextAchievementsState,
                        youthAcademyUnlocked: true,
                        youthAcademyUnlockPending: false,
                        youthRefreshUsedThisQuarter: false
                      };

                      if (!nextAchievementsState.youthAcademyPlayer) {
                        const isBarca = state.currentTeam?.id === 'fc_barcelona';
                        nextAchievementsState = {
                          ...nextAchievementsState,
                          youthAcademyPlayer: isBarca
                            ? generateYouthPlayer({ techMin: 4, techMax: 8 })
                            : generateYouthPlayer()
                        };
                      }
                    }
                    {
                      const shouldGrantSeasonFreePoint = state.youthSeasonFreePointsGrantedYear !== nextYear;

                      if (Boolean(nextAchievementsState.youthAcademyUnlocked)) {
                        const normalizedAcademy = normalizeYouthPlayer(nextAchievementsState.youthAcademyPlayer);
                        const isBarca = state.currentTeam?.id === 'fc_barcelona';

                        if (isBarca) {
                          nextAchievementsState = {
                            ...nextAchievementsState,
                            youthAcademyPlayer: generateYouthPlayer({ techMin: 4, techMax: 8 })
                          };
                        } else if (normalizedAcademy) {
                          let nextAcademy = {
                            ...normalizedAcademy,
                            age: clampInt((normalizedAcademy.age ?? 17) + 1, 0, 99),
                            freePoints: clampInt((normalizedAcademy.freePoints ?? 0), 0, 9999)
                          };

                          if ((nextAcademy.specialTraitId || '') === 'eco_guardian') {
                            nextAcademy = {
                              ...nextAcademy,
                              ecoMissingSeasonYear: clampInt(nextYear, 0, 99),
                              ecoMissingQuarter: clampInt(1 + Math.floor(Math.random() * 3), 0, 3)
                            };
                          }

                          nextAchievementsState = { ...nextAchievementsState, youthAcademyPlayer: nextAcademy };
                        } else {
                          nextAchievementsState = {
                            ...nextAchievementsState,
                            youthAcademyPlayer: generateYouthPlayer()
                          };
                        }

                        const youthLimit = getYouthSquadMax(state.currentTeam?.id);
                        nextYouthSquadPlayers = Array.isArray(nextYouthSquadPlayers)
                          ? nextYouthSquadPlayers
                            .map(normalizeYouthPlayer)
                            .filter(Boolean)
                            .slice(0, youthLimit)
                          : [];

                        nextYouthSquadPlayers = nextYouthSquadPlayers.map(p => {
                          let next = {
                            ...p,
                            age: clampInt((p.age ?? 17) + 1, 0, 99),
                            freePoints: clampInt((p.freePoints ?? 0) + (shouldGrantSeasonFreePoint ? 1 : 0), 0, 9999)
                          };

                          if ((next.positiveTraitId || '') === 'loyal' && next.hasArmband) {
                            next = { ...next, diligence: clampInt((next.diligence ?? 0) + 2, 0, 10) };
                          }

                          if ((next.specialTraitId || '') === 'eco_guardian') {
                            next = {
                              ...next,
                              ecoMissingSeasonYear: clampInt(nextYear, 0, 99),
                              ecoMissingQuarter: clampInt(1 + Math.floor(Math.random() * 3), 0, 3)
                            };
                          }

                          return next;
                        });
                      }

                      if (shouldGrantSeasonFreePoint) {
                        nextAchievementsState = {
                          ...nextAchievementsState,
                          youthSeasonFreePointsGrantedYear: nextYear
                        };
                      }
                    }

                    {
                      const seasonYear = state.year;
                      const league = Array.isArray(nextAchievementsState.leagueChampionYears) ? nextAchievementsState.leagueChampionYears : [];
                      const ucl = Array.isArray(nextAchievementsState.uclChampionYears) ? nextAchievementsState.uclChampionYears : [];
                      nextAchievementsState = {
                        ...nextAchievementsState,
                        leagueChampionYears: league.includes(seasonYear) ? league : [...league, seasonYear],
                        uclChampionYears: ucl.includes(seasonYear) ? ucl : [...ucl, seasonYear]
                      };
                    }

                    nextLeagueOpponents = buildLeagueOpponents({
                      leagueId: state.currentTeam?.leagueId || 'epl',
                      playerTeamId: state.currentTeam?.id,
                      playerTactics: statsAfterMonth.tactics
                    });

                    nextLeagueSchedule = buildLeagueSchedule({
                      leagueId: state.currentTeam?.leagueId || 'epl',
                      playerTeamId: state.currentTeam?.id,
                      opponents: nextLeagueOpponents
                    });
                    nextLeagueRoundCursor = 0;
                    nextLeagueMatchResults = {};

                    nextPendingSeasonReset = false;
                    nextUclQualifiedThisSeason = qualifiedNextSeason;
                    nextUclQualifiedNextSeason = false;
                    nextUclActive = false;
                    nextUclAlive = false;
                    nextUclStage = null;
                    nextUclSeasonYear = null;
                    nextUclTeams16 = [];
                    nextUclDrawCandidates = [];
                    nextUclOpponentQueue = [];
                    nextUclCurrentOpponent = null;

                    eventToTrigger = null;
                    queuedEvent = null;
                    forcedGameStateAfterMonth = 'double_crown';
                } else {
                    eventToTrigger = seasonSettlementEvent;
                    queuedEvent = null;
                }
            } else {
                if (eventToTrigger) {
                    if (settlementEvent.nextEvent) {
                      settlementEvent = {
                        ...settlementEvent,
                        nextEvent: appendEventToTail(settlementEvent.nextEvent, eventToTrigger)
                      };
                    } else {
                      settlementEvent = { ...settlementEvent, nextEvent: eventToTrigger };
                    }
                }
                eventToTrigger = settlementEvent;
            }
        }

        if (forcedEvent) {
            if (eventToTrigger) {
                queuedEvent = eventToTrigger;
            }
            eventToTrigger = forcedEvent;
        }
        if (autoFlirtEvent) {
          const follow = eventToTrigger || queuedEvent;
          const firstOpt = Array.isArray(autoFlirtEvent.options) ? autoFlirtEvent.options[0] : null;
          if (firstOpt && follow) {
            autoFlirtEvent = {
              ...autoFlirtEvent,
              options: [{ ...firstOpt, nextEvent: follow }]
            };
          }
          if (!eventToTrigger && queuedEvent) {
            queuedEvent = null;
          }
          eventToTrigger = autoFlirtEvent;
        }
        
        // Check Game Over conditions again after monthly updates
        let nextGameStateAfterMonth = state.gameState;

        enforceRainbowArmband(statsAfterMonth, nextActiveBuffs);
        enforceEmmaCamera(statsAfterMonth, nextActiveBuffs);
        enforceYouthUnity10Floor(statsAfterMonth, nextYouthSquadPlayers);

        {
          const adjusted = applyKopFreeze({
            stats: statsAfterMonth,
            activeBuffs: nextActiveBuffs,
            specialMechanicState: nextSpecialState
          });
          statsAfterMonth = adjusted.stats;
          nextSpecialState = adjusted.specialMechanicState;
        }

        if (statsAfterMonth.boardSupport <= 0 || statsAfterMonth.dressingRoom <= 0) {
            nextGameStateAfterMonth = 'gameover';
        }

        if (nextGameStateAfterMonth === 'gameover' && !state.gameoverOverrideText) {
          const applied = tryApplyYouthCalmProtection({
            stats: statsAfterMonth,
            specialMechanicState: nextSpecialState,
            youthSquadPlayers: nextYouthSquadPlayers,
            teamId: state.currentTeam?.id
          });
          if (applied.applied) {
            statsAfterMonth = applied.stats;
            nextSpecialState = applied.specialMechanicState;
            nextGameStateAfterMonth = 'playing';
          }
        }

        if (forcedGameStateAfterMonth) {
            nextGameStateAfterMonth = forcedGameStateAfterMonth;
            pendingGameState = null;
        }

        const shouldResetOpponentTacticsBoostThisQuarter = nextQuarter !== state.quarter;

        if (shouldResetOpponentTacticsBoostThisQuarter) {
          const prevRemaining = typeof nextSpecialState.kopFreezeRemainingQuarters === 'number'
            ? nextSpecialState.kopFreezeRemainingQuarters
            : 0;
          if (prevRemaining > 0) {
            nextSpecialState.kopFreezeRemainingQuarters = Math.max(0, prevRemaining - 1);
          }
        }

        let stateAfterMonth = {
            ...nextAchievementsState,
            stats: statsAfterMonth,
            month: nextMonth,
            quarter: nextQuarter,
            year: nextYear,
            decisionPoints: (nextYear === 1 && nextActiveBuffs.includes('dortmund_unlicensed')) ? 2 : 3,
            decisionCountThisMonth: 0, // Reset decision count for new month
            activeDecisionsTaken: [],
            opponentTacticsBoostThisMonth: shouldResetOpponentTacticsBoostThisQuarter ? 0 : (state.opponentTacticsBoostThisMonth || 0),
            currentEvent: eventToTrigger,
            gameState: nextGameStateAfterMonth,
            tabloidCount: nextTabloidCount,
            activeBuffs: nextActiveBuffs,
            pointsThisQuarter: pointsThisQuarterAfterMonth,
            estimatedRanking: nextEstimatedRanking,
            specialMechanicState: nextSpecialState,
            queuedEvent: queuedEvent,
            randomEventsThisYear: nextRandomEventsThisYear,
            lastRandomEventId: nextLastRandomEventId,
            pendingGameState: pendingGameState,
            pendingSave: state.pendingSave ? state.pendingSave : (shouldAutoSave ? { type: 'auto' } : null),
            pendingSeasonReset: nextPendingSeasonReset,
            relegationFinalRanking: nextRelegationFinalRanking,
            youthRandomEventSeasonYear: nextYouthRandomEventSeasonYear,
            mixerYouthEventSeasonYear: nextMixerYouthEventSeasonYear,
            mixerMediaEducateCount: nextMixerMediaEducateCount,
            coffeeRefUsedThisQuarter: nextCoffeeRefUsedThisQuarter,
            explodeUsedThisQuarter: nextExplodeUsedThisQuarter,
            youthSquadPlayers: nextYouthSquadPlayers,
            youthRefreshUsedThisQuarter: nextYouthRefreshUsedThisQuarter,
            leagueOpponents: nextLeagueOpponents,
            leagueOpponentCursor: state.leagueOpponentCursor,
            leagueSchedule: nextLeagueSchedule,
            leagueRoundCursor: nextLeagueRoundCursor,
            leagueMatchResults: nextLeagueMatchResults,
            uclActive: nextUclActive,
            uclAlive: nextUclAlive,
            uclStage: nextUclStage,
            uclSeasonYear: nextUclSeasonYear,
            uclTeams16: nextUclTeams16,
            uclDrawCandidates: nextUclDrawCandidates,
            uclOpponentQueue: nextUclOpponentQueue,
            uclCurrentOpponent: nextUclCurrentOpponent,
            uclQualifiedThisSeason: nextUclQualifiedThisSeason,
            uclQualifiedNextSeason: nextUclQualifiedNextSeason
        };

        if (nextGameStateAfterMonth === 'gameover' && !state.gameoverOverrideText) {
          const teamId = state.currentTeam?.id;

          if (!state.artetaEasterEggTriggered && teamId === 'arsenal' && isArtetaName(state.playerName)) {
            const firedBy = statsAfterMonth.dressingRoom <= 0 ? 'dressingRoom' : 'boardSupport';
            stateAfterMonth = unlockAchievementInState({
              ...stateAfterMonth,
              gameState: 'playing',
              currentEvent: buildArtetaExHusbandEvent({ firedBy }),
              queuedEvent: null,
              pendingGameState: null,
              artetaEasterEggTriggered: true
            }, 'arteta_ex_husband');
          } else if (
            !state.easterEggTriggered &&
            isAlonsoName(state.playerName) &&
            teamId &&
            teamId !== 'man_utd' &&
            teamId !== 'liverpool'
          ) {
            stateAfterMonth = {
              ...stateAfterMonth,
              gameState: 'playing',
              currentEvent: buildGerrardLetterEvent(),
              queuedEvent: null,
              pendingGameState: 'gameover',
              easterEggTriggered: true
            };
          }
        }

        if (nextGameStateAfterMonth === 'gameover' && state.currentTeam?.id === 'man_utd' && isAlonsoName(state.playerName)) {
          stateAfterMonth = unlockAchievementInState(stateAfterMonth, 'alonso_manutd_fired');
        }

        return stateAfterMonth;
    }
        
    case 'RESOLVE_EVENT': {
        if (action.payload && action.payload.switchTeamId) {
            const nextTeam = teamsData.find(t => t.id === action.payload.switchTeamId);
            if (!nextTeam) return state;

            const switchedBuffs = action.payload.grantBuff ? [action.payload.grantBuff] : [];
            let switchedSpecialState = { ...initialState.specialMechanicState };
            if (nextTeam.id === 'chelsea') {
              switchedBuffs.push('chelsea_sack_pressure');
            }
            if (nextTeam.id === 'liverpool') {
              if (isKloppName(state.playerName)) {
                switchedBuffs.push('kop_freeze_season');
                switchedSpecialState = { ...switchedSpecialState, kopFreezeDurationQuarters: 4 };
              } else {
                switchedBuffs.push('kop_freeze_quarter');
                switchedSpecialState = { ...switchedSpecialState, kopFreezeDurationQuarters: 1 };
              }

              if (isAlonsoName(state.playerName) && !switchedBuffs.includes('istanbul_kiss')) {
                switchedBuffs.push('istanbul_kiss');
              }
            }
            if (nextTeam.id === 'dortmund') {
              switchedBuffs.push('dortmund_emma_camera');
              switchedBuffs.push('dortmund_unlicensed');
            }
            if (nextTeam.id === 'bayern_munich') {
              switchedBuffs.push('bayern_committee');
              switchedBuffs.push('bayern_history_proof');
              switchedSpecialState = { ...switchedSpecialState, bayernDressingRoomRevealed: false, bayernCommitteeRemoved: false };
            }
            if (nextTeam.id === 'fc_barcelona') {
              switchedBuffs.push('barca_board_take');
            }

            // Deduplicate buffs (switch paths can stack grants)
            {
              const unique = [];
              (Array.isArray(switchedBuffs) ? switchedBuffs : []).forEach(b => {
                if (!b) return;
                if (!unique.includes(b)) unique.push(b);
              });
              switchedBuffs.length = 0;
              switchedBuffs.push(...unique);
            }

            const switchLeagueId = nextTeam?.leagueId || 'epl';
            const switchLeagueOpponents = buildLeagueOpponents({
              leagueId: switchLeagueId,
              playerTeamId: nextTeam?.id,
              playerTactics: nextTeam?.initialStats?.tactics
            });
            const switchLeagueSchedule = buildLeagueSchedule({
              leagueId: switchLeagueId,
              playerTeamId: nextTeam?.id,
              opponents: switchLeagueOpponents
            });

            let switched = {
                ...initialState,
                gameState: 'playing',
                currentTeam: nextTeam,
                playerName: state.playerName,
                coachingPhilosophy: state.coachingPhilosophy,
                stats: { ...nextTeam.initialStats, injuryRisk: 0 },
                activeBuffs: switchedBuffs,
                achievementsUnlocked: state.achievementsUnlocked || {},
                achievementToastQueue: state.achievementToastQueue || [],
                tabloidStalkingUnlocked: state.tabloidStalkingUnlocked,
                easterEggTriggered: true,
                hiddenBuffs: [],
                specialMechanicState: switchedSpecialState,
                leagueOpponents: switchLeagueOpponents,
                leagueOpponentCursor: 0,
                leagueSchedule: switchLeagueSchedule,
                leagueRoundCursor: 0,
                leagueMatchResults: {},
                currentEvent: {
                    id: 'welcome_liverpool',
                    title: 'You’ll never walk alone',
                    description: '你接受了邀请，前往利物浦执教。',
                    options: [{ text: '开始执教', effects: {} }]
                }

            };

            if (nextTeam.id === 'fc_barcelona') {
              switched = {
                ...switched,
                youthAcademyUnlocked: true,
                youthAcademyUnlockPending: false,
                youthAcademyPlayer: generateYouthPlayer({ techMin: 4, techMax: 8 }),
                youthSquadPlayers: [],
                youthRefreshUsedThisQuarter: false
              };
            }

            if (state.currentEvent?.id === 'gerrard_letter' && action.payload.switchTeamId === 'liverpool' && isAlonsoName(state.playerName)) {
              switched = unlockAchievementInState(switched, 'alonso_letter_accept');
            }

            return switched;
        }

        let nextLeagueChampionYearsAfterResolve = Array.isArray(state.leagueChampionYears) ? state.leagueChampionYears.slice() : [];
        let nextUclChampionYearsAfterResolve = Array.isArray(state.uclChampionYears) ? state.uclChampionYears.slice() : [];
        let wonUclNow = false;
        let nextPendingGameState = state.pendingGameState;
        let nextMixerMediaEducateCount = state.mixerMediaEducateCount;
        if (action.payload && action.payload.setPendingGameState) {
          nextPendingGameState = action.payload.setPendingGameState;
        }
        const nextTabloidStalkingUnlocked = state.tabloidStalkingUnlocked;
        const nextRelegationFinalRanking = state.relegationFinalRanking;
        const nextSeason2TutorialShown = state.season2TutorialShown;
        const nextInjuryTutorialShown = state.injuryTutorialShown;
        const nextUclTutorialShown = state.uclTutorialShown;
        let nextYouthTutorialShown = state.youthTutorialShown;

        const isResolvingSeasonSettlement = state.pendingSeasonReset && state.currentEvent && state.currentEvent.id === 'season_settlement';
        const postSettlementYear = isResolvingSeasonSettlement
          ? ((typeof state.currentEvent?.seasonYear === 'number') ? (state.currentEvent.seasonYear + 1) : (state.year + 1))
          : state.year;

        const youthLimitAfterResolve = getYouthSquadMax(state.currentTeam?.id);
        let nextYouthSquadPlayersAfterResolve = Array.isArray(state.youthSquadPlayers)
          ? state.youthSquadPlayers.map(normalizeYouthPlayer).filter(Boolean).slice(0, youthLimitAfterResolve)
          : [];

        let nextYouthAcademyPlayerAfterResolve = normalizeYouthPlayer(state.youthAcademyPlayer);
        let nextYouthAcademyUnlockedAfterResolve = Boolean(state.youthAcademyUnlocked);
        let nextYouthAcademyUnlockPendingAfterResolve = Boolean(state.youthAcademyUnlockPending);
        let nextYouthRefreshUsedThisQuarterAfterResolve = Boolean(state.youthRefreshUsedThisQuarter);
        let promotedYouthForAchievement = null;

        // Apply event option effects
        const eventEffects = { ...(action.payload.effects || {}) };
        const eventDecisionRecord = action.payload?.decisionRecord;
        let nextDecisionHistoryAfterEvent = Array.isArray(state.decisionHistory) ? state.decisionHistory.slice() : [];
        if (eventDecisionRecord) {
          nextDecisionHistoryAfterEvent.push(String(eventDecisionRecord));
        }

        if (eventEffects.youth_free_points) {
          const pts = clampInt(eventEffects.youth_free_points ?? 0, -9999, 9999);
          if (pts !== 0) {
            const targetId = state.currentEvent?.youthTargetId;
            const hasSquad = nextYouthSquadPlayersAfterResolve.length > 0;
            const academy = nextYouthAcademyPlayerAfterResolve;
            const academyId = academy?.id;

            if (hasSquad) {
              const idx = targetId
                ? nextYouthSquadPlayersAfterResolve.findIndex(p => p && p.id === targetId)
                : -1;
              if (idx >= 0) {
                nextYouthSquadPlayersAfterResolve = nextYouthSquadPlayersAfterResolve.map((p, i) => {
                  if (i !== idx) return p;
                  return { ...p, freePoints: clampInt((p.freePoints ?? 0) + pts, 0, 9999) };
                });
              } else if (academy && academyId && targetId && academyId === targetId) {
                nextYouthAcademyPlayerAfterResolve = {
                  ...academy,
                  freePoints: clampInt((academy.freePoints ?? 0) + pts, 0, 9999)
                };
              } else {
                nextYouthSquadPlayersAfterResolve = nextYouthSquadPlayersAfterResolve.map((p, i) => {
                  if (i !== 0) return p;
                  return { ...p, freePoints: clampInt((p.freePoints ?? 0) + pts, 0, 9999) };
                });
              }
            } else if (academy) {
              nextYouthAcademyPlayerAfterResolve = {
                ...academy,
                freePoints: clampInt((academy.freePoints ?? 0) + pts, 0, 9999)
              };
            }
          }
          delete eventEffects.youth_free_points;
        }

        if (state.currentEvent?.youthMixerEvent && action.payload?.id === 'media_educate') {
          nextMixerMediaEducateCount = clampInt((state.mixerMediaEducateCount ?? 0) + 1, 0, 999999);
        }

        if (
          isRandomEventId(state.currentEvent?.id, state.currentTeam?.id) &&
          hasYouthPositiveTrait(state.youthSquadPlayers, 'stable') &&
          typeof eventEffects.tactics === 'number' &&
          eventEffects.tactics < 0
        ) {
          if (Math.random() < 0.5) {
            delete eventEffects.tactics;
          }
        }

        if (state.currentEvent?.id === 'intro' && state.currentTeam?.id === 'bayern_munich' && isMusialaName(state.playerName)) {
          return unlockAchievementInState({
            ...state,
            currentEvent: buildMusialaBayernEasterEggEvent(),
            queuedEvent: null
          }, 'musiala_bayern_fired');
        }

        // Special: El Clasico option is probabilistic (as narrative suggests)
        if (state.currentEvent && state.currentEvent.id === 'el_clasico' && !state.currentEvent.isOutcome) {
            if (action.payload && action.payload.id === 'go') {
                delete eventEffects.tactics;
                delete eventEffects.mediaSupport;

                const tacticsDelta = Math.random() < 0.5 ? 0.5 : -0.5;
                eventEffects.tactics = tacticsDelta;

                if (Math.random() < 0.5) {
                    eventEffects.mediaSupport = -10;
                }
            }
        }
        const statsAfterEvent = { ...state.stats };
        
        // Handle Buffs from events
        let eventActiveBuffs = [...state.activeBuffs];
        let nextSpecialMechanicStateAfterEvent = state.specialMechanicState;

        if (
          typeof state.currentEvent?.id === 'string' &&
          ['union_weapon_1', 'union_weapon_2', 'union_weapon_3', 'union_weapon_4'].includes(state.currentEvent.id)
        ) {
          const prev = Array.isArray(nextSpecialMechanicStateAfterEvent?.unionWeaponEventsTriggered)
            ? nextSpecialMechanicStateAfterEvent.unionWeaponEventsTriggered
            : [];
          if (!prev.includes(state.currentEvent.id)) {
            nextSpecialMechanicStateAfterEvent = {
              ...(nextSpecialMechanicStateAfterEvent || {}),
              unionWeaponEventsTriggered: [...prev, state.currentEvent.id]
            };
          }
        }
        if (action.payload?.removeBuffs && Array.isArray(action.payload.removeBuffs)) {
          const remove = new Set(action.payload.removeBuffs.filter(Boolean));
          eventActiveBuffs = eventActiveBuffs.filter(b => !remove.has(b));
        }

        if (action.payload?.grantBuff) {
          if (!eventActiveBuffs.includes(action.payload.grantBuff)) {
            eventActiveBuffs.push(action.payload.grantBuff);
          }
        }
        if (eventEffects.special_rainbow_armband) {
            if (!eventActiveBuffs.includes('rainbow_armband')) {
                eventActiveBuffs.push('rainbow_armband');
            }
        }

        if (eventEffects.special_bayern_remove_committee) {
            eventActiveBuffs = eventActiveBuffs.filter(b => b !== 'bayern_committee');
            nextSpecialMechanicStateAfterEvent = {
              ...(nextSpecialMechanicStateAfterEvent || {}),
              bayernCommitteeRemoved: true
            };
        }

        let nextTabloidCountAfterEvent = state.tabloidCount;
        let pointsThisQuarterAfterEvent = state.pointsThisQuarter;

        if (eventEffects.points_bonus) {
          statsAfterEvent.points += eventEffects.points_bonus;
          pointsThisQuarterAfterEvent += eventEffects.points_bonus;
        }

        // Tabloid accumulation from events (random events can have these effects)
        if (eventEffects.chance_tabloid) {
            if (Math.random() < 0.5) {
                nextTabloidCountAfterEvent += 1;
            }
        } else if (eventEffects.tabloid) {
            nextTabloidCountAfterEvent += eventEffects.tabloid;
        }

        let scandalEventAfterResolve = null;
        if (nextTabloidCountAfterEvent >= 3) {
            nextTabloidCountAfterEvent = 0;
            scandalEventAfterResolve = buildTabloidBreakingEvent();
        }

        Object.keys(eventEffects).forEach(key => {
             if (key === 'special_rainbow_armband' || key === 'special_bayern_remove_committee' || key === 'chance_tabloid' || key === 'tabloid' || key === 'points_bonus') return;

             const redirected = redirectNegativeStatEffect(statsAfterEvent, key, eventEffects[key]);
             const targetKey = redirected.key;
             const delta = redirected.delta;

             if (statsAfterEvent[targetKey] !== undefined) {
                statsAfterEvent[targetKey] += delta;
                
                // Clamp values
                if (['boardSupport', 'dressingRoom', 'mediaSupport', 'authority'].includes(targetKey)) {
                    statsAfterEvent[targetKey] = Math.max(0, Math.min(100, statsAfterEvent[targetKey]));
                } else if (targetKey === 'tactics') {
                    statsAfterEvent[targetKey] = Math.max(0, Math.min(10, statsAfterEvent[targetKey]));
                } else if (targetKey === 'funds') {
                    statsAfterEvent[targetKey] = clampFunds(statsAfterEvent[targetKey], state.currentTeam?.id);
                } else if (targetKey === 'injuryRisk') {
                    statsAfterEvent[targetKey] = Math.max(0, statsAfterEvent[targetKey]);
                }
             }
        });

        enforceRainbowArmband(statsAfterEvent, eventActiveBuffs);
        enforceEmmaCamera(statsAfterEvent, eventActiveBuffs);

        const syncedBuffsAfterEvent = syncDerivedBuffs({
          activeBuffs: eventActiveBuffs,
          stats: statsAfterEvent,
          teamId: state.currentTeam?.id,
          specialMechanicState: nextSpecialMechanicStateAfterEvent
        });

        let finalStatsAfterEvent = statsAfterEvent;
        let finalEstimatedRanking = state.estimatedRanking;
        let finalPendingSeasonReset = state.pendingSeasonReset;
        let finalBuffsAfterEvent = syncedBuffsAfterEvent;

        let resetLeagueOpponents = state.leagueOpponents;
        let resetLeagueOpponentCursor = state.leagueOpponentCursor;
        let resetLeagueSchedule = state.leagueSchedule;
        let resetLeagueRoundCursor = state.leagueRoundCursor;
        let resetLeagueMatchResults = state.leagueMatchResults;

        let resetCrossLeagueTacticsInflation = clampNumber(state.crossLeagueTacticsInflation || 0, 0, 2);

        let resetUclActive = state.uclActive;
        let resetUclAlive = state.uclAlive;
        let resetUclStage = state.uclStage;
        let resetUclSeasonYear = state.uclSeasonYear;
        let resetUclTeams16 = Array.isArray(state.uclTeams16) ? state.uclTeams16 : [];
        let resetUclDrawCandidates = Array.isArray(state.uclDrawCandidates) ? state.uclDrawCandidates : [];
        let resetUclOpponentQueue = Array.isArray(state.uclOpponentQueue) ? state.uclOpponentQueue : [];
        let resetUclCurrentOpponent = state.uclCurrentOpponent;

        let resetUclQualifiedThisSeason = state.uclQualifiedThisSeason;
        let resetUclQualifiedNextSeason = state.uclQualifiedNextSeason;

        if (isResolvingSeasonSettlement) {
          if (state.currentTeam?.id === 'ac_milan') {
            const milanLegendIds = new Set(['milan_baresi', 'milan_nesta', 'milan_maldini']);
            eventActiveBuffs = eventActiveBuffs.filter(b => !milanLegendIds.has(b));

            const all = ['milan_baresi', 'milan_nesta', 'milan_maldini'];
            const picked = all[Math.floor(Math.random() * all.length)];
            nextSpecialMechanicStateAfterEvent = { ...(nextSpecialMechanicStateAfterEvent || {}), milanLegendsUsedThisSeason: [picked] };
            eventActiveBuffs.push(picked);
          }

          finalStatsAfterEvent = { ...statsAfterEvent };
          finalStatsAfterEvent.points = 0;
          {
            const youthSeasonProfile = getYouthSquadProfile(nextYouthSquadPlayersAfterResolve);
            const drop = youthSeasonProfile.seasonTacticsDrop;
            finalStatsAfterEvent.tactics = Math.max(0, Math.min(10, (finalStatsAfterEvent.tactics ?? 0) - drop));
          }
          if (state.currentTeam?.id === 'fc_barcelona') {
            finalStatsAfterEvent.funds = clampFunds((finalStatsAfterEvent.funds ?? 0) - 10, state.currentTeam?.id);
          } else {
            finalStatsAfterEvent.funds = clampFunds((finalStatsAfterEvent.funds ?? 0) + 10, state.currentTeam?.id);
          }
          finalEstimatedRanking = 1;
          finalPendingSeasonReset = false;
          pointsThisQuarterAfterEvent = 0;

          if (state.currentTeam?.id === 'dortmund') {
            eventActiveBuffs = eventActiveBuffs.filter(b => b !== 'dortmund_unlicensed');
          }

          nextSpecialMechanicStateAfterEvent = {
            ...(nextSpecialMechanicStateAfterEvent || {}),
            canteenChangedThisSeason: { open: false, close: false },
            roofChangedThisSeason: { open: false, close: false },
            milanLegendsUsedThisSeason: (state.currentTeam?.id === 'ac_milan'
              ? (Array.isArray(nextSpecialMechanicStateAfterEvent?.milanLegendsUsedThisSeason)
                ? nextSpecialMechanicStateAfterEvent.milanLegendsUsedThisSeason
                : [])
              : []),
            manCityAutoFlirtUsedTypesThisSeason: []
          };

          resetCrossLeagueTacticsInflation = clampNumber(resetCrossLeagueTacticsInflation * 0.5, 0, 2);

          resetLeagueOpponents = buildLeagueOpponents({
            leagueId: state.currentTeam?.leagueId || 'epl',
            playerTeamId: state.currentTeam?.id,
            playerTactics: finalStatsAfterEvent.tactics
          });
          resetLeagueOpponentCursor = 0;

          const leagueId = state.currentTeam?.leagueId || 'epl';
          const playerTeamId = state.currentTeam?.id;
          resetLeagueSchedule = buildLeagueSchedule({
            leagueId,
            playerTeamId,
            opponents: resetLeagueOpponents
          });
          resetLeagueRoundCursor = 0;
          resetLeagueMatchResults = {};

          resetUclActive = false;
          resetUclAlive = false;
          resetUclStage = null;
          resetUclSeasonYear = null;
          resetUclTeams16 = [];
          resetUclDrawCandidates = [];
          resetUclOpponentQueue = [];
          resetUclCurrentOpponent = null;

          const derivedQualifiedThisSeason = (typeof state.currentEvent?.ranking === 'number')
            ? (state.currentEvent.ranking <= 4)
            : null;
          resetUclQualifiedThisSeason = (derivedQualifiedThisSeason === null)
            ? Boolean(state.uclQualifiedNextSeason)
            : Boolean(derivedQualifiedThisSeason);
          resetUclQualifiedNextSeason = false;

          finalBuffsAfterEvent = syncDerivedBuffs({
            activeBuffs: eventActiveBuffs,
            stats: finalStatsAfterEvent,
            teamId: state.currentTeam?.id,
            specialMechanicState: nextSpecialMechanicStateAfterEvent
          });
        }

        if (!finalPendingSeasonReset && !isResolvingSeasonSettlement && finalStatsAfterEvent.points !== state.stats.points) {
          const played = monthsPlayedFromState(state);
          const leagueSize = getLeagueRoster(state.currentTeam?.leagueId || 'epl')?.length || 20;
          finalEstimatedRanking = estimateRankingFromPoints(finalStatsAfterEvent.points, played, leagueSize);
        }
        
        // Check Game Over conditions after event resolution
        let gameStateAfterEvent = state.gameState;

        {
          const youthProfileAfterEvent = getYouthSquadProfile(nextYouthSquadPlayersAfterResolve);
          if (youthProfileAfterEvent.hasArmbandUnity10) {
            finalStatsAfterEvent = { ...finalStatsAfterEvent, dressingRoom: Math.max(40, clampNumber(finalStatsAfterEvent.dressingRoom, 0, 100)) };
          }
        }

        {
          const adjusted = applyKopFreeze({
            stats: finalStatsAfterEvent,
            activeBuffs: finalBuffsAfterEvent,
            specialMechanicState: nextSpecialMechanicStateAfterEvent
          });
          finalStatsAfterEvent = adjusted.stats;
          nextSpecialMechanicStateAfterEvent = adjusted.specialMechanicState;
        }

        if (finalStatsAfterEvent.boardSupport <= 0 || finalStatsAfterEvent.dressingRoom <= 0) {
            gameStateAfterEvent = 'gameover';
        }

        if (nextPendingGameState) {
          gameStateAfterEvent = nextPendingGameState;
          nextPendingGameState = null;
        }

        if (gameStateAfterEvent === 'gameover' && !state.gameoverOverrideText) {
          const applied = tryApplyYouthCalmProtection({
            stats: finalStatsAfterEvent,
            specialMechanicState: nextSpecialMechanicStateAfterEvent,
            youthSquadPlayers: nextYouthSquadPlayersAfterResolve,
            teamId: state.currentTeam?.id
          });
          if (applied.applied) {
            finalStatsAfterEvent = applied.stats;
            nextSpecialMechanicStateAfterEvent = applied.specialMechanicState;
            gameStateAfterEvent = 'playing';
          }
        }

        if (gameStateAfterEvent === 'gameover' && !state.gameoverOverrideText) {
          const teamId = state.currentTeam?.id;

          if (!state.artetaEasterEggTriggered && teamId === 'arsenal' && isArtetaName(state.playerName)) {
            const firedBy = finalStatsAfterEvent.dressingRoom <= 0 ? 'dressingRoom' : 'boardSupport';
            return unlockAchievementInState({
              ...state,
              stats: finalStatsAfterEvent,
              activeBuffs: finalBuffsAfterEvent,
              tabloidCount: nextTabloidCountAfterEvent,
              pointsThisQuarter: pointsThisQuarterAfterEvent,
              pendingSeasonReset: finalPendingSeasonReset,
              estimatedRanking: finalEstimatedRanking,
              mixerMediaEducateCount: nextMixerMediaEducateCount,
              gameState: 'playing',
              currentEvent: buildArtetaExHusbandEvent({ firedBy }),
              queuedEvent: null,
              pendingGameState: null,
              artetaEasterEggTriggered: true
            }, 'arteta_ex_husband');
          }

          if (
            !state.easterEggTriggered &&
            isAlonsoName(state.playerName) &&
            teamId &&
            teamId !== 'man_utd' &&
            teamId !== 'liverpool'
          ) {
            return {
              ...state,
              stats: finalStatsAfterEvent,
              activeBuffs: finalBuffsAfterEvent,
              tabloidCount: nextTabloidCountAfterEvent,
              pointsThisQuarter: pointsThisQuarterAfterEvent,
              pendingSeasonReset: finalPendingSeasonReset,
              estimatedRanking: finalEstimatedRanking,
              mixerMediaEducateCount: nextMixerMediaEducateCount,
              gameState: 'playing',
              currentEvent: buildGerrardLetterEvent(),
              queuedEvent: null,
              pendingGameState: 'gameover',
              easterEggTriggered: true
            };
          }
        }

        let nextCurrentEvent = null;
        let nextQueuedEvent = state.queuedEvent;

        // Determine what would come next (normal flow)
        if (action.payload.nextEvent) {
            nextCurrentEvent = action.payload.nextEvent;
        } else if (state.queuedEvent) {
            nextCurrentEvent = state.queuedEvent;
            nextQueuedEvent = null;
        }

        // If this event reveals outcome text after choice, insert an outcome event before continuing.
        // EventCard hides opt.effects when revealAfterChoice is true, so the outcome event is the place
        // where both the outcome text and effect preview should be shown.
        if (
          state.currentEvent?.revealAfterChoice &&
          !state.currentEvent?.isOutcome &&
          typeof action.payload?.outcomeText === 'string' &&
          action.payload.outcomeText.trim().length > 0
        ) {
          const follow = nextCurrentEvent || null;
          nextCurrentEvent = _buildChoiceOutcomeEvent({
            baseEvent: state.currentEvent,
            option: action.payload,
            effectsPreview: action.payload.effects || {},
            nextEvent: follow
          });
          nextQueuedEvent = null;
        }

        // If tabloid scandal triggers, it takes priority but does not lose the next event
        if (scandalEventAfterResolve) {
            let afterScandal = nextCurrentEvent;
            let tail = nextQueuedEvent;

            if (afterScandal && tail) {
              if (afterScandal.options && afterScandal.options.length > 0) {
                afterScandal = {
                  ...afterScandal,
                  options: afterScandal.options.map(opt => (opt && opt.nextEvent ? opt : { ...opt, nextEvent: tail }))
                };
              } else if (afterScandal.nextEvent) {
                afterScandal = { ...afterScandal, nextEvent: afterScandal.nextEvent };
              } else {
                afterScandal = { ...afterScandal, nextEvent: tail };
              }
              tail = null;
            }

            nextCurrentEvent = buildTabloidBreakingEvent(afterScandal || tail || null);
            nextQueuedEvent = null;
        }

        if (state.year >= 2 && (finalStatsAfterEvent.injuryRisk ?? 0) >= 5) {
            finalStatsAfterEvent = { ...finalStatsAfterEvent, injuryRisk: Math.max(0, (finalStatsAfterEvent.injuryRisk ?? 0) - 5) };
            const after = nextCurrentEvent || nextQueuedEvent || null;
            const remainingQueued = nextCurrentEvent ? nextQueuedEvent : null;
            nextCurrentEvent = buildInjuryCrisisEvent(after);
            nextQueuedEvent = remainingQueued;
        }

        let afterUclNextEvent = null;

        if (action.payload && action.payload.uclAction === 'UCL_INTRO') {
            const candidates = Array.isArray(state.uclDrawCandidates) ? state.uclDrawCandidates : [];
            nextCurrentEvent = buildUclDrawEvent({ candidatesCount: candidates.length });
            resetUclActive = true;
            resetUclAlive = true;
            resetUclStage = 'r16';
            resetUclDrawCandidates = candidates;
        }

        if (action.payload && action.payload.uclAction === 'UCL_DRAW') {
            let candidates = Array.isArray(state.uclDrawCandidates) ? state.uclDrawCandidates.slice() : [];
            if (candidates.length === 0) {
                const playerId = state.currentTeam?.id;
                const fromTeams16 = Array.isArray(state.uclTeams16)
                  ? state.uclTeams16.filter(t => t && t.id && t.id !== playerId)
                  : [];
                candidates = fromTeams16;
            }

            if (candidates.length > 0) {
                const idx = Math.floor(Math.random() * candidates.length);
                const opp = candidates.splice(idx, 1)[0];

                const queue = Array.isArray(state.uclOpponentQueue) ? state.uclOpponentQueue.filter(o => o && o.id !== opp.id) : [];

                resetUclActive = true;
                resetUclAlive = true;
                resetUclStage = 'r16';
                resetUclDrawCandidates = candidates;
                resetUclOpponentQueue = queue;
                resetUclCurrentOpponent = opp;
                nextCurrentEvent = buildUclDrawResultEvent({ opponent: opp });
            }
        }

        if (action.payload && action.payload.uclAction === 'UCL_START_R16') {
            const opp = state.uclCurrentOpponent;
            if (opp) {
                resetUclActive = true;
                resetUclAlive = true;
                resetUclStage = 'r16';
                nextCurrentEvent = buildUclMatchEvent({ stage: 'r16', opponent: opp });
            }
        }

        if (action.payload && action.payload.uclAction === 'UCL_MATCH') {
            nextYouthSquadPlayersAfterResolve = applyYouthMatchesToSquad(nextYouthSquadPlayersAfterResolve, 1, { year: state.year, quarter: state.quarter, ucl: true });
            afterUclNextEvent = nextCurrentEvent;
            const stage = state.uclStage;
            const opp = state.uclCurrentOpponent;
            const playerTeamName = state.currentTeam?.name || '你的俱乐部';
            const oppTeamName = opp?.name || '对手俱乐部';
            const bestStarterTech = getBestYouthStarterTech(nextYouthSquadPlayersAfterResolve, { year: state.year, quarter: state.quarter, ucl: true });
            const playerTacticsDelta = computeYouthTechTacticsDelta(bestStarterTech, finalStatsAfterEvent.tactics);
            let playerT = clampNumber((finalStatsAfterEvent.tactics ?? 0) + playerTacticsDelta, 0, 10);
            if (
              state.currentTeam?.id === 'bayern_munich' &&
              Array.isArray(state.activeBuffs) &&
              state.activeBuffs.includes('bayern_history_proof') &&
              state.activeBuffs.includes('turmoil')
            ) {
              // Keep UI display unchanged, but slightly exceed 10 in UCL match computation
              // so Bayern can break ties (including 10 vs 10) without going to dressing-room-based penalties.
              playerT = clampNumber(playerT + 1.1, 0, 10.1);
            }
            const oppT = clampNumber(opp?.tactics, 0, 10);

            finalStatsAfterEvent = { ...finalStatsAfterEvent };
            finalStatsAfterEvent.funds = clampFunds((finalStatsAfterEvent.funds ?? 0) + 5, state.currentTeam?.id);

            let won = false;
            let detail = '';

            if (playerT > oppT) {
                won = true;
                detail = `${playerTeamName}在常规时间内以两球领先结束了比赛，${oppTeamName}的球员颓丧地坐在地上。`;
            } else if (playerT < oppT) {
                won = false;
                detail = `${oppTeamName}在常规时间内以两球领先结束了比赛，${playerTeamName}的球员颓丧地坐在地上。`;
            } else {
                const playerDR = clampNumber(finalStatsAfterEvent.dressingRoom, 0, 100);
                const oppDR = clampNumber(opp?.dressingRoom, 0, 100);

                // Penalties: threshold first, no probability.
                if (playerDR >= 60 && oppDR < 60) {
                    won = true;
                } else if (oppDR >= 60 && playerDR < 60) {
                    won = false;
                } else {
                    // If both >=60 or both <60, higher dressing room wins. If equal, player wins (no randomness).
                    if (playerDR > oppDR) won = true;
                    else if (playerDR < oppDR) won = false;
                    else won = true;
                }

                const winnerName = won ? playerTeamName : oppTeamName;
                detail = `点球大战！${playerTeamName}与${oppTeamName}鏖战到最后一刻！双方都不想输掉这场比赛，但最后，${winnerName}取得了胜利。`;
            }

            if (!won) {
                resetUclAlive = false;
                resetUclStage = 'out';
                resetUclCurrentOpponent = null;
                nextCurrentEvent = buildUclResultEvent({ stage, opponent: opp, won: false, detailDescription: detail });
                if (afterUclNextEvent && nextCurrentEvent?.options?.length > 0) {
                  nextCurrentEvent.options = nextCurrentEvent.options.map(opt => ({ ...opt, nextEvent: afterUclNextEvent }));
                }
            } else {
                if (stage === 'r16') resetUclStage = 'qf';
                else if (stage === 'qf') resetUclStage = 'sf';
                else if (stage === 'sf') resetUclStage = 'final';
                else if (stage === 'final') resetUclStage = 'won';
                resetUclCurrentOpponent = null;

                if (stage === 'final') {
                  finalStatsAfterEvent.funds = clampFunds((finalStatsAfterEvent.funds ?? 0) + 10, state.currentTeam?.id);
                  nextCurrentEvent = buildUclChampionEvent();
                  resetUclStage = 'won';
                  wonUclNow = true;
                  if (afterUclNextEvent && nextCurrentEvent?.options?.length > 0) {
                    nextCurrentEvent.options = nextCurrentEvent.options.map(opt => ({ ...opt, nextEvent: afterUclNextEvent }));
                  }
                } else if (stage === 'sf') {
                  const queue = Array.isArray(state.uclOpponentQueue) ? state.uclOpponentQueue.slice() : [];
                  const finalOpp = queue.shift();
                  resetUclOpponentQueue = queue;

                  if (finalOpp) {
                    resetUclCurrentOpponent = finalOpp;
                    const finalMatchEvent = buildUclMatchEvent({ stage: 'final', opponent: finalOpp });

                    nextCurrentEvent = buildUclResultEvent({ stage, opponent: opp, won: true, detailDescription: detail });
                    if (nextCurrentEvent?.options?.length > 0) {
                      nextCurrentEvent.options = nextCurrentEvent.options.map(opt => ({ ...opt, nextEvent: finalMatchEvent }));
                    }

                    if (afterUclNextEvent && finalMatchEvent?.options?.length > 0) {
                      finalMatchEvent.options = finalMatchEvent.options.map(opt => ({ ...opt, nextEvent: afterUclNextEvent }));
                    }
                  } else {
                    nextCurrentEvent = buildUclResultEvent({ stage, opponent: opp, won: true, detailDescription: detail });
                    if (afterUclNextEvent && nextCurrentEvent?.options?.length > 0) {
                      nextCurrentEvent.options = nextCurrentEvent.options.map(opt => ({ ...opt, nextEvent: afterUclNextEvent }));
                    }
                  }
                } else {
                  nextCurrentEvent = buildUclResultEvent({ stage, opponent: opp, won: true, detailDescription: detail });
                  if (afterUclNextEvent && nextCurrentEvent?.options?.length > 0) {
                    nextCurrentEvent.options = nextCurrentEvent.options.map(opt => ({ ...opt, nextEvent: afterUclNextEvent }));
                  }
                }
              }
            }

            if (wonUclNow) {
              const uclWonSeasonYear = (afterUclNextEvent && typeof afterUclNextEvent.seasonYear === 'number')
                ? afterUclNextEvent.seasonYear
                : (state.uclSeasonYear ?? state.year);
              if (!nextUclChampionYearsAfterResolve.includes(uclWonSeasonYear)) {
                nextUclChampionYearsAfterResolve = [...nextUclChampionYearsAfterResolve, uclWonSeasonYear];
              }
              const base = {
                ...state,
                stats: finalStatsAfterEvent,
                currentEvent: nextCurrentEvent,
                queuedEvent: nextQueuedEvent,
                gameState: gameStateAfterEvent,
                activeBuffs: finalBuffsAfterEvent,
                tabloidCount: nextTabloidCountAfterEvent,
                pointsThisQuarter: pointsThisQuarterAfterEvent,
                pendingGameState: state.pendingGameState,
                estimatedRanking: finalEstimatedRanking,
                pendingSeasonReset: finalPendingSeasonReset,
                tabloidStalkingUnlocked: state.tabloidStalkingUnlocked,
                leagueChampionYears: nextLeagueChampionYearsAfterResolve,
                uclChampionYears: nextUclChampionYearsAfterResolve,
                youthAcademyUnlocked: nextYouthAcademyUnlockedAfterResolve,
                youthAcademyUnlockPending: nextYouthAcademyUnlockPendingAfterResolve,
                youthAcademyPlayer: nextYouthAcademyPlayerAfterResolve,
                youthSquadPlayers: nextYouthSquadPlayersAfterResolve,
                youthRefreshUsedThisQuarter: nextYouthRefreshUsedThisQuarterAfterResolve,
                leagueOpponents: resetLeagueOpponents,
                leagueOpponentCursor: resetLeagueOpponentCursor,
                leagueSchedule: resetLeagueSchedule,
                leagueRoundCursor: resetLeagueRoundCursor,
                leagueMatchResults: resetLeagueMatchResults,
                crossLeagueTacticsInflation: resetCrossLeagueTacticsInflation,
                uclActive: resetUclActive,
                uclAlive: resetUclAlive,
                uclStage: resetUclStage,
                uclSeasonYear: resetUclSeasonYear,
                uclTeams16: resetUclTeams16,
                uclDrawCandidates: resetUclDrawCandidates,
                uclOpponentQueue: resetUclOpponentQueue,
                uclCurrentOpponent: resetUclCurrentOpponent,
                uclQualifiedThisSeason: resetUclQualifiedThisSeason,
                uclQualifiedNextSeason: resetUclQualifiedNextSeason,
                uclWonSeasonYear
              };
              let next = unlockAchievementInState(base, 'ucl_champion');
              if (state.currentTeam?.id === 'bayern_munich' && Array.isArray(state.activeBuffs) && state.activeBuffs.includes('turmoil')) {
                next = unlockAchievementInState(next, 'bayern_turmoil_ucl');
              }
              return next;
            }

// ...

            let nextStateBase = {
              ...state,
              stats: finalStatsAfterEvent,
              currentEvent: nextCurrentEvent,
              queuedEvent: nextQueuedEvent,
              gameState: gameStateAfterEvent,
              activeBuffs: finalBuffsAfterEvent,
              specialMechanicState: nextSpecialMechanicStateAfterEvent,
              tabloidCount: nextTabloidCountAfterEvent,
              pointsThisQuarter: pointsThisQuarterAfterEvent,
              pendingGameState: nextPendingGameState,
              pendingSeasonReset: finalPendingSeasonReset,
              estimatedRanking: finalEstimatedRanking,
              mixerMediaEducateCount: nextMixerMediaEducateCount,
              tabloidStalkingUnlocked: nextTabloidStalkingUnlocked,
              relegationFinalRanking: nextRelegationFinalRanking,
              decisionHistory: nextDecisionHistoryAfterEvent,
              youthAcademyUnlocked: nextYouthAcademyUnlockedAfterResolve,
              youthAcademyUnlockPending: nextYouthAcademyUnlockPendingAfterResolve,
              youthAcademyPlayer: nextYouthAcademyPlayerAfterResolve,
              youthSquadPlayers: nextYouthSquadPlayersAfterResolve,
              youthRefreshUsedThisQuarter: nextYouthRefreshUsedThisQuarterAfterResolve,
              leagueOpponents: resetLeagueOpponents,
              leagueOpponentCursor: resetLeagueOpponentCursor,
              leagueSchedule: resetLeagueSchedule,
              leagueRoundCursor: resetLeagueRoundCursor,
              leagueMatchResults: resetLeagueMatchResults,
              crossLeagueTacticsInflation: resetCrossLeagueTacticsInflation,
              uclActive: resetUclActive,
              uclAlive: resetUclAlive,
              uclStage: resetUclStage,
              uclSeasonYear: resetUclSeasonYear,
              uclTeams16: resetUclTeams16,
              uclDrawCandidates: resetUclDrawCandidates,
              uclOpponentQueue: resetUclOpponentQueue,
              uclCurrentOpponent: resetUclCurrentOpponent,
              uclQualifiedThisSeason: resetUclQualifiedThisSeason,
              uclQualifiedNextSeason: resetUclQualifiedNextSeason,
              season2TutorialShown: nextSeason2TutorialShown,
              injuryTutorialShown: nextInjuryTutorialShown,
              uclTutorialShown: nextUclTutorialShown,
              youthTutorialShown: nextYouthTutorialShown
            };

            if (isResolvingSeasonSettlement) {
              const shouldGrantSeasonFreePoint = state.youthSeasonFreePointsGrantedYear !== postSettlementYear;
              if (state.currentEvent?.champion && typeof state.currentEvent?.seasonYear === 'number') {
                const y = state.currentEvent.seasonYear;
                if (!nextLeagueChampionYearsAfterResolve.includes(y)) {
                  nextLeagueChampionYearsAfterResolve = [...nextLeagueChampionYearsAfterResolve, y];
                }
              }

              const shouldUnlockNow = Boolean(
                !nextYouthAcademyUnlockedAfterResolve &&
                postSettlementYear >= 3 &&
                (nextYouthAcademyUnlockPendingAfterResolve || postSettlementYear === 3)
              );

              if (shouldUnlockNow) {
                nextYouthAcademyUnlockedAfterResolve = true;
                nextYouthAcademyUnlockPendingAfterResolve = false;
              }

              if (nextYouthAcademyUnlockedAfterResolve) {
                nextYouthRefreshUsedThisQuarterAfterResolve = false;

                if (nextYouthAcademyPlayerAfterResolve) {
                  nextYouthAcademyPlayerAfterResolve = {
                    ...nextYouthAcademyPlayerAfterResolve,
                    age: clampInt((nextYouthAcademyPlayerAfterResolve.age ?? 17) + 1, 0, 99),
                    freePoints: clampInt((nextYouthAcademyPlayerAfterResolve.freePoints ?? 0), 0, 9999)
                  };

                  if ((nextYouthAcademyPlayerAfterResolve.specialTraitId || '') === 'eco_guardian') {
                    nextYouthAcademyPlayerAfterResolve = {
                      ...nextYouthAcademyPlayerAfterResolve,
                      ecoMissingSeasonYear: clampInt(postSettlementYear, 0, 99),
                      ecoMissingQuarter: clampInt(1 + Math.floor(Math.random() * 3), 0, 3)
                    };
                  }
                }

                nextYouthSquadPlayersAfterResolve = nextYouthSquadPlayersAfterResolve.map(p => {
                  let next = {
                    ...p,
                    age: clampInt((p.age ?? 17) + 1, 0, 99),
                    freePoints: clampInt((p.freePoints ?? 0) + (shouldGrantSeasonFreePoint ? 1 : 0), 0, 9999)
                  };

                  if ((next.positiveTraitId || '') === 'loyal' && next.hasArmband) {
                    next = { ...next, diligence: clampInt((next.diligence ?? 0) + 2, 0, 10) };
                  }

                  if ((next.specialTraitId || '') === 'eco_guardian') {
                    next = {
                      ...next,
                      ecoMissingSeasonYear: clampInt(postSettlementYear, 0, 99),
                      ecoMissingQuarter: clampInt(1 + Math.floor(Math.random() * 3), 0, 3)
                    };
                  }

                  return next;
                });

                if (nextYouthAcademyPlayerAfterResolve && (nextYouthAcademyPlayerAfterResolve.age ?? 0) > 21) {
                  const limit = getYouthSquadAddLimit(state.currentTeam?.id, finalStatsAfterEvent?.funds);
                  if (nextYouthSquadPlayersAfterResolve.length < limit) {
                    promotedYouthForAchievement = nextYouthAcademyPlayerAfterResolve;
                    nextYouthSquadPlayersAfterResolve = [...nextYouthSquadPlayersAfterResolve, { ...nextYouthAcademyPlayerAfterResolve, role: 'bench', hasArmband: false }].slice(0, getYouthSquadMax(state.currentTeam?.id));
                    nextYouthAcademyPlayerAfterResolve = null;
                  }
                }

                const isBarca = state.currentTeam?.id === 'fc_barcelona';
                if (isBarca) {
                  nextYouthAcademyPlayerAfterResolve = generateYouthPlayer({ techMin: 4, techMax: 8 });
                } else if (!nextYouthAcademyPlayerAfterResolve) {
                  nextYouthAcademyPlayerAfterResolve = generateYouthPlayer();
                }
              }

              nextStateBase = {
                ...nextStateBase,
                month: 1,
                quarter: 1,
                year: postSettlementYear,
                randomEventsThisYear: [],
                lastRandomEventId: null,
                coffeeRefUsedThisQuarter: false,
                explodeUsedThisQuarter: false,
                opponentTacticsBoostThisMonth: 0,
                leagueChampionYears: nextLeagueChampionYearsAfterResolve,
                uclChampionYears: nextUclChampionYearsAfterResolve,
                youthAcademyUnlocked: nextYouthAcademyUnlockedAfterResolve,
                youthAcademyUnlockPending: nextYouthAcademyUnlockPendingAfterResolve,
                youthAcademyPlayer: nextYouthAcademyPlayerAfterResolve,
                youthSquadPlayers: nextYouthSquadPlayersAfterResolve,
                youthRefreshUsedThisQuarter: nextYouthRefreshUsedThisQuarterAfterResolve,
                youthSeasonFreePointsGrantedYear: shouldGrantSeasonFreePoint
                  ? postSettlementYear
                  : state.youthSeasonFreePointsGrantedYear
              };

              if (shouldUnlockNow && !nextYouthTutorialShown) {
                let follow = nextStateBase.currentEvent;
                let queued = nextStateBase.queuedEvent;
                if (!follow && queued) {
                  follow = queued;
                  queued = null;
                }
                nextStateBase = {
                  ...nextStateBase,
                  currentEvent: _buildYouthAcademyTutorialEvent(follow),
                  queuedEvent: queued,
                  youthTutorialShown: true
                };
                nextYouthTutorialShown = true;
              }

              if (promotedYouthForAchievement) {
                nextStateBase = applyYouthPromotionAchievements(nextStateBase, promotedYouthForAchievement);
              }

              if (postSettlementYear >= 6) {
                if (state.currentTeam?.id === 'real_madrid') nextStateBase = unlockAchievementInState(nextStateBase, 'rm_5_years');
                if (state.currentTeam?.id === 'ac_milan') nextStateBase = unlockAchievementInState(nextStateBase, 'ac_milan_5_years');
                if (state.currentTeam?.id === 'fc_barcelona') nextStateBase = unlockAchievementInState(nextStateBase, 'barca_5_years');
                if (state.currentTeam?.id === 'dortmund') nextStateBase = unlockAchievementInState(nextStateBase, 'dortmund_5_years');
                if (state.currentTeam?.id === 'chelsea') nextStateBase = unlockAchievementInState(nextStateBase, 'chelsea_5_years');
                if (state.currentTeam?.id === 'liverpool') nextStateBase = unlockAchievementInState(nextStateBase, 'liverpool_5_years');
                if (state.currentTeam?.id === 'arsenal') nextStateBase = unlockAchievementInState(nextStateBase, 'arsenal_5_years');
                if (state.currentTeam?.id === 'man_utd') nextStateBase = unlockAchievementInState(nextStateBase, 'manutd_5_years');
                if (state.currentTeam?.id === 'bayern_munich') nextStateBase = unlockAchievementInState(nextStateBase, 'bayern_5_years');
                if (state.currentTeam?.id === 'man_city') nextStateBase = unlockAchievementInState(nextStateBase, 'man_city_5_years');
              }

              if (
                postSettlementYear === 2 &&
                state.currentEvent?.champion &&
                state.currentTeam?.id === 'man_utd'
              ) {
                nextStateBase = unlockAchievementInState(nextStateBase, 'manutd_year1_champion');
              }
            }

        if (state.currentEvent?.id === 'gerrard_letter' && action.payload?.setPendingGameState === 'gameover' && isAlonsoName(state.playerName)) {
          nextStateBase = unlockAchievementInState(nextStateBase, 'alonso_letter_reject');
        }

        if (gameStateAfterEvent === 'gameover' && state.currentTeam?.id === 'man_utd' && isAlonsoName(state.playerName)) {
          nextStateBase = unlockAchievementInState(nextStateBase, 'alonso_manutd_fired');
        }

        if (gameStateAfterEvent === 'double_crown') {
          nextStateBase = unlockAchievementInState(nextStateBase, 'double_crown');
          if (state.currentTeam?.id === 'dortmund' && isKloppName(state.playerName)) {
            nextStateBase = unlockAchievementInState(nextStateBase, 'klopp_dortmund_double_crown');
          }
          if (state.currentTeam?.id === 'man_city' && isGuardiolaName(state.playerName)) {
            nextStateBase = unlockAchievementInState(nextStateBase, 'guardiola_man_city_double_crown');
          }
        }

        if (nextStateBase.gameState === 'relegation_resign') {
          nextStateBase = unlockAchievementInState(nextStateBase, 'relegation_resign');
        }

        if (!state.activeBuffs.includes('union_wood_iron_stun') && Array.isArray(nextStateBase.activeBuffs) && nextStateBase.activeBuffs.includes('union_wood_iron_stun')) {
          nextStateBase = unlockAchievementInState(nextStateBase, 'three_sticks');
        }

        if (state.currentTeam?.id === 'ac_milan' && isKakaName(state.playerName) && Array.isArray(nextStateBase.activeBuffs) && nextStateBase.activeBuffs.includes('milan_nesta')) {
          nextStateBase = unlockAchievementInState(nextStateBase, 'kaka_milan_nesta');
        }

        return nextStateBase;
    }

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  useEffect(() => {
    if (!state.pendingSave) return;

    try {
      if (state.pendingSave.type === 'auto') {
        const payload = buildSavePayload(state, 'auto');
        localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify(payload));
      } else if (state.pendingSave.type === 'manual') {
        const slot = state.pendingSave.slot;
        if (slot >= 1 && slot <= 8) {
          const payload = buildSavePayload(state, 'manual', slot);

          try {
            const raw = localStorage.getItem(MANUAL_SLOTS_KEY);
            const parsed = raw ? JSON.parse(raw) : null;
            const prevSlots = Array.isArray(parsed?.slots) ? parsed.slots : [];
            const nextSlots = Array(8).fill(null);
            for (let i = 0; i < 8; i++) {
              const v = prevSlots[i];
              nextSlots[i] = (v && v.state) ? v : null;
            }
            nextSlots[slot - 1] = payload;
            localStorage.setItem(MANUAL_SLOTS_KEY, JSON.stringify({ slots: nextSlots }));
          } catch {
            // ignore
          }

          if (slot === 1 || slot === 2 || slot === 3) {
            localStorage.setItem(`${MANUAL_SAVE_KEY_PREFIX}${slot}`, JSON.stringify(payload));
          }
        }
      }
    } catch {
      // ignore
    } finally {
      dispatch({ type: 'CLEAR_PENDING_SAVE' });
    }
  }, [state.pendingSave]);

  useEffect(() => {
    try {
      const localUnlocked = state.achievementsUnlocked || {};
      const ids = Object.keys(localUnlocked);
      if (ids.length === 0) return;

      const raw = localStorage.getItem(GLOBAL_ACHIEVEMENTS_KEY);
      const parsed = raw ? JSON.parse(raw) : null;
      const prev = (parsed && typeof parsed === 'object') ? parsed : {};

      const next = { ...prev };
      ids.forEach(id => {
        if (!next[id]) {
          next[id] = localUnlocked[id];
        }
      });

      localStorage.setItem(GLOBAL_ACHIEVEMENTS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }, [state.achievementsUnlocked]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}
