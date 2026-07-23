"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronLeft, ChevronRight, Search, Trash2, Ban } from "lucide-react";
import { AdminUser, PaginationMeta, deleteAdminUser, fetchAdminUsers, updateAdminUserStatus } from "@/features/admin-users/api";
import { useToast } from "@/contexts";

const PAGE_LIMIT = 20;

const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(date));

const DEFAULT_PAGINATION: PaginationMeta = {
  total: 0,
  page: 1,
  limit: PAGE_LIMIT,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>(DEFAULT_PAGINATION);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadUsers = async (page: number, search: string) => {
    setIsLoading(true);
    try {
      const result = await fetchAdminUsers({ page, limit: PAGE_LIMIT, search: search.trim() || undefined });
      setUsers(result.users);
      setPagination(result.pagination);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to load users.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadUsers(1, "");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    searchTimeoutRef.current = setTimeout(() => {
      setCurrentPage(1);
      loadUsers(1, query);
    }, 350);
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
    loadUsers(newPage, searchQuery);
  };

  const handleStatusToggle = async (user: AdminUser) => {
    try {
      const updated = await updateAdminUserStatus(user._id, !user.isActive);
      if (updated) {
        setUsers((current) =>
          current.map((item) => (item._id === user._id ? { ...item, isActive: updated.isActive } : item))
        );
      }
      toast.success(user.isActive ? "User suspended successfully." : "User activated successfully.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to update user.");
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm(`Delete ${user.firstName} ${user.lastName}?`)) return;

    try {
      await deleteAdminUser(user._id);
      setUsers((current) => current.filter((item) => item._id !== user._id));
      setPagination((prev) => ({ ...prev, total: Math.max(0, prev.total - 1) }));
      toast.success("User deleted.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Unable to delete user.");
    }
  };

  const suspendedCount = users.filter((user) => !user.isActive).length;

  return (
    <section className="admin-users-page">
      <header className="admin-users-header">
        <h1>Users</h1>
        <p>
          {pagination.total} accounts · {suspendedCount} suspended on this page
        </p>
      </header>

      <label className="admin-user-search">
        <Search aria-hidden="true" />
        <input
          type="search"
          placeholder="Search users..."
          value={searchQuery}
          onChange={(event) => handleSearchChange(event.target.value)}
        />
      </label>

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
            <div className="admin-users-empty" style={{ textAlign: "left" }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div key={i} style={{ display: "flex", gap: 16, padding: "11px 0", borderBottom: "1px solid var(--line)" }}>
                  <div className="skeleton skeleton-avatar" style={{ width: 36, height: 36 }} />
                  <div className="skeleton skeleton-text wide" style={{ flex: 1 }} />
                  <div className="skeleton skeleton-text" style={{ width: 100 }} />
                  <div className="skeleton skeleton-text short" style={{ width: 72 }} />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="admin-users-empty">No users found.</div>
          ) : (
            users.map((user) => {
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

      {pagination.totalPages > 1 ? (
        <div className="admin-pagination">
          <button
            type="button"
            disabled={!pagination.hasPrevPage}
            onClick={() => handlePageChange(currentPage - 1)}
            aria-label="Previous page"
          >
            <ChevronLeft aria-hidden="true" />
          </button>
          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            type="button"
            disabled={!pagination.hasNextPage}
            onClick={() => handlePageChange(currentPage + 1)}
            aria-label="Next page"
          >
            <ChevronRight aria-hidden="true" />
          </button>
        </div>
      ) : null}
    </section>
  );
}
