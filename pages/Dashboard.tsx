import React, { useState } from 'react';
import {
  Users, MessageSquare, Star,
  BarChart2, TrendingUp,
  AlertCircle, CheckCircle2, ChevronRight,
  Utensils, ThumbsUp, ThumbsDown
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis,
  Tooltip, ResponsiveContainer, BarChart, Bar, Cell
} from 'recharts';
import { Complaint, Activity, DailyStats } from '../types';

interface DashboardProps {
  liveAttendance: number;
  activeMealInfo: { meal: 'Breakfast' | 'Lunch' | 'Dinner'; isLive: boolean; isTomorrow?: boolean; date: string };
  complaintsCount: number;
  complaints: Complaint[];
  ratings: { averageRating?: number }[];
  usersCount: number;
  recentActivities: Activity[];
  dailyStats: DailyStats[];
  onNavigate?: (page: string) => void;
}

const CAPACITY = 600;
const BAR_COLORS = ['#f59e0b', '#f97316', '#ef4444', '#a78bfa', '#38bdf8'];

function StatusBadge({ isLive }: { isLive: boolean }) {
  return isLive ? (
    <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[9px] tracking-[0.2em] uppercase px-2 py-0.5">
      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse" />
      Live
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 bg-zinc-800 border border-zinc-700 text-zinc-500 text-[9px] tracking-[0.2em] uppercase px-2 py-0.5">
      Upcoming
    </span>
  );
}

