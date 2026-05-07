"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import { Info } from "lucide-react";
import AuthModal from "@/components/AuthModal";
import ReservationGrid from "@/components/ReservationGrid";
import { CancelModal, ReservationModal, Slot } from "@/components/ReservationModals";
import { useLanguage } from "@/components/LanguageProvider";
import { useToast } from "@/components/ToastProvider";
import { getDayIndex, getWeekId } from "@/lib/time";
import { Machine, Reservation, UserProfile } from "@/lib/types";
export default function AppShell() {
  const { t } = useLanguage();
  const { addToast } = useToast();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [machinesLoading, setMachinesLoading] = useState(true);
  const [activeMachineId, setActiveMachineId] = useState<string>("");
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [slotModal, setSlotModal] = useState<Slot | null>(null);
  const [cancelModal, setCancelModal] = useState<Reservation | null>(null);
  const [busy, setBusy] = useState(false);

  const weekId = useMemo(() => getWeekId(new Date()), []);
  const todayIndex = useMemo(() => getDayIndex(new Date()), []);

  const loadSession = useCallback(async () => {
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      if (!response.ok) {
        setUser(null);
        return;
      }
      const data = (await response.json()) as { user: UserProfile | null };
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    }
  }, []);

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

  const refreshReservations = useCallback(async () => {
    setRefreshing(true);
    try {
      const response = await fetch(`/api/reservations?week_id=${weekId}`, { cache: "no-store" });
      if (!response.ok) return;
      const data = (await response.json()) as { reservations: Reservation[] };
      setReservations(data.reservations ?? []);
    } finally {
      setRefreshing(false);
    }
  }, [weekId]);

  useEffect(() => {
    loadSession();
    loadReservations();
  }, [loadReservations, loadSession]);

  useEffect(() => {
    (async () => {
      try {
        setMachinesLoading(true);
        const res = await fetch("/api/machines", { cache: "no-store" });
        if (!res.ok) throw new Error("fetch failed");
        const data = (await res.json().catch(() => null)) as { machines?: Machine[] } | null;
        const list = Array.isArray(data?.machines) ? (data!.machines as Machine[]) : [];
        setMachines(list);
        if (list.length > 0) {
          const firstEnabled = list.find((m) => m.enabled) ?? list[0];
          setActiveMachineId(firstEnabled?.id ?? "");
        } else {
          setActiveMachineId("");
        }
      } catch {
        // Fallback: no machines loaded; leave list empty to avoid crashes
        setMachines([]);
        setActiveMachineId("");
      } finally {
        setMachinesLoading(false);
      }
    })();
  }, []);

  // Ensure active machine is always an enabled one if available
  useEffect(() => {
    if (machines.length === 0) {
      if (activeMachineId) setActiveMachineId("");
      return;
    }
    const active = machines.find((m) => m.id === activeMachineId);
    if (!active || !active.enabled) {
      const firstEnabled = machines.find((m) => m.enabled);
      if (firstEnabled) {
        setActiveMachineId(firstEnabled.id);
      } else if (!active) {
        // No enabled machines; keep empty selection
        setActiveMachineId("");
      }
    }
  }, [machines, activeMachineId]);

  const handleLogin = async (matriculation: string) => {
    setAuthBusy(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matriculation }),
      });

      if (!response.ok) {
        addToast({ type: "error", message: t("login_failed") });
        return;
      }

      const data = (await response.json()) as { user: UserProfile };
      setUser(data.user);
      setAuthModalOpen(false);
      addToast({ type: "success", message: t("login_success") });
    } finally {
      setAuthBusy(false);
    }
  };

  const handleRegister = async (payload: {
    matriculation: string;
    username: string;
    wing: string;
    floor: number;
    door: number;
  }) => {
    setAuthBusy(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        addToast({ type: "error", message: t("register_failed") });
        return;
      }

      const data = (await response.json()) as { user: UserProfile };
      setUser(data.user);
      setAuthModalOpen(false);
      addToast({ type: "success", message: t("register_success") });
    } finally {
      setAuthBusy(false);
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    addToast({ type: "success", message: t("logout_success") });
  };

  const handleReserve = async (slot: Slot, code: string) => {
    if (!user) {
      setAuthModalOpen(true);
      addToast({ type: "error", message: t("auth_required") });
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          machine_id: slot.machineId,
          day: slot.day,
          hour: slot.hour,
          week_id: weekId,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 409 && error?.error === "MAX_RESERVATIONS") {
          addToast({ type: "error", message: t("max_reservations_reached") });
        } else if (response.status === 409 && error?.error === "SLOT_UNAVAILABLE") {
          addToast({ type: "error", message: t("slot_unavailable") });
        } else if (response.status === 429 && error?.error === "RATE_LIMITED") {
          addToast({ type: "error", message: t("rate_limited") });
        } else if (response.status === 401) {
          addToast({ type: "error", message: t("auth_required") });
        } else {
          addToast({ type: "error", message: t("reservation_failed") });
        }
        return;
      }

      const data = (await response.json()) as { reservation: Reservation };
      addToast({ type: "success", message: t("reservation_created") });
      setSlotModal(null);
      // Actualización parcial sin refetch: añadir la nueva reserva
      setReservations((prev) => [...prev, data.reservation]);
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async (reservation: Reservation, code: string) => {
    if (!user) {
      setAuthModalOpen(true);
      addToast({ type: "error", message: t("auth_required") });
      return;
    }
    setBusy(true);
    try {
      const response = await fetch(`/api/reservations/${reservation.id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        if (response.status === 429 && error?.error === "RATE_LIMITED") {
          addToast({ type: "error", message: t("rate_limited") });
        } else if (response.status === 401) {
          addToast({ type: "error", message: t("auth_required") });
        } else if (response.status === 403) {
          addToast({ type: "error", message: t("not_allowed") });
        } else {
          addToast({ type: "error", message: t("cancel_failed") });
        }
        return;
      }

      addToast({ type: "success", message: t("reservation_cancelled") });
      setCancelModal(null);
      // Actualización parcial sin refetch: quitar la reserva eliminada
      setReservations((prev) => prev.filter((r) => r.id !== reservation.id));
    } finally {
      setBusy(false);
    }
  };

  const handleSlotClick = (day: number, hour: number, reservation?: Reservation) => {
    if (reservation) {
      if (!user || reservation.user_id !== user.id) {
        addToast({ type: "error", message: t("not_allowed") });
        return;
      }
      setCancelModal(reservation);
    } else {
      if (!user) {
        setAuthModalOpen(true);
        addToast({ type: "error", message: t("auth_required") });
        return;
      }
      if (!activeMachineId) return;
      const label = machines.find((m) => m.id === activeMachineId)?.label ?? "";
      setSlotModal({ machineId: activeMachineId, machineLabel: label, day, hour });
    }
  };

  const userCode = user?.user_code ?? "";

  return (
    <div className="flex min-h-screen flex-col gap-8 px-4 py-8 sm:px-8">
      <Header
        weekId={weekId}
        user={user}
        onLoginClick={() => setAuthModalOpen(true)}
        onLogout={handleLogout}
      />

      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
              {t("select_machine")}
            </p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">
              {machines.find((m) => m.id === activeMachineId)?.label ?? (machinesLoading ? t("loading") : "")}
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {machines.map((m) => (
              <div key={m.id} className="relative group">
                <button
                  type="button"
                  onClick={() => setActiveMachineId(m.id)}
                  disabled={!m.enabled}
                  className={`cursor-pointer rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                    activeMachineId === m.id
                      ? "border-emerald-500 bg-emerald-500 text-white"
                      : "border-slate-200 bg-white/70 text-slate-600 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-200"
                  } ${!m.enabled ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  <span className="mr-2">{m.label}</span>
                  {!m.enabled ? (
                    <Info aria-label={t("machine_disabled_hint" as any)} className="inline h-4 w-4 text-amber-600" />
                  ) : null}
                </button>
                {!m.enabled ? (
                  <div className="pointer-events-none absolute inset-x-0 top-full z-10 mt-2 hidden justify-center group-hover:flex">
                    <div role="tooltip" className="mx-2 inline-block max-w-[90vw] md:max-w-72 break-words whitespace-normal rounded-md border border-slate-200 bg-white px-3 py-2 text-xs text-slate-700 shadow dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                      {t("machine_disabled_hint" as any)}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
            {!machinesLoading && machines.length === 0 ? (
              <div className="rounded-full border border-dashed px-4 py-2 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
                {t("no_machines" as any)}
              </div>
            ) : null}
          </div>
        </div>
        {loading ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
            {t("loading")}
          </div>
        ) : (
          <>
            {(() => {
              const sel = machines.find((m) => m.id === activeMachineId);
              if (machinesLoading) {
                return (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                    {t("loading")}
                  </div>
                );
              }
              if (machines.length === 0) {
                return (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                    {t("no_machines" as any)}
                  </div>
                );
              }
              if (!sel || !sel.enabled) {
                return (
                  <div className="rounded-3xl border border-dashed border-amber-300 bg-amber-50/80 px-6 py-6 text-center text-sm text-amber-700 dark:border-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                    {t("machine_disabled_hint" as any)}
                  </div>
                );
              }
              return (
                <>
                  {reservations.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white/70 px-6 py-4 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-300">
                      {t("no_reservations")}
                    </div>
                  ) : null}
                  <ReservationGrid
                    machineId={activeMachineId}
                    reservations={reservations}
                    userId={user?.id ?? ""}
                    onSlotClick={handleSlotClick}
                    autoScrollDayIndex={todayIndex}
                  />
                  {refreshing ? (
                    <div className="mt-2 text-center text-xs text-slate-400">{t("loading")}</div>
                  ) : null}
                </>
              );
            })()}
          </>
        )}
      </section>

      <ReservationModal
        open={!!slotModal}
        slot={slotModal}
        onClose={() => setSlotModal(null)}
        onConfirm={(slot) => handleReserve(slot, userCode)}
        busy={busy}
      />
      <CancelModal
        open={!!cancelModal}
        reservation={cancelModal}
        onClose={() => setCancelModal(null)}
        onConfirm={(reservation) => handleCancel(reservation, userCode)}
        busy={busy}
      />
      <AuthModal
        open={authModalOpen}
        busy={authBusy}
        onClose={() => setAuthModalOpen(false)}
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    </div>
  );
}
