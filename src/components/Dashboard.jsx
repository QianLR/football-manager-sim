import React, { useState } from 'react';
import { useGame } from '../context/GameContext';

const StatBar = ({ label, value, max = 100, color = 'blue', showBar = true }) => {
  const percentage = max ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  
  return (
    <div className="mb-1">
      <div className="flex justify-between text-[11px] mb-0.5 font-mono">
        <span className="font-bold">{label}</span>
        <span>{value}{max !== null ? `/${max}` : ''}</span>
      </div>
      {showBar && (
        <div className="retro-progress-container">
          <div
            className="retro-progress-bar"
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      )}
    </div>
  );
};

const Dashboard = () => {
  const { state, dispatch } = useGame();
  const { stats, currentTeam, month, quarter, year, tabloidCount, playerName, estimatedRanking, specialMechanicState } = state;

  const [infoKey, setInfoKey] = useState(null);
  const [showSchedule, setShowSchedule] = useState(false);

  if (!currentTeam) return null;

  const isRoofClosed = currentTeam.id === 'real_madrid' && specialMechanicState?.roofClosed;
  const isBayern = currentTeam.id === 'bayern_munich';
  const bayernCommitteeRemoved = Boolean(specialMechanicState?.bayernCommitteeRemoved);
  const dressingRoomRevealed = Boolean(specialMechanicState?.bayernDressingRoomRevealed);
  const displayDressingRoom = isBayern && !bayernCommitteeRemoved && !dressingRoomRevealed ? 100 : stats.dressingRoom;

  const expectationRanking = currentTeam.expectations?.ranking;
  const expectationText = expectationRanking === 1 ? '第1名' : `前${expectationRanking}名`;

  const leagueOpponents = Array.isArray(state.leagueOpponents) ? state.leagueOpponents : [];
  const leagueSchedule = Array.isArray(state.leagueSchedule) ? state.leagueSchedule : [];
  const leagueRoundCursor = typeof state.leagueRoundCursor === 'number' ? state.leagueRoundCursor : 0;
  const leagueMatchResults = (state.leagueMatchResults && typeof state.leagueMatchResults === 'object') ? state.leagueMatchResults : {};

  const idToName = new Map();
  idToName.set(currentTeam.id, currentTeam.name);
  leagueOpponents.forEach(o => {
    if (o && o.id && o.name) idToName.set(o.id, o.name);
  });

  const scheduleRows = leagueSchedule
    .map((round, roundIndex) => {
      const fixtures = round?.fixtures || [];
      const mine = fixtures.find(f => f && (f.homeId === currentTeam.id || f.awayId === currentTeam.id));
      if (!mine) return null;

      const homeName = idToName.get(mine.homeId) || mine.homeId;
      const awayName = idToName.get(mine.awayId) || mine.awayId;
      const played = roundIndex < leagueRoundCursor;
      const result = leagueMatchResults[roundIndex] || null;

      return { roundIndex, homeName, awayName, played, result };
    })
    .filter(Boolean);

  const resultBadge = (r) => {
    if (r === 'W') return { text: '胜', className: 'bg-green-200 text-green-900 border-green-900' };
    if (r === 'L') return { text: '负', className: 'bg-red-200 text-red-900 border-red-900' };
    if (r === 'D') return { text: '平', className: 'bg-gray-700 text-white border-gray-900' };
    return null;
  };

  return (
    <div className="retro-box p-2">
      {infoKey && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-sm font-mono">说明</div>
              <button
                onClick={() => setInfoKey(null)}
                className="retro-btn text-xs py-1 px-2"
              >
                关闭
              </button>
            </div>
            <div className="text-xs font-mono leading-relaxed text-gray-800">
              {infoKey === 'authority' && (
                <div>当话语权为0时，所有“降低话语权”的效果将改为“降低管理层支持”。</div>
              )}
              {infoKey === 'mediaSupport' && (
                <div>当媒体支持为0时，所有“降低媒体支持”的效果将改为“降低更衣室稳定”。</div>
              )}
              {infoKey === 'bayern_dressingRoom' && (
                <div>真实数值隐藏在迷雾中…如果真实数值低于40，球队将陷入动乱：管理层支持与话语权不断下降，小报消息每月+1。</div>
              )}
            </div>
          </div>
        </div>
      )}

      {showSchedule && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-sm font-mono">赛程（仅本队）</div>
              <button
                onClick={() => setShowSchedule(false)}
                className="retro-btn text-xs py-1 px-2"
              >
                关闭
              </button>
            </div>
            <div className="text-xs font-mono leading-relaxed">
              {scheduleRows.length === 0 ? (
                <div className="text-gray-600">暂无赛程数据</div>
              ) : (
                <div className="max-h-[70vh] overflow-y-auto border-2 border-black">
                  {scheduleRows.map(row => {
                    const badge = row.played ? resultBadge(row.result) : null;
                    const rowTextClass = row.played ? 'text-black' : 'text-gray-500';
                    return (
                      <div
                        key={row.roundIndex}
                        className={`flex items-center justify-between px-2 py-1 border-b border-black/20 ${rowTextClass}`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-600">第{row.roundIndex + 1}轮</span>
                          <span className="font-bold">{row.homeName} vs {row.awayName}</span>
                        </div>
                        {badge && (
                          <span className={`text-[10px] font-bold border px-2 py-0.5 ${badge.className}`}>{badge.text}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-2 border-b-2 border-black pb-1">
        <div>
          <h2 className="text-base font-bold font-mono uppercase">{currentTeam.name} | 教练：{playerName}</h2>
          <div className="mt-1">
            <button
              onClick={() => setShowSchedule(true)}
              className="retro-btn text-[11px] py-1 px-2"
            >
              查看赛程
            </button>
          </div>
        </div>
        <div className="text-xs font-mono text-right pr-14">
          <div>第{year}年 第{quarter}季度 第{month}个月</div>
          <div>期望: {expectationText}</div>
          {isRoofClosed && (
            <div className="text-[11px] text-gray-800 font-mono">🏟️顶棚关闭</div>
          )}
        </div>
      </div>

      <div className="mb-2 flex items-center justify-end gap-2">
        <div className="text-[11px] text-gray-700 font-mono">手动存档:</div>
        <button
          onClick={() => dispatch({ type: 'REQUEST_MANUAL_SAVE', payload: { slot: 1 } })}
          className="retro-btn text-[11px] py-1 px-2"
        >
          存1
        </button>
        <button
          onClick={() => dispatch({ type: 'REQUEST_MANUAL_SAVE', payload: { slot: 2 } })}
          className="retro-btn text-[11px] py-1 px-2"
        >
          存2
        </button>
        <button
          onClick={() => dispatch({ type: 'REQUEST_MANUAL_SAVE', payload: { slot: 3 } })}
          className="retro-btn text-[11px] py-1 px-2"
        >
          存3
        </button>
      </div>
      
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <StatBar label="管理层支持" value={stats.boardSupport} color="blue" />
        <StatBar
          label={
            isBayern && !bayernCommitteeRemoved ? (
              <span className="inline-flex items-center gap-1">
                <span className="font-bold">更衣室稳定</span>
                <button
                  onClick={() => setInfoKey('bayern_dressingRoom')}
                  className="retro-btn text-[10px] py-0 px-1"
                >
                  ?
                </button>
              </span>
            ) : (
              '更衣室稳定'
            )
          }
          value={displayDressingRoom}
          color="blue"
        />
        <StatBar
          label={
            <span className="inline-flex items-center gap-1">
              <span className="font-bold">媒体支持</span>
              <button
                onClick={() => setInfoKey('mediaSupport')}
                className="retro-btn text-[10px] py-0 px-1"
              >
                ?
              </button>
            </span>
          }
          value={stats.mediaSupport}
          color="blue"
        />
        <StatBar
          label={
            <span className="inline-flex items-center gap-1">
              <span className="font-bold">话语权</span>
              <button
                onClick={() => setInfoKey('authority')}
                className="retro-btn text-[10px] py-0 px-1"
              >
                ?
              </button>
            </span>
          }
          value={stats.authority}
          color="blue"
        />
        <StatBar label="球队资金" value={stats.funds} max={null} showBar={false} />
        <StatBar label="技战术水平" value={stats.tactics} max={10} color="blue" />
      </div>
      
      <div className="mt-2 flex justify-between items-center gap-2 border-t-2 border-black pt-1">
        <div className="flex-1 text-center border-2 border-black p-1 bg-gray-50">
            <span className="font-bold text-base">积分: {stats.points} | 排名: 第{estimatedRanking || 1}</span>
        </div>
        <div className="flex-1 p-1 border-2 border-black bg-gray-50">
            <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-[11px] uppercase">小报消息</span>
                <span className="font-bold text-[11px]">{tabloidCount}/3</span>
            </div>
            <div className="retro-progress-container">
                <div
                  className="retro-progress-bar bg-red-600"
                  style={{ width: `${(tabloidCount / 3) * 100}%` }}
                ></div>
            </div>

            {year >= 2 && (
              <div className="mt-1">
                <div className="flex justify-between items-center mb-0.5">
                    <span className="font-bold text-[11px] uppercase">伤病风险</span>
                    <span className="font-bold text-[11px]">{stats.injuryRisk || 0}/5</span>
                </div>
                <div className="retro-progress-container">
                    <div
                      className="retro-progress-bar bg-orange-500"
                      style={{ width: `${Math.min(100, Math.max(0, ((stats.injuryRisk || 0) / 5) * 100))}%` }}
                    ></div>
                </div>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
