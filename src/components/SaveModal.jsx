import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../context/GameContextInstance';

const AUTO_SAVE_KEY = 'gsm_save_auto_latest';
const MANUAL_SAVE_KEY_PREFIX = 'gsm_save_manual_';
const MANUAL_SLOTS_KEY = 'gsm_save_manual_slots_v2';
const GLOBAL_ACHIEVEMENTS_KEY = 'gsm_achievements_global_v1';

const SAVE_EXPORT_VERSION = 1;

function readRawJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safeStringify(obj) {
  try {
    return JSON.stringify(obj);
  } catch {
    return '';
  }
}

function readSave(key) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.state) return null;
    return parsed;
  } catch {
    return null;
  }
}

function formatSavedAt(savedAt) {
  try {
    return new Date(savedAt).toLocaleString();
  } catch {
    return savedAt;
  }
}

function readManualSlotsV2() {
  try {
    const raw = localStorage.getItem(MANUAL_SLOTS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const slots = parsed?.slots;
    if (!Array.isArray(slots) || slots.length !== 8) return null;
    return slots.map(s => (s && s.state ? s : null));
  } catch {
    return null;
  }
}

function writeManualSlotsV2(slots) {
  try {
    const next = Array.isArray(slots) ? slots.slice(0, 8) : [];
    while (next.length < 8) next.push(null);
    localStorage.setItem(MANUAL_SLOTS_KEY, JSON.stringify({ slots: next }));
  } catch {
    return;
  }
}

function migrateLegacyManualSavesIfNeeded() {
  const existing = readManualSlotsV2();
  if (existing) return existing;

  const legacy1 = readSave(`${MANUAL_SAVE_KEY_PREFIX}1`);
  const legacy2 = readSave(`${MANUAL_SAVE_KEY_PREFIX}2`);
  const legacy3 = readSave(`${MANUAL_SAVE_KEY_PREFIX}3`);
  const slots = Array(8).fill(null);
  if (legacy1) slots[0] = legacy1;
  if (legacy2) slots[1] = legacy2;
  if (legacy3) slots[2] = legacy3;

  if (slots.some(Boolean)) {
    writeManualSlotsV2(slots);
  }
  return slots;
}

export default function SaveModal({ open, onClose, canSave }) {
  const { state, dispatch } = useGame();
  const [confirmSlot, setConfirmSlot] = useState(null);
  const [exportText, setExportText] = useState('');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importOk, setImportOk] = useState('');
  const [confirmImport, setConfirmImport] = useState(false);

  useEffect(() => {
    if (!open) return;
    migrateLegacyManualSavesIfNeeded();
  }, [open]);

  const globalAchievements = useMemo(() => {
    if (!open) return null;
    return readRawJson(GLOBAL_ACHIEVEMENTS_KEY);
  }, [open]);

  const autoSave = useMemo(() => {
    if (!open) return null;
    return readSave(AUTO_SAVE_KEY);
  }, [open, state.pendingSave]);

  const manualSlots = useMemo(() => {
    if (!open) return Array(8).fill(null);
    const slots = migrateLegacyManualSavesIfNeeded();
    if (Array.isArray(slots) && slots.length === 8) return slots;
    return Array(8).fill(null);
  }, [open, state.pendingSave]);

  if (!open) return null;

  const buildExportPayload = () => {
    const auto = readRawJson(AUTO_SAVE_KEY);
    const manualSlotsV2 = readRawJson(MANUAL_SLOTS_KEY);
    const legacy1 = readRawJson(`${MANUAL_SAVE_KEY_PREFIX}1`);
    const legacy2 = readRawJson(`${MANUAL_SAVE_KEY_PREFIX}2`);
    const legacy3 = readRawJson(`${MANUAL_SAVE_KEY_PREFIX}3`);
    const global = readRawJson(GLOBAL_ACHIEVEMENTS_KEY);

    return {
      exportVersion: SAVE_EXPORT_VERSION,
      exportedAt: new Date().toISOString(),
      keys: {
        [AUTO_SAVE_KEY]: auto,
        [MANUAL_SLOTS_KEY]: manualSlotsV2,
        [`${MANUAL_SAVE_KEY_PREFIX}1`]: legacy1,
        [`${MANUAL_SAVE_KEY_PREFIX}2`]: legacy2,
        [`${MANUAL_SAVE_KEY_PREFIX}3`]: legacy3,
        [GLOBAL_ACHIEVEMENTS_KEY]: global
      }
    };
  };

  const validateImportPayload = (obj) => {
    if (!obj || typeof obj !== 'object') return { ok: false, error: '导入失败：不是有效的对象。' };
    if (obj.exportVersion !== SAVE_EXPORT_VERSION) {
      return { ok: false, error: `导入失败：版本不兼容（exportVersion=${String(obj.exportVersion)}）。` };
    }
    if (!obj.keys || typeof obj.keys !== 'object') return { ok: false, error: '导入失败：缺少 keys 字段。' };
    return { ok: true, error: '' };
  };

  const writeImportPayload = (obj) => {
    const keys = obj?.keys || {};

    const auto = keys[AUTO_SAVE_KEY] ?? null;
    const manualSlotsV2 = keys[MANUAL_SLOTS_KEY] ?? null;
    const legacy1 = keys[`${MANUAL_SAVE_KEY_PREFIX}1`] ?? null;
    const legacy2 = keys[`${MANUAL_SAVE_KEY_PREFIX}2`] ?? null;
    const legacy3 = keys[`${MANUAL_SAVE_KEY_PREFIX}3`] ?? null;
    const global = keys[GLOBAL_ACHIEVEMENTS_KEY] ?? null;

    if (auto) localStorage.setItem(AUTO_SAVE_KEY, safeStringify(auto));
    else localStorage.removeItem(AUTO_SAVE_KEY);

    if (manualSlotsV2) localStorage.setItem(MANUAL_SLOTS_KEY, safeStringify(manualSlotsV2));
    else localStorage.removeItem(MANUAL_SLOTS_KEY);

    if (legacy1) localStorage.setItem(`${MANUAL_SAVE_KEY_PREFIX}1`, safeStringify(legacy1));
    else localStorage.removeItem(`${MANUAL_SAVE_KEY_PREFIX}1`);

    if (legacy2) localStorage.setItem(`${MANUAL_SAVE_KEY_PREFIX}2`, safeStringify(legacy2));
    else localStorage.removeItem(`${MANUAL_SAVE_KEY_PREFIX}2`);

    if (legacy3) localStorage.setItem(`${MANUAL_SAVE_KEY_PREFIX}3`, safeStringify(legacy3));
    else localStorage.removeItem(`${MANUAL_SAVE_KEY_PREFIX}3`);

    if (global && typeof global === 'object') localStorage.setItem(GLOBAL_ACHIEVEMENTS_KEY, safeStringify(global));
    else localStorage.removeItem(GLOBAL_ACHIEVEMENTS_KEY);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-sm font-mono">存档</div>
          <button
            onClick={() => {
              setConfirmSlot(null);
              setExportText('');
              setImportText('');
              setImportError('');
              setImportOk('');
              setConfirmImport(false);
              onClose();
            }}
            className="retro-btn text-xs py-1 px-2"
          >
            关闭
          </button>
        </div>

        {confirmSlot !== null && (
          <div className="mb-3 border-2 border-black p-2">
            <div className="font-bold text-xs font-mono mb-2">确认覆盖</div>
            <div className="text-[11px] text-gray-800 font-mono leading-snug">
              你确认要覆盖手动槽位 {confirmSlot} 吗？
            </div>
            <div className="mt-2 flex justify-end gap-2">
              <button
                onClick={() => setConfirmSlot(null)}
                className="retro-btn text-xs py-1 px-2"
              >
                取消
              </button>
              <button
                onClick={() => {
                  dispatch({ type: 'REQUEST_MANUAL_SAVE', payload: { slot: confirmSlot } });
                  setConfirmSlot(null);
                }}
                className="retro-btn-primary text-xs py-1 px-2"
              >
                覆盖保存
              </button>
            </div>
          </div>
        )}

        <div className="border-2 border-black p-2 mb-3">
          <div className="text-xs font-bold font-mono mb-1">自动存档（最新）</div>
          {autoSave ? (
            <>
              <div className="text-[11px] text-gray-700 font-mono leading-snug">
                {autoSave.meta?.teamName} | 教练：{autoSave.meta?.playerName}
                <br />
                {autoSave.meta?.year ? `第${autoSave.meta.year}年` : ''} {autoSave.meta?.quarter ? `第${autoSave.meta.quarter}季度` : ''} {autoSave.meta?.month ? `第${autoSave.meta.month}个月` : ''}
                <br />
                {autoSave.meta?.savedAt ? formatSavedAt(autoSave.meta.savedAt) : ''}
              </div>
              <button
                onClick={() => {
                  dispatch({ type: 'LOAD_GAME', payload: autoSave.state });
                  onClose();
                }}
                className="retro-btn-primary text-xs py-1 px-2 mt-2"
              >
                读取（自动存档）
              </button>
            </>
          ) : (
            <div className="text-[11px] text-gray-500 font-mono">暂无自动存档</div>
          )}
        </div>

        <div className="border-2 border-black p-2 mb-3">
          <div className="text-xs font-bold font-mono mb-1">存档迁移（导出 / 导入）</div>
          <div className="text-[11px] text-gray-700 font-mono leading-snug">
            说明：导入将覆盖本域名下的存档与全局成就。建议先导出备份。
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <button
              onClick={() => {
                const payload = buildExportPayload();
                const text = safeStringify(payload);
                setExportText(text);
              }}
              className="retro-btn text-xs py-1 px-2"
            >
              生成导出文本
            </button>
            <button
              onClick={async () => {
                try {
                  if (!exportText) return;
                  await navigator.clipboard.writeText(exportText);
                  setImportOk('已复制到剪贴板');
                  setImportError('');
                } catch {
                  setImportError('复制失败：浏览器不允许访问剪贴板，请手动全选复制。');
                  setImportOk('');
                }
              }}
              disabled={!exportText}
              className={`retro-btn text-xs py-1 px-2 ${exportText ? '' : 'opacity-50 cursor-not-allowed'}`}
            >
              复制导出文本
            </button>
            <button
              onClick={() => {
                setExportText('');
                setImportOk('');
                setImportError('');
              }}
              className="retro-btn text-xs py-1 px-2"
            >
              清空
            </button>
          </div>

          {exportText ? (
            <textarea
              className="mt-2 w-full border-2 border-black p-2 font-mono text-[11px] leading-snug h-28"
              value={exportText}
              readOnly
            />
          ) : null}

          <div className="mt-2">
            <div className="text-[11px] text-gray-700 font-mono mb-1">粘贴导入文本：</div>
            <textarea
              className="w-full border-2 border-black p-2 font-mono text-[11px] leading-snug h-28"
              value={importText}
              onChange={(e) => {
                setImportText(e.target.value);
                setImportError('');
                setImportOk('');
                setConfirmImport(false);
              }}
              placeholder="在这里粘贴从旧域名导出的文本"
            />
          </div>

          {importError ? (
            <div className="mt-2 text-[11px] text-red-700 font-mono">{importError}</div>
          ) : null}
          {importOk ? (
            <div className="mt-2 text-[11px] text-green-700 font-mono">{importOk}</div>
          ) : null}

          <div className="mt-2 flex flex-wrap gap-2">
            {!confirmImport ? (
              <button
                onClick={() => {
                  setImportError('');
                  setImportOk('');
                  let parsed = null;
                  try {
                    parsed = JSON.parse(importText);
                  } catch {
                    setImportError('导入失败：文本不是合法 JSON。');
                    return;
                  }

                  const v = validateImportPayload(parsed);
                  if (!v.ok) {
                    setImportError(v.error);
                    return;
                  }

                  setConfirmImport(true);
                }}
                disabled={!importText.trim()}
                className={`retro-btn-primary text-xs py-1 px-2 ${importText.trim() ? '' : 'opacity-50 cursor-not-allowed'}`}
              >
                验证并准备导入
              </button>
            ) : (
              <>
                <button
                  onClick={() => {
                    setConfirmImport(false);
                  }}
                  className="retro-btn text-xs py-1 px-2"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    setImportError('');
                    setImportOk('');
                    let parsed = null;
                    try {
                      parsed = JSON.parse(importText);
                    } catch {
                      setImportError('导入失败：文本不是合法 JSON。');
                      setConfirmImport(false);
                      return;
                    }

                    const v = validateImportPayload(parsed);
                    if (!v.ok) {
                      setImportError(v.error);
                      setConfirmImport(false);
                      return;
                    }

                    try {
                      writeImportPayload(parsed);
                      setImportOk('导入成功：即将刷新页面');
                      setConfirmImport(false);
                      setTimeout(() => window.location.reload(), 300);
                    } catch {
                      setImportError('导入失败：写入本地存储时发生错误。');
                      setConfirmImport(false);
                    }
                  }}
                  className="retro-btn-primary text-xs py-1 px-2"
                >
                  确认导入（覆盖存档与成就）
                </button>
              </>
            )}
          </div>

          <div className="mt-2 text-[11px] text-gray-500 font-mono leading-snug">
            当前全局成就条目数：{globalAchievements && typeof globalAchievements === 'object' ? Object.keys(globalAchievements).length : 0}
          </div>
        </div>

        <div className="text-xs font-bold font-mono mb-2">手动槽位</div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {manualSlots.map((data, idx) => {
            const slot = idx + 1;
            const isEmpty = !data;
            const canLoad = Boolean(data);

            return (
              <div key={slot} className="border-2 border-black p-2">
                <div className="text-xs font-bold font-mono mb-1">手动槽位 {slot}</div>
                {isEmpty ? (
                  <div className="text-[11px] text-gray-500 font-mono">空槽位</div>
                ) : (
                  <div className="text-[11px] text-gray-700 font-mono leading-snug">
                    {data.meta?.teamName} | 教练：{data.meta?.playerName}
                    <br />
                    {data.meta?.year ? `第${data.meta.year}年` : ''} {data.meta?.quarter ? `第${data.meta.quarter}季度` : ''} {data.meta?.month ? `第${data.meta.month}个月` : ''}
                    <br />
                    {data.meta?.savedAt ? formatSavedAt(data.meta.savedAt) : ''}
                  </div>
                )}

                <div className="mt-2 flex gap-2">
                  <button
                    onClick={() => {
                      if (!canLoad) return;
                      dispatch({ type: 'LOAD_GAME', payload: data.state });
                      onClose();
                    }}
                    disabled={!canLoad}
                    className={`retro-btn text-xs py-1 px-2 ${canLoad ? '' : 'opacity-50 cursor-not-allowed'}`}
                  >
                    读取
                  </button>

                  {canSave ? (
                    <button
                      onClick={() => {
                        if (isEmpty) {
                          dispatch({ type: 'REQUEST_MANUAL_SAVE', payload: { slot } });
                          return;
                        }
                        setConfirmSlot(slot);
                      }}
                      className="retro-btn-primary text-xs py-1 px-2"
                    >
                      保存
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
