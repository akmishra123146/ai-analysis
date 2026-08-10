'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Bot, Users, LayoutDashboard, ShieldAlert, BarChart3, LogOut, Sparkles, Database, HelpCircle, X, CheckCircle2, Lock, FileCode2, DollarSign, FileText, Activity } from 'lucide-react';

interface SidebarLayoutProps {
  user?: {
    id?: string;
    name: string;
    email: string;
    role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  } | null;
  children: React.ReactNode;
}

export default function SidebarLayout({ user, children }: SidebarLayoutProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentView = searchParams?.get('view');
  const router = useRouter();
  const [showSpecsModal, setShowSpecsModal] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  if (!user) return <>{children}</>;

  const isActivePath = (path: string) => pathname === path && !currentView;
  const isActiveView = (path: string, viewParam: string) => pathname === path && currentView === viewParam;

  return (
    <div className="min-h-screen flex bg-[#060913] text-white">
      
      {/* 1. Left Control Panel Sidebar (Fixed 260px) */}
      <aside className="w-[260px] min-w-[260px] bg-[#080d1a] border-r border-white/15 fixed left-0 top-0 bottom-0 z-40 flex flex-col justify-between p-4 overflow-y-auto">
        
        <div className="space-y-6 w-full">
          {/* Brand Logo Header */}
          <Link href="/dashboard" className="flex items-center gap-3 group pt-1 border-b border-white/10 pb-4 w-full">
            <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-all shrink-0">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <span className="font-heading font-extrabold text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  CRM<span className="text-cyan-400 font-black">.AI</span>
                </span>
                <span className="px-2 py-0.5 text-[9px] font-extrabold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  NVIDIA
                </span>
              </div>
              <p className="text-[10px] text-cyan-400 font-mono font-bold tracking-wider uppercase truncate">Enterprise Control Panel</p>
            </div>
          </Link>

          {/* Navigation Menu Categories */}
          <nav className="space-y-5 w-full">
            
            {/* Category 1: Main Workspace */}
            <div className="space-y-1.5 w-full">
              <div className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider px-3 mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" /> Main Workspace
              </div>

              <Link
                href="/dashboard"
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all w-full ${
                  isActivePath('/dashboard')
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/20'
                    : 'text-gray-200 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActivePath('/dashboard') && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400" />
                )}
                <LayoutDashboard className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">Overview Panel</span>
              </Link>

              <Link
                href="/contacts"
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all w-full ${
                  isActivePath('/contacts') || (pathname.startsWith('/contacts/') && pathname !== '/contacts' && !currentView)
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/20'
                    : 'text-gray-200 hover:text-white hover:bg-white/5'
                }`}
              >
                {(isActivePath('/contacts') || (pathname.startsWith('/contacts/') && pathname !== '/contacts' && !currentView)) && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400" />
                )}
                <Users className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">Contacts Directory</span>
              </Link>
            </div>

            {/* Category 2: CRM Data Entities */}
            <div className="space-y-1.5 w-full">
              <div className="text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider px-3 pt-2 mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> CRM Data Entities
              </div>

              <Link
                href="/contacts?view=invoices"
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all w-full ${
                  isActiveView('/contacts', 'invoices')
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/50 shadow-md shadow-emerald-500/20'
                    : 'text-gray-200 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActiveView('/contacts', 'invoices') && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-emerald-400" />
                )}
                <DollarSign className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="truncate">Invoices Ledger</span>
              </Link>

              <Link
                href="/contacts?view=tasks"
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all w-full ${
                  isActiveView('/contacts', 'tasks')
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/20'
                    : 'text-gray-200 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActiveView('/contacts', 'tasks') && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-cyan-400" />
                )}
                <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                <span className="truncate">Action Items & Tasks</span>
              </Link>

              <Link
                href="/contacts?view=estimates"
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all w-full ${
                  isActiveView('/contacts', 'estimates')
                    ? 'bg-violet-500/25 text-violet-300 border border-violet-500/50 shadow-md shadow-violet-500/20'
                    : 'text-gray-200 hover:text-white hover:bg-white/5'
                }`}
              >
                {isActiveView('/contacts', 'estimates') && (
                  <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-violet-400" />
                )}
                <FileText className="w-4 h-4 text-violet-400 shrink-0" />
                <span className="truncate">Quotations & Estimates</span>
              </Link>
            </div>

            {/* Category 3: AI & Intelligence */}
            <div className="space-y-1.5 w-full">
              <div className="text-[10px] font-extrabold text-violet-400 uppercase tracking-wider px-3 pt-2 mb-1 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-violet-400" /> AI & Intelligence
              </div>

              <Link
                href="/ai-assistant"
                className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all w-full ${
                  isActivePath('/ai-assistant')
                    ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/30'
                    : 'text-cyan-300 hover:bg-cyan-500/15'
                }`}
              >
                <Bot className="w-4 h-4 text-cyan-200 shrink-0" />
                <span className="truncate">AI Query Engine</span>
              </Link>
            </div>

            {/* Category 4: Administration */}
            {user.role === 'ADMIN' && (
              <div className="space-y-1.5 w-full">
                <div className="text-[10px] font-extrabold text-rose-400 uppercase tracking-wider px-3 pt-2 mb-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" /> Administration
                </div>

                <Link
                  href="/admin/analytics"
                  className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all w-full ${
                    isActivePath('/admin/analytics')
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-md'
                      : 'text-gray-200 hover:text-rose-300 hover:bg-rose-500/10'
                  }`}
                >
                  {isActivePath('/admin/analytics') && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-rose-400" />
                  )}
                  <BarChart3 className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="truncate">Token Cost Analytics</span>
                </Link>

                <Link
                  href="/admin/users"
                  className={`relative flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-extrabold transition-all w-full ${
                    isActivePath('/admin/users')
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-md'
                      : 'text-gray-200 hover:text-rose-300 hover:bg-rose-500/10'
                  }`}
                >
                  {isActivePath('/admin/users') && (
                    <span className="absolute left-0 top-2 bottom-2 w-1 rounded-r-full bg-rose-400" />
                  )}
                  <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0" />
                  <span className="truncate">User Administration</span>
                </Link>
              </div>
            )}

          </nav>
        </div>

        {/* Sidebar Bottom Profile Card */}
        <div className="space-y-3 pt-3 border-t border-white/10 mt-4 w-full shrink-0">
          <button
            onClick={() => setShowSpecsModal(true)}
            className="w-full px-3 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-extrabold flex items-center justify-center gap-2 transition-all shadow-sm"
          >
            <HelpCircle className="w-4 h-4 text-cyan-400 shrink-0" /> Security Architecture
          </button>

          <div className="p-3 rounded-xl bg-gray-950 border border-white/15 flex items-center justify-between shadow-inner w-full">
            <div className="space-y-0.5 overflow-hidden min-w-0">
              <div className="text-xs font-extrabold text-white truncate">{user.name}</div>
              <div className="text-[10px] text-cyan-300 font-mono truncate font-bold">{user.email}</div>
              <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded uppercase tracking-wider inline-block mt-1 ${
                user.role === 'ADMIN' ? 'role-badge-admin' : user.role === 'MANAGER' ? 'role-badge-manager' : 'role-badge-member'
              }`}>
                {user.role} Scope
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-gray-300 hover:text-rose-400 hover:bg-rose-500/15 rounded-lg transition-all border border-white/10 shrink-0 ml-2"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

      </aside>

      {/* 2. Main Content Workspace Panel Area (margin-left: 260px) */}
      <div className="ml-[260px] flex-1 min-h-screen bg-[#060913] flex flex-col min-w-0">
        
        {/* Top Control Bar */}
        <header className="h-16 border-b border-white/15 px-8 flex items-center justify-between bg-gray-950/90 sticky top-0 z-30 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-mono font-bold text-gray-200">
              PostgreSQL RLS Connected • <strong className="text-cyan-300">{user.role} Scope</strong>
            </span>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-gray-300">
            <button
              onClick={() => setShowSpecsModal(true)}
              className="px-3 py-1.5 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 font-extrabold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <HelpCircle className="w-3.5 h-3.5 text-cyan-400" /> Security Architecture
            </button>
            <span>Model: <strong className="text-white">meta/llama-3.1-70b-instruct</strong></span>
          </div>
        </header>

        {/* Main Panel Content */}
        <main className="p-8 flex-1">
          {children}
        </main>
      </div>

      {/* Security Architecture Interactive Modal */}
      {showSpecsModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-surface max-w-2xl w-full p-6 space-y-5 border-cyan-500/50 relative max-h-[90vh] overflow-y-auto bg-gray-950">
            <button
              onClick={() => setShowSpecsModal(false)}
              className="absolute top-5 right-5 text-gray-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center text-white shrink-0 shadow-lg">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <h2 className="font-heading font-extrabold text-xl text-white">Platform Security Architecture</h2>
                <p className="text-xs text-cyan-300 font-mono">PostgreSQL RLS, AST Guardrails, and Anti-Enumeration Rules</p>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="glass-surface p-4 border-cyan-500/30 space-y-2 bg-gray-900/80">
                <div className="flex items-center gap-2 text-cyan-300 font-extrabold text-xs">
                  <Lock className="w-4 h-4 text-cyan-400" />
                  <span>1. PostgreSQL Sub-SQL Row-Level Security (RLS)</span>
                </div>
                <p className="text-xs text-gray-200 font-medium leading-relaxed">
                  Queries execute inside transactions via PostgreSQL native <code className="text-cyan-300 font-bold font-mono">set_config</code>: <br />
                  <code className="text-cyan-300 font-mono bg-gray-950 px-2 py-0.5 rounded text-[11px] block mt-1">SELECT set_config('app.current_user_id', '{user.id}', true);</code>
                  Tables enforce visibility physically inside the database engine.
                </p>
              </div>

              <div className="glass-surface p-4 border-violet-500/30 space-y-2 bg-gray-900/80">
                <div className="flex items-center gap-2 text-violet-300 font-extrabold text-xs">
                  <FileCode2 className="w-4 h-4 text-violet-400" />
                  <span>2. Pre-Execution AST Guardrails</span>
                </div>
                <p className="text-xs text-gray-200 font-medium leading-relaxed">
                  Generated SQL is parsed using <code className="text-violet-300 font-mono font-bold">node-sql-parser</code>. Only single <code className="text-violet-300 font-mono font-bold">SELECT</code> nodes are allowed. Non-SELECT nodes, DDL, DML, multi-statements, and system catalogs are blocked before DB execution.
                </p>
              </div>

              <div className="glass-surface p-4 border-emerald-500/30 space-y-2 bg-gray-900/80">
                <div className="flex items-center gap-2 text-emerald-300 font-extrabold text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>3. Anti-Enumeration 404 Guard</span>
                </div>
                <p className="text-xs text-gray-200 font-medium leading-relaxed">
                  Unassigned contact detail requests return an identical <code className="text-emerald-300 font-mono font-bold">404 Not Found</code> with message <code className="text-emerald-300 font-mono font-bold">"No matching contact found"</code> to prevent unauthorized record existence probing.
                </p>
              </div>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => setShowSpecsModal(false)}
                className="btn-gradient px-5 py-2.5 rounded-xl text-xs font-extrabold text-white shadow-lg shadow-cyan-500/30"
              >
                Close Architecture Spec
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
