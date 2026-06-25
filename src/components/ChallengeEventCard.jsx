import React, { useCallback, useState } from 'react';
import { useGame } from '../context/GameContextInstance';
import ChallengeMatchAnimation from './ChallengeMatchAnimation';
import {
  CHALLENGE_GROUP_FIXTURES,
  CHALLENGE_GROUP_TEAMS,
  CHALLENGE_MODE_DECISIONS,
  CHALLENGE_FRIENDLY_OPPONENTS,
  CHALLENGE_PREMATCH_TACTIC_GROUPS
} from '../data/challengeMode';

const FRIENDLY_OPPONENT_OFFICIAL_NAMES = {
  netherlands: 'Netherlands',
  germany_friendly: 'Deutschland',
  england: 'England',
  switzerland: 'Schweiz',
  belgium: 'België / Belgique',
  poland: 'Polska',
  bosnia: 'Bosna i Hercegovina',
  sweden: 'Sverige',
  north_macedonia: 'Severna Makedonija'
};

function formatEffects(effects) {
  if (!effects) return '';
  const labels = {
    dressingRoom: '更衣室稳定',
    authority: '权威',
    mediaSupport: '媒体支持',
    fatigue: '疲惫',
    tactics: '技战术水平',
    negativeNews: '负面新闻'
  };
  return Object.entries(effects)
    .filter(([key]) => labels[key])
    .map(([key, value]) => `${labels[key]} ${value > 0 ? '+' : ''}${value}`)
    .join('，');
}

function isDecisionAuthorityLocked(decision, stats) {
  if (!decision?.requiresAuthorityAbove && decision?.requiresAuthorityAbove !== 0) return false;
  return (stats?.authority ?? 0) < decision.requiresAuthorityAbove;
}

function authorityRequirementText(decision) {
  if (!decision?.requiresAuthorityAbove && decision?.requiresAuthorityAbove !== 0) return '';
  return '权威不足';
}

function titleForMatch(challenge) {
  let opponent = challenge?.upcomingOpponent?.name || '';
  if (!opponent && challenge?.phase === 'group') {
    const fixture = CHALLENGE_GROUP_FIXTURES[challenge?.groupMatchIndex || 0];
    opponent = CHALLENGE_GROUP_TEAMS.find(team => team.id === fixture?.opponentId)?.name || '';
  }
  if (!opponent && challenge?.phase === 'knockout') {
    opponent = challenge?.knockoutRounds?.[challenge?.knockoutIndex || 0]?.opponent?.name || '';
  }
  if (!opponent) return '选择对手';
  if (challenge.phase === 'friendlies') return `友谊赛 vs ${opponent}`;
  if (challenge.phase === 'group') return `世界杯小组赛 vs ${opponent}`;
  if (challenge.phase === 'knockout') return `${challenge.knockoutRounds?.[challenge.knockoutIndex || 0]?.label || '淘汰赛'} vs ${opponent}`;
  return `比赛 vs ${opponent}`;
}

function currentOpponentName(challenge) {
  if (!challenge) return '对手';
  if (challenge.phase === 'friendlies') return challenge.upcomingOpponent?.name || '对手';
  if (challenge.phase === 'group') {
    const fixture = CHALLENGE_GROUP_FIXTURES[challenge.groupMatchIndex || 0];
    return CHALLENGE_GROUP_TEAMS.find(team => team.id === fixture?.opponentId)?.name || '对手';
  }
  if (challenge.phase === 'knockout') {
    return challenge.knockoutRounds?.[challenge.knockoutIndex || 0]?.opponent?.name || '对手';
  }
  return '对手';
}

function renderFormattedDescription(text) {
  const lines = String(text || '').split('\n');
  return lines.map((line, lineIndex) => {
    const parts = [];
    const regex = /~~(.*?)~~/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) {
        parts.push(line.slice(lastIndex, match.index));
      }
      parts.push(
        <del key={`del_${lineIndex}_${match.index}`} className="opacity-80">
          {match[1]}
        </del>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) {
      parts.push(line.slice(lastIndex));
    }

    return (
      <React.Fragment key={`line_${lineIndex}`}>
        {parts}
        {lineIndex < lines.length - 1 ? <br /> : null}
      </React.Fragment>
    );
  });
}

