"use client";

import { useState } from "react";
import Modal from "@/components/Modal";
import { useLanguage } from "@/components/LanguageProvider";

type RequestPayload = {
  email: string;
};

type AuthModalProps = {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onLogin: (email: string, password: string) => void;
  onRegister: (payload: RequestPayload) => void;
};

export default function AuthModal({ open, busy, onClose, onLogin, onRegister }: AuthModalProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"login" | "request">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const submitDisabled = busy || email.trim().length === 0 || (mode === "login" && password.length === 0);

  return (
    <Modal
      open={open}
      title={mode === "login" ? t("login") : t("request_access")}
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
            disabled={submitDisabled}
            onClick={() => {
              if (mode === "login") {
                onLogin(email.trim(), password);
              } else {
                onRegister({ email: email.trim() });
              }
            }}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-400/60"
          >
            {mode === "login" ? t("sign_in") : t("send_request")}
          </button>
        </>
      }
    >
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("login")}
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
            mode === "login"
              ? "bg-emerald-600 text-white"
              : "border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300"
          }`}
        >
          {t("login")}
        </button>
        <button
          type="button"
          onClick={() => setMode("request")}
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
            mode === "request"
              ? "bg-emerald-600 text-white"
              : "border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300"
          }`}
        >
          {t("request_access")}
        </button>
      </div>

      <div className="grid gap-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t("email")}
        </label>
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder={t("email_placeholder")}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30"
        />
      </div>

      {mode === "login" ? (
        <div className="grid gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("password")}
          </label>
          <div className="flex items-center gap-2">
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder={t("password_placeholder")}
              className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
            >
              {showPassword ? t("hide_password") : t("show_password")}
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{t("password_login_hint")}</p>
        </div>
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">{t("request_access_hint")}</p>
      )}
    </Modal>
  );
}
