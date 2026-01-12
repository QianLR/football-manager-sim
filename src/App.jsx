import React, { useState } from 'react';
import { useGame } from './context/GameContext';
import Dashboard from './components/Dashboard';
import EventCard from './components/EventCard';
import BuffPool from './components/BuffPool';
import teamsData from './data/teams.json';

function App() {
  const { state, dispatch } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [coachingPhilosophy, setCoachingPhilosophy] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);

  const handleStartGame = () => {
    if (playerName && coachingPhilosophy && selectedTeam) {
      dispatch({
        type: 'START_GAME',
        payload: {
          playerName,
          coachingPhilosophy,
          teamId: selectedTeam
        }
      });
    }
  };

  if (state.gameState === 'start') {
    return (
      <div className="min-h-screen bg-[#e0e0e0] flex items-center justify-center p-2">
        <div className="retro-box p-3 max-w-sm w-full">
          <h1 className="text-xl font-bold text-center mb-3 text-black uppercase font-mono border-b-2 border-black pb-1">豪门教练模拟器 v1.0</h1>
          
          <div className="mb-2">
            <label className="block text-black text-xs font-bold mb-1 font-mono">
              教练姓名 (限10字)
            </label>
            <input
              type="text"
              maxLength={10}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="appearance-none border-2 border-black w-full py-1 px-2 text-xs text-black leading-tight focus:outline-none focus:ring-2 focus:ring-black font-mono rounded-none"
              placeholder="请输入您的名字"
            />
          </div>

          <div className="mb-2">
            <label className="block text-black text-xs font-bold mb-1 font-mono">
              执教理念 (限50字)
            </label>
            <textarea
              maxLength={50}
              value={coachingPhilosophy}
              onChange={(e) => setCoachingPhilosophy(e.target.value)}
              className="appearance-none border-2 border-black w-full py-1 px-2 text-xs text-black leading-tight focus:outline-none focus:ring-2 focus:ring-black font-mono rounded-none"
              placeholder="请输入您的执教理念"
              rows={2}
            />
          </div>

          <div className="mb-3">
            <label className="block text-black text-xs font-bold mb-1 font-mono">
              选择球队
            </label>
            <div className="space-y-2">
              {teamsData.filter(team => !team.hidden).map(team => (
                <div
                  key={team.id}
                  onClick={() => setSelectedTeam(team.id)}
                  className={`p-2 border-2 border-black cursor-pointer transition-all font-mono ${
                    selectedTeam === team.id ? 'bg-black text-white' : 'bg-white hover:bg-gray-200'
                  }`}
                >
                  <div className="font-bold text-sm">{team.name}</div>
                  <div className={`text-[11px] leading-snug ${selectedTeam === team.id ? 'text-gray-200' : 'text-gray-600'}`}>{team.description}</div>
                  <div className={`text-[11px] font-semibold mt-0.5 ${selectedTeam === team.id ? 'text-red-300' : 'text-red-600'}`}>难度: {team.difficulty}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartGame}
            disabled={!playerName || !coachingPhilosophy || !selectedTeam}
            className={`w-full font-bold py-2 px-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all font-mono text-base ${
              playerName && coachingPhilosophy && selectedTeam
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            开始执教
          </button>
        </div>
      </div>
    );
  }

  if (state.gameState === 'gameover') {
    let reasonText = "";
    if (state.stats.dressingRoom <= 0) {
        reasonText = `在第${state.year}个赛季的第${state.month}个月，${state.currentTeam.name}遗憾地宣布：${state.playerName}教练已下课。感谢${state.playerName}的一切付出。\n更多消息，稍后带来。`;
    } else if (state.stats.boardSupport <= 0) {
        reasonText = `在第${state.year}个赛季的第${state.month}个月，${state.currentTeam.name}宣布：${state.playerName}已被解雇。\n更多消息，稍后带来。`;
    } else {
        reasonText = "你的执教生涯到此结束。";
    }

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-3 text-black font-mono">
        <div className="text-center max-w-xl border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-2xl font-bold mb-3 uppercase tracking-tighter">下课</h1>
          <p className="text-sm mb-4 whitespace-pre-wrap leading-relaxed">{reasonText}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-black text-white px-4 py-2 text-sm font-bold hover:bg-gray-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
          >
            重新开始
          </button>
        </div>
      </div>
    );
  }
  
  if (state.gameState === 'victory') {
      return (
        <div className="min-h-screen bg-yellow-500 flex items-center justify-center p-3 text-black font-mono">
          <div className="text-center max-w-xl border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-4xl font-bold mb-3 uppercase tracking-tighter">冠军！</h1>
            <p className="text-sm mb-4 whitespace-pre-wrap leading-relaxed">
                恭喜你带领{state.currentTeam.name}夺得冠军！作为豪门主教练，能在第{state.year}个赛季就拿到冠军是一件非常不容易的事！本游戏目前还在1.0版本，未来将会开放更多优化，包括如何管理杯赛和联赛的分配，如何与更多人调情（大雾）。如果你在游戏的过程中遇到bug，欢迎向作者邮箱Rowaninc@163.com反馈！感谢你的游玩，我们2.0版本再见👋🏻
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-yellow-500 text-black px-5 py-2 text-lg font-bold hover:bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              再来一局
            </button>
          </div>
        </div>
      );
  }

  return (
    <div className="h-screen bg-[#e0e0e0] p-2 font-mono overflow-hidden">
      <div className="max-w-6xl w-full h-full mx-auto flex flex-col gap-2">
        <div className="space-y-2 overflow-auto">
          <Dashboard />
          <BuffPool />
        </div>
        <div className="flex-1 overflow-auto">
          <EventCard />
        </div>
      </div>
    </div>
  );
}

export default App;