export default function Dashboard({
  liveAttendance,
  activeMealInfo,
  complaintsCount,
  complaints,
  ratings,
  usersCount,
  recentActivities,
  dailyStats,
  onNavigate,
}: DashboardProps) {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Complaint' | 'Rating'>('All');
  const [expandedComplaint, setExpandedComplaint] = useState<string | null>(null);

  const avgRating = (() => {
    const valid = ratings.filter(r => (r.averageRating ?? 0) > 0);
    return valid.length > 0
      ? (valid.reduce((s, r) => s + (r.averageRating ?? 0), 0) / valid.length).toFixed(1)
      : '--';
  })();

  const pendingCount = complaints.filter(c => c.status === 'Pending').length;
  const resolvedCount = complaints.filter(c => c.status !== 'Pending').length;
  const fillPct = Math.min(Math.round((liveAttendance / CAPACITY) * 100), 100);

  const filteredActivities = recentActivities.filter(a =>
    activeFilter === 'All' ? true : a.type === activeFilter
  );

  const mealIcon = { Breakfast: '🌅', Lunch: '☀️', Dinner: '🌙' }[activeMealInfo.meal] ?? '🍽️';

  const complaintBreakdown = (() => {
    const map: Record<string, number> = {};
    complaints.forEach(c => {
      const key = (c as any).category || 'Other';
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).slice(0, 5).map(([name, value]) => ({ name, value }));
  })();

  const kpis = [
    { label: 'Registered', value: usersCount, sub: 'users', icon: <Users size={11} />, color: '#38bdf8', page: 'users' },
    { label: 'Pending', value: pendingCount, sub: 'complaints', icon: <AlertCircle size={11} />, color: pendingCount > 0 ? '#ef4444' : '#22c55e', page: 'complaints' },
    { label: 'Resolved', value: resolvedCount, sub: 'complaints', icon: <CheckCircle2 size={11} />, color: '#22c55e', page: 'complaints' },
    { label: 'Avg Rating', value: avgRating, sub: 'out of 5', icon: <Star size={11} />, color: '#f59e0b', page: 'ratings' },
    { label: 'Total', value: complaints.length, sub: 'complaints', icon: <MessageSquare size={11} />, color: '#a78bfa', page: 'complaints' },
    { label: 'Seats Left', value: CAPACITY - liveAttendance, sub: 'available', icon: <Utensils size={11} />, color: '#f97316', page: 'attendance' },
    { label: 'Positive', value: ratings.filter(r => (r.averageRating ?? 0) >= 4).length, sub: 'reviews', icon: <ThumbsUp size={11} />, color: '#22c55e', page: 'ratings' },
    { label: 'Negative', value: ratings.filter(r => (r.averageRating ?? 0) > 0 && (r.averageRating ?? 0) < 3).length, sub: 'reviews', icon: <ThumbsDown size={11} />, color: '#ef4444', page: 'ratings' },
  ];

  return (
    <div
      style={{ fontFamily: "'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace" }}
      className="bg-[#080808] min-h-screen text-[#d4d4d4] p-4 space-y-3"
    >
      {/* ══ TOP BAR ══ */}
      <div className="flex items-center justify-between border-b border-[#1f1f1f] pb-3">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-[#3f3f3f] tracking-widest uppercase">MYMESS</span>
          <span className="text-[#2a2a2a]">/</span>
          <span className="text-[10px] text-[#888] tracking-widest uppercase">Overview</span>
        </div>
        <span className="text-[10px] text-[#444] tabular-nums">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* ══ ROW 1: MEAL HERO + KPI GRID ══ */}
      <div className="grid grid-cols-12 gap-2">

        {/* Meal hero */}
        <div
          onClick={() => onNavigate?.('attendance')}
          className="col-span-4 border border-[#1f1f1f] hover:border-[#f59e0b]/40 bg-[#0d0d0d] p-3 cursor-pointer group transition-all"
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-lg leading-none">{mealIcon}</span>
              <div>
                <div className="text-[9px] tracking-[0.2em] text-[#555] uppercase">{activeMealInfo.meal}</div>
                <div className="text-[9px] text-[#444]">{activeMealInfo.date}</div>
              </div>
            </div>
            <StatusBadge isLive={activeMealInfo.isLive} />
          </div>

          <div className="flex items-baseline gap-1 mb-2">
            <span className="text-3xl font-bold text-[#f0f0f0] tabular-nums leading-none">{liveAttendance}</span>
            <span className="text-sm text-[#444]">/{CAPACITY}</span>
          </div>

          <div className="flex gap-px mb-1">
            {Array.from({ length: 20 }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 transition-colors ${
                  i < Math.round(fillPct / 5)
                    ? fillPct > 85 ? 'bg-red-500' : fillPct > 60 ? 'bg-amber-400' : 'bg-emerald-500'
                    : 'bg-[#1a1a1a]'
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between">
            <span className="text-[9px] text-[#444]">{fillPct}% capacity</span>
            <span className="text-[9px] text-[#444] group-hover:text-[#f59e0b] flex items-center gap-0.5 transition-colors">
              View <ChevronRight size={8} />
            </span>
          </div>
        </div>

        {/* 8 KPI tiles */}
        <div className="col-span-8 grid grid-cols-4 grid-rows-2 gap-2">
          {kpis.map((kpi) => (
            <div
              key={kpi.label}
              onClick={() => onNavigate?.(kpi.page)}
              className="border border-[#1a1a1a] hover:border-[#2a2a2a] bg-[#0d0d0d] hover:bg-[#111] p-2.5 cursor-pointer group transition-all"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] text-[#444] uppercase tracking-widest">{kpi.label}</span>
                <span style={{ color: kpi.color }} className="opacity-50 group-hover:opacity-100 transition-opacity">
                  {kpi.icon}
                </span>
              </div>
              <div className="text-xl font-bold tabular-nums leading-none" style={{ color: kpi.color }}>
                {kpi.value}
              </div>
              <div className="text-[9px] text-[#333] mt-0.5">{kpi.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ══ ROW 2: CHART + BREAKDOWN + ACTIVITY ══ */}
      <div className="grid grid-cols-12 gap-2">

        {/* 7-day chart */}
        <div className="col-span-5 border border-[#1a1a1a] bg-[#0d0d0d] p-3">
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] tracking-[0.2em] text-[#555] uppercase flex items-center gap-1.5">
              <TrendingUp size={9} /> 7-Day Attendance
            </span>
            {dailyStats.length > 0 && (
              <span className="text-[9px] text-[#444] tabular-nums">
                avg {Math.round(dailyStats.reduce((s, d) => s + ((d as any).total || 0), 0) / dailyStats.length)}
              </span>
            )}
          </div>
          <div className="h-36">
            {dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats} margin={{ top: 2, right: 0, left: -32, bottom: 0 }}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" tick={{ fontSize: 8, fill: '#444', fontFamily: 'inherit' }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 8, fill: '#444', fontFamily: 'inherit' }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', borderRadius: 0, fontSize: 10, fontFamily: 'inherit', color: '#ccc' }} cursor={{ stroke: '#2a2a2a' }} />
                  <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={1.5} fill="url(#g1)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center">
                <span className="text-[10px] text-[#333]">No data yet</span>
              </div>
            )}
          </div>
        </div>

        {/* Complaint breakdown */}
        <div
          onClick={() => onNavigate?.('complaints')}
          className="col-span-3 border border-[#1a1a1a] hover:border-[#2a2a2a] bg-[#0d0d0d] p-3 cursor-pointer group transition-all"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-[9px] tracking-[0.2em] text-[#555] uppercase">By Category</span>
            <ChevronRight size={9} className="text-[#333] group-hover:text-[#f59e0b] transition-colors" />
          </div>
          {complaintBreakdown.length > 0 ? (
            <>
              <div className="h-24 mb-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={complaintBreakdown} margin={{ top: 0, right: 0, left: -32, bottom: 0 }}>
                    <XAxis dataKey="name" tick={{ fontSize: 7, fill: '#444', fontFamily: 'inherit' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 7, fill: '#444', fontFamily: 'inherit' }} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#111', border: '1px solid #222', fontSize: 9, fontFamily: 'inherit', color: '#ccc' }} cursor={{ fill: '#ffffff06' }} />
                    <Bar dataKey="value" radius={0}>
                      {complaintBreakdown.map((_, i) => <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1">
                {complaintBreakdown.slice(0, 3).map((c, i) => (
                  <div key={c.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: BAR_COLORS[i] }} />
                      <span className="text-[9px] text-[#555] truncate max-w-[80px]">{c.name}</span>
                    </div>
                    <span className="text-[9px] tabular-nums" style={{ color: BAR_COLORS[i] }}>{c.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center py-8">
              <span className="text-[10px] text-[#333]">No complaints</span>
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="col-span-4 border border-[#1a1a1a] bg-[#0d0d0d] flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[#1a1a1a]">
            <span className="text-[9px] tracking-[0.2em] text-[#555] uppercase flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Activity
            </span>
            <div className="flex gap-1">
              {(['All', 'Complaint', 'Rating'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`text-[8px] px-1.5 py-0.5 tracking-wide uppercase transition-colors ${
                    activeFilter === f ? 'bg-[#f59e0b] text-black font-bold' : 'text-[#444] hover:text-[#888]'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto divide-y divide-[#111] max-h-52">
            {filteredActivities.length > 0 ? (
              filteredActivities.map((activity) => (
                <div
                  key={activity.id}
                  onClick={() => onNavigate?.(activity.type === 'Complaint' ? 'complaints' : 'ratings')}
                  className="flex items-start gap-2 px-3 py-2 hover:bg-[#111] cursor-pointer transition-colors"
                >
                  <span className={`text-[10px] mt-0.5 shrink-0 font-bold ${activity.type === 'Complaint' ? 'text-red-500' : 'text-amber-400'}`}>
                    {activity.type === 'Complaint' ? '!' : '★'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1">
                      <span className="text-[11px] text-[#ccc] truncate">{activity.userName}</span>
                      <span className="text-[9px] text-[#333] shrink-0 tabular-nums">
                        {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <span className="text-[10px] text-[#555] truncate block">{activity.detail}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center py-10">
                <span className="text-[10px] text-[#333]">No activity</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ══ ROW 3: PENDING COMPLAINTS INLINE ══ */}
      {pendingCount > 0 && (
        <div className="border border-red-900/30 bg-red-950/10">
          <div className="flex items-center justify-between px-3 py-2 border-b border-red-900/20">
            <span className="text-[9px] tracking-[0.2em] text-red-500/70 uppercase flex items-center gap-1.5">
              <AlertCircle size={9} /> {pendingCount} Pending
            </span>
            <button
              onClick={() => onNavigate?.('complaints')}
              className="text-[9px] text-[#444] hover:text-[#f59e0b] uppercase tracking-widest flex items-center gap-1 transition-colors"
            >
              View all <ChevronRight size={8} />
            </button>
          </div>
          <div className="divide-y divide-red-900/10">
            {complaints.filter(c => c.status === 'Pending').slice(0, 3).map(c => (
              <div
                key={(c as any).id || c.complaintText}
                onClick={() => setExpandedComplaint(expandedComplaint === (c as any).id ? null : (c as any).id)}
                className="flex items-start justify-between gap-3 px-3 py-2 hover:bg-red-950/20 cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#888]">{(c as any).userName || 'Anonymous'}</span>
                    {(c as any).category && (
                      <span className="text-[8px] border border-[#2a2a2a] text-[#555] px-1.5 py-0.5 uppercase tracking-wide">
                        {(c as any).category}
                      </span>
                    )}
                  </div>
                  <p className={`text-[10px] text-[#555] mt-0.5 ${expandedComplaint === (c as any).id ? '' : 'truncate'}`}>
                    {c.complaintText}
                  </p>
                </div>
                <span className="text-[8px] text-red-500/50 uppercase shrink-0 tracking-wide">Pending</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ══ FOOTER ══ */}
      <div className="flex items-center justify-between pt-1 border-t border-[#111]">
        <span className="text-[8px] text-[#2a2a2a] tracking-widest uppercase">Firebase · Realtime</span>
        <span className="text-[8px] text-[#2a2a2a] tabular-nums">{new Date().toLocaleDateString()}</span>
      </div>
    </div>
  );
}
