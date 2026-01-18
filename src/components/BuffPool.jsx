import React, { useMemo, useState } from 'react';
import { useGame } from '../context/GameContextInstance';

const buffDefinitions = {
  'rainbow_armband': {
    name: '彩虹臂章',
    description: '媒体支持永远不会低于10点。',
    type: 'buff',
    icon: '🌈'
  },
  'kop_freeze_quarter': {
    name: 'Kop',
    description: '管理层支持首次降到20以下后会冻结一个季度。',
    type: 'buff',
    theme: 'red',
    icon: '🎶'
  },
  'kop_freeze_season': {
    name: 'Kop的呼唤',
    description: '管理层支持首次降到20以下后会冻结一个赛季。',
    type: 'buff',
    theme: 'red',
    icon: '📣'
  },
  'istanbul_kiss': {
    name: '伊斯坦布尔之吻',
    description: '在调情选择中出现【和名宿调情】。',
    type: 'buff',
    theme: 'red',
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
    description: '哇哦……管理层似乎对你不太满意。',
    type: 'debuff',
    icon: '🧾'
  },
  'legacy_issues_mop': {
    name: '历史遗留问题',
    description: '球员们都传说，你用拖把赶走了之前的主教练。',
    type: 'debuff',
    icon: '🧹'
  },
  'chelsea_sack_pressure': {
    name: '英超名菜切尔西炒教练',
    description: '话语权在60以上的部分，每个月会扣除相应的管理层支持。',
    type: 'debuff',
    theme: 'blue',
    icon: '🔵'
  },
  'special_one': {
    name: 'Special One',
    description: '你可以无视话语权动用球队资金。',
    type: 'buff',
    theme: 'blue',
    icon: '🕶️'
  },
  'barca_board_take': {
    name: '诺坎普施工中',
    description: '每赛季结束时，你不会得到资金援助，并且管理层会向你要求10球队资金。',
    type: 'debuff',
    icon: '🏗️'
  },
  'man_city_auto_flirt': {
    name: '人老实话不多',
    description: '每个季度自动随机触发一次不消耗决策点的“调情”。',
    type: 'debuff',
    icon: '🪽'
  },
  'union_stun_gun': {
    name: '电棍',
    description: '每季度+5话语权。可以触发后续剧情。',
    type: 'buff',
    icon: '⚡️'
  },
  'union_stun_iron': {
    name: '电棍与铁棍',
    description: '每月+5话语权。',
    type: 'buff',
    icon: '🔩'
  },
  'union_wood_iron_stun': {
    name: '木棍、铁棍与电棍',
    description: '解锁“在更衣室上演全武行”决策（替换“在更衣室抓内鬼”）。',
    type: 'buff',
    icon: '🪵'
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

  const filteredList = rawList
    .filter(id => !hiddenSet.has(id))
    .filter(id => !(isBayern && id === 'turmoil'));

  const youthSquadPlayers = Array.isArray(state.youthSquadPlayers) ? state.youthSquadPlayers.filter(Boolean) : [];
  const primaryYouth = youthSquadPlayers.length > 0 ? youthSquadPlayers[0] : null;
  const youthTraitSummary = useMemo(() => {
    if (!primaryYouth) return null;

    const name = String(primaryYouth.name || '').trim() || '未命名';
    const hasArmband = Boolean(primaryYouth.hasArmband);
    const mult = hasArmband ? 2 : 1;
    const lines = [];

    const pos = String(primaryYouth.positiveTraitId || '');
    const neg = String(primaryYouth.negativeTraitId || '');
    const sp = String(primaryYouth.specialTraitId || '');

    const unity = Math.max(0, Math.min(10, Number(primaryYouth.unity ?? 0) || 0));
    const authority = Math.max(0, Math.min(10, Number(primaryYouth.authority ?? 0) || 0));
    const diligence = Math.max(0, Math.min(10, Number(primaryYouth.diligence ?? 0) || 0));

    if (unity >= 7) lines.push(`团结：每月 更衣室稳定 +${3 * mult}`);
    else if (unity >= 5) lines.push(`团结：每月 更衣室稳定 +${2 * mult}`);
    if (unity === 10 && hasArmband) lines.push('团结：10+袖标 更衣室稳定永不低于40');

    if (authority >= 5) lines.push('权威：达到5后可授予队长袖标（袖标×2）');
    if (authority >= 7) lines.push(`权威：每月 话语权 +${2 * mult}`);
    if (authority === 10 && hasArmband) lines.push('权威：10+袖标 决策不再降低话语权');

    if (diligence >= 5) {
      const drop = Math.max(0, 2 - 1 * mult);
      lines.push(`勤恳：赛季末 夏窗技战术削减从2变为${drop}`);
    }
    if (diligence >= 7) lines.push(`勤恳：每季度 技战术 +${0.5 * mult}`);
    if (diligence === 10 && hasArmband) lines.push('勤恳：10+袖标 训练项目额外 技战术 +0.5');

    if (pos === 'passionate') lines.push(`热情的：每月 资金 +${2 * mult}`);
    if (pos === 'multilingual') lines.push(`多语言的：每月 媒体支持 +${2 * mult}`);
    if (pos === 'manage_up') lines.push(`向上管理的：每月 管理层支持 +${2 * mult}`);
    if (pos === 'stable') lines.push('稳定的：随机事件导致技战术下降时，有50%概率抵消');
    if (pos === 'calm') lines.push('冷静的：下课/降级时触发一次保护（仅一次）');
    if (pos === 'loyal') lines.push(hasArmband ? '忠诚的：每赛季 勤恳 +2（需袖标）' : '忠诚的：每赛季 勤恳 +2（需袖标，当前未佩戴）');

    if (neg === 'party_star') lines.push(`派对之星：每季度 伤病风险 +${1 * mult}`);
    if (neg === 'ambitious') lines.push('野心家：替补时不能提升能力');
    if (neg === 'flirtatious') lines.push(`多情种：每次调情额外 小报 +${1 * mult}`);
    if (neg === 'mixer') lines.push('串子：每赛季额外触发1个随机事件（媒体教育3次后不再触发）');
    if (neg === 'canteen_legend') lines.push(`食堂传奇：每季度 资金 ${-5 * mult}`);
    if (neg === 'mole') lines.push('内鬼：每季度自动触发一次“在更衣室抓内鬼”事件，如果被抓到，则-20更衣室稳定度。抓到后则不再触发。）');

    if (sp === 'eco_guardian') {
      const seasonYear = Number(state.year ?? 0);
      const missingSeason = Number(primaryYouth.ecoMissingSeasonYear ?? 0);
      const missingQuarter = Number(primaryYouth.ecoMissingQuarter ?? 0);
      if (missingSeason === seasonYear && missingQuarter > 0) {
        lines.push(`环保卫士：本赛季第${missingQuarter}季度缺席联赛（不影响欧冠）`);
      } else {
        lines.push('环保卫士：每赛季随机一个季度缺席联赛（不影响欧冠）');
      }
    }

    if (lines.length === 0) {
      lines.push('无');
    }

    return { name, hasArmband, lines };
  }, [primaryYouth, state.year, youthSquadPlayers]);

  const combinedCards = useMemo(() => {
    const items = [];
    if (youthTraitSummary) items.push({ type: 'youth' });
    filteredList.forEach(id => items.push({ type: 'buff', id }));
    return items;
  }, [filteredList, youthTraitSummary]);

  const shouldCollapse = combinedCards.length > 3;
  const visibleCards = useMemo(() => {
    if (!shouldCollapse) return combinedCards;
    return expanded ? combinedCards : combinedCards.slice(0, 3);
  }, [combinedCards, expanded, shouldCollapse]);

  return (
    <div className="retro-box p-2" data-onboard-id="buff_pool">
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
                    {expanded ? '收起' : `展开（+${combinedCards.length - 3}）`}
                </button>
            ) : null}
        </div>
        
        {combinedCards.length === 0 ? (
            <div className="text-gray-500 font-mono italic text-center py-2 text-xs">
                当前无特殊状态
            </div>
        ) : (
            <div className="grid grid-cols-1 gap-2">
                {visibleCards.map((item, idx) => {
                    if (item.type === 'youth') {
                      return (
                        <div key={`youth_${idx}`} className="border-2 border-green-800 bg-green-100 p-2 flex items-start justify-between gap-2">
                          <div className="text-base">🟩</div>
                          <div className="flex-1">
                            <div className="font-bold text-xs text-green-900">青训加成</div>
                            <div className="text-[10px] text-gray-700 font-mono leading-tight">青训[{youthTraitSummary.name}]{youthTraitSummary.hasArmband ? '（袖标×2）' : ''}</div>
                            <div className="mt-1 space-y-0.5">
                              {Array.isArray(youthTraitSummary.lines) ? youthTraitSummary.lines.map((t, i) => (
                                <div key={i} className="text-[10px] text-gray-800 font-mono leading-tight">- {t}</div>
                              )) : null}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    const buffId = item.id;
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
