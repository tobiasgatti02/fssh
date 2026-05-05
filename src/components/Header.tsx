"use client";

import { useLanguage } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";
import { RESERVATION_CODE_REGEX } from "@/lib/validation";

type HeaderProps = {
  weekId: string;
  userCode: string;
  onUserCodeChange: (value: string) => void;
};

export default function Header({ weekId, userCode, onUserCodeChange }: HeaderProps) {
  const { lang, setLang, t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const isValid = RESERVATION_CODE_REGEX.test(userCode);

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
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {t("my_code")}
          </p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{t("code_hint")}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <input
            value={userCode}
            onChange={(event) => onUserCodeChange(event.target.value.toUpperCase())}
            placeholder={t("code_placeholder")}
            className="w-40 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30"
          />
          <span className={`text-xs ${isValid || userCode.length === 0 ? "text-slate-400" : "text-rose-500"}`}>
            {isValid || userCode.length === 0 ? t("code_hint") : t("code_invalid")}
          </span>
        </div>
      </div>
    </header>
  );
}
