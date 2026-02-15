
import React, { useState } from 'react';
import { FileText, Download, Calendar, Mail, Share2, Clock, CheckCircle } from 'lucide-react';
import { Complaint, Rating, User, DailyStats } from '../types';
import type { MealType } from '../types';

function escapeCsv(val: unknown): string {
  const s = String(val ?? '').replace(/"/g, '""');
  return `"${s}"`;
}

interface ReportsProps {
  complaints: Complaint[];
  ratings: Rating[];
  users: User[];
  dailyStats: DailyStats[];
  attendanceByMeal: { Breakfast: number; Lunch: number; Dinner: number };
   activeMealInfo: { meal: MealType; isLive: boolean; isTomorrow?: boolean; date: string };
}

const ReportItem = ({ title, desc, type, onDownload }: { title: string, desc: string, type: string, onDownload: () => void }) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 hover:border-blue-500 transition-all group shadow-sm">
    <div className="flex items-start justify-between mb-4">
       <div className="p-3 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
          <FileText size={24} />
       </div>
       <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{type}</span>
    </div>
    <h3 className="font-bold text-lg dark:text-white">{title}</h3>
    <p className="text-slate-500 text-sm mt-1">{desc}</p>
    <div className="mt-6 flex gap-2">
       <button onClick={onDownload} className="flex-1 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-95 transition-all">
          <Download size={16} /> Download
       </button>
    </div>
  </div>
);

export default function Reports({ complaints, ratings, users, dailyStats, attendanceByMeal }: ReportsProps) {
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
    const rows = [headers, ...dailyStats.map(d => [d.date, String(d.Breakfast ?? 0), String(d.Lunch ?? 0), String(d.Dinner ?? 0), String(d.total ?? 0)])];
    if (rows.length === 1) {
      // If there is no historical chart data yet, fall back to the RSVP-active date
      // (current meal if ongoing, else the next upcoming meal date).
      const activeDate = activeMealInfo.date;
      rows.push([
        activeDate,
        String(attendanceByMeal.Breakfast),
        String(attendanceByMeal.Lunch),
        String(attendanceByMeal.Dinner),
        String(attendanceByMeal.Breakfast + attendanceByMeal.Lunch + attendanceByMeal.Dinner)
      ]);
    }
    downloadCsv(`attendance-summary-${new Date().toISOString().split('T')[0]}.csv`, rows);
    setDownloading(null);
  };

  const handleFeedbackReport = () => {
    setDownloading('feedback');
    const headers = ['User', 'Email', 'Meal', 'Date', 'Overall', 'Staff', 'Hygiene', 'Items'];
    const rows = [headers, ...ratings.map(r => [
      r.userName, r.userEmail, r.mealName, r.mealDate,
      String(r.averageRating ?? ''), String(r.staffBehaviorRating ?? ''), String(r.hygieneRating ?? ''),
      JSON.stringify(r.itemRatings ?? {})
    ])];
    downloadCsv(`feedback-analysis-${new Date().toISOString().split('T')[0]}.csv`, rows);
    setDownloading(null);
  };

  const handleComplaintsReport = () => {
    setDownloading('complaints');
    const headers = ['User', 'Email', 'Category', 'Status', 'Description', 'Date'];
    const rows = [headers, ...complaints.map(c => [
      c.userName, c.userEmail, c.category, c.status, c.complaintText,
      new Date(c.timestamp).toISOString()
    ])];
    downloadCsv(`complaints-log-${new Date().toISOString().split('T')[0]}.csv`, rows);
    setDownloading(null);
  };
  return (
    <div className="space-y-8 animate-in zoom-in-95 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Reports & Archives</h1>
          <p className="text-slate-500 dark:text-slate-400">Generate and download reports from your Firebase data.</p>
        </div>
        <div className="flex gap-2">
           <button className="px-4 py-2 border dark:border-slate-700 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all">
             <Calendar size={18} /> Date Range
           </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
         <ReportItem 
           title="Weekly Attendance Summary" 
           desc="Consolidated attendance report for last 7 days including peak hours."
           type="CSV"
           onDownload={handleAttendanceReport}
         />
         <ReportItem 
           title="Feedback Analysis" 
           desc="Detailed breakdown of food ratings and staff behavior trends."
           type="CSV"
           onDownload={handleFeedbackReport}
         />
         <ReportItem 
           title="Complaints Status Log" 
           desc="Audit trail of all grievances submitted and their resolution status."
           type="CSV"
           onDownload={handleComplaintsReport}
         />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 shadow-sm overflow-hidden p-8">
         <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Clock size={24} className="text-blue-600" />
            Scheduled Reports
         </h2>
         <div className="space-y-4">
            {[
              { id: 1, name: 'Daily Manager Digest', time: 'Everyday at 08:00 PM', email: 'manager@mymess.com', active: true },
              { id: 2, name: 'Weekly Student Satisfaction', time: 'Every Sunday at 10:00 AM', email: 'admin@mymess.com', active: true },
              { id: 3, name: 'Monthly Inventory Forecast', time: '1st of every month', email: 'kitchen@mymess.com', active: false },
            ].map(schedule => (
               <div key={schedule.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border dark:border-slate-600 gap-4">
                  <div className="flex items-center gap-4">
                     <div className={`w-12 h-12 rounded-full flex items-center justify-center ${schedule.active ? 'bg-green-100 text-green-600' : 'bg-slate-200 text-slate-500'}`}>
                        {schedule.active ? <CheckCircle size={24} /> : <Clock size={24} />}
                     </div>
                     <div>
                        <p className="font-bold dark:text-slate-200">{schedule.name}</p>
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium mt-1">
                           <span className="flex items-center gap-1"><Clock size={12} /> {schedule.time}</span>
                           <span className="flex items-center gap-1"><Mail size={12} /> {schedule.email}</span>
                        </div>
                     </div>
                  </div>
                  <div className="flex items-center gap-2">
                     <button className="px-4 py-1.5 bg-white dark:bg-slate-800 border dark:border-slate-600 rounded-lg text-xs font-bold hover:shadow-md transition-all">Edit</button>
                     <button className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${schedule.active ? 'bg-red-50 text-red-600 hover:bg-red-600 hover:text-white' : 'bg-blue-600 text-white'}`}>
                        {schedule.active ? 'Deactivate' : 'Activate'}
                     </button>
                  </div>
               </div>
            ))}
         </div>
         <button className="mt-8 w-full border-2 border-dashed border-slate-200 dark:border-slate-700 p-4 rounded-2xl text-slate-400 hover:text-blue-500 hover:border-blue-500 transition-all font-bold text-sm">
            + Schedule New Automated Report
         </button>
      </div>
    </div>
  );
}
