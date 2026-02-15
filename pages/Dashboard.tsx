
import React, { useState } from 'react';
import { Users, ClipboardList, MessageSquare, Star, Clock, Sparkles, Loader2, BarChart2 } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import StatsCard from '../components/StatsCard';
import { Complaint, Activity, DailyStats } from '../types';
import { GoogleGenAI } from "@google/genai";

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
  dailyStats 
}: DashboardProps) {
  const [aiInsights, setAiInsights] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const generateAiInsights = async () => {
    setIsAiLoading(true);
    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.API_KEY;
      if (!apiKey) {
        setAiInsights("To enable AI insights, add VITE_GEMINI_API_KEY to your .env file.");
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
        - Recent Feedback: ${complaintsSummary || "No major issues reported."}
        
        Provide 3 highly actionable bulleted insights for improving operations right now. Keep it brief.`,
      });
      setAiInsights(response.text);
    } catch (err) {
      setAiInsights("AI analysis failed. Please check your Gemini API key.");
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Live Dashboard</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Real-time monitoring from your Firebase database.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={generateAiInsights}
            disabled={isAiLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 disabled:opacity-50"
          >
            {isAiLoading ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
            AI Insights
          </button>
        </div>
      </div>

      {aiInsights && (
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 p-6 rounded-2xl animate-in zoom-in-95 duration-300">
          <div className="flex items-center gap-2 text-indigo-700 dark:text-indigo-400 font-bold mb-3">
            <Sparkles size={18} /> Smart Analysis
          </div>
          <div className="text-sm text-indigo-800 dark:text-indigo-300 leading-relaxed whitespace-pre-wrap">
            {aiInsights}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard 
          title={activeMealInfo.isLive ? `${activeMealInfo.meal} (Live)` : activeMealInfo.isTomorrow ? `Tomorrow's ${activeMealInfo.meal}` : `Next: ${activeMealInfo.meal}`}
          value={`${liveAttendance}/600`} 
          icon={ClipboardList} 
          color="blue"
        />
        <StatsCard 
          title="Pending Complaints" 
          value={complaints.filter(c => c.status === 'Pending').length} 
          icon={MessageSquare} 
          color="red"
        />
        <StatsCard 
          title="Daily Average Rating" 
          value={(() => {
            const valid = ratings.filter(r => (r.averageRating ?? 0) > 0);
            return valid.length > 0 
              ? (valid.reduce((s, r) => s + (r.averageRating ?? 0), 0) / valid.length).toFixed(1) 
              : '--';
          })()} 
          icon={Star} 
          color="yellow"
        />
        <StatsCard 
          title="Total Registered" 
          value={usersCount} 
          icon={Users} 
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm transition-colors">
          <h2 className="text-lg font-bold mb-6 dark:text-white">Attendance Trend (Last 7 Days)</h2>
          <div className="h-[300px] flex flex-col items-center justify-center">
            {dailyStats.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyStats}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-slate-400">
                <BarChart2 size={48} className="mx-auto mb-2 opacity-20" />
                <p>No historical attendance data yet.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow-sm flex flex-col transition-colors max-h-[700px]">
          <div className="p-6 border-b dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-lg font-bold dark:text-white">Recent Activity</h2>
            <div className="w-2 h-2 rounded-full bg-blue-500 pulse-green" />
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {recentActivities.length > 0 ? recentActivities.map((activity) => (
              <div key={activity.id} className="flex gap-4 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${
                  activity.type === 'Complaint' 
                    ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400' 
                    : 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/40 dark:text-yellow-400'
                }`}>
                  {activity.type === 'Complaint' ? <MessageSquare size={18} /> : <Star size={18} />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate dark:text-slate-200">{activity.userName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">{activity.detail}</p>
                  <p className="text-[10px] font-medium text-slate-400 mt-2 uppercase tracking-wider">
                    {new Date(activity.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 py-12">
                <Clock size={32} className="mb-2 opacity-20" />
                <p className="text-sm">No recent activities.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
