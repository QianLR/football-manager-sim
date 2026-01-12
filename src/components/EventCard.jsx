import React from 'react';
import { useGame } from '../context/GameContext';
import eventsData from '../data/events.json';

const EventCard = () => {
  const { state, dispatch } = useGame();
  const { currentEvent, activeDecisionsTaken, decisionCountThisMonth, currentTeam, specialMechanicState } = state;
  
  // Calculate remaining points dynamically
  const remainingPoints = 3 - (decisionCountThisMonth || 0);

  // Helper to format effects for display
  const formatEffects = (effects) => {
    if (!effects) return '';
    const labels = {
      boardSupport: '管理层',
      dressingRoom: '更衣室',
      mediaSupport: '媒体',
      authority: '话语权',
      funds: '资金',
      tactics: '技战术',
      tabloid: '小报',
      points_bonus: '积分',
      set_board_support_to_1: '管理层支持变为1',
      chance_tabloid: '50%概率小报+1'
    };
    
    return Object.entries(effects)
      .filter(([key]) => labels[key]) // Only show known stats
      .map(([key, value]) => {
        if (key === 'set_board_support_to_1') return labels[key];
        if (key === 'chance_tabloid') return labels[key];
        const sign = value > 0 ? '+' : '';
        return `${labels[key]} ${sign}${value}`;
      })
      .join(', ');
  };

  // Handle Active Decisions
  if (!currentEvent) {
    const availableDecisions = eventsData.activeDecisions.filter(d => {
        // Filter out team specific decisions if not matching
        if (d.teamId && d.teamId !== currentTeam.id) {
            return false;
        }
        return true; 
    });

    const handleDecisionClick = (decision, option = null) => {
        // Construct payload
        let effects = decision.effects;
        let type = decision.type;
        let optionId = null;
        
        if (option) {
            effects = option.effects;
            optionId = option.id;
            // type is still decision.type
        }

        dispatch({
            type: 'TAKE_DECISION',
            payload: {
                decisionId: decision.id,
                type: type,
                effects: effects,
                optionId: optionId
            }
        });
    };

    return (
      <div className="retro-box p-4">
        <h3 className="text-lg font-bold mb-3 font-mono uppercase border-b-2 border-black pb-1">
            本月决策 (剩余: {decisionPoints})
        </h3>
        <div className="grid grid-cols-1 gap-3">
          {availableDecisions.map(decision => {
             const isTaken = activeDecisionsTaken.includes(decision.type);
             if (isTaken) return null; // Hide taken decisions
             
             // Check conditions (e.g. authority > 60)
             if (decision.condition) {
                 if (decision.condition.authority && state.stats.authority <= decision.condition.authority) {
                     return null;
                 }
             }

             // Special handling for toggle decisions description
             let description = decision.description;
             if (description) {
                 description = description
                    .replace(/\[名字\]/g, state.playerName)
                    .replace(/\[俱乐部\]/g, state.currentTeam.name)
                    .replace(/\[执教理念\]/g, state.coachingPhilosophy);
             }

             if (decision.id === 'toggle_canteen') {
                 description = description.replace('{status}', specialMechanicState.canteenOpen ? '开启' : '关闭');
             } else if (decision.id === 'toggle_roof') {
                 description = description.replace('{status}', specialMechanicState.roofClosed ? '关闭' : '开启');
             }

             return (
                <div key={decision.id} className="border-2 border-black p-3 bg-gray-50">
                    <h4 className="font-bold text-base mb-1">{decision.title}</h4>
                    {description && <p className="text-sm mb-2 font-mono leading-tight">{description}</p>}
                    
                    {/* Show effects for single-option decisions */}
                    {!decision.options && decision.effects && (
                        <p className="text-xs text-gray-600 mb-2 font-mono">
                            后果: {formatEffects(decision.effects)}
                        </p>
                    )}

                    {decision.options ? (
                        <div className="mt-1 flex flex-wrap gap-2">
                            {decision.options.map(opt => {
                                // Filter options based on current state for toggles
                                if (decision.id === 'toggle_canteen') {
                                    if (specialMechanicState.canteenOpen && opt.id === 'open') return null;
                                    if (!specialMechanicState.canteenOpen && opt.id === 'close') return null;
                                }
                                if (decision.id === 'toggle_roof') {
                                    if (specialMechanicState.roofClosed && opt.id === 'close') return null;
                                    if (!specialMechanicState.roofClosed && opt.id === 'open') return null;
                                }

                                let optText = opt.text
                                    .replace(/\[名字\]/g, state.playerName)
                                    .replace(/\[俱乐部\]/g, state.currentTeam.name)
                                    .replace(/\[执教理念\]/g, state.coachingPhilosophy);

                                const costsFunds = opt.effects && opt.effects.funds < 0;
                                const lowAuthority = costsFunds && state.stats.authority <= 70;
                                const limitReached = remainingPoints <= 0;
                                const disabled = limitReached || lowAuthority;

                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleDecisionClick(decision, opt)}
                                        disabled={disabled}
                                        className={`retro-btn text-xs flex flex-col items-start min-w-[100px] py-1 px-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="font-bold">{optText}</span>
                                        <span className="text-[10px] opacity-70 mt-0.5">({formatEffects(opt.effects)})</span>
                                        {lowAuthority && <span className="text-[10px] text-red-600 font-bold mt-0.5">需话语权>70</span>}
                                    </button>
                                );
                            })}
                            </div>
                        ) : (
                            (() => {
                                const costsFunds = decision.effects && decision.effects.funds < 0;
                                const lowAuthority = costsFunds && state.stats.authority <= 70;
                                const limitReached = remainingPoints <= 0;
                                const disabled = limitReached || lowAuthority;
                                
                                return (
                                    <button
                                        onClick={() => handleDecisionClick(decision)}
                                        disabled={disabled}
                                        className={`retro-btn text-xs py-1 px-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {lowAuthority ? '执行 (需话语权>70)' : '执行'}
                                    </button>
                                );
                            })()
                        )}
                    </div>
                 );
              })}
            </div>
            
            {remainingPoints <= 0 && (
                <button
                    onClick={() => dispatch({ type: 'NEXT_MONTH' })}
                    className="mt-4 w-full retro-btn-primary text-base py-2 uppercase tracking-widest"
                >
                    结束本月
                </button>
            )}
          </div>
        );
      }

  // Handle Random/Triggered Events
  return (
    <div className="retro-box p-4 border-l-[6px] border-l-yellow-500">
      <h3 className="text-xl font-bold mb-2 font-mono uppercase">{currentEvent.title}</h3>
      <p className="text-base mb-4 font-mono leading-relaxed">
          {currentEvent.description
            .replace(/\[名字\]/g, state.playerName)
            .replace(/\[俱乐部\]/g, state.currentTeam.name)
            .replace(/\[执教理念\]/g, state.coachingPhilosophy)
          }
      </p>
      
      <div className="flex flex-col gap-2">
        {currentEvent.options ? (
            currentEvent.options.map((opt, index) => {
                const optText = opt.text
                    .replace(/\[名字\]/g, state.playerName)
                    .replace(/\[俱乐部\]/g, state.currentTeam.name)
                    .replace(/\[执教理念\]/g, state.coachingPhilosophy);

                return (
                    <button
                        key={index}
                        onClick={() => dispatch({ type: 'RESOLVE_EVENT', payload: opt })}
                        className="retro-btn text-left flex justify-between items-center group py-2 px-3"
                    >
                        <span className="text-sm font-bold group-hover:underline">{optText}</span>
                        <span className="text-xs text-gray-600 ml-2 font-mono">
                            {formatEffects(opt.effects)}
                        </span>
                    </button>
                );
            })
        ) : (
             <button
                onClick={() => dispatch({ type: 'RESOLVE_EVENT', payload: { effects: currentEvent.effects || {} } })}
                className="retro-btn-primary w-full text-base py-2"
            >
                确定
            </button>
        )}
      </div>
    </div>
  );
};

export default EventCard;
