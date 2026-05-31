"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Key, Power, PowerOff, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import { useLanguage } from "@/components/LanguageProvider";
import { useTheme } from "@/components/ThemeProvider";

type User = {
  id: string;
  email: string;
  username: string;
  wing: string;
  floor: number;
  door: number;
  user_code: string;
  created_at: string;
  _count: { reservations: number };
};

type AccountRequest = {
  id: string;
  email: string;
  status: string;
  created_at: string;
};

type MachineCfg = {
  id: string;
  name: string;
  label: string;
  enabled: boolean;
  created_at: string;
};

export default function AdminPage() {
  const { t } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [machines, setMachines] = useState<MachineCfg[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [requests, setRequests] = useState<AccountRequest[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [machinesTotal, setMachinesTotal] = useState(0);
  const [reservationsTotal, setReservationsTotal] = useState(0);
  const [requestsTotal, setRequestsTotal] = useState(0);
  const [usersPage, setUsersPage] = useState(1);
  const [machinesPage, setMachinesPage] = useState(1);
  const [reservationsPage, setReservationsPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(20);
  const [machinesPageSize, setMachinesPageSize] = useState(20);
  const [reservationsPageSize, setReservationsPageSize] = useState(20);
  const [busy, setBusy] = useState(false);
  const [authOpen, setAuthOpen] = useState(true);
  const [adminUser, setAdminUser] = useState("");
  const [adminPass, setAdminPass] = useState("");
  const [authHeader, setAuthHeader] = useState<string | undefined>(undefined);
  const [showAdminPass, setShowAdminPass] = useState(false);
  const [adminNotice, setAdminNotice] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);
  const [userPasswords, setUserPasswords] = useState<Record<string, string>>({});
  const [userPasswordVisible, setUserPasswordVisible] = useState<Record<string, boolean>>({});

  useEffect(() => {
    // Try to prefill from sessionStorage for smoother UX
    const u = sessionStorage.getItem("admin_u");
    const p = sessionStorage.getItem("admin_p");
    if (u && p) {
      setAdminUser(u);
      setAdminPass(p);
      setAuthHeader(`Basic ${btoa(`${u}:${p}`)}`);
      setAuthOpen(false);
      // Auto-cargar datos al entrar si hay credenciales guardadas
      // La recarga real ocurre en el useEffect de authHeader abajo
    } else {
      setAuthOpen(true);
    }
  }, []);

  async function reload() {
    if (!authHeader) return;
    const headers = { Authorization: authHeader } as const;

    async function safeJson(url: string) {
      try {
        const res = await fetch(url, { cache: "no-store", headers });
        if (!res.ok) return null;
        return (await res.json().catch(() => null)) as any;
      } catch {
        return null;
      }
    }

    const qp = (p: number, s: number) => `?page=${p}&pageSize=${s}`;
    const [u, m, r, req] = await Promise.all([
      safeJson(`/api/admin/users${qp(usersPage, usersPageSize)}`),
      safeJson(`/api/admin/machines${qp(machinesPage, machinesPageSize)}`),
      safeJson(`/api/admin/reservations${qp(reservationsPage, reservationsPageSize)}`),
      safeJson(`/api/admin/requests?status=PENDING`),
    ]);
    setUsers(u?.users ?? []);
    setUsersTotal(u?.total ?? (u?.users?.length ?? 0));
    setMachines(m?.machines ?? []);
    setMachinesTotal(m?.total ?? (m?.machines?.length ?? 0));
    setReservations(r?.reservations ?? []);
    setReservationsTotal(r?.total ?? (r?.reservations?.length ?? 0));
    setRequests(req?.requests ?? []);
    setRequestsTotal(req?.total ?? (req?.requests?.length ?? 0));
  }

  // Fetchers parciales para evitar flicker y acelerar
  async function fetchUsers() {
    if (!authHeader) return;
    const headers = { Authorization: authHeader } as const;
    const url = `/api/admin/users?page=${usersPage}&pageSize=${usersPageSize}`;
    const res = await fetch(url, { cache: "no-store", headers });
    if (!res.ok) return;
    const data = await res.json();
    setUsers(data.users ?? []);
    setUsersTotal(data.total ?? 0);
  }

  async function fetchMachines() {
    if (!authHeader) return;
    const headers = { Authorization: authHeader } as const;
    const url = `/api/admin/machines?page=${machinesPage}&pageSize=${machinesPageSize}`;
    const res = await fetch(url, { cache: "no-store", headers });
    if (!res.ok) return;
    const data = await res.json();
    setMachines(data.machines ?? []);
    setMachinesTotal(data.total ?? 0);
  }

  async function fetchReservations() {
    if (!authHeader) return;
    const headers = { Authorization: authHeader } as const;
    const url = `/api/admin/reservations?page=${reservationsPage}&pageSize=${reservationsPageSize}`;
    const res = await fetch(url, { cache: "no-store", headers });
    if (!res.ok) return;
    const data = await res.json();
    setReservations(data.reservations ?? []);
    setReservationsTotal(data.total ?? 0);
  }

  async function fetchRequests() {
    if (!authHeader) return;
    const headers = { Authorization: authHeader } as const;
    const url = `/api/admin/requests?status=PENDING`;
    const res = await fetch(url, { cache: "no-store", headers });
    if (!res.ok) return;
    const data = await res.json();
    setRequests(data.requests ?? []);
    setRequestsTotal(data.total ?? 0);
  }

  // Cargar datos cuando el header de auth esté listo o cambien las páginas
  useEffect(() => {
    if (authHeader) {
      void Promise.all([fetchUsers(), fetchMachines(), fetchReservations(), fetchRequests()]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authHeader, usersPage, usersPageSize, machinesPage, machinesPageSize, reservationsPage, reservationsPageSize]);

  async function deleteUser(id: string) {
    if (!confirm(t("confirm_delete_user" as any))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "DELETE",
        headers: authHeader ? { Authorization: authHeader } : undefined,
      });
      if (res.ok) await fetchUsers();
    } finally {
      setBusy(false);
    }
  }

  async function toggleMachine(id: string, enabled: boolean) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/machines`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeader ? { Authorization: authHeader } : {}) },
        body: JSON.stringify({ id, enabled }),
      });
      if (res.ok) await fetchMachines();
    } finally {
      setBusy(false);
    }
  }

  async function updateMachine(mc: MachineCfg, fields: Partial<MachineCfg>) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/machines`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeader ? { Authorization: authHeader } : {}) },
        body: JSON.stringify({ ...mc, ...fields }),
      });
      if (res.ok) await fetchMachines();
    } finally {
      setBusy(false);
    }
  }

  async function createMachine() {
    if (!newMachineName.trim() || !newMachineLabel.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/machines`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeader ? { Authorization: authHeader } : {}) },
        body: JSON.stringify({ name: newMachineName.trim(), label: newMachineLabel.trim(), enabled: true }),
      });
      if (res.ok) {
        setNewMachineName("");
        setNewMachineLabel("");
        await fetchMachines();
      } else {
        const err = await res.json().catch(() => ({}));
        setAdminNotice(err?.error ?? "Create failed");
      }
    } finally {
      setBusy(false);
    }
  }

  async function deleteMachine(id: string) {
    if (!confirm(t("delete") + "?")) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/machines/${id}`, {
        method: "DELETE",
        headers: authHeader ? { Authorization: authHeader } : undefined,
      });
      if (res.ok) await fetchMachines();
    } finally {
      setBusy(false);
    }
  }

  async function deleteReservation(id: string) {
    if (!confirm(t("confirm_delete_reservation" as any))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/reservations/${id}`, {
        method: "DELETE",
        headers: authHeader ? { Authorization: authHeader } : undefined,
      });
      if (res.ok) await fetchReservations();
    } finally {
      setBusy(false);
    }
  }

  async function resetUserPassword(id: string) {
    if (!confirm(t("confirm_reset_password" as any))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(authHeader ? { Authorization: authHeader } : {}) },
        body: JSON.stringify({ action: "reset_password" }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.password) {
          setUserPasswords((prev) => ({ ...prev, [id]: data.password }));
          setUserPasswordVisible((prev) => ({ ...prev, [id]: true }));
          setAdminNotice(t("generated_password" as any));
          setGeneratedPassword(data.password);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function approveRequest(
    requestId: string,
    payload: { username: string; wing: string; floor: number; door: number }
  ) {
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(authHeader ? { Authorization: authHeader } : {}) },
        body: JSON.stringify({ action: "approve", ...payload }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.password) {
          setGeneratedPassword(data.password);
          setAdminNotice(t("generated_password" as any));
        }
        await Promise.all([fetchRequests(), fetchUsers()]);
      }
    } finally {
      setBusy(false);
    }
  }

  async function declineRequest(requestId: string) {
    if (!confirm(t("confirm_decline_request" as any))) return;
    setBusy(true);
    try {
      const res = await fetch(`/api/admin/requests/${requestId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...(authHeader ? { Authorization: authHeader } : {}) },
        body: JSON.stringify({ action: "decline" }),
      });
      if (res.ok) {
        await fetchRequests();
      }
    } finally {
      setBusy(false);
    }
  }


  // Inline state for add
  const [newMachineName, setNewMachineName] = useState("");
  const [newMachineLabel, setNewMachineLabel] = useState("");

  return (
    <div className="admin mx-auto flex max-w-6xl flex-col gap-8 p-6 text-slate-800 dark:text-slate-200">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("admin")}</h1>
        <div className="flex items-center gap-2">
          <button
            className="cursor-pointer rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-200"
            onClick={toggleTheme}
            title="Toggle theme"
          >
            {theme === "dark" ? "Dark" : "Light"}
          </button>
          {authHeader ? (
            <button
              className="cursor-pointer rounded-full border px-3 py-1 text-sm"
              onClick={() => {
                setAdminUser("");
                setAdminPass("");
                setAuthHeader(undefined);
                sessionStorage.removeItem("admin_u");
                sessionStorage.removeItem("admin_p");
                setAuthOpen(true);
              }}
            >
              {t("logout")}
            </button>
          ) : null}
        </div>
      </div>

      {(adminNotice || generatedPassword) ? (
        <section className="rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4 text-sm text-emerald-900 dark:border-emerald-900/60 dark:bg-emerald-900/20 dark:text-emerald-100">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              {adminNotice ? <div className="font-semibold">{adminNotice}</div> : null}
              {generatedPassword ? (
                <div className="font-mono text-base">{generatedPassword}</div>
              ) : null}
            </div>
            <button
              type="button"
              className="rounded-full border border-emerald-300 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-emerald-800 transition hover:border-emerald-400 hover:text-emerald-900 dark:border-emerald-700 dark:text-emerald-100 dark:hover:border-emerald-500"
              onClick={() => {
                setAdminNotice(null);
                setGeneratedPassword(null);
              }}
            >
              {t("dismiss" as any)}
            </button>
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        <h2 className="mb-3 text-lg font-semibold">{t("machines")}</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <input className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="name (ex: washer3)" value={newMachineName} onChange={e => setNewMachineName(e.target.value)} />
          <input className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder="label (display)" value={newMachineLabel} onChange={e => setNewMachineLabel(e.target.value)} />
          <button onClick={createMachine} disabled={busy || !newMachineName.trim() || !newMachineLabel.trim()} className="cursor-pointer rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">{t("add")}</button>
        </div>
        <div className="overflow-auto rounded-xl border">
          <table className="w-full min-w-[440px] text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Label</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {machines.map((m) => (
                <tr key={m.id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="px-3 py-2 font-mono">
                    <input
                      value={m.name}
                      onChange={e => updateMachine(m, { name: e.target.value })}
                      disabled={busy}
                      className="w-32 rounded border border-slate-300 bg-white px-2 py-1 font-mono text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={m.label}
                      onChange={e => updateMachine(m, { label: e.target.value })}
                      disabled={busy}
                      className="w-40 rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className={
                        `cursor-pointer inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${m.enabled ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"}`
                      }
                      onClick={() => toggleMachine(m.id, !m.enabled)}
                      disabled={busy}
                    >
                      {m.enabled ? <Power size={14} /> : <PowerOff size={14} />}
                      {m.enabled ? t("enabled") : t("disabled")}
                    </button>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      className="cursor-pointer inline-flex items-center gap-1 rounded-full bg-rose-700 text-white text-xs px-3 py-1"
                      onClick={() => deleteMachine(m.id)}
                      disabled={busy}
                    >
                      <Trash2 size={14} /> {t("delete")}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
          <div>
            {t("page" as any)} {machinesPage} / {Math.max(1, Math.ceil(machinesTotal / machinesPageSize))} · {machinesTotal} {t("total" as any)}
          </div>
          <div className="flex gap-2">
            <button className="rounded-full border px-2 py-1" disabled={machinesPage <= 1 || busy} onClick={() => setMachinesPage(p => Math.max(1, p - 1))}>{t("prev" as any)}</button>
            <button className="rounded-full border px-2 py-1" disabled={machinesPage >= Math.max(1, Math.ceil(machinesTotal / machinesPageSize)) || busy} onClick={() => setMachinesPage(p => p + 1)}>{t("next" as any)}</button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        <h2 className="mb-3 text-lg font-semibold">{t("account_requests" as any)}</h2>
        {requests.length === 0 ? (
          <div className="rounded-xl border border-dashed px-4 py-6 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-300">
            {t("no_pending_requests" as any)}
          </div>
        ) : (
          <div className="overflow-auto rounded-xl border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800">
                <tr>
                  <th className="px-3 py-2">Email</th>
                  <th className="px-3 py-2">Requested</th>
                  <th className="px-3 py-2">Username</th>
                  <th className="px-3 py-2">Wing</th>
                  <th className="px-3 py-2">Floor</th>
                  <th className="px-3 py-2">Door</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <RequestRow
                    key={req.id}
                    request={req}
                    busy={busy}
                    onApprove={approveRequest}
                    onDecline={declineRequest}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="mt-3 text-xs text-slate-600">
          {requestsTotal} {t("total" as any)}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        <h2 className="mb-3 text-lg font-semibold">{t("users")}</h2>
        <UserForm
          authHeader={authHeader}
          onDone={fetchUsers}
          busy={busy}
          setBusy={setBusy}
          onPasswordGenerated={(password) => {
            setGeneratedPassword(password);
            setAdminNotice(t("generated_password" as any));
          }}
        />
        <div className="overflow-auto rounded-xl border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-3 py-2">Email</th>
                <th className="px-3 py-2">Username</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">{t("password" as any)}</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Reservations</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="px-3 py-2 font-mono">{u.email}</td>
                  <td className="px-3 py-2">{u.username}</td>
                  <td className="px-3 py-2">{u.user_code}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">
                        {userPasswords[u.id]
                          ? userPasswordVisible[u.id]
                            ? userPasswords[u.id]
                            : "••••••••"
                          : t("no_password" as any)}
                      </span>
                      {userPasswords[u.id] ? (
                        <button
                          type="button"
                          className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
                          onClick={() =>
                            setUserPasswordVisible((prev) => ({
                              ...prev,
                              [u.id]: !prev[u.id],
                            }))
                          }
                        >
                          {userPasswordVisible[u.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="rounded-full border border-slate-200 px-2 py-1 text-xs text-slate-600 transition hover:border-emerald-300 hover:text-emerald-700 dark:border-slate-700 dark:text-slate-300 dark:hover:border-emerald-500 dark:hover:text-emerald-200"
                        onClick={() => resetUserPassword(u.id)}
                        disabled={busy}
                        title={t("reset_password" as any)}
                      >
                        <Key size={12} />
                      </button>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-xs">{new Date(u.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2">{u._count.reservations}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      disabled={busy}
                      onClick={() => deleteUser(u.id)}
                      className="cursor-pointer inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-sm font-medium text-white"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
          <div>
            {t("page" as any)} {usersPage} / {Math.max(1, Math.ceil(usersTotal / usersPageSize))} · {usersTotal} {t("total" as any)}
          </div>
          <div className="flex gap-2">
            <button className="rounded-full border px-2 py-1" disabled={usersPage <= 1 || busy} onClick={() => setUsersPage(p => Math.max(1, p - 1))}>{t("prev" as any)}</button>
            <button className="rounded-full border px-2 py-1" disabled={usersPage >= Math.max(1, Math.ceil(usersTotal / usersPageSize)) || busy} onClick={() => setUsersPage(p => p + 1)}>{t("next" as any)}</button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        <h2 className="mb-3 text-lg font-semibold">{t("reservations")}</h2>
        <ReservationForm authHeader={authHeader} onDone={fetchReservations} busy={busy} setBusy={setBusy} users={users} machines={machines} />
        <div className="overflow-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Machine</th>
                <th className="px-3 py-2">Week</th>
                <th className="px-3 py-2">Day</th>
                <th className="px-3 py-2">Hour</th>
                <th className="px-3 py-2">User Code</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {reservations.map((r) => (
                <tr key={r.id} className="border-t border-slate-200 dark:border-slate-700">
                  <td className="px-3 py-2 font-mono text-[11px]">{r.id.slice(0, 8)}…</td>
                  <td className="px-3 py-2">{r.machine?.label ?? r.machine?.name ?? r.machine_id}</td>
                  <td className="px-3 py-2">{r.week_id}</td>
                  <td className="px-3 py-2">{r.day}</td>
                  <td className="px-3 py-2">{r.hour}</td>
                  <td className="px-3 py-2">{r.user_code}</td>
                  <td className="px-3 py-2 text-xs">{new Date(r.created_at).toLocaleString()}</td>
                  <td className="px-3 py-2 text-right">
                    <button
                      disabled={busy}
                      onClick={() => deleteReservation(r.id)}
                      className="cursor-pointer inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-sm font-medium text-white"
                    >
                      <Trash2 size={16} /> Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-600">
          <div>
            {t("page" as any)} {reservationsPage} / {Math.max(1, Math.ceil(reservationsTotal / reservationsPageSize))} · {reservationsTotal} {t("total" as any)}
          </div>
          <div className="flex gap-2">
            <button className="rounded-full border px-2 py-1" disabled={reservationsPage <= 1 || busy} onClick={() => setReservationsPage(p => Math.max(1, p - 1))}>{t("prev" as any)}</button>
            <button className="rounded-full border px-2 py-1" disabled={reservationsPage >= Math.max(1, Math.ceil(reservationsTotal / reservationsPageSize)) || busy} onClick={() => setReservationsPage(p => p + 1)}>{t("next" as any)}</button>
          </div>
        </div>
      </section>

      <Modal
        open={authOpen}
        title={t("login")}
        closeLabel={t("close")}
        onClose={() => {
          // Require login before using admin – do not close modal if empty
          if (authHeader) setAuthOpen(false);
        }}
        actions={
          <button
            type="button"
            className="cursor-pointer rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={async () => {
              if (!adminUser || !adminPass) return;
              setAuthHeader(`Basic ${btoa(`${adminUser}:${adminPass}`)}`);
              sessionStorage.setItem("admin_u", adminUser);
              sessionStorage.setItem("admin_p", adminPass);
              setAuthOpen(false);
              await Promise.all([fetchUsers(), fetchMachines(), fetchReservations(), fetchRequests()]);
            }}
          >
            {t("login")}
          </button>
        }
      >
        <div className="flex flex-col gap-3">
          <input
            autoFocus
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Username"
            value={adminUser}
            onChange={(e) => setAdminUser(e.target.value)}
          />
          <input
            className="w-full rounded-xl border px-3 py-2"
            placeholder="Password"
            type={showAdminPass ? "text" : "password"}
            value={adminPass}
            onChange={(e) => setAdminPass(e.target.value)}
          />
          <button
            type="button"
            className="self-start rounded-full border border-slate-200 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-600 transition hover:border-slate-300 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-500 dark:hover:text-white"
            onClick={() => setShowAdminPass((value) => !value)}
          >
            {showAdminPass ? t("hide_password") : t("show_password")}
          </button>
          <p className="text-xs text-slate-500">{t("admin_login_note")}</p>
        </div>
      </Modal>
    </div>
  );
}

function UserForm({
  authHeader,
  onDone,
  busy,
  setBusy,
  onPasswordGenerated,
}: {
  authHeader?: string;
  onDone: () => Promise<void>;
  busy: boolean;
  setBusy: (b: boolean) => void;
  onPasswordGenerated: (password: string) => void;
}) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [wing, setWing] = useState("W");
  const [floor, setFloor] = useState(0);
  const [door, setDoor] = useState(0);

  async function createUser() {
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeader ? { Authorization: authHeader } : {}) },
        body: JSON.stringify({ email, username, wing, floor, door }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => null);
        if (data?.password) {
          onPasswordGenerated(data.password);
        }
      }
      setEmail(""); setUsername(""); setWing("W"); setFloor(0); setDoor(0);
      await onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-6">
      <input className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder={t("email")} value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder={t("username")} value={username} onChange={(e) => setUsername(e.target.value)} />
      <select className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" value={wing} onChange={(e) => setWing(e.target.value)}>
        <option value="W">W</option><option value="O">O</option><option value="N">N</option>
      </select>
      <input className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" type="number" min={0} max={8} value={floor} onChange={(e) => setFloor(Number(e.target.value))} />
      <input className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" type="number" min={0} max={99} value={door} onChange={(e) => setDoor(Number(e.target.value))} />
      <button disabled={busy} onClick={createUser} className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">{t("create")}</button>
    </div>
  );
}

function RequestRow({
  request,
  busy,
  onApprove,
  onDecline,
}: {
  request: AccountRequest;
  busy: boolean;
  onApprove: (id: string, payload: { username: string; wing: string; floor: number; door: number }) => void;
  onDecline: (id: string) => void;
}) {
  const { t } = useLanguage();
  const [username, setUsername] = useState("");
  const [wing, setWing] = useState("W");
  const [floor, setFloor] = useState(0);
  const [door, setDoor] = useState(0);

  return (
    <tr className="border-t border-slate-200 dark:border-slate-700">
      <td className="px-3 py-2 font-mono text-xs">{request.email}</td>
      <td className="px-3 py-2 text-xs">{new Date(request.created_at).toLocaleString()}</td>
      <td className="px-3 py-2">
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-40 rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          placeholder={t("username")}
        />
      </td>
      <td className="px-3 py-2">
        <select
          className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
          value={wing}
          onChange={(e) => setWing(e.target.value)}
        >
          <option value="W">W</option>
          <option value="O">O</option>
          <option value="N">N</option>
        </select>
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          min={0}
          max={8}
          value={floor}
          onChange={(e) => setFloor(Number(e.target.value))}
          className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </td>
      <td className="px-3 py-2">
        <input
          type="number"
          min={0}
          max={99}
          value={door}
          onChange={(e) => setDoor(Number(e.target.value))}
          className="w-16 rounded border border-slate-300 bg-white px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
        />
      </td>
      <td className="px-3 py-2 text-right">
        <div className="flex justify-end gap-2">
          <button
            disabled={busy}
            onClick={() => onApprove(request.id, { username, wing, floor, door })}
            className="cursor-pointer rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white"
          >
            {t("approve" as any)}
          </button>
          <button
            disabled={busy}
            onClick={() => onDecline(request.id)}
            className="cursor-pointer rounded-full bg-rose-600 px-3 py-1 text-xs font-semibold text-white"
          >
            {t("decline" as any)}
          </button>
        </div>
      </td>
    </tr>
  );
}

function ReservationForm({ authHeader, onDone, busy, setBusy, users, machines }: { authHeader?: string; onDone: () => Promise<void>; busy: boolean; setBusy: (b: boolean) => void; users: any[]; machines: MachineCfg[]; }) {
  const { t } = useLanguage();
  const [machineId, setMachineId] = useState("");
  const [week, setWeek] = useState("");
  const [day, setDay] = useState(0);
  const [hour, setHour] = useState(0);
  const [userId, setUserId] = useState("");

  useEffect(() => {
    if (!userId && users.length > 0) setUserId(users[0].id);
  }, [users, userId]);

  useEffect(() => {
    if (!machineId && machines.length > 0) setMachineId(machines[0].id);
  }, [machines, machineId]);

  async function createReservation() {
    setBusy(true);
    try {
      await fetch("/api/admin/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeader ? { Authorization: authHeader } : {}) },
        body: JSON.stringify({ machine_id: machineId, day, hour, week_id: week, user_id: userId }),
      });
      setWeek(""); setDay(0); setHour(0);
      await onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-6">
      <select className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" value={machineId} onChange={(e) => setMachineId(e.target.value)}>
        {machines.map((m) => (
          <option key={m.id} value={m.id}>{m.label} ({m.name})</option>
        ))}
      </select>
      <input className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" placeholder={t("week")} value={week} onChange={(e) => setWeek(e.target.value)} />
      <input className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" type="number" min={0} max={6} value={day} onChange={(e) => setDay(Number(e.target.value))} />
      <input className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" type="number" min={0} max={23} value={hour} onChange={(e) => setHour(Number(e.target.value))} />
      <select className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100" value={userId} onChange={(e) => setUserId(e.target.value)}>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.username} ({u.user_code})</option>
        ))}
      </select>
      <button disabled={busy} onClick={createReservation} className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">{t("create")}</button>
    </div>
  );
}
