"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";
import type { UserProfile } from "@/lib/types";

type HeaderProps = {
  weekId: string;
  user: UserProfile | null;
  onLoginClick: () => void;
  onLogout: () => void;
};

export default function Header({ weekId, user, onLoginClick, onLogout }: HeaderProps) {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="flex flex-col gap-6 rounded-3xl border border-white/30 bg-white/80 px-6 py-6 shadow-xl shadow-slate-200/50 backdrop-blur dark:border-white/10 dark:bg-slate-900/70 dark:shadow-slate-950/40">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {t("schedule")}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white sm:text-3xl">
            {t("app_name")}
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
            {t("week")}: <span className="font-mono">{weekId}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-200/70 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <span>{t("language")}</span>
            <button
              type="button"
              onClick={() => setLang("en")}
              className={`rounded-full px-2 py-1 text-[11px] transition ${
                lang === "en"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang("de")}
              className={`rounded-full px-2 py-1 text-[11px] transition ${
                lang === "de"
                  ? "bg-emerald-600 text-white"
                  : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              DE
            </button>
          </div>
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full border border-slate-200/70 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-200"
          >
            {t("theme")}: {theme === "dark" ? t("dark") : t("light")}
          </button>
        </div>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {user ? (
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {t("hi" as any)}, <span className="font-semibold">{user.username}</span>
            </p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-3 rounded-full border border-slate-200/70 bg-white/80 px-3 py-1.5 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-300">
              <span className="font-semibold">{user.username}</span>
              <span className="font-mono text-slate-500">{user.user_code}</span>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full bg-rose-600 px-3 py-1 text-white"
              >
                Logout
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onLoginClick}
              className="rounded-full border border-emerald-500 bg-emerald-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white"
            >
              Login
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
