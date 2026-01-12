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
  specialMechanicState: {
    canteenOpen: true, // Man Utd
    roofClosed: false, // Real Madrid
    canteenChangedThisSeason: { open: false, close: false },
    roofChangedThisSeason: { open: false, close: false }
  },
  activeBuffs: [], // List of active buff/debuff IDs
  tabloidCount: 0,
  easterEggTriggered: false
};

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
        
        // Check if decision type already taken
        if (state.activeDecisionsTaken.includes(type)) {
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

        Object.keys(effects).forEach(key => {
             if (key === 'set_board_support_to_1' || key === 'chance_tabloid' || key === 'special_rainbow_armband') return; // Skip special flags

             if (statsAfterDecision[key] !== undefined) {
                // Special check for mediaSupport: if 0, cannot decrease further
                if (key === 'mediaSupport' && statsAfterDecision[key] === 0 && effects[key] < 0) {
                    return; // Do nothing
                }

                // If we just set boardSupport to 1, don't add/subtract from it in this loop for this decision
                if (effects.set_board_support_to_1 && key === 'boardSupport') {
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
            scandalEvent = {
                id: 'tabloid_scandal',
                title: '头条丑闻爆发！',
                description: '你的私生活被媒体曝光，引发轩然大波。',
                effects: { mediaSupport: -15, boardSupport: -10 }
            };
             // Apply scandal effects immediately
             // Check mediaSupport lower bound
             if (statsAfterDecision.mediaSupport > 0) {
                 statsAfterDecision.mediaSupport = Math.max(0, statsAfterDecision.mediaSupport - 15);
             }
             statsAfterDecision.boardSupport = Math.max(0, statsAfterDecision.boardSupport - 10);
        }
        
        // Record decision history for conditions (e.g. "flirt_rival")
        // We store "type_optionId" or just "type" if no option
        const decisionRecord = optionId ? `${type}_${optionId}` : type;

        return {
            ...state,
            stats: statsAfterDecision,
            decisionPoints: state.decisionPoints - 1,
            activeDecisionsTaken: [...state.activeDecisionsTaken, type],
            decisionHistory: [...state.decisionHistory, decisionRecord],
            tabloidCount: newTabloidCount,
            specialMechanicState: newSpecialState,
            activeBuffs: newActiveBuffs,
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
                // Trigger scandal effects
                statsAfterMonth.mediaSupport = Math.max(0, statsAfterMonth.mediaSupport - 15);
                statsAfterMonth.boardSupport = Math.max(0, statsAfterMonth.boardSupport - 10);
            }
        } else {
            nextActiveBuffs = nextActiveBuffs.filter(b => b !== 'turmoil');
        }

        // Quarter logic
        if (nextMonth > 3) {
            nextMonth = 1;
            nextQuarter += 1;
            
            // --- Quarterly Settlement Logic ---
            
            // 1. Calculate Points
            let pointsGained = 0;
            const tactics = statsAfterMonth.tactics;
            
            if (tactics >= 10) pointsGained = 36;
            else if (tactics >= 9) pointsGained = 30;
            else if (tactics >= 8) pointsGained = 25;
            else if (tactics >= 7) pointsGained = 20;
            else pointsGained = 15;

            // Add points from "Coffee with Ref" bonus if any (handled in TAKE_DECISION effects usually, but points are special)
            // Actually points_bonus in TAKE_DECISION adds directly to stats.points. 
            // But here we calculate *match* points based on tactics.
            
            statsAfterMonth.points += pointsGained;

            // 2. Calculate Ranking (Simplified Simulation)
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
            let boardChange = 0;
            let mediaChange = 0;
            
            if (estimatedRanking <= expectation) {
                // Met expectations
                boardChange += 10; 
            } else {
                // Failed expectations
                boardChange -= 25; 
            }

            // Special Mechanic: Real Madrid Roof
            if (state.currentTeam.id === 'real_madrid' && state.specialMechanicState.roofClosed) {
                if (estimatedRanking === 1) mediaChange += 20;
                else mediaChange -= 20;
            }
            
            // Apply changes with clamping
            statsAfterMonth.boardSupport = Math.max(0, Math.min(100, statsAfterMonth.boardSupport + boardChange));
            
            // Media support check for roof
            if (mediaChange !== 0) {
                 if (statsAfterMonth.mediaSupport === 0 && mediaChange < 0) {
                     // Do nothing
                 } else {
                     statsAfterMonth.mediaSupport = Math.max(0, Math.min(100, statsAfterMonth.mediaSupport + mediaChange));
                 }
            }

            settlementEvent = {
                id: 'quarterly_report',
                title: `第 ${state.quarter} 季度结算`,
                description: `本季度获得积分: ${pointsGained}。当前总积分: ${statsAfterMonth.points}。预估排名: 第 ${estimatedRanking} 名。`,
                effects: {} // Effects already applied
            };
            
            // Check for Victory (End of Season)
            if (state.quarter === 4) { // Assuming 4 quarters per season
                if (estimatedRanking === 1) {
                    victory = true;
                }
            }
        }
        
        // Year logic
        if (nextQuarter > 4) {
            nextQuarter = 1;
            nextYear += 1;
            // Season Finale Logic would go here
        }

        // Random Event Logic (Only if not a settlement event)
        if (!settlementEvent) {
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

            if (validEvents.length > 0) {
                eventToTrigger = validEvents[Math.floor(Math.random() * validEvents.length)];
                
                // Dynamic Text Replacement
                if (eventToTrigger) {
                    eventToTrigger = { ...eventToTrigger }; // Clone to avoid mutating data
                    eventToTrigger.description = eventToTrigger.description
                        .replace(/\[名字\]/g, state.playerName)
                        .replace(/\[俱乐部\]/g, state.currentTeam.name)
                        .replace(/\[执教理念\]/g, state.coachingPhilosophy);
                        
                    if (eventToTrigger.options) {
                        eventToTrigger.options = eventToTrigger.options.map(opt => ({
                            ...opt,
                            text: opt.text
                                .replace(/\[名字\]/g, state.playerName)
                                .replace(/\[俱乐部\]/g, state.currentTeam.name)
                                .replace(/\[执教理念\]/g, state.coachingPhilosophy)
                        }));
                    }
                }
            }
        } else {
            eventToTrigger = settlementEvent;
        }
        
        // Check Game Over conditions again after monthly updates
        let nextGameStateAfterMonth = state.gameState;
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
            activeDecisionsTaken: [],
            currentEvent: eventToTrigger,
            gameState: nextGameStateAfterMonth,
            tabloidCount: nextTabloidCount,
            activeBuffs: nextActiveBuffs
        };
        
    case 'RESOLVE_EVENT':
        // Apply event option effects
        const eventEffects = action.payload.effects;
        const statsAfterEvent = { ...state.stats };
        
        // Handle Buffs from events
        let eventActiveBuffs = [...state.activeBuffs];
        if (eventEffects.special_rainbow_armband) {
            if (!eventActiveBuffs.includes('rainbow_armband')) {
                eventActiveBuffs.push('rainbow_armband');
            }
        }

        Object.keys(eventEffects).forEach(key => {
             if (key === 'special_rainbow_armband') return;

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
        
        // Check Game Over conditions after event resolution
        let gameStateAfterEvent = state.gameState;
        if (statsAfterEvent.boardSupport <= 0 || statsAfterEvent.dressingRoom <= 0) {
            gameStateAfterEvent = 'gameover';
        }

        return {
            ...state,
            stats: statsAfterEvent,
            currentEvent: null,
            gameState: gameStateAfterEvent,
            activeBuffs: eventActiveBuffs
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
