"use client";

import Modal from "@/components/Modal";
import { useLanguage } from "@/components/LanguageProvider";
import { hourLabel, DAY_KEYS } from "@/lib/time";
import { Reservation } from "@/lib/types";

export type Slot = {
  machineId: string;
  machineLabel: string;
  day: number;
  hour: number;
};

type ReservationModalProps = {
  open: boolean;
  slot: Slot | null;
  onClose: () => void;
  onConfirm: (slot: Slot) => void;
  busy?: boolean;
};

type CancelModalProps = {
  open: boolean;
  reservation: Reservation | null;
  onClose: () => void;
  onConfirm: (reservation: Reservation) => void;
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
      <div className="mt-1 text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">{slot.machineLabel}</div>
    </div>
  );
}

export function ReservationModal({
  open,
  slot,
  onClose,
  onConfirm,
  busy,
}: ReservationModalProps) {
  const { t } = useLanguage();

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
            disabled={!!busy}
            onClick={() => onConfirm(slot)}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-400/60"
          >
            {t("reserve")}
          </button>
        </>
      }
    >
      <SlotSummary slot={slot} />
      <p className="text-sm text-slate-600 dark:text-slate-300">{t("reservation_auth_notice")}</p>
    </Modal>
  );
}

export function CancelModal({
  open,
  reservation,
  onClose,
  onConfirm,
  busy,
}: CancelModalProps) {
  const { t } = useLanguage();

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
            disabled={!!busy}
            onClick={() => onConfirm(reservation)}
            className="rounded-full bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:bg-rose-400/60"
          >
            {t("confirm_cancel")}
          </button>
        </>
      }
    >
      <SlotSummary slot={{ machineId: reservation.machine_id, machineLabel: "", day: reservation.day, hour: reservation.hour }} />
      <p className="text-sm text-slate-600 dark:text-slate-300">{t("cancellation_auth_notice")}</p>
    </Modal>
  );
}
