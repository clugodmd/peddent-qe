import { useEffect, useState, useCallback } from 'react';
import { Shield, RefreshCw, LogOut, Wifi, WifiOff, Clock, UserX, Sparkles } from 'lucide-react';
import { Header } from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { loadAllUsersStats } from '../services/firestoreProgress';
import { getAllActiveSessions, invalidateSession } from '../services/sessionService';

export function AdminDashboard() {
  const { isAdmin, logOut } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [invalidating, setInvalidating] = useState(null); // uid being invalidated
  const [lastRefresh, setLastRefresh] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Merge user stats + session info
      const [stats, sessions] = await Promise.all([
        loadAllUsersStats(),
        getAllActiveSessions()
      ]);

      // Index sessions by uid for O(1) lookup
      const sessionMap = {};
      sessions.forEach((s) => { sessionMap[s.uid] = s; });

      const merged = stats.map((u) => ({
        ...u,
        activeSessionToken: sessionMap[u.uid]?.activeSessionToken ?? null,
        lastLogin: sessionMap[u.uid]?.lastLogin ?? null
      }));

      // Sort: most recently active first
      merged.sort((a, b) => {
        const ta = a.lastStudied?.toMillis?.() ?? 0;
        const tb = b.lastStudied?.toMillis?.() ?? 0;
        return tb - ta;
      });

      setRows(merged);
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Admin load error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleInvalidate = async (uid, name) => {
    if (!window.confirm(`Force-logout ${name}? They'll be kicked out immediately.`)) return;
    setInvalidating(uid);
    try {
      await invalidateSession(uid);
      // Refresh the list
      await loadData();
    } catch (err) {
      console.error('Invalidate error:', err);
    } finally {
      setInvalidating(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <p className="text-red-400">Access denied.</p>
      </div>
    );
  }

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const accuracy = (row) => {
    if (!row.totalAnswered) return '—';
    return ((row.totalCorrect / row.totalAnswered) * 100).toFixed(1) + '%';
  };

  const isActive = (row) =>
    row.activeSessionToken && row.activeSessionToken !== '__invalidated__';

  return (
    <div className="min-h-screen bg-navy-900 pb-32">
      <Header title="Admin Dashboard" />

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">

        {/* Top bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-green-400">
            <Shield size={20} />
            <span className="font-semibold">Admin View</span>
          </div>
          <div className="flex items-center gap-3">
            {lastRefresh && (
              <span className="text-gray-500 text-xs flex items-center gap-1">
                <Clock size={12} />
                {lastRefresh.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-navy-700 hover:bg-navy-600 text-gray-300 text-sm transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={logOut}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-900/60 text-red-400 text-sm transition-colors"
            >
              <LogOut size={14} />
              Sign Out
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard label="Total Residents" value={rows.length} color="text-blue-400" />
          <StatCard
            label="Active Sessions"
            value={rows.filter(isActive).length}
            color="text-green-400"
          />
          <StatCard
            label="Avg. Accuracy"
            value={(() => {
              const scored = rows.filter((r) => r.totalAnswered > 0);
              if (!scored.length) return '—';
              const avg = scored.reduce((s, r) => s + (r.totalCorrect / r.totalAnswered), 0) / scored.length;
              return (avg * 100).toFixed(1) + '%';
            })()}
            color="text-purple-400"
          />
          <StatCard
            label="Total Attempts"
            value={rows.reduce((s, r) => s + (r.totalAnswered || 0), 0)}
            color="text-orange-400"
          />
        </div>

        {/* Resident table */}
        <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-navy-700 flex items-center justify-between">
            <h2 className="font-semibold text-gray-200">Residents</h2>
            <span className="text-gray-500 text-sm">{rows.length} accounts</span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500" />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-16 text-gray-500">No residents yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-navy-700 text-gray-400 text-xs uppercase tracking-wide">
                    <th className="text-left px-5 py-3">Name / Email</th>
                    <th className="text-center px-4 py-3">Session</th>
                    <th className="text-right px-4 py-3">Answered</th>
                    <th className="text-right px-4 py-3">% Correct</th>
                    <th className="text-right px-4 py-3">Last Active</th>
                    <th className="text-center px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const active = isActive(row);
                    return (
                      <tr
                        key={row.uid}
                        className="border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors"
                      >
                        {/* Name + Email */}
                        <td className="px-5 py-3">
                          <div className="font-medium text-gray-100">
                            {row.displayName || '—'}
                          </div>
                          <div className="text-gray-500 text-xs">{row.email}</div>
                        </td>

                        {/* Session status */}
                        <td className="px-4 py-3 text-center">
                          {active ? (
                            <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                              <Wifi size={12} />
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-gray-500 text-xs">
                              <WifiOff size={12} />
                              Offline
                            </span>
                          )}
                        </td>

                        {/* Questions answered */}
                        <td className="px-4 py-3 text-right text-gray-200 tabular-nums">
                          {row.totalAnswered ?? 0}
                        </td>

                        {/* % Correct */}
                        <td className="px-4 py-3 text-right tabular-nums">
                          <AccuracyBadge value={accuracy(row)} />
                        </td>

                        {/* Last active */}
                        <td className="px-4 py-3 text-right text-gray-400 text-xs whitespace-nowrap">
                          {formatDate(row.lastStudied)}
                        </td>

                        {/* Force-logout action */}
                        <td className="px-4 py-3 text-center">
                          {active ? (
                            <button
                              onClick={() => handleInvalidate(row.uid, row.displayName || row.email)}
                              disabled={invalidating === row.uid}
                              title="Force logout"
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400 text-xs transition-colors disabled:opacity-50"
                            >
                              {invalidating === row.uid ? (
                                <RefreshCw size={12} className="animate-spin" />
                              ) : (
                                <UserX size={12} />
                              )}
                              Kick
                            </button>
                          ) : (
                            <span className="text-gray-600 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Topic breakdown accordion placeholder */}
        <p className="text-gray-600 text-xs text-center">
          Topic-level breakdown per resident available via Firestore console.
        </p>

        {/* AI Question Generator — Coming Soon */}
        <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
          <div className="px-5 py-3 border-b border-navy-700 flex items-center gap-2">
            <Sparkles size={18} className="text-green-400" />
            <h2 className="font-semibold text-gray-200">AI Questions</h2>
            <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-green-900/40 text-green-400 border border-green-800">
              Coming Soon
            </span>
          </div>
          <div className="px-5 py-8 text-center text-gray-500 text-sm">
            <Sparkles size={32} className="mx-auto mb-3 text-green-800" />
            <p className="font-medium text-gray-400">Coming Soon</p>
            <p className="mt-1 text-gray-600">
              AI-generated case questions based on AAPD 2025 guidelines
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, color }) {
  return (
    <div className="bg-navy-800 border border-navy-700 rounded-xl p-4">
      <div className="text-gray-400 text-xs mb-1">{label}</div>
      <div className={`text-2xl font-bold ${color}`}>{value}</div>
    </div>
  );
}

function AccuracyBadge({ value }) {
  if (value === '—') return <span className="text-gray-500">—</span>;
  const num = parseFloat(value);
  const color =
    num >= 75 ? 'text-green-400' :
    num >= 60 ? 'text-yellow-400' :
    'text-red-400';
  return <span className={`font-semibold ${color}`}>{value}</span>;
}
