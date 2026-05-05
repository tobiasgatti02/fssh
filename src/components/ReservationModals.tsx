"use client";

import { useEffect, useMemo, useState } from "react";
import Modal from "@/components/Modal";
import { useLanguage } from "@/components/LanguageProvider";
import { hourLabel, DAY_KEYS } from "@/lib/time";
import { Machine, Reservation } from "@/lib/types";
import { normalizeUserCode, RESERVATION_CODE_REGEX } from "@/lib/validation";

export type Slot = {
  machine: Machine;
  day: number;
  hour: number;
};

type ReservationModalProps = {
  open: boolean;
  slot: Slot | null;
  userCode: string;
  onClose: () => void;
  onConfirm: (slot: Slot, code: string) => void;
  busy?: boolean;
};

type CancelModalProps = {
  open: boolean;
  reservation: Reservation | null;
  userCode: string;
  onClose: () => void;
  onConfirm: (reservation: Reservation, code: string) => void;
  busy?: boolean;
};

function SlotSummary({ slot }: { slot: Slot }) {
  const { t } = useLanguage();

  const dayKey = DAY_KEYS[slot.day];
  const dayLabel = t(dayKey);

  return (
    <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
      <div className="flex items-center justify-between">
        <span className="font-medium text-slate-900 dark:text-slate-100">{dayLabel}</span>
        <span className="font-mono text-xs text-slate-500 dark:text-slate-300">
          {hourLabel(slot.hour)}
        </span>
      </div>
      <div className="mt-1 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
        {t(`machine_${slot.machine}` as const)}
      </div>
    </div>
  );
}

export function ReservationModal({
  open,
  slot,
  userCode,
  onClose,
  onConfirm,
  busy,
}: ReservationModalProps) {
  const { t } = useLanguage();
  const [code, setCode] = useState(userCode);

  useEffect(() => {
    if (open) {
      setCode(userCode);
    }
  }, [open, userCode]);

  const normalized = useMemo(() => normalizeUserCode(code), [code]);
  const isValid = RESERVATION_CODE_REGEX.test(normalized);

  if (!slot) {
    return null;
  }

  return (
    <Modal
      open={open}
      title={t("reserve_slot")}
      closeLabel={t("close")}
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={!isValid || !!busy}
            onClick={() => onConfirm(slot, normalized)}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-400/60"
          >
            {t("reserve")}
          </button>
        </>
      }
    >
      <SlotSummary slot={slot} />
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t("my_code")}
        </label>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder={t("code_placeholder")}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30"
        />
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{t("code_hint")}</span>
          {!isValid && code.length > 0 ? (
            <span className="text-rose-500">{t("code_invalid")}</span>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}

export function CancelModal({
  open,
  reservation,
  userCode,
  onClose,
  onConfirm,
  busy,
}: CancelModalProps) {
  const { t } = useLanguage();
  const [code, setCode] = useState(userCode);

  useEffect(() => {
    if (open) {
      setCode(userCode);
    }
  }, [open, userCode]);

  const normalized = useMemo(() => normalizeUserCode(code), [code]);
  const isValid = RESERVATION_CODE_REGEX.test(normalized);

  if (!reservation) {
    return null;
  }

  return (
    <Modal
      open={open}
      title={t("cancel_reservation")}
      closeLabel={t("close")}
      onClose={onClose}
      actions={
        <>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-slate-200 px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
          >
            {t("close")}
          </button>
          <button
            type="button"
            disabled={!isValid || !!busy}
            onClick={() => onConfirm(reservation, normalized)}
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-rose-400/60"
          >
            {t("confirm_cancel")}
          </button>
        </>
      }
    >
      <SlotSummary
        slot={{ machine: reservation.machine, day: reservation.day, hour: reservation.hour }}
      />
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t("enter_code_to_cancel")}
        </label>
        <input
          value={code}
          onChange={(event) => setCode(event.target.value.toUpperCase())}
          placeholder={t("code_placeholder")}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-rose-400 focus:ring-2 focus:ring-rose-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-rose-400 dark:focus:ring-rose-400/30"
        />
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>{t("code_hint")}</span>
          {!isValid && code.length > 0 ? (
            <span className="text-rose-500">{t("code_invalid")}</span>
          ) : null}
        </div>
      </div>
    </Modal>
  );
}
