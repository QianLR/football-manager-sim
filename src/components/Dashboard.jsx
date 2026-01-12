import React from 'react';
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
  const { state } = useGame();
  const { stats, currentTeam, month, quarter, year, tabloidCount } = state;

  if (!currentTeam) return null;

  const expectationRanking = currentTeam.expectations?.ranking;
  const expectationText = expectationRanking === 1 ? '第1名' : `前${expectationRanking}名`;
  const maxFunds = currentTeam.initialStats?.funds ?? 100;

  return (
    <div className="retro-box p-2">
      <div className="flex justify-between items-center mb-2 border-b-2 border-black pb-1">
        <h2 className="text-base font-bold font-mono uppercase">{currentTeam.name}</h2>
        <div className="text-xs font-mono text-right">
          <div>第{year}年 第{quarter}季度 第{month}个月</div>
          <div>期望: {expectationText}</div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
        <StatBar label="管理层支持" value={stats.boardSupport} color="blue" />
        <StatBar label="更衣室稳定" value={stats.dressingRoom} color="blue" />
        <StatBar label="媒体支持" value={stats.mediaSupport} color="blue" />
        <StatBar label="话语权" value={stats.authority} color="blue" />
        <StatBar label="球队资金" value={stats.funds} max={maxFunds} showBar={true} />
        <StatBar label="技战术水平" value={stats.tactics} max={10} color="blue" />
      </div>
      
      <div className="mt-2 flex justify-between items-center gap-2 border-t-2 border-black pt-1">
        <div className="flex-1 text-center border-2 border-black p-1 bg-gray-50">
            <span className="font-bold text-base">积分: {stats.points}</span>
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
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
