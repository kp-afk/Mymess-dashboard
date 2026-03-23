import React, { useState, useMemo, useCallback } from 'react';
import {
  Search, CheckCircle2, AlertCircle, Clock, Database,
  ChevronDown, X, Filter, Inbox, Calendar, User,
  Receipt, ThumbsUp, ThumbsDown, MessageSquare
} from 'lucide-react';
import { db } from '../lib/firebase';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RebateStatus = 'Pending' | 'Approved' | 'Rejected';

export interface Rebate {
  id: string;
  userName: string;
  userEmail: string;
  userId: string;
  startDate: any;   // Firestore Timestamp or number
  endDate: any;
  reason: string;
  totalDays: number;
  status: RebateStatus;
  managerNote: string | null;
  timestamp: any;
  updatedAt: any;
}

interface RebatesProps { liveRebates: Rebate[] }

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_ORDER: RebateStatus[] = ['Pending', 'Approved', 'Rejected'];

const STATUS_CONFIG: Record<RebateStatus, {
  color: string; bg: string; border: string;
  icon: React.ReactNode; accent: string;
}> = {
  'Pending':  { color: '#f87171', bg: 'rgba(248,113,113,0.08)', border: 'rgba(248,113,113,0.2)',  accent: '#ef4444', icon: <AlertCircle size={13} /> },
  'Approved': { color: '#4ade80', bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.2)',  accent: '#22c55e', icon: <CheckCircle2 size={13} /> },
  'Rejected': { color: '#f87171', bg: 'rgba(248,113,113,0.06)', border: 'rgba(248,113,113,0.15)', accent: '#ef4444', icon: <X size={13} /> },
};

const MONO = "'Geist Mono','JetBrains Mono','Fira Code',monospace";

// ── Helpers ───────────────────────────────────────────────────────────────────

function toDate(ts: any): Date | null {
  if (!ts) return null;
  if (ts?.toDate) return ts.toDate();
  if (typeof ts === 'number') return new Date(ts);
  if (ts instanceof Date) return ts;
  return null;
}

