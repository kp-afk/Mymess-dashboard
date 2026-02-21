import React, { useState, useEffect, useMemo } from 'react';
import { Download, Users, ChevronDown, ChevronUp, Calendar, Clock } from 'lucide-react';
import { rtdb } from '../lib/firebase';
import { getMenuForDate, MEAL_ORDER, type MealType } from '../lib/menuUtils';
import type { User } from '../types';

// ─── Props ────────────────────────────────────────────────────────────────────
// Note: liveAttendance / attendanceByMeal / activeMealInfo / attendeeUserIds
// are passed from App but this page maintains its own RTDB listener for full
// historical attendance. They are accepted here to keep the interface stable.

interface AttendanceProps {
  liveAttendance: number;
  attendanceByMeal: { Breakfast: number; Lunch: number; Dinner: number };
  activeMealInfo: { meal: MealType; isLive: boolean; isTomorrow?: boolean; date: string };
  attendeeUserIds: string[];
  users: User[];
}

interface MealAttendance {
  date: string;
  meal: MealType;
  attendees: { uid: string; attending: boolean }[];
  totalCount: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TOTAL_CAPACITY = 600;

const MEAL_COLORS: Record<MealType, string> = {
  Breakfast: 'bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-400 border-amber-100 dark:border-amber-900',
  Lunch:     'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900',
  Dinner:    'bg-violet-50 text-violet-700 dark:bg-violet-950 dark:text-violet-400 border-violet-100 dark:border-violet-900',
};

const MEAL_BAR: Record<MealType, string> = {
  Breakfast: 'bg-amber-400',
  Lunch:     'bg-emerald-500',
  Dinner:    'bg-violet-500',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatTimeSlot(dateStr: string, meal: MealType): string {
  const menu = getMenuForDate(dateStr);
  const slot = menu?.[meal.toLowerCase() as 'breakfast' | 'lunch' | 'dinner'];
  return slot ? `${slot.start} – ${slot.end}` : '';
}

function parseAttendanceValue(value: unknown): boolean | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  if (value && typeof value === 'object') {
    const v = value as Record<string, unknown>;
    if (typeof v.attending   === 'boolean') return v.attending;
    if (typeof v.isAttending === 'boolean') return v.isAttending;
    if (typeof v.present     === 'boolean') return v.present;
    if (typeof v.isPresent   === 'boolean') return v.isPresent;
    return null;
  }
  return null;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function Attendance({ users }: AttendanceProps) {
  const [meals, setMeals]             = useState<MealAttendance[]>([]);
  const [loading, setLoading]         = useState(true);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [exporting, setExporting]     = useState(false);

  const usersById = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach(u => map.set(u.id, u));
    return map;
  }, [users]);

