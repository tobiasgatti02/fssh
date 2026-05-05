"use client";

import { useEffect, useMemo, useRef } from "react";
import { useLanguage } from "@/components/LanguageProvider";
import { DAY_KEYS, hourLabel } from "@/lib/time";
import { Machine, Reservation } from "@/lib/types";

const DAY_COLUMN_WIDTH = 140;

type ReservationGridProps = {
  machine: Machine;
  reservations: Reservation[];
  userCode: string;
  onSlotClick: (day: number, hour: number, reservation?: Reservation) => void;
  autoScrollDayIndex: number;
};

export default function ReservationGrid({
  machine,
  reservations,
  userCode,
  onSlotClick,
  autoScrollDayIndex,
}: ReservationGridProps) {
  const { t } = useLanguage();
  const dayRefs = useRef<(HTMLDivElement | null)[]>([]);

  const reservationMap = useMemo(() => {
    const map = new Map<string, Reservation>();
    reservations
      .filter((reservation) => reservation.machine === machine)
      .forEach((reservation) => {
        map.set(`${reservation.day}-${reservation.hour}`, reservation);
      });
    return map;
  }, [reservations, machine]);

  useEffect(() => {
    const target = dayRefs.current[autoScrollDayIndex];
    if (target) {
      target.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [autoScrollDayIndex]);

  const dayLabels = DAY_KEYS.map((key) => t(key));

  return (
    <div className="overflow-x-auto rounded-3xl border border-white/30 bg-white/70 shadow-lg shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:shadow-slate-900/30">
      <div
        className="grid min-w-245"
        style={{ gridTemplateColumns: `90px repeat(7, minmax(${DAY_COLUMN_WIDTH}px, 1fr))` }}
      >
        <div className="border-b border-slate-200/70 bg-white/90 px-3 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-400">
          {t("hour")}
        </div>
        {dayLabels.map((label, index) => (
          <div
            key={label}
            ref={(el) => {
              dayRefs.current[index] = el;
            }}
            className={`border-b border-slate-200/70 px-3 py-4 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200 ${
              index === autoScrollDayIndex
                ? "bg-emerald-50/80 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-100"
                : "bg-white/90 dark:bg-slate-950/70"
            }`}
          >
            <div className="flex items-center justify-between">
              <span>{label}</span>
              {index === autoScrollDayIndex ? (
                <span className="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white">
                  {t("today")}
                </span>
              ) : null}
            </div>
          </div>
        ))}

        {Array.from({ length: 24 }, (_, hour) => hour).map((hour) => (
          <div key={`hour-${hour}`} className="contents">
            <div className="border-b border-slate-200/70 bg-white/80 px-3 py-3 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-950/70 dark:text-slate-400">
              {hourLabel(hour)}
            </div>
            {dayLabels.map((_, day) => {
              const reservation = reservationMap.get(`${day}-${hour}`);
              const owned = reservation && reservation.user_code === userCode;
              const statusLabel = reservation
                ? owned
                  ? t("owned_by_you")
                  : t("occupied")
                : t("available");

              return (
                <button
                  key={`slot-${day}-${hour}`}
                  type="button"
                  onClick={() => onSlotClick(day, hour, reservation)}
                  className={`group flex h-full min-h-16 w-full flex-col items-start justify-between border-b border-l border-slate-200/70 px-3 py-2 text-left text-xs transition hover:bg-emerald-50/70 dark:border-slate-700 dark:hover:bg-emerald-500/10 ${
                    reservation
                      ? owned
                        ? "bg-emerald-100/70 text-emerald-900 dark:bg-emerald-500/15 dark:text-emerald-100"
                        : "bg-slate-100/70 text-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
                      : "bg-white/70 text-slate-600 dark:bg-slate-900/70 dark:text-slate-300"
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">
                    {statusLabel}
                  </div>
                  <div className="flex w-full items-end justify-between">
                    <span className="text-sm font-semibold">
                      {reservation ? reservation.user_code : t("open_slot")}
                    </span>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500">
                      {reservation ? t("reserved_by") : t("reserve")}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