function formatDate(ts: any): string {
  const d = toDate(ts);
  if (!d) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function timeAgo(ts: any): string {
  const d = toDate(ts);
  if (!d) return '';
  const diff = Date.now() - d.getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

async function processRebate(
  id: string,
  decision: 'Approved' | 'Rejected',
  note: string
): Promise<void> {
  await db.collection('rebates').doc(id).update({
    status: decision,
    managerNote: note.trim() || null,
    updatedAt: new Date(),
  });
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: RebateStatus }) {
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

// ── KPI Card ──────────────────────────────────────────────────────────────────

function KpiCard({ label, value, color, icon }: {
  label: string; value: number; color: string; icon: React.ReactNode
}) {
  return (
    <div style={{
      background: '#0d0d0d', border: '1px solid #1a1a1a',
      padding: '16px 20px', fontFamily: MONO,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <span style={{ fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#555' }}>{label}</span>
        <span style={{ color, opacity: 0.6 }}>{icon}</span>
      </div>
      <div style={{ fontSize: 28, fontWeight: 700, color, lineHeight: 1 }}>{value}</div>
    </div>
  );
}

// ── Decision Modal ────────────────────────────────────────────────────────────

function DecisionModal({ rebate, decision, onConfirm, onCancel }: {
  rebate: Rebate;
  decision: 'Approved' | 'Rejected';
  onConfirm: (note: string) => Promise<void>;
  onCancel: () => void;
}) {
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const isApprove = decision === 'Approved';
  const accentColor = isApprove ? '#4ade80' : '#f87171';
  const accentBg    = isApprove ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)';
  const accentBorder = isApprove ? 'rgba(74,222,128,0.3)' : 'rgba(248,113,113,0.3)';

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm(note);
    setLoading(false);
  };

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
          background: '#0d0d0d', width: '100%', maxWidth: 460,
          border: `1px solid ${accentBorder}`,
          boxShadow: '0 24px 48px rgba(0,0,0,0.8)',
          fontFamily: MONO, overflow: 'hidden',
        }}
      >
        <div style={{ height: 2, background: `linear-gradient(90deg, ${accentColor}, transparent)` }} />
        <div style={{ padding: '24px' }}>

          {/* Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
            <div style={{
              width: 36, height: 36, flexShrink: 0, background: accentBg,
              border: `1px solid ${accentBorder}`, display: 'flex', alignItems: 'center',
              justifyContent: 'center', color: accentColor,
            }}>
              {isApprove ? <ThumbsUp size={16} /> : <ThumbsDown size={16} />}
            </div>
            <div>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#e8e8e8', margin: '0 0 2px' }}>
                {isApprove ? 'Approve Rebate?' : 'Reject Rebate?'}
              </p>
              <p style={{ fontSize: 11, color: '#555', margin: 0 }}>
                {isApprove ? 'Student will be notified of approval.' : 'Provide a reason for rejection.'}
              </p>
            </div>
          </div>

          {/* Rebate summary */}
          <div style={{ background: '#111', border: '1px solid #1f1f1f', padding: '12px 14px', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#ccc' }}>{rebate.userName}</span>
              <span style={{
                fontSize: 10, fontWeight: 700, padding: '2px 8px',
                background: 'rgba(167,139,250,0.1)', color: '#a78bfa',
                border: '1px solid rgba(167,139,250,0.2)',
              }}>
                {rebate.totalDays}d
              </span>
            </div>
            <p style={{ fontSize: 10, color: '#555', margin: '0 0 6px' }}>{rebate.userEmail}</p>
            <div style={{ display: 'flex', gap: 12, fontSize: 10, color: '#666' }}>
              <span><Calendar size={9} style={{ display: 'inline', marginRight: 4 }} />
                {formatDate(rebate.startDate)} → {formatDate(rebate.endDate)}
              </span>
            </div>
            <p style={{ fontSize: 11, color: '#666', margin: '8px 0 0', lineHeight: 1.6 }}>
              {rebate.reason}
            </p>
          </div>

          {/* Manager note */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ fontSize: 10, color: '#555', letterSpacing: '0.15em', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>
              Manager Note {isApprove ? '(optional)' : '(recommended)'}
            </label>
            <textarea
              rows={3}
              placeholder={isApprove ? 'Add any note for the student...' : 'State the reason for rejection...'}
              value={note}
              onChange={e => setNote(e.target.value)}
              style={{
                width: '100%', background: '#111', border: '1px solid #1f1f1f',
                padding: '8px 12px', color: '#ccc', fontSize: 12, outline: 'none',
                fontFamily: MONO, resize: 'vertical', boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Actions */}
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
              onClick={handleConfirm}
              disabled={loading}
              style={{
                flex: 1, padding: '10px 0',
                background: accentBg, border: `1px solid ${accentBorder}`,
                color: accentColor, fontSize: 12, fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.5 : 1,
                fontFamily: MONO, letterSpacing: '0.1em', textTransform: 'uppercase',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              {isApprove ? <ThumbsUp size={12} /> : <ThumbsDown size={12} />}
              {loading ? 'Processing…' : (isApprove ? 'Approve' : 'Reject')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

// ── Rebate Card ───────────────────────────────────────────────────────────────

function RebateCard({ rebate, onDecision }: {
  rebate: Rebate;
  onDecision: (id: string, decision: 'Approved' | 'Rejected', note: string) => Promise<void>;
}) {
  const [expanded, setExpanded] = useState(false);
  const [modal, setModal] = useState<'Approved' | 'Rejected' | null>(null);
  const cfg = STATUS_CONFIG[rebate.status];

  const handleDecision = async (note: string) => {
    if (!modal) return;
    await onDecision(rebate.id, modal, note);
    setModal(null);
  };

  return (
    <>
      <div style={{
        background: '#0a0a0a', border: `1px solid #1a1a1a`,
        borderLeft: `3px solid ${cfg.accent}`,
        transition: 'border-color 0.15s',
      }}>
        {/* Summary row */}
        <button
          onClick={() => setExpanded(v => !v)}
          style={{
            width: '100%', background: 'transparent', border: 'none', cursor: 'pointer',
            padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12,
            fontFamily: MONO, textAlign: 'left',
          }}
        >
          {/* Avatar */}
          <div style={{
            width: 30, height: 30, flexShrink: 0, background: 'rgba(167,139,250,0.1)',
            border: '1px solid rgba(167,139,250,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#a78bfa', fontWeight: 700, fontSize: 12,
          }}>
            {rebate.userName?.charAt(0)?.toUpperCase() ?? '?'}
          </div>

          {/* Name + email */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#d4d4d4', marginBottom: 1 }}>
              {rebate.userName}
            </div>
            <div style={{ fontSize: 10, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {rebate.userEmail}
            </div>
          </div>

          {/* Days pill */}
          <span style={{
            fontSize: 11, fontWeight: 700, padding: '2px 10px',
            background: 'rgba(167,139,250,0.1)', color: '#a78bfa',
            border: '1px solid rgba(167,139,250,0.2)',
            whiteSpace: 'nowrap',
          }}>
            {rebate.totalDays} day{rebate.totalDays !== 1 ? 's' : ''}
          </span>

          {/* Date range */}
          <div style={{ fontSize: 10, color: '#555', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Calendar size={9} />
            {formatDate(rebate.startDate)} → {formatDate(rebate.endDate)}
          </div>

          {/* Status */}
          <StatusBadge status={rebate.status} />

          {/* Time */}
          <span style={{ fontSize: 10, color: '#444', whiteSpace: 'nowrap' }}>
            {timeAgo(rebate.timestamp)}
          </span>

          {/* Chevron */}
          <ChevronDown
            size={13} color="#555"
            style={{ flexShrink: 0, transition: 'transform 0.2s', transform: expanded ? 'rotate(180deg)' : 'none' }}
          />
        </button>

        {/* Expanded detail */}
        {expanded && (
          <div style={{
            borderTop: '1px solid #151515', padding: '14px 14px 14px 58px',
            display: 'flex', flexDirection: 'column', gap: 12,
          }}>
            {/* Reason */}
            <div>
              <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#444', marginBottom: 5 }}>
                Reason
              </div>
              <p style={{ fontSize: 12, color: '#888', margin: 0, lineHeight: 1.7 }}>
                {rebate.reason}
              </p>
            </div>

            {/* Manager note (if exists) */}
            {rebate.managerNote && (
              <div style={{ background: '#111', border: '1px solid #1f1f1f', padding: '10px 12px' }}>
                <div style={{ fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#444', marginBottom: 4 }}>
                  Manager Note
                </div>
                <p style={{ fontSize: 12, color: '#888', margin: 0, lineHeight: 1.6 }}>
                  {rebate.managerNote}
                </p>
              </div>
            )}

            {/* Action buttons (only for Pending) */}
            {rebate.status === 'Pending' && (
              <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
                <button
                  onClick={e => { e.stopPropagation(); setModal('Approved'); }}
                  style={{
                    padding: '7px 16px', background: 'rgba(74,222,128,0.08)',
                    border: '1px solid rgba(74,222,128,0.25)', color: '#4ade80',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    fontFamily: MONO, letterSpacing: '0.1em', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <ThumbsUp size={11} /> Approve
                </button>
                <button
                  onClick={e => { e.stopPropagation(); setModal('Rejected'); }}
                  style={{
                    padding: '7px 16px', background: 'rgba(248,113,113,0.06)',
                    border: '1px solid rgba(248,113,113,0.2)', color: '#f87171',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    fontFamily: MONO, letterSpacing: '0.1em', textTransform: 'uppercase',
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}
                >
                  <ThumbsDown size={11} /> Reject
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Decision modal */}
      {modal && (
        <DecisionModal
          rebate={rebate}
          decision={modal}
          onConfirm={handleDecision}
          onCancel={() => setModal(null)}
        />
      )}
    </>
  );
}

// ── Status Group ──────────────────────────────────────────────────────────────

function StatusGroup({ status, rebates, onDecision, defaultOpen }: {
  status: RebateStatus;
  rebates: Rebate[];
  onDecision: (id: string, decision: 'Approved' | 'Rejected', note: string) => Promise<void>;
  defaultOpen: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const cfg = STATUS_CONFIG[status];

  return (
    <div style={{ border: '1px solid #1a1a1a', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          width: '100%', background: '#0d0d0d', border: 'none', cursor: 'pointer',
          padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10,
          fontFamily: MONO, textAlign: 'left',
        }}
      >
        <span style={{ color: cfg.color, display: 'flex', alignItems: 'center' }}>{cfg.icon}</span>
        <span style={{
          fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em',
          color: cfg.color,
        }}>{status}</span>
        <span style={{
          fontSize: 10, fontWeight: 700, padding: '2px 8px',
          background: `${cfg.color}12`, color: cfg.color, border: `1px solid ${cfg.border}`,
          fontFamily: MONO, letterSpacing: '0.1em',
        }}>
          {rebates.length}
        </span>
        <ChevronDown
          size={14} color="#555"
          style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      {open && (
        <div style={{ padding: '0 10px 10px', display: 'flex', flexDirection: 'column', gap: 6, background: '#080808' }}>
          {rebates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 0', color: '#333', fontSize: 11 }}>
              No {status.toLowerCase()} rebates.
            </div>
          ) : (
            rebates.map(r => (
              <RebateCard key={r.id} rebate={r} onDecision={onDecision} />
            ))
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Rebates({ liveRebates }: RebatesProps) {
  const [search, setSearch] = useState('');

  const handleDecision = useCallback(async (
    id: string, decision: 'Approved' | 'Rejected', note: string
  ) => {
    await processRebate(id, decision, note);
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    if (!q) return liveRebates;
    return liveRebates.filter(r =>
      r.userName?.toLowerCase().includes(q) ||
      r.userEmail?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q)
    );
  }, [liveRebates, search]);

  const grouped = useMemo(() => {
    const map: Record<RebateStatus, Rebate[]> = { Pending: [], Approved: [], Rejected: [] };
    for (const r of filtered) {
      if (map[r.status as RebateStatus]) map[r.status as RebateStatus].push(r);
    }
    // Pending: oldest first (needs action soonest)
    map['Pending'].sort((a, b) => (toDate(a.timestamp)?.getTime() ?? 0) - (toDate(b.timestamp)?.getTime() ?? 0));
    map['Approved'].sort((a, b) => (toDate(b.updatedAt)?.getTime() ?? 0) - (toDate(a.updatedAt)?.getTime() ?? 0));
    map['Rejected'].sort((a, b) => (toDate(b.updatedAt)?.getTime() ?? 0) - (toDate(a.updatedAt)?.getTime() ?? 0));
    return map;
  }, [filtered]);

  const counts = useMemo(() => ({
    pending:  liveRebates.filter(r => r.status === 'Pending').length,
    approved: liveRebates.filter(r => r.status === 'Approved').length,
    rejected: liveRebates.filter(r => r.status === 'Rejected').length,
    totalDays: liveRebates.filter(r => r.status === 'Approved').reduce((s, r) => s + (r.totalDays ?? 0), 0),
  }), [liveRebates]);

  const approvalRate = liveRebates.length
    ? Math.round(((counts.approved) / liveRebates.length) * 100) : 0;

  return (
    <div style={{ fontFamily: MONO, color: '#d4d4d4' }}>

      {/* ── Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid #1f1f1f',
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.3em', textTransform: 'uppercase', color: '#555', marginBottom: 4 }}>
            Leave Management
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: '#e8e8e8', margin: 0, letterSpacing: '-0.01em' }}>
            Rebates
          </h1>
          <p style={{ fontSize: 11, color: '#555', margin: '4px 0 0' }}>
            {liveRebates.length} total ·&nbsp;
            <span style={{ color: approvalRate >= 70 ? '#4ade80' : approvalRate >= 40 ? '#f59e0b' : '#f87171', fontWeight: 700 }}>
              {approvalRate}%
            </span>
            &nbsp;approval rate · {counts.totalDays} days approved
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', background: 'rgba(74,222,128,0.06)', border: '1px solid rgba(74,222,128,0.15)' }}>
          <Database size={11} color="#4ade80" />
          <span style={{ fontSize: 10, fontWeight: 700, color: '#4ade80', letterSpacing: '0.2em', textTransform: 'uppercase' }}>Live</span>
        </div>
      </div>

      {/* ── KPIs ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 20 }}>
        <KpiCard label="Pending"       value={counts.pending}   color="#f87171" icon={<AlertCircle size={14} />} />
        <KpiCard label="Approved"      value={counts.approved}  color="#4ade80" icon={<ThumbsUp size={14} />} />
        <KpiCard label="Rejected"      value={counts.rejected}  color="#f87171" icon={<ThumbsDown size={14} />} />
        <KpiCard label="Days Approved" value={counts.totalDays} color="#a78bfa" icon={<Calendar size={14} />} />
      </div>

      {/* ── Search bar ── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', background: '#0d0d0d', border: '1px solid #1a1a1a',
        marginBottom: 16,
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#444' }} />
          <input
            type="text"
            placeholder="search by name, email or reason..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', background: '#111', border: '1px solid #1f1f1f',
              padding: '8px 12px 8px 30px', color: '#ccc', fontSize: 12, outline: 'none',
              fontFamily: MONO, boxSizing: 'border-box',
            }}
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch('')}
            style={{ background: 'none', border: 'none', color: '#555', cursor: 'pointer', padding: 4 }}
          >
            <X size={14} />
          </button>
        )}
        <span style={{ fontSize: 10, color: '#444', whiteSpace: 'nowrap' }}>
          {filtered.length !== liveRebates.length ? (
            <><span style={{ color: '#ccc', fontWeight: 700 }}>{filtered.length}</span> / {liveRebates.length}</>
          ) : (
            <span style={{ color: '#ccc', fontWeight: 700 }}>{liveRebates.length} rebates</span>
          )}
        </span>
      </div>

      {/* ── Grouped lists ── */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: '#333' }}>
          <Inbox size={36} style={{ margin: '0 auto 14px', opacity: 0.3 }} />
          <p style={{ fontSize: 13 }}>No rebates match your search.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {STATUS_ORDER.map(status => (
            <StatusGroup
              key={status}
              status={status}
              rebates={grouped[status]}
              onDecision={handleDecision}
              defaultOpen={status === 'Pending'}
            />
          ))}
        </div>
      )}
    </div>
  );
}
