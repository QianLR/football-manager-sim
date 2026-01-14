import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from './context/GameContext';
import Dashboard from './components/Dashboard';
import EventCard from './components/EventCard';
import BuffPool from './components/BuffPool';
import teamsData from './data/teams.json';
import AchievementsModal from './components/AchievementsModal';
import AchievementToast from './components/AchievementToast';
import { ACHIEVEMENTS } from './data/achievements';
import { readGlobalAchievements } from './data/achievementsStorage';

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
  const [showMourinhoConfirm, setShowMourinhoConfirm] = useState(false);
  const [teamInfoId, setTeamInfoId] = useState(null);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [achievementsModalTitle, setAchievementsModalTitle] = useState('成就');
  const [achievementsModalUnlockedMap, setAchievementsModalUnlockedMap] = useState(null);

  const globalAchievements = useMemo(() => {
    return readGlobalAchievements();
  }, [state.achievementsUnlocked]);

  const globalUnlockedCount = useMemo(() => Object.keys(globalAchievements || {}).length, [globalAchievements]);
  const globalRecentUnlockedIds = useMemo(() => {
    const entries = Object.entries(globalAchievements || {});
    entries.sort((a, b) => String(b[1]?.unlockedAt || '').localeCompare(String(a[1]?.unlockedAt || '')));
    return entries.slice(0, 3).map(([id]) => id);
  }, [globalAchievements]);

  const hasUnreadAchievements = useMemo(() => {
    const map = state.achievementsUnlocked || {};
    return Object.keys(map).some(id => map[id] && map[id].seen === false);
  }, [state.achievementsUnlocked]);

  const currentToast = state.achievementToastQueue && state.achievementToastQueue.length > 0
    ? state.achievementToastQueue[0]
    : null;

  useEffect(() => {
    if (!currentToast) return;
    const t = setTimeout(() => {
      dispatch({ type: 'DEQUEUE_ACHIEVEMENT_TOAST' });
    }, 1800);
    return () => clearTimeout(t);
  }, [currentToast?.id]);

  const openAchievementsModal = ({ title, unlockedMap, markSeen }) => {
    setAchievementsModalTitle(title || '成就');
    setAchievementsModalUnlockedMap(unlockedMap || {});
    setShowAchievementsModal(true);
    if (markSeen) {
      dispatch({ type: 'MARK_ALL_ACHIEVEMENTS_SEEN' });
    }
  };

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

  const isMourinhoName = (name) => {
    const n = (name || '').trim().toLowerCase();
    return n === '穆里尼奥' || n === 'mourinho' || n === 'jose mourinho';
  };

  const isGerrardName = (name) => {
    const n = (name || '').trim().toLowerCase();
    return n === '杰拉德' || n === 'gerrard' || n === 'steven gerrard';
  };

  const handleStartGame = (confirmedMourinho = false) => {
    if (playerName && coachingPhilosophy && selectedTeam) {
      const isMourinhoArsenal = isMourinhoName(playerName) && selectedTeam === 'arsenal';
      const confirmed = Boolean(confirmedMourinho);
      if (isMourinhoArsenal && !confirmed) {
        setShowMourinhoConfirm(true);
        return;
      }

      dispatch({
        type: 'START_GAME',
        payload: {
          playerName,
          coachingPhilosophy,
          teamId: selectedTeam,
          confirmMourinho: isMourinhoArsenal && confirmed
        }
      });

      const shouldSkipOnboarding = isGerrardName(playerName) && selectedTeam === 'man_utd';
      if (!shouldSkipOnboarding) {
        setOnboardingStep(0);
        setShowOnboarding(true);
      }
    }
  };

  if (state.gameState === 'start') {
    const autoSave = readSave('gsm_save_auto_latest');
    const manual1 = readSave('gsm_save_manual_1');
    const manual2 = readSave('gsm_save_manual_2');
    const manual3 = readSave('gsm_save_manual_3');
    const hasAnySave = Boolean(autoSave || manual1 || manual2 || manual3);

    const difficultyOrder = ['Easy', 'Normal', 'Hard', 'Hell'];
    const visibleTeams = teamsData.filter(team => !team.hidden);
    const groupedTeams = difficultyOrder
      .map(difficulty => ({
        difficulty,
        teams: visibleTeams.filter(t => t.difficulty === difficulty)
      }))
      .filter(group => group.teams.length > 0);
    const otherTeams = visibleTeams.filter(t => !difficultyOrder.includes(t.difficulty));

    const handleSelectTeam = (teamId) => {
      setSelectedTeam(teamId);
      setTeamInfoId(teamId);
    };

    const getSaveUnlocked = (save) => {
      const map = save?.state?.achievementsUnlocked;
      return map && typeof map === 'object' ? map : {};
    };

    return (
      <div className="min-h-screen bg-[#e0e0e0] flex items-center justify-center p-2">
        <AchievementToast toast={currentToast} />
        <div className="retro-box p-3 max-w-sm w-full">
          {teamInfoId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm font-mono">球队介绍</div>
                  <button
                    onClick={() => setTeamInfoId(null)}
                    className="retro-btn text-xs py-1 px-2"
                  >
                    关闭
                  </button>
                </div>
                <div className="text-xs font-mono text-black leading-relaxed whitespace-pre-wrap">
                  {(teamsData.find(t => t.id === teamInfoId)?.name || '')}
                  {'\n'}
                  {(teamsData.find(t => t.id === teamInfoId)?.description || '')}
                </div>
              </div>
            </div>
          )}
          {showMourinhoConfirm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full p-3">
                <div className="font-bold text-sm font-mono mb-2">确认</div>
                <div className="text-xs font-mono text-gray-800 leading-relaxed mb-3">
                  你真的确定要用这个名字进入吗？
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => setShowMourinhoConfirm(false)}
                    className="retro-btn text-xs py-1 px-2"
                  >
                    取消
                  </button>
                  <button
                    onClick={() => {
                      setShowMourinhoConfirm(false);
                      handleStartGame(true);
                    }}
                    className="retro-btn-primary text-xs py-1 px-2"
                  >
                    确定
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="mb-3 border-2 border-black bg-white p-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="font-bold text-xs font-mono">成就</div>
                <div className="text-[11px] text-gray-700 font-mono">已解锁 {globalUnlockedCount}/{ACHIEVEMENTS.length}</div>
              </div>
              <button
                onClick={() => openAchievementsModal({ title: '成就（全局）', unlockedMap: globalAchievements, markSeen: false })}
                className="retro-btn text-xs py-1 px-2"
              >
                查看全部
              </button>
            </div>

            {globalUnlockedCount === 0 ? (
              <div className="text-[11px] text-gray-500 font-mono mt-2">尚未解锁任何成就</div>
            ) : (
              <div className="text-[11px] text-gray-700 font-mono mt-2 leading-snug">
                最近解锁：
                {globalRecentUnlockedIds
                  .map(id => ACHIEVEMENTS.find(a => a.id === id)?.title)
                  .filter(Boolean)
                  .join(' / ')}
              </div>
            )}
          </div>

          <h1 className="text-xl font-bold text-center mb-3 text-black uppercase font-mono border-b-2 border-black pb-1">豪门教练模拟器 v2.0</h1>
          
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
              {groupedTeams.map(group => (
                <div key={group.difficulty} className="border-2 border-black bg-white p-2">
                  <div className="font-bold text-xs font-mono">{group.difficulty}</div>
                  <div className="mt-2 space-y-2">
                    {group.teams.map(team => (
                      <div
                        key={team.id}
                        onClick={() => handleSelectTeam(team.id)}
                        className={`p-2 border-2 border-black cursor-pointer transition-all font-mono ${
                          selectedTeam === team.id ? 'bg-black text-white' : 'bg-white hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <div className="font-bold text-sm">{team.name}</div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setTeamInfoId(team.id);
                            }}
                            className={`inline-flex items-center justify-center w-4 h-4 border-2 border-black rounded-full text-[10px] font-bold bg-white hover:bg-gray-200 ${selectedTeam === team.id ? 'text-black' : 'text-black'}`}
                            aria-label="查看球队介绍"
                          >
                            ?
                          </button>
                        </div>
                        <div className={`text-[11px] font-semibold mt-0.5 ${selectedTeam === team.id ? 'text-red-300' : 'text-red-600'}`}>难度: {team.difficulty}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {otherTeams.length > 0 && (
                <div className="border-2 border-black bg-white p-2">
                  <div className="font-bold text-xs font-mono">其他</div>
                  <div className="mt-2 space-y-2">
                    {otherTeams.map(team => (
                      <div
                        key={team.id}
                        onClick={() => handleSelectTeam(team.id)}
                        className={`p-2 border-2 border-black cursor-pointer transition-all font-mono ${
                          selectedTeam === team.id ? 'bg-black text-white' : 'bg-white hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <div className="font-bold text-sm">{team.name}</div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setTeamInfoId(team.id);
                            }}
                            className={`inline-flex items-center justify-center w-4 h-4 border-2 border-black rounded-full text-[10px] font-bold bg-white hover:bg-gray-200 ${selectedTeam === team.id ? 'text-black' : 'text-black'}`}
                            aria-label="查看球队介绍"
                          >
                            ?
                          </button>
                        </div>
                        <div className={`text-[11px] font-semibold mt-0.5 ${selectedTeam === team.id ? 'text-red-300' : 'text-red-600'}`}>难度: {team.difficulty}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold font-mono">自动存档（最新）</div>
                    <button
                      onClick={() => openAchievementsModal({
                        title: '成就预览（自动存档）',
                        unlockedMap: getSaveUnlocked(autoSave),
                        markSeen: false
                      })}
                      className="retro-btn text-[11px] py-0 px-2"
                    >
                      🏆
                    </button>
                  </div>
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
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold font-mono">手动存档 {slot}</div>
                    {data ? (
                      <button
                        onClick={() => openAchievementsModal({
                          title: `成就预览（手动存档${slot}）`,
                          unlockedMap: getSaveUnlocked(data),
                          markSeen: false
                        })}
                        className="retro-btn text-[11px] py-0 px-2"
                      >
                        🏆
                      </button>
                    ) : null}
                  </div>
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
            onClick={() => handleStartGame(false)}
            disabled={!playerName || !coachingPhilosophy || !selectedTeam}
            className={`w-full font-bold py-2 px-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all font-mono text-base ${
              playerName && coachingPhilosophy && selectedTeam
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            开始执教
          </button>

          <AchievementsModal
            open={showAchievementsModal}
            title={achievementsModalTitle}
            unlockedMap={achievementsModalUnlockedMap}
            onClose={() => setShowAchievementsModal(false)}
          />
        </div>
      </div>
    );
  }

  if (state.gameState === 'gameover') {
    if (showOnboarding) setShowOnboarding(false);

    const seasonMonth = (state.quarter - 1) * 3 + state.month;

    const isAlonsoName = (name) => {
      const n = (name || '').trim().toLowerCase();
      return n === '阿隆索' || n === '哈维阿隆索' || n === 'xabi alonso' || n === 'alonso';
    };

    const isArtetaName = (name) => {
      const n = (name || '').trim().toLowerCase();
      return n === '阿尔特塔' || n === '米克尔阿尔特塔' || n === 'arteta' || n === 'mikel arteta';
    };

    const shouldShowArtetaRescueButton =
      !state.gameoverOverrideText &&
      !state.artetaEasterEggTriggered &&
      isArtetaName(state.playerName) &&
      state.currentTeam?.id === 'arsenal';

    const shouldShowLetterButton =
      !state.gameoverOverrideText &&
      !state.easterEggTriggered &&
      isAlonsoName(state.playerName) &&
      state.currentTeam &&
      state.currentTeam.id !== 'man_utd' &&
      state.currentTeam.id !== 'liverpool';

    let reasonText = "";
    if (state.gameoverOverrideText) {
        reasonText = state.gameoverOverrideText;
    } else if (shouldShowArtetaRescueButton) {
        if (state.stats.dressingRoom <= 0) {
            reasonText = '你的更衣室彻底崩溃，你的下课事宜已经被敲定。';
        } else {
            reasonText = '你的管理层支持降到了冰点，你的下课事宜已经被敲定。';
        }
    } else if (state.stats.dressingRoom <= 0) {
        reasonText = `在第${state.year}个赛季的第${seasonMonth}个月，${state.currentTeam.name}遗憾地宣布：${state.playerName}教练已下课。感谢${state.playerName}的一切付出。\n更多消息，稍后带来。`;
    } else if (state.stats.boardSupport <= 0) {
        reasonText = `在第${state.year}个赛季的第${seasonMonth}个月，${state.currentTeam.name}宣布：${state.playerName}已被解雇。\n更多消息，稍后带来。`;
    } else {
        reasonText = "你的执教生涯到此结束。";
    }

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-3 text-black font-mono">
        <AchievementToast toast={currentToast} />
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
  
  if (state.gameState === 'double_crown') {
      if (showOnboarding) setShowOnboarding(false);
      const teamName = state.currentTeam?.name || '你的俱乐部';
      const text = `恭喜你带领${teamName}夺得双冠王！目前只有0.1%的主教练能做到这一成就！游戏目前已达2.0版本，未来将会开放更多优化，包括如何定制教练最爱的球员，如何管理球员与球员之间的关系，还包括更多其他豪门球队。如果你在游戏的过程中遇到bug，欢迎向作者邮箱Rowaninc@163.com反馈！感谢你的游玩，我们3.0版本再见👋🏻\n\n如果你想继续游戏，请点击：（继续执教）\n如果你想开始一个新游戏，请点击：（重新开始）`;

      return (
        <div className="min-h-screen bg-yellow-500 flex items-center justify-center p-3 text-black font-mono">
          <AchievementToast toast={currentToast} />
          <div className="text-center max-w-xl border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-3xl font-bold mb-3 uppercase tracking-tighter">双冠王！</h1>
            <p className="text-sm mb-4 whitespace-pre-wrap leading-relaxed">{text}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => dispatch({ type: 'SET_GAME_STATE', payload: { gameState: 'playing' } })}
                className="bg-yellow-500 text-black px-4 py-2 text-sm font-bold hover:bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                继续执教
              </button>
              <button
                onClick={() => window.location.reload()}
                className="bg-black text-white px-4 py-2 text-sm font-bold hover:bg-gray-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                重新开始
              </button>
            </div>
          </div>
        </div>
      );
  }

  if (state.gameState === 'relegation_resign') {
    if (showOnboarding) setShowOnboarding(false);
    const teamName = state.currentTeam?.name || '你的俱乐部';
    const ranking = typeof state.relegationFinalRanking === 'number'
      ? state.relegationFinalRanking
      : (typeof state.estimatedRanking === 'number' ? state.estimatedRanking : 18);
    const text = `赛季结束了，一代豪门${teamName}竟以第${ranking}的名次降级，震惊世界足坛！你不能再待下去了。哪怕管理层支持你，球队更衣室也还未爆炸，作为主教练，你还是难辞其咎。于是，在一个月黑风高的夜晚，你留下了辞职报告，拖着你的行李（也许还有你好吃懒做的一切罪证），灰溜溜地离开了${teamName}的基地。`;

    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-3 text-black font-mono">
        <AchievementToast toast={currentToast} />
        <div className="text-center max-w-xl border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-2xl font-bold mb-3 uppercase tracking-tighter">降级 · 自请辞职</h1>
          <p className="text-sm mb-4 whitespace-pre-wrap leading-relaxed">{text}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => dispatch({ type: 'SET_GAME_STATE', payload: { gameState: 'start' } })}
              className="bg-white text-black px-4 py-2 text-sm font-bold hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              返回开始
            </button>
            <button
              onClick={() => window.location.reload()}
              className="bg-black text-white px-4 py-2 text-sm font-bold hover:bg-gray-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
            >
              重新开始
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#e0e0e0] p-2 font-mono overflow-hidden">
      <AchievementToast toast={currentToast} />

      <div className="max-w-6xl w-full h-full mx-auto flex flex-col gap-2 relative">
        {state.gameState === 'playing' && (
          <button
            onClick={() => openAchievementsModal({ title: '成就（本存档）', unlockedMap: state.achievementsUnlocked, markSeen: true })}
            className="absolute top-0 right-0 z-50 retro-btn text-xs py-1 px-2"
          >
            <span className="inline-flex items-center gap-1">
              <span>🏆</span>
              {hasUnreadAchievements && <span className="inline-block w-2 h-2 bg-red-600 border border-black" />}
            </span>
          </button>
        )}
        <div className="space-y-2 overflow-auto">
          <Dashboard />
          <BuffPool />
        </div>
        <div className="flex-1 overflow-auto">
          <EventCard />
        </div>
      </div>

      <AchievementsModal
        open={showAchievementsModal && state.gameState !== 'start'}
        title={achievementsModalTitle}
        unlockedMap={achievementsModalUnlockedMap}
        onClose={() => setShowAchievementsModal(false)}
      />

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
