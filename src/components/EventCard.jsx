import React, { useState } from 'react';
import { useGame } from '../context/GameContext';
import eventsData from '../data/events.json';

const EventCard = () => {
  const { state, dispatch } = useGame();
  const { currentEvent, activeDecisionsTaken, currentTeam, specialMechanicState, uclTeams16, uclDrawCandidates } = state;

  const [expandedDecisionId, setExpandedDecisionId] = useState(null);
  const [infoDecisionId, setInfoDecisionId] = useState(null);
  
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
      injuryRisk: '伤病风险',
      tabloid: '小报消息',
      points_bonus: '积分',
      set_board_support_to_1: '管理层支持变为1',
      chance_tabloid: '50%概率小报消息+1',
      special_rainbow_armband: '获得彩虹臂章(媒体支持永远不会低于10点)',
      opponents_tactics_boost: '其他球队技战术水平'
    };

    const parts = [];

    if (effects.set_board_support_to_1) {
      parts.push(labels.set_board_support_to_1);
      parts.push('媒体支持变为100');
    }

    if (effects.chance_tabloid && !effects.tabloid) {
      parts.push(labels.chance_tabloid);
    }

    if (effects.special_rainbow_armband) {
      parts.push(labels.special_rainbow_armband);
    }

    Object.entries(effects)
      .filter(([key]) => labels[key]) // Only show known stats
      .forEach(([key, value]) => {
        if (key === 'set_board_support_to_1') return;
        if (key === 'chance_tabloid') return;
        if (key === 'special_rainbow_armband') return;

        // Avoid misleading deltas when we use absolute-set mechanics
        if (effects.set_board_support_to_1 && (key === 'boardSupport' || key === 'mediaSupport')) return;

        const sign = value > 0 ? '+' : '';
        parts.push(`${labels[key]} ${sign}${value}`);
      });

    return parts.join(', ');
  };

  const replaceDynamicText = (text) => {
    if (!text) return text;
    const teamName = state.currentTeam?.name || '';
    return text
      .replace(/\[名字\]/g, state.playerName)
      .replace(/\[俱乐部\]/g, teamName)
      .replace(/\[执教理念\]/g, state.coachingPhilosophy)
      .replace(/\[教练名字\]/g, state.playerName)
      .replace(/\[俱乐部名字\]/g, teamName);
  };

  const getDecisionInfoText = (decisionId) => {
    if (decisionId === 'toggle_canteen') {
      return '关闭/打开食堂：消耗一个决策点，技战术水平增加2，关闭的一瞬间，更衣室稳定-20，管理层支持+5，媒体支持-20；关闭之后的每个月，更衣室稳定再-10。每个赛季只能打开关闭各一次。';
    }
    if (decisionId === 'toggle_roof') {
      return '关闭/打开伯纳乌顶棚：消耗一个决策点，每季度结算时如果排名为1，则大幅提升媒体支持，否则大幅降低。每个赛季可打开关闭各一次。';
    }
    if (decisionId === 'coffee_ref') {
      return '【这并不得体，但如果真的到了不得不这么做的地步……一个季度只能使用一次。】';
    }
    return '';
  };

  // Handle Active Decisions
  if (!currentEvent) {
    const availableDecisions = eventsData.activeDecisions.filter(d => {
        // Filter out team specific decisions if not matching
        if (d.teamId && d.teamId !== currentTeam.id) {
            return false;
        }

        if (d.condition && d.condition.year && state.year < d.condition.year) {
            return false;
        }
        if (d.condition && d.condition.buff) {
            return Boolean(state.activeBuffs && state.activeBuffs.includes(d.condition.buff));
        }
        return true; 
    });

    const handleDecisionClick = (decision, option = null) => {
        // Construct payload
        let effects = option ? option.effects : decision.effects;
        if (
          decision.id === 'flirtation' &&
          state.year >= 2 &&
          option &&
          (option.id === 'rival_coach' || option.id === 'foreign_coach')
        ) {
          effects = { ...(effects || {}), tabloid: 1, tactics: 0.5 };
          delete effects.chance_tabloid;
        }
        const optionId = option ? option.id : null;
        const optionDescription = option
          ? option.description
          : (decision.id === 'legend_flirt' ? decision.description : null);
        
        dispatch({
            type: 'TAKE_DECISION',
            payload: {
                decisionId: decision.id,
                type: decision.type,
                effects: effects,
                optionId: optionId,
                optionDescription: optionDescription
            }
        });

        setExpandedDecisionId(null);
    };

    return (
      <div className="retro-box p-2">
        {infoDecisionId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-3">
              <div className="flex items-center justify-between mb-2">
                <div className="font-bold text-sm font-mono">说明</div>
                <button
                  onClick={() => setInfoDecisionId(null)}
                  className="retro-btn text-xs py-1 px-2"
                >
                  关闭
                </button>
              </div>
              <div className="text-xs font-mono text-black leading-relaxed whitespace-pre-wrap">
                {getDecisionInfoText(infoDecisionId)}
              </div>
            </div>
          </div>
        )}
        <h3 className="text-base font-bold mb-2 font-mono uppercase border-b-2 border-black pb-1">
            本月决策 (剩余: {remainingPoints})
        </h3>
        <div className="grid grid-cols-1 gap-2">
          {availableDecisions.map(decision => {
             const isTaken = activeDecisionsTaken.includes(decision.type);
             if (isTaken) return null; // Hide taken decisions
             
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
                    <div className="flex items-start gap-2">
                        <button
                            onClick={() => setExpandedDecisionId(isExpanded ? null : decision.id)}
                            className="flex-1 text-left"
                        >
                            <div className="flex items-center gap-1">
                                <h4 className="font-bold text-sm">{decision.title}</h4>
                            </div>
                            {description && <p className="text-xs font-mono leading-tight text-gray-700">{description}</p>}
                            {!decision.options && decision.effects && (
                                <p className="text-[8px] text-gray-600 mt-1 font-mono">
                                    后果: {formatEffects(decision.effects)}
                                </p>
                            )}
                        </button>

                        {(decision.id === 'toggle_canteen' || decision.id === 'toggle_roof' || decision.id === 'coffee_ref') && (
                            <button
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setInfoDecisionId(decision.id);
                                }}
                                className="inline-flex items-center justify-center w-4 h-4 border-2 border-black rounded-full text-[10px] font-bold bg-white hover:bg-gray-200"
                                aria-label="查看说明"
                            >
                                ?
                            </button>
                        )}
                    </div>
                    
                    {decision.options ? (
                        <div className="mt-2">
                            {isExpanded && (
                                <div className="flex flex-col gap-1">
                                    {[...decision.options,
                                      ...(decision.id === 'flirtation' && state.activeBuffs?.includes('istanbul_kiss')
                                        ? [{ id: 'legend_flirt', text: '和名宿调情', description: '你就是想亲曾经的队长，媒体们有什么可说的呢？他们只能多拍几张照片而已。管理层对你很满意，更衣室也更加相信你了。即使你心里很清楚，哪怕是曾经如胶似漆的那些年，当转会通知下达的那一刻，也会被干净利落地一刀两断——虽然现在看起来是没断成的。', effects: { boardSupport: 5, dressingRoom: 5, mediaSupport: 5 } }]
                                        : [])
                                    ].map(opt => {
                                    if (opt.condition && opt.condition.year && state.year < opt.condition.year) {
                                        return null;
                                    }
                                    // Filter options based on current state for toggles
                                    if (decision.id === 'toggle_canteen') {
                                        if (specialMechanicState.canteenOpen && opt.id === 'open') return null;
                                        if (!specialMechanicState.canteenOpen && opt.id === 'close') return null;

                                        if (specialMechanicState.canteenChangedThisSeason?.open && opt.id === 'open') return null;
                                        if (specialMechanicState.canteenChangedThisSeason?.close && opt.id === 'close') return null;
                                    }
                                    if (decision.id === 'toggle_roof') {
                                        if (specialMechanicState.roofClosed && opt.id === 'close') return null;
                                        if (!specialMechanicState.roofClosed && opt.id === 'open') return null;

                                        if (specialMechanicState.roofChangedThisSeason?.open && opt.id === 'open') return null;
                                        if (specialMechanicState.roofChangedThisSeason?.close && opt.id === 'close') return null;
                                    }

                                let optEffects = opt.effects;
                                if (
                                  decision.id === 'flirtation' &&
                                  state.year >= 2 &&
                                  (opt.id === 'rival_coach' || opt.id === 'foreign_coach')
                                ) {
                                  optEffects = { ...(optEffects || {}), tabloid: 1, tactics: 0.5 };
                                  delete optEffects.chance_tabloid;
                                }

                                let optText = replaceDynamicText(opt.text);

                                const baseRequiredAuthority = decision.condition && decision.condition.authority;
                                const costsFunds = optEffects && optEffects.funds < 0;
                                const requiredAuthority = costsFunds
                                  ? Math.max(baseRequiredAuthority || 0, 70)
                                  : baseRequiredAuthority;
                                const lowAuthority = requiredAuthority && state.stats.authority < requiredAuthority;
                                const insufficientFunds = costsFunds && state.stats.funds < Math.abs(optEffects.funds);
                                const limitReached = remainingPoints <= 0;
                                const disabled = limitReached || lowAuthority || insufficientFunds;

                                const disabledHint = lowAuthority && insufficientFunds
                                  ? `需话语权≥${requiredAuthority}，且资金不足`
                                  : lowAuthority
                                    ? `需话语权≥${requiredAuthority}`
                                    : insufficientFunds
                                      ? '资金不足'
                                      : '';
                                const rightText = disabledHint || formatEffects(optEffects);
                                
                                return (
                                    <button
                                        key={opt.id}
                                        onClick={() => handleDecisionClick(decision, { ...opt, effects: optEffects })}
                                        disabled={disabled}
                                        className={`retro-btn text-xs flex justify-between items-center py-1 px-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <span className="font-bold">{optText}</span>
                                        <span className="text-[8px] text-gray-500 font-mono">{rightText}</span>
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
                                const requiredAuthority = decision.condition && decision.condition.authority;
                                const costsFunds = decision.effects && decision.effects.funds < 0;
                                const effectiveRequiredAuthority = costsFunds
                                  ? Math.max(requiredAuthority || 0, 70)
                                  : requiredAuthority;
                                const lowAuthority = effectiveRequiredAuthority && state.stats.authority < effectiveRequiredAuthority;
                                const insufficientFunds = costsFunds && state.stats.funds < Math.abs(decision.effects.funds);
                                const limitReached = remainingPoints <= 0;
                                const disabled = limitReached || lowAuthority || insufficientFunds;
                                const buttonText = lowAuthority && insufficientFunds
                                  ? `执行 (需话语权≥${effectiveRequiredAuthority}，资金不足)`
                                  : lowAuthority
                                    ? `执行 (需话语权≥${effectiveRequiredAuthority})`
                                    : insufficientFunds
                                      ? '执行 (资金不足)'
                                      : '执行';
                                
                                return (
                                    <button
                                        onClick={() => handleDecisionClick(decision)}
                                        disabled={disabled}
                                        className={`retro-btn text-xs w-full py-1 px-2 mt-2 ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        {buttonText}
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
  if (currentEvent && currentEvent.id === 'ucl_champion') {
    const opt = (currentEvent.options && currentEvent.options[0])
      ? currentEvent.options[0]
      : { text: '继续', effects: {} };
    return (
      <div className="retro-box p-3 border-l-[6px] border-l-yellow-500 ucl-celebrate">
        <div className="text-center">
          <div className="text-3xl">🏆</div>
          <h3 className="text-lg font-bold mt-1 font-mono uppercase">{currentEvent.title}</h3>
          <div className="text-sm font-mono leading-relaxed mt-2">
            {replaceDynamicText(currentEvent.description)}
          </div>
          <div className="mt-3">
            <button
              onClick={() => dispatch({ type: 'RESOLVE_EVENT', payload: opt })}
              className="retro-btn-primary w-full text-sm py-2"
            >
              {replaceDynamicText(opt.text || '继续')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="retro-box p-2 border-l-[6px] border-l-yellow-500">
      <h3 className="text-base font-bold mb-2 font-mono uppercase">{currentEvent.title}</h3>
      <p className="text-sm mb-2 font-mono leading-relaxed">
          {replaceDynamicText(currentEvent.description)}
      </p>

      {currentEvent.effectsPreview && Object.keys(currentEvent.effectsPreview).length > 0 && (
        <div className="text-[8px] text-gray-500 font-mono mb-2">
          （{formatEffects(currentEvent.effectsPreview)}）
        </div>
      )}

      {currentEvent.effects && Object.keys(currentEvent.effects).length > 0 && (
        <div className="text-[8px] text-gray-500 font-mono mb-2">
          （{formatEffects(currentEvent.effects)}）
        </div>
      )}
      
      <div className="flex flex-col gap-2">
        {currentEvent.uclDraw ? (
          <>
            <div className="grid grid-cols-1 gap-2">
              <div className="border-2 border-black bg-gray-50 p-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[11px] font-mono">欧冠16强名单</div>
                  <div className="text-[10px] text-gray-600 font-mono">点击抽签球抽取对手</div>
                </div>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  {(uclTeams16 || []).map(t => (
                    <div
                      key={t.id}
                      className={`border-2 border-black px-1 py-0.5 text-[10px] font-mono ${t.id === currentTeam?.id ? 'bg-black text-white' : 'bg-white text-black'}`}
                    >
                      {t.name}{t.id === currentTeam?.id ? '（你）' : ''}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-2 border-black bg-gray-50 p-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-[11px] font-mono">抽签池（同联赛回避）</div>
                  <div className="text-[10px] text-gray-600 font-mono">剩余对手：{(uclDrawCandidates || []).length}</div>
                </div>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  {(currentEvent.options || []).map((opt, index) => (
                    <button
                      key={index}
                      onClick={() => dispatch({ type: 'RESOLVE_EVENT', payload: opt })}
                      className="retro-btn flex flex-col items-center justify-center py-3"
                    >
                      <div className="w-8 h-8 border-2 border-black rounded-full bg-white" />
                      <div className="text-[10px] font-bold mt-1">抽签</div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : currentEvent.options ? (
            currentEvent.options.map((opt, index) => {
                const optText = replaceDynamicText(opt.text);

                return (
                    <button
                        key={index}
                        onClick={() => dispatch({ type: 'RESOLVE_EVENT', payload: opt })}
                        className="retro-btn text-left flex justify-between items-center group py-2 px-2"
                    >
                        <span className="text-xs font-bold group-hover:underline">{optText}</span>
                        {!currentEvent.revealAfterChoice && opt.effects && Object.keys(opt.effects).length > 0 && (
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
