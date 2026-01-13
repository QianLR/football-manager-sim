import React, { useEffect, useMemo, useState } from 'react';
import { ACHIEVEMENTS, getAchievementDef } from '../data/achievements';

const PINNED_ACHIEVEMENT_KEY = 'pinned_achievement_id';

function readPinnedAchievementId() {
  try {
    if (typeof window === 'undefined') return null;
    const v = localStorage.getItem(PINNED_ACHIEVEMENT_KEY);
    return v ? String(v) : null;
  } catch (e) {
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
  } catch (e) {
    // ignore
  }
}

function formatUnlockedAt(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch (e) {
    return String(iso);
  }
}

export default function AchievementsModal({ open, title, unlockedMap, onClose }) {
  if (!open) return null;

  const unlocked = unlockedMap || {};
  const isGlobalView = Boolean((title || '').includes('全局'));
  const unlockedIds = ACHIEVEMENTS.map(a => a.id).filter(id => Boolean(unlocked[id]));
  const [pinnedId, setPinnedId] = useState(() => readPinnedAchievementId());

  useEffect(() => {
    if (!open) return;
    setPinnedId(readPinnedAchievementId());
  }, [open, isGlobalView]);

  const listIds = useMemo(() => {
    if (!isGlobalView) return unlockedIds;

    const allIds = ACHIEVEMENTS.map(a => a.id);
    const unlockedList = allIds.filter(id => Boolean(unlocked[id]));
    const lockedList = allIds.filter(id => !unlocked[id]);

    unlockedList.sort((a, b) => {
      const ta = String(unlocked[a]?.unlockedAt || '');
      const tb = String(unlocked[b]?.unlockedAt || '');
      return tb.localeCompare(ta);
    });

    const sorted = unlockedList.concat(lockedList);
    if (pinnedId && sorted.includes(pinnedId)) {
      return [pinnedId, ...sorted.filter(id => id !== pinnedId)];
    }
    return sorted;
  }, [isGlobalView, pinnedId, unlocked, unlockedIds]);

  const togglePin = (id) => {
    const next = pinnedId === id ? null : id;
    setPinnedId(next);
    writePinnedAchievementId(next);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-bold text-sm font-mono">{title || '成就'}</div>
            <div className="text-[11px] text-gray-600 font-mono">
              已解锁 {unlockedIds.length}/{ACHIEVEMENTS.length}
            </div>
          </div>
          <button onClick={onClose} className="retro-btn text-xs py-1 px-2">关闭</button>
        </div>

        {!isGlobalView && unlockedIds.length === 0 ? (
          <div className="text-[11px] text-gray-500 font-mono py-3 text-center">尚未解锁任何成就</div>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-[70vh] overflow-auto pr-1">
            {listIds.map(id => {
              const def = getAchievementDef(id) || { id, title: id, hint: '', clue: '' };
              const meta = unlocked[id] || {};
              const isUnlocked = Boolean(unlocked[id]);
              const showClue = isGlobalView && !isUnlocked;
              const isPinned = isGlobalView && pinnedId === id;
              return (
                <div
                  key={id}
                  className={`border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-2 ${isUnlocked ? 'bg-yellow-50' : 'bg-gray-100 opacity-80'} ${isPinned ? 'ring-2 ring-yellow-400 shadow-[0_0_14px_rgba(255,215,0,0.95)]' : ''}`}
                >
                  <div className="flex items-start gap-2">
                    <div className="text-lg">{isUnlocked ? '🏆' : '🔒'}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-bold text-xs font-mono text-black leading-snug">{def.title}</div>
                        {isGlobalView ? (
                          <button
                            onClick={() => togglePin(id)}
                            className={`retro-btn text-[10px] py-0.5 px-1.5 ${isPinned ? 'bg-yellow-200' : ''}`}
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
