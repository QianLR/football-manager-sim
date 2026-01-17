import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useGame } from '../context/GameContextInstance';

function clampInt(n, min, max) {
  const v = typeof n === 'number' ? Math.round(n) : 0;
  return Math.max(min, Math.min(max, v));
}

const YOUTH_POSITIVE_TRAITS = [
  { id: 'calm', label: '冷静的' },
  { id: 'passionate', label: '热情的' },
  { id: 'stable', label: '稳定的' },
  { id: 'loyal', label: '忠诚的' },
  { id: 'multilingual', label: '多语言的' },
  { id: 'manage_up', label: '向上管理的' }
];

const YOUTH_NEGATIVE_TRAITS = [
  { id: 'party_star', label: '派对之星' },
  { id: 'ambitious', label: '野心家' },
  { id: 'flirtatious', label: '多情种' },
  { id: 'mixer', label: '串子' },
  { id: 'canteen_legend', label: '食堂传奇' },
  { id: 'mole', label: '内鬼' }
];

const YOUTH_SPECIAL_TRAITS = [
  { id: 'eco_guardian', label: '环保卫士' }
];

const YOUTH_TRAIT_EFFECT_TEXT = {
  calm: '如果你下课，将触发一次保护。如果是数值清零下课：管理层支持/更衣室稳定+20。如果是降级下课：不触发降级，留任。',
  passionate: '每月额外提升2球队资金。',
  stable: '当技战术水平因为随机事件被削减时，有50%的概率抵消这次削减。',
  loyal: '如果你给他队长袖标，他的勤恳会每赛季自动提升2点。',
  multilingual: '每月额外提升2媒体支持。',
  manage_up: '每月额外提升2管理层支持。',
  party_star: '伤病风险每季度额外增加1。',
  ambitious: '被按板凳时不能提升能力。',
  flirtatious: '每次调情额外增加1小报消息。',
  mixer: '每赛季额外触发一个随机事件。',
  canteen_legend: '每季度额外消耗5球队资金。',
  mole: '每月自动触发一次“在更衣室抓内鬼”，不消耗决策点。抓内鬼的时候，有10%概率抓到他并-20更衣室稳定度。抓到他3次之后，不会再自动触发在更衣室抓内鬼事件。',
  eco_guardian: '每个赛季有一个季度会失踪；不会影响欧冠比赛。'
};

const YOUTH_ATTRIBUTE_EFFECT_TEXT = {
  unity: '团结：代表该球员团结更衣室的能力。\n5点触发：每月更衣室稳定度额外提升2。\n7点触发：每月更衣室稳定度额外提升3。\n10点+队长袖标触发：你的更衣室稳定度将永远不会低于40点。',
  authority: '权威：代表该球员的领导力。\n5点触发：可以佩戴队长袖标（队长袖标：使该球员所有增益减益翻倍。）。\n7点触发：每月额外提升2点话语权。\n10点+队长袖标触发：你的任何决策不再减低话语权。',
  diligence: '勤恳：代表该球员对训练的态度。\n5点触发：每个赛季结束时，夏窗削减的技战术水平从2点变为1点。\n7点触发：每个季度额外提升0.5技战术水平。\n10点+队长袖标触发：所有训练项目额外提升0.5技战术水平。'
};

function pickRandomTraitId(list, excludeId) {
  const arr = Array.isArray(list) ? list.filter(Boolean) : [];
  if (arr.length === 0) return null;
  const pool = excludeId ? arr.filter(t => t && t.id !== excludeId) : arr;
  const src = pool.length > 0 ? pool : arr;
  return src[Math.floor(Math.random() * src.length)]?.id || null;
}

function pickRandomTraitIdDifferent(list, excludeId) {
  const arr = Array.isArray(list) ? list.filter(Boolean) : [];
  if (arr.length === 0) return null;
  if (!excludeId) return arr[Math.floor(Math.random() * arr.length)]?.id || null;
  const pool = arr.filter(t => t && t.id !== excludeId);
  if (pool.length === 0) return null;
  return pool[Math.floor(Math.random() * pool.length)]?.id || null;
}

function rollNegativeOrSpecialTrait({ prevNegativeId = null, prevSpecialId = null } = {}) {
  // Guarantee the rerolled result is different:
  // - If previously special, reroll must become a negative trait (special pool may be size 1).
  // - If previously negative, reroll can become a different negative or (2%) become special.
  if (prevSpecialId) {
    return {
      negativeTraitId: pickRandomTraitIdDifferent(YOUTH_NEGATIVE_TRAITS, prevNegativeId) ?? pickRandomTraitId(YOUTH_NEGATIVE_TRAITS, null),
      specialTraitId: null
    };
  }

  const shouldRollSpecial = Math.random() < 0.02;
  if (shouldRollSpecial) {
    const specialTraitId = pickRandomTraitIdDifferent(YOUTH_SPECIAL_TRAITS, prevSpecialId);
    if (specialTraitId) {
      return {
        negativeTraitId: null,
        specialTraitId
      };
    }
  }

  return {
    negativeTraitId: pickRandomTraitIdDifferent(YOUTH_NEGATIVE_TRAITS, prevNegativeId) ?? pickRandomTraitId(YOUTH_NEGATIVE_TRAITS, null),
    specialTraitId: null
  };
}

