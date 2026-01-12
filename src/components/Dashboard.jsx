import React from 'react';
import { useGame } from '../context/GameContext';

const StatBar = ({ label, value, max = 100, color = 'blue', showBar = true }) => {
  const percentage = max ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-0.5 font-mono">
        <span className="font-bold">{label}</span>
        <span>{value}{max !== null ? `/${max}` : ''}</span>
      </div>
      {showBar && (
        <div className="retro-progress-container h-2">
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

  return (
    <div className="retro-box p-3 mb-4">
      <div className="flex justify-between items-center mb-3 border-b-2 border-black pb-2">
        <h2 className="text-xl font-bold font-mono uppercase">{currentTeam.name}</h2>
        <div className="text-sm font-mono">
          Y{year} | Q{quarter} | M{month}
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <StatBar label="管理层支持" value={stats.boardSupport} color="blue" />
        <StatBar label="更衣室稳定" value={stats.dressingRoom} color="blue" />
        <StatBar label="媒体支持" value={stats.mediaSupport} color="blue" />
        <StatBar label="话语权" value={stats.authority} color="blue" />
        <StatBar label="球队资金" value={stats.funds} max={null} showBar={false} />
        <StatBar label="技战术水平" value={stats.tactics} max={10} color="blue" />
      </div>
      
      <div className="mt-3 flex justify-between items-center gap-2 border-t-2 border-black pt-2">
        <div className="flex-1 text-center border-2 border-black p-1 bg-gray-50">
            <span className="font-bold text-lg">积分: {stats.points}</span>
        </div>
        <div className="flex-1 p-1 border-2 border-black bg-gray-50">
            <div className="flex justify-between items-center mb-0.5">
                <span className="font-bold text-xs uppercase">小报消息</span>
                <span className="font-bold text-xs">{tabloidCount}/3</span>
            </div>
            <div className="retro-progress-container h-2">
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
