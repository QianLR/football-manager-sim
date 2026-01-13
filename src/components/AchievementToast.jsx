import React from 'react';
import { getAchievementDef } from '../data/achievements';

export default function AchievementToast({ toast }) {
  if (!toast) return null;
  const def = getAchievementDef(toast.id) || { title: toast.id, hint: '' };

  return (
    <div className="fixed top-12 right-2 z-50">
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] p-2 max-w-xs">
        <div className="text-[11px] font-mono text-gray-700">🏆 成就解锁</div>
        <div className="font-bold text-xs font-mono text-black leading-snug mt-0.5">{def.title}</div>
        {def.hint ? (
          <div className="text-[11px] text-gray-600 font-mono leading-snug mt-0.5">{def.hint}</div>
        ) : null}
      </div>
    </div>
  );
}
