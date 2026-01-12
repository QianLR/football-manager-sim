import React, { useState } from 'react';
import { useGame } from './context/GameContext';
import Dashboard from './components/Dashboard';
import EventCard from './components/EventCard';
import BuffPool from './components/BuffPool';
import teamsData from './data/teams.json';

function OnboardingOverlay({ step, totalSteps, onNext, onSkip, content }) {
  return (
    <div className="fixed inset-0 pointer-events-none">
      <div className="absolute bottom-3 right-3 max-w-sm w-[92vw] pointer-events-auto">
        <div className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-sm font-mono">新手引导</div>
            <div className="text-[11px] text-gray-600 font-mono">{step + 1}/{totalSteps}</div>
          </div>
          <div className="text-xs text-black font-mono leading-relaxed whitespace-pre-wrap">{content}</div>
          <div className="mt-3 flex justify-end gap-2">
            <button
              onClick={onSkip}
              className="retro-btn text-xs py-1 px-2"
            >
              跳过
            </button>
            <button
              onClick={onNext}
              className="retro-btn-primary text-xs py-1 px-2"
            >
              {step === totalSteps - 1 ? '完成' : '下一步'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { state, dispatch } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [coachingPhilosophy, setCoachingPhilosophy] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);

  const readSave = (key) => {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !parsed.state) return null;
      return parsed;
    } catch (e) {
      return null;
    }
  };

  const formatSavedAt = (savedAt) => {
    try {
      return new Date(savedAt).toLocaleString();
    } catch (e) {
      return savedAt;
    }
  };

  const onboardingSteps = [
    '先看顶部状态栏：管理层支持、更衣室稳定、媒体支持、话语权、资金、技战术水平会影响很多事件分支。\n\n注意：小报消息满3会触发头条新闻。',
    '每个月你可以进行3次“本月决策”。\n\n每个类型的决策本月只能做一次，所以要合理搭配。',
    '当你做满3次决策后，点击“结束本月”。\n\n系统会进行月末结算，并触发随机事件。',
    '随机事件会带来分数变化（灰色小字显示）。\n\n如果随机事件里让小报消息上涨，也会影响头条新闻触发。',
    '关注“状态池(BUFFS/DEBUFFS)”：它们会持续影响每月结算与事件。\n\n当你准备好了，就开始你的执教吧。'
  ];

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

      setOnboardingStep(0);
      setShowOnboarding(true);
    }
  };

  if (state.gameState === 'start') {
    const autoSave = readSave('gsm_save_auto_latest');
    const manual1 = readSave('gsm_save_manual_1');
    const manual2 = readSave('gsm_save_manual_2');
    const manual3 = readSave('gsm_save_manual_3');
    const hasAnySave = Boolean(autoSave || manual1 || manual2 || manual3);

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

          <div className="mb-3 border-2 border-black bg-white p-2">
            <div className="font-bold text-xs font-mono mb-1">新手教程</div>
            <ul className="text-[11px] text-gray-800 font-mono leading-snug space-y-1">
              <li>每月可执行3次“本月决策”（每种类型本月只能做一次）。</li>
              <li>做满3次后点击“结束本月”，会触发随机事件并结算。</li>
              <li>小报消息累计到3会触发“Breaking → 头条新闻”。</li>
              <li>状态池(BUFFS/DEBUFFS)会持续影响每月结算。</li>
              <li>目标是满足球队期望，并在赛季结束争取冠军。</li>
            </ul>
          </div>

          {hasAnySave && (
            <div className="mb-3 border-2 border-black bg-white p-2">
              <div className="font-bold text-xs font-mono mb-2">继续游戏</div>

              {autoSave && (
                <div className="border-2 border-black p-2 mb-2">
                  <div className="text-xs font-bold font-mono">自动存档（最新）</div>
                  <div className="text-[11px] text-gray-700 font-mono leading-snug">
                    {autoSave.meta?.teamName} | 教练：{autoSave.meta?.playerName}
                    <br />
                    {autoSave.meta?.year ? `第${autoSave.meta.year}年` : ''} {autoSave.meta?.quarter ? `第${autoSave.meta.quarter}季度` : ''} {autoSave.meta?.month ? `第${autoSave.meta.month}个月` : ''}
                    <br />
                    {autoSave.meta?.savedAt ? formatSavedAt(autoSave.meta.savedAt) : ''}
                  </div>
                  <button
                    onClick={() => dispatch({ type: 'LOAD_GAME', payload: autoSave.state })}
                    className="retro-btn-primary text-xs py-1 px-2 mt-2 w-full"
                  >
                    继续（自动存档）
                  </button>
                </div>
              )}

              {[{ slot: 1, data: manual1 }, { slot: 2, data: manual2 }, { slot: 3, data: manual3 }].map(({ slot, data }) => (
                <div key={slot} className="border-2 border-black p-2 mb-2">
                  <div className="text-xs font-bold font-mono">手动存档 {slot}</div>
                  {data ? (
                    <>
                      <div className="text-[11px] text-gray-700 font-mono leading-snug">
                        {data.meta?.teamName} | 教练：{data.meta?.playerName}
                        <br />
                        {data.meta?.year ? `第${data.meta.year}年` : ''} {data.meta?.quarter ? `第${data.meta.quarter}季度` : ''} {data.meta?.month ? `第${data.meta.month}个月` : ''}
                        <br />
                        {data.meta?.savedAt ? formatSavedAt(data.meta.savedAt) : ''}
                      </div>
                      <button
                        onClick={() => dispatch({ type: 'LOAD_GAME', payload: data.state })}
                        className="retro-btn text-xs py-1 px-2 mt-2 w-full"
                      >
                        读取（手动{slot}）
                      </button>
                    </>
                  ) : (
                    <div className="text-[11px] text-gray-500 font-mono">空</div>
                  )}
                </div>
              ))}
            </div>
          )}

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
    if (showOnboarding) setShowOnboarding(false);

    const isAlonsoName = (name) => {
      const n = (name || '').trim().toLowerCase();
      return n === '阿隆索' || n === '哈维阿隆索' || n === 'xabi alonso' || n === 'alonso';
    };

    const isArtetaName = (name) => {
      const n = (name || '').trim().toLowerCase();
      return n === '阿尔特塔' || n === '米克尔阿尔特塔' || n === 'arteta' || n === 'mikel arteta';
    };

    const shouldShowArtetaRescueButton =
      !state.artetaEasterEggTriggered &&
      isArtetaName(state.playerName) &&
      state.currentTeam?.id === 'arsenal';

    const shouldShowLetterButton =
      !state.easterEggTriggered &&
      isAlonsoName(state.playerName) &&
      state.currentTeam &&
      state.currentTeam.id !== 'man_utd' &&
      state.currentTeam.id !== 'liverpool';

    let reasonText = "";
    if (shouldShowArtetaRescueButton) {
        if (state.stats.dressingRoom <= 0) {
            reasonText = '你的更衣室彻底崩溃，你的下课事宜已经被敲定。';
        } else {
            reasonText = '你的管理层支持降到了冰点，你的下课事宜已经被敲定。';
        }
    } else if (state.stats.dressingRoom <= 0) {
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
          {shouldShowArtetaRescueButton ? (
            <button
              onClick={() => dispatch({ type: 'OPEN_ARTETA_EX_HUSBAND' })}
              className="bg-black text-white px-4 py-2 text-sm font-bold hover:bg-gray-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              你的前夫很关心你
            </button>
          ) : shouldShowLetterButton ? (
            <button
              onClick={() => dispatch({ type: 'OPEN_GERRARD_LETTER' })}
              className="bg-black text-white px-4 py-2 text-sm font-bold hover:bg-gray-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              您有一封来信
            </button>
          ) : (
            <button
              onClick={() => window.location.reload()}
              className="bg-black text-white px-4 py-2 text-sm font-bold hover:bg-gray-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              重新开始
            </button>
          )}
        </div>
      </div>
    );
  }
  
  if (state.gameState === 'victory') {
      if (showOnboarding) setShowOnboarding(false);
      const winningSeasonYear = Math.max(1, (state.year || 1) - 1);
      return (
        <div className="min-h-screen bg-yellow-500 flex items-center justify-center p-3 text-black font-mono">
          <div className="text-center max-w-xl border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-4xl font-bold mb-3 uppercase tracking-tighter">冠军！</h1>
            <p className="text-sm mb-4 whitespace-pre-wrap leading-relaxed">
                恭喜你带领{state.currentTeam.name}夺得冠军！作为豪门主教练，能在第{winningSeasonYear}个赛季就拿到冠军是一件非常不容易的事！本游戏目前还在1.0版本，未来将会开放更多优化，包括如何管理杯赛和联赛的分配，如何与更多人调情（大雾）。如果你在游戏的过程中遇到bug，欢迎向作者邮箱Rowaninc@163.com反馈！感谢你的游玩，我们2.0版本再见👋🏻
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

      {showOnboarding && state.gameState === 'playing' && (
        <OnboardingOverlay
          step={onboardingStep}
          totalSteps={onboardingSteps.length}
          content={onboardingSteps[onboardingStep]}
          onSkip={() => setShowOnboarding(false)}
          onNext={() => {
            if (onboardingStep >= onboardingSteps.length - 1) {
              setShowOnboarding(false);
            } else {
              setOnboardingStep(onboardingStep + 1);
            }
          }}
        />
      )}
    </div>
  );
}

export default App;
