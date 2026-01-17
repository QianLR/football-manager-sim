import React, { useEffect, useMemo, useState } from 'react';
import { useGame } from '../context/GameContextInstance';

const AUTO_SAVE_KEY = 'gsm_save_auto_latest';
const MANUAL_SAVE_KEY_PREFIX = 'gsm_save_manual_';
const MANUAL_SLOTS_KEY = 'gsm_save_manual_slots_v2';

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

  useEffect(() => {
    if (!open) return;
    migrateLegacyManualSavesIfNeeded();
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/40">
      <div className="bg-white border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] max-w-2xl w-full p-3">
        <div className="flex items-center justify-between mb-2">
          <div className="font-bold text-sm font-mono">存档</div>
          <button
            onClick={() => {
              setConfirmSlot(null);
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
