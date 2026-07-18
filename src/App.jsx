import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useGame } from './context/GameContextInstance';
import Dashboard from './components/Dashboard';
import EventCard from './components/EventCard';
import BuffPool from './components/BuffPool';
import SaveModal from './components/SaveModal';
import teamsData from './data/teams.json';
import AchievementsModal from './components/AchievementsModal';
import ChallengeAchievementsModal from './components/ChallengeAchievementsModal';
import AchievementToast from './components/AchievementToast';
import YouthAcademyModal from './components/YouthAcademyModal';
import ChallengeDashboard from './components/ChallengeDashboard';
import ChallengeEventCard from './components/ChallengeEventCard';
import { ACHIEVEMENTS } from './data/achievements';
import { readGlobalAchievements } from './data/achievementsStorage';
import { CHALLENGE_MODE_TEAM } from './data/challengeMode';
import { useLanguage } from './i18n/LanguageContext';

const CHALLENGE_ONBOARDING_SEEN_KEY = 'gsm_challenge_onboarding_seen_v1';

function limitWords(value, maximum) {
  const words = [...value.matchAll(/\S+/g)];
  if (words.length <= maximum) return value;
  return value.slice(0, words[maximum].index).trimEnd();
}

function OnboardingOverlay({ stepIndex, steps, onNext, onPrev, onSkip, onFinish, finishText }) {
  const step = Array.isArray(steps) ? steps[stepIndex] : null;
  const totalSteps = Array.isArray(steps) ? steps.length : 0;
  const [spotRects, setSpotRects] = useState([]);
  const [anchorRect, setAnchorRect] = useState(null);
  const panelRef = useRef(null);
  const [panelStyle, setPanelStyle] = useState({ right: 12, bottom: 12, maxHeight: 'calc(100dvh - 24px)' });

  const measureTargets = useCallback(() => {
    if (!step) return;

    const ids = Array.isArray(step.targets) ? step.targets.filter(Boolean) : [];
    if (ids.length === 0) {
      setSpotRects([]);
      setAnchorRect(null);
      return;
    }

    const els = ids
      .map(id => document.querySelector(`[data-onboard-id="${id}"]`))
      .filter(Boolean);
    if (els.length === 0) {
      setSpotRects([]);
      setAnchorRect(null);
      return;
    }

    const viewportWidth = window.visualViewport?.width || window.innerWidth;
    const viewportHeight = window.visualViewport?.height || window.innerHeight;
    const padding = typeof step.padding === 'number' ? step.padding : 6;
    const nextSpotRects = els
      .map(el => el.getBoundingClientRect())
      .map(r => {
        const left = Math.max(0, r.left - padding);
        const top = Math.max(0, r.top - padding);
        const right = Math.min(viewportWidth, r.right + padding);
        const bottom = Math.min(viewportHeight, r.bottom + padding);
        return { left, top, right, bottom, width: right - left, height: bottom - top };
      })
      .filter(r => r.width > 0 && r.height > 0);

    if (nextSpotRects.length === 0) {
      setSpotRects([]);
      setAnchorRect(null);
      return;
    }

    const anchorLeft = Math.min(...nextSpotRects.map(r => r.left));
    const anchorTop = Math.min(...nextSpotRects.map(r => r.top));
    const anchorRight = Math.max(...nextSpotRects.map(r => r.right));
    const anchorBottom = Math.max(...nextSpotRects.map(r => r.bottom));
    setSpotRects(nextSpotRects);
    setAnchorRect({
      left: anchorLeft,
      top: anchorTop,
      right: anchorRight,
      bottom: anchorBottom,
      width: anchorRight - anchorLeft,
      height: anchorBottom - anchorTop
    });
  }, [step]);

  const scrollTargetIntoStableView = useCallback((target) => {
    if (!target) return;

    const findScrollParent = (node) => {
      let current = node?.parentElement;
      while (current && current !== document.body) {
        const style = window.getComputedStyle(current);
        const canScrollY = /(auto|scroll)/.test(style.overflowY) && current.scrollHeight > current.clientHeight;
        if (canScrollY) return current;
        current = current.parentElement;
      }
      return document.scrollingElement || document.documentElement;
    };

    const scroller = findScrollParent(target);
    const targetRect = target.getBoundingClientRect();

    if (scroller === document.scrollingElement || scroller === document.documentElement) {
      try {
        target.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' });
      } catch {
        // ignore
      }
      return;
    }

    const scrollerRect = scroller.getBoundingClientRect();
    const targetCenter = targetRect.top + targetRect.height / 2;
    const scrollerCenter = scrollerRect.top + scrollerRect.height / 2;
    scroller.scrollTop += targetCenter - scrollerCenter;
  }, []);

  useEffect(() => {
    if (!step) return;

    const ids = Array.isArray(step.targets) ? step.targets.filter(Boolean) : [];
    if (ids.length === 0) {
      setSpotRects([]);
      setAnchorRect(null);
      return undefined;
    }

    const els = ids
      .map(id => document.querySelector(`[data-onboard-id="${id}"]`))
      .filter(Boolean);

    if (els.length === 0) {
      setSpotRects([]);
      setAnchorRect(null);
      return undefined;
    }

    scrollTargetIntoStableView(els[0]);

    let frameOne = 0;
    let frameTwo = 0;
    const timers = [];
    const scheduleMeasure = (delay = 0) => {
      const id = setTimeout(() => {
        frameOne = window.requestAnimationFrame(() => {
          frameTwo = window.requestAnimationFrame(measureTargets);
        });
      }, delay);
      timers.push(id);
    };

    scheduleMeasure(0);
    scheduleMeasure(120);

    return () => {
      timers.forEach(id => clearTimeout(id));
      if (frameOne) window.cancelAnimationFrame(frameOne);
      if (frameTwo) window.cancelAnimationFrame(frameTwo);
    };
  }, [measureTargets, scrollTargetIntoStableView, step, stepIndex]);

  useLayoutEffect(() => {
    if (!step) return;

    const el = panelRef.current;
    if (!el) return;

    const pr = el.getBoundingClientRect();
    const vw = window.visualViewport?.width || window.innerWidth;
    const vh = window.visualViewport?.height || window.innerHeight;
    const margin = 12;
    const gap = 10;

    const clamp = (v, min, max) => Math.max(min, Math.min(max, v));
    const panelWidth = Math.min(pr.width, Math.max(0, vw - margin * 2));
    const panelHeight = Math.min(pr.height, Math.max(0, vh - margin * 2));

    if (!anchorRect) {
      const id = setTimeout(() => {
        setPanelStyle({ right: margin, bottom: margin, maxHeight: `calc(${vh}px - ${margin * 2}px)`, overflowY: 'auto' });
      }, 0);
      return () => clearTimeout(id);
    }

    const centerLeft = anchorRect.left + anchorRect.width / 2 - panelWidth / 2;
    const left = clamp(centerLeft, margin, Math.max(margin, vw - panelWidth - margin));

    const belowTop = anchorRect.bottom + gap;
    const aboveTop = anchorRect.top - gap - panelHeight;

    let top = belowTop;
    if (belowTop + panelHeight + margin > vh && aboveTop >= margin) {
      top = aboveTop;
    } else {
      top = clamp(belowTop, margin, Math.max(margin, vh - panelHeight - margin));
    }

    const id = setTimeout(() => {
      setPanelStyle({ left, top, maxHeight: `calc(${vh}px - ${margin * 2}px)`, overflowY: 'auto' });
    }, 0);
    return () => clearTimeout(id);
  }, [anchorRect?.left, anchorRect?.top, anchorRect?.width, anchorRect?.height, stepIndex, step?.id]);

  useEffect(() => {
    if (!step) return;

    let rafId = 0;
    const handle = () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      rafId = window.requestAnimationFrame(measureTargets);
    };

    window.addEventListener('resize', handle);
    window.addEventListener('scroll', handle, true);
    window.visualViewport?.addEventListener('resize', handle);
    window.visualViewport?.addEventListener('scroll', handle);
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', handle);
      window.removeEventListener('scroll', handle, true);
      window.visualViewport?.removeEventListener('resize', handle);
      window.visualViewport?.removeEventListener('scroll', handle);
    };
  }, [measureTargets, step?.id]);

  if (!step) return null;

  const isFirst = stepIndex <= 0;
  const isLast = stepIndex >= totalSteps - 1;

  return (
    <div className="fixed inset-0 z-[999] pointer-events-none">
      {spotRects.length > 0 ? (
        <>
          <svg className="absolute inset-0 w-full h-full" aria-hidden="true">
            <defs>
              <mask id="onboarding-multi-hole-mask" maskUnits="userSpaceOnUse">
                <rect x="0" y="0" width="100%" height="100%" fill="white" />
                {spotRects.map((r, idx) => (
                  <rect
                    key={idx}
                    x={r.left}
                    y={r.top}
                    width={r.width}
                    height={r.height}
                    fill="black"
                  />
                ))}
              </mask>
            </defs>
            <rect x="0" y="0" width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#onboarding-multi-hole-mask)" />
          </svg>
          {spotRects.map((r, idx) => (
            <div
              key={idx}
              className="absolute border-4 border-yellow-300 shadow-[0_0_0_2px_rgba(0,0,0,1)]"
              style={{ left: r.left, top: r.top, width: r.width, height: r.height }}
            />
          ))}
        </>
      ) : (
        <div className="absolute inset-0 bg-black/50" />
      )}

      <div className="fixed max-w-md w-[92vw] pointer-events-auto" style={panelStyle}>
        <div ref={panelRef} className="border-2 border-black bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="font-bold text-sm font-mono">{step.title || '新手引导'}</div>
            <div className="text-[11px] text-gray-600 font-mono">{stepIndex + 1}/{totalSteps}</div>
          </div>
          <div className="text-xs text-black font-mono leading-relaxed whitespace-pre-wrap">{step.text}</div>
          <div className="mt-3 flex justify-between gap-2">
            <div className="flex gap-2">
              <button
                onClick={onSkip}
                className="retro-btn text-xs py-1 px-2"
              >
                跳过
              </button>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onPrev}
                disabled={isFirst}
                className={`retro-btn text-xs py-1 px-2 ${isFirst ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                上一步
              </button>
              <button
                onClick={isLast ? onFinish : onNext}
                className="retro-btn-primary text-xs py-1 px-2"
              >
                {isLast ? (finishText || '开始') : '下一步'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function App() {
  const { state, dispatch } = useGame();
  const { language } = useLanguage();
  const ui = useCallback((zh, en) => language === 'en' ? en : zh, [language]);
  const prevGameStateRef = useRef(state.gameState);
  const [selectedMode, setSelectedMode] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [coachingPhilosophy, setCoachingPhilosophy] = useState('');
  const [selectedTeam, setSelectedTeam] = useState(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [onboardingPending, setOnboardingPending] = useState(false);
  const [showChallengeOnboarding, setShowChallengeOnboarding] = useState(false);
  const [challengeOnboardingStep, setChallengeOnboardingStep] = useState(0);
  const [challengeOnboardingPending, setChallengeOnboardingPending] = useState(false);
  const [showSeason2Onboarding, setShowSeason2Onboarding] = useState(false);
  const [season2OnboardingStep, setSeason2OnboardingStep] = useState(0);
  const [season2OnboardingPending, setSeason2OnboardingPending] = useState(false);
  const [showYouthOnboarding, setShowYouthOnboarding] = useState(false);
  const [youthOnboardingStep, setYouthOnboardingStep] = useState(0);
  const [youthOnboardingPending, setYouthOnboardingPending] = useState(false);
  const [showMourinhoConfirm, setShowMourinhoConfirm] = useState(false);
  const [teamInfoId, setTeamInfoId] = useState(null);
  const [showAchievementsModal, setShowAchievementsModal] = useState(false);
  const [showChallengeAchievementsModal, setShowChallengeAchievementsModal] = useState(false);
  const [achievementsModalTitle, setAchievementsModalTitle] = useState('成就');
  const [achievementsModalUnlockedMap, setAchievementsModalUnlockedMap] = useState(null);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showYouthAcademyModal, setShowYouthAcademyModal] = useState(false);
  const [showAttributeInfoModal, setShowAttributeInfoModal] = useState(false);
  const [globalAchievements, setGlobalAchievements] = useState(() => readGlobalAchievements());

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
  const hasUnreadChallengeAchievements = useMemo(() => {
    const map = state.challengeAchievementsUnlocked || {};
    return Object.keys(map).some(id => map[id] && map[id].seen === false);
  }, [state.challengeAchievementsUnlocked]);

  const currentToast = state.achievementToastQueue && state.achievementToastQueue.length > 0
    ? state.achievementToastQueue[0]
    : null;

  const markChallengeOnboardingSeen = () => {
    try {
      window.localStorage.setItem(CHALLENGE_ONBOARDING_SEEN_KEY, '1');
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (!currentToast) return;
    const t = setTimeout(() => {
      dispatch({ type: 'DEQUEUE_ACHIEVEMENT_TOAST' });
    }, 1800);
    return () => clearTimeout(t);
  }, [currentToast?.id]);

  useEffect(() => {
    setGlobalAchievements(readGlobalAchievements());
  }, [state.achievementsUnlocked]);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const handleStorage = (event) => {
      if (event.key && event.key !== 'gsm_achievements_global_v1') return;
      setGlobalAchievements(readGlobalAchievements());
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    const prevGameState = prevGameStateRef.current;
    if (state.gameState === 'start' && prevGameState !== 'start') {
      setSelectedMode(null);
      setTeamInfoId(null);
      setShowMourinhoConfirm(false);
    }
    prevGameStateRef.current = state.gameState;
  }, [state.gameState]);

  const openAchievementsModal = ({ title, unlockedMap, markSeen }) => {
    setAchievementsModalTitle(title || '成就');
    setAchievementsModalUnlockedMap(unlockedMap || {});
    setShowAchievementsModal(true);
    if (markSeen) {
      dispatch({ type: 'MARK_ALL_ACHIEVEMENTS_SEEN' });
    }
  };

  const openChallengeAchievementsModal = () => {
    setShowChallengeAchievementsModal(true);
    dispatch({ type: 'MARK_ALL_CHALLENGE_ACHIEVEMENTS_SEEN' });
  };

  useEffect(() => {
    if (!onboardingPending) return;
    if (showOnboarding) return;
    if (state.gameState !== 'playing') return;
    if (state.currentEvent) return;
    const id = setTimeout(() => {
      setOnboardingStep(0);
      setShowOnboarding(true);
      setOnboardingPending(false);
    }, 0);
    return () => clearTimeout(id);
  }, [onboardingPending, showOnboarding, state.gameState, state.currentEvent]);

  useEffect(() => {
    if (!challengeOnboardingPending) return;
    if (showChallengeOnboarding) return;
    if (state.gameState !== 'playing') return;
    if (state.selectedGameMode !== 'challenge') return;
    if (state.currentEvent) return;
    const id = setTimeout(() => {
      setChallengeOnboardingStep(0);
      setShowChallengeOnboarding(true);
      setChallengeOnboardingPending(false);
    }, 0);
    return () => clearTimeout(id);
  }, [challengeOnboardingPending, showChallengeOnboarding, state.gameState, state.selectedGameMode, state.currentEvent]);

  useEffect(() => {
    if (!season2OnboardingPending) return;
    if (showSeason2Onboarding) return;
    if (state.gameState !== 'playing') return;
    if (state.currentEvent) return;
    const id = setTimeout(() => {
      setSeason2OnboardingStep(0);
      setShowSeason2Onboarding(true);
      setSeason2OnboardingPending(false);
    }, 0);
    return () => clearTimeout(id);
  }, [season2OnboardingPending, showSeason2Onboarding, state.gameState, state.currentEvent]);

  useEffect(() => {
    if (!youthOnboardingPending) return;
    if (showYouthOnboarding) return;
    if (state.gameState !== 'playing') return;
    if (state.currentEvent) return;
    const id = setTimeout(() => {
      setYouthOnboardingStep(0);
      setShowYouthOnboarding(true);
      setYouthOnboardingPending(false);
    }, 0);
    return () => clearTimeout(id);
  }, [youthOnboardingPending, showYouthOnboarding, state.gameState, state.currentEvent]);

  useEffect(() => {
    if (state.gameState !== 'playing') return;
    if (showSeason2Onboarding || season2OnboardingPending) return;
    if (state.year !== 2 || state.quarter !== 1 || state.month !== 1) return;
    if (state.season2TutorialShown) return;

    dispatch({ type: 'MARK_SEASON2_TUTORIAL_SHOWN' });
    const id = setTimeout(() => {
      setSeason2OnboardingPending(true);
    }, 0);
    return () => clearTimeout(id);
  }, [
    state.gameState,
    state.year,
    state.quarter,
    state.month,
    state.season2TutorialShown,
    showSeason2Onboarding,
    season2OnboardingPending,
    dispatch
  ]);

  useEffect(() => {
    if (state.gameState !== 'playing') return;
    if (showOnboarding || onboardingPending) return;
    if (showSeason2Onboarding || season2OnboardingPending) return;
    if (showYouthOnboarding || youthOnboardingPending) return;
    if (state.currentEvent) return;
    if (!state.youthAcademyUnlocked) return;
    if (state.youthOnboardingShown) return;

    const isBarca = state.currentTeam?.id === 'fc_barcelona';
    const triggerYear = isBarca ? 1 : 3;
    if (state.year !== triggerYear || state.quarter !== 1 || state.month !== 1) return;

    dispatch({ type: 'MARK_YOUTH_ONBOARDING_SHOWN' });
    const id = setTimeout(() => {
      setYouthOnboardingPending(true);
    }, 0);
    return () => clearTimeout(id);
  }, [
    state.gameState,
    state.year,
    state.quarter,
    state.month,
    state.currentEvent,
    state.currentTeam?.id,
    state.youthAcademyUnlocked,
    state.youthOnboardingShown,
    showOnboarding,
    onboardingPending,
    showSeason2Onboarding,
    season2OnboardingPending,
    showYouthOnboarding,
    youthOnboardingPending,
    dispatch
  ]);

  useEffect(() => {
    if (!showYouthOnboarding) return;
    if (youthOnboardingStep < 2) return;
    if (showYouthAcademyModal) return;
    const id = setTimeout(() => {
      setShowYouthAcademyModal(true);
    }, 0);
    return () => clearTimeout(id);
  }, [showYouthOnboarding, youthOnboardingStep, showYouthAcademyModal]);

  const onboardingSteps = [
    {
      id: 'welcome',
      targets: [],
      title: '欢迎',
      text: '欢迎来到《豪门教练模拟器v3.1》！这是一个简短的新手教程，你可以选择跳过，或点击下一步来观看。'
    },
    {
      id: 'schedule',
      targets: ['schedule_button'],
      padding: 8,
      title: '查看赛程',
      text: '在这里，你可以查看本季度联赛的赛程。在游戏进行一段时间后，你的战绩也会被记录在这里。赢得比赛的关键是提高技战术水平。'
    },
    {
      id: 'board_support',
      targets: ['stat_board_support'],
      title: '管理层支持',
      text: '意味着管理层对你的支持力度。为0时，你会下课。'
    },
    {
      id: 'dressing_room',
      targets: ['stat_dressing_room'],
      title: '更衣室稳定',
      text: '意味着更衣室的稳定程度。如果低于一定数值，会引发动乱，持续降低你的其他数据。更衣室稳定为0时，你会下课。'
    },
    {
      id: 'media_support',
      targets: ['stat_media_support'],
      title: '媒体支持',
      text: '意味着媒体对你的支持力度。高于一定值时，你会获得加成；低于一定值时，管理层对你的支持也会减少。请注意：当媒体支持为0时，继续削减该数值会导致你的更衣室稳定被削减。'
    },
    {
      id: 'authority',
      targets: ['stat_authority'],
      title: '话语权',
      text: '意味着你在球队内的权威。高于一定值时，你才可以动用球队资金做某些事。请注意：当话语权为0时，继续削减该数值会导致你的管理层支持被削减。'
    },
    {
      id: 'funds',
      targets: ['stat_funds'],
      title: '球队资金',
      text: '可以在决策中做很多事。每赛季结算、夺冠、打欧冠淘汰赛都会为你带来球队资金；第二个赛季开始后，你会解锁赚资金的方法。'
    },
    {
      id: 'tactics',
      targets: ['stat_tactics'],
      title: '技战术水平',
      text: '这是球队的核心数值，在一定程度上决定了球队的积分和排名。第一个赛季中，“调情”决策可以增加技战术水平；第二个赛季开始后，你会找到更多增加的方法。'
    },
    {
      id: 'points_expectation',
      targets: ['points_ranking', 'expectation'],
      title: '积分/排名与期望',
      text: '积分与排名每月进行一次结算。每个季度，管理层会对你的排名是否达到球队期望评定。每三个季度会结算一次赛季。排名第一，你可以夺得联赛冠军；排名前四，你可以获得下赛季的欧冠席位。'
    },
    {
      id: 'tabloid',
      targets: ['tabloid_box'],
      title: '小报消息',
      text: '请注意，一些决策和随机事件会引起记者的注意。当小报消息达到3个时，将触发一次头条新闻，减少你的媒体支持和管理层支持。'
    },
    {
      id: 'trophies',
      targets: ['trophy_display'],
      title: '奖杯',
      text: '这里会记录你拿到的奖杯数量。'
    },
    {
      id: 'buff_pool',
      targets: ['buff_pool'],
      title: '状态池',
      text: '这里会记录一些特殊的状态，提醒你增益与减益。超过三个状态时，可以收起状态栏。'
    },
    {
      id: 'monthly_decisions',
      targets: ['monthly_decisions'],
      title: '本月决策',
      text: '这里是你每个月可以做的决策。当做完决策后，请拉到最下面，点击“结束本月”。一个季度有三个月，一个赛季需要做三个季度的决策。'
    },
    {
      id: 'finish',
      targets: [],
      title: '开始执教',
      text: '如果你准备好了，就点击开始吧。'
    }
  ];

  const challengeOnboardingSteps = [
    {
      id: 'challenge_welcome',
      targets: [],
      title: '新手教程',
      text: '欢迎来到豪门教练模拟器的挑战模式！这是一个简短的新手教程。如果你是第一次游玩挑战模式，强烈建议观看。'
    },
    {
      id: 'challenge_schedule',
      targets: ['challenge_schedule_button'],
      padding: 8,
      title: '查看赛程',
      text: '在这里，你可以查看友谊赛、小组赛与淘汰赛的赛程。你的战绩也会被记录在这里。赢得比赛的关键是提高技战术水平、保持更衣室稳定和更高的权威。'
    },
    {
      id: 'challenge_dressing_room',
      targets: ['challenge_stat_dressing_room'],
      title: '更衣室稳定',
      text: '意味着更衣室的稳定程度。更高的更衣室稳定有利于球队的发挥。更衣室稳定为0时，你会下课。'
    },
    {
      id: 'challenge_authority',
      targets: ['challenge_stat_authority'],
      title: '权威',
      text: '意味着你在球队内的话语权。更高的权威有利于球队执行你的战术，权威过低时，你将无法执行某些强硬决策。权威为0时，你会下课。'
    },
    {
      id: 'challenge_media_support',
      targets: ['challenge_stat_media_support'],
      title: '媒体支持',
      text: '意味着媒体对你的支持力度。高于一定值时，你会获得加成；低于一定值时，输球会额外降低你的更衣室稳定和权威。请注意：当媒体支持为0时，继续削减该数值会导致你的权威被削减。'
    },
    {
      id: 'challenge_tactics',
      targets: ['challenge_stat_tactics'],
      title: '技战术水平',
      text: '这是球队的核心数值，在一定程度上决定了球队能否胜利。你可以通过决策和某些随机事件增加它。'
    },
    {
      id: 'challenge_fatigue',
      targets: ['challenge_stat_fatigue'],
      title: '球队疲惫',
      text: '每场比赛都会增加疲惫，一些特定的训练或随机事件也会对疲惫有影响。疲惫越高，比赛发挥越容易下滑，严重时还可能出现重大失误。'
    },
    {
      id: 'challenge_points_ranking',
      targets: ['challenge_points_ranking'],
      title: '积分/排名',
      text: '这里会记录你在小组赛中的积分和排名，也会记录友谊赛和淘汰赛的下一场对手。'
    },
    {
      id: 'challenge_complaints',
      targets: ['challenge_complaints'],
      title: '投诉信',
      text: '请注意，比赛中的某些战术可能会为你带来俱乐部主教练的投诉信。投诉信可能会降低你的媒体支持或更衣室稳定度。你可以在这里随时查看投诉信。'
    },
    {
      id: 'challenge_negative_news',
      targets: ['challenge_negative_news'],
      title: '负面新闻',
      text: '一些决策或事件可能会为你带来负面新闻。负面新闻会降低媒体支持的上限，但你可以通过比赛胜利压下它们。'
    },
    {
      id: 'challenge_status_pool',
      targets: ['challenge_status_pool'],
      title: '状态池',
      text: '这里会记录一些特殊的状态，提醒你增益与减益。超过三个状态时，可以收起状态栏。'
    },
    {
      id: 'challenge_decision_pool',
      targets: ['challenge_decision_pool'],
      title: '决策池',
      text: '这里是你每场比赛前可以做的决策。每场比赛前，你需要做三个决策。'
    },
    {
      id: 'challenge_finish',
      targets: [],
      title: '开始挑战',
      text: '如果你准备好了，就点击开始吧。'
    }
  ];

  const otherYouthOnboardingSteps = [
    {
      id: 'youth_intro',
      targets: [],
      title: '青训系统',
      text: '从本赛季开始，你将拥有青训系统。你可以一手培养自己想要的青训球员，也可以将他卖出以换取球队资金。接下来是一个简短的教程，你可以选择跳过，或点击下一步来观看。'
    },
    {
      id: 'youth_open',
      targets: ['youth_button'],
      padding: 8,
      title: '打开青训',
      text: '点击【青训】打开青训系统。'
    },
    {
      id: 'youth_overview',
      targets: ['youth_modal'],
      padding: 8,
      title: '概览',
      text: '在这里，你可以看到你的青训球员。你只能拥有一个青训球员。'
    },
    {
      id: 'youth_name',
      targets: ['youth_name_input'],
      padding: 8,
      title: '名字',
      text: '你需要给你的青训球员取名才可以入队。一旦入队，你不可以更改名字。'
    },
    {
      id: 'youth_tech',
      targets: ['youth_tech'],
      padding: 8,
      title: '技术',
      text: '这里代表着青训球员的技术水平。所有青训的初始技术水平都是5，只有比赛能提升技术水平。'
    },
    {
      id: 'youth_free_points',
      targets: ['youth_free_points'],
      padding: 8,
      title: '自由属性点',
      text: '每个赛季开始时，你会获得一个自由属性点，可以给青训球员加点。赛季中，一些随机事件也可能提供额外的自由属性点。'
    },
    {
      id: 'youth_traits',
      targets: ['youth_traits'],
      padding: 8,
      title: '特质',
      text: '每个青训球员都会自带一种正面特质和一种负面特质。你只有一次刷新某个标签的机会。点击特质，可以查看具体的影响。'
    },
    {
      id: 'youth_attributes',
      targets: ['youth_attributes'],
      padding: 8,
      title: '属性',
      text: '青训球员有三种不同的属性。其中，团结会影响更衣室稳定度；权威代表该球员的领导力；勤恳代表该球员对训练的态度，可以额外提升技战术水平。这些加成到5、7、10点时都会有提升。'
    },
    {
      id: 'youth_promote',
      targets: ['youth_promote_button'],
      padding: 8,
      title: '入队',
      text: '球员一旦入队，不可以撤回，只能卖出、首发与替补三选一。首发每10场可以提升0.5技术水平，替补每30场提升0.5技术水平。'
    },
    {
      id: 'youth_trait_effect_note',
      targets: [],
      title: '注意事项',
      text: '青训球员的特质会在入队后就立刻生效，但需要选择首发才会影响球队的技战术水平。注意，如果青训球员技术水平较低，你的球队实际技战术水平也会被影响，但不会显示。'
    },
    {
      id: 'youth_academy_box',
      targets: ['youth_academy_box'],
      padding: 8,
      title: '青训池',
      text: '你同时只能拥有一个青训球员。'
    },
    {
      id: 'youth_refresh',
      targets: ['youth_refresh_button'],
      padding: 8,
      title: '刷新',
      text: '每季度你可以消耗30资金刷新一次。'
    },
    {
      id: 'youth_finish',
      targets: [],
      title: '开始吧',
      text: '如果你已经准备好了，就开始吧！'
    }
  ];

  const barcaYouthOnboardingSteps = [
    {
      id: 'youth_intro_barca',
      targets: [],
      title: '拉玛西亚',
      text: '从第一个赛季开始，你就拥有宝藏青训营拉玛西亚。你可以一手培养自己想要的青训球员，也可以将他卖出以换取球队资金（在很长一段时间内，这可能是你唯一的进项）。接下来是一个简短的教程，你可以选择跳过，或点击下一步来观看。'
    },
    {
      id: 'youth_open_barca',
      targets: ['youth_button'],
      padding: 8,
      title: '打开拉玛西亚',
      text: '点击【拉玛西亚】打开青训系统。'
    },
    {
      id: 'youth_overview_barca',
      targets: ['youth_modal'],
      padding: 8,
      title: '概览',
      text: '在这里，你可以看到你的青训球员。你可以拥有两个青训球员，但只有一个可以进入队伍。'
    },
    {
      id: 'youth_name_barca',
      targets: ['youth_name_input'],
      padding: 8,
      title: '名字',
      text: '你需要给你的青训球员取名才可以入队。一旦入队，你不可以更改名字。'
    },
    {
      id: 'youth_tech_barca',
      targets: ['youth_tech'],
      padding: 8,
      title: '技术',
      text: '这里代表着青训球员的技术水平。青训球员的初始技术水平在4-8不等。只有比赛能提升技术水平。'
    },
    {
      id: 'youth_free_points_barca',
      targets: ['youth_free_points'],
      padding: 8,
      title: '自由属性点',
      text: '每个赛季开始时，你会获得一个自由属性点，可以给青训球员加点。赛季中，一些随机事件也可能提供额外的自由属性点。'
    },
    {
      id: 'youth_traits_barca',
      targets: ['youth_traits'],
      padding: 8,
      title: '特质',
      text: '每个青训球员都会自带一种正面特质和一种负面特质。你只有一次刷新某个标签的机会。点击特质，可以查看具体的影响。'
    },
    {
      id: 'youth_attributes_barca',
      targets: ['youth_attributes'],
      padding: 8,
      title: '属性',
      text: '青训球员有三种不同的属性。其中，团结会影响更衣室稳定度；权威代表该球员的领导力；勤恳代表该球员对训练的态度，可以额外提升技战术水平。这些加成到5、7、10点时都会有提升。'
    },
    {
      id: 'youth_promote_barca',
      targets: ['youth_promote_button'],
      padding: 8,
      title: '入队',
      text: '球员一旦入队，不可以撤回，只能卖出、首发与替补三选一。首发每10场可以提升0.5技术水平，替补每30场提升0.5技术水平。'
    },
    {
      id: 'youth_trait_effect_note_barca',
      targets: [],
      title: '注意事项',
      text: '青训球员的特质会在入队后就立刻生效，但需要选择首发才会影响球队的技战术水平。注意，如果青训球员技术水平较低，你的球队实际技战术水平也会被影响，但不会显示。'
    },
    {
      id: 'youth_academy_box_barca',
      targets: ['youth_academy_box'],
      padding: 8,
      title: '青训池',
      text: '只有安排池中的青训球员入队，你才可以刷新新的青训球员。'
    },
    {
      id: 'youth_refresh_barca',
      targets: ['youth_refresh_button'],
      padding: 8,
      title: '刷新',
      text: '每季度你可以消耗30球队资金刷新一次。'
    },
    {
      id: 'youth_finish_barca',
      targets: [],
      title: '开始吧',
      text: '如果你已经准备好了，就开始吧！'
    }
  ];

  const youthOnboardingSteps = state.currentTeam?.id === 'fc_barcelona'
    ? barcaYouthOnboardingSteps
    : otherYouthOnboardingSteps;

  const season2OnboardingSteps = [
    {
      id: 'season2_intro',
      targets: [],
      title: '新赛季提示',
      text: '本赛季开始之后，一些东西变得不一样了。这是一个简短的提示，你可以选择跳过，或点击下一步来观看。'
    },
    {
      id: 'season2_injury_risk',
      targets: ['stat_injury_risk'],
      padding: 8,
      title: '伤病风险',
      text: '球队将会出现伤病风险，需要你来控制。伤病风险每个季度固定增加1点，达到5点时会爆发伤病潮，严重影响技战术水平和更衣室稳定。在决策事件中，使用球队资金购买队医可以减少伤病风险。'
    },
    {
      id: 'season2_training',
      targets: ['decision_training'],
      padding: 8,
      title: '训练',
      text: '训练中解锁了新的模块。'
    },
    {
      id: 'season2_flirtation',
      targets: ['decision_flirtation'],
      padding: 8,
      title: '调情',
      text: '你的对手们变得更加多疑，他们不会再轻易暴露自己的战术。调情中的数值有变化。'
    }
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
    if (selectedMode === 'challenge') {
      if (!playerName || !coachingPhilosophy || selectedTeam !== CHALLENGE_MODE_TEAM.id) return;

      dispatch({
        type: 'START_CHALLENGE_GAME',
        payload: {
          playerName,
          coachingPhilosophy
        }
      });
      setShowOnboarding(false);
      setOnboardingPending(false);
      try {
        const seenChallengeOnboarding = window.localStorage.getItem(CHALLENGE_ONBOARDING_SEEN_KEY) === '1';
        if (!seenChallengeOnboarding) {
          setShowChallengeOnboarding(false);
          setChallengeOnboardingPending(true);
        }
      } catch {
        setShowChallengeOnboarding(false);
        setChallengeOnboardingPending(true);
      }
      return;
    }

    if (playerName && coachingPhilosophy && selectedTeam) {
      const isMourinhoArsenal = isMourinhoName(playerName) && selectedTeam === 'arsenal';
      const isMourinhoManCity = isMourinhoName(playerName) && selectedTeam === 'man_city';
      const isMourinhoNeedConfirm = isMourinhoArsenal || isMourinhoManCity;
      const confirmed = Boolean(confirmedMourinho);
      if (isMourinhoNeedConfirm && !confirmed) {
        setShowMourinhoConfirm(true);
        return;
      }

      dispatch({
        type: 'START_GAME',
        payload: {
          playerName,
          coachingPhilosophy,
          teamId: selectedTeam,
          confirmMourinho: isMourinhoNeedConfirm && confirmed
        }
      });

      const shouldSkipOnboarding = isGerrardName(playerName) && selectedTeam === 'man_utd';
      if (!shouldSkipOnboarding) {
        setShowOnboarding(false);
        setOnboardingPending(true);
      }
    }
  };

  if (state.gameState === 'start') {
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

    return (
      <div className="min-h-screen bg-[#e0e0e0] flex items-center justify-center p-2">
        <AchievementToast toast={currentToast} />
        <div className="retro-box p-3 max-w-sm w-full">
          {teamInfoId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
              <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-3">
                <div className="flex items-center justify-between mb-2">
                  <div className="font-bold text-sm font-mono">
                    {teamInfoId === CHALLENGE_MODE_TEAM.id ? '挑战介绍' : '球队介绍'}
                  </div>
                  <button
                    onClick={() => setTeamInfoId(null)}
                    className="retro-btn text-xs py-1 px-2"
                  >
                    关闭
                  </button>
                </div>
                <div className="text-xs font-mono text-black leading-relaxed whitespace-pre-wrap">
                  {teamInfoId === CHALLENGE_MODE_TEAM.id ? (
                    `西班牙男子足球国家队是本届世界杯的夺冠热门，作为教练，你自然要瞄准冠军冲刺。不过，看到你上任的新闻，所有人都为你能否调节好这支队伍中复杂的俱乐部矛盾捏了一把汗…`
                  ) : (
                    <>
                      {(teamsData.find(t => t.id === teamInfoId)?.name || '')}
                      {teamInfoId === 'fc_barcelona' ? (
                        <>
                          {'\n'}
                          <span data-i18n-skip>{ui('（不建议新手游玩）', '(Not Recommended for New Players)')}</span>
                        </>
                      ) : null}
                      {'\n'}
                      {(teamsData.find(t => t.id === teamInfoId)?.description || '')}
                    </>
                  )}
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
                <div className="font-bold text-xs font-mono" data-i18n-skip>{ui('成就', 'Achievements')}</div>
                <div className="text-[11px] text-gray-700 font-mono" data-i18n-skip>
                  {ui('已解锁', 'Unlocked')} {globalUnlockedCount}/{ACHIEVEMENTS.length}
                </div>
              </div>
              <button
                onClick={() => openAchievementsModal({ title: '成就（全局）', unlockedMap: globalAchievements, markSeen: false })}
                className="retro-btn text-xs py-1 px-2"
                data-i18n-skip
              >
                {ui('查看全部', 'View All')}
              </button>
            </div>

            {globalUnlockedCount === 0 ? (
              <div className="text-[11px] text-gray-500 font-mono mt-2" data-i18n-skip>
                {ui('尚未解锁任何成就', 'No Achievements Unlocked Yet')}
              </div>
            ) : (
              <div className="text-[11px] text-gray-700 font-mono mt-2 leading-snug">
                <span data-i18n-skip>{ui('最近解锁：', 'Recently Unlocked: ')}</span>
                {globalRecentUnlockedIds
                  .map(id => ACHIEVEMENTS.find(a => a.id === id)?.title)
                  .filter(Boolean)
                  .join(' / ')}
              </div>
            )}
          </div>

          <h1 className="text-xl font-bold text-center mb-3 text-black uppercase font-mono border-b-2 border-black pb-1" data-i18n-skip>
            {ui('豪门教练模拟器v3.1', 'Elite Club Manager Simulator v3.1')}
          </h1>

          {!selectedMode && (
            <div className="mb-3 space-y-2">
              <button
                onClick={() => setSelectedMode('regular')}
                className="w-full retro-btn-primary text-sm py-3"
                data-i18n-skip
              >
                {ui('常规模式', 'Standard Mode')}
              </button>
              <button
                onClick={() => setSelectedMode('challenge')}
                className="w-full retro-btn text-sm py-3"
                data-i18n-skip
              >
                {ui('挑战模式', 'Challenge Mode')}
              </button>
            </div>
          )}

          {selectedMode === 'regular' && (
            <>
              <div className="mb-2 flex justify-end">
                <button
                  onClick={() => {
                    setSelectedMode(null);
                    setTeamInfoId(null);
                    setShowMourinhoConfirm(false);
                  }}
                  className="retro-btn text-xs py-1 px-2"
                  data-i18n-skip
                >
                  {ui('返回模式选择', 'Back to Mode Selection')}
                </button>
              </div>

              <div className="mb-2">
                <label className="block text-black text-xs font-bold mb-1 font-mono" data-i18n-skip>
                  {ui('教练姓名 (限10词)', 'Manager Name (10 Words Max)')}
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(limitWords(e.target.value, 10))}
                  className="appearance-none border-2 border-black w-full py-1 px-2 text-xs text-black leading-tight focus:outline-none focus:ring-2 focus:ring-black font-mono rounded-none"
                  placeholder={ui('请输入您的名字', 'Please Enter Your Name')}
                  data-i18n-skip
                />
              </div>

              <div className="mb-2">
                <label className="block text-black text-xs font-bold mb-1 font-mono" data-i18n-skip>
                  {ui('执教理念 (限50词)', 'Managerial Philosophy (50 Words Max)')}
                </label>
                <textarea
                  value={coachingPhilosophy}
                  onChange={(e) => setCoachingPhilosophy(limitWords(e.target.value, 50))}
                  className="appearance-none border-2 border-black w-full py-1 px-2 text-xs text-black leading-tight focus:outline-none focus:ring-2 focus:ring-black font-mono rounded-none"
                  placeholder={ui('请输入您的执教理念', 'Enter Your Managerial Philosophy')}
                  data-i18n-skip
                  rows={2}
                />
              </div>

              <div className="mb-3">
                <label className="block text-black text-xs font-bold mb-1 font-mono" data-i18n-skip>
                  {ui('选择挑战', 'Choose a Challenge')}
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
                                className="inline-flex items-center justify-center w-4 h-4 border-2 border-black rounded-full text-[10px] font-bold bg-white hover:bg-gray-200 text-black"
                                aria-label="查看球队介绍"
                              >
                                ?
                              </button>
                            </div>
                            <div className={`text-[11px] font-semibold mt-0.5 ${selectedTeam === team.id ? 'text-red-300' : 'text-red-600'}`} data-i18n-skip>
                              {ui('难度', 'Difficulty')}: {team.difficulty}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {otherTeams.length > 0 && (
                    <div className="border-2 border-black bg-white p-2">
                      <div className="font-bold text-xs font-mono" data-i18n-skip>{ui('其他', 'Other')}</div>
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
                                className="inline-flex items-center justify-center w-4 h-4 border-2 border-black rounded-full text-[10px] font-bold bg-white hover:bg-gray-200 text-black"
                                aria-label="查看球队介绍"
                              >
                                ?
                              </button>
                            </div>
                            <div className={`text-[11px] font-semibold mt-0.5 ${selectedTeam === team.id ? 'text-red-300' : 'text-red-600'}`} data-i18n-skip>
                              {ui('难度', 'Difficulty')}: {team.difficulty}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {selectedMode === 'challenge' && (
            <div className="mb-3 border-2 border-black bg-white p-3">
              <div className="flex justify-end mb-2">
                <button
                  onClick={() => {
                    setSelectedMode(null);
                    setSelectedTeam(null);
                    setTeamInfoId(null);
                  }}
                  className="retro-btn text-xs py-1 px-2"
                  data-i18n-skip
                >
                  {ui('返回模式选择', 'Back to Mode Selection')}
                </button>
              </div>
              <div className="mb-3">
                <label className="block text-black text-xs font-bold mb-1 font-mono" data-i18n-skip>
                  {ui('教练姓名 (限10词)', 'Manager Name (10 Words Max)')}
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(limitWords(e.target.value, 10))}
                  className="appearance-none border-2 border-black w-full py-1 px-2 text-xs text-black leading-tight focus:outline-none focus:ring-2 focus:ring-black font-mono rounded-none"
                  placeholder={ui('请输入您的名字', 'Please Enter Your Name')}
                  data-i18n-skip
                />
              </div>
              <div className="mb-3">
                <label className="block text-black text-xs font-bold mb-1 font-mono" data-i18n-skip>
                  {ui('执教理念 (限50词)', 'Managerial Philosophy (50 Words Max)')}
                </label>
                <textarea
                  value={coachingPhilosophy}
                  onChange={(e) => setCoachingPhilosophy(limitWords(e.target.value, 50))}
                  className="appearance-none border-2 border-black w-full py-1 px-2 text-xs text-black leading-tight focus:outline-none focus:ring-2 focus:ring-black font-mono rounded-none"
                  placeholder={ui('请输入您的执教理念', 'Enter Your Managerial Philosophy')}
                  data-i18n-skip
                  rows={2}
                />
              </div>
              <div className="mb-3">
                <label className="block text-black text-xs font-bold mb-1 font-mono" data-i18n-skip>
                  {ui('选择挑战', 'Choose a Challenge')}
                </label>
                <div className="space-y-2">
                  <div className="border-2 border-black bg-white p-2">
                    <div className="mt-2 space-y-2">
                      <div
                        onClick={() => setSelectedTeam(CHALLENGE_MODE_TEAM.id)}
                        className={`p-2 border-2 border-black cursor-pointer transition-all font-mono ${
                          selectedTeam === CHALLENGE_MODE_TEAM.id ? 'bg-black text-white' : 'bg-white hover:bg-gray-200'
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <div className="font-bold text-sm">🇪🇸西班牙：2026世界杯挑战</div>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setTeamInfoId(CHALLENGE_MODE_TEAM.id);
                            }}
                            className="inline-flex items-center justify-center w-4 h-4 border-2 border-black rounded-full text-[10px] font-bold bg-white hover:bg-gray-200 text-black"
                            aria-label="查看挑战介绍"
                            type="button"
                          >
                            ?
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => setShowSaveModal(true)}
            className="w-full retro-btn text-xs py-2 px-2 mb-3"
          >
            存档入口
          </button>

          {selectedMode === 'regular' && (
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
          )}

          {selectedMode === 'challenge' && (
            <button
              onClick={() => handleStartGame(false)}
              disabled={!playerName || !coachingPhilosophy || selectedTeam !== CHALLENGE_MODE_TEAM.id}
              className={`w-full font-bold py-2 px-3 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all font-mono text-base ${
                playerName && coachingPhilosophy && selectedTeam === CHALLENGE_MODE_TEAM.id
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              开始世界杯挑战
            </button>
          )}

          <AchievementsModal
            open={showAchievementsModal}
            title={achievementsModalTitle}
            unlockedMap={achievementsModalUnlockedMap}
            onClose={() => setShowAchievementsModal(false)}
          />

          <SaveModal
            open={showSaveModal}
            onClose={() => setShowSaveModal(false)}
            canSave={false}
          />
        </div>
      </div>
    );
  }

  if (state.gameState === 'gameover') {
    if (showOnboarding) setShowOnboarding(false);
    if (showSeason2Onboarding) setShowSeason2Onboarding(false);

    if (state.selectedGameMode === 'challenge') {
      const text = state.gameoverOverrideText || `西班牙的世界杯挑战提前结束了。${state.playerName}没能撑到最后。`;
      const title = state.gameoverOverrideTitle || '挑战失败';
      return (
        <div className="min-h-screen bg-white flex items-center justify-center p-3 text-black font-mono">
          <AchievementToast toast={currentToast} />
          <div className="text-center max-w-xl border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <h1 className="text-2xl font-bold mb-3 uppercase tracking-tighter">{title}</h1>
            <p className="text-sm mb-4 whitespace-pre-wrap leading-relaxed">{text}</p>
            <div className="flex gap-2 justify-center">
              <button
                onClick={() => dispatch({ type: 'SET_GAME_STATE', payload: { gameState: 'start' } })}
                className="bg-white text-black px-4 py-2 text-sm font-bold hover:bg-gray-100 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                返回开始
              </button>
              <button
                onClick={() => dispatch({
                  type: 'START_CHALLENGE_GAME',
                  payload: {
                    playerName: state.playerName,
                    coachingPhilosophy: state.coachingPhilosophy,
                    resetChallengeAchievements: true
                  }
                })}
                className="bg-black text-white px-4 py-2 text-sm font-bold hover:bg-gray-800 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
              >
                重新开始
              </button>
            </div>
          </div>
        </div>
      );
    }

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
      if (showSeason2Onboarding) setShowSeason2Onboarding(false);
      const teamName = state.currentTeam?.name || '你的俱乐部';
      const text = `恭喜你带领${teamName}夺得双冠王！目前只有1%的主教练能做到这一成就！游戏目前已达3.0版本，未来将会开放更多成就，并开放特定教练与特定俱乐部的剧情模式。如果你在游戏的过程中遇到bug，欢迎向作者邮箱Rowaninc@163.com反馈！感谢你的游玩，我们下个版本再见👋🏻\n\n如果你想继续游戏，请点击：（继续执教）\n如果你想开始一个新游戏，请点击：（重新开始）`;

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

  if (state.gameState === 'challenge_victory') {
    const teamName = state.currentTeam?.name || '你的球队';
    const coachName = state.playerName || '你';
    const tacticName = state.coachingPhilosophy || '世界杯挑战';
    const text = `恭喜你带领${teamName}赢得世界杯冠军。四场友谊赛、三场小组赛与五场淘汰赛之后，你终于站上了世界之巅！你的名字【${coachName}】和【${tacticName}】的战术将与这些球员们一起刻在历史的纪念碑上。挑战模式目前只是1.0版本，如果你有建议或bug反馈，欢迎联系创作者邮箱Rowaninc@163.com！`;
    const confettiPieces = Array.from({ length: 28 }, (_, index) => index);
    return (
      <div className="relative min-h-screen bg-yellow-500 flex items-center justify-center p-3 text-black font-mono overflow-hidden">
        <style>{`
          @keyframes challenge-confetti-from-left {
            0% { transform: translate(-80px, 40px) rotate(-18deg) scale(0.8); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translate(var(--x), var(--y)) rotate(var(--r)) scale(1); opacity: 0; }
          }
          @keyframes challenge-confetti-from-right {
            0% { transform: translate(80px, 40px) rotate(18deg) scale(0.8); opacity: 0; }
            10% { opacity: 1; }
            100% { transform: translate(calc(var(--x) * -1), var(--y)) rotate(calc(var(--r) * -1)) scale(1); opacity: 0; }
          }
        `}</style>
        <AchievementToast toast={currentToast} />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2">
          {confettiPieces.map(index => (
            <span
              key={`left_${index}`}
              className="absolute block border-2 border-black"
              style={{
                left: `${index % 2 === 0 ? 2 : 7}%`,
                top: `${18 + (index % 10) * 6}%`,
                width: `${8 + (index % 3) * 4}px`,
                height: `${6 + (index % 2) * 8}px`,
                background: ['#ef4444', '#2563eb', '#22c55e', '#ffffff', '#facc15'][index % 5],
                '--x': `${210 + (index % 7) * 42}px`,
                '--y': `${-180 + (index % 11) * 38}px`,
                '--r': `${360 + index * 37}deg`,
                animation: `challenge-confetti-from-left ${2.1 + (index % 5) * 0.16}s ease-out ${index * 0.045}s infinite`
              }}
            />
          ))}
          <div className="absolute left-0 top-1/2 h-16 w-24 -translate-x-10 -translate-y-1/2 rotate-[-18deg] border-4 border-black bg-white shadow-[4px_4px_0_#111]" />
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2">
          {confettiPieces.map(index => (
            <span
              key={`right_${index}`}
              className="absolute block border-2 border-black"
              style={{
                right: `${index % 2 === 0 ? 2 : 7}%`,
                top: `${18 + (index % 10) * 6}%`,
                width: `${8 + (index % 3) * 4}px`,
                height: `${6 + (index % 2) * 8}px`,
                background: ['#ef4444', '#2563eb', '#22c55e', '#ffffff', '#facc15'][(index + 2) % 5],
                '--x': `${210 + (index % 7) * 42}px`,
                '--y': `${-180 + (index % 11) * 38}px`,
                '--r': `${360 + index * 37}deg`,
                animation: `challenge-confetti-from-right ${2.1 + (index % 5) * 0.16}s ease-out ${index * 0.045}s infinite`
              }}
            />
          ))}
          <div className="absolute right-0 top-1/2 h-16 w-24 translate-x-10 -translate-y-1/2 rotate-[18deg] border-4 border-black bg-white shadow-[-4px_4px_0_#111]" />
        </div>
        <div className="relative z-10 text-center max-w-xl border-4 border-black p-4 bg-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <h1 className="text-3xl font-bold mb-3 uppercase tracking-tighter">大力神杯！</h1>
          <p className="text-sm mb-4 whitespace-pre-wrap leading-relaxed">{text}</p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => dispatch({ type: 'SET_GAME_STATE', payload: { gameState: 'start' } })}
              className="bg-yellow-500 text-black px-4 py-2 text-sm font-bold hover:bg-yellow-400 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
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

  if (state.gameState === 'relegation_resign') {
    if (showOnboarding) setShowOnboarding(false);
    if (showSeason2Onboarding) setShowSeason2Onboarding(false);
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

  const playingTopActions = state.gameState === 'playing' ? (
    <>
      <button
        onClick={() => setShowSaveModal(true)}
        className="retro-btn text-[10px] sm:text-xs py-1 px-2"
      >
        存档入口
      </button>
      <button
        onClick={() => state.selectedGameMode === 'challenge'
          ? openChallengeAchievementsModal()
          : openAchievementsModal({ title: '成就（本存档）', unlockedMap: state.achievementsUnlocked, markSeen: true })}
        className="retro-btn text-[10px] sm:text-xs py-1 px-2"
        aria-label="成就"
      >
        <span className="inline-flex items-center gap-1">
          <span>🏆</span>
          {(state.selectedGameMode === 'challenge' ? hasUnreadChallengeAchievements : hasUnreadAchievements) && (
            <span className="inline-block w-2 h-2 bg-red-600 border border-black" />
          )}
        </span>
      </button>
    </>
  ) : null;

  return (
    <div className="h-screen bg-[#e0e0e0] p-2 font-mono overflow-hidden">
      <AchievementToast toast={currentToast} />

      <div className="max-w-6xl w-full h-full mx-auto flex flex-col gap-2 relative">
        <div className="space-y-2 overflow-auto">
          {state.selectedGameMode === 'challenge' ? (
            <ChallengeDashboard
              topActions={playingTopActions}
              onInfoOpenChange={setShowAttributeInfoModal}
            />
          ) : (
            <>
              <Dashboard
                onOpenYouthAcademy={() => setShowYouthAcademyModal(true)}
                topActions={playingTopActions}
                onInfoOpenChange={setShowAttributeInfoModal}
              />
              <BuffPool />
            </>
          )}
        </div>
        <div className="flex-1 overflow-auto">
          {state.selectedGameMode === 'challenge' ? <ChallengeEventCard /> : <EventCard />}
        </div>
      </div>

      <AchievementsModal
        open={showAchievementsModal && state.gameState !== 'start'}
        title={achievementsModalTitle}
        unlockedMap={achievementsModalUnlockedMap}
        onClose={() => setShowAchievementsModal(false)}
      />

      <ChallengeAchievementsModal
        open={showChallengeAchievementsModal && state.gameState !== 'start'}
        unlockedMap={state.challengeAchievementsUnlocked}
        countryName={state.currentTeam?.shortName || state.currentTeam?.name || '西班牙'}
        onClose={() => setShowChallengeAchievementsModal(false)}
      />

      <SaveModal
        open={showSaveModal && state.gameState === 'playing'}
        onClose={() => setShowSaveModal(false)}
        canSave={true}
      />

      <YouthAcademyModal
        open={showYouthAcademyModal && state.gameState === 'playing'}
        onClose={() => setShowYouthAcademyModal(false)}
      />

      {showOnboarding && !showAttributeInfoModal && state.gameState === 'playing' && (
        <OnboardingOverlay
          stepIndex={onboardingStep}
          steps={onboardingSteps}
          onSkip={() => {
            setShowOnboarding(false);
            setOnboardingPending(false);
          }}
          onPrev={() => {
            if (onboardingStep <= 0) return;
            setOnboardingStep(onboardingStep - 1);
          }}
          onNext={() => {
            if (onboardingStep >= onboardingSteps.length - 1) {
              setShowOnboarding(false);
            } else {
              setOnboardingStep(onboardingStep + 1);
            }
          }}
          onFinish={() => {
            setShowOnboarding(false);
            setOnboardingPending(false);
          }}
        />
      )}

      {showChallengeOnboarding && !showAttributeInfoModal && state.gameState === 'playing' && state.selectedGameMode === 'challenge' && (
        <OnboardingOverlay
          stepIndex={challengeOnboardingStep}
          steps={challengeOnboardingSteps}
          finishText="开始"
          onSkip={() => {
            markChallengeOnboardingSeen();
            setShowChallengeOnboarding(false);
            setChallengeOnboardingPending(false);
          }}
          onPrev={() => {
            if (challengeOnboardingStep <= 0) return;
            setChallengeOnboardingStep(challengeOnboardingStep - 1);
          }}
          onNext={() => {
            if (challengeOnboardingStep >= challengeOnboardingSteps.length - 1) {
              markChallengeOnboardingSeen();
              setShowChallengeOnboarding(false);
            } else {
              setChallengeOnboardingStep(challengeOnboardingStep + 1);
            }
          }}
          onFinish={() => {
            markChallengeOnboardingSeen();
            setShowChallengeOnboarding(false);
            setChallengeOnboardingPending(false);
          }}
        />
      )}

      {showYouthOnboarding && !showAttributeInfoModal && state.gameState === 'playing' && (
        <OnboardingOverlay
          stepIndex={youthOnboardingStep}
          steps={youthOnboardingSteps}
          finishText="开始"
          onSkip={() => {
            setShowYouthOnboarding(false);
            setYouthOnboardingPending(false);
          }}
          onPrev={() => {
            if (youthOnboardingStep <= 0) return;
            setYouthOnboardingStep(youthOnboardingStep - 1);
          }}
          onNext={() => {
            if (youthOnboardingStep >= youthOnboardingSteps.length - 1) {
              setShowYouthOnboarding(false);
            } else {
              setYouthOnboardingStep(youthOnboardingStep + 1);
            }
          }}
          onFinish={() => {
            setShowYouthOnboarding(false);
            setYouthOnboardingPending(false);
          }}
        />
      )}

      {showSeason2Onboarding && !showAttributeInfoModal && state.gameState === 'playing' && (
        <OnboardingOverlay
          stepIndex={season2OnboardingStep}
          steps={season2OnboardingSteps}
          finishText="完成"
          onSkip={() => {
            setShowSeason2Onboarding(false);
            setSeason2OnboardingPending(false);
          }}
          onPrev={() => {
            if (season2OnboardingStep <= 0) return;
            setSeason2OnboardingStep(season2OnboardingStep - 1);
          }}
          onNext={() => {
            if (season2OnboardingStep >= season2OnboardingSteps.length - 1) {
              setShowSeason2Onboarding(false);
            } else {
              setSeason2OnboardingStep(season2OnboardingStep + 1);
            }
          }}
          onFinish={() => {
            setShowSeason2Onboarding(false);
            setSeason2OnboardingPending(false);
          }}
        />
      )}
    </div>
  );
}

export default App;
