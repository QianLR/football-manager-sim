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
  },
  'bayern_committee': {
    name: '队委会',
    description: '更衣室稳定的真实数字不可见；“动乱”不会显示在状态栏；当出现动乱时，每月额外-5更衣室稳定。',
    type: 'debuff',
    theme: 'pink',
    icon: '👥'
  },
  'bayern_history_proof': {
    name: '历史证明这是对的',
    description: '当更衣室处于动乱时，你在欧冠的技战术水平比显示增加1。',
    type: 'buff',
    theme: 'pink',
    icon: '🏛️'
  }
};

const BuffPool = () => {
  const { state, dispatch } = useGame();
  const { activeBuffs, currentTeam, hiddenBuffs } = state;

  const [expanded, setExpanded] = useState(false);
  const [confirmHideId, setConfirmHideId] = useState(null);

  const hideableIds = new Set(['bayern_committee', 'bayern_history_proof']);

  const rawList = Array.isArray(activeBuffs) ? activeBuffs : [];
  const hiddenSet = new Set(Array.isArray(hiddenBuffs) ? hiddenBuffs : []);
  const isBayern = currentTeam?.id === 'bayern_munich';
  const bayernCommitteeRemoved = Boolean(state.specialMechanicState?.bayernCommitteeRemoved);

  const filteredList = rawList
    .filter(id => !hiddenSet.has(id))
    .filter(id => !(isBayern && !bayernCommitteeRemoved && id === 'turmoil'));

  const shouldCollapse = filteredList.length > 3;
  const visibleBuffs = useMemo(() => {
    const list = filteredList;
    if (!shouldCollapse) return list;
    return expanded ? list : list.slice(0, 3);
  }, [expanded, filteredList, shouldCollapse]);

  return (
    <div className="retro-box p-2">
        {confirmHideId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
            <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-3">
              <div className="font-bold text-sm font-mono mb-2">确认隐藏</div>
              <div className="text-xs font-mono leading-relaxed text-gray-800">
                你确认已经理解该状态带来的效果吗？
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  onClick={() => setConfirmHideId(null)}
                  className="retro-btn text-xs py-1 px-2"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    dispatch({ type: 'HIDE_BUFF', payload: { id: confirmHideId } });
                    setConfirmHideId(null);
                  }}
                  className="retro-btn-primary text-xs py-1 px-2"
                >
                  我已确认，请隐藏
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-2">
            <h3 className="text-sm font-bold font-mono uppercase">
                状态池 (BUFFS/DEBUFFS)
            </h3>
            {shouldCollapse ? (
                <button
                    onClick={() => setExpanded(v => !v)}
                    className="retro-btn text-[11px] py-1 px-2"
                >
                    {expanded ? '收起' : `展开（+${filteredList.length - 3}）`}
                </button>
            ) : null}
        </div>
        
        {filteredList.length === 0 ? (
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
                    const bgColor = theme === 'blue'
                      ? 'bg-blue-100'
                      : (theme === 'pink' ? 'bg-red-50' : (isBuff ? 'bg-green-100' : 'bg-red-100'));
                    const borderColor = theme === 'blue'
                      ? 'border-blue-800'
                      : (theme === 'pink' ? 'border-red-300' : (isBuff ? 'border-green-800' : 'border-red-800'));
                    const textColor = theme === 'blue'
                      ? 'text-blue-900'
                      : (theme === 'pink' ? 'text-red-900' : (isBuff ? 'text-green-900' : 'text-red-900'));
                    const canHide = hideableIds.has(buffId);

                    return (
                        <div key={buffId} className={`border-2 ${borderColor} ${bgColor} p-2 flex items-start justify-between gap-2`}>
                            <div className="text-base">{def.icon}</div>
                            <div className="flex-1">
                                <div className="flex items-start justify-between gap-2">
                                  <div className={`font-bold text-xs ${textColor}`}>{def.name}</div>
                                  {canHide ? (
                                    <button
                                      onClick={() => setConfirmHideId(buffId)}
                                      className="retro-btn text-[10px] py-0.5 px-1.5"
                                    >
                                      隐藏
                                    </button>
                                  ) : null}
                                </div>
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
