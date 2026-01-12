import React, { createContext, useContext, useReducer } from 'react';
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
  history: [],
  currentEvent: null,
  activeDecisionsTaken: [], // Track decision types taken this month
  decisionHistory: [], // Track all decisions taken for condition checking
  randomEventsThisYear: [],
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
  pointsThisQuarter: 0,
  queuedEvent: null
};

function enforceRainbowArmband(stats, activeBuffs) {
  if (!stats || stats.mediaSupport === undefined) return;
  if (!activeBuffs || !activeBuffs.includes('rainbow_armband')) return;
  stats.mediaSupport = Math.max(10, stats.mediaSupport);
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
        // Trigger welcome event immediately
        currentEvent: {
            id: 'welcome',
            title: '欢迎来到豪门',
            description: `经过漫长的拉扯和谈判，教练${action.payload.playerName}终于下树，${team.name}将在${action.payload.coachingPhilosophy}的理念下迎来新的挑战。这位新教练能在此坚持多久呢？${team.name}能夺得本赛季的冠军吗？让我们拭目以待！`,
            options: [{ text: '开始执教', effects: {} }]
        }
      };

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
      
      // Check Game Over conditions
      let nextGameStateAfterUpdate = state.gameState;
      if (newStats.boardSupport <= 0 || newStats.dressingRoom <= 0) {
        nextGameStateAfterUpdate = 'gameover';
      }

      return {
        ...state,
        stats: newStats,
        gameState: nextGameStateAfterUpdate
      };

    case 'TAKE_DECISION':
        const { decisionId, type, effects, optionId } = action.payload;
        
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
        }
        if (effects.special_roof) {
            newSpecialState.roofClosed = effects.special_roof === 'close';
        }

        // Check for tabloid scandal
        let scandalEvent = null;
        if (newTabloidCount >= 3) {
            newTabloidCount = 0;
            scandalEvent = buildTabloidBreakingEvent();
        }

        enforceRainbowArmband(statsAfterDecision, newActiveBuffs);
        
        // Record decision history for conditions (e.g. "flirt_rival")
        // We store "type_optionId" or just "type" if no option
        const decisionRecord = optionId ? `${type}_${optionId}` : type;

        return {
            ...state,
            stats: statsAfterDecision,
            decisionPoints: state.decisionPoints - 1, // Keep for backward compatibility if needed, but logic relies on count now
            decisionCountThisMonth: state.decisionCountThisMonth + 1,
            activeDecisionsTaken: [...state.activeDecisionsTaken, type],
            decisionHistory: [...state.decisionHistory, decisionRecord],
            tabloidCount: newTabloidCount,
            specialMechanicState: newSpecialState,
            activeBuffs: newActiveBuffs,
            pointsThisQuarter: pointsThisQuarterAfterDecision,
            currentEvent: scandalEvent // Trigger scandal if happened
        };

    case 'NEXT_MONTH':
        let nextMonth = state.month + 1;
        let nextQuarter = state.quarter;
        let nextYear = state.year;
        let eventToTrigger = null;
        let statsAfterMonth = { ...state.stats };
        let settlementEvent = null;
        let victory = false;
        let nextTabloidCount = state.tabloidCount;
        let nextActiveBuffs = [...state.activeBuffs];
        let pointsThisQuarterAfterMonth = state.pointsThisQuarter;
        let forcedEvent = null;
        let queuedEvent = null;
        let nextRandomEventsThisYear = [...(state.randomEventsThisYear || [])];

        // Monthly Canteen Check (Man Utd)
        if (state.currentTeam.id === 'man_utd' && !state.specialMechanicState.canteenOpen) {
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
            
            // --- Quarterly Settlement Logic ---

            // 1. Calculate Ranking (Simplified Simulation)
            // We need a way to determine ranking based on total points vs "virtual" league table.
            // For v1.0, let's map points to a rough ranking.
            // Max points per quarter = 36. Max total = 144.
            // Let's assume top team gets ~34 points per quarter.
            
            // Let's define "Par Score" for 1st place as 34 * quarter.
            const parScore = 34 * state.quarter; 
            const diff = parScore - statsAfterMonth.points;
            
            let estimatedRanking = 1;
            if (diff <= 0) estimatedRanking = 1;
            else if (diff <= 6) estimatedRanking = 2;
            else if (diff <= 12) estimatedRanking = 4;
            else if (diff <= 18) estimatedRanking = 6;
            else estimatedRanking = 8; // GDD says min 8 for giants

            // Modifiers
            if (statsAfterMonth.dressingRoom < 40) {
                estimatedRanking += 1;
            }
            
            // Clamp ranking
            estimatedRanking = Math.min(20, Math.max(1, estimatedRanking));
            
            // 3. Check Expectations
            const expectation = state.currentTeam.expectations.ranking;
            const metExpectation = estimatedRanking <= expectation;
            let mediaChange = 0;

            // Special Mechanic: Real Madrid Roof
            if (state.currentTeam.id === 'real_madrid' && state.specialMechanicState.roofClosed) {
                if (estimatedRanking === 1) mediaChange += 20;
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
                ranking: estimatedRanking,
                points: statsAfterMonth.points,
                metExpectation,
                authority: statsAfterMonth.authority
            });
            
            // Check for Victory (End of Season)
            if (state.quarter === 4) { // Assuming 4 quarters per season
                if (estimatedRanking === 1) {
                    victory = true;
                }
            }

            pointsThisQuarterAfterMonth = 0;
        }
        
        // Year logic
        if (nextQuarter > 4) {
            nextQuarter = 1;
            nextYear += 1;
            // Season Finale Logic would go here
        }

        if (nextYear !== state.year) {
            nextRandomEventsThisYear = [];
        }

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
        const randomEventCount = settlementEvent ? 3 : 1;
        const sourcePool = validEvents.length > 0 ? validEvents : allEvents;
        const pickedEvents = [];
        let availablePool = sourcePool.filter(ev => ev && ev.id && !nextRandomEventsThisYear.includes(ev.id));
        if (availablePool.length === 0) {
            availablePool = sourcePool;
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

        // Quarterly expectation report takes priority, but chains into any other event
        if (settlementEvent) {
            if (eventToTrigger) {
                settlementEvent = { ...settlementEvent, nextEvent: eventToTrigger };
            }
            eventToTrigger = settlementEvent;
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
        } else if (victory) {
            nextGameStateAfterMonth = 'victory';
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
            queuedEvent: queuedEvent,
            randomEventsThisYear: nextRandomEventsThisYear
        };
        
    case 'RESOLVE_EVENT':
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

        return {
            ...state,
            stats: statsAfterEvent,
            currentEvent: nextCurrentEvent,
            queuedEvent: nextQueuedEvent,
            gameState: gameStateAfterEvent,
            activeBuffs: eventActiveBuffs,
            tabloidCount: nextTabloidCountAfterEvent,
            pointsThisQuarter: pointsThisQuarterAfterEvent
        };

    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(gameReducer, initialState);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  return useContext(GameContext);
}
