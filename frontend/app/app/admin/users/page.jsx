"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/context/StoreContext";
import { createUser, getApiErrorMessage, listUsers, updateUser, updateUserRole } from "@/lib/api";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Check, Edit3, Plus, Power } from "lucide-react";

const ROLES = ["user", "staff", "admin"];

export default function UsersDashboard() {
  const router = useRouter();
  const { auth, authReady } = useStore();
  const currentUserId = auth?.user_id;

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [statusMsg, setStatusMsg] = useState("");
  const [savingId, setSavingId] = useState(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ email: "", full_name: "" });

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "staff"
  });

  useEffect(() => {
    if (!authReady) {
      return;
    }
    if (!auth) {
      router.push("/account");
      return;
    }
    if (auth.role !== "admin") {
      return; // Access denied UI will render
    }
    async function loadUsers() {
      setLoading(true);
      try {
        const data = await listUsers(auth.access_token);
        setUsers(data);
      } catch (err) {
        console.error(err);
        setError("Failed to fetch users.");
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, [auth, authReady, router]);

  async function handleCreate(event) {
    event.preventDefault();
    setError("");
    setStatusMsg("");

    if (!form.email.includes("@") || form.password.length < 8 || !form.full_name.trim()) {
      setError("Enter a valid email, a name, and a password with at least 8 characters.");
      return;
    }

    if (!auth?.access_token) {
      return;
    }

    setCreating(true);
    try {
      const created = await createUser(auth.access_token, form);
      setUsers((prev) => [created, ...prev]);
      setStatusMsg(`Created ${created.email} as ${created.role}.`);
      setForm({ email: "", password: "", full_name: "", role: "staff" });
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to create account."));
    } finally {
      setCreating(false);
    }
  }

  async function handleRoleChange(user, role) {
    if (!auth?.access_token) {
      return;
    }

    setError("");
    setStatusMsg("");
    setSavingId(user.id);
    try {
      const updated = await updateUserRole(user.id, auth.access_token, role);
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setStatusMsg(`Updated ${updated.email} to ${updated.role}.`);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to update role."));
    } finally {
      setSavingId(null);
    }
  }

  async function handleDisabledToggle(user) {
    if (!auth?.access_token) {
      return;
    }

    setError("");
    setStatusMsg("");
    setSavingId(user.id);
    try {
      const updated = await updateUser(user.id, auth.access_token, {
        is_disabled: !user.is_disabled
      });
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setStatusMsg(`${updated.email} is now ${updated.is_disabled ? "disabled" : "enabled"}.`);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to update account."));
    } finally {
      setSavingId(null);
    }
  }

  function startEditing(user) {
    setEditingId(user.id);
    setEditForm({
      email: user.email,
      full_name: user.full_name || ""
    });
    setError("");
    setStatusMsg("");
  }

  async function handleInfoSave(user) {
    if (!auth?.access_token) {
      return;
    }

    setSavingId(user.id);
    try {
      const updated = await updateUser(user.id, auth.access_token, editForm);
      setUsers((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      setEditingId(null);
      setStatusMsg(`Updated ${updated.email}.`);
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "Failed to update account details."));
    } finally {
      setSavingId(null);
    }
  }

  if (auth && auth.role !== "admin") {
    return (
      <main className="bg-paper px-5 py-24 text-center">
        <div className="mx-auto max-w-md border border-line bg-ivory p-8">
          <h1 className="font-display text-4xl font-semibold text-ink">Access Denied</h1>
          <p className="mt-4 text-sm leading-6 text-muted">
            Only admins can manage user roles.
          </p>
          <button
            className="focus-ring mt-8 w-full border border-gold px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-ink transition hover:text-gold"
            onClick={() => router.push("/")}
          >
            Return to Store
          </button>
        </div>
      </main>
    );
  }

  if (loading && users.length === 0) {
    return (
      <main className="bg-paper px-5 py-24 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gold">Loading Users...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-paper md:flex">
      <AdminSidebar />
      <section className="flex-1 px-5 py-10 lg:px-10">
      <div className="mx-auto max-w-6xl">
        <section className="mb-12 border-b border-line pb-8">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-gold">Admin Panel</p>
          <h1 className="mt-4 font-display text-5xl font-semibold leading-tight text-ink">Users & Roles</h1>
        </section>

        {error && (
          <div className="mb-6 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}
        {statusMsg && (
          <div className="mb-6 border border-gold bg-ivory p-4 text-sm text-ink flex items-center gap-2">
            <Check size={16} className="text-gold" /> {statusMsg}
          </div>
        )}

        <div className="grid gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <div>
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              All Accounts ({users.length})
            </h2>
            <div className="border border-line divide-y divide-line bg-ivory">
              {users.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted">No users found.</div>
              ) : (
                users.map((user) => (
                  <div key={user.id} className="flex flex-wrap items-center justify-between gap-4 p-4">
                    {editingId === user.id ? (
                      <div className="grid min-w-[260px] gap-2 sm:grid-cols-2">
                        <input
                          className="focus-ring border border-line bg-paper px-3 py-2 text-sm text-ink"
                          onChange={(event) => setEditForm({ ...editForm, full_name: event.target.value })}
                          value={editForm.full_name}
                        />
                        <input
                          className="focus-ring border border-line bg-paper px-3 py-2 text-sm text-ink"
                          onChange={(event) => setEditForm({ ...editForm, email: event.target.value })}
                          type="email"
                          value={editForm.email}
                        />
                      </div>
                    ) : (
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-ink text-sm">{user.full_name || "Unnamed"}</p>
                        <p className="truncate text-xs text-muted font-mono">{user.email}</p>
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`border px-3 py-2 text-xs uppercase tracking-[0.18em] ${
                        user.is_disabled
                          ? "border-red-200 bg-red-50 text-red-700"
                          : "border-line bg-paper text-muted"
                      }`}>
                        {user.is_disabled ? "Disabled" : "Active"}
                      </span>
                      <select
                        className="focus-ring border border-line bg-paper px-3 py-2 text-xs uppercase tracking-[0.18em] text-ink disabled:opacity-50"
                        disabled={savingId === user.id || user.id === currentUserId}
                        onChange={(event) => handleRoleChange(user, event.target.value)}
                        value={user.role}
                      >
                        {ROLES.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                      <button
                        className="focus-ring inline-flex items-center gap-2 border border-line px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted transition hover:border-gold hover:text-gold disabled:opacity-50"
                        disabled={savingId === user.id || user.id === currentUserId}
                        onClick={() => handleDisabledToggle(user)}
                        type="button"
                      >
                        <Power size={14} />
                        {user.is_disabled ? "Enable" : "Disable"}
                      </button>
                      {editingId === user.id ? (
                        <button
                          className="focus-ring border border-gold bg-ink px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-paper transition hover:bg-paper hover:text-gold"
                          disabled={savingId === user.id}
                          onClick={() => handleInfoSave(user)}
                          type="button"
                        >
                          Save
                        </button>
                      ) : (
                        <button
                          className="focus-ring inline-flex items-center gap-2 border border-line px-3 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted transition hover:border-gold hover:text-gold"
                          onClick={() => startEditing(user)}
                          type="button"
                        >
                          <Edit3 size={14} />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            <p className="mt-4 text-xs text-muted">You cannot change your own role.</p>
          </div>

          <div>
            <h2 className="mb-6 text-xs font-semibold uppercase tracking-[0.22em] text-muted">
              Create Staff or Admin Account
            </h2>
            <form className="border border-line bg-ivory p-6 md:p-8 space-y-5" onSubmit={handleCreate}>
              <label className="block text-sm font-medium text-ink">
                Full name
                <input
                  className="focus-ring mt-2 w-full border border-line bg-paper px-4 py-3 text-ink text-sm"
                  onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                  value={form.full_name}
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Email
                <input
                  className="focus-ring mt-2 w-full border border-line bg-paper px-4 py-3 text-ink text-sm"
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  type="email"
                  value={form.email}
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Temporary password
                <input
                  className="focus-ring mt-2 w-full border border-line bg-paper px-4 py-3 text-ink text-sm"
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  type="text"
                  value={form.password}
                />
              </label>
              <label className="block text-sm font-medium text-ink">
                Role
                <select
                  className="focus-ring mt-2 w-full border border-line bg-paper px-4 py-3 text-ink text-sm"
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                  value={form.role}
                >
                  <option value="staff">Staff</option>
                  <option value="admin">Admin</option>
                </select>
              </label>
              <button
                className="focus-ring flex w-full items-center justify-center gap-2 border border-gold bg-ink px-5 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-paper transition hover:bg-gold hover:text-ink disabled:opacity-50"
                disabled={creating}
                type="submit"
              >
                <Plus size={14} /> {creating ? "Creating..." : "Create Account"}
              </button>
              <p className="text-xs text-muted">
                Share the email and temporary password with them directly — there is no email invite yet.
              </p>
            </form>
          </div>
        </div>
      </div>
      </section>
    </main>
  );
}
