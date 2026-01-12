import React from 'react';
import { useGame } from '../context/GameContext';
import eventsData from '../data/events.json';

const EventCard = () => {
  const { state, dispatch } = useGame();
  const { currentEvent, activeDecisionsTaken, decisionPoints, currentTeam, specialMechanicState } = state;

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
      <div className="retro-box p-6">
        <h3 className="text-2xl font-bold mb-6 font-mono uppercase border-b-2 border-black pb-2">
            本月决策 (剩余: {decisionPoints})
        </h3>
        <div className="grid grid-cols-1 gap-6">
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
                <div key={decision.id} className="border-2 border-black p-4 bg-gray-50">
                    <h4 className="font-bold text-xl mb-2">{decision.title}</h4>
                    {description && <p className="text-lg mb-4 font-mono leading-tight">{description}</p>}
                    
                    {/* Show effects for single-option decisions */}
                    {!decision.options && decision.effects && (
                        <p className="text-sm text-gray-600 mb-4 font-mono">
                            后果: {formatEffects(decision.effects)}
                        </p>
                    )}

                    {decision.options ? (
                        <div className="mt-2 flex flex-wrap gap-3">
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

                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleDecisionClick(decision, opt)}
                                        className="retro-btn text-sm flex flex-col items-start min-w-[120px]"
                                    >
                                        <span className="font-bold">{optText}</span>
                                        <span className="text-xs opacity-70 mt-1">({formatEffects(opt.effects)})</span>
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        <button
                            onClick={() => handleDecisionClick(decision)}
                            className="retro-btn text-sm"
                        >
                            执行
                        </button>
                    )}
                </div>
             );
          })}
        </div>
        
        {decisionPoints === 0 && (
            <button
                onClick={() => dispatch({ type: 'NEXT_MONTH' })}
                className="mt-8 w-full retro-btn-primary text-xl py-4 uppercase tracking-widest"
            >
                结束本月
            </button>
        )}
      </div>
    );
  }

  // Handle Random/Triggered Events
  return (
    <div className="retro-box p-6 border-l-[8px] border-l-yellow-500">
      <h3 className="text-3xl font-bold mb-4 font-mono uppercase">{currentEvent.title}</h3>
      <p className="text-xl mb-8 font-mono leading-relaxed">
          {currentEvent.description
            .replace(/\[名字\]/g, state.playerName)
            .replace(/\[俱乐部\]/g, state.currentTeam.name)
            .replace(/\[执教理念\]/g, state.coachingPhilosophy)
          }
      </p>
      
      <div className="flex flex-col gap-4">
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
                        className="retro-btn text-left flex justify-between items-center group"
                    >
                        <span className="text-lg font-bold group-hover:underline">{optText}</span>
                        <span className="text-sm text-gray-600 ml-4 font-mono">
                            {formatEffects(opt.effects)}
                        </span>
                    </button>
                );
            })
        ) : (
             <button
                onClick={() => dispatch({ type: 'RESOLVE_EVENT', payload: { effects: currentEvent.effects || {} } })}
                className="retro-btn-primary w-full text-lg"
            >
                确定
            </button>
        )}
      </div>
    </div>
  );
};

export default EventCard;
