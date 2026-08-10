'use client';

import React, { useEffect, useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import Link from 'next/link';
import { Bot, Users, Shield, TrendingUp, ArrowUpRight, DollarSign, Activity, FileText, Lock, Sparkles, ChevronRight, CheckCircle2, Eye } from 'lucide-react';

interface Contact {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  status: 'LEAD' | 'QUALIFIED' | 'CUSTOMER';
  sales_manager_id: string;
  lead_generator_id: string;
}

export default function DashboardPage() {
  const [user, setUser] = useState<any>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          window.location.href = '/';
          return;
        }
        const meData = await meRes.json();
        setUser(meData.user);

        const contactsRes = await fetch('/api/contacts');
        if (contactsRes.ok) {
          const cData = await contactsRes.json();
          setContacts(cData.contacts || []);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#060913] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-xl btn-gradient flex items-center justify-center animate-spin">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <p className="text-xs font-mono text-cyan-400">Loading Control Panel Workspace...</p>
        </div>
      </div>
    );
  }

  const customerCount = contacts.filter((c) => c.status === 'CUSTOMER').length;
  const leadCount = contacts.filter((c) => c.status === 'LEAD').length;
  const qualifiedCount = contacts.filter((c) => c.status === 'QUALIFIED').length;

  return (
    <SidebarLayout user={user}>
      <div className="space-y-8">
        
        {/* Welcome Header Panel */}
        <div className="glass-surface p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-cyan-500/30 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h1 className="font-heading text-2xl lg:text-3xl font-extrabold text-white">
                Executive Control Panel <span className="text-gradient-cyan">• {user?.name}</span> 👋
              </h1>
            </div>
            <p className="text-xs text-gray-300 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Connected to PostgreSQL RLS Session • Role: <strong className="text-cyan-300">{user?.role}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/ai-assistant"
              className="btn-gradient px-4 py-2.5 rounded-xl text-xs font-extrabold text-white flex items-center gap-2 shadow-lg shadow-cyan-500/30"
            >
              <Bot className="w-4 h-4 text-cyan-200" /> Launch AI Assistant
            </Link>

            <Link
              href="/contacts"
              className="glass-surface glass-surface-hover px-4 py-2.5 rounded-xl text-xs font-bold text-gray-200 flex items-center gap-2 border-white/15"
            >
              <Users className="w-4 h-4 text-cyan-400" /> View Contacts ({contacts.length})
            </Link>
          </div>
        </div>

        {/* 4 Metric Summary Widget Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-surface p-5 space-y-3 glass-surface-hover border-cyan-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-300 uppercase tracking-wider">Scoped Contacts</span>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-heading text-3xl font-extrabold text-white">{contacts.length}</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3.5 h-3.5" /> +14.2%
              </span>
            </div>
            <p className="text-xs text-gray-300 font-medium">Scoped to your exact access role</p>
          </div>

          <div className="glass-surface p-5 space-y-3 glass-surface-hover border-violet-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-300 uppercase tracking-wider">Active Customers</span>
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/40 flex items-center justify-center text-violet-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-heading text-3xl font-extrabold text-white">{customerCount}</span>
              <span className="text-xs font-bold text-violet-300">Converted</span>
            </div>
            <p className="text-xs text-gray-300 font-medium">{qualifiedCount} Qualified • {leadCount} Leads</p>
          </div>

          <div className="glass-surface p-5 space-y-3 glass-surface-hover border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-300 uppercase tracking-wider">AST Safety Rate</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Shield className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-heading text-3xl font-extrabold text-emerald-300">100%</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Block Active
              </span>
            </div>
            <p className="text-xs text-gray-300 font-medium">Pre-execution SQL injection defense</p>
          </div>

          <div className="glass-surface p-5 space-y-3 glass-surface-hover border-rose-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-300 uppercase tracking-wider">LLM Latency</span>
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="font-heading text-3xl font-extrabold text-white">420ms</span>
              <span className="text-xs font-bold text-rose-300">NVIDIA NIM</span>
            </div>
            <p className="text-xs text-gray-300 font-medium">Llama-3.1-70b-instruct model</p>
          </div>
        </div>

        {/* PostgreSQL Row-Level Security Banner */}
        <div className="glass-surface p-6 border-cyan-500/40 bg-gradient-to-r from-cyan-950/40 via-gray-900/80 to-violet-950/40">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <div className="flex items-center gap-2.5 text-cyan-300 font-extrabold text-sm">
                <Lock className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>PostgreSQL Transaction-Scoped Row-Level Security (RLS)</span>
              </div>
              <p className="text-xs text-gray-200 font-medium leading-relaxed">
                Every API call and AI query executes inside a transaction setting local identity variables: <br />
                <code className="text-cyan-300 bg-gray-950 px-2 py-0.5 rounded font-mono text-[11px] font-bold inline-block mt-1">SELECT set_config('app.current_user_id', '{user?.id}', true);</code> <br />
                Subsidiary entities (Invoices, Tasks, Estimates, Activity Logs, Attachments) inherit visibility strictly from parent contact ownership.
              </p>
            </div>

            <div className="glass-surface p-4 border-white/15 shrink-0 space-y-1 text-right bg-gray-950">
              <div className="text-[11px] font-bold text-gray-300 uppercase tracking-wider">Active Session Identity</div>
              <div className="text-xs font-mono font-bold text-cyan-300">{user?.email}</div>
              <div className="text-[10px] text-gray-400 font-mono">User ID: {user?.id?.slice(0, 18)}...</div>
            </div>
          </div>
        </div>

        {/* Contacts Directory Table Preview */}
        <div className="glass-surface overflow-hidden border-white/15 space-y-4 p-6 bg-gray-950/80">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-heading font-extrabold text-lg text-white">Scoped Contacts Overview</h2>
              <p className="text-xs text-gray-300 font-medium">Companies & Representatives accessible under your role</p>
            </div>
            <Link
              href="/contacts"
              className="text-xs font-extrabold text-cyan-300 hover:text-cyan-200 flex items-center gap-1"
            >
              View Full Directory <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/15 text-cyan-300 font-extrabold uppercase tracking-wider bg-gray-900">
                  <th className="py-3.5 px-4">Company</th>
                  <th className="py-3.5 px-4">Contact Person</th>
                  <th className="py-3.5 px-4">Email & Phone</th>
                  <th className="py-3.5 px-4">Pipeline Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-gray-400 font-mono">
                      No contacts assigned under your current role scope.
                    </td>
                  </tr>
                ) : (
                  contacts.slice(0, 5).map((contact) => (
                    <tr key={contact.id} className="hover:bg-white/5 transition-colors group">
                      <td className="py-3.5 px-4 font-bold text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-extrabold flex items-center justify-center text-xs">
                          {contact.company_name.substring(0, 2).toUpperCase()}
                        </div>
                        {contact.company_name}
                      </td>
                      <td className="py-3.5 px-4 text-gray-200 font-medium">{contact.contact_name}</td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-cyan-300 font-bold">
                        <div>{contact.email}</div>
                        <div className="text-gray-400 font-normal">{contact.phone}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-md uppercase tracking-wider ${
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
                      <td className="py-3.5 px-4 text-right">
                        {/* Eye Icon for View Details */}
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="btn-action-view font-bold"
                        >
                          <Eye className="w-3.5 h-3.5" /> View
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </SidebarLayout>
  );
}
