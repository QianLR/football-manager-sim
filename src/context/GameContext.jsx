import React, { createContext, useContext, useReducer, useEffect } from 'react';
import teamsData from '../data/teams.json';
import eventsData from '../data/events.json';
import { getLeagueRoster, getUclSeedPool } from '../data/leagues';

const GameContext = createContext();

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
    roofClosed: false, // Real Madrid
    canteenChangedThisSeason: { open: false, close: false },
    roofChangedThisSeason: { open: false, close: false },
    milanLegendsUsedThisSeason: [],
    bayernDressingRoomRevealed: false,
    bayernCommitteeRemoved: false
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
  uclTutorialShown: false
};

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

function buildInjuryRiskTutorialEvent() {
  return {
    id: 'tutorial_injury_risk',
    title: '新机制：伤病风险',
    description: '从第二赛季开始，伤病风险将加入你的管理范围。伤病风险每个季度结算会增加1点；当达到5点时将触发伤病潮，降低技战术水平与更衣室稳定性。你可以通过决策来主动管理它。',
    options: [{ text: '我知道了', effects: {} }]
  };
}

function buildSeason2StarterTutorialEvent() {
  return {
    id: 'tutorial_season2_starter',
    title: '新赛季提示',
    description: '从第二赛季开始，有些事情会变得不一样了：\n\n1）【训练】里会出现新的选项，它们可能会带来额外收益，也可能带来额外代价。\n2）伤病风险会成为需要你长期关注的指标；当它累计到5点时，球队将迎来伤病潮。\n3）你依然可以通过“调情”获得一些灵感与信息，但圈内人也会更加谨慎——别把它当成每次都稳赚的捷径。',
    options: [{ text: '我知道了', effects: {} }]
  };
}

