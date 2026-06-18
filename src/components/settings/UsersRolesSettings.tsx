import { useState } from "react";
import { UserPlus, Trash2, Check } from "lucide-react";
import { useApp } from "../../state/AppContext";
import { useToast } from "../Toast";
import { ROLE_LIST, ROLES, type Role, type Permission } from "../../mock/roles";
import type { MockUser } from "../../mock/config";
import { uid } from "../../lib/id";
import { SectionHeader, ReadOnlyBanner } from "./primitives";

const PERMISSION_LABEL: Record<Permission, string> = {
  "pii:reveal": "Reveal PII",
  "analysis:edit": "Edit analyses",
  "analysis:finalize": "Finalize",
  "settings:manage": "Manage settings",
};
const ALL_PERMISSIONS = Object.keys(PERMISSION_LABEL) as Permission[];

const STATUS_STYLE: Record<MockUser["status"], string> = {
  active: "bg-green-tint text-green-deep",
  invited: "bg-brand-tint text-brand",
  disabled: "bg-ink-100 text-ink-500",
};

export function UsersRolesSettings() {
  const { config, updateConfig, can } = useApp();
  const toast = useToast();
  const canManage = can("settings:manage");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("processor");

  const setUsers = (users: MockUser[]) => updateConfig({ users });

  const addUser = () => {
    if (!name.trim() || !email.trim()) return;
    setUsers([
      ...config.users,
      { id: uid("usr"), name: name.trim(), email: email.trim(), role, status: "invited" },
    ]);
    toast(`Invited ${name.trim()}`, "success");
    setName("");
    setEmail("");
    setRole("processor");
  };

  return (
    <div>
      <SectionHeader
        title="Users & roles"
        desc="Mock user directory. In production this is your identity provider (SSO/OIDC) with server-enforced roles."
      />
      <ReadOnlyBanner canManage={canManage} />

      <div className="card overflow-hidden">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-ink-200 bg-ink-50 text-left">
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">User</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Role</th>
              <th className="px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Status</th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {config.users.map((u) => (
              <tr key={u.id} className="border-b border-ink-100 last:border-0">
                <td className="px-4 py-3">
                  <div className="font-semibold text-navy">{u.name}</div>
                  <div className="text-xs text-ink-500">{u.email}</div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={u.role}
                    disabled={!canManage}
                    onChange={(e) =>
                      setUsers(config.users.map((x) => (x.id === u.id ? { ...x, role: e.target.value as Role } : x)))
                    }
                    className="input w-44 py-1.5 text-sm disabled:opacity-60"
                  >
                    {ROLE_LIST.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <button
                    disabled={!canManage}
                    onClick={() =>
                      setUsers(
                        config.users.map((x) =>
                          x.id === u.id
                            ? { ...x, status: x.status === "disabled" ? "active" : "disabled" }
                            : x,
                        ),
                      )
                    }
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_STYLE[u.status]} disabled:cursor-not-allowed`}
                    title={canManage ? "Toggle active/disabled" : undefined}
                  >
                    {u.status}
                  </button>
                </td>
                <td className="px-2 py-3">
                  <button
                    disabled={!canManage}
                    onClick={() => setUsers(config.users.filter((x) => x.id !== u.id))}
                    className="rounded-md p-1.5 text-ink-400 transition hover:bg-danger-tint hover:text-danger disabled:opacity-40"
                    title="Remove user"
                    aria-label={`Remove ${u.name}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Invite user */}
      {canManage && (
        <div className="card mt-4 p-4">
          <p className="eyebrow mb-2">Invite a user</p>
          <div className="flex flex-wrap items-center gap-2">
            <input className="input flex-1" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input flex-1" placeholder="email@meridianmtg.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <select className="input w-44" value={role} onChange={(e) => setRole(e.target.value as Role)}>
              {ROLE_LIST.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.label}
                </option>
              ))}
            </select>
            <button className="btn-primary" onClick={addUser} disabled={!name.trim() || !email.trim()}>
              <UserPlus className="h-4 w-4" /> Invite
            </button>
          </div>
        </div>
      )}

      {/* Roles × permissions matrix */}
      <div className="card mt-4 overflow-hidden">
        <div className="border-b border-ink-200 px-5 py-3">
          <h3 className="font-bold text-navy">Roles &amp; permissions</h3>
          <p className="text-xs text-ink-500">What each role can do (enforced server-side in production).</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-ink-200 text-left">
                <th className="px-5 py-2.5 text-[11px] font-semibold uppercase tracking-wide text-ink-400">Permission</th>
                {ROLE_LIST.map((r) => (
                  <th key={r.id} className="px-3 py-2.5 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-400">
                    {r.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_PERMISSIONS.map((p) => (
                <tr key={p} className="border-b border-ink-100 last:border-0">
                  <td className="px-5 py-2.5 font-medium text-ink-700">{PERMISSION_LABEL[p]}</td>
                  {ROLE_LIST.map((r) => (
                    <td key={r.id} className="px-3 py-2.5 text-center">
                      {ROLES[r.id].permissions.includes(p) ? (
                        <Check className="mx-auto h-4 w-4 text-green-deep" />
                      ) : (
                        <span className="text-ink-300">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
