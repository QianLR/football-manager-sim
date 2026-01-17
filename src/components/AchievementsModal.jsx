import React, { useMemo, useState } from 'react';
import { ACHIEVEMENTS, getAchievementDef } from '../data/achievements';

const PINNED_ACHIEVEMENT_KEY = 'pinned_achievement_id';
const SHOW_PIN_TROPHY_ICON = false;

function readPinnedAchievementId() {
  try {
    if (typeof window === 'undefined') return null;
    const v = localStorage.getItem(PINNED_ACHIEVEMENT_KEY);
    return v ? String(v) : null;
  } catch {
    return null;
  }
}

function writePinnedAchievementId(id) {
  try {
    if (typeof window === 'undefined') return;
    if (!id) {
      localStorage.removeItem(PINNED_ACHIEVEMENT_KEY);
    } else {
      localStorage.setItem(PINNED_ACHIEVEMENT_KEY, String(id));
    }
  } catch {
    // ignore
  }
}

function formatUnlockedAt(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

function TrophyIcon({ className }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M7 4h10v3a5 5 0 0 1-10 0V4Z"
        fill="#c0c0c0"
        stroke="#000"
        strokeWidth="1.5"
      />
      <path
        d="M7 7H4.5c0 3 1.8 5 4.5 5"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M17 7h2.5c0 3-1.8 5-4.5 5"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M12 12v3"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M9 21h6"
        stroke="#000"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M10 15h4v6h-4v-6Z"
        fill="#c0c0c0"
        stroke="#000"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export default function AchievementsModal({ open, title, unlockedMap, onClose }) {
  const unlocked = useMemo(() => unlockedMap || {}, [unlockedMap]);
  const isGlobalView = Boolean((title || '').includes('全局'));
  const unlockedIds = useMemo(
    () => ACHIEVEMENTS.map(a => a.id).filter(id => Boolean(unlocked[id])),
    [unlocked]
  );
  const [pinnedId, setPinnedId] = useState(() => readPinnedAchievementId());
  const effectivePinnedId = isGlobalView && pinnedId && unlocked[pinnedId] ? pinnedId : null;
  const [youthLockedExpanded, setYouthLockedExpanded] = useState(false);

  const listMeta = useMemo(() => {
    if (!isGlobalView) return unlockedIds;

    const allIds = ACHIEVEMENTS.map(a => a.id);
    const unlockedList = allIds.filter(id => Boolean(unlocked[id]));
    const lockedList = allIds.filter(id => !unlocked[id]);

    const lockedYouthList = lockedList.filter(id => String(id || '').startsWith('youth_'));
    const lockedOtherList = lockedList.filter(id => !String(id || '').startsWith('youth_'));

    unlockedList.sort((a, b) => {
      const ta = String(unlocked[a]?.unlockedAt || '');
      const tb = String(unlocked[b]?.unlockedAt || '');
      return tb.localeCompare(ta);
    });

    const sorted = unlockedList.concat(lockedOtherList);
    if (lockedYouthList.length > 0) {
      sorted.push('__locked_youth_group__');
    }
    if (effectivePinnedId && sorted.includes(effectivePinnedId)) {
      return {
        listIds: [effectivePinnedId, ...sorted.filter(id => id !== effectivePinnedId)],
        lockedYouthIds: lockedYouthList
      };
    }
    return { listIds: sorted, lockedYouthIds: lockedYouthList };
  }, [isGlobalView, effectivePinnedId, unlocked, unlockedIds]);

  const listIds = Array.isArray(listMeta) ? listMeta : listMeta.listIds;
  const lockedYouthIds = Array.isArray(listMeta) ? [] : listMeta.lockedYouthIds;

  const togglePin = (id) => {
    if (!unlocked[id]) return;
    const next = pinnedId === id ? null : id;
    setPinnedId(next);
    writePinnedAchievementId(next);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-bold text-sm font-mono">{title || '成就'}</div>
            <div className="text-[11px] text-gray-600 font-mono">
              {isGlobalView
                ? `已解锁 ${unlockedIds.length}/${ACHIEVEMENTS.length}`
                : `本局已解锁 ${unlockedIds.length}`}
            </div>
          </div>
          <button onClick={onClose} className="retro-btn text-xs py-1 px-2">关闭</button>
        </div>

        {!isGlobalView && unlockedIds.length === 0 ? (
          <div className="text-[11px] text-gray-500 font-mono py-3 text-center">尚未解锁任何成就</div>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-[70vh] overflow-auto pr-1">
            {listIds.map(id => {
              if (id === '__locked_youth_group__') {
                const count = Array.isArray(lockedYouthIds) ? lockedYouthIds.length : 0;
                if (count <= 0) return null;
                const label = youthLockedExpanded
                  ? `青训成就（收起-${count}）`
                  : `青训成就（展开+${count}）`;
                return (
                  <div
                    key={id}
                    className="border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-2 bg-white"
                  >
                    <button
                      type="button"
                      onClick={() => setYouthLockedExpanded(v => !v)}
                      className="retro-btn text-xs py-1 px-2 w-full flex justify-between items-center"
                    >
                      <span className="font-mono font-bold">{label}</span>
                      <span className="font-mono text-[10px] text-gray-600">🔒</span>
                    </button>

                    {youthLockedExpanded ? (
                      <div className="grid grid-cols-1 gap-2 mt-2">
                        {lockedYouthIds.map(yid => {
                          const def = getAchievementDef(yid) || { id: yid, title: yid, hint: '', clue: '' };
                          const meta = unlocked[yid] || {};
                          const isUnlocked = Boolean(unlocked[yid]);
                          const showClue = isGlobalView && !isUnlocked;
                          const isPinned = isGlobalView && pinnedId === yid;
                          const displayTitle = showClue ? '？？？' : def.title;
                          return (
                            <div
                              key={yid}
                              className={`relative z-0 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-2 ${isUnlocked ? 'bg-yellow-50' : 'bg-gray-100 opacity-80'} ${isPinned ? 'bg-yellow-100 ring-2 ring-yellow-300' : ''}`}
                            >
                              {isPinned ? (
                                <div className="pointer-events-none absolute -inset-3 -z-10 bg-yellow-300/30 blur-md animate-pulse" />
                              ) : null}
                              <div className="flex items-start gap-2">
                                <div className="leading-none mt-0.5">
                                  {isUnlocked ? (
                                    <span className="text-lg">🏆</span>
                                  ) : (
                                    <span className="text-lg">🔒</span>
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex items-center gap-1 font-bold text-sm font-mono text-black leading-snug mt-0.5">
                                      <span>{displayTitle}</span>
                                      {SHOW_PIN_TROPHY_ICON && isPinned ? <TrophyIcon className="w-4 h-4" /> : null}
                                    </div>
                                    {isGlobalView && isUnlocked ? (
                                      <button
                                        onClick={() => togglePin(yid)}
                                        className={`retro-btn text-[10px] py-0.5 px-1.5 ${isPinned ? 'bg-yellow-300' : ''}`}
                                      >
                                        {isPinned ? '取消置顶' : '置顶'}
                                      </button>
                                    ) : null}
                                  </div>
                                  {showClue ? (
                                    <div className="text-[11px] text-gray-600 font-mono leading-snug mt-0.5">{def.clue || '……'}</div>
                                  ) : def.hint ? (
                                    <div className="text-[11px] text-gray-600 font-mono leading-snug mt-0.5">{def.hint}</div>
                                  ) : null}
                                  {isUnlocked && meta.unlockedAt ? (
                                    <div className="text-[10px] text-gray-500 font-mono mt-1">解锁时间：{formatUnlockedAt(meta.unlockedAt)}</div>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              }

              const def = getAchievementDef(id) || { id, title: id, hint: '', clue: '' };
              const meta = unlocked[id] || {};
              const isUnlocked = Boolean(unlocked[id]);
              const showClue = isGlobalView && !isUnlocked;
              const isPinned = isGlobalView && pinnedId === id;
              const displayTitle = showClue ? '？？？' : def.title;
              return (
                <div
                  key={id}
                  className={`relative z-0 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-2 ${isUnlocked ? 'bg-yellow-50' : 'bg-gray-100 opacity-80'} ${isPinned ? 'bg-yellow-100 ring-2 ring-yellow-300' : ''}`}
                >
                  {isPinned ? (
                    <div className="pointer-events-none absolute -inset-3 -z-10 bg-yellow-300/30 blur-md animate-pulse" />
                  ) : null}
                  <div className="flex items-start gap-2">
                    <div className="leading-none mt-0.5">
                      {isUnlocked ? (
                        <span className="text-lg">🏆</span>
                      ) : (
                        <span className="text-lg">🔒</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-1 font-bold text-sm font-mono text-black leading-snug mt-0.5">
                          <span>{displayTitle}</span>
                          {SHOW_PIN_TROPHY_ICON && isPinned ? <TrophyIcon className="w-4 h-4" /> : null}
                        </div>
                        {isGlobalView && isUnlocked ? (
                          <button
                            onClick={() => togglePin(id)}
                            className={`retro-btn text-[10px] py-0.5 px-1.5 ${isPinned ? 'bg-yellow-300' : ''}`}
                          >
                            {isPinned ? '取消置顶' : '置顶'}
                          </button>
                        ) : null}
                      </div>
                      {showClue ? (
                        <div className="text-[11px] text-gray-600 font-mono leading-snug mt-0.5">{def.clue || '……'}</div>
                      ) : def.hint ? (
                        <div className="text-[11px] text-gray-600 font-mono leading-snug mt-0.5">{def.hint}</div>
                      ) : null}
                      {isUnlocked && meta.unlockedAt ? (
                        <div className="text-[10px] text-gray-500 font-mono mt-1">解锁时间：{formatUnlockedAt(meta.unlockedAt)}</div>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
