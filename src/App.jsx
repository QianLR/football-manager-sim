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
      <div className="min-h-screen bg-[#e0e0e0] flex items-center justify-center p-4">
        <div className="retro-box p-8 max-w-md w-full">
          <h1 className="text-4xl font-bold text-center mb-6 text-black uppercase font-mono border-b-4 border-black pb-4">足球教练模拟器 v1.0</h1>
          
          <div className="mb-4">
            <label className="block text-black text-lg font-bold mb-2 font-mono">
              教练姓名 (限10字)
            </label>
            <input
              type="text"
              maxLength={10}
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="appearance-none border-2 border-black w-full py-2 px-3 text-black leading-tight focus:outline-none focus:ring-2 focus:ring-black font-mono rounded-none"
              placeholder="请输入您的名字"
            />
          </div>

          <div className="mb-4">
            <label className="block text-black text-lg font-bold mb-2 font-mono">
              执教理念 (限50字)
            </label>
            <textarea
              maxLength={50}
              value={coachingPhilosophy}
              onChange={(e) => setCoachingPhilosophy(e.target.value)}
              className="appearance-none border-2 border-black w-full py-2 px-3 text-black leading-tight focus:outline-none focus:ring-2 focus:ring-black font-mono rounded-none"
              placeholder="请输入您的执教理念"
              rows={3}
            />
          </div>

          <div className="mb-8">
            <label className="block text-black text-lg font-bold mb-2 font-mono">
              选择球队
            </label>
            <div className="space-y-3">
              {teamsData.map(team => (
                <div
                  key={team.id}
                  onClick={() => setSelectedTeam(team.id)}
                  className={`p-3 border-2 border-black cursor-pointer transition-all font-mono ${
                    selectedTeam === team.id ? 'bg-black text-white' : 'bg-white hover:bg-gray-200'
                  }`}
                >
                  <div className="font-bold text-xl">{team.name}</div>
                  <div className={`text-sm ${selectedTeam === team.id ? 'text-gray-300' : 'text-gray-600'}`}>{team.description}</div>
                  <div className={`text-sm font-semibold mt-1 ${selectedTeam === team.id ? 'text-red-300' : 'text-red-600'}`}>难度: {team.difficulty}</div>
                </div>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartGame}
            disabled={!playerName || !coachingPhilosophy || !selectedTeam}
            className={`w-full font-bold py-3 px-4 border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all font-mono text-xl ${
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
      <div className="min-h-screen bg-red-900 flex items-center justify-center p-4 text-white font-mono">
        <div className="text-center max-w-2xl border-4 border-white p-12 bg-red-800 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.5)]">
          <h1 className="text-8xl font-bold mb-8 uppercase tracking-tighter">下课！</h1>
          <p className="text-2xl mb-12 whitespace-pre-wrap leading-relaxed">{reasonText}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-white text-red-900 px-8 py-4 text-2xl font-bold hover:bg-gray-200 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
          >
            重新开始
          </button>
        </div>
      </div>
    );
  }
  
  if (state.gameState === 'victory') {
      return (
        <div className="min-h-screen bg-yellow-500 flex items-center justify-center p-4 text-black font-mono">
          <div className="text-center max-w-2xl border-4 border-black p-12 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-8xl font-bold mb-8 uppercase tracking-tighter">冠军！</h1>
            <p className="text-xl mb-12 whitespace-pre-wrap leading-relaxed">
                恭喜你带领{state.currentTeam.name}夺得冠军！作为豪门主教练，能在第{state.year}个赛季就拿到冠军是一件非常不容易的事！本游戏目前还在1.0版本，未来将会开放更多优化，包括如何管理杯赛和联赛的分配，如何与更多人调情（大雾）。如果你在游戏的过程中遇到bug，欢迎向作者邮箱Rowaninc@163.com反馈！感谢你的游玩，我们2.0版本再见👋🏻
            </p>
            <button
              onClick={() => window.location.reload()}
              className="bg-yellow-500 text-black px-8 py-4 text-2xl font-bold hover:bg-yellow-400 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none transition-all"
            >
              再来一局
            </button>
          </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen bg-[#e0e0e0] p-4 font-mono">
      <div className="max-w-4xl mx-auto space-y-6">
        <Dashboard />
        <BuffPool />
        <EventCard />
      </div>
    </div>
  );
}

export default App;
