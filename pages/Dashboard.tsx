import React, { useState } from 'react';
import {
  Users, ClipboardList, MessageSquare, Star,
  Clock, Sparkles, Loader2, BarChart2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import StatsCard from '../components/StatsCard';
import { Complaint, Activity, DailyStats } from '../types';
import { GoogleGenAI } from '@google/genai';

interface DashboardProps {
  liveAttendance: number;
  activeMealInfo: { meal: 'Breakfast' | 'Lunch' | 'Dinner'; isLive: boolean; isTomorrow?: boolean; date: string };
  complaintsCount: number;
  complaints: Complaint[];
  ratings: { averageRating?: number }[];
  usersCount: number;
  recentActivities: Activity[];
  dailyStats: DailyStats[];
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
}: DashboardProps) {
  const [aiInsights, setAiInsights]   = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const generateAiInsights = async () => {
    setIsAiLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.API_KEY;
      if (!apiKey) {
        setAiInsights('To enable AI insights, add VITE_GEMINI_API_KEY to your .env file.');
        return;
      }
      const ai = new GoogleGenAI({ apiKey });
      const complaintsSummary = complaints.slice(0, 5).map(c => c.complaintText).join('; ');
      const response = await ai.models.generateContent({
        model: 'gemini-1.5-flash',
        contents: `As a senior mess administrator, analyze these real-time metrics:
        - ${activeMealInfo.isLive ? `${activeMealInfo.meal} (Live)` : activeMealInfo.isTomorrow ? `Tomorrow's ${activeMealInfo.meal} RSVPs` : `Next ${activeMealInfo.meal} RSVPs`}: ${liveAttendance} / 600
        - Total Registered Users: ${usersCount}
        - Pending Complaints: ${complaintsCount}
        - Recent Feedback: ${complaintsSummary || 'No major issues reported.'}
        
        Provide 3 highly actionable bulleted insights for improving operations right now. Keep it brief.`,
      });
      setAiInsights(response.text);
    } catch {
      setAiInsights('AI analysis failed. Please check your Gemini API key.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const avgRating = (() => {
    const valid = ratings.filter(r => (r.averageRating ?? 0) > 0);
    return valid.length > 0
      ? (valid.reduce((s, r) => s + (r.averageRating ?? 0), 0) / valid.length).toFixed(1)
      : '--';
  })();

  const mealLabel = activeMealInfo.isLive
    ? `${activeMealInfo.meal} · Live`
    : activeMealInfo.isTomorrow
      ? `Tomorrow · ${activeMealInfo.meal}`
      : `Next · ${activeMealInfo.meal}`;

  return (
    <div className="space-y-8">

      {/* ── Page header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Overview
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            Real-time data from Firebase
          </p>
        </div>
        <button
          onClick={generateAiInsights}
          disabled={isAiLoading}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          {isAiLoading ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
          AI Insights
        </button>
      </div>

      {/* ── AI insights panel ── */}
      {aiInsights && (
        <div className="bg-indigo-50 dark:bg-indigo-950 border border-indigo-100 dark:border-indigo-900 rounded-xl p-5">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 text-sm font-semibold mb-2">
            <Sparkles size={14} /> Smart Analysis
          </div>
          <div className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed whitespace-pre-wrap">
            {aiInsights}
          </div>
        </div>
      )}

      {/* ── KPI grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title={mealLabel}
          value={`${liveAttendance} / 600`}
          icon={ClipboardList}
          color="indigo"
        />
        <StatsCard
          title="Pending Complaints"
          value={complaints.filter(c => c.status === 'Pending').length}
          icon={MessageSquare}
          color="rose"
        />
        <StatsCard
          title="Avg Rating"
          value={avgRating}
          icon={Star}
          color="amber"
        />
        <StatsCard
          title="Registered Users"
          value={usersCount}
          icon={Users}
          color="violet"
        />
      </div>

      {/* ── Charts + Activity feed ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Attendance trend chart */}
        <div className="xl:col-span-2 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-6 transition-colors">
          <h2 className="text-[13px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-6">
            Attendance · Last 7 Days
          </h2>
          <div className="h-64">
            {dailyStats.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="fillIndigo" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.15} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="currentColor"
                    className="text-zinc-100 dark:text-zinc-800"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-zinc-400"
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: 'currentColor' }}
                    className="text-zinc-400"
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'var(--tooltip-bg, #fff)',
                      border: '1px solid #e4e4e7',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="total"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#fillIndigo)"
                    dot={false}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700">
                <BarChart2 size={36} className="mb-2" />
                <p className="text-sm text-zinc-400">No attendance data yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity feed */}
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl flex flex-col overflow-hidden transition-colors">
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <h2 className="text-[13px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Recent Activity
            </h2>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-zinc-50 dark:divide-zinc-800/60">
            {recentActivities.length > 0 ? (
              recentActivities.map((activity) => (
                <div key={activity.id} className="flex items-start gap-3 px-5 py-3.5">
                  <div className={`mt-0.5 shrink-0 h-7 w-7 rounded-full flex items-center justify-center ${
                    activity.type === 'Complaint'
                      ? 'bg-rose-50 text-rose-500 dark:bg-rose-950 dark:text-rose-400'
                      : 'bg-amber-50 text-amber-500 dark:bg-amber-950 dark:text-amber-400'
                  }`}>
                    {activity.type === 'Complaint' ? <MessageSquare size={13} /> : <Star size={13} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                      {activity.userName}
                    </p>
                    <p className="text-[12px] text-zinc-400 truncate">{activity.detail}</p>
                    <p className="text-[10px] text-zinc-300 dark:text-zinc-600 mt-1 uppercase tracking-wider">
                      {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-zinc-300 dark:text-zinc-700 py-12">
                <Clock size={28} className="mb-2" />
                <p className="text-sm text-zinc-400">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
