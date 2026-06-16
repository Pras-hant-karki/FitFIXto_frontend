"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Search, Trash2, Ban } from "lucide-react";
import { AdminUser, deleteAdminUser, fetchAdminUsers, updateAdminUserStatus } from "@/features/admin-users/api";

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const suspendedCount = useMemo(() => users.filter((user) => !user.isActive).length, [users]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return users;

    return users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return fullName.includes(query) || user.email.toLowerCase().includes(query) || user.role.toLowerCase().includes(query);
    });
  }, [searchQuery, users]);

  const loadUsers = async () => {
    setIsLoading(true);
    setError("");

    try {
      setUsers(await fetchAdminUsers());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleStatusToggle = async (user: AdminUser) => {
    setError("");
    setMessage("");

    try {
      const updated = await updateAdminUserStatus(user._id, !user.isActive);
      if (updated) {
        setUsers((current) =>
          current.map((item) => (item._id === user._id ? { ...item, isActive: updated.isActive } : item))
        );
      }
      setMessage(user.isActive ? "User suspended successfully." : "User activated successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update user.");
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm(`Delete ${user.firstName} ${user.lastName}?`)) return;

    setError("");
    setMessage("");

    try {
      await deleteAdminUser(user._id);
      setUsers((current) => current.filter((item) => item._id !== user._id));
      setMessage("User deleted successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete user.");
    }
  };

  return (
    <section className="admin-users-page">
      <header className="admin-users-header">
        <h1>Users</h1>
        <p>
          {users.length} accounts · {suspendedCount} suspended
        </p>
      </header>

      <label className="admin-user-search">
        <Search aria-hidden="true" />
        <input
          type="search"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </label>

      {message ? <p className="admin-products-message success">{message}</p> : null}
      {error ? <p className="admin-products-message error">{error}</p> : null}

      <div className="admin-users-table-card">
        <div className="admin-users-table">
          <div className="admin-users-head">
            <span>User</span>
            <span>Role</span>
            <span>Joined</span>
            <span>Orders</span>
            <span>Spent</span>
            <span>Status</span>
            <span>Actions</span>
          </div>

          {isLoading ? (
            <div className="admin-users-empty">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="admin-users-empty">No users found.</div>
          ) : (
            filteredUsers.map((user) => {
              const isAdmin = user.role === "admin";

              return (
                <div className="admin-users-row" key={user._id}>
                  <div className="admin-user-name">
                    <strong>
                      {user.firstName} {user.lastName}
                    </strong>
                    <span>{user.email}</span>
                  </div>
                  <span className={`admin-role-badge admin-role-${user.role}`}>{user.role}</span>
                  <span>{formatDate(user.createdAt)}</span>
                  <span>{user.ordersCount}</span>
                  <strong>Npr {user.totalSpent}</strong>
                  <span className={`admin-user-status ${user.isActive ? "active" : "suspended"}`}>
                    {user.isActive ? "Active" : "Suspended"}
                  </span>
                  <div className="admin-user-actions">
                    <button type="button" disabled={isAdmin} onClick={() => handleStatusToggle(user)}>
                      {user.isActive ? <Ban aria-hidden="true" /> : <Check aria-hidden="true" />}
                      {user.isActive ? "Suspend" : "Activate"}
                    </button>
                    <button type="button" disabled={isAdmin} onClick={() => handleDelete(user)}>
                      <Trash2 aria-hidden="true" />
                      Delete
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