  useEffect(() => {
    const ref = rtdb.ref('attendance');

    const handleData = (snapshot: any) => {
      const data = snapshot.val();
      if (!data) { setMeals([]); setLoading(false); return; }

      const allMeals: MealAttendance[] = [];

      for (const [date, dateData] of Object.entries(data)) {
        if (!dateData || typeof dateData !== 'object') continue;
        for (const meal of MEAL_ORDER) {
          const mealData = (dateData as any)[meal];
          if (!mealData || typeof mealData !== 'object') continue;

          const attendees: { uid: string; attending: boolean }[] = [];
          Object.entries(mealData).forEach(([uid, value]) => {
            const v = parseAttendanceValue(value);
            if (v !== null) attendees.push({ uid, attending: v });
          });

          if (attendees.length > 0) {
            allMeals.push({
              date,
              meal,
              attendees,
              totalCount: attendees.filter(a => a.attending).length,
            });
          }
        }
      }

      allMeals.sort((a, b) => {
        const d = b.date.localeCompare(a.date);
        return d !== 0 ? d : MEAL_ORDER.indexOf(b.meal) - MEAL_ORDER.indexOf(a.meal);
      });

      setMeals(allMeals);
      setLoading(false);
    };

    ref.on('value', handleData, () => setLoading(false));
    return () => ref.off('value', handleData);
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const headers = ['Date', 'Meal', 'Total Attending', 'User ID', 'Name', 'Email', 'Attending'];
      const rows = [headers.join(',')];
      for (const meal of meals) {
        for (const attendee of meal.attendees) {
          const user = usersById.get(attendee.uid);
          rows.push([
            meal.date, meal.meal, meal.totalCount, attendee.uid,
            user?.name || 'Unknown', user?.email || 'Unknown',
            attendee.attending ? 'Yes' : 'No',
          ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));
        }
      }
      const blob = new Blob([rows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url;
      a.download = `attendance-${formatDateKey(new Date())}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const getMealKey = (m: MealAttendance) => `${m.date}-${m.meal}`;
  const toggleExpand = (key: string) => setExpandedMeal(prev => prev === key ? null : key);

  const totalRSVPs = meals.reduce((s, m) => s + m.totalCount, 0);
  const avgAttendance = meals.length > 0 ? Math.round(totalRSVPs / meals.length) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600 dark:border-zinc-700 dark:border-t-indigo-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Attendance History
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">
            All meal records from Firebase RTDB
          </p>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={exporting}
          className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50"
        >
          <Download size={15} />
          {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Meals',    value: meals.length },
          { label: 'Total RSVPs',    value: totalRSVPs   },
          { label: 'Avg Attendance', value: avgAttendance },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-5 transition-colors">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 mb-1">
              {label}
            </p>
            <p className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{value}</p>
          </div>
        ))}
      </div>

      {/* ── Meals list ── */}
      {meals.length === 0 ? (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl p-12 text-center transition-colors">
          <Users size={32} className="mx-auto mb-3 text-zinc-200 dark:text-zinc-700" />
          <p className="text-sm text-zinc-400">No attendance data found in the database.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {meals.map((meal) => {
            const key         = getMealKey(meal);
            const isExpanded  = expandedMeal === key;
            const pct         = Math.min(100, (meal.totalCount / TOTAL_CAPACITY) * 100);
            const timeSlot    = formatTimeSlot(meal.date, meal.meal);
            const barColor    = MEAL_BAR[meal.meal];
            const pillClasses = MEAL_COLORS[meal.meal];

            return (
              <div
                key={key}
                className="bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-xl overflow-hidden transition-colors"
              >
                {/* Card header */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      {/* Meal tag + date + time */}
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className={`text-[11px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-md border ${pillClasses}`}>
                          {meal.meal}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                          <Calendar size={12} />
                          {formatDisplayDate(meal.date)}
                        </span>
                        {timeSlot && (
                          <span className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <Clock size={12} />
                            {timeSlot}
                          </span>
                        )}
                      </div>

                      {/* Count */}
                      <p className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100 mb-3">
                        {meal.totalCount}
                        <span className="text-sm font-normal text-zinc-400 ml-2">attending</span>
                      </p>

                      {/* Capacity bar */}
                      <div className="h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${barColor} transition-all duration-500 rounded-full`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-zinc-400 mt-1.5">
                        <span>{Math.round(pct)}% capacity</span>
                        <span>{TOTAL_CAPACITY - meal.totalCount} remaining</span>
                      </div>
                    </div>

                    {/* Expand toggle */}
                    <button
                      onClick={() => toggleExpand(key)}
                      className="p-2 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shrink-0"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  </div>
                </div>

                {/* Expanded attendee table */}
                {isExpanded && (
                  <div className="border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 px-5 py-4">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-zinc-400 mb-3">
                      Responses ({meal.attendees.length})
                    </p>
                    {meal.attendees.length === 0 ? (
                      <p className="text-sm text-zinc-400">No responses recorded.</p>
                    ) : (
                      <div className="max-h-80 overflow-y-auto">
                        <table className="w-full text-left text-sm">
                          <thead className="sticky top-0 bg-zinc-50 dark:bg-zinc-950/60">
                            <tr className="text-[10px] font-semibold uppercase tracking-widest text-zinc-400">
                              <th className="py-2 pr-4">Name</th>
                              <th className="py-2 pr-4">Email</th>
                              <th className="py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                            {meal.attendees.map((attendee) => {
                              const user = usersById.get(attendee.uid);
                              return (
                                <tr key={attendee.uid}>
                                  <td className="py-2.5 pr-4 font-medium text-zinc-800 dark:text-zinc-200">
                                    {user?.name || attendee.uid}
                                  </td>
                                  <td className="py-2.5 pr-4 text-zinc-400 text-xs">
                                    {user?.email || '—'}
                                  </td>
                                  <td className="py-2.5">
                                    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                      attendee.attending
                                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400'
                                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-400'
                                    }`}>
                                      {attendee.attending ? 'Attending' : 'Not Attending'}
                                    </span>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
