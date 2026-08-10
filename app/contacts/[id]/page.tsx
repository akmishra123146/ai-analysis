'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import SidebarLayout from '@/components/SidebarLayout';
import Link from 'next/link';
import { ArrowLeft, Building2, User, Mail, Phone, FileText, CheckCircle2, DollarSign, Calendar, Paperclip, Activity, ShieldAlert, Bot, Layers, ChevronRight, Download, Sparkles, Plus, Pencil, Trash2, Eye, X, ShieldCheck, Upload } from 'lucide-react';

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawId = params?.id;
  const id = Array.isArray(rawId) ? rawId[0] : (rawId as string);

  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'invoices' | 'tasks' | 'estimates' | 'activities' | 'attachments'>('all');

  // Modal States
  const [showEditContact, setShowEditContact] = useState(false);
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddEstimate, setShowAddEstimate] = useState(false);
  const [showAddAttachment, setShowAddAttachment] = useState(false);
  const [editingItem, setEditingItem] = useState<{ type: 'invoice' | 'task' | 'estimate'; item: any } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Contact Form State
  const [companyName, setCompanyName] = useState('');
  const [contactName, setContactName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'LEAD' | 'QUALIFIED' | 'CUSTOMER'>('LEAD');

  // Sub-Entity Form States
  const [invNum, setInvNum] = useState('');
  const [invAmount, setInvAmount] = useState('');
  const [invDueDate, setInvDueDate] = useState('2026-09-01');
  const [invStatus, setInvStatus] = useState('SENT');

  const [taskTitle, setTaskTitle] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('2026-08-25');
  const [taskStatus, setTaskStatus] = useState('OPEN');

  const [estNum, setEstNum] = useState('');
  const [estAmount, setEstAmount] = useState('');
  const [estValidUntil, setEstValidUntil] = useState('2026-09-15');
  const [estStatus, setEstStatus] = useState('SENT');

  // 10MB File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const refreshData = async () => {
    if (!id) return;
    try {
      const contactRes = await fetch(`/api/contacts/${id}`);
      if (contactRes.ok) {
        const cData = await contactRes.json();
        setData(cData);
        if (cData.contact) {
          setCompanyName(cData.contact.company_name);
          setContactName(cData.contact.contact_name);
          setEmail(cData.contact.email);
          setPhone(cData.contact.phone || '');
          setStatus(cData.contact.status);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!id) return;
    async function fetchData() {
      try {
        setLoading(true);
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/');
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);

        const contactRes = await fetch(`/api/contacts/${id}`);
        if (contactRes.status === 404) {
          setError('No matching contact found');
          return;
        }
        if (!contactRes.ok) {
          setError('Failed to load contact details');
          return;
        }

        const cData = await contactRes.json();
        setData(cData);
        if (cData.contact) {
          setCompanyName(cData.contact.company_name);
          setContactName(cData.contact.contact_name);
          setEmail(cData.contact.email);
          setPhone(cData.contact.phone || '');
          setStatus(cData.contact.status);
        }
      } catch (err: any) {
        setError(err.message || 'Error loading contact');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [id, router]);

  // Contact Handlers
  const handleUpdateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          company_name: companyName,
          contact_name: contactName,
          email,
          phone,
          status,
        }),
      });
      if (!res.ok) throw new Error('Failed to update contact');
      setShowEditContact(false);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!confirm('Are you sure you want to delete this contact and all associated records?')) return;
    try {
      const res = await fetch(`/api/contacts?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete contact');
      router.push('/contacts');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Invoice Handlers
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: id,
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

  const handleUpdateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/invoices', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem?.item.id,
          amount: invAmount || editingItem?.item.amount,
          due_date: invDueDate || editingItem?.item.due_date,
          status: invStatus || editingItem?.item.status,
        }),
      });
      if (!res.ok) throw new Error('Failed to update invoice');
      setEditingItem(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInvoice = async (invId: string) => {
    if (!confirm('Are you sure you want to delete this invoice?')) return;
    try {
      const res = await fetch(`/api/invoices?id=${invId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete invoice');
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Task Handlers
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: id,
          title: taskTitle,
          due_date: taskDueDate,
          status: taskStatus,
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

  const handleUpdateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem?.item.id,
          title: taskTitle || editingItem?.item.title,
          due_date: taskDueDate || editingItem?.item.due_date,
          status: taskStatus || editingItem?.item.status,
        }),
      });
      if (!res.ok) throw new Error('Failed to update task');
      setEditingItem(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      const res = await fetch(`/api/tasks?id=${taskId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete task');
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Estimate Handlers
  const handleCreateEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/estimates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contact_id: id,
          estimate_number: estNum,
          amount: estAmount,
          currency: 'INR',
          valid_until: estValidUntil,
          status: estStatus,
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

  const handleUpdateEstimate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/estimates', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingItem?.item.id,
          amount: estAmount || editingItem?.item.amount,
          valid_until: estValidUntil || editingItem?.item.valid_until,
          status: estStatus || editingItem?.item.status,
        }),
      });
      if (!res.ok) throw new Error('Failed to update estimate');
      setEditingItem(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteEstimate = async (estId: string) => {
    if (!confirm('Are you sure you want to delete this estimate?')) return;
    try {
      const res = await fetch(`/api/estimates?id=${estId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete estimate');
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 10MB Attachment File Upload Handler
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      alert('File size exceeds maximum allowed limit of 10MB');
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('contact_id', id);

      const res = await fetch('/api/attachments', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to upload attachment file');
      }

      setShowAddAttachment(false);
      setSelectedFile(null);
      refreshData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAttachment = async (attId: string) => {
    if (!confirm('Are you sure you want to delete this attachment file?')) return;
    try {
      const res = await fetch(`/api/attachments?id=${attId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to delete attachment');
      refreshData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060913] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl btn-gradient flex items-center justify-center animate-spin">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <p className="text-xs font-mono text-cyan-400">Loading Scoped Contact Details...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <SidebarLayout user={user}>
        <div className="p-8 rounded-2xl glass-surface border-rose-500/50 text-center space-y-4 max-w-md mx-auto my-12">
          <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="font-heading text-2xl font-extrabold text-white">404 Not Found</h2>
          <p className="text-xs text-rose-200 font-medium">{error || 'No matching contact found.'}</p>
          <div className="text-[11px] text-gray-300 font-mono">
            🛡️ Anti-Enumeration Rule: Identical 404 returned for unassigned RLS contacts to prevent existence probing.
          </div>
          <Link
            href="/contacts"
            className="inline-flex items-center gap-2 btn-gradient px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg shadow-cyan-500/20"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Contacts Directory
          </Link>
        </div>
      </SidebarLayout>
    );
  }

  const { contact, invoices, tasks, estimates, activities, attachments } = data;

  const totalInvoiced = invoices?.reduce((acc: number, inv: any) => acc + parseFloat(inv.amount), 0) || 0;
  const totalPaid = invoices?.filter((i: any) => i.status === 'PAID').reduce((acc: number, inv: any) => acc + parseFloat(inv.amount), 0) || 0;

  return (
    <SidebarLayout user={user}>
      <div className="space-y-8">
        
        {/* Breadcrumb Path */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-gray-300">
            <Link href="/contacts" className="hover:text-cyan-300 transition-colors">Contacts Directory</Link>
            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
            <span className="text-white font-bold">{contact.company_name}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Header Edit Button (Pencil Icon) */}
            <button
              onClick={() => setShowEditContact(true)}
              className="btn-action-edit"
            >
              <Pencil className="w-3.5 h-3.5" /> Edit Contact
            </button>

            {/* Header Delete Button (Red Trash Icon) */}
            <button
              onClick={handleDeleteContact}
              className="btn-action-delete"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Contact
            </button>

            <Link
              href="/contacts"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gray-900 hover:bg-gray-800 border border-white/15 text-xs font-bold text-gray-200 transition-all ml-2"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-cyan-400" /> Back
            </Link>
          </div>
        </div>

        {/* Company Control Panel Hero Card */}
        <div className="glass-surface p-6 border-cyan-500/40 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950 space-y-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl btn-gradient flex items-center justify-center text-white font-heading font-extrabold text-2xl shadow-xl shadow-cyan-500/30 shrink-0 border border-white/20">
                {contact.company_name.substring(0, 2).toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="font-heading text-2xl lg:text-3xl font-extrabold text-white">
                    {contact.company_name}
                  </h1>
                  <span
                    className={`px-3 py-1 text-xs font-extrabold rounded-lg uppercase tracking-wider ${
                      contact.status === 'CUSTOMER'
                        ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40'
                        : contact.status === 'QUALIFIED'
                        ? 'bg-violet-500/25 text-violet-300 border border-violet-500/40'
                        : 'bg-amber-500/25 text-amber-300 border border-amber-500/40'
                    }`}
                  >
                    {contact.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-gray-300 pt-0.5">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    Representative: <strong className="text-white">{contact.contact_name}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-cyan-400" />
                    Email: <strong className="text-cyan-300">{contact.email}</strong>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-cyan-400" />
                    Phone: <strong className="text-white">{contact.phone}</strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Total Paid Revenue Highlight Badge */}
            <div className="glass-surface px-5 py-3 border-white/15 text-right shrink-0 bg-gray-950">
              <div className="text-[11px] font-extrabold text-gray-300 uppercase tracking-wider">Total Paid Revenue</div>
              <div className="font-heading text-2xl font-extrabold text-emerald-300">
                {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalPaid)}
              </div>
              <div className="text-[10px] text-gray-400 font-mono">Of {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalInvoiced)} Invoiced</div>
            </div>
          </div>
        </div>

        {/* View Mode Filter Pills Bar */}
        <div className="flex items-center gap-2 bg-gray-950/90 p-1.5 rounded-2xl border border-white/15 overflow-x-auto">
          {[
            { id: 'all', label: 'Stacked Overview (All Records)', icon: Layers },
            { id: 'invoices', label: `Invoices (${invoices?.length || 0})`, icon: DollarSign },
            { id: 'tasks', label: `Tasks (${tasks?.length || 0})`, icon: CheckCircle2 },
            { id: 'estimates', label: `Estimates (${estimates?.length || 0})`, icon: FileText },
            { id: 'activities', label: `Activity Stream (${activities?.length || 0})`, icon: Activity },
            { id: 'attachments', label: `Attachments (${attachments?.length || 0})`, icon: Paperclip },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-extrabold transition-all whitespace-nowrap ${
                  viewMode === tab.id
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/20'
                    : 'text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 text-cyan-400" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* 1. Invoices Panel */}
        {(viewMode === 'all' || viewMode === 'invoices') && (
          <div className="glass-surface p-6 border-white/15 space-y-4 bg-gray-950/80">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-400" /> Invoices & Financial Ledger ({invoices?.length || 0})
              </h3>
              
              <button
                onClick={() => {
                  setInvNum(`INV-2026-00${(invoices?.length || 0) + 1}`);
                  setShowAddInvoice(true);
                }}
                className="btn-gradient px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-white flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Invoice
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/15 text-cyan-300 font-extrabold uppercase tracking-wider bg-gray-900">
                    <th className="py-3.5 px-4">Invoice Number</th>
                    <th className="py-3.5 px-4">Amount</th>
                    <th className="py-3.5 px-4">Issue Date</th>
                    <th className="py-3.5 px-4">Due Date</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {!invoices || invoices.length === 0 ? (
                    <tr><td colSpan={6} className="py-6 text-center text-gray-400">No invoices recorded for this contact.</td></tr>
                  ) : (
                    invoices.map((inv: any) => (
                      <tr key={inv.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{inv.invoice_number}</td>
                        <td className="py-3.5 px-4 text-cyan-300 font-bold">
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
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingItem({ type: 'invoice', item: inv });
                              setInvAmount(inv.amount);
                              setInvStatus(inv.status);
                            }}
                            className="btn-action-edit"
                            title="Edit Invoice"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteInvoice(inv.id)}
                            className="btn-action-delete"
                            title="Delete Invoice"
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
        )}

        {/* 2. Tasks Panel */}
        {(viewMode === 'all' || viewMode === 'tasks') && (
          <div className="glass-surface p-6 border-white/15 space-y-4 bg-gray-950/80">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-cyan-400" /> Action Items & Scheduled Tasks ({tasks?.length || 0})
              </h3>

              <button
                onClick={() => setShowAddTask(true)}
                className="btn-gradient px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-white flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Task
              </button>
            </div>

            <div className="space-y-3">
              {!tasks || tasks.length === 0 ? (
                <p className="text-xs font-mono text-gray-400 py-4 text-center">No tasks assigned for this contact.</p>
              ) : (
                tasks.map((t: any) => (
                  <div key={t.id} className="p-4 rounded-xl bg-gray-900 border border-white/15 flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white">{t.title}</div>
                      <div className="text-[11px] font-mono text-gray-300">Due Date: {new Date(t.due_date).toLocaleDateString()}</div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md uppercase ${
                        t.status === 'DONE' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                        t.status === 'IN_PROGRESS' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40' :
                        'bg-gray-800 text-gray-200'
                      }`}>
                        {t.status}
                      </span>

                      <button
                        onClick={() => {
                          setEditingItem({ type: 'task', item: t });
                          setTaskTitle(t.title);
                          setTaskStatus(t.status);
                        }}
                        className="btn-action-edit"
                        title="Edit Task"
                      >
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </button>

                      <button
                        onClick={() => handleDeleteTask(t.id)}
                        className="btn-action-delete"
                        title="Delete Task"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 3. Estimates Panel */}
        {(viewMode === 'all' || viewMode === 'estimates') && (
          <div className="glass-surface p-6 border-white/15 space-y-4 bg-gray-950/80">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-violet-400" /> Quotations & Proposals ({estimates?.length || 0})
              </h3>

              <button
                onClick={() => {
                  setEstNum(`EST-2026-00${(estimates?.length || 0) + 1}`);
                  setShowAddEstimate(true);
                }}
                className="btn-gradient px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-white flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
              >
                <Plus className="w-3.5 h-3.5" /> Add Estimate
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/15 text-cyan-300 font-extrabold uppercase tracking-wider bg-gray-900">
                    <th className="py-3.5 px-4">Estimate Number</th>
                    <th className="py-3.5 px-4">Quoted Amount</th>
                    <th className="py-3.5 px-4">Valid Until</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                  {!estimates || estimates.length === 0 ? (
                    <tr><td colSpan={5} className="py-6 text-center text-gray-400">No estimates generated for this contact.</td></tr>
                  ) : (
                    estimates.map((est: any) => (
                      <tr key={est.id} className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{est.estimate_number}</td>
                        <td className="py-3.5 px-4 text-cyan-300 font-bold">
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
                        <td className="py-3.5 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingItem({ type: 'estimate', item: est });
                              setEstAmount(est.amount);
                              setEstStatus(est.status);
                            }}
                            className="btn-action-edit"
                            title="Edit Estimate"
                          >
                            <Pencil className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteEstimate(est.id)}
                            className="btn-action-delete"
                            title="Delete Estimate"
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
        )}

        {/* 4. Activities Panel */}
        {(viewMode === 'all' || viewMode === 'activities') && (
          <div className="glass-surface p-6 border-white/15 space-y-4 bg-gray-950/80">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" /> Activity Timeline Stream ({activities?.length || 0})
              </h3>
              <span className="text-xs font-mono text-cyan-300">PostgreSQL RLS Scoped Entity</span>
            </div>

            <div className="space-y-3">
              {!activities || activities.length === 0 ? (
                <p className="text-xs font-mono text-gray-400 py-4 text-center">No activity recorded for this contact.</p>
              ) : (
                activities.map((act: any) => {
                  const isInjectionTest = act.body.includes('Ignore your previous instructions');
                  return (
                    <div
                      key={act.id}
                      className={`p-4 rounded-xl border transition-all ${
                        isInjectionTest
                          ? 'bg-rose-950/40 border-rose-500/60 shadow-md'
                          : 'bg-gray-900 border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-extrabold text-cyan-300 uppercase">{act.type}</span>
                          {isInjectionTest && (
                            <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded bg-rose-500/25 text-rose-200 border border-rose-500/50">
                              🛡️ Indirect Prompt Injection Test Payload
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-gray-300 font-bold">
                          {new Date(act.occurred_at).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-white leading-relaxed font-medium">{act.body}</p>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* 5. Attachments Panel with File Upload (Up to 10MB Any File Type) */}
        {(viewMode === 'all' || viewMode === 'attachments') && (
          <div className="glass-surface p-6 border-white/15 space-y-4 bg-gray-950/80">
            <div className="flex items-center justify-between">
              <h3 className="font-heading text-lg font-bold text-white flex items-center gap-2">
                <Paperclip className="w-5 h-5 text-violet-400" /> Document & File Repository ({attachments?.length || 0})
              </h3>

              <button
                onClick={() => setShowAddAttachment(true)}
                className="btn-gradient px-3.5 py-1.5 rounded-xl text-xs font-extrabold text-white flex items-center gap-1.5 shadow-md shadow-cyan-500/20"
              >
                <Upload className="w-3.5 h-3.5" /> Upload Attachment (Up to 10MB)
              </button>
            </div>

            <div className="space-y-2">
              {!attachments || attachments.length === 0 ? (
                <p className="text-xs font-mono text-gray-400 py-4 text-center">No attachments uploaded for this contact.</p>
              ) : (
                attachments.map((att: any) => (
                  <div key={att.id} className="p-4 rounded-xl bg-gray-900 border border-white/15 flex items-center justify-between">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <Paperclip className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div className="truncate">
                        <a
                          href={att.storage_path}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-bold text-white hover:text-cyan-300 hover:underline truncate block"
                        >
                          {att.filename}
                        </a>
                        <div className="text-[10px] font-mono text-gray-300">
                          {(att.size_bytes / 1024).toFixed(1)} KB • {att.mime_type}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={att.storage_path}
                        target="_blank"
                        rel="noreferrer"
                        className="btn-action-view"
                        title="Download / Open File"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </a>

                      <button
                        onClick={() => handleDeleteAttachment(att.id)}
                        className="btn-action-delete"
                        title="Delete Attachment File"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>

      {/* Edit Contact Modal */}
      {showEditContact && (
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
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Contact Person</label>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                className="w-full glass-input text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full glass-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full glass-input text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Pipeline Status</label>
              <select
                value={status}
                onChange={(e: any) => setStatus(e.target.value)}
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
                onClick={() => setShowEditContact(false)}
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

      {/* Add Invoice Modal */}
      {showAddInvoice && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateInvoice} className="glass-surface max-w-md w-full p-6 space-y-4 border-cyan-500/50 relative bg-gray-950">
            <h2 className="font-heading font-extrabold text-xl text-white">Create New Invoice</h2>
            <p className="text-xs text-gray-300 font-medium">Linked to contact <strong className="text-white">{contact.company_name}</strong>.</p>

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

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Status</label>
              <select
                value={invStatus}
                onChange={(e) => setInvStatus(e.target.value)}
                className="w-full glass-input text-xs"
              >
                <option value="SENT">SENT</option>
                <option value="PAID">PAID</option>
                <option value="OVERDUE">OVERDUE</option>
                <option value="DRAFT">DRAFT</option>
              </select>
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

      {/* Add Task Modal */}
      {showAddTask && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateTask} className="glass-surface max-w-md w-full p-6 space-y-4 border-cyan-500/50 relative bg-gray-950">
            <h2 className="font-heading font-extrabold text-xl text-white">Add New Action Item</h2>
            <p className="text-xs text-gray-300 font-medium">Linked to contact <strong className="text-white">{contact.company_name}</strong>.</p>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Task Title</label>
              <input
                type="text"
                required
                value={taskTitle}
                onChange={(e) => setTaskTitle(e.target.value)}
                placeholder="Review SLA terms & send agreement"
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

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Status</label>
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value)}
                className="w-full glass-input text-xs"
              >
                <option value="OPEN">OPEN</option>
                <option value="IN_PROGRESS">IN_PROGRESS</option>
                <option value="DONE">DONE</option>
              </select>
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
                {submitting ? 'Saving...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Add Estimate Modal */}
      {showAddEstimate && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateEstimate} className="glass-surface max-w-md w-full p-6 space-y-4 border-cyan-500/50 relative bg-gray-950">
            <h2 className="font-heading font-extrabold text-xl text-white">Create New Quotation</h2>
            <p className="text-xs text-gray-300 font-medium">Linked to contact <strong className="text-white">{contact.company_name}</strong>.</p>

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

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Status</label>
              <select
                value={estStatus}
                onChange={(e) => setEstStatus(e.target.value)}
                className="w-full glass-input text-xs"
              >
                <option value="SENT">SENT</option>
                <option value="ACCEPTED">ACCEPTED</option>
                <option value="REJECTED">REJECTED</option>
                <option value="DRAFT">DRAFT</option>
              </select>
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

      {/* Upload Attachment Modal supporting 10MB File Upload (Any Type) */}
      {showAddAttachment && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleUploadFile} className="glass-surface max-w-md w-full p-6 space-y-4 border-cyan-500/50 relative bg-gray-950">
            <h2 className="font-heading font-extrabold text-xl text-white">Upload Attachment File</h2>
            <p className="text-xs text-gray-300 font-medium">
              Upload any file type (PDF, PNG, JPG, DOCX, XLSX, TXT, ZIP) up to <strong className="text-cyan-300">10MB</strong> for <strong className="text-white">{contact.company_name}</strong>.
            </p>

            <div>
              <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Select File (Max 10MB)</label>
              <input
                type="file"
                required
                accept="*/*"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  if (file && file.size > 10 * 1024 * 1024) {
                    alert('File size exceeds 10MB limit');
                    e.target.value = '';
                    setSelectedFile(null);
                    return;
                  }
                  setSelectedFile(file);
                }}
                className="w-full glass-input text-xs file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-extrabold file:bg-cyan-500/20 file:text-cyan-300 hover:file:bg-cyan-500/30 cursor-pointer"
              />
            </div>

            {selectedFile && (
              <div className="p-3 rounded-xl bg-gray-900 border border-white/15 text-xs font-mono space-y-1">
                <div>Selected: <strong className="text-white font-bold">{selectedFile.name}</strong></div>
                <div>Size: <strong className="text-cyan-300 font-bold">{(selectedFile.size / (1024 * 1024)).toFixed(2)} MB</strong> ({selectedFile.size.toLocaleString()} bytes)</div>
                <div>Type: <strong className="text-violet-300 font-bold">{selectedFile.type || 'application/octet-stream'}</strong></div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddAttachment(false);
                  setSelectedFile(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !selectedFile}
                className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg shadow-cyan-500/30 disabled:opacity-50"
              >
                {submitting ? 'Uploading File...' : 'Upload File (Up to 10MB)'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Item Generic Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <form
            onSubmit={
              editingItem.type === 'invoice' ? handleUpdateInvoice :
              editingItem.type === 'task' ? handleUpdateTask :
              handleUpdateEstimate
            }
            className="glass-surface max-w-md w-full p-6 space-y-4 border-cyan-500/50 relative bg-gray-950"
          >
            <h2 className="font-heading font-extrabold text-xl text-white flex items-center gap-2">
              <Pencil className="w-5 h-5 text-amber-400" /> Edit {editingItem.type.toUpperCase()} Item
            </h2>

            {editingItem.type === 'invoice' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Amount (INR)</label>
                  <input
                    type="number"
                    value={invAmount}
                    onChange={(e) => setInvAmount(e.target.value)}
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={invStatus}
                    onChange={(e) => setInvStatus(e.target.value)}
                    className="w-full glass-input text-xs"
                  >
                    <option value="SENT">SENT</option>
                    <option value="PAID">PAID</option>
                    <option value="OVERDUE">OVERDUE</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
              </>
            )}

            {editingItem.type === 'task' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Title</label>
                  <input
                    type="text"
                    value={taskTitle}
                    onChange={(e) => setTaskTitle(e.target.value)}
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value)}
                    className="w-full glass-input text-xs"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="DONE">DONE</option>
                  </select>
                </div>
              </>
            )}

            {editingItem.type === 'estimate' && (
              <>
                <div>
                  <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Quoted Amount (INR)</label>
                  <input
                    type="number"
                    value={estAmount}
                    onChange={(e) => setEstAmount(e.target.value)}
                    className="w-full glass-input text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-white uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={estStatus}
                    onChange={(e) => setEstStatus(e.target.value)}
                    className="w-full glass-input text-xs"
                  >
                    <option value="SENT">SENT</option>
                    <option value="ACCEPTED">ACCEPTED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="DRAFT">DRAFT</option>
                  </select>
                </div>
              </>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setEditingItem(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg shadow-cyan-500/30"
              >
                {submitting ? 'Updating...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}

    </SidebarLayout>
  );
}
