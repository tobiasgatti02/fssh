"use client";

import { useMemo, useState } from "react";
import Modal from "@/components/Modal";
import { useLanguage } from "@/components/LanguageProvider";
import { buildUserCode } from "@/lib/validation";

type RegisterPayload = {
  matriculation: string;
  username: string;
  wing: string;
  floor: number;
  door: number;
};

type AuthModalProps = {
  open: boolean;
  busy: boolean;
  onClose: () => void;
  onLogin: (matriculation: string) => void;
  onRegister: (payload: RegisterPayload) => void;
};

export default function AuthModal({ open, busy, onClose, onLogin, onRegister }: AuthModalProps) {
  const { t } = useLanguage();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [matriculation, setMatriculation] = useState("");
  const [username, setUsername] = useState("");
  const [wing, setWing] = useState("W");
  const [floor, setFloor] = useState("0");
  const [door, setDoor] = useState("00");

  const previewCode = useMemo(() => {
    const floorNumber = Number(floor);
    const doorNumber = Number(door);
    return buildUserCode(wing, Number.isNaN(floorNumber) ? 0 : floorNumber, Number.isNaN(doorNumber) ? 0 : doorNumber);
  }, [door, floor, wing]);

  const submitDisabled = busy || matriculation.trim().length === 0;

  return (
    <Modal
      open={open}
      title={mode === "login" ? t("login") : t("register")}
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
                onLogin(matriculation.trim());
              } else {
                onRegister({
                  matriculation: matriculation.trim(),
                  username: username.trim(),
                  wing,
                  floor: Number(floor),
                  door: Number(door),
                });
              }
            }}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-emerald-400/60"
          >
            {mode === "login" ? t("sign_in") : t("create_account")}
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
          onClick={() => setMode("register")}
          className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide transition ${
            mode === "register"
              ? "bg-emerald-600 text-white"
              : "border border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300"
          }`}
        >
          {t("register")}
        </button>
      </div>

      <div className="grid gap-3">
        <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {t("matriculation_number")}
        </label>
        <input
          value={matriculation}
          onChange={(event) => setMatriculation(event.target.value)}
          placeholder={t("matriculation_placeholder")}
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30"
        />
      </div>

      {mode === "register" ? (
        <div className="grid gap-3">
          <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
            {t("username")}
          </label>
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder={t("username_placeholder")}
            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30"
          />

          <div className="grid grid-cols-3 gap-3">
            <div className="grid gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("wing")}
              </label>
              <select
                value={wing}
                onChange={(event) => setWing(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30"
              >
                <option value="W">W</option>
                <option value="O">O</option>
                <option value="N">N</option>
              </select>
            </div>
            <div className="grid gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("floor")}
              </label>
              <input
                type="number"
                min={0}
                max={8}
                value={floor}
                onChange={(event) => setFloor(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30"
              />
            </div>
            <div className="grid gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                {t("door")}
              </label>
              <input
                type="number"
                min={0}
                max={99}
                value={door}
                onChange={(event) => setDoor(event.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-emerald-400 focus:ring-2 focus:ring-emerald-200 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:focus:border-emerald-400 dark:focus:ring-emerald-400/30"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200/70 bg-slate-50/80 px-4 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-200">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">
              {t("assigned_code")}
            </div>
            <div className="mt-1 text-lg font-semibold text-emerald-700 dark:text-emerald-200">
              {previewCode}
            </div>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
