import React, { useState } from 'react';
import { FileText, Download, BarChart2, MessageSquare, Star, Users } from 'lucide-react';
import { Complaint, Rating, User, DailyStats } from '../types';
import type { MealType } from '../types';

function escapeCsv(val: unknown): string {
  const s = String(val ?? '').replace(/"/g, '""');
  return `"${s}"`;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

interface ReportsProps {
  complaints: Complaint[];
  ratings: Rating[];
  users: User[];
  dailyStats: DailyStats[];
  attendanceByMeal: { Breakfast: number; Lunch: number; Dinner: number };
  activeMealInfo: { meal: MealType; isLive: boolean; isTomorrow?: boolean; date: string };
}

export default function Reports({
  complaints,
  ratings,
  users,
  dailyStats,
  attendanceByMeal,
  activeMealInfo,
}: ReportsProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const downloadCsv = (filename: string, rows: string[][]) => {
    const csv = rows.map(r => r.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAttendanceReport = () => {
    setDownloading('attendance');
    const headers = ['Date', 'Breakfast', 'Lunch', 'Dinner', 'Total'];
    const rows = [headers, ...dailyStats.map(d => [
      d.date, String(d.Breakfast ?? 0), String(d.Lunch ?? 0),
      String(d.Dinner ?? 0), String(d.total ?? 0),
    ])];
    if (rows.length === 1) {
      rows.push([
        activeMealInfo.date,
        String(attendanceByMeal.Breakfast),
        String(attendanceByMeal.Lunch),
        String(attendanceByMeal.Dinner),
        String(attendanceByMeal.Breakfast + attendanceByMeal.Lunch + attendanceByMeal.Dinner),
      ]);
    }
    downloadCsv(`attendance-summary-${todayStr()}.csv`, rows);
    setDownloading(null);
  };

  const handleFeedbackReport = () => {
    setDownloading('feedback');
    const headers = ['User', 'Email', 'Meal', 'Date', 'Overall', 'Staff', 'Hygiene', 'Items'];
    const rows = [headers, ...ratings.map(r => [
      r.userName, r.userEmail, r.mealName, r.mealDate,
      String(r.averageRating ?? ''), String(r.staffBehaviorRating ?? ''),
      String(r.hygieneRating ?? ''), JSON.stringify(r.itemRatings ?? {}),
    ])];
    downloadCsv(`feedback-analysis-${todayStr()}.csv`, rows);
    setDownloading(null);
  };

  const handleComplaintsReport = () => {
    setDownloading('complaints');
    const headers = ['User', 'Email', 'Category', 'Status', 'Description', 'Date'];
    const rows = [headers, ...complaints.map(c => [
      c.userName, c.userEmail, c.category, c.status,
      c.complaintText, new Date(c.timestamp).toISOString(),
    ])];
    downloadCsv(`complaints-log-${todayStr()}.csv`, rows);
    setDownloading(null);
  };

  const handleUsersReport = () => {
    setDownloading('users');
    const headers = ['Name', 'Email', 'Total RSVPs', 'Total Ratings', 'Total Complaints', 'Last Active'];
    const rows = [headers, ...users.map(u => [
      u.name, u.email,
      String(u.totalRSVPs), String(u.totalRatings), String(u.totalComplaints),
      u.lastActive,
    ])];
    downloadCsv(`users-export-${todayStr()}.csv`, rows);
    setDownloading(null);
  };

  const reports = [
    {
      id: 'attendance',
      icon: <BarChart2 size={16} />,
      title: 'Attendance Summary',
      desc: 'Daily breakdown for the last 7 days by meal type.',
      count: dailyStats.length,
      color: '#38bdf8',
      onDownload: handleAttendanceReport,
    },
    {
      id: 'feedback',
      icon: <Star size={16} />,
      title: 'Feedback Analysis',
      desc: 'Meal ratings including item scores, staff, and hygiene.',
      count: ratings.length,
      color: '#f59e0b',
      onDownload: handleFeedbackReport,
    },
    {
      id: 'complaints',
      icon: <MessageSquare size={16} />,
      title: 'Complaints Log',
      desc: 'All grievances with category, status, and resolution trail.',
      count: complaints.length,
      color: '#f87171',
      onDownload: handleComplaintsReport,
    },
    {
      id: 'users',
      icon: <Users size={16} />,
      title: 'User Export',
      desc: 'Full user registry with RSVP and activity statistics.',
      count: users.length,
      color: '#a78bfa',
      onDownload: handleUsersReport,
    },
  ];

  const summary = [
    { label: 'Users', value: users.length, color: '#38bdf8' },
    { label: 'Ratings', value: ratings.length, color: '#f59e0b' },
    { label: 'Complaints', value: complaints.length, color: '#f87171' },
    { label: 'Attendance Records', value: dailyStats.length, color: '#a78bfa' },
  ];

  return (
    <div
      style={{ fontFamily: "'Geist Mono', 'JetBrains Mono', 'Fira Code', monospace" }}
      className="space-y-4"
    >

      {/* ── Header ── */}
      <div className="flex items-start justify-between border-b border-[#1f1f1f] pb-4">
        <div>
          <div className="text-[10px] tracking-[0.3em] text-[#555] uppercase mb-1">Export</div>
          <h1 className="text-2xl text-[#e8e8e8] tracking-tight">Reports</h1>
        </div>
        <div className="text-[10px] text-[#444] tabular-nums">
          {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* ── Summary row ── */}
      <div className="grid grid-cols-4 gap-2">
        {summary.map(({ label, value, color }) => (
          <div key={label} className="border border-[#1a1a1a] bg-[#0d0d0d] p-4">
            <div className="text-[10px] tracking-[0.2em] text-[#555] uppercase mb-2">{label}</div>
            <div className="text-3xl font-bold tabular-nums leading-none" style={{ color }}>{value}</div>
          </div>
        ))}
      </div>

      {/* ── Report cards ── */}
      <div className="grid grid-cols-2 gap-2">
        {reports.map((r) => (
          <div key={r.id} className="border border-[#1a1a1a] bg-[#0d0d0d] p-5 flex flex-col gap-4 group hover:border-[#2a2a2a] transition-colors">

            {/* Top row */}
            <div className="flex items-start justify-between">
              <div
                className="p-2 border flex items-center justify-center"
                style={{ color: r.color, borderColor: `${r.color}25`, background: `${r.color}10` }}
              >
                {r.icon}
              </div>
              <span className="text-[9px] tracking-[0.2em] text-[#444] uppercase border border-[#1f1f1f] px-2 py-1">
                CSV
              </span>
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="text-[13px] text-[#ccc] mb-1.5">{r.title}</div>
              <div className="text-[11px] text-[#555] leading-relaxed">{r.desc}</div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-3 border-t border-[#111]">
              <span className="text-[10px] text-[#444] tabular-nums">{r.count} records</span>
              <button
                onClick={r.onDownload}
                disabled={downloading === r.id}
                className="flex items-center gap-2 px-3 py-2 text-[11px] tracking-[0.1em] uppercase font-bold transition-all disabled:opacity-40"
                style={{
                  color: r.color,
                  border: `1px solid ${r.color}30`,
                  background: `${r.color}10`,
                }}
              >
                <Download size={12} />
                {downloading === r.id ? 'Exporting...' : 'Download'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-[#111] pt-3 flex items-center justify-between">
        <span className="text-[9px] text-[#2a2a2a] tracking-widest uppercase">Firebase · Live Data</span>
        <span className="text-[9px] text-[#2a2a2a] tabular-nums">{todayStr()}</span>
      </div>
    </div>
  );
}
