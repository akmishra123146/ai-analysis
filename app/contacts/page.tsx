'use client';

import React, { useEffect, useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import SkeletonLoader from '@/components/SkeletonLoader';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Users, Search, Plus, Download, ArrowUpRight, Filter, FileText, CheckCircle2, Shield, Bot, ArrowUpDown, Eye, X, DollarSign, Activity, ChevronLeft, ChevronRight, Pencil, Trash2 } from 'lucide-react';

interface Contact {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  status: 'LEAD' | 'QUALIFIED' | 'CUSTOMER';
  sales_manager_id: string;
  lead_generator_id: string;
  created_at: string;
}

export default function ContactsPage() {
  const searchParams = useSearchParams();
  const currentViewParam = searchParams?.get('view') || 'contacts';

  const [activeView, setActiveView] = useState<string>(currentViewParam);
  const [user, setUser] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [estimates, setEstimates] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'company' | 'status'>('company');

  // Universal Pagination State (Default Limit: 10)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  
  const [loading, setLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);

  // Modals State
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddEstimate, setShowAddEstimate] = useState(false);
  const [quickViewContact, setQuickViewContact] = useState<Contact | null>(null);

  // Form State
  const [selectedContactId, setSelectedContactId] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newStatus, setNewStatus] = useState<'LEAD' | 'QUALIFIED' | 'CUSTOMER'>('LEAD');

  const [invNum, setInvNum] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invDueDate, setInvDueDate] = useState('2026-09-01');
  const [invStatus, setInvStatus] = useState('SENT');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('2026-08-25');

  const [estNum, setEstNum] = useState('');
  const [estAmount, setEstAmount] = useState('');
  const [estValidUntil, setEstValidUntil] = useState('2026-09-15');

  const [submitting, setSubmitting] = useState(false);

  const refreshData = async (targetPage = page, targetLimit = limit, targetView = activeView) => {
    try {
      setTabLoading(true);

      if (targetView === 'contacts') {
        const contactsRes = await fetch(`/api/contacts?page=${targetPage}&limit=${targetLimit}`);
        if (contactsRes.ok) {
          const data = await contactsRes.json();
          setContacts(data.contacts || []);
          if (data.pagination) setPagination(data.pagination);
          if (data.contacts && data.contacts.length > 0 && !selectedContactId) {
            setSelectedContactId(data.contacts[0].id);
          }
        }
      } else if (targetView === 'invoices') {
        const invRes = await fetch(`/api/invoices?page=${targetPage}&limit=${targetLimit}`);
        if (invRes.ok) {
          const invData = await invRes.json();
          setInvoices(invData.invoices || []);
          if (invData.pagination) setPagination(invData.pagination);
        }
      } else if (targetView === 'tasks') {
        const tasksRes = await fetch(`/api/tasks?page=${targetPage}&limit=${targetLimit}`);
        if (tasksRes.ok) {
          const tData = await tasksRes.json();
          setTasks(tData.tasks || []);
          if (tData.pagination) setPagination(tData.pagination);
        }
      } else if (targetView === 'estimates') {
        const estRes = await fetch(`/api/estimates?page=${targetPage}&limit=${targetLimit}`);
        if (estRes.ok) {
          const eData = await estRes.json();
          setEstimates(eData.estimates || []);
          if (eData.pagination) setPagination(eData.pagination);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTabLoading(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    async function initUser() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          window.location.href = '/';
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);
      } catch (err) {
        console.error(err);
      }
    }
    initUser();
  }, []);

  useEffect(() => {
    const viewFromUrl = searchParams?.get('view') || 'contacts';
    setActiveView(viewFromUrl);
    setPage(1);
    refreshData(1, limit, viewFromUrl);
  }, [searchParams]);

  const handleTabChange = (viewId: string) => {
    setActiveView(viewId);
    setPage(1);
    const newUrl = viewId === 'contacts' ? '/contacts' : `/contacts?view=${viewId}`;
    window.history.pushState({}, '', newUrl);
    refreshData(1, limit, viewId);
  };

  const handleLimitChange = (newLimit: number) => {
    setLimit(newLimit);
    setPage(1);
    refreshData(1, newLimit, activeView);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    refreshData(newPage, limit, activeView);
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: newCompany,
          contact_name: newName,
          email: newEmail,
          phone: newPhone,
          status: newStatus,
        }),
      });
      if (!res.ok) throw new Error('Failed to create contact');
      setShowAddContact(false);
      setNewCompany('');
      setNewName('');
      setNewEmail('');
      setNewPhone('');
      refreshData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContact) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingContact.id,
          company_name: newCompany || editingContact.company_name,
          contact_name: newName || editingContact.contact_name,
          email: newEmail || editingContact.email,
          phone: newPhone || editingContact.phone,
          status: newStatus || editingContact.status,
        }),
      });
      if (!res.ok) throw new Error('Failed to update contact');
      setEditingContact(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    if (!confirm('Are you sure you want to delete this contact and all associated sub-entities?')) return;
    try {
      const res = await fetch(`/api/contacts?id=${contactId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete contact');
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: selectedContactId,
          invoice_number: invNum,
          amount: invAmount,
          currency: 'INR',
          issue_date: new Date().toISOString().split('T')[0],
          due_date: invDueDate,
          status: invStatus,
        }),
      });
      if (!res.ok) throw new Error('Failed to create invoice');
      setShowAddInvoice(false);
      setInvNum('');
      setInvAmount('');
      refreshData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: selectedContactId,
          title: taskTitle,
          due_date: taskDueDate,
          status: 'OPEN',
        }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      setShowAddTask(false);
      setTaskTitle('');
      refreshData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: selectedContactId,
          estimate_number: estNum,
          amount: estAmount,
          currency: 'INR',
          valid_until: estValidUntil,
          status: 'SENT',
        }),
      });
      if (!res.ok) throw new Error('Failed to create estimate');
      setShowAddEstimate(false);
      setEstNum('');
      setEstAmount('');
      refreshData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filteredContacts = contacts
    .filter((c) => {
      const matchesSearch =
        c.company_name.toLowerCase().includes(search.toLowerCase()) ||
        c.contact_name.toLowerCase().includes(search.toLowerCase()) ||
        c.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'company') {
        return a.company_name.localeCompare(b.company_name);
      } else {
        return a.status.localeCompare(b.status);
      }
    });

  if (loading) {
    return (
      <SidebarLayout user={user}>
        <SkeletonLoader variant="full" />
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout user={user}>
      <div className="space-y-8">
        
        {/* Header & Export Actions */}
        <div className="glass-surface p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-cyan-500/30 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl lg:text-3xl font-extrabold text-white">
                {activeView === 'invoices' ? 'Invoices & Financial Ledger' :
                 activeView === 'tasks' ? 'Action Items & Tasks' :
                 activeView === 'estimates' ? 'Quotations & Proposals' :
                 'Contacts Directory Panel'}
              </h1>
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                Total {pagination.total} Records
              </span>
            </div>
            <p className="text-xs text-gray-300 font-mono mt-1">
              Protected by PostgreSQL RLS Session Scoping • Standard Action Icons
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {activeView === 'contacts' && (
              <button
                onClick={() => {
                  setNewCompany('');
                  setNewName('');
                  setNewEmail('');
                  setNewPhone('');
                  setNewStatus('LEAD');
                  setShowAddContact(true);
                }}
                className="btn-gradient px-4 py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center gap-2 shadow-lg shadow-cyan-500/30"
              >
                <Plus className="w-4 h-4" /> Add New Contact
              </button>
            )}

            {activeView === 'invoices' && (
              <button
                onClick={() => {
                  setInvNum(`INV-2026-00${invoices.length + 1}`);
                  setShowAddInvoice(true);
                }}
                className="btn-gradient px-4 py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center gap-2 shadow-lg shadow-cyan-500/30"
              >
                <Plus className="w-4 h-4" /> Create Invoice
              </button>
            )}

            {activeView === 'tasks' && (
              <button
                onClick={() => setShowAddTask(true)}
                className="btn-gradient px-4 py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center gap-2 shadow-lg shadow-cyan-500/30"
              >
                <Plus className="w-4 h-4" /> Add Task
              </button>
            )}

            {activeView === 'estimates' && (
              <button
                onClick={() => {
                  setEstNum(`EST-2026-00${estimates.length + 1}`);
                  setShowAddEstimate(true);
                }}
                className="btn-gradient px-4 py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center gap-2 shadow-lg shadow-cyan-500/30"
              >
                <Plus className="w-4 h-4" /> Create Estimate
              </button>
            )}

            <a
              href={`/api/export?format=csv&entity=${activeView === 'contacts' ? 'contacts' : activeView}`}
              target="_blank"
              download={`${activeView}.csv`}
              className="glass-surface glass-surface-hover px-4 py-2.5 rounded-xl text-xs font-bold text-gray-200 flex items-center gap-2 border-white/15"
            >
              <Download className="w-4 h-4 text-cyan-400" /> Export CSV
            </a>

            <a
              href={`/api/export?format=markdown&entity=${activeView === 'contacts' ? 'contacts' : activeView}`}
              target="_blank"
              download={`${activeView}.md`}
              className="glass-surface glass-surface-hover px-4 py-2.5 rounded-xl text-xs font-bold text-gray-200 flex items-center gap-2 border-white/15"
            >
              <FileText className="w-4 h-4 text-violet-400" /> Export Markdown
            </a>
          </div>
        </div>

        {/* View Mode Selection Bar & Page Size Selector */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 bg-gray-950/90 p-1.5 rounded-2xl border border-white/15 overflow-x-auto w-full sm:w-auto">
            {[
              { id: 'contacts', label: 'Contacts Directory', icon: Users },
              { id: 'invoices', label: 'Invoices Ledger', icon: DollarSign },
              { id: 'tasks', label: 'Tasks', icon: CheckCircle2 },
              { id: 'estimates', label: 'Estimates', icon: FileText },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                    activeView === tab.id
                      ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/20'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-400" /> {tab.label}
                </button>
              );
            })}
          </div>

          {/* Dynamic Items-Per-Page Selector Dropdown */}
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

        {/* Tab Body Skeleton Loader during transitions */}
        {tabLoading ? (
          <SkeletonLoader variant="table" rows={limit} />
        ) : (
          <>
            {/* 1. Contacts View */}
            {activeView === 'contacts' && (
              <div className="space-y-4">
                <div className="glass-surface p-4 flex flex-col md:flex-row items-center justify-between gap-4 border-white/15 bg-gray-950">
                  <div className="relative w-full md:w-80">
                    <Search className="w-4 h-4 text-cyan-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search company, name, email..."
                      className="w-full glass-input text-xs pl-10"
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded-xl border border-white/15 text-xs font-bold text-gray-300">
                      <ArrowUpDown className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Sort by:</span>
                      <button
                        onClick={() => setSortBy(sortBy === 'company' ? 'status' : 'company')}
                        className="text-cyan-300 hover:underline uppercase font-mono font-bold"
                      >
                        {sortBy}
                      </button>
                    </div>

                    <div className="flex items-center gap-1.5 bg-gray-900 p-1 rounded-xl border border-white/15">
                      {['ALL', 'LEAD', 'QUALIFIED', 'CUSTOMER'].map((st) => (
                        <button
                          key={st}
                          onClick={() => setStatusFilter(st)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-extrabold transition-all ${
                            statusFilter === st
                              ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-sm'
                              : 'text-gray-300 hover:text-white hover:bg-white/5'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="glass-surface overflow-hidden border-white/15 p-6 bg-gray-950/80">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-white/15 text-cyan-300 font-extrabold uppercase tracking-wider bg-gray-900">
                          <th className="py-3.5 px-4">Company Name</th>
                          <th className="py-3.5 px-4">Primary Contact</th>
                          <th className="py-3.5 px-4">Email Address</th>
                          <th className="py-3.5 px-4">Phone Number</th>
                          <th className="py-3.5 px-4">Pipeline Status</th>
                          <th className="py-3.5 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {filteredContacts.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="py-12 text-center text-gray-400 font-mono">
                              No contacts found matching your search and status filter.
                            </td>
                          </tr>
                        ) : (
                          filteredContacts.map((contact) => (
                            <tr key={contact.id} className="hover:bg-white/5 transition-colors group">
                              <td className="py-4 px-4 font-bold text-white flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-extrabold flex items-center justify-center text-xs">
                                  {contact.company_name.substring(0, 2).toUpperCase()}
                                </div>
                                {contact.company_name}
                              </td>
                              <td className="py-4 px-4 text-gray-200 font-medium">{contact.contact_name}</td>
                              <td className="py-4 px-4 font-mono text-[11px] text-cyan-300 font-bold">{contact.email}</td>
                              <td className="py-4 px-4 font-mono text-[11px] text-gray-300">{contact.phone}</td>
                              <td className="py-4 px-4">
                                <span
                                  className={`px-2.5 py-1 text-[10px] font-extrabold rounded-md uppercase tracking-wider ${
                                    contact.status === 'CUSTOMER'
                                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                      : contact.status === 'QUALIFIED'
                                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40'
                                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                  }`}
                                >
                                  {contact.status}
                                </span>
                              </td>
                              <td className="py-4 px-4 text-right space-x-2">
                                {/* Eye Icon for View */}
                                <Link
                                  href={`/contacts/${contact.id}`}
                                  className="btn-action-view"
                                  title="View Contact Details"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View
                                </Link>

                                {/* Pencil Icon for Edit */}
                                <button
                                  onClick={() => {
                                    setEditingContact(contact);
                                    setNewCompany(contact.company_name);
                                    setNewName(contact.contact_name);
                                    setNewEmail(contact.email);
                                    setNewPhone(contact.phone || '');
                                    setNewStatus(contact.status);
                                  }}
                                  className="btn-action-edit"
                                  title="Edit Contact"
                                >
                                  <Pencil className="w-3.5 h-3.5" /> Edit
                                </button>

                                {/* Red Trash Icon for Delete */}
                                <button
                                  onClick={() => handleDeleteContact(contact.id)}
                                  className="btn-action-delete"
                                  title="Delete Contact"
                                >
                                  <Trash2 className="w-3.5 h-3.5" /> Delete
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Invoices View */}
            {activeView === 'invoices' && (
              <div className="glass-surface p-6 border-white/15 space-y-4 bg-gray-950/80">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading font-extrabold text-lg text-white">Invoices & Financial Ledger</h2>
                  <span className="text-xs font-mono text-cyan-300">Paginated Ledger ({invoices.length} of {pagination.total})</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/15 text-cyan-300 font-extrabold uppercase tracking-wider bg-gray-900">
                        <th className="py-3.5 px-4">Company</th>
                        <th className="py-3.5 px-4">Invoice #</th>
                        <th className="py-3.5 px-4">Amount</th>
                        <th className="py-3.5 px-4">Issue Date</th>
                        <th className="py-3.5 px-4">Due Date</th>
                        <th className="py-3.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                      {invoices.length === 0 ? (
                        <tr><td colSpan={6} className="py-8 text-center text-gray-400">No invoices recorded under your role scope.</td></tr>
                      ) : (
                        invoices.map((inv: any) => (
                          <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-white">{inv.company_name}</td>
                            <td className="py-3.5 px-4 text-cyan-300 font-bold">{inv.invoice_number}</td>
                            <td className="py-3.5 px-4 text-emerald-300 font-bold">
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(inv.amount)}
                            </td>
                            <td className="py-3.5 px-4 text-gray-300">{new Date(inv.issue_date).toLocaleDateString()}</td>
                            <td className="py-3.5 px-4 text-gray-300">{new Date(inv.due_date).toLocaleDateString()}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md uppercase ${
                                inv.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                inv.status === 'OVERDUE' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                                'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. Tasks View */}
            {activeView === 'tasks' && (
              <div className="glass-surface p-6 border-white/15 space-y-4 bg-gray-950/80">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading font-extrabold text-lg text-white">Action Items & Scheduled Tasks</h2>
                  <span className="text-xs font-mono text-cyan-300">Paginated Tasks ({tasks.length} of {pagination.total})</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/15 text-cyan-300 font-extrabold uppercase tracking-wider bg-gray-900">
                        <th className="py-3.5 px-4">Company</th>
                        <th className="py-3.5 px-4">Task Title</th>
                        <th className="py-3.5 px-4">Due Date</th>
                        <th className="py-3.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                      {tasks.length === 0 ? (
                        <tr><td colSpan={4} className="py-8 text-center text-gray-400">No tasks assigned under your role scope.</td></tr>
                      ) : (
                        tasks.map((t: any) => (
                          <tr key={t.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-white">{t.company_name}</td>
                            <td className="py-3.5 px-4 font-sans text-gray-200">{t.title}</td>
                            <td className="py-3.5 px-4 text-gray-300">{new Date(t.due_date).toLocaleDateString()}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md uppercase ${
                                t.status === 'DONE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                t.status === 'IN_PROGRESS' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                                'bg-gray-800 text-gray-200'
                              }`}>
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 4. Estimates View */}
            {activeView === 'estimates' && (
              <div className="glass-surface p-6 border-white/15 space-y-4 bg-gray-950/80">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading font-extrabold text-lg text-white">Quotations & Proposals</h2>
                  <span className="text-xs font-mono text-cyan-300">Paginated Estimates ({estimates.length} of {pagination.total})</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-white/15 text-cyan-300 font-extrabold uppercase tracking-wider bg-gray-900">
                        <th className="py-3.5 px-4">Company</th>
                        <th className="py-3.5 px-4">Estimate #</th>
                        <th className="py-3.5 px-4">Quoted Amount</th>
                        <th className="py-3.5 px-4">Valid Until</th>
                        <th className="py-3.5 px-4">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                      {estimates.length === 0 ? (
                        <tr><td colSpan={5} className="py-8 text-center text-gray-400">No estimates generated under your role scope.</td></tr>
                      ) : (
                        estimates.map((est: any) => (
                          <tr key={est.id} className="hover:bg-white/5 transition-colors">
                            <td className="py-3.5 px-4 font-bold text-white">{est.company_name}</td>
                            <td className="py-3.5 px-4 text-cyan-300 font-bold">{est.estimate_number}</td>
                            <td className="py-3.5 px-4 text-emerald-300 font-bold">
                              {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(est.amount)}
                            </td>
                            <td className="py-3.5 px-4 text-gray-300">{new Date(est.valid_until).toLocaleDateString()}</td>
                            <td className="py-3.5 px-4">
                              <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md uppercase ${
                                est.status === 'ACCEPTED' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                                est.status === 'REJECTED' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                                'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                              }`}>
                                {est.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* Universal Pagination Navigation Controls Bar */}
        <div className="glass-surface p-4 border-white/15 flex flex-col sm:flex-row items-center justify-between gap-4 bg-gray-950">
          <div className="text-xs font-mono text-gray-300">
            Showing <strong className="text-white">{(page - 1) * limit + 1}</strong> to{' '}
            <strong className="text-white">{Math.min(page * limit, pagination.total)}</strong> of{' '}
            <strong className="text-cyan-300">{pagination.total}</strong> total items
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

      {/* Edit Contact Modal */}
      {editingContact && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleUpdateContact} className="glass-surface max-w-md w-full p-6 space-y-4 border-cyan-500/50 relative bg-gray-950">
            <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-400" /> Edit Contact Entity
            </h2>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Company Name</label>
              <input
                type="text"
                required
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Contact Person</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-full glass-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
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
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Pipeline Status</label>
              <select
                value={newStatus}
                onChange={(e: any) => setNewStatus(e.target.value)}
                className="w-full glass-input text-xs"
              >
                <option value="LEAD" className="bg-gray-900 text-white">LEAD</option>
                <option value="QUALIFIED" className="bg-gray-900 text-white">QUALIFIED</option>
                <option value="CUSTOMER" className="bg-gray-900 text-white">CUSTOMER</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingContact(null)}
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

      {/* Add Invoice Modal with Contact Selector */}
      {showAddInvoice && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateInvoice} className="glass-surface max-w-md w-full p-6 space-y-4 border-cyan-500/50 relative bg-gray-950">
            <h2 className="font-heading font-extrabold text-xl text-white">Create New Invoice</h2>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Select Parent Contact</label>
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full glass-input text-xs"
              >
                {contacts.map((c) => (
                  <option key={c.id} value={c.id} className="bg-gray-900 text-white">
                    {c.company_name} ({c.contact_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Invoice Number</label>
              <input
                type="text"
                required
                value={invNum}
                onChange={(e) => setInvNum(e.target.value)}
                placeholder="INV-2026-009"
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Amount (INR)</label>
              <input
                type="number"
                required
                value={invAmount}
                onChange={(e) => setInvAmount(e.target.value)}
                placeholder="250000"
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Due Date</label>
              <input
                type="date"
                required
                value={invDueDate}
                onChange={(e) => setInvDueDate(e.target.value)}
                className="w-full glass-input text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddInvoice(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg shadow-cyan-500/30"
              >
                {submitting ? 'Creating...' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Task Modal with Contact Selector */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateTask} className="glass-surface max-w-md w-full p-6 space-y-4 border-cyan-500/50 relative bg-gray-950">
            <h2 className="font-heading font-extrabold text-xl text-white">Add New Action Item</h2>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Select Parent Contact</label>
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full glass-input text-xs"
              >
                {contacts.map((c) => (
                  <option key={c.id} value={c.id} className="bg-gray-900 text-white">
                    {c.company_name} ({c.contact_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Task Title</label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Follow up on proposed terms"
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Due Date</label>
              <input
                type="date"
                required
                value={taskDueDate}
                onChange={(e) => setTaskDueDate(e.target.value)}
                className="w-full glass-input text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddTask(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg shadow-cyan-500/30"
              >
                {submitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Estimate Modal with Contact Selector */}
      {showAddEstimate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateEstimate} className="glass-surface max-w-md w-full p-6 space-y-4 border-cyan-500/50 relative bg-gray-950">
            <h2 className="font-heading font-extrabold text-xl text-white">Create New Quotation</h2>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Select Parent Contact</label>
              <select
                value={selectedContactId}
                onChange={(e) => setSelectedContactId(e.target.value)}
                className="w-full glass-input text-xs"
              >
                {contacts.map((c) => (
                  <option key={c.id} value={c.id} className="bg-gray-900 text-white">
                    {c.company_name} ({c.contact_name})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Estimate Number</label>
              <input
                type="text"
                required
                value={estNum}
                onChange={(e) => setEstNum(e.target.value)}
                placeholder="EST-2026-009"
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Quoted Amount (INR)</label>
              <input
                type="number"
                required
                value={estAmount}
                onChange={(e) => setEstAmount(e.target.value)}
                placeholder="180000"
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Valid Until Date</label>
              <input
                type="date"
                required
                value={estValidUntil}
                onChange={(e) => setEstValidUntil(e.target.value)}
                className="w-full glass-input text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddEstimate(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg shadow-cyan-500/30"
              >
                {submitting ? 'Creating...' : 'Create Estimate'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add New Contact Modal */}
      {showAddContact && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateContact} className="glass-surface max-w-md w-full p-6 space-y-4 border-cyan-500/50 relative bg-gray-950">
            <h2 className="font-heading font-extrabold text-xl text-white">Add New Contact Entity</h2>
            <p className="text-xs text-gray-300 font-medium">Created contact will automatically inherit your user RLS ownership.</p>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Company Name</label>
              <input
                type="text"
                required
                value={newCompany}
                onChange={(e) => setNewCompany(e.target.value)}
                placeholder="Apex Innovations"
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Contact Person</label>
              <input
                type="text"
                required
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Jane Vance"
                className="w-full glass-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="jane@apex.com"
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  placeholder="+1-555-9988"
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Pipeline Status</label>
              <select
                value={newStatus}
                onChange={(e: any) => setNewStatus(e.target.value)}
                className="w-full glass-input text-xs"
              >
                <option value="LEAD" className="bg-gray-900 text-white">LEAD</option>
                <option value="QUALIFIED" className="bg-gray-900 text-white">QUALIFIED</option>
                <option value="CUSTOMER" className="bg-gray-900 text-white">CUSTOMER</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddContact(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg shadow-cyan-500/30"
              >
                {submitting ? 'Saving...' : 'Create Contact'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Quick View Contact Preview Drawer */}
      {quickViewContact && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-surface max-w-lg w-full p-6 space-y-4 border-cyan-500/50 relative bg-gray-950">
            <button
              onClick={() => setQuickViewContact(null)}
              className="absolute top-5 right-5 text-gray-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl btn-gradient flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
                {quickViewContact.company_name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h2 className="font-heading font-extrabold text-xl text-white">{quickViewContact.company_name}</h2>
                <p className="text-xs text-cyan-300 font-mono font-bold">{quickViewContact.email}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2 text-xs text-gray-200 font-mono">
              <div className="p-3.5 rounded-xl bg-gray-900 border border-white/15 space-y-1.5">
                <div>Contact Representative: <strong className="text-white font-bold">{quickViewContact.contact_name}</strong></div>
                <div>Phone Number: <strong className="text-white font-bold">{quickViewContact.phone}</strong></div>
                <div>Pipeline Status: <strong className="text-cyan-300 font-bold">{quickViewContact.status}</strong></div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setQuickViewContact(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white"
              >
                Close Preview
              </button>
              <Link
                href={`/contacts/${quickViewContact.id}`}
                className="btn-action-view flex items-center gap-1.5"
              >
                <Eye className="w-4 h-4" /> Open Full Detail Page
              </Link>
            </div>
          </div>
        </div>
      )}

    </SidebarLayout>
  );
}
