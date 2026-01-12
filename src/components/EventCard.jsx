import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import eventsData from '../data/events.json';

const EventCard = () => {
  const { state, dispatch } = useGame();
  const { currentEvent, activeDecisionsTaken, currentTeam, specialMechanicState } = state;

  const [expandedDecisionId, setExpandedDecisionId] = useState(null);
  
  // Calculate remaining points dynamically
  const remainingPoints = state.decisionPoints;

  // Helper to format effects for display
  const formatEffects = (effects) => {
    if (!effects) return '';
    const labels = {
      boardSupport: '管理层支持',
      dressingRoom: '更衣室稳定',
      mediaSupport: '媒体支持',
      authority: '话语权',
      funds: '球队资金',
      tactics: '技战术水平',
      tabloid: '小报消息',
      points_bonus: '积分',
      set_board_support_to_1: '管理层支持变为1',
      chance_tabloid: '50%概率小报消息+1'
    };

    const parts = [];

    if (effects.set_board_support_to_1) {
      parts.push(labels.set_board_support_to_1);
      parts.push('媒体支持变为100');
    }

    if (effects.chance_tabloid) {
      parts.push(labels.chance_tabloid);
    }

    Object.entries(effects)
      .filter(([key]) => labels[key]) // Only show known stats
      .forEach(([key, value]) => {
        if (key === 'set_board_support_to_1') return;
        if (key === 'chance_tabloid') return;

        // Avoid misleading deltas when we use absolute-set mechanics
        if (effects.set_board_support_to_1 && (key === 'boardSupport' || key === 'mediaSupport')) return;

        const sign = value > 0 ? '+' : '';
        parts.push(`${labels[key]} ${sign}${value}`);
      });

    return parts.join(', ');
  };

  const replaceDynamicText = (text) => {
    if (!text) return text;
    return text
      .replace(/\[名字\]/g, state.playerName)
      .replace(/\[俱乐部\]/g, state.currentTeam.name)
      .replace(/\[执教理念\]/g, state.coachingPhilosophy)
      .replace(/\[教练名字\]/g, state.playerName)
      .replace(/\[俱乐部名字\]/g, state.currentTeam.name);
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

        setExpandedDecisionId(null);
    };

    return (
      <div className="retro-box p-2">
        <h3 className="text-base font-bold mb-2 font-mono uppercase border-b-2 border-black pb-1">
            本月决策 (剩余: {remainingPoints})
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {availableDecisions.map(decision => {
             const isTaken = activeDecisionsTaken.includes(decision.type);
             if (isTaken) return null; // Hide taken decisions
             
             // Check conditions (e.g. authority > 60)
             if (decision.condition) {
                 if (decision.condition.authority && state.stats.authority < decision.condition.authority) {
                     return null;
                 }
             }

             // Special handling for toggle decisions description
             let description = decision.description;
             if (description) {
                 description = replaceDynamicText(description);
             }

             if (decision.id === 'toggle_canteen') {
                 description = description.replace('{status}', specialMechanicState.canteenOpen ? '开启' : '关闭');
             } else if (decision.id === 'toggle_roof') {
                 description = description.replace('{status}', specialMechanicState.roofClosed ? '关闭' : '开启');
             }

             const isExpanded = expandedDecisionId === decision.id;

             return (
                <div key={decision.id} className="border-2 border-black p-2 bg-gray-50">
                    <button
                        onClick={() => setExpandedDecisionId(isExpanded ? null : decision.id)}
                        className="w-full text-left"
                    >
                        <h4 className="font-bold text-sm">{decision.title}</h4>
                        {description && <p className="text-xs font-mono leading-tight text-gray-700">{description}</p>}
                        {!decision.options && decision.effects && (
                            <p className="text-[8px] text-gray-600 mt-1 font-mono">
                                后果: {formatEffects(decision.effects)}
                            </p>
                        )}
                    </button>
                    
                    {decision.options ? (
                        <div className="mt-2">
                            {isExpanded && (
                                <div className="flex flex-col gap-1">
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

                                let optText = replaceDynamicText(opt.text);

                                    const costsFunds = opt.effects && opt.effects.funds < 0;
                                    const lowAuthority = costsFunds && state.stats.authority < 70;
                                    const limitReached = remainingPoints <= 0;
                                    const disabled = limitReached || lowAuthority;
                                    
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => handleDecisionClick(decision, opt)}
                                            disabled={disabled}
                                            className={`retro-btn text-xs flex justify-between items-center py-1 px-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            <span className="font-bold">{optText}</span>
                                            <span className="text-[8px] text-gray-500 font-mono">{formatEffects(opt.effects)}</span>
                                        </button>
                                    );
                                    })}
                                </div>
                            )}
                            {!isExpanded && (
                                <button
                                    onClick={() => setExpandedDecisionId(decision.id)}
                                    className="retro-btn text-xs w-full py-1 px-2"
                                >
                                    展开选项
                                </button>
                            )}
                        </div>
                        ) : (
                            (() => {
                                const costsFunds = decision.effects && decision.effects.funds < 0;
                                const lowAuthority = costsFunds && state.stats.authority < 70;
                                const limitReached = remainingPoints <= 0;
                                const disabled = limitReached || lowAuthority;
                                
                                return (
                                    <button
                                        onClick={() => handleDecisionClick(decision)}
                                        disabled={disabled}
                                        className={`retro-btn text-xs w-full py-1 px-2 mt-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {lowAuthority ? '执行 (需话语权≥70)' : '执行'}
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
                    className="mt-2 w-full retro-btn-primary text-sm py-2 uppercase tracking-widest"
                >
                    结束本月
                </button>
            )}
          </div>
        );
      }

  // Handle Random/Triggered Events
  return (
    <div className="retro-box p-2 border-l-[6px] border-l-yellow-500">
      <h3 className="text-base font-bold mb-2 font-mono uppercase">{currentEvent.title}</h3>
      <p className="text-sm mb-2 font-mono leading-relaxed">
          {replaceDynamicText(currentEvent.description)}
      </p>

      {currentEvent.effects && Object.keys(currentEvent.effects).length > 0 && (
        <div className="text-[8px] text-gray-500 font-mono mb-2">
          （{formatEffects(currentEvent.effects)}）
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        {currentEvent.options ? (
            currentEvent.options.map((opt, index) => {
                const optText = replaceDynamicText(opt.text);

                return (
                    <button
                        key={index}
                        onClick={() => dispatch({ type: 'RESOLVE_EVENT', payload: opt })}
                        className="retro-btn text-left flex justify-between items-center group py-2 px-2"
                    >
                        <span className="text-xs font-bold group-hover:underline">{optText}</span>
                        {opt.effects && Object.keys(opt.effects).length > 0 && (
                          <span className="text-[8px] text-gray-500 ml-2 font-mono">
                              {formatEffects(opt.effects)}
                          </span>
                        )}
                    </button>
                );
            })
        ) : (
             <button
                onClick={() => dispatch({ type: 'RESOLVE_EVENT', payload: { effects: currentEvent.effects || {}, nextEvent: currentEvent.nextEvent } })}
                className="retro-btn-primary w-full text-sm py-2"
            >
                确定
            </button>
        )}
      </div>
    </div>
  );
};

export default EventCard;
