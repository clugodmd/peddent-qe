import { useEffect, useState, useCallback } from 'react';
import {
  Shield, RefreshCw, LogOut, Wifi, WifiOff, Clock, UserX, Sparkles,
  Users, Activity, Ban, Gift, ChevronDown, Zap, Monitor, Trash2, ShieldCheck
} from 'lucide-react';
import { collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { Header } from '../components/layout/Header';
import { useAuth } from '../context/AuthContext';
import { revokeAllSessions, getUserSessions } from '../services/sessionService';
import { setUserRole, ROLES, setRequiresVerification } from '../services/accessControl';

const FIVE_MINUTES_MS = 5 * 60 * 1000;

export function AdminDashboard() {
  const { isAdmin, logOut } = useAuth();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [activeTab, setActiveTab] = useState('live'); // 'live' | 'users'
  const [actionLoading, setActionLoading] = useState(null); // uid being acted on
  const [sessionDetails, setSessionDetails] = useState({}); // uid → sessions[]

  // ── Real-time listener for userDirectory ───────────────────────────────────
  useEffect(() => {
    if (!isAdmin) return;

    const unsubscribe = onSnapshot(collection(db, 'userDirectory'), async (snap) => {
      const dirUsers = snap.docs.map((d) => ({ uid: d.id, ...d.data() }));

      // Fetch stats for each user
      const statsPromises = dirUsers.map(async (u) => {
        try {
          const statsSnap = await getDocs(collection(db, `users/${u.uid}/stats`));
          let stats = { totalAnswered: 0, totalCorrect: 0, lastStudied: null };
          statsSnap.forEach((d) => {
            if (d.id === 'summary') stats = d.data();
          });
          return { ...u, ...stats };
        } catch {
          return { ...u, totalAnswered: 0, totalCorrect: 0, lastStudied: null };
        }
      });

      const merged = await Promise.all(statsPromises);

      // Fetch session counts for each user
      const sessionPromises = merged.map(async (u) => {
        try {
          const sessions = await getUserSessions(u.uid);
          const activeSessions = sessions.filter((s) => s.active !== false);
          return { ...u, sessionCount: activeSessions.length, sessions: activeSessions };
        } catch {
          return { ...u, sessionCount: 0, sessions: [] };
        }
      });

      const withSessions = await Promise.all(sessionPromises);

      // Update session details map
      const newSessionDetails = {};
      withSessions.forEach((u) => {
        newSessionDetails[u.uid] = u.sessions || [];
      });
      setSessionDetails(newSessionDetails);

      // Sort: most recently active first
      withSessions.sort((a, b) => {
        const ta = a.lastStudied?.toMillis?.() ?? a.lastLogin?.toMillis?.() ?? 0;
        const tb = b.lastStudied?.toMillis?.() ?? b.lastLogin?.toMillis?.() ?? 0;
        return tb - ta;
      });

      setRows(withSessions);
      setLastRefresh(new Date());
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isAdmin]);

  // ── Actions ────────────────────────────────────────────────────────────────

  const handleRoleChange = async (uid, newRole) => {
    setActionLoading(uid);
    try {
      await setUserRole(uid, newRole);
    } catch (err) {
      console.error('Role change error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleBlock = async (uid, name) => {
    if (!window.confirm(`Block ${name}? They will be signed out and unable to access the app.`)) return;
    setActionLoading(uid);
    try {
      await setUserRole(uid, 'blocked');
      await revokeAllSessions(uid);
    } catch (err) {
      console.error('Block error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleGift = async (uid, name) => {
    if (!window.confirm(`Gift free access to ${name}?`)) return;
    setActionLoading(uid);
    try {
      await setUserRole(uid, 'gifted');
    } catch (err) {
      console.error('Gift error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRevokeSessions = async (uid, name) => {
    if (!window.confirm(`Revoke all sessions for ${name}? They'll be signed out on all devices.`)) return;
    setActionLoading(uid);
    try {
      await revokeAllSessions(uid);
    } catch (err) {
      console.error('Revoke error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleVerification = async (uid, currentValue) => {
    setActionLoading(uid);
    try {
      await setRequiresVerification(uid, !currentValue);
    } catch (err) {
      console.error('Verification toggle error:', err);
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <p className="text-red-400">Access denied.</p>
      </div>
    );
  }

  // ── Derived data ───────────────────────────────────────────────────────────

  const now = Date.now();
  const liveUsers = rows.filter((r) => {
    const sessions = sessionDetails[r.uid] || [];
    return sessions.some((s) => {
      const lastSeen = s.lastSeen?.toMillis?.() ?? 0;
      return lastSeen > now - FIVE_MINUTES_MS && s.active !== false;
    });
  });

  const totalActiveSessions = rows.reduce((sum, r) => sum + (r.sessionCount || 0), 0);

  const formatDate = (ts) => {
    if (!ts) return '--';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    return d.toLocaleDateString('en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const formatTimeAgo = (ts) => {
    if (!ts) return '--';
    const d = ts.toDate ? ts.toDate() : new Date(ts);
    const diff = now - d.getTime();
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return formatDate(ts);
  };

  const accuracy = (row) => {
    if (!row.totalAnswered) return '--';
    return ((row.totalCorrect / row.totalAnswered) * 100).toFixed(1) + '%';
  };

  const roleBadge = (role) => {
    const styles = {
      free: 'bg-blue-900/40 text-blue-400 border-blue-800',
      paid: 'bg-green-900/40 text-green-400 border-green-800',
      blocked: 'bg-red-900/40 text-red-400 border-red-800',
      gifted: 'bg-purple-900/40 text-purple-400 border-purple-800'
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs border ${styles[role] || styles.free}`}>
        {role || 'free'}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-navy-900 pb-32">
      <Header title="Admin Dashboard" />

      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">

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
            <span className="text-green-400 text-xs flex items-center gap-1">
              <Zap size={12} />
              Live
            </span>
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
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <StatCard label="Total Users" value={rows.length} color="text-blue-400" />
          <StatCard label="Live Now" value={liveUsers.length} color="text-green-400" />
          <StatCard label="Active Sessions" value={totalActiveSessions} color="text-cyan-400" />
          <StatCard
            label="Avg. Accuracy"
            value={(() => {
              const scored = rows.filter((r) => r.totalAnswered > 0);
              if (!scored.length) return '--';
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

        {/* Tab switcher */}
        <div className="flex rounded-xl overflow-hidden border border-navy-600">
          <button
            onClick={() => setActiveTab('live')}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'live' ? 'bg-green-700 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Activity size={14} />
            Live Users ({liveUsers.length})
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-2.5 text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'users' ? 'bg-green-700 text-white' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users size={14} />
            All Users ({rows.length})
          </button>
        </div>

        {/* ─── LIVE USERS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'live' && (
          <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-navy-700 flex items-center justify-between">
              <h2 className="font-semibold text-gray-200 flex items-center gap-2">
                <Activity size={16} className="text-green-400" />
                Live Users
              </h2>
              <span className="text-gray-500 text-sm">Active in last 5 minutes</span>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : liveUsers.length === 0 ? (
              <div className="text-center py-16 text-gray-500">No active users right now.</div>
            ) : (
              <div className="divide-y divide-navy-700/50">
                {liveUsers.map((row) => {
                  const sessions = sessionDetails[row.uid] || [];
                  return (
                    <div key={row.uid} className="px-5 py-4 hover:bg-navy-700/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-100 flex items-center gap-2">
                            {row.displayName || '--'}
                            {roleBadge(row.role)}
                            <span className="inline-flex items-center gap-1 text-green-400 text-xs">
                              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                              Online
                            </span>
                          </div>
                          <div className="text-gray-500 text-xs mt-0.5">{row.email}</div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleBlock(row.uid, row.displayName || row.email)}
                            disabled={actionLoading === row.uid}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400 text-xs transition-colors disabled:opacity-50"
                          >
                            <Ban size={12} />
                            Block
                          </button>
                          <button
                            onClick={() => handleGift(row.uid, row.displayName || row.email)}
                            disabled={actionLoading === row.uid}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-900/30 hover:bg-purple-900/60 text-purple-400 text-xs transition-colors disabled:opacity-50"
                          >
                            <Gift size={12} />
                            Gift
                          </button>
                          <button
                            onClick={() => handleRevokeSessions(row.uid, row.displayName || row.email)}
                            disabled={actionLoading === row.uid}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-orange-900/30 hover:bg-orange-900/60 text-orange-400 text-xs transition-colors disabled:opacity-50"
                          >
                            <Trash2 size={12} />
                            Revoke
                          </button>
                        </div>
                      </div>
                      {/* Session details */}
                      {sessions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          {sessions.map((s) => (
                            <div key={s.id} className="flex items-center gap-3 text-xs text-gray-500 pl-2 border-l-2 border-navy-600">
                              <Monitor size={12} />
                              <span>{s.deviceInfo || 'Unknown device'}</span>
                              <span className="text-gray-600">|</span>
                              <span>Last seen: {formatTimeAgo(s.lastSeen)}</span>
                              {s.ip && s.ip !== 'unknown' && (
                                <>
                                  <span className="text-gray-600">|</span>
                                  <span>IP: {s.ip}</span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── ALL USERS TAB ──────────────────────────────────────────────────── */}
        {activeTab === 'users' && (
          <div className="bg-navy-800 border border-navy-700 rounded-xl overflow-hidden">
            <div className="px-5 py-3 border-b border-navy-700 flex items-center justify-between">
              <h2 className="font-semibold text-gray-200">All Users</h2>
              <span className="text-gray-500 text-sm">{rows.length} accounts</span>
            </div>

            {loading ? (
              <LoadingSpinner />
            ) : rows.length === 0 ? (
              <div className="text-center py-16 text-gray-500">No users yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-navy-700 text-gray-400 text-xs uppercase tracking-wide">
                      <th className="text-left px-5 py-3">User</th>
                      <th className="text-center px-3 py-3">Role</th>
                      <th className="text-center px-3 py-3">Sessions</th>
                      <th className="text-right px-3 py-3">Answered</th>
                      <th className="text-right px-3 py-3">Accuracy</th>
                      <th className="text-right px-3 py-3">Joined</th>
                      <th className="text-right px-3 py-3">Last Login</th>
                      <th className="text-center px-3 py-3">Verify</th>
                      <th className="text-center px-3 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr
                        key={row.uid}
                        className="border-b border-navy-700/50 hover:bg-navy-700/30 transition-colors"
                      >
                        {/* User */}
                        <td className="px-5 py-3">
                          <div className="font-medium text-gray-100">
                            {row.displayName || '--'}
                          </div>
                          <div className="text-gray-500 text-xs">{row.email}</div>
                        </td>

                        {/* Role dropdown */}
                        <td className="px-3 py-3 text-center">
                          <select
                            value={row.role || 'free'}
                            onChange={(e) => handleRoleChange(row.uid, e.target.value)}
                            disabled={actionLoading === row.uid}
                            className="bg-navy-900 border border-navy-600 rounded-lg text-xs text-gray-300 px-2 py-1 focus:outline-none focus:border-green-600"
                          >
                            {ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </td>

                        {/* Session count */}
                        <td className="px-3 py-3 text-center">
                          <span className="text-gray-300 text-xs tabular-nums">
                            {row.sessionCount || 0}
                          </span>
                        </td>

                        {/* Answered */}
                        <td className="px-3 py-3 text-right text-gray-200 tabular-nums">
                          {row.totalAnswered ?? 0}
                        </td>

                        {/* Accuracy */}
                        <td className="px-3 py-3 text-right tabular-nums">
                          <AccuracyBadge value={accuracy(row)} />
                        </td>

                        {/* Joined */}
                        <td className="px-3 py-3 text-right text-gray-400 text-xs whitespace-nowrap">
                          {formatDate(row.createdAt)}
                        </td>

                        {/* Last login */}
                        <td className="px-3 py-3 text-right text-gray-400 text-xs whitespace-nowrap">
                          {formatDate(row.lastLogin)}
                        </td>

                        {/* Verification toggle */}
                        <td className="px-3 py-3 text-center">
                          <button
                            onClick={() => handleToggleVerification(row.uid, row.requiresVerification)}
                            disabled={actionLoading === row.uid}
                            title={row.requiresVerification ? 'Verification required -- click to disable' : 'Click to require verification'}
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors disabled:opacity-50 ${
                              row.requiresVerification
                                ? 'bg-blue-900/40 text-blue-400 border border-blue-800'
                                : 'bg-navy-700 text-gray-500 hover:text-gray-300'
                            }`}
                          >
                            <ShieldCheck size={12} />
                            {row.requiresVerification ? 'On' : 'Off'}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="px-3 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleGift(row.uid, row.displayName || row.email)}
                              disabled={actionLoading === row.uid || row.role === 'gifted'}
                              title="Gift access"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-900/30 hover:bg-purple-900/60 text-purple-400 text-xs transition-colors disabled:opacity-50"
                            >
                              <Gift size={12} />
                            </button>
                            <button
                              onClick={() => handleBlock(row.uid, row.displayName || row.email)}
                              disabled={actionLoading === row.uid || row.role === 'blocked'}
                              title="Block user"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-red-900/30 hover:bg-red-900/60 text-red-400 text-xs transition-colors disabled:opacity-50"
                            >
                              <Ban size={12} />
                            </button>
                            <button
                              onClick={() => handleRevokeSessions(row.uid, row.displayName || row.email)}
                              disabled={actionLoading === row.uid || !row.sessionCount}
                              title="Revoke all sessions"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-900/30 hover:bg-orange-900/60 text-orange-400 text-xs transition-colors disabled:opacity-50"
                            >
                              <UserX size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

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
  if (value === '--') return <span className="text-gray-500">--</span>;
  const num = parseFloat(value);
  const color =
    num >= 75 ? 'text-green-400' :
    num >= 60 ? 'text-yellow-400' :
    'text-red-400';
  return <span className={`font-semibold ${color}`}>{value}</span>;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-green-500" />
    </div>
  );
}
