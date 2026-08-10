'use client';

import React, { useEffect, useState } from 'react';
import SidebarLayout from '@/components/SidebarLayout';
import SkeletonLoader from '@/components/SkeletonLoader';
import { BarChart3, ShieldAlert, Bot, DollarSign, Cpu, Clock, Layers, FileCode2, AlertTriangle, ShieldCheck, UserCheck, Terminal, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminAnalyticsPage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [userBreakdown, setUserBreakdown] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

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

        if (meData.user.role !== 'ADMIN') {
          setError('Access Denied: System Administrator role required');
          return;
        }

        const analyticsRes = await fetch('/api/admin/analytics');
        if (!analyticsRes.ok) {
          throw new Error('Failed to load analytics data');
        }

        const data = await analyticsRes.json();
        setStats(data.stats || {});
        setUserBreakdown(data.user_breakdown || []);
        setLogs(data.logs || []);
      } catch (err: any) {
        setError(err.message || 'Error loading analytics');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <SidebarLayout user={user}>
        <SkeletonLoader variant="full" />
      </SidebarLayout>
    );
  }

  if (error) {
    return (
      <SidebarLayout user={user}>
        <div className="p-8 rounded-2xl glass-surface border-rose-500/50 text-center space-y-4 max-w-md mx-auto my-12">
          <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto" />
          <h2 className="font-heading text-2xl font-extrabold text-white">Admin Access Required</h2>
          <p className="text-xs text-rose-200 font-medium">{error}</p>
        </div>
      </SidebarLayout>
    );
  }

  return (
    <SidebarLayout user={user}>
      <div className="space-y-8">
        
        {/* Header Title */}
        <div className="glass-surface p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border-cyan-500/30 bg-gradient-to-r from-gray-950 via-gray-900 to-gray-950">
          <div>
            <h1 className="font-heading text-2xl lg:text-3xl font-extrabold text-white">
              NVIDIA NIM Token & Cost Analytics Panel
            </h1>
            <p className="text-xs text-gray-300 font-mono mt-1">
              Org-Wide LLM Spending • Token Consumption • Security Incident Audit Log
            </p>
          </div>

          <div className="glass-surface px-4 py-2 flex items-center gap-2 border-rose-500/40 text-xs font-mono text-rose-300 bg-gray-950 shrink-0">
            <ShieldCheck className="w-4 h-4 text-rose-400" /> Admin Audit Active
          </div>
        </div>

        {/* 4 Summary Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-surface p-5 space-y-3 glass-surface-hover border-cyan-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-300 uppercase tracking-wider">Total LLM Spend</span>
              <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <DollarSign className="w-5 h-5" />
              </div>
            </div>
            <div className="font-heading text-3xl font-extrabold text-white">
              ${parseFloat(stats?.total_cost || 0).toFixed(4)}
            </div>
            <p className="text-xs text-gray-300 font-medium">NVIDIA NIM LLM billing</p>
          </div>

          <div className="glass-surface p-5 space-y-3 glass-surface-hover border-violet-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-300 uppercase tracking-wider">Total Tokens</span>
              <div className="w-9 h-9 rounded-xl bg-violet-500/15 border border-violet-500/40 flex items-center justify-center text-violet-400">
                <Cpu className="w-5 h-5" />
              </div>
            </div>
            <div className="font-heading text-3xl font-extrabold text-white">
              {new Intl.NumberFormat().format(parseInt(stats?.total_tokens || 0))}
            </div>
            <p className="text-xs text-gray-300 font-medium">Input & output token count</p>
          </div>

          <div className="glass-surface p-5 space-y-3 glass-surface-hover border-emerald-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-300 uppercase tracking-wider">Total Queries</span>
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Layers className="w-5 h-5" />
              </div>
            </div>
            <div className="font-heading text-3xl font-extrabold text-white">
              {stats?.total_queries || 0}
            </div>
            <p className="text-xs text-gray-300 font-medium">Executed & audited queries</p>
          </div>

          <div className="glass-surface p-5 space-y-3 glass-surface-hover border-rose-500/30">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-gray-300 uppercase tracking-wider">Blocked Injections</span>
              <div className="w-9 h-9 rounded-xl bg-rose-500/15 border border-rose-500/40 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="font-heading text-3xl font-extrabold text-rose-300">
              {stats?.blocked_queries || 0}
            </div>
            <p className="text-xs text-gray-300 font-medium">AST guardrail rejections</p>
          </div>
        </div>

        {/* Per-User Consumption Breakdown Table */}
        <div className="glass-surface p-6 border-white/15 space-y-4 bg-gray-950/80">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-extrabold text-lg text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-cyan-400" /> Per-User Spending & Token Consumption
            </h2>
            <span className="text-xs font-mono text-cyan-300">Role-Scoped Spending Aggregates</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/15 text-cyan-300 font-extrabold uppercase tracking-wider bg-gray-900">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Email</th>
                  <th className="py-3.5 px-4">Role</th>
                  <th className="py-3.5 px-4">Queries Executed</th>
                  <th className="py-3.5 px-4">Total Tokens</th>
                  <th className="py-3.5 px-4">Total Cost (USD)</th>
                  <th className="py-3.5 px-4">Avg Latency</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {userBreakdown.length === 0 ? (
                  <tr><td colSpan={7} className="py-8 text-center text-gray-400">No user consumption records found.</td></tr>
                ) : (
                  userBreakdown.map((u, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">{u.user_name}</td>
                      <td className="py-3.5 px-4 text-cyan-300 font-bold">{u.user_email}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded uppercase ${
                          u.role === 'ADMIN' ? 'role-badge-admin' : u.role === 'MANAGER' ? 'role-badge-manager' : 'role-badge-member'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-gray-200 font-bold">{u.query_count}</td>
                      <td className="py-3.5 px-4 text-violet-300 font-bold">
                        {new Intl.NumberFormat().format(parseInt(u.total_tokens || 0))}
                      </td>
                      <td className="py-3.5 px-4 text-cyan-300 font-bold">
                        ${parseFloat(u.total_cost || 0).toFixed(6)}
                      </td>
                      <td className="py-3.5 px-4 text-gray-300">{Math.round(parseFloat(u.avg_latency_ms || 0))}ms</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* AI Queries Audit Log Table */}
        <div className="glass-surface p-6 border-white/15 space-y-4 bg-gray-950/80">
          <div className="flex items-center justify-between">
            <h2 className="font-heading font-extrabold text-lg text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-rose-400" /> Security & Execution Audit Trail Log
            </h2>
            <span className="text-xs font-mono text-cyan-300">NVIDIA NIM Infrastructure</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/15 text-cyan-300 font-extrabold uppercase tracking-wider bg-gray-900">
                  <th className="py-3.5 px-4">User</th>
                  <th className="py-3.5 px-4">Question Prompt</th>
                  <th className="py-3.5 px-4">Status / Security Reason</th>
                  <th className="py-3.5 px-4">Tokens</th>
                  <th className="py-3.5 px-4">Cost (USD)</th>
                  <th className="py-3.5 px-4">Latency</th>
                  <th className="py-3.5 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-gray-400">
                      No query logs recorded yet. Run a prompt in the AI Assistant to generate audit logs.
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-white/5 transition-colors">
                        <td className="py-3.5 px-4 font-bold text-white">{log.user_name || log.user_email}</td>
                        <td className="py-3.5 px-4 font-sans text-gray-200">{log.question}</td>
                        <td className="py-3.5 px-4">
                          {log.was_blocked ? (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
                              🛡️ {log.block_reason || 'AST Blocked'}
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                              Executed ({log.row_count} rows)
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-violet-300 font-bold">
                          {(log.input_tokens || 0) + (log.output_tokens || 0)}
                        </td>
                        <td className="py-3.5 px-4 text-cyan-300 font-bold">
                          ${parseFloat(log.cost_usd || 0).toFixed(6)}
                        </td>
                        <td className="py-3.5 px-4 text-gray-300">{log.latency_ms || 420}ms</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setExpandedLogId(expandedLogId === log.id ? null : log.id)}
                            className="p-1.5 rounded-lg bg-gray-900 hover:bg-gray-800 text-cyan-300 border border-white/15"
                            title="Toggle SQL"
                          >
                            {expandedLogId === log.id ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      </tr>

                      {expandedLogId === log.id && (
                        <tr className="bg-gray-900/90">
                          <td colSpan={7} className="p-4 space-y-2">
                            <div className="text-[10px] font-extrabold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
                              <Terminal className="w-3.5 h-3.5 text-cyan-400" /> Generated SQL Query
                            </div>
                            <div className="p-3 rounded-xl bg-gray-950 font-mono text-xs text-cyan-200 border border-white/10 overflow-x-auto">
                              <code>{log.generated_sql || 'N/A'}</code>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
