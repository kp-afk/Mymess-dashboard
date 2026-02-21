import React, { useState } from 'react';
import { FileText, Download, BarChart2, MessageSquare, Star } from 'lucide-react';
import { Complaint, Rating, User, DailyStats } from '../types';
import type { MealType } from '../types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function escapeCsv(val: unknown): string {
  const s = String(val ?? '').replace(/"/g, '""');
  return `"${s}"`;
}

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface ReportsProps {
  complaints: Complaint[];
  ratings: Rating[];
  users: User[];
  dailyStats: DailyStats[];
  attendanceByMeal: { Breakfast: number; Lunch: number; Dinner: number };
  activeMealInfo: { meal: MealType; isLive: boolean; isTomorrow?: boolean; date: string };
}

// ─── Report card ─────────────────────────────────────────────────────────────

interface ReportCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  badge: string;
  count: number;
  loading: boolean;
  onDownload: () => void;
}

function ReportCard({ icon, title, desc, badge, count, loading, onDownload }: ReportCardProps) {
  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 flex flex-col gap-4 transition-colors">
      <div className="flex items-start justify-between">
        <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950 rounded-lg text-indigo-600 dark:text-indigo-400">
          {icon}
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400 bg-zinc-50 dark:bg-zinc-800 border border-zinc-100 dark:border-zinc-700 px-2 py-0.5 rounded">
          {badge}
        </span>
      </div>

      <div className="flex-1">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>
        <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{desc}</p>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-zinc-50 dark:border-zinc-800">
        <span className="text-xs text-zinc-400">{count} records</span>
        <button
          onClick={onDownload}
          disabled={loading}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
        >
          <Download size={13} />
          {loading ? 'Exporting…' : 'Download'}
        </button>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────

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
    const csv  = rows.map(r => r.map(escapeCsv).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleAttendanceReport = () => {
    setDownloading('attendance');
    const headers = ['Date', 'Breakfast', 'Lunch', 'Dinner', 'Total'];
    const rows    = [headers, ...dailyStats.map(d => [
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
    const rows    = [headers, ...ratings.map(r => [
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
    const rows    = [headers, ...complaints.map(c => [
      c.userName, c.userEmail, c.category, c.status,
      c.complaintText, new Date(c.timestamp).toISOString(),
    ])];
    downloadCsv(`complaints-log-${todayStr()}.csv`, rows);
    setDownloading(null);
  };

  const handleUsersReport = () => {
    setDownloading('users');
    const headers = ['Name', 'Email', 'Total RSVPs', 'Total Ratings', 'Total Complaints', 'Last Active'];
    const rows    = [headers, ...users.map(u => [
      u.name, u.email,
      String(u.totalRSVPs), String(u.totalRatings), String(u.totalComplaints),
      u.lastActive,
    ])];
    downloadCsv(`users-export-${todayStr()}.csv`, rows);
    setDownloading(null);
  };

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Reports
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
          Export live Firebase data as CSV
        </p>
      </div>

      {/* ── Report cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ReportCard
          icon={<BarChart2 size={18} />}
          title="Attendance Summary"
          desc="Daily breakdown for the last 7 days by meal type."
          badge="CSV"
          count={dailyStats.length}
          loading={downloading === 'attendance'}
          onDownload={handleAttendanceReport}
        />
        <ReportCard
          icon={<Star size={18} />}
          title="Feedback Analysis"
          desc="Meal ratings including item scores, staff, and hygiene."
          badge="CSV"
          count={ratings.length}
          loading={downloading === 'feedback'}
          onDownload={handleFeedbackReport}
        />
        <ReportCard
          icon={<MessageSquare size={18} />}
          title="Complaints Log"
          desc="All grievances with category, status, and resolution trail."
          badge="CSV"
          count={complaints.length}
          loading={downloading === 'complaints'}
          onDownload={handleComplaintsReport}
        />
        <ReportCard
          icon={<FileText size={18} />}
          title="User Export"
          desc="Full user registry with RSVP and activity statistics."
          badge="CSV"
          count={users.length}
          loading={downloading === 'users'}
          onDownload={handleUsersReport}
        />
      </div>

      {/* ── Summary stats ── */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-6 transition-colors">
        <h2 className="text-[13px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-4">
          Data Summary
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Users',              value: users.length       },
            { label: 'Ratings',            value: ratings.length     },
            { label: 'Complaints',         value: complaints.length  },
            { label: 'Attendance Records', value: dailyStats.length  },
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-1">{label}</p>
              <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{value}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