function buildUclTutorialEvent() {
  return {
    id: 'tutorial_ucl',
    title: '新机制：欧冠淘汰赛',
    description: '你已获得欧冠席位。每个赛季的第二季度结算后将进入欧冠十六强：先抽签决定对手（十六强有同联赛回避），随后第三季度将由欧冠淘汰赛赛程替代随机事件。祝你好运。',
    options: [{ text: '我知道了', effects: {} }]
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

function buildChoiceOutcomeEvent({ baseEvent, option, effectsPreview, nextEvent }) {
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

  if (!next.specialMechanicState || typeof next.specialMechanicState !== 'object') {
    next.specialMechanicState = { ...initialState.specialMechanicState };
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

function buildTabloidBreakingEvent() {
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
          effects: { mediaSupport: -15, boardSupport: -10 }
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

function isArtetaName(name) {
  const n = (name || '').trim().toLowerCase();
  return n === '阿尔特塔' || n === '米克尔阿尔特塔' || n === 'arteta' || n === 'mikel arteta';
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
  return n === '因扎吉' || n === 'inzaghi' || n === 'filippo inzaghi' || n === 'simone inzaghi' || n === '菲利波因扎吉' || n === '西蒙尼因扎吉';
}

function isPiqueName(name) {
  const n = (name || '').trim().toLowerCase();
  return n === '皮克' || n === '杰拉德皮克' || n === 'pique' || n === 'piqué' || n === 'gerard pique' || n === 'gerard piqué';
}

function isKakaName(name) {
  const n = (name || '').trim().toLowerCase();
  return n === '卡卡' || n === 'kaka' || n === 'kaká';
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

function shouldTriggerArtetaEasterEgg(state) {
  if (!state || state.artetaEasterEggTriggered) return false;
  if (!state.currentTeam || !state.playerName) return false;
  if (state.currentTeam.id !== 'arsenal') return false;
  return isArtetaName(state.playerName);
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

function shouldTriggerAlonsoEasterEgg(state, statsAfter) {
  if (!state || state.easterEggTriggered) return false;
  if (!state.currentTeam || !state.playerName) return false;
  if (!isAlonsoName(state.playerName)) return false;
  const teamName = state.currentTeam.name;
  if (teamName === '曼联' || teamName === '利物浦') return false;
  return (statsAfter.boardSupport <= 0 || statsAfter.dressingRoom <= 0);
}

function buildGerrardLetterEvent() {
  return {
    id: 'gerrard_letter',
    title: '杰拉德的来信',
    description: '亲爱的Xabi，\n我很抱歉听到你离开[俱乐部]的消息。虽然现在才给你发消息可能有些晚，但我想问……你愿意来利物浦执教吗？你知道的，这里的所有人都希望你来（包括我）。如果你愿意，我一定会说服他们立刻给你offer的！',
    options: [
      { text: 'You’ll never walk alone', effects: {}, switchTeamId: 'liverpool', grantBuff: 'istanbul_kiss' },
      { text: '礼貌拒绝（重新开始）', effects: {}, setPendingGameState: 'gameover' }
    ]
  };
}

function buildTabloidStalkingIntroEvent() {
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

  if (cloned.description) {
    cloned.description = cloned.description
      .replace(/\[名字\]/g, state.playerName)
      .replace(/\[俱乐部\]/g, state.currentTeam.name)
      .replace(/\[执教理念\]/g, state.coachingPhilosophy)
      .replace(/\[教练名字\]/g, state.playerName)
      .replace(/\[俱乐部名字\]/g, state.currentTeam.name);
  }

  if (cloned.options) {
    cloned.options = cloned.options.map(opt => ({
      ...opt,
      text: opt.text
        .replace(/\[名字\]/g, state.playerName)
        .replace(/\[俱乐部\]/g, state.currentTeam.name)
        .replace(/\[执教理念\]/g, state.coachingPhilosophy)
        .replace(/\[教练名字\]/g, state.playerName)
        .replace(/\[俱乐部名字\]/g, state.currentTeam.name)
    }));
  }

  return cloned;
}

function gameReducer(state, action) {
  switch (action.type) {
    case 'SET_GAME_STATE':
      return {
        ...state,
        gameState: action.payload?.gameState || 'playing'
      };

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

    case 'START_GAME':
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

      // Easter egg: Mourinho coaching Arsenal (with confirmation) -> debuff + lower board support
      if (team && team.id === 'arsenal' && isMourinhoName(action.payload.playerName) && action.payload.confirmMourinho === true) {
        baseStats.boardSupport = 50;
        baseBuffs.push('legacy_issues');
      }

      if (team && team.id === 'chelsea') {
        baseBuffs.push('chelsea_sack_pressure');
      }
      if (team && team.id === 'dortmund') {
        baseBuffs.push('dortmund_emma_camera');
        baseBuffs.push('dortmund_unlicensed');
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
          description: '【经过漫长的拉扯和谈判，教练[名字]终于下树，[俱乐部]将在[执教理念]的理念下迎来新的挑战。这位新教练能在此坚持多久呢？[俱乐部]能夺得本赛季的冠军吗？让我们拭目以待！】',
          options: [{ text: '开始', effects: {} }]
        }
      };

      if (team && team.id === 'dortmund') {
        nextStartState.decisionPoints = 2;
      }

      if (team && team.id === 'arsenal' && isMourinhoName(action.payload.playerName)) {
        nextStartState = unlockAchievementInState(nextStartState, 'mourinho_arsenal');
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

      if (isNevilleName(action.payload.playerName) || isCarragherName(action.payload.playerName)) {
        nextStartState = unlockAchievementInState(nextStartState, 'neville_carragher_coach');
      }
      if (isInzaghiName(action.payload.playerName)) {
        nextStartState = unlockAchievementInState(nextStartState, 'inzaghi_coach');
      }

      return nextStartState;

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
        };

    case 'LOAD_GAME': {
        const next = hydrateLoadedState(action.payload);
        if (next) {
            const team = teamsData.find(t => t.id === next.currentTeam.id);
            if (team) {
                const leagueId = team.leagueId || 'epl';
                const leagueOpponents = buildLeagueOpponents({ leagueId, playerTeamId: team.id, playerTactics: next.stats.tactics });
                const leagueSchedule = buildLeagueSchedule({ leagueId, playerTeamId: team.id, opponents: leagueOpponents });
                next.leagueOpponents = leagueOpponents;
                next.leagueSchedule = leagueSchedule;
            }
        }
        return next ? next : state;
    }

    case 'UPDATE_STATS':
      const newStats = { ...state.stats };
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
             newStats[targetKey] = Math.max(0, newStats[targetKey]); // Funds cannot be negative
          } else if (targetKey === 'injuryRisk') {
             newStats[targetKey] = Math.max(0, newStats[targetKey]);
          }
        }
      });

      enforceRainbowArmband(newStats, state.activeBuffs);
      enforceEmmaCamera(newStats, state.activeBuffs);

      const nextBuffsAfterUpdate = syncDerivedBuffs({
        activeBuffs: state.activeBuffs,
        stats: newStats,
        teamId: state.currentTeam?.id,
        specialMechanicState: state.specialMechanicState
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
        estimatedRanking: nextEstimatedRankingAfterUpdate
      };

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

    case 'TAKE_DECISION':
        const { decisionId, type, effects, optionId, optionDescription } = action.payload;

        let effectiveEffects = effects;

        if (
          decisionId === 'flirtation' &&
          state.year >= 2 &&
          (optionId === 'rival_coach' || optionId === 'foreign_coach')
        ) {
          effectiveEffects = { ...(effectiveEffects || {}), tabloid: 1, tactics: 0.5 };
          delete effectiveEffects.chance_tabloid;
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
        if (
          effectiveEffects?.funds < 0 &&
          state.stats.authority < 70 &&
          !(state.currentTeam?.id === 'bayern_munich' && decisionId === 'goat_head_sign')
        ) {
            return state;
        }

        if (effectiveEffects?.funds < 0 && (state.stats.funds + effectiveEffects.funds) < 0) {
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

        // Apply effects
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
                    statsAfterDecision[targetKey] = Math.max(0, statsAfterDecision[targetKey]);
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
            const actionKey = effectiveEffects.special_canteen;
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

    case 'NEXT_MONTH':
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

            const homeBase = homeIsPlayer ? clampNumber(statsAfterMonth.tactics, 0, 10) : clampNumber(oppById.get(homeId)?.tactics, 0, 10);
            const awayBase = awayIsPlayer ? clampNumber(statsAfterMonth.tactics, 0, 10) : clampNumber(oppById.get(awayId)?.tactics, 0, 10);

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
        if (nextMonth > 3) {
            nextMonth = 1;
            nextQuarter += 1;
            shouldAutoSave = true;
            nextCoffeeRefUsedThisQuarter = false;
            nextExplodeUsedThisQuarter = false;

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
            nextQuarter = 1;
            nextYear += 1;
            // Season Finale Logic would go here

            // Mark season reset to be applied after confirming season settlement event
            nextPendingSeasonReset = true;
            seasonSettlementPoints = statsAfterMonth.points;
            pointsThisQuarterAfterMonth = 0;

            // Reset league table immediately for the new season display.
            // The season settlement event will still show last season's points via seasonSettlementPoints.
            statsAfterMonth.points = 0;
            if (Array.isArray(nextLeagueOpponents) && nextLeagueOpponents.length > 0) {
                nextLeagueOpponents = nextLeagueOpponents.map(o => ({ ...o, points: 0 }));
            }
            nextLeagueRoundCursor = 0;
            nextLeagueMatchResults = {};

            // Reset per-season toggles, but keep current on/off states.
            nextSpecialState = {
                ...nextSpecialState,
                canteenChangedThisSeason: { open: false, close: false },
                roofChangedThisSeason: { open: false, close: false },
                milanLegendsUsedThisSeason: []
            };

            if (state.currentTeam?.id === 'dortmund') {
                nextActiveBuffs = nextActiveBuffs.filter(b => b !== 'dortmund_unlicensed');
            }
        }

        let nextAchievementsState = state;
        if (nextYear >= 6 && nextYear !== state.year) {
          if (state.currentTeam?.id === 'real_madrid') {
            nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'rm_5_years');
          }
          if (state.currentTeam?.id === 'ac_milan') {
            nextAchievementsState = unlockAchievementInState(nextAchievementsState, 'ac_milan_5_years');
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
            nextEstimatedRanking = 1;
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
        
        // Filter events based on conditions
        const validEvents = allEvents.filter(event => {
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
        const randomEventCount = (isSeasonEnd || shouldSuppressRandomForUcl || canEnterUclAfterQ2) ? 0 : (settlementEvent ? 3 : 1);
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

                        if (qualifiedNextSeason) {
                            statsAfterMonth.funds = Math.max(0, (statsAfterMonth.funds ?? 0) + 2);
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

                if (qualifiedNextSeason) {
                    statsAfterMonth.funds = Math.max(0, (statsAfterMonth.funds ?? 0) + 2);
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
                    statsAfterMonth.funds = Math.max(0, (statsAfterMonth.funds ?? 0) + 10);

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
                    settlementEvent = { ...settlementEvent, nextEvent: eventToTrigger };
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
        
        // Check Game Over conditions again after monthly updates
        let nextGameStateAfterMonth = state.gameState;

        enforceRainbowArmband(statsAfterMonth, nextActiveBuffs);
        enforceEmmaCamera(statsAfterMonth, nextActiveBuffs);

        if (statsAfterMonth.boardSupport <= 0 || statsAfterMonth.dressingRoom <= 0) {
            nextGameStateAfterMonth = 'gameover';
        }

        if (forcedGameStateAfterMonth) {
            nextGameStateAfterMonth = forcedGameStateAfterMonth;
            pendingGameState = null;
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
            opponentTacticsBoostThisMonth: 0,
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
            coffeeRefUsedThisQuarter: nextCoffeeRefUsedThisQuarter,
            explodeUsedThisQuarter: nextExplodeUsedThisQuarter,
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

        if (nextGameStateAfterMonth === 'gameover' && state.currentTeam?.id === 'man_utd' && isAlonsoName(state.playerName)) {
          stateAfterMonth = unlockAchievementInState(stateAfterMonth, 'alonso_manutd_fired');
        }

        return stateAfterMonth;
        
    case 'RESOLVE_EVENT':
        if (action.payload && action.payload.switchTeamId) {
            const nextTeam = teamsData.find(t => t.id === action.payload.switchTeamId);
            if (!nextTeam) return state;

            const switchedBuffs = action.payload.grantBuff ? [action.payload.grantBuff] : [];
            let switchedSpecialState = { ...initialState.specialMechanicState };
            if (nextTeam.id === 'chelsea') {
              switchedBuffs.push('chelsea_sack_pressure');
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

            if (state.currentEvent?.id === 'gerrard_letter' && action.payload.switchTeamId === 'liverpool' && isAlonsoName(state.playerName)) {
              switched = unlockAchievementInState(switched, 'alonso_letter_accept');
            }

            return switched;
        }

        const isResolvingSeasonSettlement = state.pendingSeasonReset && state.currentEvent && state.currentEvent.id === 'season_settlement';

        // Apply event option effects
        const eventEffects = { ...(action.payload.effects || {}) };

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
                    statsAfterEvent[targetKey] = Math.max(0, statsAfterEvent[targetKey]);
                } else if (targetKey === 'injuryRisk') {
                    statsAfterEvent[targetKey] = Math.max(0, statsAfterEvent[targetKey]);
                }
             }
        });

        enforceRainbowArmband(statsAfterEvent, eventActiveBuffs);
        enforceEmmaCamera(statsAfterEvent, eventActiveBuffs);

        if (state.currentTeam?.id === 'ac_milan' && state.currentEvent?.id === 'quarter_expectation_report') {
          const used = Array.isArray(nextSpecialMechanicStateAfterEvent?.milanLegendsUsedThisSeason)
            ? nextSpecialMechanicStateAfterEvent.milanLegendsUsedThisSeason.slice()
            : [];
          const all = ['milan_baresi', 'milan_nesta', 'milan_maldini'];
          const remaining = all.filter(id => !used.includes(id));
          if (remaining.length > 0) {
            const picked = remaining[Math.floor(Math.random() * remaining.length)];
            used.push(picked);
            nextSpecialMechanicStateAfterEvent = { ...(nextSpecialMechanicStateAfterEvent || {}), milanLegendsUsedThisSeason: used };
            if (!eventActiveBuffs.includes(picked)) eventActiveBuffs.push(picked);
          }
        }

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

            const used = Array.isArray(nextSpecialMechanicStateAfterEvent?.milanLegendsUsedThisSeason)
              ? nextSpecialMechanicStateAfterEvent.milanLegendsUsedThisSeason.slice()
              : [];
            const all = ['milan_baresi', 'milan_nesta', 'milan_maldini'];
            const remaining = all.filter(id => !used.includes(id));
            if (remaining.length > 0) {
              const picked = remaining[Math.floor(Math.random() * remaining.length)];
              used.push(picked);
              nextSpecialMechanicStateAfterEvent = { ...(nextSpecialMechanicStateAfterEvent || {}), milanLegendsUsedThisSeason: used };
              eventActiveBuffs.push(picked);
            }
          }

          finalStatsAfterEvent = { ...statsAfterEvent };
          finalStatsAfterEvent.points = 0;
          finalStatsAfterEvent.tactics = Math.max(0, Math.min(10, (finalStatsAfterEvent.tactics ?? 0) - 2));
          finalStatsAfterEvent.funds = Math.max(0, (finalStatsAfterEvent.funds ?? 0) + 10);
          finalEstimatedRanking = 1;
          finalPendingSeasonReset = false;

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

          resetUclQualifiedThisSeason = Boolean(state.uclQualifiedNextSeason);
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
        if (finalStatsAfterEvent.boardSupport <= 0 || finalStatsAfterEvent.dressingRoom <= 0) {
            gameStateAfterEvent = 'gameover';
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

        // If tabloid scandal triggers, it takes priority but does not lose the next event
        if (scandalEventAfterResolve) {
            if (nextCurrentEvent) {
                nextQueuedEvent = nextCurrentEvent;
            }
            nextCurrentEvent = scandalEventAfterResolve;
        }

        if (state.year >= 2 && (finalStatsAfterEvent.injuryRisk ?? 0) >= 5) {
            finalStatsAfterEvent = { ...finalStatsAfterEvent, injuryRisk: Math.max(0, (finalStatsAfterEvent.injuryRisk ?? 0) - 5) };
            const after = nextCurrentEvent || nextQueuedEvent || null;
            const remainingQueued = nextCurrentEvent ? nextQueuedEvent : null;
            nextCurrentEvent = buildInjuryCrisisEvent(after);
            nextQueuedEvent = remainingQueued;
        }

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
            const afterUclNextEvent = nextCurrentEvent;
            const stage = state.uclStage;
            const opp = state.uclCurrentOpponent;
            const playerTeamName = state.currentTeam?.name || '你的俱乐部';
            const oppTeamName = opp?.name || '对手俱乐部';
            let playerT = clampNumber(finalStatsAfterEvent.tactics, 0, 10);
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
            finalStatsAfterEvent.funds = Math.max(0, (finalStatsAfterEvent.funds ?? 0) + 5);

            let won = false;
            let detail = '';
            let wonUclNow = false;

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
                  finalStatsAfterEvent.funds = Math.max(0, (finalStatsAfterEvent.funds ?? 0) + 10);
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

            if (wonUclNow) {
              const uclWonSeasonYear = (afterUclNextEvent && typeof afterUclNextEvent.seasonYear === 'number')
                ? afterUclNextEvent.seasonYear
                : (state.uclSeasonYear ?? state.year);
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
                leagueOpponents: resetLeagueOpponents,
                leagueOpponentCursor: resetLeagueOpponentCursor,
                leagueSchedule: resetLeagueSchedule,
                leagueRoundCursor: resetLeagueRoundCursor,
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
        }

        const shouldShowOutcomeModal = Boolean(
          state.currentEvent &&
          state.currentEvent.revealAfterChoice &&
          !state.currentEvent.isOutcome &&
          action.payload &&
          action.payload.outcomeText
        );

        if (shouldShowOutcomeModal) {
          const afterChoiceNext = nextCurrentEvent;
          nextCurrentEvent = buildChoiceOutcomeEvent({
            baseEvent: state.currentEvent,
            option: action.payload,
            effectsPreview: eventEffects,
            nextEvent: afterChoiceNext
          });
        }

        let nextTabloidStalkingUnlocked = state.tabloidStalkingUnlocked;
        if (state.currentEvent && state.currentEvent.id === 'tabloid_stalking_intro') {
            nextTabloidStalkingUnlocked = true;
        }

        let nextInjuryTutorialShown = state.injuryTutorialShown;
        let nextUclTutorialShown = state.uclTutorialShown;
        let nextSeason2TutorialShown = state.season2TutorialShown;

        let nextRelegationFinalRanking = state.relegationFinalRanking ?? null;

        let nextPendingGameState = state.pendingGameState;
        if (action.payload && action.payload.setPendingGameState) {
            nextPendingGameState = action.payload.setPendingGameState;
        }

        const isDoubleCrown = Boolean(
          isResolvingSeasonSettlement &&
          state.currentEvent &&
          state.currentEvent.champion &&
          typeof state.currentEvent.seasonYear === 'number' &&
          state.uclWonSeasonYear === state.currentEvent.seasonYear
        );

        if (isDoubleCrown) {
          nextPendingGameState = 'double_crown';
          nextCurrentEvent = null;
          nextQueuedEvent = null;
        }

        const shouldTriggerRelegationResign = Boolean(
          isResolvingSeasonSettlement &&
          !nextPendingGameState &&
          gameStateAfterEvent !== 'gameover' &&
          typeof state.currentEvent?.ranking === 'number'
        );

        if (shouldTriggerRelegationResign) {
          const leagueId = state.currentTeam?.leagueId || 'epl';
          const leagueSize = getLeagueRoster(leagueId)?.length || 20;
          const threshold = leagueSize === 18 ? 17 : 18;
          const finalRank = state.currentEvent.ranking;
          if (finalRank >= threshold) {
            nextPendingGameState = 'relegation_resign';
            nextRelegationFinalRanking = finalRank;
            nextCurrentEvent = null;
            nextQueuedEvent = null;
          } else {
            nextRelegationFinalRanking = null;
          }
        }

        // After season 1 ends (state.year has advanced to 2), inject a fixed intro event before season 2 begins.
        // Only do this when the game is actually continuing to season 2 (no pending victory/gameover transition).
        if (isResolvingSeasonSettlement && state.year === 2 && !nextPendingGameState) {
            let chainHead = nextCurrentEvent;
            let chainTail = null;

            const appendToChain = (ev) => {
                if (!ev) return;
                if (!chainHead) {
                    chainHead = ev;
                    chainTail = ev;
                } else {
                    const tail = chainTail || chainHead;
                    if (tail.options && tail.options.length > 0) {
                        tail.options = tail.options.map(opt => (opt.nextEvent ? opt : { ...opt, nextEvent: ev }));
                    } else {
                        tail.nextEvent = ev;
                    }
                    chainTail = ev;
                }
            };

            if (!state.season2TutorialShown) {
                appendToChain(buildSeason2StarterTutorialEvent());
                nextSeason2TutorialShown = true;
            }

            if (!state.injuryTutorialShown) {
                appendToChain(buildInjuryRiskTutorialEvent());
                nextInjuryTutorialShown = true;
            }

            if (!state.uclTutorialShown && Boolean(state.uclQualifiedNextSeason)) {
                appendToChain(buildUclTutorialEvent());
                nextUclTutorialShown = true;
            }

            if (!state.tabloidStalkingUnlocked) {
                appendToChain(buildTabloidStalkingIntroEvent());
            }

            if (chainHead) {
                if (nextCurrentEvent && nextCurrentEvent !== chainHead) {
                    nextQueuedEvent = nextCurrentEvent;
                }
                nextCurrentEvent = chainHead;
            }
        }

        if (
          isResolvingSeasonSettlement &&
          state.currentTeam?.id === 'bayern_munich' &&
          state.year >= 6 &&
          !nextPendingGameState &&
          !nextSpecialMechanicStateAfterEvent?.bayernCommitteeRemoved
        ) {
          const after = nextCurrentEvent || nextQueuedEvent || null;
          const remainingQueued = nextCurrentEvent ? nextQueuedEvent : null;
          nextCurrentEvent = {
            id: 'bayern_committee_trust',
            title: '通知',
            description: '您已赢得球员们的信任。',
            options: [{ text: '确定', effects: { special_bayern_remove_committee: true }, nextEvent: after }]
          };
          nextQueuedEvent = remainingQueued;
        }

        if (!nextCurrentEvent && nextPendingGameState) {
            gameStateAfterEvent = nextPendingGameState;
            nextPendingGameState = null;
        }

        if (gameStateAfterEvent === 'start') {
          return {
            ...initialState,
            gameState: 'start',
            achievementsUnlocked: state.achievementsUnlocked || {},
            achievementToastQueue: state.achievementToastQueue || [],
            tabloidStalkingUnlocked: state.tabloidStalkingUnlocked
          };
        }

        let nextStateBase = {
            ...state,
            stats: finalStatsAfterEvent,
            currentEvent: nextCurrentEvent,
            queuedEvent: nextQueuedEvent,
            gameState: gameStateAfterEvent,
            activeBuffs: finalBuffsAfterEvent,
            tabloidCount: nextTabloidCountAfterEvent,
            pointsThisQuarter: pointsThisQuarterAfterEvent,
            pendingGameState: nextPendingGameState,
            estimatedRanking: finalEstimatedRanking,
            pendingSeasonReset: finalPendingSeasonReset,
            tabloidStalkingUnlocked: nextTabloidStalkingUnlocked,
            specialMechanicState: nextSpecialMechanicStateAfterEvent,
            relegationFinalRanking: nextRelegationFinalRanking,
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
            uclTutorialShown: nextUclTutorialShown
        };

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
        }

        if (nextStateBase.gameState === 'relegation_resign') {
          nextStateBase = unlockAchievementInState(nextStateBase, 'relegation_resign');
        }

        if (state.currentTeam?.id === 'ac_milan' && isKakaName(state.playerName) && Array.isArray(nextStateBase.activeBuffs) && nextStateBase.activeBuffs.includes('milan_nesta')) {
          nextStateBase = unlockAchievementInState(nextStateBase, 'kaka_milan_nesta');
        }

        return nextStateBase;

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
        if (slot === 1 || slot === 2 || slot === 3) {
          const payload = buildSavePayload(state, 'manual', slot);
          localStorage.setItem(`${MANUAL_SAVE_KEY_PREFIX}${slot}`, JSON.stringify(payload));
        }
      }
    } catch (e) {
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
    } catch (e) {
      // ignore
    }
  }, [state.achievementsUnlocked]);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
