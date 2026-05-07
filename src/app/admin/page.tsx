"use client";

import { useEffect, useMemo, useState } from "react";
import { Power, PowerOff, Trash2 } from "lucide-react";
import Modal from "@/components/Modal";
import { useLanguage } from "@/components/LanguageProvider";

type User = {
  id: string;
  matriculation: string;
  username: string;
  wing: string;
  floor: number;
  door: number;
  user_code: string;
  created_at: string;
  _count: { reservations: number };
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
  const [users, setUsers] = useState<User[]>([]);
  const [machines, setMachines] = useState<MachineCfg[]>([]);
  const [reservations, setReservations] = useState<any[]>([]);
  const [usersTotal, setUsersTotal] = useState(0);
  const [machinesTotal, setMachinesTotal] = useState(0);
  const [reservationsTotal, setReservationsTotal] = useState(0);
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

  const authHeader = useMemo(() => {
    if (!adminUser || !adminPass) return undefined;
    const token = btoa(`${adminUser}:${adminPass}`);
    return `Basic ${token}`;
  }, [adminUser, adminPass]);

  useEffect(() => {
    // Try to prefill from sessionStorage for smoother UX
    const u = sessionStorage.getItem("admin_u");
    const p = sessionStorage.getItem("admin_p");
    if (u && p) {
      setAdminUser(u);
      setAdminPass(p);
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
    const [u, m, r] = await Promise.all([
      safeJson(`/api/admin/users${qp(usersPage, usersPageSize)}`),
      safeJson(`/api/admin/machines${qp(machinesPage, machinesPageSize)}`),
      safeJson(`/api/admin/reservations${qp(reservationsPage, reservationsPageSize)}`),
    ]);
    setUsers(u?.users ?? []);
    setUsersTotal(u?.total ?? (u?.users?.length ?? 0));
    setMachines(m?.machines ?? []);
    setMachinesTotal(m?.total ?? (m?.machines?.length ?? 0));
    setReservations(r?.reservations ?? []);
    setReservationsTotal(r?.total ?? (r?.reservations?.length ?? 0));
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

  // Cargar datos cuando el header de auth esté listo o cambien las páginas
  useEffect(() => {
    if (authHeader) {
      void Promise.all([fetchUsers(), fetchMachines(), fetchReservations()]);
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
        alert(err?.error ?? "Create failed");
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


  // Inline state for add
  const [newMachineName, setNewMachineName] = useState("");
  const [newMachineLabel, setNewMachineLabel] = useState("");

  return (
    <div className="admin mx-auto flex max-w-6xl flex-col gap-8 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("admin")}</h1>
        <div className="flex items-center gap-2">
          {authHeader ? (
            <button
              className="cursor-pointer rounded-full border px-3 py-1 text-sm"
              onClick={() => {
                setAdminUser("");
                setAdminPass("");
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

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">{t("machines")}</h2>
        <div className="mb-4 flex flex-wrap gap-2">
          <input className="rounded-xl border px-3 py-2" placeholder="name (ex: washer3)" value={newMachineName} onChange={e => setNewMachineName(e.target.value)} />
          <input className="rounded-xl border px-3 py-2" placeholder="label (display)" value={newMachineLabel} onChange={e => setNewMachineLabel(e.target.value)} />
          <button onClick={createMachine} disabled={busy || !newMachineName.trim() || !newMachineLabel.trim()} className="cursor-pointer rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">{t("add")}</button>
        </div>
        <div className="overflow-auto rounded-xl border">
          <table className="w-full min-w-[440px] text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Label</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {machines.map((m) => (
                <tr key={m.id} className="border-t">
                  <td className="px-3 py-2 font-mono">
                    <input
                      value={m.name}
                      onChange={e => updateMachine(m, { name: e.target.value })}
                      disabled={busy}
                      className="rounded border px-2 py-1 font-mono text-xs w-32"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      value={m.label}
                      onChange={e => updateMachine(m, { label: e.target.value })}
                      disabled={busy}
                      className="rounded border px-2 py-1 text-xs w-40"
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

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">{t("users")}</h2>
        <UserForm authHeader={authHeader} onDone={fetchUsers} busy={busy} setBusy={setBusy} />
        <div className="overflow-auto rounded-xl border">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2">Matriculation</th>
                <th className="px-3 py-2">Username</th>
                <th className="px-3 py-2">Code</th>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Reservations</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{u.matriculation}</td>
                  <td className="px-3 py-2">{u.username}</td>
                  <td className="px-3 py-2">{u.user_code}</td>
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

      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold">{t("reservations")}</h2>
        <ReservationForm authHeader={authHeader} onDone={fetchReservations} busy={busy} setBusy={setBusy} users={users} machines={machines} />
        <div className="overflow-auto rounded-xl border">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50">
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
                <tr key={r.id} className="border-t">
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
          if (adminUser && adminPass) setAuthOpen(false);
        }}
        actions={
          <button
            type="button"
            className="cursor-pointer rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            onClick={async () => {
              if (!adminUser || !adminPass) return;
              sessionStorage.setItem("admin_u", adminUser);
              sessionStorage.setItem("admin_p", adminPass);
              setAuthOpen(false);
              await Promise.all([fetchUsers(), fetchMachines(), fetchReservations()]);
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
            type="password"
            value={adminPass}
            onChange={(e) => setAdminPass(e.target.value)}
          />
          <p className="text-xs text-slate-500">{t("admin_login_note")}</p>
        </div>
      </Modal>
    </div>
  );
}

function UserForm({ authHeader, onDone, busy, setBusy }: { authHeader?: string; onDone: () => Promise<void>; busy: boolean; setBusy: (b: boolean) => void; }) {
  const { t } = useLanguage();
  const [matriculation, setMatriculation] = useState("");
  const [username, setUsername] = useState("");
  const [wing, setWing] = useState("W");
  const [floor, setFloor] = useState(0);
  const [door, setDoor] = useState(0);

  async function createUser() {
    setBusy(true);
    try {
      await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(authHeader ? { Authorization: authHeader } : {}) },
        body: JSON.stringify({ matriculation, username, wing, floor, door }),
      });
      setMatriculation(""); setUsername(""); setWing("W"); setFloor(0); setDoor(0);
      await onDone();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mb-3 grid grid-cols-2 gap-2 md:grid-cols-6">
      <input className="rounded-xl border px-3 py-2" placeholder={t("matriculation_number")} value={matriculation} onChange={(e) => setMatriculation(e.target.value)} />
      <input className="rounded-xl border px-3 py-2" placeholder={t("username")} value={username} onChange={(e) => setUsername(e.target.value)} />
      <select className="rounded-xl border px-3 py-2" value={wing} onChange={(e) => setWing(e.target.value)}>
        <option value="W">W</option><option value="O">O</option><option value="N">N</option>
      </select>
      <input className="rounded-xl border px-3 py-2" type="number" min={0} max={8} value={floor} onChange={(e) => setFloor(Number(e.target.value))} />
      <input className="rounded-xl border px-3 py-2" type="number" min={0} max={99} value={door} onChange={(e) => setDoor(Number(e.target.value))} />
      <button disabled={busy} onClick={createUser} className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">{t("create")}</button>
    </div>
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
      <select className="rounded-xl border px-3 py-2" value={machineId} onChange={(e) => setMachineId(e.target.value)}>
        {machines.map((m) => (
          <option key={m.id} value={m.id}>{m.label} ({m.name})</option>
        ))}
      </select>
      <input className="rounded-xl border px-3 py-2" placeholder={t("week")} value={week} onChange={(e) => setWeek(e.target.value)} />
      <input className="rounded-xl border px-3 py-2" type="number" min={0} max={6} value={day} onChange={(e) => setDay(Number(e.target.value))} />
      <input className="rounded-xl border px-3 py-2" type="number" min={0} max={23} value={hour} onChange={(e) => setHour(Number(e.target.value))} />
      <select className="rounded-xl border px-3 py-2" value={userId} onChange={(e) => setUserId(e.target.value)}>
        {users.map((u) => (
          <option key={u.id} value={u.id}>{u.username} ({u.user_code})</option>
        ))}
      </select>
      <button disabled={busy} onClick={createReservation} className="rounded-full bg-emerald-600 px-3 py-2 text-sm font-semibold text-white">{t("create")}</button>
    </div>
  );
}
