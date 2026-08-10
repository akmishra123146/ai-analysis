'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, ShieldCheck, Lock, Sparkles, ArrowRight, UserCheck, Cpu, FileCode2, Layers } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e?: React.FormEvent, customEmail?: string, customPass?: string) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    const loginEmail = customEmail || email;
    const loginPass = customPass || password;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password: loginPass }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Invalid credentials');
      }

      router.push('/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const quickLogins = [
    { label: 'System Admin', role: 'ADMIN', email: 'admin@crm.com', pass: 'Admin@123', badge: 'role-badge-admin', desc: 'Full org-wide data & AI token cost analytics' },
    { label: 'Sales Manager Alpha', role: 'MANAGER', email: 'manager1@crm.com', pass: 'Manager@123', badge: 'role-badge-manager', desc: 'Manager A assigned contacts & pipeline' },
    { label: 'Sales Manager Beta', role: 'MANAGER', email: 'manager2@crm.com', pass: 'Manager@123', badge: 'role-badge-manager', desc: 'Manager B assigned contacts & pipeline' },
    { label: 'Lead Generator One', role: 'MEMBER', email: 'member1@crm.com', pass: 'Member@123', badge: 'role-badge-member', desc: 'Member 1 assigned leads & tasks only' },
    { label: 'Lead Generator Two', role: 'MEMBER', email: 'member2@crm.com', pass: 'Member@123', badge: 'role-badge-member', desc: 'Member 2 assigned leads & tasks only' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      {/* Decorative Glow Background Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none animate-glow" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl pointer-events-none animate-glow" />

      <div className="max-w-6xl w-full grid grid-cols-1 lg:grid-cols-12 gap-10 items-center relative z-10">
        
        {/* Left Column (7 cols): Vision & Security Architecture Highlights */}
        <div className="lg:col-span-7 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 text-xs font-bold shadow-inner">
            <Cpu className="w-4 h-4 text-cyan-400" /> Powered by NVIDIA NIM LLM Infrastructure
          </div>

          <div className="space-y-4">
            <h1 className="font-heading text-4xl lg:text-6xl font-extrabold tracking-tight text-white leading-tight">
              Enterprise CRM with <br />
              <span className="text-gradient">AI Natural Language SQL</span>
            </h1>

            <p className="text-gray-200 text-sm lg:text-base leading-relaxed max-w-xl font-medium">
              Ask operational business questions in plain English. Queries are translated via <strong className="text-cyan-300">NVIDIA LLM</strong>, AST-validated against SQL injection, and executed with physical <strong className="text-violet-300">PostgreSQL Row-Level Security (RLS)</strong>.
            </p>
          </div>

          {/* Key Feature Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="glass-surface p-4 space-y-2 border-cyan-500/30">
              <div className="flex items-center gap-2.5 text-cyan-300 font-extrabold text-xs">
                <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                <span>Sub-SQL Row-Level Security</span>
              </div>
              <p className="text-xs text-gray-200 font-medium leading-relaxed">
                Access control enforced physically inside PostgreSQL transactions via <code className="text-cyan-300 font-bold bg-gray-950 px-1.5 py-0.5 rounded">SET LOCAL app.current_user_id</code>.
              </p>
            </div>

            <div className="glass-surface p-4 space-y-2 border-violet-500/30">
              <div className="flex items-center gap-2.5 text-violet-300 font-extrabold text-xs">
                <FileCode2 className="w-5 h-5 text-violet-400 shrink-0" />
                <span>Pre-Execution AST Guardrails</span>
              </div>
              <p className="text-xs text-gray-200 font-medium leading-relaxed">
                AST parser rejects non-SELECT queries, DDL, DML, multi-statements, and system catalogs before DB execution.
              </p>
            </div>

            <div className="glass-surface p-4 space-y-2 border-emerald-500/30">
              <div className="flex items-center gap-2.5 text-emerald-300 font-extrabold text-xs">
                <Lock className="w-5 h-5 text-emerald-400 shrink-0" />
                <span>Anti-Enumeration 404 Guard</span>
              </div>
              <p className="text-xs text-gray-200 font-medium leading-relaxed">
                Unauthorized contact inquiries return identical 404 "No matching contact found" to prevent data existence leaks.
              </p>
            </div>

            <div className="glass-surface p-4 space-y-2 border-rose-500/30">
              <div className="flex items-center gap-2.5 text-rose-300 font-extrabold text-xs">
                <Layers className="w-5 h-5 text-rose-400 shrink-0" />
                <span>Single-Source Contact Scope</span>
              </div>
              <p className="text-xs text-gray-200 font-medium leading-relaxed">
                Tasks, invoices, estimates, activities, and attachments inherit visibility strictly from parent contact.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Sign-In Form & One-Click Reviewer Credentials */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Main Login Card */}
          <form onSubmit={handleLogin} className="glass-surface p-6 space-y-4 border-cyan-500/40">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-heading font-extrabold text-xl text-white">Sign In to Workspace</h2>
                <p className="text-xs text-gray-300 font-medium">Session Cookie Authentication</p>
              </div>
              <div className="w-9 h-9 rounded-xl btn-gradient flex items-center justify-center text-white shadow-lg">
                <Bot className="w-5 h-5 text-white" />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs font-bold">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-white mb-1.5 uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@crm.com"
                className="w-full glass-input text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-white mb-1.5 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full glass-input text-xs"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-xl btn-gradient text-white font-extrabold text-xs flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"
            >
              {loading ? 'Authenticating Session...' : 'Authenticate & Enter Workspace'}{' '}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Quick Reviewer Logins Card */}
          <div className="glass-surface p-5 space-y-3 border-violet-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-white uppercase tracking-wider flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-cyan-400" /> One-Click Reviewer Test Accounts
              </span>
              <span className="text-[11px] font-mono text-cyan-300 font-bold">Seeded Credentials</span>
            </div>

            <div className="space-y-2">
              {quickLogins.map((item) => (
                <button
                  key={item.email}
                  onClick={() => handleLogin(undefined, item.email, item.pass)}
                  className="w-full text-left p-3 rounded-xl bg-gray-950/80 hover:bg-gray-900 border border-white/10 hover:border-cyan-500/50 transition-all flex items-center justify-between group"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-extrabold text-white group-hover:text-cyan-300 transition-colors">
                        {item.label}
                      </span>
                      <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md ${item.badge}`}>
                        {item.role}
                      </span>
                    </div>
                    <div className="text-[11px] text-gray-300 font-medium">{item.desc}</div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-all shrink-0" />
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
