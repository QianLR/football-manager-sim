import React from 'react';
import { useGame } from '../context/GameContext';

const buffDefinitions = {
  'rainbow_armband': {
    name: '彩虹臂章',
    description: '媒体支持永远不会低于10点。',
    type: 'buff',
    icon: '🌈'
  },
  'media_darling': {
    name: '媒体宠儿',
    description: '媒体支持极高(>80)，每月自动增加管理层支持。',
    type: 'buff',
    icon: '📸'
  },
  'media_hostile': {
    name: '媒体公敌',
    description: '媒体支持极低(<40)，每月自动减少管理层支持。',
    type: 'debuff',
    icon: '🤬'
  },
  'turmoil': {
    name: '更衣室动乱',
    description: '更衣室失控(<40)，每月管理层支持和话语权下降，小报消息增加。',
    type: 'debuff',
    icon: '🔥'
  },
  'closed_canteen': {
    name: '食堂关闭',
    description: '为了节省开支关闭了食堂，每月更衣室稳定度持续下降。',
    type: 'debuff',
    icon: '🍔'
  }
};

const BuffPool = () => {
  const { state } = useGame();
  const { activeBuffs } = state;

  return (
    <div className="retro-box p-3 mb-4">
        <h3 className="text-base font-bold font-mono uppercase border-b-2 border-black pb-1 mb-2">
            状态池 (BUFFS/DEBUFFS)
        </h3>
        
        {activeBuffs.length === 0 ? (
            <div className="text-gray-500 font-mono italic text-center py-2 text-sm">
                当前无特殊状态
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-2">
                {activeBuffs.map(buffId => {
                    const def = buffDefinitions[buffId];
                    if (!def) return null;
                    
                    const isBuff = def.type === 'buff';
                    const bgColor = isBuff ? 'bg-green-100' : 'bg-red-100';
                    const borderColor = isBuff ? 'border-green-800' : 'border-red-800';
                    const textColor = isBuff ? 'text-green-900' : 'text-red-900';

                    return (
                        <div key={buffId} className={`border-2 ${borderColor} ${bgColor} p-2 flex items-start gap-2`}>
                            <div className="text-xl">{def.icon}</div>
                            <div>
                                <div className={`font-bold text-sm ${textColor}`}>{def.name}</div>
                                <div className="text-[10px] text-gray-700 font-mono leading-tight">{def.description}</div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
    </div>
  );
};

export default BuffPool;
