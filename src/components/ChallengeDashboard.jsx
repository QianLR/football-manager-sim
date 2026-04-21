import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContextInstance';
import { CHALLENGE_GROUP_FIXTURES } from '../data/challengeMode';

const StatBar = ({ label, value, max = 100 }) => {
  const percentage = max ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="mb-1">
      <div className="flex justify-between text-[11px] mb-0.5 font-mono">
        <span className="font-bold">{label}</span>
        <span>{value}{max !== null ? `/${max}` : ''}</span>
      </div>
      <div className="retro-progress-container">
        <div className="retro-progress-bar" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

function phaseText(challenge) {
  if (!challenge) return '准备阶段';
  if (challenge.phase === 'friendlies') return `友谊赛 ${challenge.friendlyMatchesPlayed}/4`;
  if (challenge.phase === 'group') return `小组赛 第${(challenge.groupMatchIndex || 0) + 1}轮`;
  if (challenge.phase === 'knockout') {
    const round = challenge.knockoutRounds?.[challenge.knockoutIndex || 0];
    return round?.label || '淘汰赛';
  }
  if (challenge.phase === 'complete') return '挑战完成';
  return '准备阶段';
}

export default function ChallengeDashboard() {
  const { state } = useGame();
  const { currentTeam, playerName, stats, challenge } = state;
  const [showTable, setShowTable] = useState(false);

  const groupStandings = useMemo(() => {
    const table = Array.isArray(challenge?.groupTable) ? challenge.groupTable.slice() : [];
    table.sort((a, b) => {
      if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
      if ((b.goalDiff || 0) !== (a.goalDiff || 0)) return (b.goalDiff || 0) - (a.goalDiff || 0);
      return (b.tactics || 0) - (a.tactics || 0);
    });
    return table;
  }, [challenge?.groupTable]);

  if (state.selectedGameMode !== 'challenge' || !currentTeam) return null;

  const visibleNegativeNews = Array.isArray(challenge?.negativeNews) ? challenge.negativeNews : [];
  const complaintLetters = challenge?.complaintLetters || 0;
  const opponent = challenge?.upcomingOpponent
    || (challenge?.phase === 'group'
      ? (() => {
        const fixture = CHALLENGE_GROUP_FIXTURES[challenge?.groupMatchIndex || 0];
        const team = groupStandings.find(item => item.id === fixture?.opponentId);
        return team ? { ...team } : null;
      })()
      : challenge?.phase === 'knockout'
        ? challenge?.knockoutRounds?.[challenge?.knockoutIndex || 0]?.opponent
        : null);

  return (
    <div className="retro-box p-2">
      {showTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-sm font-mono">小组积分榜</div>
              <button onClick={() => setShowTable(false)} className="retro-btn text-xs py-1 px-2">关闭</button>
            </div>
            {groupStandings.length === 0 ? (
              <div className="text-xs font-mono text-gray-600">正赛开始后显示积分榜。</div>
            ) : (
              <div className="border-2 border-black">
                {groupStandings.map((team, index) => (
                  <div key={team.id} className="flex items-center justify-between px-2 py-1 border-b border-black/20 text-xs font-mono">
                    <span>{index + 1}. {team.name}</span>
                    <span>{team.points}分 / 净胜{team.goalDiff || 0}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-start mb-2 border-b-2 border-black pb-1">
        <div>
          <h2 className="text-base font-bold font-mono uppercase">{currentTeam.name} | 主帅：{playerName}</h2>
          <div className="mt-1 flex gap-2">
            <button onClick={() => setShowTable(true)} className="retro-btn text-[11px] py-1 px-2">
              查看积分榜
            </button>
          </div>
        </div>
        <div className="text-xs font-mono text-right">
          <div>{phaseText(challenge)}</div>
          <div>{challenge?.matchCounter || 0} 场比赛</div>
          {opponent ? <div>下场：{opponent.name}</div> : null}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <StatBar label="更衣室稳定" value={stats.dressingRoom ?? 0} />
        <StatBar label="权威" value={stats.authority ?? 0} />
        <StatBar label="媒体支持" value={stats.mediaSupport ?? 0} />
        <StatBar label="疲惫" value={stats.fatigue ?? 0} />
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono">
        <div className="border-2 border-black p-2 bg-white">
          <div className="font-bold">正赛积分 / 排名</div>
          <div className="mt-1">{stats.points ?? 0} 分 / 第 {challenge?.ranking || 1} 名</div>
        </div>
        <div className="border-2 border-black p-2 bg-white">
          <div className="font-bold">投诉信 / 负面新闻</div>
          <div className="mt-1">
            <span>{complaintLetters > 0 ? `✉️ x${complaintLetters}` : '无投诉信'}</span>
            <br />
            <span>{visibleNegativeNews.length > 0 ? `📰 x${visibleNegativeNews.length}` : '无负面新闻'}</span>
          </div>
        </div>
      </div>

      <div className="mt-2 text-[11px] font-mono text-gray-800 border-2 border-black bg-white p-2">
        {stats.dressingRoom >= 80 ? '军心高涨：球队获得隐藏士气加成。' : stats.dressingRoom < 40 ? '动乱中：每场比赛后权威与更衣室稳定额外下降。' : '更衣室状态尚可。'}
        <br />
        {stats.mediaSupport >= 80 ? '媒体欢呼：每场比赛后固定 +5 更衣室稳定，+5 权威。' : stats.mediaSupport <= 40 ? '媒体环境紧张：输球会导致额外的媒体支持流失。' : '媒体环境中性。'}
      </div>
    </div>
  );
}
