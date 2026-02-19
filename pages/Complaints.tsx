/**
 * Complaints.tsx — Redesigned Admin Complaints Dashboard
 * Aesthetic: Matches Ratings.tsx "Observatory" dark analytics style
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Search, CheckCircle2, AlertCircle, Clock, Database,
  ChevronDown, ChevronRight, X, Filter, Inbox,
  MessageSquare, User, Calendar, Tag, ArrowRight
} from 'lucide-react';
import { Complaint, ComplaintStatus } from '../types';
import { db } from '../lib/firebase';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ComplaintsProps { liveComplaints: Complaint[] }

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_ORDER: ComplaintStatus[] = ['Pending', 'In Progress', 'Resolved'];

const STATUS_CONFIG: Record<ComplaintStatus, {
  color: string; bg: string; border: string;
  icon: React.ReactNode; accent: string; dimmed: string;
}> = {
  'Pending': {
    color: '#f87171', bg: 'rgba(248,113,113,0.10)', border: 'rgba(248,113,113,0.25)',
    accent: '#ef4444', dimmed: 'rgba(239,68,68,0.15)',
    icon: <AlertCircle size={14} />,
  },
  'In Progress': {
    color: '#fbbf24', bg: 'rgba(251,191,36,0.10)', border: 'rgba(251,191,36,0.25)',
    accent: '#f59e0b', dimmed: 'rgba(245,158,11,0.15)',
    icon: <Clock size={14} />,
  },
  'Resolved': {
    color: '#34d399', bg: 'rgba(52,211,153,0.10)', border: 'rgba(52,211,153,0.25)',
    accent: '#10b981', dimmed: 'rgba(16,185,129,0.15)',
    icon: <CheckCircle2 size={14} />,
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTs(ts: number | string | undefined): string {
  if (!ts) return '—';
  try {
    const d = new Date(typeof ts === 'string' ? ts : ts);
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return '—'; }
}

function timeAgo(ts: number | undefined): string {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

// ─── Firebase updater ─────────────────────────────────────────────────────────

async function updateStatus(id: string, next: ComplaintStatus): Promise<void> {
  await db.collection('complaints').doc(id).update({ status: next, updatedAt: Date.now() });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusPill({ status }: { status: ComplaintStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      whiteSpace: 'nowrap',
    }}>
      {cfg.icon} {status}
    </span>
  );
}

function CategoryPill({ category }: { category: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 9px', borderRadius: 6,
      background: 'rgba(99,102,241,0.12)', color: '#818cf8',
      border: '1px solid rgba(99,102,241,0.22)',
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase',
      letterSpacing: '0.07em',
      fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace",
    }}>
      <Tag size={9} /> {category}
    </span>
  );
}

function KpiCard({ icon, label, value, accent, sub }: {
  icon: React.ReactNode; label: string; value: number; accent: string; sub?: string;
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)`,
      borderRadius: 16, padding: '20px 24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div style={{ display: 'inline-flex', padding: 8, background: `${accent}1a`, borderRadius: 10, color: accent, marginBottom: 14 }}>
        {icon}
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: 6, fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace" }}>{label}</p>
      <p style={{ fontSize: 30, fontWeight: 800, color: '#f8fafc', lineHeight: 1, fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", margin: 0 }}>
        {value}
        {sub && <span style={{ fontSize: 13, fontWeight: 400, color: '#64748b', marginLeft: 6 }}>{sub}</span>}
      </p>
    </div>
  );
}

// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmResolveModal({ complaint, onConfirm, onCancel }: {
  complaint: Complaint;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(2,6,23,0.80)', backdropFilter: 'blur(6px)',
        animation: 'fadeIn 0.15s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f172a', borderRadius: 18, width: '100%', maxWidth: 420,
          border: '1px solid rgba(52,211,153,0.25)',
          boxShadow: '0 0 0 1px rgba(52,211,153,0.08), 0 24px 48px rgba(0,0,0,0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Green top strip */}
        <div style={{ height: 3, background: 'linear-gradient(90deg, #10b981, transparent)' }} />

        <div style={{ padding: '24px 26px' }}>
          {/* Icon + heading */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
              background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#34d399',
            }}>
              <CheckCircle2 size={18} />
            </div>
            <div>
              <p style={{ fontSize: 15, fontWeight: 700, color: '#f1f5f9', margin: '0 0 2px' }}>Mark as Resolved?</p>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0 }}>This will move the complaint out of the active queue.</p>
            </div>
          </div>

          {/* Complaint preview */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '12px 14px', marginBottom: 22,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{complaint.userName}</span>
              <CategoryPill category={complaint.category} />
            </div>
            <p style={{
              fontSize: 12, color: '#94a3b8', margin: 0, lineHeight: 1.55,
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {complaint.complaintText}
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#94a3b8', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.09)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1, padding: '10px 0', borderRadius: 10,
                background: 'rgba(16,185,129,0.18)', border: '1px solid rgba(52,211,153,0.4)',
                color: '#34d399', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.28)'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(16,185,129,0.18)'; }}
            >
              <CheckCircle2 size={13} /> Confirm Resolve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Complaint Card ───────────────────────────────────────────────────────────

