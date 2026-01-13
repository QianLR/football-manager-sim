import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContext';

const buffDefinitions = {
  'rainbow_armband': {
    name: '彩虹臂章',
    description: '媒体支持永远不会低于10点。',
    type: 'buff',
    icon: '🌈'
  },
  'istanbul_kiss': {
    name: '伊斯坦布尔之吻',
    description: '在调情中解锁【和名宿调情】选项。',
    type: 'buff',
    icon: '💋'
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
  },
  'legacy_issues': {
    name: '历史遗留问题',
    description: '哇哦…管理层似乎对你不太满意。',
    type: 'debuff',
    icon: '🧾'
  },
  'chelsea_sack_pressure': {
    name: '英超名菜切尔西炒教练',
    description: '话语权在60以上的部分，每个月会扣除相应的管理层支持。',
    type: 'debuff',
    theme: 'blue',
    icon: '🔵'
  },
  'dortmund_emma_camera': {
    name: 'Emma摄影中',
    description: '媒体支持不低于40点。',
    type: 'buff',
    icon: '📸'
  },
  'dortmund_unlicensed': {
    name: '无证驾驶',
    description: '第一赛季的每个月只有两个决策点。',
    type: 'debuff',
    icon: '🪪'
  },
  'milan_baresi': {
    name: '名宿团：巴雷西',
    description: '本赛季持续援助：每个月管理层支持 +10。',
    type: 'buff',
    icon: '🛡️'
  },
  'milan_nesta': {
    name: '名宿团：内斯塔',
    description: '本赛季持续援助：每个月更衣室稳定 +10。',
    type: 'buff',
    icon: '🍝'
  },
  'milan_maldini': {
    name: '名宿团：马尔蒂尼',
    description: '本赛季持续援助：每个月媒体支持 +10。',
    type: 'buff',
    icon: '🥤'
  }
};

const BuffPool = () => {
  const { state } = useGame();
  const { activeBuffs } = state;

  const [expanded, setExpanded] = useState(false);

  const shouldCollapse = (activeBuffs || []).length > 3;
  const visibleBuffs = useMemo(() => {
    const list = activeBuffs || [];
    if (!shouldCollapse) return list;
    return expanded ? list : list.slice(0, 3);
  }, [activeBuffs, expanded, shouldCollapse]);

  return (
    <div className="retro-box p-2">
        <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-2">
            <h3 className="text-sm font-bold font-mono uppercase">
                状态池 (BUFFS/DEBUFFS)
            </h3>
            {shouldCollapse ? (
                <button
                    onClick={() => setExpanded(v => !v)}
                    className="retro-btn text-[11px] py-1 px-2"
                >
                    {expanded ? '收起' : `展开（+${(activeBuffs || []).length - 3}）`}
                </button>
            ) : null}
        </div>
        
        {activeBuffs.length === 0 ? (
            <div className="text-gray-500 font-mono italic text-center py-2 text-xs">
                当前无特殊状态
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-2">
                {visibleBuffs.map(buffId => {
                    const def = buffDefinitions[buffId];
                    if (!def) return null;
                    
                    const isBuff = def.type === 'buff';
                    const theme = def.theme;
                    const bgColor = theme === 'blue' ? 'bg-blue-100' : (isBuff ? 'bg-green-100' : 'bg-red-100');
                    const borderColor = theme === 'blue' ? 'border-blue-800' : (isBuff ? 'border-green-800' : 'border-red-800');
                    const textColor = theme === 'blue' ? 'text-blue-900' : (isBuff ? 'text-green-900' : 'text-red-900');

                    return (
                        <div key={buffId} className={`border-2 ${borderColor} ${bgColor} p-2 flex items-start gap-2`}>
                            <div className="text-base">{def.icon}</div>
                            <div>
                                <div className={`font-bold text-xs ${textColor}`}>{def.name}</div>
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
