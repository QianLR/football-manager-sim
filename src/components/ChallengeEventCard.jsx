import React, { useState } from 'react';
import { useGame } from '../context/GameContextInstance';
import {
  CHALLENGE_GROUP_FIXTURES,
  CHALLENGE_GROUP_TEAMS,
  CHALLENGE_MODE_DECISIONS,
  CHALLENGE_FRIENDLY_OPPONENTS
} from '../data/challengeMode';

function formatEffects(effects) {
  if (!effects) return '';
  const labels = {
    dressingRoom: '更衣室稳定',
    authority: '权威',
    mediaSupport: '媒体支持',
    fatigue: '疲惫',
    tactics: '技战术水平'
  };
  return Object.entries(effects)
    .filter(([key]) => labels[key])
    .map(([key, value]) => `${labels[key]} ${value > 0 ? '+' : ''}${value}`)
    .join('，');
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

export default function ChallengeEventCard() {
  const { state, dispatch } = useGame();
  const { currentEvent, activeDecisionsTaken, decisionCountThisMonth, challenge } = state;
  const [expandedDecisionId, setExpandedDecisionId] = useState(null);

  if (state.selectedGameMode !== 'challenge') return null;

  if (currentEvent) {
    const options = Array.isArray(currentEvent.options) && currentEvent.options.length > 0
      ? currentEvent.options
      : [{ text: '继续', effects: {} }];

    return (
      <div className="retro-box p-2 border-l-[6px] border-l-yellow-500">
        <h3 className="text-base font-bold mb-2 font-mono uppercase">{currentEvent.title}</h3>
        <div className="text-sm mb-2 font-mono leading-relaxed whitespace-pre-wrap">{currentEvent.description}</div>
        {currentEvent.effectsPreview ? (
          <div className="text-[10px] text-gray-600 font-mono mb-2">（{formatEffects(currentEvent.effectsPreview)}）</div>
        ) : null}
        <div className="flex flex-col gap-2">
          {options.map((opt, index) => (
            <button
              key={`${opt.text}_${index}`}
              onClick={() => dispatch({ type: 'RESOLVE_CHALLENGE_EVENT', payload: opt })}
              className="retro-btn text-left flex justify-between items-center py-2 px-2"
            >
              <span className="text-xs font-bold">{opt.text || '继续'}</span>
              {opt.effects && Object.keys(opt.effects).length > 0 ? (
                <span className="text-[8px] text-gray-500 ml-2 font-mono">{formatEffects(opt.effects)}</span>
              ) : null}
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (challenge?.phase === 'friendlies' && !challenge.upcomingOpponent) {
    const usedIds = new Set((challenge.friendlyHistory || []).map(match => match.opponentId));
    const options = CHALLENGE_FRIENDLY_OPPONENTS.filter(team => !usedIds.has(team.id));
    const groups = ['强队', '中等队伍', '弱队'].map(tier => ({
      tier,
      teams: options.filter(team => team.tier === tier)
    })).filter(group => group.teams.length > 0);

    return (
      <div className="retro-box p-2">
        <h3 className="text-base font-bold mb-2 font-mono uppercase border-b-2 border-black pb-1">选择友谊赛对手</h3>
        <div className="text-xs font-mono text-gray-800 mb-2">还需要完成 {Math.max(0, 4 - (challenge.friendlyMatchesPlayed || 0))} 场友谊赛。</div>
        <div className="space-y-2">
          {groups.map(group => (
            <div key={group.tier} className="border-2 border-black bg-white p-2">
              <div className="font-bold text-xs font-mono mb-2">{group.tier}</div>
              <div className="grid grid-cols-1 gap-2">
                {group.teams.map(team => (
                  <button
                    key={team.id}
                    onClick={() => dispatch({ type: 'CHALLENGE_SELECT_FRIENDLY_OPPONENT', payload: { opponent: team } })}
                    className="retro-btn text-left py-2 px-2"
                  >
                    <div className="font-bold text-sm">{team.name}</div>
                    <div className="text-[11px] font-mono text-gray-600">强度: {team.tactics}</div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const availableDecisions = CHALLENGE_MODE_DECISIONS.filter(decision => !activeDecisionsTaken.includes(decision.type));
  const remaining = Math.max(0, 3 - (decisionCountThisMonth || 0));
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
    {
      id: 'legend',
      title: '找名宿鼓舞士气',
      decisions: availableDecisions.filter(decision => decision.type === 'legend')
    }
  ].filter(group => group.decisions.length > 0);

  return (
    <div className="retro-box p-2">
      <h3 className="text-base font-bold mb-2 font-mono uppercase border-b-2 border-black pb-1">
        {titleForMatch(challenge)} (剩余决策: {remaining})
      </h3>
      <div className="text-xs font-mono text-gray-800 mb-2">
        每场比赛前你需要做 3 个不重复的公共决策，然后再进入比赛。
      </div>

      {remaining > 0 ? (
        <div className="grid grid-cols-1 gap-2">
          {groupedDecisions.map(group => (
            <div key={group.id} className="border-2 border-black p-2 bg-gray-50">
              <button
                onClick={() => setExpandedDecisionId(expandedDecisionId === group.id ? null : group.id)}
                className="w-full text-left font-mono"
              >
                <div className="font-bold text-sm">{group.title}</div>
                <div className="text-xs text-gray-700 mt-1">
                  {group.decisions.length > 1 ? `可选项：${group.decisions.length}` : '点击展开执行'}
                </div>
              </button>
              {expandedDecisionId === group.id ? (
                <div className="mt-2 flex flex-col gap-1">
                  {group.decisions.map(decision => (
                    <button
                      key={decision.id}
                      onClick={() => {
                        dispatch({ type: 'TAKE_CHALLENGE_DECISION', payload: { decisionId: decision.id } });
                        setExpandedDecisionId(null);
                      }}
                      className="retro-btn text-xs w-full py-1 px-2 text-left"
                    >
                      <div className="font-bold">{decision.title}</div>
                      <div className="text-[10px] text-gray-600 mt-1">{decision.description}</div>
                      {decision.onlyBeforeOfficial ? (
                        <div className="text-[10px] text-red-600 mt-1">仅限未正式开赛前</div>
                      ) : null}
                      <div className="text-[8px] text-gray-500 font-mono mt-1">{formatEffects(decision.effects)}</div>
                    </button>
                  ))}
                </div>
              ) : (
                <button
                  onClick={() => setExpandedDecisionId(group.id)}
                  className="retro-btn text-xs w-full py-1 px-2 mt-2"
                >
                  展开选项
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <button
          onClick={() => dispatch({ type: 'PLAY_CHALLENGE_MATCH' })}
          className="w-full retro-btn-primary text-sm py-2"
        >
          进行比赛
        </button>
      )}
    </div>
  );
}