function ComplaintCard({ complaint, onStatusChange }: {
  complaint: Complaint;
  onStatusChange: (id: string, next: ComplaintStatus) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);
  const cfg = STATUS_CONFIG[complaint.status];

  const handleAction = async (next: ComplaintStatus) => {
    setLoading(true);
    try { await onStatusChange(complaint.id, next); }
    catch (err: any) {
      console.error(err);
      alert(err.code === 'permission-denied'
        ? 'ACCESS DENIED: You are not authorized to update complaints.'
        : 'Failed to update status. Check console for details.');
    } finally { setLoading(false); }
  };

  const isLong = complaint.complaintText?.length > 120;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: `1px solid ${complaint.status === 'Pending' ? cfg.border : 'rgba(255,255,255,0.07)'}`,
      borderRadius: 12, overflow: 'hidden',
      transition: 'border-color 0.2s',
      opacity: complaint.status === 'Resolved' ? 0.65 : 1,
    }}>
      {/* Top accent for Pending */}
      {complaint.status === 'Pending' && (
        <div style={{ height: 2, background: `linear-gradient(90deg, ${cfg.accent}, transparent)` }} />
      )}

      <div style={{ padding: '14px 18px' }}>
        {/* Row 1: User + meta + status + actions */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
            background: cfg.dimmed, border: `1px solid ${cfg.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: cfg.color, fontSize: 13, fontWeight: 800,
            fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace",
          }}>
            {complaint.userName?.charAt(0)?.toUpperCase() ?? '?'}
          </div>

          {/* Name + email + time */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{complaint.userName}</span>
              <CategoryPill category={complaint.category} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 11, color: '#475569', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace" }}>{complaint.userEmail}</span>
              {complaint.timestamp && (
                <>
                  <span style={{ color: '#1e293b', fontSize: 10 }}>·</span>
                  <span style={{ fontSize: 10, color: '#475569', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace" }} title={formatTs(complaint.timestamp)}>
                    {timeAgo(complaint.timestamp)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Status + action buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
            <StatusPill status={complaint.status} />
            {complaint.status === 'Pending' && (
              <button onClick={() => handleAction('In Progress')} disabled={loading} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 8, border: `1px solid rgba(251,191,36,0.3)`,
                background: 'rgba(251,191,36,0.1)', color: '#fbbf24',
                fontSize: 11, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(251,191,36,0.22)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(251,191,36,0.1)'; }}
              >
                <ArrowRight size={11} /> Start
              </button>
            )}
            {complaint.status !== 'Resolved' && (
              <button onClick={() => setConfirmPending(true)} disabled={loading} style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 8, border: `1px solid rgba(52,211,153,0.3)`,
                background: 'rgba(52,211,153,0.1)', color: '#34d399',
                fontSize: 11, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                transition: 'all 0.15s',
              }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(52,211,153,0.22)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(52,211,153,0.1)'; }}
              >
                <CheckCircle2 size={11} /> Resolve
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Complaint text */}
        <div style={{ marginTop: 12, paddingLeft: 46 }}>
          <p style={{
            fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: 0,
            display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2,
            WebkitBoxOrient: 'vertical', overflow: expanded ? 'visible' : 'hidden',
          }}>
            {complaint.complaintText}
          </p>
          {isLong && (
            <button onClick={() => setExpanded(p => !p)} style={{
              marginTop: 6, background: 'none', border: 'none', cursor: 'pointer',
              color: '#4f86f7', fontSize: 11, fontWeight: 600, padding: 0,
              display: 'flex', alignItems: 'center', gap: 3,
              fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}>
              {expanded ? 'Show less' : 'Read more'}
              <ChevronDown size={11} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
            </button>
          )}
        </div>
      </div>

      {confirmPending && (
        <ConfirmResolveModal
          complaint={complaint}
          onConfirm={() => { setConfirmPending(false); handleAction('Resolved'); }}
          onCancel={() => setConfirmPending(false)}
        />
      )}
    </div>
  );
}

// ─── Status Group ─────────────────────────────────────────────────────────────

function StatusGroup({ status, complaints, onStatusChange, defaultOpen }: {
  status: ComplaintStatus;
  complaints: Complaint[];
  onStatusChange: (id: string, next: ComplaintStatus) => Promise<void>;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const cfg = STATUS_CONFIG[status];

  return (
    <div style={{ borderRadius: 14, overflow: 'hidden', border: `1px solid ${open ? cfg.border : 'rgba(255,255,255,0.07)'}`, transition: 'border-color 0.2s' }}>
      {/* Group header */}
      <button onClick={() => setOpen(p => !p)} style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 12,
        padding: '14px 20px', background: open ? cfg.bg : 'rgba(255,255,255,0.02)',
        border: 'none', cursor: 'pointer', textAlign: 'left', transition: 'background 0.2s',
      }}>
        <span style={{ color: cfg.color }}>{cfg.icon}</span>
        <span style={{ fontWeight: 700, fontSize: 14, color: '#f1f5f9' }}>{status}</span>
        <span style={{
          fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace",
          fontSize: 11, fontWeight: 700,
          padding: '2px 9px', borderRadius: 20,
          background: cfg.dimmed, color: cfg.color,
          border: `1px solid ${cfg.border}`,
        }}>
          {complaints.length}
        </span>
        <ChevronDown size={15} color="#64748b" style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {/* Cards */}
      {open && (
        <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 8, background: 'rgba(0,0,0,0.15)' }}>
          {complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '28px 0', color: '#334155', fontSize: 12 }}>No {status.toLowerCase()} complaints.</div>
          ) : (
            complaints.map(c => (
              <ComplaintCard key={c.id} complaint={c} onStatusChange={onStatusChange} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Complaints({ liveComplaints }: ComplaintsProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = useMemo(() => {
    const cats = [...new Set(liveComplaints.map(c => c.category).filter(Boolean))].sort();
    return ['All', ...cats];
  }, [liveComplaints]);

  const handleStatusChange = useCallback(async (id: string, next: ComplaintStatus) => {
    await updateStatus(id, next);
  }, []);

  // Filter
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return liveComplaints.filter(c => {
      if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
      if (q && !c.userName?.toLowerCase().includes(q) && !c.complaintText?.toLowerCase().includes(q) && !c.category?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [liveComplaints, search, selectedCategory]);

  // Group by status, each group sorted newest-first
  const grouped = useMemo(() => {
    const map: Record<ComplaintStatus, Complaint[]> = { 'Pending': [], 'In Progress': [], 'Resolved': [] };
    for (const c of filtered) {
      if (map[c.status as ComplaintStatus]) map[c.status as ComplaintStatus].push(c);
    }
    // Pending & In Progress: oldest first (most overdue at top)
    // Resolved: newest first (most recently closed at top)
    map['Pending'].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    map['In Progress'].sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
    map['Resolved'].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));
    return map;
  }, [filtered]);

  const counts = useMemo(() => ({
    pending:    liveComplaints.filter(c => c.status === 'Pending').length,
    inProgress: liveComplaints.filter(c => c.status === 'In Progress').length,
    resolved:   liveComplaints.filter(c => c.status === 'Resolved').length,
  }), [liveComplaints]);

  const resolutionRate = liveComplaints.length
    ? Math.round((counts.resolved / liveComplaints.length) * 100) : 0;

  return (
    <>
      <style>{`@keyframes fadeIn { from { opacity:0 } to { opacity:1 } }`}</style>

      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: '#f1f5f9', minHeight: '100%', animation: 'fadeIn 0.3s ease' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ display: 'inline-flex', padding: 8, background: 'rgba(248,113,113,0.15)', borderRadius: 10, color: '#f87171' }}>
                <MessageSquare size={18} />
              </div>
              <h1 style={{ fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                Complaints
              </h1>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Live feed from Firestore · {liveComplaints.length} total ·&nbsp;
              <span style={{ color: resolutionRate >= 70 ? '#34d399' : resolutionRate >= 40 ? '#fbbf24' : '#f87171', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", fontWeight: 700 }}>{resolutionRate}%</span>
              &nbsp;resolved
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10 }}>
            <Database size={13} color="#10b981" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live</span>
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14, marginBottom: 28 }}>
          <KpiCard icon={<AlertCircle size={18} />}  label="Pending"     value={counts.pending}    accent="#ef4444" />
          <KpiCard icon={<Clock size={18} />}         label="In Progress" value={counts.inProgress} accent="#f59e0b" />
          <KpiCard icon={<CheckCircle2 size={18} />}  label="Resolved"    value={counts.resolved}   accent="#10b981" />
          <KpiCard icon={<MessageSquare size={18} />} label="Total"       value={liveComplaints.length} accent="#818cf8" sub={`· ${resolutionRate}% resolved`} />
        </div>

        {/* Search + Category filter bar */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center',
          padding: '14px 18px', background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, marginBottom: 24,
        }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#475569' }} />
            <input
              type="text" placeholder="Search by name, category or text…"
              value={search} onChange={e => setSearch(e.target.value)}
              style={{
                width: '100%', background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9,
                padding: '8px 12px 8px 34px', color: '#f1f5f9', fontSize: 13, outline: 'none',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Category pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <Filter size={13} color="#475569" />
            {categories.map(cat => {
              const active = selectedCategory === cat;
              return (
                <button key={cat} onClick={() => setSelectedCategory(cat)} style={{
                  padding: '5px 12px', borderRadius: 20,
                  border: `1px solid ${active ? 'rgba(99,102,241,0.4)' : 'rgba(255,255,255,0.08)'}`,
                  background: active ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: active ? '#818cf8' : '#64748b',
                  fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
                  textTransform: 'uppercase', letterSpacing: '0.06em',
                  fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace",
                }}>
                  {cat}
                </button>
              );
            })}
          </div>

          <span style={{ marginLeft: 'auto', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", fontSize: 11, color: '#475569', whiteSpace: 'nowrap' }}>
            {filtered.length !== liveComplaints.length
              ? <><span style={{ color: '#f1f5f9', fontWeight: 700 }}>{filtered.length}</span> / {liveComplaints.length}</>
              : <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{liveComplaints.length} complaints</span>}
          </span>
        </div>

        {/* Grouped complaint lists */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#334155' }}>
            <Inbox size={42} style={{ margin: '0 auto 14px', opacity: 0.2 }} />
            <p style={{ fontSize: 14 }}>No complaints match your filters.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {STATUS_ORDER.map(status => (
              <StatusGroup
                key={status}
                status={status}
                complaints={grouped[status]}
                onStatusChange={handleStatusChange}
                defaultOpen={status !== 'Resolved'}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