export default function ChallengeEventCard() {
  const { state, dispatch } = useGame();
  const { currentEvent, activeDecisionsTaken, decisionCountThisMonth, challenge, stats } = state;
  const [expandedDecisionId, setExpandedDecisionId] = useState(null);
  const [showMatchAnimation, setShowMatchAnimation] = useState(false);
  const handleMatchAnimationFinish = useCallback((matchPayload) => {
    setShowMatchAnimation(false);
    dispatch({
      type: 'PLAY_CHALLENGE_MATCH',
      payload: {
        visualScore: Array.isArray(matchPayload) ? matchPayload : matchPayload?.score,
        result: matchPayload?.result || null,
        matchInstructions: Array.isArray(matchPayload?.instructions) ? matchPayload.instructions : [],
        penaltyShootout: matchPayload?.penaltyShootout || null
      }
    });
  }, [dispatch]);

  const handleStartMatchAnimation = () => {
    dispatch({ type: 'PREPARE_CHALLENGE_MATCH' });
    setShowMatchAnimation(true);
  };

  if (state.selectedGameMode !== 'challenge') return null;

  if (currentEvent) {
    const options = Array.isArray(currentEvent.options) && currentEvent.options.length > 0
      ? currentEvent.options
      : [{ text: '继续', effects: {} }];
    const isComplaintEvent = typeof currentEvent.id === 'string' && currentEvent.id.startsWith('challenge_complaint_');
    const formattedEffectsPreview = currentEvent.effectsPreview ? formatEffects(currentEvent.effectsPreview) : '';

    return (
      <div className="retro-box p-2 border-l-[6px] border-l-yellow-500">
        <h3 className="text-base font-bold mb-2 font-mono uppercase">{currentEvent.title}</h3>
        <div className="text-sm mb-2 font-mono leading-relaxed whitespace-pre-wrap">{renderFormattedDescription(currentEvent.description)}</div>
        {currentEvent.effectsPreviewText ? (
          <div className="text-[10px] text-gray-600 font-mono mb-2">（{currentEvent.effectsPreviewText}）</div>
        ) : formattedEffectsPreview ? (
          <div className="text-[10px] text-gray-600 font-mono mb-2">（{formattedEffectsPreview}）</div>
        ) : null}
        <div className="flex flex-col gap-2">
          {options.map((opt, index) => (
            <button
              key={`${opt.text}_${index}`}
              onClick={() => dispatch({ type: 'RESOLVE_CHALLENGE_EVENT', payload: opt })}
              className="retro-btn text-left flex justify-between items-center py-2 px-2"
            >
              <span className="text-xs font-bold">{opt.text || '继续'}</span>
              {isComplaintEvent && opt.effects && Object.keys(opt.effects).length > 0 ? (
                <span className="text-[8px] text-gray-500 ml-2 font-mono">（{formatEffects(opt.effects)}）</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const needsFriendlyOpponent = challenge?.phase === 'friendlies' && !challenge.upcomingOpponent;
  const usedFriendlyIds = new Set((challenge?.friendlyHistory || []).map(match => match.opponentId));
  const friendlyOpponentOptions = CHALLENGE_FRIENDLY_OPPONENTS
    .filter(team => !usedFriendlyIds.has(team.id))
    .slice()
    .sort((a, b) => {
      const aName = FRIENDLY_OPPONENT_OFFICIAL_NAMES[a.id] || a.name || '';
      const bName = FRIENDLY_OPPONENT_OFFICIAL_NAMES[b.id] || b.name || '';
      return aName.localeCompare(bName, 'en', { sensitivity: 'base' });
    });
  const availableDecisions = CHALLENGE_MODE_DECISIONS.filter(decision => {
    if (activeDecisionsTaken.includes(decision.type)) return false;
    if (decision.onlyBeforeOfficial && challenge?.phase !== 'friendlies') return false;
    return true;
  });
  const remaining = Math.max(0, 3 - (decisionCountThisMonth || 0));
  const decisionsLocked = remaining === 0;
  const prematchTacticPrompt = CHALLENGE_PREMATCH_TACTIC_GROUPS.find(group => group.id === challenge?.prematchTacticPromptId) || null;
  const prematchTacticSelection = challenge?.prematchTacticSelection || null;
  const prematchTacticsReady = Boolean(prematchTacticPrompt) && Boolean(prematchTacticSelection);
  const selectedPrematchTacticOption = prematchTacticPrompt?.options?.find(option => option.id === prematchTacticSelection) || null;
  const opponentName = currentOpponentName(challenge);
  const paellaDecision = CHALLENGE_MODE_DECISIONS.find(decision => decision.id === 'cook_paella') || null;
  const paellaTakenThisMatch = activeDecisionsTaken.includes('paella');
  const showLegendDecision = challenge?.phase === 'friendlies';
  const groupedDecisions = [
    {
      id: 'management',
      title: '管理',
      decisions: availableDecisions.filter(decision => decision.type === 'management')
    },
    {
      id: 'training',
      title: '训练',
      decisions: availableDecisions.filter(decision => decision.type === 'training')
    },
    {
      id: 'recovery',
      title: '休息',
      decisions: availableDecisions.filter(decision => decision.type === 'recovery')
    },
    {
      id: 'mole',
      title: '在更衣室抓内鬼',
      decisions: availableDecisions.filter(decision => decision.type === 'mole')
    },
    ...(showLegendDecision
      ? [{
          id: 'legend',
          title: '找名宿鼓舞士气',
          decisions: availableDecisions.filter(decision => decision.type === 'legend')
        }]
      : [])
  ].filter(group => group.id === 'friendly_opponent' || group.decisions.length > 0);

  if (showMatchAnimation) {
    return (
      <ChallengeMatchAnimation
        opponentName={opponentName}
        stageTitle={titleForMatch(challenge)}
        matchResult={challenge?.pendingMatchResult || null}
        teamStats={state.stats}
        onFinish={handleMatchAnimationFinish}
      />
    );
  }

  return (
    <div className="retro-box p-2" data-onboard-id="challenge_decision_pool">
      <h3 className="text-base font-bold mb-2 font-mono uppercase border-b-2 border-black pb-1">
        {titleForMatch(challenge)}{!needsFriendlyOpponent ? ` (剩余决策: ${remaining})` : ''}
      </h3>
      {!needsFriendlyOpponent ? (
        <div className="text-xs font-mono text-gray-800 mb-2">
          每场比赛前你需要做 3 个不重复的公共决策，然后再进入比赛。
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-2">
          {needsFriendlyOpponent ? (
            <div className="border-2 border-black p-2 bg-white">
              <button
                onClick={() => setExpandedDecisionId(expandedDecisionId === 'friendly_opponent' ? null : 'friendly_opponent')}
                className="w-full retro-btn-primary text-sm py-2"
              >
                选择本次友谊赛对手
              </button>
              {expandedDecisionId === 'friendly_opponent' ? (
                <div className="mt-2 grid grid-cols-1 gap-2">
                  {friendlyOpponentOptions.map(team => (
                    <button
                      key={team.id}
                      onClick={() => {
                        dispatch({ type: 'CHALLENGE_SELECT_FRIENDLY_OPPONENT', payload: { opponent: team } });
                        setExpandedDecisionId(null);
                      }}
                      className="retro-btn text-left py-2 px-2"
                    >
                      <div className="font-mono">
                        <div className="font-bold text-sm">
                          {team.name}
                          <span className="text-[11px] text-gray-600 font-normal ml-2">
                            {FRIENDLY_OPPONENT_OFFICIAL_NAMES[team.id] || team.name}
                          </span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}
          {groupedDecisions.map(group => (
            <div
              key={group.id}
              className={`border-2 border-black p-2 ${decisionsLocked ? 'bg-gray-200 opacity-60' : 'bg-gray-50'}`}
            >
              <div className="w-full text-left font-mono">
                <div className="font-bold text-sm">{group.title}</div>
                <div className="text-xs mt-1 text-gray-700">
                  {needsFriendlyOpponent
                    ? '请先选择友谊赛对手'
                    : decisionsLocked
                      ? '本场公共决策已完成'
                      : group.decisions.length > 1
                        ? `可选项：${group.decisions.length}`
                        : ''}
                </div>
              </div>
              {expandedDecisionId === group.id ? (
                <div className="mt-2 flex flex-col gap-1">
                  {needsFriendlyOpponent ? (
                    <div className="text-[10px] font-mono text-gray-500 px-1 py-2">
                      先在第一项公共决策中确定本月友谊赛对手，再安排其余事务。
                    </div>
                  ) : (
                    group.decisions.map(decision => (
                      <button
                        key={decision.id}
                        onClick={() => {
                          if (isDecisionAuthorityLocked(decision, stats)) return;
                          if (decision.id === 'cook_paella' && challenge?.paellaDisabled) {
                            dispatch({ type: 'SHOW_CHALLENGE_PAELLA_DISABLED_NOTICE' });
                            setExpandedDecisionId(null);
                            return;
                          }
                          if (decisionsLocked) return;
                          dispatch({ type: 'TAKE_CHALLENGE_DECISION', payload: { decisionId: decision.id } });
                          setExpandedDecisionId(null);
                        }}
                        className={`text-xs w-full py-1 px-2 text-left border-2 font-mono ${
                          decisionsLocked || isDecisionAuthorityLocked(decision, stats) || (decision.id === 'cook_paella' && challenge?.paellaDisabled)
                            ? 'border-gray-400 bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'retro-btn'
                        }`}
                        disabled={decisionsLocked || isDecisionAuthorityLocked(decision, stats)}
                      >
                        <div className="font-bold">
                          {decision.title}
                          {isDecisionAuthorityLocked(decision, stats) ? `（${authorityRequirementText(decision)}）` : ''}
                        </div>
                        {decision.onlyBeforeOfficial ? (
                          <div className="text-[10px] text-gray-500 mt-1">仅限未正式开赛前</div>
                        ) : null}
                        {decision.id === 'cook_paella' && challenge?.paellaDisabled ? (
                          <div className="text-[10px] text-gray-500 mt-1">已不可用</div>
                        ) : null}
                        {formatEffects(decision.effects) ? (
                          <div className="text-[8px] text-gray-500 font-mono mt-1">{formatEffects(decision.effects)}</div>
                        ) : null}
                      </button>
                    ))
                  )}
                </div>
              ) : group.decisions.length > 1 ? (
                <button
                  onClick={() => {
                    if (decisionsLocked) return;
                    setExpandedDecisionId(group.id);
                  }}
                  className={`text-xs w-full py-1 px-2 mt-2 border-2 font-mono ${
                    decisionsLocked
                      ? 'border-gray-400 bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'retro-btn'
                  }`}
                  disabled={decisionsLocked}
                >
                  展开选项
                </button>
              ) : !needsFriendlyOpponent && group.decisions[0] ? (
                <div className="mt-2">
                  {group.decisions[0].onlyBeforeOfficial ? (
                    <div className="text-[10px] text-gray-500 mb-1">仅限未正式开赛前</div>
                  ) : null}
                  {formatEffects(group.decisions[0].effects) ? (
                    <div className="text-[8px] text-gray-500 font-mono mb-2">
                      {formatEffects(group.decisions[0].effects)}
                    </div>
                  ) : null}
                  <button
                    onClick={() => {
                      if (isDecisionAuthorityLocked(group.decisions[0], stats)) return;
                      if (group.decisions[0].id === 'cook_paella' && challenge?.paellaDisabled) {
                        dispatch({ type: 'SHOW_CHALLENGE_PAELLA_DISABLED_NOTICE' });
                        setExpandedDecisionId(null);
                        return;
                      }
                      if (decisionsLocked) return;
                      dispatch({ type: 'TAKE_CHALLENGE_DECISION', payload: { decisionId: group.decisions[0].id } });
                      setExpandedDecisionId(null);
                    }}
                    className={`text-xs w-full py-1 px-2 border-2 font-mono ${
                      decisionsLocked || isDecisionAuthorityLocked(group.decisions[0], stats) || (group.decisions[0].id === 'cook_paella' && challenge?.paellaDisabled)
                        ? 'border-gray-400 bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'retro-btn'
                    }`}
                    disabled={decisionsLocked || isDecisionAuthorityLocked(group.decisions[0], stats)}
                  >
                    执行{isDecisionAuthorityLocked(group.decisions[0], stats) ? `（${authorityRequirementText(group.decisions[0])}）` : ''}
                  </button>
                </div>
              ) : null}
            </div>
          ))}
          {paellaDecision ? (
            <div
              className={`border-2 border-black p-2 ${
                decisionsLocked || paellaTakenThisMatch || challenge?.paellaDisabled
                  ? 'bg-gray-200 opacity-80'
                  : 'bg-gray-50'
              }`}
            >
              <div className="w-full text-left font-mono">
                <div className="font-bold text-sm">为球员烹饪西班牙海鲜饭</div>
                <div className="text-xs mt-1 text-gray-700">
                  {needsFriendlyOpponent
                    ? '请先选择友谊赛对手'
                    : decisionsLocked
                      ? '本场公共决策已完成'
                      : paellaTakenThisMatch
                        ? '本场已执行'
                        : challenge?.paellaDisabled
                          ? '已不可用'
                  : ''}
                </div>
              </div>
              {!needsFriendlyOpponent ? (
                <>
                  <div className="text-[8px] text-gray-500 font-mono my-2">
                    {formatEffects(paellaDecision.effects)}
                  </div>
                  <button
                    onClick={() => {
                      if (challenge?.paellaDisabled) {
                        dispatch({ type: 'SHOW_CHALLENGE_PAELLA_DISABLED_NOTICE' });
                        setExpandedDecisionId(null);
                        return;
                      }
                      if (decisionsLocked || paellaTakenThisMatch) return;
                      dispatch({ type: 'TAKE_CHALLENGE_DECISION', payload: { decisionId: paellaDecision.id } });
                      setExpandedDecisionId(null);
                    }}
                    className={`text-xs w-full py-1 px-2 border-2 font-mono ${
                      decisionsLocked || paellaTakenThisMatch || challenge?.paellaDisabled
                        ? 'border-gray-400 bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'retro-btn'
                    }`}
                    disabled={decisionsLocked || paellaTakenThisMatch}
                  >
                    执行
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
      {decisionsLocked ? (
        <div className="mt-3 flex flex-col gap-2">
          <div className="border-2 border-black p-2 bg-white">
            <div className="font-bold text-sm font-mono mb-2">赛前阵容部署</div>
            {prematchTacticPrompt ? (
              <div className="border border-black p-2">
                <div className="flex flex-wrap gap-2">
                  {prematchTacticPrompt.options.map(option => {
                    const selected = prematchTacticSelection === option.id;
                    return (
                      <button
                        key={option.id}
                        onClick={() => dispatch({ type: 'SET_CHALLENGE_PREMATCH_TACTIC', payload: { optionId: option.id } })}
                        className={`text-xs py-1 px-2 border-2 font-mono ${
                          selected ? 'bg-black text-white border-black' : 'bg-white text-black border-black'
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                {selectedPrematchTacticOption?.description ? (
                  <div className="mt-2 border-2 border-black bg-gray-50 p-2">
                    <div className="text-xs font-bold font-mono mb-1">{selectedPrematchTacticOption.label}</div>
                    <div className="text-xs font-mono text-gray-800 leading-relaxed">
                      {selectedPrematchTacticOption.description}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="text-xs font-mono text-gray-500">正在准备本场的赛前阵容部署…</div>
            )}
          </div>
          <button
            onClick={handleStartMatchAnimation}
            className={`w-full text-sm py-2 ${prematchTacticsReady ? 'retro-btn-primary' : 'retro-btn opacity-60 cursor-not-allowed'}`}
            disabled={!prematchTacticsReady}
          >
            {prematchTacticsReady ? `开始与${opponentName}的比赛` : '请先完成赛前阵容部署'}
          </button>
        </div>
      ) : null}
    </div>
  );
}
