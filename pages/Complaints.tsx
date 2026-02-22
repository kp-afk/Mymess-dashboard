import React, { useState, useMemo, useCallback } from 'react';
import {
  Search, CheckCircle2, AlertCircle, Clock, Database,
  ChevronDown, X, Filter, Inbox,
  MessageSquare, Tag, ArrowRight
} from 'lucide-react';
import { Complaint, ComplaintStatus } from '../types';
import { db } from '../lib/firebase';

interface ComplaintsProps { liveComplaints: Complaint[] }

const STATUS_ORDER: ComplaintStatus[] = ['Pending', 'In Progress', 'Resolved'];

const STATUS_CONFIG: Record<ComplaintStatus, {
  color: string; bg: string; border: string;
  icon: React.ReactNode; accent: string;
}> = {
  'Pending':     { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)',  accent: '#ef4444', icon: <AlertCircle size={13} /> },
  'In Progress': { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.2)',  accent: '#f59e0b', icon: <Clock size={13} /> },
  'Resolved':    { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.2)',  accent: '#22c55e', icon: <CheckCircle2 size={13} /> },
};

const MONO = "'Geist Mono','JetBrains Mono','Fira Code',monospace";

function formatTs(ts: number | string | undefined): string {
  if (!ts) return '—';
  try { return new Date(typeof ts === 'string' ? ts : ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return '—'; }
}

function timeAgo(ts: number | undefined): string {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

async function updateStatus(id: string, next: ComplaintStatus): Promise<void> {
  await db.collection('complaints').doc(id).update({ status: next, updatedAt: Date.now() });
}

// ── Status Badge ────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ComplaintStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px',
      background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`,
      fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
      fontFamily: MONO, whiteSpace: 'nowrap',
    }}>
      {cfg.icon} {status}
    </span>
  );
}

// ── Category Badge ───────────────────────────────────────────────────────────

function CategoryBadge({ category }: { category: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px',
      background: 'rgba(245,158,11,0.08)', color: '#f59e0b',
      border: '1px solid rgba(245,158,11,0.2)',
      fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
      fontFamily: MONO,
    }}>
      <Tag size={8} /> {category}
    </span>
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div style={{
      background: '#0d0d0d', border: `1px solid #1a1a1a`,
      padding: '16px 20px', fontFamily: MONO,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#555' }}>{label}</span>
        <span style={{ color, opacity: 0.6 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1}}>{value}</div>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────────────────────

function ConfirmResolveModal({ complaint, onConfirm, onCancel }: {
  complaint: Complaint; onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed', inset: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 16, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0d0d0d', width: '100%', maxWidth: 420,
          border: '1px solid rgba(74,222,128,0.2)',
          boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
          fontFamily: MONO, overflow: 'hidden',
        }}
      >
        <div style={{ height: 2, background: 'linear-gradient(90deg, #22c55e, transparent)' }} />
        <div style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{
              width: 36, height: 36, flexShrink: 0, background: 'rgba(74,222,128,0.1)',
              border: '1px solid rgba(74,222,128,0.25)', display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: '#4ade80',
            }}>
              <CheckCircle2 size={16} />
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#e8e8e8', margin: '0 0 2px' }}>Mark as Resolved?</p>
              <p style={{ fontSize: 11, color: '#555', margin: 0 }}>Moves complaint out of active queue.</p>
            </div>
          </div>

          <div style={{ background: '#111', border: '1px solid #1f1f1f', padding: '12px 14px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#ccc' }}>{complaint.userName}</span>
              <CategoryBadge category={complaint.category} />
            </div>
            <p style={{
              fontSize: 11, color: '#666', margin: 0, lineHeight: 1.6,
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {complaint.complaintText}
            </p>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onCancel}
              style={{
                flex: 1, padding: '10px 0', background: '#111',
                border: '1px solid #2a2a2a', color: '#666', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: MONO, letterSpacing: '0.1em', textTransform: 'uppercase',
              }}
            >Cancel</button>
            <button
              onClick={onConfirm}
              style={{
                flex: 1, padding: '10px 0',
                background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.3)',
                color: '#4ade80', fontSize: 12, fontWeight: 700,
                cursor: 'pointer', fontFamily: MONO, letterSpacing: '0.1em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            ><CheckCircle2 size={12} /> Confirm</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Complaint Row ─────────────────────────────────────────────────────────────

function ComplaintCard({ complaint, onStatusChange }: {
  complaint: Complaint;
  onStatusChange: (id: string, next: ComplaintStatus) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmPending, setConfirmPending] = useState(false);
  const cfg = STATUS_CONFIG[complaint.status];
  const isLong = complaint.complaintText?.length > 120;

  const handleAction = async (next: ComplaintStatus) => {
    setLoading(true);
    try { await onStatusChange(complaint.id, next); }
    catch (err: any) {
      alert(err.code === 'permission-denied'
        ? 'ACCESS DENIED: Not authorized to update complaints.'
        : 'Failed to update status.');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      background: '#0d0d0d',
      border: `1px solid ${complaint.status === 'Pending' ? cfg.border : '#1a1a1a'}`,
      opacity: complaint.status === 'Resolved' ? 0.6 : 1,
      fontFamily: MONO,
    }}>
      {complaint.status === 'Pending' && (
        <div style={{ height: 2, background: `linear-gradient(90deg, ${cfg.accent}, transparent)` }} />
      )}
      <div style={{ padding: '14px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
          {/* Avatar */}
          <div style={{
            width: 32, height: 32, flexShrink: 0,
            background: `${cfg.color}12`, border: `1px solid ${cfg.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: cfg.color, fontSize: 12, fontWeight: 800,
          }}>
            {complaint.userName?.charAt(0)?.toUpperCase() ?? '?'}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 3 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#ccc' }}>{complaint.userName}</span>
              <CategoryBadge category={complaint.category} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, color: '#444' }}>{complaint.userEmail}</span>
              {complaint.timestamp && (
                <>
                  <span style={{ color: '#222' }}>·</span>
                  <span style={{ fontSize: 10, color: '#444' }} title={formatTs(complaint.timestamp)}>
                    {timeAgo(complaint.timestamp)}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, flexWrap: 'wrap' }}>
            <StatusBadge status={complaint.status} />
            {complaint.status === 'Pending' && (
              <button
                onClick={() => handleAction('In Progress')}
                disabled={loading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                  border: '1px solid rgba(245,158,11,0.25)', background: 'rgba(245,158,11,0.08)',
                  color: '#f59e0b', fontSize: 10, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                  fontFamily: MONO, letterSpacing: '0.1em', textTransform: 'uppercase',
                }}
              ><ArrowRight size={10} /> Start</button>
            )}
            {complaint.status !== 'Resolved' && (
              <button
                onClick={() => setConfirmPending(true)}
                disabled={loading}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                  border: '1px solid rgba(74,222,128,0.25)', background: 'rgba(74,222,128,0.08)',
                  color: '#4ade80', fontSize: 10, fontWeight: 700, cursor: loading ? 'wait' : 'pointer',
                  fontFamily: MONO, letterSpacing: '0.1em', textTransform: 'uppercase',
                }}
              ><CheckCircle2 size={10} /> Resolve</button>
            )}
          </div>
        </div>

        {/* Complaint text */}
        <div style={{ marginTop: 10, paddingLeft: 44 }}>
          <p style={{
            fontSize: 12, color: '#888', lineHeight: 1.6, margin: 0,
            display: '-webkit-box', WebkitLineClamp: expanded ? 'unset' : 2,
            WebkitBoxOrient: 'vertical', overflow: expanded ? 'visible' : 'hidden',
          }}>
            {complaint.complaintText}
          </p>
          {isLong && (
            <button
              onClick={() => setExpanded(p => !p)}
              style={{
                marginTop: 5, background: 'none', border: 'none', cursor: 'pointer',
                color: '#f59e0b', fontSize: 10, fontWeight: 700, padding: 0,
                fontFamily: MONO, letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 3,
              }}
            >
              {expanded ? 'Show less' : 'Read more'}
              <ChevronDown size={10} style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
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

// ── Status Group ──────────────────────────────────────────────────────────────

function StatusGroup({ status, complaints, onStatusChange, defaultOpen }: {
  status: ComplaintStatus;
  complaints: Complaint[];
  onStatusChange: (id: string, next: ComplaintStatus) => Promise<void>;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const cfg = STATUS_CONFIG[status];

  return (
    <div style={{ border: `1px solid ${open ? cfg.border : '#1a1a1a'}`, fontFamily: MONO }}>
      <button
        onClick={() => setOpen(p => !p)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '13px 18px', background: open ? cfg.bg : 'transparent',
          border: 'none', cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ color: cfg.color }}>{cfg.icon}</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#ccc', letterSpacing: '0.02em' }}>{status}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px',
          background: `${cfg.color}12`, color: cfg.color, border: `1px solid ${cfg.border}`,
          fontFamily: MONO, letterSpacing: '0.1em',
        }}>
          {complaints.length}
        </span>
        <ChevronDown
          size={14}
          color="#555"
          style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 6, background: '#080808' }}>
          {complaints.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#333', fontSize: 11 }}>
              No {status.toLowerCase()} complaints.
            </div>
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

// ── Main ──────────────────────────────────────────────────────────────────────

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

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return liveComplaints.filter(c => {
      if (selectedCategory !== 'All' && c.category !== selectedCategory) return false;
      if (q && !c.userName?.toLowerCase().includes(q) && !c.complaintText?.toLowerCase().includes(q) && !c.category?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [liveComplaints, search, selectedCategory]);

  const grouped = useMemo(() => {
    const map: Record<ComplaintStatus, Complaint[]> = { 'Pending': [], 'In Progress': [], 'Resolved': [] };
    for (const c of filtered) {
      if (map[c.status as ComplaintStatus]) map[c.status as ComplaintStatus].push(c);
    }
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
    <div style={{ fontFamily: MONO, color: '#d4d4d4' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #1f1f1f' }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#555', marginBottom: 4 }}>
            Grievances
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e8e8e8', margin: 0, letterSpacing: '-0.01em' }}>Complaints</h1>
          <p style={{ fontSize: 11, color: '#555', margin: '4px 0 0' }}>
            {liveComplaints.length} total ·&nbsp;
            <span style={{ color: resolutionRate >= 70 ? '#4ade80' : resolutionRate >= 40 ? '#f59e0b' : '#f87171', fontWeight: 700 }}>
              {resolutionRate}%
            </span>
            &nbsp;resolved
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
          <Database size={11} color="#4ade80" />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Live</span>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
        <KpiCard label="Pending"     value={counts.pending}          color="#f87171" icon={<AlertCircle size={14} />} />
        <KpiCard label="In Progress" value={counts.inProgress}       color="#f59e0b" icon={<Clock size={14} />} />
        <KpiCard label="Resolved"    value={counts.resolved}         color="#4ade80" icon={<CheckCircle2 size={14} />} />
        <KpiCard label="Total"       value={liveComplaints.length}   color="#a78bfa" icon={<MessageSquare size={14} />} />
      </div>

      {/* ── Filter bar ── */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'center',
        padding: '12px 16px', background: '#0d0d0d', border: '1px solid #1a1a1a',
        marginBottom: 16,
      }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
          <input
            type="text"
            placeholder="search by name, category or text..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', background: '#111', border: '1px solid #1f1f1f',
              padding: '8px 12px 8px 30px', color: '#ccc', fontSize: 12, outline: 'none',
              fontFamily: MONO, boxSizing: 'border-box',
            }}
          />
        </div>

        {/* Category pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
          <Filter size={12} color="#444" />
          {categories.map(cat => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '4px 10px',
                  border: `1px solid ${active ? 'rgba(245,158,11,0.4)' : '#1f1f1f'}`,
                  background: active ? 'rgba(245,158,11,0.1)' : 'transparent',
                  color: active ? '#f59e0b' : '#555',
                  fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  textTransform: 'uppercase', letterSpacing: '0.1em',
                  fontFamily: MONO,
                }}
              >{cat}</button>
            );
          })}
        </div>

        <span style={{ marginLeft: 'auto', fontSize: 10, color: '#444' }}>
          {filtered.length !== liveComplaints.length ? (
            <><span style={{ color: '#ccc', fontWeight: 700 }}>{filtered.length}</span> / {liveComplaints.length}</>
          ) : (
            <span style={{ color: '#ccc', fontWeight: 700 }}>{liveComplaints.length} complaints</span>
          )}
        </span>
      </div>

      {/* ── Grouped lists ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#333' }}>
          <Inbox size={36} style={{ margin: '0 auto 14px', opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>No complaints match your filters.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
  );
}
