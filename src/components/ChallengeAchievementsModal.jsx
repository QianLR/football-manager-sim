import React, { useMemo, useState } from 'react';
import { CHALLENGE_ACHIEVEMENTS } from '../data/achievements';

function formatUnlockedAt(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

function applyCountryText(text, countryName) {
  return String(text || '').replace(/【国家名】/g, countryName || '西班牙');
}

export default function ChallengeAchievementsModal({ open, unlockedMap, countryName, onClose }) {
  const unlocked = useMemo(() => unlockedMap || {}, [unlockedMap]);
  const [expandedId, setExpandedId] = useState(null);
  const unlockedIds = useMemo(
    () => CHALLENGE_ACHIEVEMENTS
      .map(item => item.id)
      .filter(id => Boolean(unlocked[id])),
    [unlocked]
  );
  const sortedIds = useMemo(() => {
    return unlockedIds.slice().sort((a, b) => {
      const ta = String(unlocked[a]?.unlockedAt || '');
      const tb = String(unlocked[b]?.unlockedAt || '');
      return tb.localeCompare(ta);
    });
  }, [unlocked, unlockedIds]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="font-bold text-sm font-mono">挑战模式成就</div>
          </div>
          <button onClick={onClose} className="retro-btn text-xs py-1 px-2">关闭</button>
        </div>

        {sortedIds.length === 0 ? (
          <div className="min-h-16" />
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-[70vh] overflow-auto pr-1">
            {sortedIds.map(id => {
              const def = CHALLENGE_ACHIEVEMENTS.find(item => item.id === id) || { id, title: id, hint: '', clue: '' };
              const meta = unlocked[id] || {};
              const expanded = expandedId === id;
              return (
                <button
                  type="button"
                  key={id}
                  onClick={() => setExpandedId(expanded ? null : id)}
                  className="text-left relative z-0 border-2 border-black shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-2 bg-yellow-50"
                >
                  <div className="flex items-start gap-2">
                    <div className="leading-none mt-0.5 text-lg">🏆</div>
                    <div className="flex-1">
                      <div className="font-bold text-sm font-mono text-black leading-snug mt-0.5">{def.title}</div>
                      <div className="text-[11px] text-gray-600 font-mono leading-snug mt-0.5">
                        {applyCountryText(def.hint, countryName)}
                      </div>
                      {expanded ? (
                        <div className="mt-2 border-t border-black/20 pt-2">
                          <div className="text-[10px] text-gray-500 font-mono leading-snug">
                            触发条件：{def.clue || '……'}
                          </div>
                          {meta.unlockedAt ? (
                            <div className="text-[10px] text-gray-500 font-mono mt-1">
                              解锁时间：{formatUnlockedAt(meta.unlockedAt)}
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
