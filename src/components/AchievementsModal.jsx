import React from 'react';
import { ACHIEVEMENTS, getAchievementDef } from '../data/achievements';

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
  const unlockedIds = ACHIEVEMENTS.map(a => a.id).filter(id => Boolean(unlocked[id]));

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

        {unlockedIds.length === 0 ? (
          <div className="text-[11px] text-gray-500 font-mono py-3 text-center">尚未解锁任何成就</div>
        ) : (
          <div className="grid grid-cols-1 gap-2 max-h-[70vh] overflow-auto pr-1">
            {unlockedIds.map(id => {
              const def = getAchievementDef(id) || { id, title: id, hint: '' };
              const meta = unlocked[id] || {};
              return (
                <div key={id} className="border-2 border-black bg-yellow-50 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] p-2">
                  <div className="flex items-start gap-2">
                    <div className="text-lg">🏆</div>
                    <div className="flex-1">
                      <div className="font-bold text-xs font-mono text-black leading-snug">{def.title}</div>
                      {def.hint ? (
                        <div className="text-[11px] text-gray-600 font-mono leading-snug mt-0.5">{def.hint}</div>
                      ) : null}
                      {meta.unlockedAt ? (
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
