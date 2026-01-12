import React, { createContext, useContext, useReducer, useEffect } from 'react';
import teamsData from '../data/teams.json';
import eventsData from '../data/events.json';

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
    roofChangedThisSeason: { open: false, close: false }
  },
  activeBuffs: [], // List of active buff/debuff IDs
  tabloidCount: 0,
  decisionCountThisMonth: 0, // Track number of decisions taken this month
  easterEggTriggered: false,
  artetaEasterEggTriggered: false,
  pointsThisQuarter: 0,
  queuedEvent: null,
  pendingGameState: null,
  pendingSave: null
};

const SAVE_VERSION = 1;
const AUTO_SAVE_KEY = 'gsm_save_auto_latest';
const MANUAL_SAVE_KEY_PREFIX = 'gsm_save_manual_';

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

function hydrateLoadedState(savedState) {
  if (!savedState || typeof savedState !== 'object') return null;
  return {
    ...initialState,
    ...savedState,
    pendingSave: null
  };
}

function estimateRankingFromPoints(points, monthsPlayed) {
  const played = Math.max(0, monthsPlayed || 0);
  if (played === 0) return 1;

  // 3 quarters * 3 months = 9 months per season. Champion pace ~96 points.
  const championPacePerMonth = 32 / 3;
  const target = championPacePerMonth * played;
  const diff = target - (points || 0);

  let estimatedRanking = 1;
  if (diff <= 0) estimatedRanking = 1;
  else if (diff <= 3) estimatedRanking = 2;
  else if (diff <= 6) estimatedRanking = 3;
  else if (diff <= 9) estimatedRanking = 4;
  else if (diff <= 12) estimatedRanking = 5;
  else if (diff <= 15) estimatedRanking = 6;
  else if (diff <= 18) estimatedRanking = 7;
  else estimatedRanking = 8;

  return Math.min(20, Math.max(1, estimatedRanking));
}

