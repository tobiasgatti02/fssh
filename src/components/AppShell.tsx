"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import ReservationGrid from "@/components/ReservationGrid";
import { CancelModal, ReservationModal, Slot } from "@/components/ReservationModals";
import { useLanguage } from "@/components/LanguageProvider";
import { useToast } from "@/components/ToastProvider";
import { getDayIndex, getWeekId } from "@/lib/time";
import { Machine, Reservation } from "@/lib/types";
import { normalizeUserCode } from "@/lib/validation";

const MACHINES: Machine[] = ["washer1", "washer2", "dryer"];
const USER_CODE_STORAGE_KEY = "laundry_user_code";

export default function AppShell() {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [activeMachine, setActiveMachine] = useState<Machine>("washer1");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCode, setUserCode] = useState("");
  const [slotModal, setSlotModal] = useState<Slot | null>(null);
  const [cancelModal, setCancelModal] = useState<Reservation | null>(null);
  const [busy, setBusy] = useState(false);

  const weekId = useMemo(() => getWeekId(new Date()), []);
  const todayIndex = useMemo(() => getDayIndex(new Date()), []);

  useEffect(() => {
    const stored = localStorage.getItem(USER_CODE_STORAGE_KEY);
    if (stored) {
      setUserCode(stored);
    }
  }, []);

  useEffect(() => {
    if (userCode) {
      localStorage.setItem(USER_CODE_STORAGE_KEY, userCode);
    } else {
      localStorage.removeItem(USER_CODE_STORAGE_KEY);
    }
  }, [userCode]);

  const loadReservations = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/reservations?week_id=${weekId}`, {
        cache: "no-store",
      });
      if (!response.ok) {
        throw new Error("fetch failed");
      }
      const data = (await response.json()) as { reservations: Reservation[] };
      setReservations(data.reservations ?? []);
    } catch {
      addToast({ type: "error", message: t("fetch_failed") });
    } finally {
      setLoading(false);
    }
  }, [addToast, t, weekId]);

  useEffect(() => {
    loadReservations();
  }, [loadReservations]);

  const handleReserve = async (slot: Slot, code: string) => {
    setBusy(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machine: slot.machine,
          day: slot.day,
          hour: slot.hour,
          week_id: weekId,
          user_code: code,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 409 && error?.error === "MAX_RESERVATIONS") {
          addToast({ type: "error", message: t("max_reservations_reached") });
        } else if (response.status === 409 && error?.error === "SLOT_UNAVAILABLE") {
          addToast({ type: "error", message: t("slot_unavailable") });
        } else {
          addToast({ type: "error", message: t("reservation_failed") });
        }
        return;
      }

      addToast({ type: "success", message: t("reservation_created") });
      setSlotModal(null);
      await loadReservations();
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async (reservation: Reservation, code: string) => {
    setBusy(true);
    try {
      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_code: code }),
      });

      if (!response.ok) {
        addToast({ type: "error", message: t("cancel_failed") });
        return;
      }

      addToast({ type: "success", message: t("reservation_cancelled") });
      setCancelModal(null);
      await loadReservations();
    } finally {
      setBusy(false);
    }
  };

  const handleSlotClick = (day: number, hour: number, reservation?: Reservation) => {
    if (reservation) {
      setCancelModal(reservation);
    } else {
      setSlotModal({ machine: activeMachine, day, hour });
    }
  };

  const normalizedUserCode = normalizeUserCode(userCode);

  return (
    <div className="flex min-h-screen flex-col gap-8 px-4 py-8 sm:px-8">
      <Header
        weekId={weekId}
        userCode={userCode}
        onUserCodeChange={(value) => setUserCode(normalizeUserCode(value))}
      />

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {t("select_machine")}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {t(`machine_${activeMachine}` as const)}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {MACHINES.map((machine) => (
              <button
                key={machine}
                type="button"
                onClick={() => setActiveMachine(machine)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                  activeMachine === machine
                    ? "border-emerald-500 bg-emerald-500 text-white"
                    : "border-slate-200 bg-white/70 text-slate-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-200"
                }`}
              >
                {t(`machine_${machine}` as const)}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
            {t("loading")}
          </div>
        ) : (
          <>
            {reservations.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                {t("no_reservations")}
              </div>
            ) : null}
            <ReservationGrid
              machine={activeMachine}
              reservations={reservations}
              userCode={normalizedUserCode}
              onSlotClick={handleSlotClick}
              autoScrollDayIndex={todayIndex}
            />
          </>
        )}
      </section>

      <ReservationModal
        open={!!slotModal}
        slot={slotModal}
        userCode={normalizedUserCode}
        onClose={() => setSlotModal(null)}
        onConfirm={handleReserve}
        busy={busy}
      />
      <CancelModal
        open={!!cancelModal}
        reservation={cancelModal}
        userCode={normalizedUserCode}
        onClose={() => setCancelModal(null)}
        onConfirm={handleCancel}
        busy={busy}
      />
    </div>
  );
}
