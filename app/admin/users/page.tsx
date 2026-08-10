'use client';

import React, { useEffect, useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import SkeletonLoader from '@/components/SkeletonLoader';
import { Users, ShieldAlert, Plus, Bot, CheckCircle2, XCircle, UserCheck, Shield, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  is_active: boolean;
  created_at: string;
}

export default function AdminUsersPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [users, setUsers] = useState<UserItem[]>([]);
  
  // Pagination State (Default Limit: 10)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  // New & Edit User Form State
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'ADMIN' | 'MANAGER' | 'MEMBER'>('MEMBER');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async (targetPage = page, targetLimit = limit) => {
    try {
      setTabLoading(true);
      const usersRes = await fetch(`/api/admin/users?page=${targetPage}&limit=${targetLimit}`);
      if (!usersRes.ok) throw new Error('Failed to load user roster');

      const uData = await usersRes.json();
      setUsers(uData.users || []);
      if (uData.pagination) setPagination(uData.pagination);
    } catch (err: any) {
      setError(err.message || 'Error loading users');
    } finally {
      setTabLoading(false);
    }
  };

  useEffect(() => {
    async function init() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          window.location.href = '/';
          return;
        }
        const meData = await meRes.json();
        setCurrentUser(meData.user);

        if (meData.user.role !== 'ADMIN') {
          setError('Access Denied: System Administrator role required');
          return;
        }

        await fetchUsers(1, limit);
      } catch (err: any) {
        setError(err.message || 'Error loading users');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    fetchUsers(1, newLimit);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    fetchUsers(newPage, limit);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create user');
      }

      setShowAddModal(false);
      setNewName('');
      setNewEmail('');
      setNewPassword('');
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setSubmitting(true);

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: editingUser.id,
          name: newName,
          email: newEmail,
          role: newRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update user');
      }

      setEditingUser(null);
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user account?')) return;
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete user account');
      fetchUsers();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const toggleUserActive = async (id: string, active: boolean) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: id, is_active: !active }),
      });

      if (res.ok) {
        setUsers(
          users.map((u) => (u.id === id ? { ...u, is_active: !active } : u))
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <SidebarLayout user={currentUser}>
        <SkeletonLoader variant="full" />
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout user={currentUser}>
        <div className="p-8 rounded-2xl glass-surface border-rose-500/50 text-center space-y-4 max-w-md mx-auto my-12">
          <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="font-heading text-2xl font-extrabold text-white">Admin Access Required</h2>
          <p className="text-xs text-rose-200 font-medium">{error}</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout user={currentUser}>
      <div className="space-y-8">
        
        {/* Header Title Panel */}
        <div className="glass-surface p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-cyan-500/30 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950">
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-extrabold text-white">
              User Administration Panel
            </h1>
            <p className="text-xs text-gray-300 font-mono mt-1">
              Manage Credentials & Role-Based PostgreSQL Access Control Scope ({pagination.total} total accounts)
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setNewName('');
                setNewEmail('');
                setNewPassword('');
                setNewRole('MEMBER');
                setShowAddModal(true);
              }}
              className="btn-gradient px-4 py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center gap-2 shadow-lg shadow-cyan-500/30"
            >
              <Plus className="w-4 h-4" /> Provision New User
            </button>
          </div>
        </div>

        {/* Top Control Bar: Items Per Page Selector */}
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono text-cyan-300 font-bold">
            Total {pagination.total} User Accounts
          </div>

          <div className="flex items-center gap-2 bg-gray-950 p-2 rounded-xl border border-white/15 text-xs font-extrabold text-white">
            <span className="text-gray-300 font-mono">Show per page:</span>
            <select
              value={limit}
              onChange={(e) => handleLimitChange(parseInt(e.target.value))}
              className="bg-gray-900 text-cyan-300 font-bold border border-cyan-500/40 rounded-lg px-2 py-1 text-xs outline-none cursor-pointer"
            >
              <option value={5}>5 items</option>
              <option value={10}>10 items (Default)</option>
              <option value={25}>25 items</option>
              <option value={50}>50 items</option>
            </select>
          </div>
        </div>

        {/* User Roster Table Panel */}
        {tabLoading ? (
          <SkeletonLoader variant="table" rows={limit} />
        ) : (
          <div className="glass-surface p-6 border-white/15 space-y-4 bg-gray-950/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/15 text-cyan-300 font-extrabold uppercase tracking-wider bg-gray-900">
                    <th className="py-3.5 px-4">User Name</th>
                    <th className="py-3.5 px-4">Email Address</th>
                    <th className="py-3.5 px-4">PostgreSQL RLS Role</th>
                    <th className="py-3.5 px-4">Account Status</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="py-4 px-4 font-bold text-white flex items-center gap-2.5 font-sans">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-extrabold flex items-center justify-center text-xs">
                          {u.name.substring(0, 2).toUpperCase()}
                        </div>
                        {u.name}
                      </td>
                      <td className="py-4 px-4 text-cyan-300 font-bold">{u.email}</td>
                      <td className="py-4 px-4">
                        <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md uppercase tracking-wider ${
                          u.role === 'ADMIN' ? 'role-badge-admin' : u.role === 'MANAGER' ? 'role-badge-manager' : 'role-badge-member'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {u.is_active ? (
                          <span className="text-emerald-300 font-bold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Active
                          </span>
                        ) : (
                          <span className="text-rose-300 font-bold flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" /> Suspended
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-4 text-gray-300">{new Date(u.created_at).toLocaleDateString()}</td>
                      <td className="py-4 px-4 text-right space-x-2">
                        {/* Edit User Button (Pencil Icon) */}
                        <button
                          onClick={() => {
                            setEditingUser(u);
                            setNewName(u.name);
                            setNewEmail(u.email);
                            setNewRole(u.role);
                          }}
                          className="btn-action-edit"
                          title="Edit User Account"
                        >
                          <Pencil className="w-3.5 h-3.5" /> Edit
                        </button>

                        {/* Suspend / Activate Status Button */}
                        <button
                          onClick={() => toggleUserActive(u.id, u.is_active)}
                          className={`px-2.5 py-1 rounded-lg font-bold border transition-all text-xs ${
                            u.is_active
                              ? 'bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border-amber-500/40'
                              : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border-emerald-500/40'
                          }`}
                        >
                          {u.is_active ? 'Suspend' : 'Activate'}
                        </button>

                        {/* Delete User Button (Red Trash Icon) */}
                        <button
                          onClick={() => handleDeleteUser(u.id)}
                          className="btn-action-delete"
                          title="Delete User Account"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Universal Pagination Navigation Controls Bar */}
        <div className="glass-surface p-4 border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-950">
          <div className="text-xs font-mono text-gray-300">
            Showing <strong className="text-white">{(page - 1) * limit + 1}</strong> to{' '}
            <strong className="text-white">{Math.min(page * limit, pagination.total)}</strong> of{' '}
            <strong className="text-cyan-300">{pagination.total}</strong> total user accounts
          </div>

          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => handlePageChange(page - 1)}
              className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed border border-white/15 text-xs font-extrabold text-cyan-300 flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>

            <span className="px-3 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-xs font-mono text-cyan-300 font-bold">
              Page {page} of {pagination.totalPages}
            </span>

            <button
              disabled={page >= pagination.totalPages}
              onClick={() => handlePageChange(page + 1)}
              className="px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 disabled:opacity-40 disabled:cursor-not-allowed border border-white/15 text-xs font-extrabold text-cyan-300 flex items-center gap-1"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>

      {/* Edit User Modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleUpdateUser} className="glass-surface max-w-md w-full p-6 space-y-4 border-cyan-500/50 relative bg-gray-950">
            <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-400" /> Edit User Account
            </h2>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">PostgreSQL RLS Role</label>
              <select
                value={newRole}
                onChange={(e: any) => setNewRole(e.target.value)}
                className="w-full glass-input text-xs"
              >
                <option value="MEMBER" className="bg-gray-900 text-white">MEMBER (Lead Generator)</option>
                <option value="MANAGER" className="bg-gray-900 text-white">MANAGER (Sales Manager)</option>
                <option value="ADMIN" className="bg-gray-900 text-white">ADMIN (System Administrator)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg shadow-cyan-500/30"
              >
                {submitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateUser} className="glass-surface max-w-md w-full p-6 space-y-4 border-cyan-500/50 relative bg-gray-950">
            <h2 className="font-heading font-extrabold text-xl text-white">Provision User Credentials</h2>
            <p className="text-xs text-gray-300 font-medium">Creates user credentials & assigns PostgreSQL RLS scope.</p>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Full Name</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Marcus Vance"
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Email Address</label>
              <input
                type="email"
                required
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="marcus@crm.com"
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Password</label>
              <input
                type="password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">PostgreSQL RLS Role</label>
              <select
                value={newRole}
                onChange={(e: any) => setNewRole(e.target.value)}
                className="w-full glass-input text-xs"
              >
                <option value="MEMBER" className="bg-gray-900 text-white">MEMBER (Lead Generator)</option>
                <option value="MANAGER" className="bg-gray-900 text-white">MANAGER (Sales Manager)</option>
                <option value="ADMIN" className="bg-gray-900 text-white">ADMIN (System Administrator)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg shadow-cyan-500/30"
              >
                {submitting ? 'Provisioning...' : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}
    </SidebarLayout>
  );
}
