'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Bot, Users, LayoutDashboard, ShieldAlert, BarChart3, LogOut, Sparkles, Database, HelpCircle, X, CheckCircle2, Lock, FileCode2, Command, Menu } from 'lucide-react';

interface NavbarProps {
  user?: {
    name: string;
    email: string;
    role: 'ADMIN' | 'MANAGER' | 'MEMBER';
  } | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [showSpecsModal, setShowSpecsModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
    router.refresh();
  };

  if (!user) return null;

  const isActive = (path: string) => pathname === path;

  return (
    <>
      <header className="sticky top-0 z-40 glass-surface rounded-none border-x-0 border-t-0 px-6 py-3.5 mb-8 border-b border-cyan-500/20 bg-gray-950/90">
        <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center justify-between gap-4">
          
          {/* Top Row: Brand Logo & Mobile Toggle */}
          <div className="flex items-center justify-between w-full lg:w-auto">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl btn-gradient flex items-center justify-center shadow-lg shadow-cyan-500/30 group-hover:scale-105 transition-all">
                <Bot className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-heading font-extrabold text-xl tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                    CRM<span className="text-gradient">.AI</span>
                  </span>
                  <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-cyan-400" /> NVIDIA NIM
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 font-mono flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  PostgreSQL RLS Connected • {user.role} Scope
                </p>
              </div>
            </Link>

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl bg-gray-900 border border-white/10 text-gray-300 hover:text-white"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Navigation Bar Menu Links */}
          <div className={`${mobileMenuOpen ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row items-center gap-2 bg-gray-950/90 p-1.5 rounded-2xl border border-white/15 w-full lg:w-auto shadow-2xl`}>
            <Link
              href="/dashboard"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all w-full lg:w-auto justify-center ${
                isActive('/dashboard')
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/20'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-cyan-400" /> Overview
            </Link>

            <Link
              href="/contacts"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all w-full lg:w-auto justify-center ${
                isActive('/contacts')
                  ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-500/20'
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-4 h-4 text-cyan-400" /> Contacts Directory
            </Link>

            <Link
              href="/ai-assistant"
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all w-full lg:w-auto justify-center ${
                isActive('/ai-assistant')
                  ? 'bg-gradient-to-r from-cyan-500 to-violet-600 text-white shadow-lg shadow-cyan-500/30 scale-105'
                  : 'text-cyan-300 hover:bg-cyan-500/15'
              }`}
            >
              <Bot className="w-4 h-4 text-cyan-200" /> AI Assistant
            </Link>

            {user.role === 'ADMIN' && (
              <>
                <div className="hidden lg:block w-px h-5 bg-white/15 mx-1" />
                <Link
                  href="/admin/analytics"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all w-full lg:w-auto justify-center ${
                    isActive('/admin/analytics')
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-md'
                      : 'text-gray-300 hover:text-rose-300 hover:bg-rose-500/15'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-rose-400" /> Token Analytics
                </Link>
                <Link
                  href="/admin/users"
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all w-full lg:w-auto justify-center ${
                    isActive('/admin/users')
                      ? 'bg-rose-500/25 text-rose-300 border border-rose-500/50 shadow-md'
                      : 'text-gray-300 hover:text-rose-300 hover:bg-rose-500/15'
                  }`}
                >
                  <ShieldAlert className="w-4 h-4 text-rose-400" /> User Admin
                </Link>
              </>
            )}
          </div>

          {/* Architecture Helper & User Profile Card */}
          <div className="flex items-center gap-3 w-full lg:w-auto justify-end">
            <button
              onClick={() => setShowSpecsModal(true)}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 text-cyan-300 text-xs font-extrabold flex items-center gap-1.5 transition-all shadow-sm"
              title="Security Architecture Specs"
            >
              <HelpCircle className="w-4 h-4 text-cyan-400" /> Security Guide
            </button>

            <div className="glass-surface px-3.5 py-1.5 flex items-center gap-3 border-white/15 bg-gray-950">
              <div className="text-right">
                <div className="text-xs font-extrabold text-white flex items-center gap-1.5 justify-end">
                  {user.name}
                </div>
                <div className="text-[10px] text-cyan-300 font-mono font-bold">{user.email}</div>
              </div>

              <span
                className={`px-2.5 py-0.5 text-[11px] font-extrabold rounded-lg uppercase tracking-wider ${
                  user.role === 'ADMIN'
                    ? 'role-badge-admin'
                    : user.role === 'MANAGER'
                    ? 'role-badge-manager'
                    : 'role-badge-member'
                }`}
              >
                {user.role}
              </span>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2.5 text-gray-300 hover:text-rose-400 hover:bg-rose-500/15 rounded-xl transition-all border border-white/10 hover:border-rose-500/40"
            >
              <LogOut className="w-4.5 h-4.5" />
            </button>
          </div>

        </div>
      </header>

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
    </>
  );
}
