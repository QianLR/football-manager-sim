import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../context/GameContextInstance';
import { CHALLENGE_COMPLAINT_LETTERS, CHALLENGE_FRIENDLY_SCHEDULE, CHALLENGE_GROUP_FIXTURES, CHALLENGE_GROUP_TEAMS } from '../data/challengeMode';
import { useLanguage } from '../i18n/LanguageContext';
import { localizeComplaintLetter } from '../i18n/complaintLetters';
import { translateRenderedText } from '../i18n/translations';

const StatBar = ({ label, value, max = 100, onboardId = null }) => {
  const percentage = max ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;
  return (
    <div className="mb-1" data-onboard-id={onboardId || undefined}>
      <div className="flex justify-between text-[11px] mb-0.5 font-mono">
        <span className="font-bold">{label}</span>
        <span>{value}{max !== null ? `/${max}` : ''}</span>
      </div>
      <div className="retro-progress-container">
        <div className="retro-progress-bar" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
};

const InfoButton = ({ onClick, label }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center justify-center w-4 h-4 border-2 border-black rounded-full text-[10px] font-bold bg-white hover:bg-gray-200 text-black leading-none"
    aria-label={label}
    type="button"
  >
    ?
  </button>
);

function renderFormattedText(text) {
  const lines = String(text || '').split('\n');
  return lines.map((line, lineIndex) => {
    const parts = [];
    const regex = /~~(.*?)~~/g;
    let lastIndex = 0;
    let match;

    while ((match = regex.exec(line)) !== null) {
      if (match.index > lastIndex) parts.push(line.slice(lastIndex, match.index));
      parts.push(
        <del key={`dash_${lineIndex}_${match.index}`} className="opacity-80">
          {match[1]}
        </del>
      );
      lastIndex = regex.lastIndex;
    }

    if (lastIndex < line.length) parts.push(line.slice(lastIndex));

    return (
      <React.Fragment key={`complaint_line_${lineIndex}`}>
        {parts}
        {lineIndex < lines.length - 1 ? <br /> : null}
      </React.Fragment>
    );
  });
}

function phaseText(challenge, t) {
  if (!challenge) return t('准备阶段');
  if (challenge.phase === 'friendlies') return t(`友谊赛 ${challenge.friendlyMatchesPlayed}/4`);
  if (challenge.phase === 'group') return t(`小组赛 第${(challenge.groupMatchIndex || 0) + 1}轮`);
  if (challenge.phase === 'knockout') {
    const round = challenge.knockoutRounds?.[challenge.knockoutIndex || 0];
    return t(round?.label || '淘汰赛');
  }
  if (challenge.phase === 'complete') return t('挑战完成');
  return t('准备阶段');
}

function pointsRankingText(challenge, stats, t) {
  if (!challenge) return t('正式比赛未开始');
  if (challenge.phase === 'group') {
    return t(`第${challenge.ranking || 1}名 / ${stats?.points || 0}分`);
  }
  if (challenge.phase === 'knockout') {
    const round = challenge.knockoutRounds?.[challenge.knockoutIndex || 0];
    return t(round?.label || '淘汰赛');
  }
  if (challenge.phase === 'complete') return t('挑战完成');
  return t('正式比赛未开始');
}

function scoreTextFromMatch(match) {
  if (match?.scoreText) return match.scoreText;
  const result = match?.result;
  if (result === 'W') return '1 - 0';
  if (result === 'L') return '0 - 1';
  if (result === 'D') return '1 - 1';
  return '';
}

function getFriendlyScheduleEntries(challenge, t) {
  return CHALLENGE_FRIENDLY_SCHEDULE.map((slot, index) => {
    const playedMatch = Array.isArray(challenge?.friendlyHistory) ? challenge.friendlyHistory[index] : null;
    const currentMatchIndex = challenge?.friendlyMatchesPlayed || 0;
    const currentOpponent = index === currentMatchIndex ? challenge?.upcomingOpponent?.name : null;
    const opponentName = t(playedMatch?.opponentName || currentOpponent || '暂未确定');
    return {
      id: `friendly_${slot.round}`,
      type: 'friendly',
      label: t('国际友谊赛'),
      dateText: slot.dateText || '',
      timeText: slot.timeText || '',
      homeName: t('西班牙'),
      awayName: opponentName,
      active: challenge?.phase === 'friendlies' && index === currentMatchIndex && Boolean(challenge?.upcomingOpponent?.name),
      scoreText: scoreTextFromMatch(playedMatch),
      completed: Boolean(playedMatch?.result)
    };
  });
}

function getScheduleEntries(challenge, t) {
  if (!challenge) return [{ id: 'empty', text: t('未安排赛程'), type: 'empty' }];

  if (challenge.phase === 'friendlies') {
    return [
      ...getFriendlyScheduleEntries(challenge, t),
      ...CHALLENGE_GROUP_FIXTURES.map(fixture => {
        const homeName = t(CHALLENGE_GROUP_TEAMS.find(team => team.id === fixture.homeId)?.name || '西班牙');
        const awayName = t(CHALLENGE_GROUP_TEAMS.find(team => team.id === fixture.awayId)?.name || '未知对手');
        return {
          id: `group_preview_${fixture.round}`,
          type: 'group',
          label: t(fixture.groupLabel || '世界杯 · 小组赛'),
          dateText: fixture.dateText || '',
          timeText: fixture.timeText || '',
          homeName,
          awayName,
          active: false
        };
      })
    ];
  }

  if (challenge.phase === 'group') {
    const groupResults = Array.isArray(challenge.results)
      ? challenge.results.filter(item => item?.type === 'group')
      : [];
    return [
      ...getFriendlyScheduleEntries(challenge, t),
      ...CHALLENGE_GROUP_FIXTURES.map((fixture, index) => {
      const homeName = t(CHALLENGE_GROUP_TEAMS.find(team => team.id === fixture.homeId)?.name || '西班牙');
      const awayName = t(CHALLENGE_GROUP_TEAMS.find(team => team.id === fixture.awayId)?.name || '未知对手');
      const playedMatch = groupResults[index] || null;
      return {
        id: `group_${fixture.round}`,
        type: 'group',
        label: t(fixture.groupLabel || '世界杯 · 小组赛'),
        dateText: fixture.dateText || '',
        timeText: fixture.timeText || '',
        homeName,
        awayName,
        active: index === (challenge.groupMatchIndex || 0),
        scoreText: scoreTextFromMatch(playedMatch),
        completed: Boolean(playedMatch?.result)
      };
      })
    ];
  }

  if (challenge.phase === 'knockout') {
    const opponentName = challenge.knockoutRounds?.[challenge.knockoutIndex || 0]?.opponent?.name;
    return [
      ...getFriendlyScheduleEntries(challenge, t),
      {
        id: 'knockout',
        text: opponentName ? t(`西班牙 vs ${opponentName}`) : t('未安排赛程'),
        type: 'single'
      }
    ];
  }

  return [{ id: 'empty', text: t('未安排赛程'), type: 'empty' }];
}

export default function ChallengeDashboard({ topActions = null, onInfoOpenChange = null }) {
  const { state } = useGame();
  const { language } = useLanguage();
  const { currentTeam, playerName, stats, challenge } = state;
  const t = value => language === 'en' ? translateRenderedText(value) : value;
  const [showTable, setShowTable] = useState(false);
  const [infoKey, setInfoKey] = useState(null);
  const [showComplaintLetters, setShowComplaintLetters] = useState(false);
  const [showStatusCards, setShowStatusCards] = useState(false);
  const [complaintLetterIndex, setComplaintLetterIndex] = useState(0);

  const openInfo = key => {
    setInfoKey(key);
    onInfoOpenChange?.(true);
  };
  const closeInfo = () => {
    setInfoKey(null);
    onInfoOpenChange?.(false);
  };

  useEffect(() => () => onInfoOpenChange?.(false), [onInfoOpenChange]);

  const groupStandings = useMemo(() => {
    const table = Array.isArray(challenge?.groupTable) ? challenge.groupTable.slice() : [];
    table.sort((a, b) => {
      if ((b.points || 0) !== (a.points || 0)) return (b.points || 0) - (a.points || 0);
      if ((b.goalDiff || 0) !== (a.goalDiff || 0)) return (b.goalDiff || 0) - (a.goalDiff || 0);
      return (b.tactics || 0) - (a.tactics || 0);
    });
    return table;
  }, [challenge]);

  if (state.selectedGameMode !== 'challenge' || !currentTeam) return null;

  const visibleNegativeNews = Array.isArray(challenge?.negativeNews) ? challenge.negativeNews : [];
  const negativeNewsPenalty = visibleNegativeNews.length * 5;
  const mediaSupportCapOverride = challenge?.mediaSupportCapOverride;
  const mediaSupportBaseCap = typeof mediaSupportCapOverride === 'number' && Number.isFinite(mediaSupportCapOverride)
    ? mediaSupportCapOverride
    : 100;
  const mediaSupportCap = Math.max(0, mediaSupportBaseCap - negativeNewsPenalty);
  const complaintLetters = challenge?.complaintLetters || 0;
  const complaintLetterHistory = Array.isArray(challenge?.complaintLetterHistory) ? challenge.complaintLetterHistory : [];
  const activeComplaintLetter = complaintLetterHistory[complaintLetterIndex] || null;
  const activeComplaintTemplate = activeComplaintLetter
    ? CHALLENGE_COMPLAINT_LETTERS.find(letter => (
        letter.id === activeComplaintLetter.letterId || String(activeComplaintLetter.id || '').includes(letter.id)
      ))
    : null;
  const localizedActiveComplaint = activeComplaintLetter
    ? localizeComplaintLetter({
        letter: activeComplaintTemplate,
        language,
        playerName,
        fallbackTitle: activeComplaintLetter.title,
        fallbackDescription: activeComplaintLetter.description
      })
    : null;
  const scheduleEntries = getScheduleEntries(challenge, t);
  const statusCards = [];

  if ((stats.dressingRoom ?? 0) >= 80) {
    statusCards.push({
      id: 'high_morale',
      icon: '🔥',
      name: '军心高涨',
      description: '球队获得隐藏士气加成。',
      tone: 'buff'
    });
  } else if ((stats.dressingRoom ?? 0) < 40) {
    statusCards.push({
      id: 'turmoil',
      icon: '⚠️',
      name: '更衣室动乱',
      description: '队内气氛已经很危险，继续下滑会导致挑战失败。',
      tone: 'debuff'
    });
  }

  if ((stats.mediaSupport ?? 0) >= 80) {
    statusCards.push({
      id: 'media_hype',
      icon: '📰',
      name: '媒体欢呼',
      description: '舆论环境良好，球队更容易保持信心。',
      tone: 'buff'
    });
  } else if ((stats.mediaSupport ?? 0) <= 40) {
    statusCards.push({
      id: 'media_pressure',
      icon: '📣',
      name: '媒体环境紧张',
      description: '舆论环境极端恶劣，但足协暂时还没有把你推出去。',
      tone: 'debuff'
    });
  }

  if ((stats.fatigue ?? 0) >= 25) {
    statusCards.push({
      id: 'fatigue_high',
      icon: '😵',
      name: '疲惫累积',
      description: '球员身体状况开始影响比赛发挥。',
      tone: 'debuff'
    });
  }

  const opponent = challenge?.upcomingOpponent
    || (challenge?.phase === 'group'
      ? (() => {
        const fixture = CHALLENGE_GROUP_FIXTURES[challenge?.groupMatchIndex || 0];
        const team = groupStandings.find(item => item.id === fixture?.opponentId);
        return team ? { ...team } : null;
      })()
      : challenge?.phase === 'knockout'
        ? challenge?.knockoutRounds?.[challenge?.knockoutIndex || 0]?.opponent
        : null);

  return (
    <div className="retro-box p-2">
      {infoKey && (
        <div className="fixed inset-0 z-[1100] flex items-center justify-center p-3 bg-black/40" data-i18n-skip>
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-sm font-mono">{t('属性说明')}</div>
              <button onClick={closeInfo} className="retro-btn text-xs py-1 px-2">{t('关闭')}</button>
            </div>
            <div className="text-xs font-mono leading-relaxed text-gray-800">
              {infoKey === 'dressingRoom' && (
                <div>{t('更衣室稳定代表队内气氛和球员对你的接受度。过低时球队会陷入动乱，归零时挑战失败。')}</div>
              )}
              {infoKey === 'authority' && (
                <div>{t('权威代表你对球队的控制力，较低时将会无法执行某些决策。权威归零时，你会被下课。')}</div>
              )}
              {infoKey === 'mediaSupport' && (
                <div>{t('媒体支持代表舆论环境。负面新闻会压低媒体支持上限。媒体支持较低时，比赛不胜会带来额外的损失。')}</div>
              )}
              {infoKey === 'fatigue' && (
                <div>{t('球队疲惫代表全队身体与精神消耗。疲惫越高，比赛发挥越容易下滑，严重时还可能出现重大失误。')}</div>
              )}
              {infoKey === 'tactics' && (
                <div>{t('技战术水平代表球队当前的比赛执行力。它会直接影响比赛强度判定，越高越容易在比赛中占据优势。')}</div>
              )}
            </div>
          </div>
        </div>
      )}

      {showTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40" data-i18n-skip>
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-md w-full p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-sm font-mono">{t('赛程')}</div>
              <button onClick={() => setShowTable(false)} className="retro-btn text-xs py-1 px-2">{t('关闭')}</button>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {scheduleEntries.some(entry => entry.type === 'single') ? (
                <div className="border-2 border-black p-2 text-xs font-mono text-gray-800 bg-white">
                  {scheduleEntries.find(entry => entry.type === 'single')?.text}
                </div>
              ) : null}

              {scheduleEntries.some(entry => entry.type === 'friendly') ? (
                <div className="border-2 border-black bg-gray-50 p-2">
                  <div className="font-bold text-sm font-mono border-b-2 border-black pb-1 mb-2">{t('国际友谊赛')}</div>
                  <div className="grid grid-cols-1 gap-2">
                    {scheduleEntries.filter(entry => entry.type === 'friendly').map(entry => (
                      <div
                        key={entry.id}
                        className={`border-2 p-2 font-mono ${
                          entry.completed
                            ? 'border-gray-500 bg-gray-200 text-gray-600'
                            : entry.active
                              ? 'border-slate-700 bg-stone-100 shadow-[2px_2px_0px_0px_rgba(51,65,85,0.35)]'
                              : 'border-black bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-bold text-sm flex-1">
                            <div>{t(entry.homeName)}</div>
                            <div className="mt-1" />
                            <div>{t(entry.awayName)}</div>
                          </div>
                          <div className="w-14 text-center shrink-0">
                            {entry.completed ? (
                              <div className="border border-black bg-gray-50 px-1 py-1 font-mono">
                                <div className="text-[9px] leading-none text-gray-600">FT</div>
                                <div className="text-xs leading-tight font-bold text-black mt-0.5">{entry.scoreText}</div>
                              </div>
                            ) : entry.active ? (
                              <div className="border border-slate-600 bg-white px-1 py-1 font-mono">
                                <div className="text-[9px] leading-none text-slate-600">NEXT</div>
                              </div>
                            ) : null}
                          </div>
                          <div className="text-right text-sm shrink-0">
                            <div>{t(entry.dateText)}</div>
                            <div>{entry.timeText}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              {scheduleEntries.some(entry => entry.type === 'group') ? (
                <div className="border-2 border-black bg-gray-50 p-2">
                  <div className="font-bold text-sm font-mono border-b-2 border-black pb-1 mb-2">{t('世界杯小组赛 H 组')}</div>
                  <div className="grid grid-cols-1 gap-2">
                    {scheduleEntries.filter(entry => entry.type === 'group').map(entry => (
                      <div
                        key={entry.id}
                        className={`border-2 p-2 font-mono ${
                          entry.completed
                            ? 'border-gray-500 bg-gray-200 text-gray-600'
                            : entry.active
                              ? 'border-slate-700 bg-stone-100 shadow-[2px_2px_0px_0px_rgba(51,65,85,0.35)]'
                              : 'border-black bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="font-bold text-sm flex-1">
                            <div>{t(entry.homeName)}</div>
                            <div className="mt-1" />
                            <div>{t(entry.awayName)}</div>
                          </div>
                          <div className="w-14 text-center shrink-0">
                            {entry.completed ? (
                              <div className="border border-black bg-gray-50 px-1 py-1 font-mono">
                                <div className="text-[9px] leading-none text-gray-600">FT</div>
                                <div className="text-xs leading-tight font-bold text-black mt-0.5">{entry.scoreText}</div>
                              </div>
                            ) : entry.active ? (
                              <div className="border border-slate-600 bg-white px-1 py-1 font-mono">
                                <div className="text-[9px] leading-none text-slate-600">NEXT</div>
                              </div>
                            ) : null}
                          </div>
                          <div className="text-right text-sm shrink-0">
                            <div>{t(entry.dateText)}</div>
                            <div>{entry.timeText}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {showComplaintLetters ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40" data-i18n-skip>
          <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-sm font-mono">{t('投诉信')}</div>
              <button onClick={() => setShowComplaintLetters(false)} className="retro-btn text-xs py-1 px-2">{t('关闭')}</button>
            </div>
            {activeComplaintLetter ? (
              <>
                <div className="flex items-center justify-between mb-2 text-[11px] font-mono text-gray-700">
                  <button
                    onClick={() => setComplaintLetterIndex(index => Math.max(0, index - 1))}
                    disabled={complaintLetterIndex === 0}
                    className={`retro-btn text-xs py-1 px-2 ${complaintLetterIndex === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {t('上一封')}
                  </button>
                  <div>{complaintLetterIndex + 1} / {complaintLetterHistory.length}</div>
                  <button
                    onClick={() => setComplaintLetterIndex(index => Math.min(complaintLetterHistory.length - 1, index + 1))}
                    disabled={complaintLetterIndex >= complaintLetterHistory.length - 1}
                    className={`retro-btn text-xs py-1 px-2 ${complaintLetterIndex >= complaintLetterHistory.length - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {t('下一封')}
                  </button>
                </div>
                <div key={`${activeComplaintLetter.id}:${language}`} className="border-2 border-black bg-gray-50 p-3">
                  <div className="font-bold text-sm font-mono mb-2" data-i18n-skip>{localizedActiveComplaint.title}</div>
                  <div className="text-xs font-mono text-black leading-relaxed whitespace-pre-wrap" data-i18n-skip>
                    {renderFormattedText(localizedActiveComplaint.description)}
                  </div>
                  {activeComplaintLetter.dateText ? (
                    <div className="mt-3 text-[10px] text-gray-600 font-mono">{t(activeComplaintLetter.dateText)}</div>
                  ) : null}
                </div>
              </>
            ) : (
              <div className="border-2 border-black bg-gray-50 p-3 text-xs font-mono text-gray-700 leading-relaxed">
                {t('当前还没有可翻阅的投诉信内容。')}
              </div>
            )}
          </div>
        </div>
      ) : null}

      <div className="mb-2 border-b-2 border-black pb-1">
        <div className="flex items-start justify-between gap-2">
          <h2 className="text-base font-bold font-mono uppercase" data-i18n-skip>{t(currentTeam.name)} | {t('主帅：')}{playerName}</h2>
          {topActions ? (
            <div className="flex shrink-0 items-center gap-1">
              {topActions}
            </div>
          ) : null}
        </div>
        <div className="mt-1 flex items-start justify-between gap-2" data-i18n-skip>
          <div className="flex gap-2">
            <button onClick={() => setShowTable(true)} className="retro-btn text-[11px] py-1 px-2" data-onboard-id="challenge_schedule_button">
              {t('查看赛程')}
            </button>
          </div>
          <div className="shrink-0 max-w-[12rem] text-[10px] sm:text-xs font-mono text-right leading-tight border border-black bg-gray-50 px-2 py-1">
            <div>{phaseText(challenge, t)}</div>
            <div>{challenge?.matchCounter || 0}{t('场比赛')}</div>
            {opponent ? <div>{t('下场：')}{t(opponent.name)}</div> : null}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5" data-i18n-skip>
        <StatBar
          onboardId="challenge_stat_dressing_room"
          label={
            <span className="inline-flex items-center gap-1">
              <span className="font-bold">{t('更衣室稳定')}</span>
              <InfoButton label={t('查看属性说明')} onClick={() => openInfo('dressingRoom')} />
            </span>
          }
          value={stats.dressingRoom ?? 0}
        />
        <StatBar
          onboardId="challenge_stat_authority"
          label={
            <span className="inline-flex items-center gap-1">
              <span className="font-bold">{t('权威')}</span>
              <InfoButton label={t('查看属性说明')} onClick={() => openInfo('authority')} />
            </span>
          }
          value={stats.authority ?? 0}
        />
        <StatBar
          onboardId="challenge_stat_media_support"
          label={
            <span className="inline-flex items-center gap-1">
              <span className="font-bold">{t('媒体支持')}</span>
              <InfoButton label={t('查看属性说明')} onClick={() => openInfo('mediaSupport')} />
            </span>
          }
          value={stats.mediaSupport ?? 0}
          max={mediaSupportCap}
        />
        <StatBar
          onboardId="challenge_stat_fatigue"
          label={
            <span className="inline-flex items-center gap-1">
              <span className="font-bold">{t('球队疲惫')}</span>
              <InfoButton label={t('查看属性说明')} onClick={() => openInfo('fatigue')} />
            </span>
          }
          value={stats.fatigue ?? 0}
        />
        <div className="mb-1" data-onboard-id="challenge_stat_tactics">
          <div className="flex justify-between text-[11px] mb-0.5 font-mono">
            <span className="inline-flex items-center gap-1">
              <span className="font-bold">{t('技战术水平')}</span>
              <InfoButton label={t('查看属性说明')} onClick={() => openInfo('tactics')} />
            </span>
            <span>{stats.tactics ?? 0}/10</span>
          </div>
          <div className="retro-progress-container">
            <div className="retro-progress-bar" style={{ width: `${Math.min(100, Math.max(0, ((stats.tactics ?? 0) / 10) * 100))}%` }} />
          </div>
        </div>
        <div className="mb-1" data-onboard-id="challenge_points_ranking">
          <div className="flex justify-between text-[11px] mb-0.5 font-mono">
            <span className="font-bold">{t('积分 / 排名')}</span>
            <span>{pointsRankingText(challenge, stats, t)}</span>
          </div>
        </div>
      </div>

      <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono" data-i18n-skip>
        <div
          data-onboard-id="challenge_complaints"
          role="button"
          tabIndex={0}
          onClick={() => {
            setComplaintLetterIndex(0);
            setShowComplaintLetters(true);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setComplaintLetterIndex(0);
              setShowComplaintLetters(true);
            }
          }}
          className={`border-2 border-black p-2 bg-white text-left ${complaintLetters > 0 || complaintLetterHistory.length > 0 ? 'hover:bg-gray-100 cursor-pointer' : 'cursor-pointer'} focus:outline-none focus:ring-2 focus:ring-black`}
        >
          <div className="font-bold">{t('投诉信')}</div>
          <div className="mt-1">{complaintLetters > 0 ? `✉️ x${complaintLetters}` : t('暂无投诉信')}</div>
        </div>
        <div className="border-2 border-black p-2 bg-white" data-onboard-id="challenge_negative_news">
          <div className="font-bold">{t('负面新闻')}</div>
          <div className="mt-1">
            {visibleNegativeNews.length > 0
              ? t(`📰 x${visibleNegativeNews.length} · 媒体支持上限 -${negativeNewsPenalty}`)
              : t('暂无负面新闻')}
          </div>
        </div>
      </div>

      <div className="retro-box p-2 mt-2" data-onboard-id="challenge_status_pool" data-i18n-skip>
        <div className="flex items-center justify-between border-b-2 border-black pb-1 mb-2">
          <h3 className="text-sm font-bold font-mono uppercase">{t('状态')}</h3>
          <button
            onClick={() => setShowStatusCards(value => !value)}
            className="retro-btn text-[10px] py-1 px-2"
          >
            {showStatusCards ? t('收起') : t(`展开${statusCards.length > 0 ? `（${statusCards.length}）` : ''}`)}
          </button>
        </div>
        {!showStatusCards ? null : statusCards.length === 0 ? (
          <div className="text-gray-500 font-mono italic text-center py-2 text-xs">
            {t('当前无特殊状态')}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2">
            {statusCards.map(card => {
              const isBuff = card.tone === 'buff';
              return (
                <div
                  key={card.id}
                  className={`border-2 p-2 flex items-start gap-2 ${
                    isBuff ? 'border-green-800 bg-green-100' : 'border-red-800 bg-red-100'
                  }`}
                >
                  <div className="text-base">{card.icon}</div>
                  <div className="flex-1">
                    <div className={`font-bold text-xs ${isBuff ? 'text-green-900' : 'text-red-900'}`}>{t(card.name)}</div>
                    <div className="text-[10px] text-gray-700 font-mono leading-tight">{t(card.description)}</div>
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