function enforceRainbowArmband(stats, activeBuffs) {
  if (!stats || stats.mediaSupport === undefined) return;
  if (!activeBuffs || !activeBuffs.includes('rainbow_armband')) return;
  stats.mediaSupport = Math.max(10, stats.mediaSupport);
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

function isArtetaName(name) {
  const n = (name || '').trim().toLowerCase();
  return n === '阿尔特塔' || n === '米克尔阿尔特塔' || n === 'arteta' || n === 'mikel arteta';
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

function buildSeasonSettlementEvent({ seasonYear, ranking, points, champion }) {
  if (champion) {
    return {
      id: 'season_settlement',
      title: `第${seasonYear}赛季结算`,
      description: `你以第${ranking}名和${points}分结束了第${seasonYear}个赛季。冠军属于你。`,
      effects: {}
    };
  }

  return {
    id: 'season_settlement',
    title: `第${seasonYear}赛季结算`,
    description: `你以第${ranking}名和${points}分结束了第${seasonYear}个赛季。赛季结束，新的挑战即将开始。`,
    effects: {}
  };
}

function isAlonsoName(name) {
  const n = (name || '').trim().toLowerCase();
  return n === '阿隆索' || n === '哈维阿隆索' || n === 'xabi alonso' || n === 'alonso';
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
      { text: '礼貌拒绝（这才会重新开始）', effects: {}, setPendingGameState: 'gameover' }
    ]
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
    case 'START_GAME':
      const team = teamsData.find(t => t.id === action.payload.teamId);
      return {
        ...initialState,
        gameState: 'playing',
        currentTeam: team,
        playerName: action.payload.playerName,
        coachingPhilosophy: action.payload.coachingPhilosophy,
        stats: { ...team.initialStats },
        estimatedRanking: 1,
        // Trigger welcome event immediately
        currentEvent: {
            id: 'welcome',
            title: '欢迎来到豪门',
            description: `经过漫长的拉扯和谈判，教练${action.payload.playerName}终于下树，${team.name}将在${action.payload.coachingPhilosophy}的理念下迎来新的挑战。这位新教练能在此坚持多久呢？${team.name}能夺得本赛季的冠军吗？让我们拭目以待！`,
            options: [{ text: '开始执教', effects: {} }]
        }
      };

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
        return {
            ...state,
            gameState: 'playing',
            currentEvent: buildArtetaExHusbandEvent({ firedBy }),
            queuedEvent: null,
            pendingGameState: null,
            artetaEasterEggTriggered: true
        };
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
        return next ? next : state;
    }

    case 'UPDATE_STATS':
      const newStats = { ...state.stats };
      Object.keys(action.payload).forEach(key => {
        if (newStats[key] !== undefined) {
          // Special check for mediaSupport: if 0, cannot decrease further
          if (key === 'mediaSupport' && newStats[key] === 0 && action.payload[key] < 0) {
              return; // Do nothing
          }

          newStats[key] += action.payload[key];
          
          // Clamp values
          if (['boardSupport', 'dressingRoom', 'mediaSupport', 'authority'].includes(key)) {
             newStats[key] = Math.max(0, Math.min(100, newStats[key]));
          } else if (key === 'tactics') {
             newStats[key] = Math.max(0, Math.min(10, newStats[key]));
          } else if (key === 'funds') {
             newStats[key] = Math.max(0, newStats[key]); // Funds cannot be negative
          }
        }
      });

      enforceRainbowArmband(newStats, state.activeBuffs);

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

      return {
        ...state,
        stats: newStats,
        gameState: nextGameStateAfterUpdate,
        activeBuffs: nextBuffsAfterUpdate
      };

    case 'TAKE_DECISION':
        const { decisionId, type, effects, optionId, optionDescription } = action.payload;
        
        // Check if decision limit reached (max 3 per month)
        if (state.decisionCountThisMonth >= 3) {
            return state;
        }

        // Check if decision type already taken
        if (state.activeDecisionsTaken.includes(type)) {
            return state;
        }

        // Check authority requirement for using funds
        if (effects.funds < 0 && state.stats.authority < 70) {
            return state;
        }

        if (effects.funds < 0 && (state.stats.funds + effects.funds) < 0) {
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
        
        // Special logic for "explode" (set board support to 1)
        if (effects.set_board_support_to_1) {
            statsAfterDecision.boardSupport = 1;
            statsAfterDecision.mediaSupport = 100;
        }

        // Handle Buffs/Debuffs from decisions (if any)
        let newActiveBuffs = [...state.activeBuffs];
        if (effects.special_rainbow_armband) {
            if (!newActiveBuffs.includes('rainbow_armband')) {
                newActiveBuffs.push('rainbow_armband');
            }
        }

        let pointsThisQuarterAfterDecision = state.pointsThisQuarter;
        if (effects.points_bonus) {
            statsAfterDecision.points += effects.points_bonus;
            pointsThisQuarterAfterDecision += effects.points_bonus;
        }

        Object.keys(effects).forEach(key => {
             if (key === 'set_board_support_to_1' || key === 'chance_tabloid' || key === 'special_rainbow_armband' || key === 'points_bonus') return; // Skip special flags

             if (statsAfterDecision[key] !== undefined) {
                // Special check for mediaSupport: if 0, cannot decrease further
                if (key === 'mediaSupport' && statsAfterDecision[key] === 0 && effects[key] < 0) {
                    return; // Do nothing
                }

                // If we just set boardSupport to 1, don't add/subtract from it in this loop for this decision
                if (effects.set_board_support_to_1 && key === 'boardSupport') {
                    return;
                }

                // If we just set mediaSupport to 100, don't add/subtract from it in this loop for this decision
                if (effects.set_board_support_to_1 && key === 'mediaSupport') {
                    return;
                }

                statsAfterDecision[key] += effects[key];
                
                // Clamp values immediately after decision
                if (['boardSupport', 'dressingRoom', 'mediaSupport', 'authority'].includes(key)) {
                    statsAfterDecision[key] = Math.max(0, Math.min(100, statsAfterDecision[key]));
                } else if (key === 'tactics') {
                    statsAfterDecision[key] = Math.max(0, Math.min(10, statsAfterDecision[key]));
                } else if (key === 'funds') {
                    statsAfterDecision[key] = Math.max(0, statsAfterDecision[key]);
                }
             }
        });
        
        // Handle special effects like tabloid count
        let newTabloidCount = state.tabloidCount;
        
        // Handle chance_tabloid (50% chance for +1)
        if (effects.chance_tabloid) {
            if (Math.random() < 0.5) {
                newTabloidCount += 1;
            }
        } else if (effects.tabloid) {
             newTabloidCount += effects.tabloid;
        }

        // Handle special mechanics (Canteen/Roof)
        let newSpecialState = { ...state.specialMechanicState };
        if (effects.special_canteen) {
            newSpecialState.canteenOpen = effects.special_canteen === 'open';
            newSpecialState.canteenChangedThisSeason = {
                ...(newSpecialState.canteenChangedThisSeason || { open: false, close: false }),
                [effects.special_canteen]: true
            };
        }
        if (effects.special_roof) {
            newSpecialState.roofClosed = effects.special_roof === 'close';
            newSpecialState.roofChangedThisSeason = {
                ...(newSpecialState.roofChangedThisSeason || { open: false, close: false }),
                [effects.special_roof]: true
            };
        }

        // Check for tabloid scandal
        let scandalEvent = null;
        if (newTabloidCount >= 3) {
            newTabloidCount = 0;
            scandalEvent = buildTabloidBreakingEvent();
        }

        let flavorEvent = null;
        if (decisionId === 'flirtation' && optionId === 'legend') {
            flavorEvent = {
                id: 'istanbul_kiss_flavor',
                title: '伊斯坦布尔之吻',
                description: '你就是想亲曾经的队长，媒体们有什么可说的呢？',
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

        return {
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
            queuedEvent: nextQueuedEventAfterDecision
        };

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
        let nextTabloidCount = state.tabloidCount;
        let nextActiveBuffs = [...state.activeBuffs];
        let pointsThisQuarterAfterMonth = state.pointsThisQuarter;
        let forcedEvent = null;
        let queuedEvent = null;
        let nextRandomEventsThisYear = [...(state.randomEventsThisYear || [])];
        let nextLastRandomEventId = state.lastRandomEventId;
        let pendingGameState = null;
        let shouldAutoSave = false;
        let nextEstimatedRanking = state.estimatedRanking;

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

            // 动乱期间管理层支持、话语权每个结算期都会下降，小报消息每个月+1
            statsAfterMonth.boardSupport = Math.max(0, statsAfterMonth.boardSupport - 5);
            statsAfterMonth.authority = Math.max(0, statsAfterMonth.authority - 5);
            
            nextTabloidCount += 1;
            if (nextTabloidCount >= 3) {
                nextTabloidCount = 0;
                forcedEvent = buildTabloidBreakingEvent();
            }
        } else {
            nextActiveBuffs = nextActiveBuffs.filter(b => b !== 'turmoil');
        }

        // Monthly Match Settlement (4 matches)
        let pointsGainedThisMonth = 0;
        const tacticsThisMonth = statsAfterMonth.tactics;
        if (tacticsThisMonth >= 10) pointsGainedThisMonth = 12;
        else if (tacticsThisMonth >= 9) pointsGainedThisMonth = 10;
        else if (tacticsThisMonth >= 8) pointsGainedThisMonth = 8;
        else if (tacticsThisMonth >= 7) pointsGainedThisMonth = 7;
        else pointsGainedThisMonth = 5;

        statsAfterMonth.points += pointsGainedThisMonth;
        pointsThisQuarterAfterMonth += pointsGainedThisMonth;

        // Quarter logic
        if (nextMonth > 3) {
            nextMonth = 1;
            nextQuarter += 1;
            shouldAutoSave = true;
            
            // --- Quarterly Settlement Logic ---

            // Ranking estimation for quarter end
            const monthsPlayedAtQuarterEnd = state.quarter * 3;
            quarterEstimatedRanking = estimateRankingFromPoints(statsAfterMonth.points, monthsPlayedAtQuarterEnd);
            
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
                 if (statsAfterMonth.mediaSupport === 0 && mediaChange < 0) {
                     // Do nothing
                 } else {
                     statsAfterMonth.mediaSupport = Math.max(0, Math.min(100, statsAfterMonth.mediaSupport + mediaChange));
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

            // Reset per-season toggles, but keep current on/off states.
            nextSpecialState = {
                ...nextSpecialState,
                canteenChangedThisSeason: { open: false, close: false },
                roofChangedThisSeason: { open: false, close: false }
            };
        }

        if (nextYear !== state.year) {
            nextRandomEventsThisYear = [];
            nextLastRandomEventId = null;
        }

        // Update ranking every month based on total points and months played
        const monthsPlayed = (nextQuarter - 1) * 3 + (nextMonth - 1);
        nextEstimatedRanking = estimateRankingFromPoints(statsAfterMonth.points, monthsPlayed);

        // Random Event Logic
        const globalEvents = eventsData.randomEvents.global;
        const teamEvents = eventsData.randomEvents.teamSpecific[state.currentTeam.id] || [];
        const allEvents = [...globalEvents, ...teamEvents];
        
        // Filter events based on conditions
        const validEvents = allEvents.filter(event => {
            if (!event.condition) return true;
            
            if (event.condition.type === 'decision_history') {
                // Check if specific decision option was taken
                // e.g. value="risk", detail="rival_coach" -> "risk_rival_coach"
                const requiredDecision = `${event.condition.value}_${event.condition.detail}`;
                return state.decisionHistory.includes(requiredDecision);
            }
            return true;
        });

        // Always trigger at least 1 random event each month.
        // At quarter end, trigger 3 random events in sequence.
        const isSeasonEnd = state.quarter === 3 && settlementEvent;

        // At season end, enter the season settlement screen immediately.
        // For other quarters, still trigger 3 random events.
        const randomEventCount = isSeasonEnd ? 0 : (settlementEvent ? 3 : 1);
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

        // Settlement report takes priority, but chains into any other event
        if (settlementEvent) {
            // At season end, show season settlement (and optionally end the game after confirming)
            if (state.quarter === 3) {
                const seasonEndRanking = quarterEstimatedRanking ?? nextEstimatedRanking;
                const seasonSettlementEvent = buildSeasonSettlementEvent({
                    seasonYear: state.year,
                    ranking: seasonEndRanking,
                    points: statsAfterMonth.points,
                    champion: victory
                });

                eventToTrigger = seasonSettlementEvent;
                queuedEvent = null;
                if (victory) {
                    pendingGameState = 'victory';
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

        if (statsAfterMonth.boardSupport <= 0 || statsAfterMonth.dressingRoom <= 0) {
            nextGameStateAfterMonth = 'gameover';
        }

        return {
            ...state,
            stats: statsAfterMonth,
            month: nextMonth,
            quarter: nextQuarter,
            year: nextYear,
            decisionPoints: 3,
            decisionCountThisMonth: 0, // Reset decision count for new month
            activeDecisionsTaken: [],
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
            pendingSave: state.pendingSave ? state.pendingSave : (shouldAutoSave ? { type: 'auto' } : null)
        };
        
    case 'RESOLVE_EVENT':
        if (action.payload && action.payload.switchTeamId) {
            const nextTeam = teamsData.find(t => t.id === action.payload.switchTeamId);
            if (!nextTeam) return state;

            return {
                ...initialState,
                gameState: 'playing',
                currentTeam: nextTeam,
                playerName: state.playerName,
                coachingPhilosophy: state.coachingPhilosophy,
                stats: { ...nextTeam.initialStats },
                activeBuffs: action.payload.grantBuff ? [action.payload.grantBuff] : [],
                easterEggTriggered: true,
                currentEvent: {
                    id: 'welcome_liverpool',
                    title: 'You’ll never walk alone',
                    description: '你接受了邀请，前往利物浦执教。',
                    options: [{ text: '开始执教', effects: {} }]
                }
            };
        }

        // Apply event option effects
        const eventEffects = action.payload.effects || {};
        const statsAfterEvent = { ...state.stats };
        
        // Handle Buffs from events
        let eventActiveBuffs = [...state.activeBuffs];
        if (eventEffects.special_rainbow_armband) {
            if (!eventActiveBuffs.includes('rainbow_armband')) {
                eventActiveBuffs.push('rainbow_armband');
            }
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
             if (key === 'special_rainbow_armband' || key === 'chance_tabloid' || key === 'tabloid' || key === 'points_bonus') return;

             if (statsAfterEvent[key] !== undefined) {
                // Special check for mediaSupport: if 0, cannot decrease further
                if (key === 'mediaSupport' && statsAfterEvent[key] === 0 && eventEffects[key] < 0) {
                    return; // Do nothing
                }
                 
                statsAfterEvent[key] += eventEffects[key];
                
                // Clamp values
                if (['boardSupport', 'dressingRoom', 'mediaSupport', 'authority'].includes(key)) {
                    statsAfterEvent[key] = Math.max(0, Math.min(100, statsAfterEvent[key]));
                } else if (key === 'tactics') {
                    statsAfterEvent[key] = Math.max(0, Math.min(10, statsAfterEvent[key]));
                } else if (key === 'funds') {
                    statsAfterEvent[key] = Math.max(0, statsAfterEvent[key]);
                }
             }
        });

        enforceRainbowArmband(statsAfterEvent, eventActiveBuffs);

        const syncedBuffsAfterEvent = syncDerivedBuffs({
          activeBuffs: eventActiveBuffs,
          stats: statsAfterEvent,
          teamId: state.currentTeam?.id,
          specialMechanicState: state.specialMechanicState
        });
        
        // Check Game Over conditions after event resolution
        let gameStateAfterEvent = state.gameState;
        if (statsAfterEvent.boardSupport <= 0 || statsAfterEvent.dressingRoom <= 0) {
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

        let nextPendingGameState = state.pendingGameState;
        if (action.payload && action.payload.setPendingGameState) {
            nextPendingGameState = action.payload.setPendingGameState;
        }
        if (!nextCurrentEvent && nextPendingGameState) {
            gameStateAfterEvent = nextPendingGameState;
            nextPendingGameState = null;
        }

        return {
            ...state,
            stats: statsAfterEvent,
            currentEvent: nextCurrentEvent,
            queuedEvent: nextQueuedEvent,
            gameState: gameStateAfterEvent,
            activeBuffs: syncedBuffsAfterEvent,
            tabloidCount: nextTabloidCountAfterEvent,
            pointsThisQuarter: pointsThisQuarterAfterEvent,
            pendingGameState: nextPendingGameState
        };

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

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
