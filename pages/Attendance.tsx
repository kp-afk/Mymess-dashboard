
import React, { useState, useEffect, useMemo } from 'react';
import { Download, Users, ChevronDown, ChevronUp, Calendar, Clock } from 'lucide-react';
import { rtdb } from '../lib/firebase';
import { getMenuForDate, MEAL_ORDER, type MealType } from '../lib/menuUtils';
import type { User } from '../types';

interface AttendanceProps {
  users: User[];
}

interface MealAttendance {
  date: string;
  meal: MealType;
  attendees: {
    uid: string;
    attending: boolean;
  }[];
  totalCount: number;
}

const totalCapacity = 600;

function formatDateKey(d: Date): string {
  return d.toISOString().split('T')[0];
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

function formatDateTime(dateStr: string, meal: MealType): string {
  const menu = getMenuForDate(dateStr);
  const slot = menu?.[meal.toLowerCase() as 'breakfast' | 'lunch' | 'dinner'];
  return slot ? `${slot.start} - ${slot.end}` : '';
}

// Helper function to parse attendance value
function parseAttendanceValue(value: any): boolean | null {
  if (value === null || value === undefined) {
    return null; // No response
  }
  
  if (typeof value === 'boolean') {
    return value; // Direct boolean value
  }
  
  if (value && typeof value === 'object') {
    // Check various possible field names (case-sensitive and case-insensitive)
    if (typeof value.attending === 'boolean') return value.attending;
    if (typeof value.isAttending === 'boolean') return value.isAttending;
    if (typeof value.isattending === 'boolean') return value.isattending;
    if (typeof value.present === 'boolean') return value.present;
    if (typeof value.isPresent === 'boolean') return value.isPresent;
    if (typeof value.ispresent === 'boolean') return value.ispresent;
    
    // If object exists but has no recognized boolean field, return null
    return null;
  }
  
  // Unknown value type
  return null;
}

export default function Attendance({ users }: AttendanceProps) {
  const [meals, setMeals] = useState<MealAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMeal, setExpandedMeal] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  const usersById = useMemo(() => {
    const map = new Map<string, User>();
    users.forEach(u => map.set(u.id, u));
    return map;
  }, [users]);

  useEffect(() => {
    // Set up real-time listener
    const attendanceRef = rtdb.ref('attendance');
    
    const handleData = (snapshot: any) => {
      const attendanceData = snapshot.val();
      
      if (!attendanceData) {
        setMeals([]);
        setLoading(false);
        return;
      }

      const allMeals: MealAttendance[] = [];

      // Iterate through all dates
      for (const [date, dateData] of Object.entries(attendanceData)) {
        if (!dateData || typeof dateData !== 'object') continue;

        // Iterate through all meals for this date
        for (const meal of MEAL_ORDER) {
          const mealData = (dateData as any)[meal];
          if (!mealData || typeof mealData !== 'object') continue;

          const attendees: { uid: string; attending: boolean }[] = [];
          
          // Process each user's attendance
          Object.entries(mealData).forEach(([uid, value]) => {
            const attendingValue = parseAttendanceValue(value);
            
            // Only add if we have a valid boolean response
            if (attendingValue !== null) {
              attendees.push({ uid, attending: attendingValue });
            }
          });

          // Only add meals that have at least one attendee
          if (attendees.length > 0) {
            const totalCount = attendees.filter(a => a.attending).length;
            
            allMeals.push({
              date,
              meal,
              attendees,
              totalCount
            });
          }
        }
      }

      // Sort by date (newest first), then by meal order within same date
      allMeals.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return MEAL_ORDER.indexOf(b.meal) - MEAL_ORDER.indexOf(a.meal);
      });

      setMeals(allMeals);
      setLoading(false);
    };

    const handleError = (error: any) => {
      console.error('Error with attendance listener:', error);
      setLoading(false);
    };

    // Attach listener
    attendanceRef.on('value', handleData, handleError);

    // Cleanup listener on unmount
    return () => {
      attendanceRef.off('value', handleData);
    };
  }, []);

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const headers = ['Date', 'Meal', 'Total Attending', 'User ID', 'Name', 'Email', 'Attending'];
      const csvRows = [headers.join(',')];
      
      for (const meal of meals) {
        for (const attendee of meal.attendees) {
          const user = usersById.get(attendee.uid);
          csvRows.push([
            meal.date,
            meal.meal,
            meal.totalCount,
            attendee.uid,
            user?.name || 'Unknown',
            user?.email || 'Unknown',
            attendee.attending ? 'Yes' : 'No'
          ].map(c => `"${String(c).replace(/"/g, '""')}"`).join(','));
        }
      }
      
      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `attendance-export-${formatDateKey(new Date())}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExporting(false);
    }
  };

  const toggleExpand = (mealKey: string) => {
    setExpandedMeal(expandedMeal === mealKey ? null : mealKey);
  };

  const getMealKey = (meal: MealAttendance) => `${meal.date}-${meal.meal}`;

  if (loading) {
    return (
      <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-slate-500 dark:text-slate-400">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black dark:text-white flex items-center gap-3">
            <Users size={40} className="text-blue-600" />
            Attendance History
          </h1>
          <p className="text-slate-500 dark:text-slate-400">All meal attendance records from Firebase RTDB</p>
        </div>
        <button 
          onClick={handleExportCSV}
          disabled={exporting}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg font-bold transition-all shadow-md shadow-blue-500/20 active:scale-95"
        >
          <Download size={18} />
          {exporting ? 'Exporting...' : 'Export CSV'}
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total Meals</p>
          <p className="text-3xl font-black dark:text-white">{meals.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Total RSVPs</p>
          <p className="text-3xl font-black dark:text-white">
            {meals.reduce((sum, m) => sum + m.totalCount, 0)}
          </p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Avg Attendance</p>
          <p className="text-3xl font-black dark:text-white">
            {meals.length > 0 ? Math.round(meals.reduce((sum, m) => sum + m.totalCount, 0) / meals.length) : 0}
          </p>
        </div>
      </div>

      {/* Meals List */}
      {meals.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 p-10 rounded-2xl border dark:border-slate-700 shadow-sm text-center">
          <p className="text-slate-400">No attendance data found in the database.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {meals.map((meal) => {
            const mealKey = getMealKey(meal);
            const isExpanded = expandedMeal === mealKey;
            const percentage = (meal.totalCount / totalCapacity) * 100;
            const timeSlot = formatDateTime(meal.date, meal.meal);

            return (
              <div 
                key={mealKey}
                className="bg-white dark:bg-slate-800 rounded-2xl border dark:border-slate-700 shadow-sm overflow-hidden transition-all hover:shadow-md"
              >
                {/* Meal Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 text-xs font-black rounded-full uppercase">
                          {meal.meal}
                        </span>
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <Calendar size={14} />
                          <span className="text-sm font-medium">{formatDisplayDate(meal.date)}</span>
                        </div>
                        {timeSlot && (
                          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                            <Clock size={14} />
                            <span className="text-sm">{timeSlot}</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-end gap-3 mb-3">
                        <span className="text-4xl font-black dark:text-white">{meal.totalCount}</span>
                        <span className="text-slate-400 text-lg mb-1">attending</span>
                      </div>

                      {/* Progress Bar */}
                      <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden shadow-inner">
                        <div 
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-500"
                          style={{ width: `${Math.min(100, percentage)}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-slate-400 mt-1">
                        <span>{Math.round(percentage)}% capacity</span>
                        <span>{totalCapacity - meal.totalCount} slots remaining</span>
                      </div>
                    </div>

                    {/* Expand Button */}
                    <button
                      onClick={() => toggleExpand(mealKey)}
                      className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                    >
                      {isExpanded ? (
                        <ChevronUp size={24} className="text-slate-600 dark:text-slate-400" />
                      ) : (
                        <ChevronDown size={24} className="text-slate-600 dark:text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t dark:border-slate-700 p-6 bg-slate-50 dark:bg-slate-900/50">
                    <div className="mb-4">
                      <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
                        Attendance Details ({meal.attendees.length} total responses)
                      </p>
                    </div>

                    {meal.attendees.length === 0 ? (
                      <p className="text-sm text-slate-400">No responses recorded.</p>
                    ) : (
                      <div className="max-h-96 overflow-y-auto">
                        <table className="min-w-full text-left text-sm">
                          <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900/50">
                            <tr className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                              <th className="py-2 pr-4">User ID</th>
                              <th className="py-2 pr-4">Name</th>
                              <th className="py-2 pr-4">Email</th>
                              <th className="py-2">Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {meal.attendees.map((attendee) => {
                              const user = usersById.get(attendee.uid);
                              return (
                                <tr key={attendee.uid} className="border-t dark:border-slate-700">
                                  <td className="py-2 pr-4 text-[11px] text-slate-400">{attendee.uid}</td>
                                  <td className="py-2 pr-4 font-medium dark:text-slate-100">
                                    {user?.name || 'Unknown User'}
                                  </td>
                                  <td className="py-2 pr-4 text-slate-500 dark:text-slate-400">
                                    {user?.email || 'N/A'}
                                  </td>
                                  <td className="py-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                      attendee.attending 
                                        ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400'
                                        : 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400'
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