function getTraitLabel(list, id) {
  if (!id) return '';
  const found = (Array.isArray(list) ? list : []).find(t => t && t.id === id);
  return found?.label || '';
}

function TraitPill({ label, variant, onClick, className }) {
  if (!label) return null;
  const cls = variant === 'positive'
    ? 'bg-sky-100 text-sky-900 border-sky-300'
    : (variant === 'special'
      ? 'bg-green-100 text-green-900 border-green-300'
      : 'bg-gray-100 text-gray-800 border-gray-300');

  const baseClass = `inline-flex items-center border px-2 py-[1px] text-[11px] font-mono ${cls} ${className || ''}`;
  if (typeof onClick === 'function') {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClass} cursor-pointer hover:opacity-80`}
      >
        {label}
      </button>
    );
  }

  return (
    <span className={baseClass}>
      {label}
    </span>
  );
}

function AttributePill({ label, onClick, className }) {
  if (!label) return null;
  const baseClass = `inline-flex items-center border px-1.5 py-[1px] text-[10px] leading-none font-mono bg-amber-100 text-amber-900 border-amber-300 whitespace-nowrap ${className || ''}`;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${baseClass} cursor-pointer hover:opacity-80`}
    >
      {label}
    </button>
  );
}

function AttributeMeter({ label, value, max = 10, rightSlot, onLabelClick }) {
  const v = clampInt(value ?? 0, 0, max);
  const total = clampInt(max ?? 10, 1, 20);
  const filled = clampInt(v, 0, total);
  const segments = Array.from({ length: total }, (_, i) => i);

  return (
    <div className="flex items-center gap-2">
      <div className="w-12 shrink-0 text-xs font-mono text-black">
        {typeof onLabelClick === 'function' ? (
          <AttributePill label={label} onClick={onLabelClick} className="px-1" />
        ) : (
          label
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="relative">
          <div className="border-2 border-black bg-white px-1 py-[3px]">
            <div className="flex items-center gap-[2px]">
              {segments.map(i => (
                <div
                  key={i}
                  className={`h-2 flex-1 border border-black ${i < filled ? 'bg-black' : 'bg-white'}`}
                />
              ))}
            </div>
          </div>
          <div className="relative h-3 mt-0.5 text-[10px] font-mono text-gray-600 select-none">
            <div className="absolute -translate-x-1/2" style={{ left: '50%' }}>5</div>
            <div className="absolute -translate-x-1/2" style={{ left: '70%' }}>7</div>
            <div className="absolute -translate-x-1/2" style={{ left: '100%' }}>10</div>
          </div>
        </div>
      </div>

      <div className="w-10 text-xs font-mono text-right text-black tabular-nums">{v}/{max}</div>
      {rightSlot ? <div className="shrink-0">{rightSlot}</div> : null}
    </div>
  );
}

export default function YouthAcademyModal({ open, onClose }) {
  const { state, dispatch } = useGame();

  const didInitOnOpenRef = useRef(false);

  const [draftAcademyPlayer, setDraftAcademyPlayer] = useState(null);
  const [draftSquadPlayers, setDraftSquadPlayers] = useState([]);
  const [academyNameDraft, setAcademyNameDraft] = useState('');
  const [squadNameDrafts, setSquadNameDrafts] = useState({});
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [pendingNameConfirm, setPendingNameConfirm] = useState(null);
  const [pendingActionConfirm, setPendingActionConfirm] = useState(null);
  const [traitRerollPick, setTraitRerollPick] = useState(null);
  const [showPromoteConfirm, setShowPromoteConfirm] = useState(false);
  const [forceSyncFromState, setForceSyncFromState] = useState(false);
  const [traitDetail, setTraitDetail] = useState(null);
  const [attrDetail, setAttrDetail] = useState(null);

  const isBarca = state.currentTeam?.id === 'fc_barcelona';
  const funds = state.stats?.funds ?? 0;
  const unlocked = Boolean(state.youthAcademyUnlocked);

  const maxSlots = 1;
  const addLimit = 1;

  const squad = useMemo(() => {
    const arr = Array.isArray(state.youthSquadPlayers) ? state.youthSquadPlayers : [];
    return arr.slice(0, maxSlots);
  }, [state.youthSquadPlayers, maxSlots]);

  const displaySquad = useMemo(() => {
    const arr = Array.isArray(draftSquadPlayers) ? draftSquadPlayers : [];
    return arr.slice(0, maxSlots);
  }, [draftSquadPlayers, maxSlots]);

  const academyPlayer = draftAcademyPlayer;

  const canPromote = Boolean(
    academyPlayer &&
    displaySquad.length < addLimit
  );
  const youthSquadCount = Array.isArray(state.youthSquadPlayers)
    ? state.youthSquadPlayers.filter(Boolean).length
    : 0;

  const refreshUsed = Boolean(state.youthRefreshUsedThisQuarter);
  const canRefresh = Boolean(unlocked && !academyPlayer && !refreshUsed && funds >= 30 && (isBarca || youthSquadCount === 0));
  const refreshNote = refreshUsed
    ? '每季度只能刷新一次'
    : (academyPlayer
      ? '已有球员'
      : (!isBarca && youthSquadCount > 0
        ? '已有青训球员'
        : (funds < 30 ? '资金不足（需要30）' : '消耗资金30')));

  useEffect(() => {
    if (!open) {
      didInitOnOpenRef.current = false;
      return;
    }
    if (didInitOnOpenRef.current) return;
    didInitOnOpenRef.current = true;
    const id = setTimeout(() => {
      setDraftAcademyPlayer(state.youthAcademyPlayer ? { ...state.youthAcademyPlayer } : null);
      setDraftSquadPlayers(squad.map(p => ({ ...p })));
      setAcademyNameDraft(String(state.youthAcademyPlayer?.name ?? ''));
      setSquadNameDrafts({});
      setShowCloseConfirm(false);
      setPendingNameConfirm(null);
      setPendingActionConfirm(null);
      setTraitRerollPick(null);
      setShowPromoteConfirm(false);
      setForceSyncFromState(false);
      setTraitDetail(null);
      setAttrDetail(null);
    }, 0);
    return () => clearTimeout(id);
  }, [open, state.youthAcademyPlayer, squad]);

  useEffect(() => {
    if (!open) return;
    if (!forceSyncFromState) return;
    const id = setTimeout(() => {
      setDraftAcademyPlayer(state.youthAcademyPlayer ? { ...state.youthAcademyPlayer } : null);
      setDraftSquadPlayers(squad.map(p => ({ ...p })));
      setAcademyNameDraft(String(state.youthAcademyPlayer?.name ?? ''));
      setSquadNameDrafts({});
      setForceSyncFromState(false);
      setShowCloseConfirm(false);
      setPendingNameConfirm(null);
      setPendingActionConfirm(null);
      setTraitRerollPick(null);
      setShowPromoteConfirm(false);
      setTraitDetail(null);
      setAttrDetail(null);
    }, 0);
    return () => clearTimeout(id);
  }, [open, forceSyncFromState, state.youthAcademyPlayer, squad]);

  const makeDraftSignaturePlayer = (p) => {
    if (!p) return null;
    return {
      id: p.id,
      age: p.age,
      tech: p.tech,
      freePoints: p.freePoints,
      unity: p.unity,
      authority: p.authority,
      diligence: p.diligence,
      role: p.role,
      hasArmband: p.hasArmband,
      positiveTraitId: p.positiveTraitId,
      negativeTraitId: p.negativeTraitId,
      specialTraitId: p.specialTraitId,
      traitRerollUsed: p.traitRerollUsed
    };
  };

  const draftSignature = useMemo(() => {
    return JSON.stringify({
      a: makeDraftSignaturePlayer(draftAcademyPlayer),
      s: (Array.isArray(draftSquadPlayers) ? draftSquadPlayers : []).map(makeDraftSignaturePlayer)
    });
  }, [draftAcademyPlayer, draftSquadPlayers]);

  const stateSignature = useMemo(() => {
    return JSON.stringify({
      a: makeDraftSignaturePlayer(state.youthAcademyPlayer),
      s: (Array.isArray(squad) ? squad : []).map(makeDraftSignaturePlayer)
    });
  }, [state.youthAcademyPlayer, squad]);

  const hasUnsavedChanges = draftSignature !== stateSignature;

  useEffect(() => {
    if (!open) return;
    if (forceSyncFromState) return;
    if (hasUnsavedChanges) return;
    const id = setTimeout(() => {
      setDraftAcademyPlayer(state.youthAcademyPlayer ? { ...state.youthAcademyPlayer } : null);
      setDraftSquadPlayers(squad.map(p => ({ ...p })));
      setAcademyNameDraft(String(state.youthAcademyPlayer?.name ?? ''));
    }, 0);
    return () => clearTimeout(id);
  }, [open, forceSyncFromState, hasUnsavedChanges, stateSignature]);

  const applyDraftToState = () => {
    dispatch({
      type: 'YOUTH_APPLY_DRAFT',
      payload: {
        academyPlayer: draftAcademyPlayer,
        squadPlayers: draftSquadPlayers
      }
    });
  };

  const currentAcademyName = String(state.youthAcademyPlayer?.name ?? '').trim();
  const nextAcademyName = String(academyNameDraft ?? '').trim().slice(0, 10);
  const canConfirmAcademyName = Boolean(academyPlayer && nextAcademyName && nextAcademyName !== currentAcademyName);

  const requestConfirmAcademyName = () => {
    if (!canConfirmAcademyName) return;
    setPendingNameConfirm({ scope: 'academy', name: nextAcademyName });
  };

  const confirmPendingName = () => {
    if (!pendingNameConfirm) return;
    if (pendingNameConfirm.scope === 'academy') {
      dispatch({ type: 'YOUTH_SET_NAME', payload: { scope: 'academy', name: pendingNameConfirm.name } });
      setForceSyncFromState(true);
    }
    if (pendingNameConfirm.scope === 'squad') {
      dispatch({
        type: 'YOUTH_SET_NAME',
        payload: { scope: 'squad', id: pendingNameConfirm.id, name: pendingNameConfirm.name }
      });
      setForceSyncFromState(true);
    }
    setPendingNameConfirm(null);
  };

  const confirmPendingAction = () => {
    if (!pendingActionConfirm) return;

    if (pendingActionConfirm.type === 'refresh') {
      dispatch({ type: 'YOUTH_REFRESH' });
      setForceSyncFromState(true);
      setPendingActionConfirm(null);
      return;
    }

    if (pendingActionConfirm.type === 'sell') {
      dispatch({ type: 'YOUTH_SELL', payload: { scope: pendingActionConfirm.scope, id: pendingActionConfirm.id } });
      if (pendingActionConfirm.scope === 'academy') {
        setDraftAcademyPlayer(null);
      }
      if (pendingActionConfirm.scope === 'squad' && pendingActionConfirm.id) {
        setDraftSquadPlayers(prev => prev.filter(pp => pp.id !== pendingActionConfirm.id));
      }
      setForceSyncFromState(true);
      setPendingActionConfirm(null);
    }
  };

  const applyRerolledTraitsToState = ({ scope, id, which }) => {
    if (which !== 'positive' && which !== 'negative') return;

    const source = scope === 'academy'
      ? state.youthAcademyPlayer
      : (Array.isArray(state.youthSquadPlayers) ? state.youthSquadPlayers.find(p => p && p.id === id) : null);
    if (!source) return;
    if (source.traitRerollUsed) return;

    if (which === 'positive') {
      const nextPositiveTraitId = pickRandomTraitIdDifferent(YOUTH_POSITIVE_TRAITS, source.positiveTraitId)
        ?? pickRandomTraitId(YOUTH_POSITIVE_TRAITS, null);
      dispatch({
        type: 'YOUTH_SET_TRAITS',
        payload: { scope, id, positiveTraitId: nextPositiveTraitId }
      });
      setForceSyncFromState(true);
      return;
    }

    const rolled = rollNegativeOrSpecialTrait({ prevNegativeId: source.negativeTraitId, prevSpecialId: source.specialTraitId });
    dispatch({
      type: 'YOUTH_SET_TRAITS',
      payload: { scope, id, negativeTraitId: rolled.negativeTraitId, specialTraitId: rolled.specialTraitId }
    });
    setForceSyncFromState(true);
  };

  const requestClose = () => {
    if (!hasUnsavedChanges) {
      onClose && onClose();
      return;
    }
    setShowCloseConfirm(true);
  };

  const canPromoteWithName = Boolean(canPromote && currentAcademyName);

  const requestPromote = () => {
    if (!canPromoteWithName) return;
    setShowPromoteConfirm(true);
  };

  const confirmPromote = () => {
    if (!canPromoteWithName) return;
    const playerSnapshot = draftAcademyPlayer
      ? { ...draftAcademyPlayer, name: currentAcademyName }
      : (state.youthAcademyPlayer ? { ...state.youthAcademyPlayer } : null);
    if (!playerSnapshot) return;
    dispatch({ type: 'YOUTH_PROMOTE', payload: { player: playerSnapshot } });
    setForceSyncFromState(true);
    setShowPromoteConfirm(false);
  };

  const setRoleInDraft = (id, role) => {
    if (!id) return;
    if (role !== 'starter' && role !== 'bench') return;
    setDraftSquadPlayers(prev => prev.map(p => (p.id === id ? { ...p, role } : p)));
  };

  const toggleArmbandInDraft = (id) => {
    if (!id) return;
    setDraftSquadPlayers(prev => {
      const arr = Array.isArray(prev) ? prev : [];
      const currentlyOn = arr.some(p => p.id === id && p.hasArmband);
      if (!currentlyOn) {
        const target = arr.find(p => p.id === id);
        const auth = clampInt(target?.authority ?? 0, 0, 10);
        if (auth < 5) return arr;
      }
      return arr.map(p => {
        if (p.id === id) return { ...p, hasArmband: !currentlyOn };
        return { ...p, hasArmband: false };
      });
    });
  };

  const allocatePointInDraft = ({ scope, id, key }) => {
    if (!['unity', 'authority', 'diligence'].includes(key)) return;

    if (scope === 'academy') {
      return;
    }

    const apply = (p) => {
      if (!p) return p;
      const free = clampInt(p.freePoints ?? 0, 0, 9999);
      const val = clampInt(p[key] ?? 0, 0, 10);
      if (free <= 0) return p;
      if (val >= 10) return p;
      return {
        ...p,
        freePoints: free - 1,
        [key]: val + 1
      };
    };

    if (scope === 'squad') {
      setDraftSquadPlayers(prev => prev.map(p => (p.id === id ? apply(p) : p)));
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40" data-onboard-id="youth_modal">
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-5xl w-full p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-bold text-sm font-mono">{isBarca ? '拉玛西亚' : '青训'}</div>
            <div className="text-[11px] text-gray-600 font-mono">名额：{displaySquad.length}/{maxSlots}</div>
          </div>
          <button onClick={requestClose} className="retro-btn text-xs py-1 px-2">关闭</button>
        </div>

        {!unlocked ? (
          <div className="text-[11px] text-gray-600 font-mono border-2 border-black p-2">
            青训系统尚未解锁。
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="border-2 border-black p-2" data-onboard-id="youth_academy_box">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-bold font-mono">青训池球员</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      if (!canRefresh) return;
                      setPendingActionConfirm({ type: 'refresh' });
                    }}
                    disabled={!canRefresh}
                    className={`retro-btn-primary text-xs py-1 px-2 ${canRefresh ? '' : 'opacity-50 cursor-not-allowed'}`}
                    data-onboard-id="youth_refresh_button"
                    title={
                      canRefresh
                        ? ''
                        : (refreshUsed
                          ? '每季度只能刷新一次'
                          : (academyPlayer
                            ? '已有球员不可刷新'
                            : (youthSquadCount > 0
                              ? '已有青训球员不可刷新'
                              : (funds < 30 ? '资金不足（需要30）' : '不可刷新'))))
                    }
                  >
                    刷新
                  </button>
                  <div className="text-[11px] font-mono text-gray-600 whitespace-nowrap">{refreshNote}</div>
                </div>
              </div>

              {academyPlayer ? (
                <div className="space-y-2 relative">
                  {traitRerollPick?.scope === 'academy' ? (
                    <div className="absolute inset-0 bg-black/40 z-10" />
                  ) : null}
                  <div className={traitRerollPick?.scope === 'academy' ? 'opacity-40 pointer-events-none' : ''}>
                    <div className="text-[11px] font-mono text-gray-600 mb-1">命名（≤10）</div>
                    <div className="flex items-center gap-2">
                      <input
                        value={academyNameDraft}
                        onChange={(e) => {
                          const name = String(e.target.value ?? '').slice(0, 10);
                          setAcademyNameDraft(name);
                        }}
                        className="w-full border-2 border-black px-2 py-1 text-xs font-mono"
                        placeholder="未命名"
                        maxLength={10}
                        data-onboard-id="youth_name_input"
                      />
                      <button
                        onClick={requestConfirmAcademyName}
                        disabled={!canConfirmAcademyName}
                        className={`retro-btn-primary text-xs py-1 px-2 whitespace-nowrap ${canConfirmAcademyName ? '' : 'opacity-50 cursor-not-allowed'}`}
                        title={canConfirmAcademyName ? '' : (nextAcademyName ? '无变化' : '请先输入名字')}
                      >
                        确认
                      </button>
                    </div>
                  </div>

                  <div className={`text-[11px] font-mono text-gray-700 ${traitRerollPick?.scope === 'academy' ? 'opacity-40 pointer-events-none' : ''}`}>
                    <span>年龄：{academyPlayer?.age ?? 0}</span>
                    <span> | </span>
                    <span data-onboard-id="youth_tech">技术：{Number(academyPlayer?.tech ?? 0).toFixed(1)}</span>
                    <br />
                    <span data-onboard-id="youth_free_points">自由点：{academyPlayer?.freePoints ?? 0}</span>
                  </div>

                  {traitRerollPick?.scope === 'academy' ? (
                    <div className="text-[11px] font-mono text-gray-200 whitespace-nowrap mb-1 relative z-20">请选择要刷新的特质</div>
                  ) : null}

                  <div className={`flex items-start justify-between gap-3 ${traitRerollPick?.scope === 'academy' ? 'relative z-20' : ''}`} data-onboard-id="youth_traits">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <TraitPill
                          variant="positive"
                          label={getTraitLabel(YOUTH_POSITIVE_TRAITS, academyPlayer?.positiveTraitId)}
                          className={traitRerollPick?.scope === 'academy' ? 'ring-2 ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}
                          onClick={() => {
                            const id = academyPlayer?.positiveTraitId;
                            if (!id) return;
                            if (traitRerollPick?.scope === 'academy') {
                              applyRerolledTraitsToState({ scope: 'academy', which: 'positive' });
                              setTraitRerollPick(null);
                              return;
                            }
                            setTraitDetail({ id, label: getTraitLabel(YOUTH_POSITIVE_TRAITS, id) });
                          }}
                        />

                        {academyPlayer?.specialTraitId ? (
                          <TraitPill
                            variant="special"
                            label={getTraitLabel(YOUTH_SPECIAL_TRAITS, academyPlayer?.specialTraitId)}
                            className={traitRerollPick?.scope === 'academy' ? 'ring-2 ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}
                            onClick={() => {
                              const id = academyPlayer?.specialTraitId;
                              if (!id) return;
                              if (traitRerollPick?.scope === 'academy') {
                                applyRerolledTraitsToState({ scope: 'academy', which: 'negative' });
                                setTraitRerollPick(null);
                                return;
                              }
                              setTraitDetail({ id, label: getTraitLabel(YOUTH_SPECIAL_TRAITS, id) });
                            }}
                          />
                        ) : (
                          <TraitPill
                            variant="negative"
                            label={getTraitLabel(YOUTH_NEGATIVE_TRAITS, academyPlayer?.negativeTraitId)}
                            className={traitRerollPick?.scope === 'academy' ? 'ring-2 ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}
                            onClick={() => {
                              const id = academyPlayer?.negativeTraitId;
                              if (!id) return;
                              if (traitRerollPick?.scope === 'academy') {
                                applyRerolledTraitsToState({ scope: 'academy', which: 'negative' });
                                setTraitRerollPick(null);
                                return;
                              }
                              setTraitDetail({ id, label: getTraitLabel(YOUTH_NEGATIVE_TRAITS, id) });
                            }}
                          />
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {!academyPlayer?.traitRerollUsed ? (
                        <button
                          onClick={() => {
                            setTraitRerollPick(prev => (prev?.scope === 'academy' ? null : { scope: 'academy' }));
                          }}
                          className="retro-btn text-[10px] py-[2px] px-2 whitespace-nowrap"
                          title="刷新特质（仅一次）"
                        >
                          刷新特质（1）
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className={`grid grid-cols-1 gap-2 ${traitRerollPick?.scope === 'academy' ? 'opacity-40 pointer-events-none' : ''}`} data-onboard-id="youth_attributes">
                    {[
                      { key: 'unity', label: '团结' },
                      { key: 'authority', label: '权威' },
                      { key: 'diligence', label: '勤恳' }
                    ].map(row => {
                      const key = row.key;
                      const val = clampInt(academyPlayer?.[key] ?? 0, 0, 10);
                      const canAdd = false;
                      return (
                        <AttributeMeter
                          key={key}
                          label={row.label}
                          value={val}
                          max={10}
                          onLabelClick={() => setAttrDetail({ id: key, label: row.label })}
                          rightSlot={(
                            <button
                              onClick={() => {
                                if (!canAdd) return;
                                allocatePointInDraft({ scope: 'academy', key });
                              }}
                              disabled={!canAdd}
                              className={`retro-btn text-[11px] py-1 px-2 ${canAdd ? '' : 'opacity-50 cursor-not-allowed'}`}
                            >
                              +1
                            </button>
                          )}
                        />
                      );
                    })}
                  </div>

                  <div className={`flex flex-wrap gap-2 pt-1 ${traitRerollPick?.scope === 'academy' ? 'opacity-40 pointer-events-none' : ''}`}>
                    <button
                      onClick={requestPromote}
                      disabled={!canPromoteWithName}
                      className={`retro-btn-primary text-xs py-1 px-2 ${canPromoteWithName ? '' : 'opacity-50 cursor-not-allowed'}`}
                      data-onboard-id="youth_promote_button"
                      title={
                        canPromoteWithName
                          ? ''
                          : (!currentAcademyName
                            ? '入队前需要先确认命名'
                            : '名额已满')
                      }
                    >
                      入队（不可撤回）
                    </button>
                    <button
                      onClick={() => {
                        if (!academyPlayer) return;
                        setPendingActionConfirm({ type: 'sell', scope: 'academy', name: String(academyPlayer?.name ?? '').trim() });
                      }}
                      className="retro-btn text-xs py-1 px-2"
                    >
                      卖出
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="text-[11px] text-gray-600 font-mono">当前无青训球员</div>
                  <div className="text-[11px] text-gray-600 font-mono">请使用右上角的刷新按钮。</div>
                </div>
              )}
            </div>

            <div className="border-2 border-black p-2">
              <div className="text-xs font-bold font-mono mb-2">已入队青训</div>

              {displaySquad.length === 0 ? (
                <div className="text-[11px] text-gray-600 font-mono">暂无入队球员</div>
              ) : (
                <div className="space-y-2">
                  {displaySquad.map(p => {
                    const isStarter = p?.role === 'starter';
                    const hasArmband = Boolean(p?.hasArmband);
                    const canGrantArmband = clampInt(p?.authority ?? 0, 0, 10) >= 5;
                    const squadCurrentName = String(p?.name ?? '').trim();
                    const squadDraftName = String(squadNameDrafts?.[p.id] ?? '').slice(0, 10);
                    const squadNextName = squadDraftName.trim();
                    const canConfirmSquadName = Boolean(!squadCurrentName && squadNextName);
                    const isPickingThisSquad = traitRerollPick?.scope === 'squad' && traitRerollPick?.id === p.id;
                    return (
                      <div key={p.id} className="border-2 border-black p-2 relative">
                        {isPickingThisSquad ? (
                          <div className="absolute inset-0 bg-black/40 z-10" />
                        ) : null}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className={isPickingThisSquad ? 'opacity-40 pointer-events-none' : ''}>
                              {squadCurrentName ? (
                                <div className="w-full border-2 border-black px-2 py-1 text-xs font-mono bg-gray-100">
                                  {squadCurrentName}
                                </div>
                              ) : (
                                <>
                                  <div className="text-[11px] font-mono text-gray-600 mb-1">命名（≤10）</div>
                                  <div className="flex items-center gap-2">
                                    <input
                                      value={squadDraftName}
                                      onChange={(e) => {
                                        const name = String(e.target.value ?? '').slice(0, 10);
                                        setSquadNameDrafts(prev => ({ ...(prev || {}), [p.id]: name }));
                                      }}
                                      className="w-full border-2 border-black px-2 py-1 text-xs font-mono"
                                      placeholder="未命名"
                                      maxLength={10}
                                    />
                                    <button
                                      onClick={() => {
                                        if (!canConfirmSquadName) return;
                                        setPendingNameConfirm({ scope: 'squad', id: p.id, name: squadNextName });
                                      }}
                                      disabled={!canConfirmSquadName}
                                      className={`retro-btn-primary text-xs py-1 px-2 whitespace-nowrap ${canConfirmSquadName ? '' : 'opacity-50 cursor-not-allowed'}`}
                                      title={canConfirmSquadName ? '' : '请先输入名字'}
                                    >
                                      确认
                                    </button>
                                  </div>
                                </>
                              )}
                              <div className="text-[11px] font-mono text-gray-700 mt-1">
                                年龄：{p?.age ?? 0} | 技术：{Number(p?.tech ?? 0).toFixed(1)}
                              </div>
                            </div>

                            {isPickingThisSquad ? (
                              <div className="text-[11px] font-mono text-gray-200 whitespace-nowrap mb-1 relative z-20">请选择要刷新的特质</div>
                            ) : null}

                            <div className={`flex items-start justify-between gap-3 ${isPickingThisSquad ? 'relative z-20' : ''}`}>
                              <div className="flex flex-wrap items-center gap-2">
                                <div className="flex flex-wrap items-center gap-2">
                                  <TraitPill
                                    variant="positive"
                                    label={getTraitLabel(YOUTH_POSITIVE_TRAITS, p?.positiveTraitId)}
                                    onClick={() => {
                                      const id = p?.positiveTraitId;
                                      if (!id) return;
                                      if (isPickingThisSquad) {
                                        applyRerolledTraitsToState({ scope: 'squad', id: p.id, which: 'positive' });
                                        setTraitRerollPick(null);
                                        return;
                                      }
                                      setTraitDetail({ id, label: getTraitLabel(YOUTH_POSITIVE_TRAITS, id) });
                                    }}
                                    className={isPickingThisSquad ? 'ring-2 ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}
                                  />

                                  {p?.specialTraitId ? (
                                    <TraitPill
                                  variant="special"
                                  label={getTraitLabel(YOUTH_SPECIAL_TRAITS, p?.specialTraitId)}
                                  onClick={() => {
                                    const id = p?.specialTraitId;
                                    if (!id) return;
                                    if (isPickingThisSquad) {
                                      applyRerolledTraitsToState({ scope: 'squad', id: p.id, which: 'negative' });
                                      setTraitRerollPick(null);
                                      return;
                                    }
                                    setTraitDetail({ id, label: getTraitLabel(YOUTH_SPECIAL_TRAITS, id) });
                                  }}
                                  className={isPickingThisSquad ? 'ring-2 ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}
                                    />
                                  ) : (
                                    <TraitPill
                                  variant="negative"
                                  label={getTraitLabel(YOUTH_NEGATIVE_TRAITS, p?.negativeTraitId)}
                                  onClick={() => {
                                    const id = p?.negativeTraitId;
                                    if (!id) return;
                                    if (isPickingThisSquad) {
                                      applyRerolledTraitsToState({ scope: 'squad', id: p.id, which: 'negative' });
                                      setTraitRerollPick(null);
                                      return;
                                    }
                                    setTraitDetail({ id, label: getTraitLabel(YOUTH_NEGATIVE_TRAITS, id) });
                                  }}
                                  className={isPickingThisSquad ? 'ring-2 ring-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]' : ''}
                                    />
                                  )}
                                </div>
                              </div>

                              <div className="shrink-0 flex items-center gap-2">
                                {!p?.traitRerollUsed ? (
                                  <button
                                    onClick={() => {
                                      setTraitRerollPick(prev => (prev?.scope === 'squad' && prev?.id === p.id ? null : { scope: 'squad', id: p.id }));
                                    }}
                                    className="retro-btn text-[10px] py-[2px] px-2 whitespace-nowrap"
                                    title="刷新特质（仅一次）"
                                  >
                                    刷新特质（1）
                                  </button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                          <div className={`flex flex-col gap-1 ${isPickingThisSquad ? 'opacity-40 pointer-events-none' : ''}`}>
                            <button
                              onClick={() => toggleArmbandInDraft(p.id)}
                              disabled={!hasArmband && !canGrantArmband}
                              title={!hasArmband && !canGrantArmband ? '权威≥5 才能授予袖标' : ''}
                              className={`retro-btn text-[11px] py-1 px-2 ${hasArmband ? 'bg-yellow-200' : ''} ${(!hasArmband && !canGrantArmband) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              {hasArmband ? '袖标✓' : '袖标'}
                            </button>
                            <button
                              onClick={() => {
                                if (!p?.id) return;
                                setPendingActionConfirm({ type: 'sell', scope: 'squad', id: p.id, name: String(p?.name ?? '').trim() });
                              }}
                              className="retro-btn text-[11px] py-1 px-2"
                            >
                              卖出
                            </button>
                          </div>
                        </div>

                        <div className={`mt-2 flex flex-wrap gap-2 ${isPickingThisSquad ? 'opacity-40 pointer-events-none' : ''}`}>
                          <button
                            onClick={() => setRoleInDraft(p.id, 'starter')}
                            className={`retro-btn text-[11px] py-1 px-2 ${isStarter ? 'bg-green-200' : ''}`}
                          >
                            首发
                          </button>
                          <button
                            onClick={() => setRoleInDraft(p.id, 'bench')}
                            className={`retro-btn text-[11px] py-1 px-2 ${!isStarter ? 'bg-green-200' : ''}`}
                          >
                            替补
                          </button>
                        </div>

                        <div className="mt-2 grid grid-cols-1 gap-2">
                          {[
                            { key: 'unity', label: '团结' },
                            { key: 'authority', label: '权威' },
                            { key: 'diligence', label: '勤恳' }
                          ].map(row => {
                            const key = row.key;
                            const val = clampInt(p?.[key] ?? 0, 0, 10);
                            const canAdd = (p?.freePoints ?? 0) > 0 && val < 10;
                            return (
                              <AttributeMeter
                                key={key}
                                label={row.label}
                                value={val}
                                max={10}
                                onLabelClick={() => setAttrDetail({ id: key, label: row.label })}
                                rightSlot={(
                                  <button
                                    onClick={() => {
                                      if (!canAdd) return;
                                      allocatePointInDraft({ scope: 'squad', id: p.id, key });
                                    }}
                                    disabled={!canAdd}
                                    className={`retro-btn text-[11px] py-1 px-2 ${canAdd ? '' : 'opacity-50 cursor-not-allowed'}`}
                                  >
                                    +1
                                  </button>
                                )}
                              />
                            );
                          })}
                          <div className="text-[11px] font-mono text-gray-700">自由点：{p?.freePoints ?? 0}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {showCloseConfirm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full p-3">
              <div className="font-bold text-sm font-mono mb-2">保存更改？</div>
              <div className="text-[11px] text-gray-700 font-mono mb-3">
                你在青训界面做了更改，退出前是否保存？
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setShowCloseConfirm(false);
                  }}
                  className="retro-btn text-xs py-1 px-2"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setShowCloseConfirm(false);
                    onClose && onClose();
                  }}
                  className="retro-btn text-xs py-1 px-2"
                >
                  不保存
                </button>
                <button
                  onClick={() => {
                    setShowCloseConfirm(false);
                    applyDraftToState();
                    onClose && onClose();
                  }}
                  className="retro-btn-primary text-xs py-1 px-2"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {pendingNameConfirm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full p-3">
              <div className="font-bold text-sm font-mono mb-2">确认命名？</div>
              <div className="text-[11px] text-gray-700 font-mono mb-3">
                确认将球员命名为「{pendingNameConfirm.name}」？入队后不可更改。
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setPendingNameConfirm(null)}
                  className="retro-btn text-xs py-1 px-2"
                >
                  取消
                </button>
                <button
                  onClick={confirmPendingName}
                  className="retro-btn-primary text-xs py-1 px-2"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {pendingActionConfirm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full p-3">
              <div className="font-bold text-sm font-mono mb-2">
                {pendingActionConfirm.type === 'refresh' ? '确认刷新？' : '确认卖出？'}
              </div>
              <div className="text-[11px] text-gray-700 font-mono mb-3">
                {pendingActionConfirm.type === 'refresh'
                  ? '确认刷新青训球员？将消耗资金30，且每季度只能刷新一次。'
                  : `确认卖出「${String(pendingActionConfirm.name || '').trim() || '未命名'}」？一旦卖出不可撤回。`}
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setPendingActionConfirm(null)}
                  className="retro-btn text-xs py-1 px-2"
                >
                  取消
                </button>
                <button
                  onClick={confirmPendingAction}
                  className="retro-btn-primary text-xs py-1 px-2"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {showPromoteConfirm ? (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-sm w-full p-3">
              <div className="font-bold text-sm font-mono mb-2">确认入队？</div>
              <div className="text-[11px] text-gray-700 font-mono mb-3">
                确认让「{currentAcademyName || '未命名'}」入队？该操作不可撤回，且入队后不可更改名字。
              </div>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setShowPromoteConfirm(false)}
                  className="retro-btn text-xs py-1 px-2"
                >
                  取消
                </button>
                <button
                  onClick={confirmPromote}
                  className="retro-btn-primary text-xs py-1 px-2"
                >
                  确认
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {traitDetail ? (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 bg-black/40">
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-sm font-mono">{traitDetail.label || '词条'}</div>
                  <div className="text-[11px] text-gray-700 font-mono mt-1 whitespace-pre-line">
                    {YOUTH_TRAIT_EFFECT_TEXT[traitDetail.id] || '暂无特效说明。'}
                  </div>
                </div>
                <button
                  onClick={() => setTraitDetail(null)}
                  className="retro-btn text-xs py-1 px-2"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        ) : null}

        {attrDetail ? (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-3 bg-black/40">
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-bold text-sm font-mono">{attrDetail.label || '属性'}</div>
                  <div className="text-[11px] text-gray-700 font-mono mt-1 whitespace-pre-line">
                    {YOUTH_ATTRIBUTE_EFFECT_TEXT[attrDetail.id] || '暂无属性说明。'}
                  </div>
                </div>
                <button
                  onClick={() => setAttrDetail(null)}
                  className="retro-btn text-xs py-1 px-2"
                >
                  关闭
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
