
import React, { useState, useMemo } from 'react';
import { Star, Pizza, Heart, ShieldCheck, Database, Clock, BarChart3, ChevronRight, X } from 'lucide-react';
import type { Rating, MealType } from '../types';
import { dateToDayName, getDaySortIndex, getMealSortIndex, MEAL_ORDER } from '../lib/menuUtils';

interface RatingsProps {
  liveRatings: Rating[];
}

/** Sort ratings by day of week (Sun–Sat) then by meal (Breakfast, Lunch, Dinner) per menu */
function sortRatingsByMenu(ratings: Rating[]): Rating[] {
  return [...ratings].sort((a, b) => {
    const dayA = dateToDayName(a.mealDate ?? '');
    const dayB = dateToDayName(b.mealDate ?? '');
    const dayDiff = getDaySortIndex(dayA) - getDaySortIndex(dayB);
    if (dayDiff !== 0) return dayDiff;
    const mealDiff = getMealSortIndex(a.mealName ?? '') - getMealSortIndex(b.mealName ?? '');
    if (mealDiff !== 0) return mealDiff;
    return (b.timestamp ?? 0) - (a.timestamp ?? 0);
  });
}

/** Group ratings by date+meal for easier browsing, sorted by date desc then meal order */
function groupRatingsByDayMeal(ratings: Rating[]): { key: string; day: string; meal: string; date: string; items: Rating[] }[] {
  const map = new Map<string, Rating[]>();
  for (const r of ratings) {
    const meal = r.mealName ?? 'Unknown';
    const key = `${r.mealDate ?? ''}-${meal}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  const dayOrder = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const entries = Array.from(map.entries()).map(([key, items]) => {
    const date = items[0]?.mealDate ?? '';
    const day = dateToDayName(date);
    const meal = items[0]?.mealName ?? 'Unknown';
    return { key, day, meal, date, items };
  });
  return entries.sort((a, b) => {
    const dateDiff = (b.date ?? '').localeCompare(a.date ?? '');
    if (dateDiff !== 0) return dateDiff;
    const mealDiff = MEAL_ORDER.indexOf(a.meal as any) - MEAL_ORDER.indexOf(b.meal as any);
    if (mealDiff !== 0) return mealDiff;
    return 0;
  });
}

export default function Ratings({ liveRatings }: RatingsProps) {
  const [selectedRating, setSelectedRating] = useState<Rating | null>(null);
  const [viewMode, setViewMode] = useState<'grouped' | 'list'>('grouped');

  const sortedRatings = useMemo(() => sortRatingsByMenu(liveRatings), [liveRatings]);
  const groupedRatings = useMemo(() => groupRatingsByDayMeal(liveRatings), [liveRatings]);

  // Calculate Averages based on live data
  const averages = useMemo(() => {
    // Filter to only include valid ratings to avoid skewing averages
    const validRatings = liveRatings.filter(r => (r.averageRating || 0) > 0);
    
    if (validRatings.length === 0) return { overall: "--", staff: "--", hygiene: "--" };
    
    const total = validRatings.length;
    const sumOverall = validRatings.reduce((acc, curr) => acc + (curr.averageRating || 0), 0);
    const sumStaff = validRatings.reduce((acc, curr) => acc + (curr.staffBehaviorRating || 0), 0);
    const sumHygiene = validRatings.reduce((acc, curr) => acc + (curr.hygieneRating || 0), 0);

    return {
      overall: (sumOverall / total).toFixed(1),
      staff: (sumStaff / total).toFixed(1),
      hygiene: (sumHygiene / total).toFixed(1)
    };
  }, [liveRatings]);

  // Calculate Average Rating per Item
  const itemPerformance = useMemo(() => {
    const stats: Record<string, { sum: number; count: number }> = {};
    liveRatings.forEach(r => {
      if (r.itemRatings) {
        Object.entries(r.itemRatings).forEach(([item, score]) => {
          // Robustly handle potential string values from database
          const numScore = Number(score);
          if (!isNaN(numScore) && numScore > 0) {
            if (!stats[item]) stats[item] = { sum: 0, count: 0 };
            stats[item].sum += numScore;
            stats[item].count += 1;
          }
        });
      }
    });
    return Object.entries(stats)
      .map(([name, { sum, count }]) => ({
        name,
        avg: parseFloat((sum / count).toFixed(1)),
        count
      }))
      .sort((a, b) => b.avg - a.avg);
  }, [liveRatings]);

  // Average rating per meal (Breakfast / Lunch / Dinner)
  const mealAverages = useMemo(() => {
    const base: Record<MealType, { sum: number; count: number }> = {
      Breakfast: { sum: 0, count: 0 },
      Lunch: { sum: 0, count: 0 },
      Dinner: { sum: 0, count: 0 }
    };
    liveRatings.forEach(r => {
      const meal = (r.mealName ?? '') as MealType;
      if (!meal || !(meal in base)) return;
      const val = typeof r.averageRating === 'number' ? r.averageRating : Number(r.averageRating || 0);
      if (!isNaN(val) && val > 0) {
        base[meal].sum += val;
        base[meal].count += 1;
      }
    });
    const format = (meal: MealType) =>
      base[meal].count > 0 ? (base[meal].sum / base[meal].count).toFixed(1) : '--';
    return {
      Breakfast: format('Breakfast'),
      Lunch: format('Lunch'),
      Dinner: format('Dinner')
    };
  }, [liveRatings]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold dark:text-white">Feedback Analytics</h1>
          <p className="text-slate-500 dark:text-slate-400">Analysis of the <code>mealRatings</code> collection, sorted by day & meal.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('grouped')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'grouped' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
          >
            By Day & Meal
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
          >
            Chronological
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm">
           <div className="p-2 w-fit bg-yellow-50 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400 rounded-lg"><Star size={20} /></div>
           <p className="mt-4 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">Overall Rating</p>
           <p className="text-3xl font-black mt-1 dark:text-white">{averages.overall} <span className="text-sm font-normal text-slate-400">/ 5.0</span></p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm">
           <div className="p-2 w-fit bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400 rounded-lg"><Pizza size={20} /></div>
           <p className="mt-4 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">Total Feedbacks</p>
           <p className="text-3xl font-black mt-1 dark:text-white">{liveRatings.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm">
           <div className="p-2 w-fit bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 rounded-lg"><Heart size={20} /></div>
           <p className="mt-4 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">Staff Score</p>
           <p className="text-3xl font-black mt-1 dark:text-white">{averages.staff}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm">
           <div className="p-2 w-fit bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg"><ShieldCheck size={20} /></div>
           <p className="mt-4 text-slate-500 dark:text-slate-400 text-xs font-black uppercase tracking-widest">Hygiene Score</p>
           <p className="text-3xl font-black mt-1 dark:text-white">{averages.hygiene}</p>
        </div>
      </div>

      {/* Meal-wise averages */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border dark:border-slate-700 shadow-sm">
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Average Rating by Meal</p>
        <div className="flex flex-wrap gap-6 text-sm">
          {(['Breakfast', 'Lunch', 'Dinner'] as MealType[]).map(meal => (
            <div key={meal} className="flex flex-col">
              <span className="text-xs font-black uppercase tracking-widest text-slate-500">{meal}</span>
              <span className="text-2xl font-bold dark:text-white">
                {mealAverages[meal]} <span className="text-xs text-slate-400">/ 5.0</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Menu Item Performance Section */}
      <div className="bg-white dark:bg-slate-800 p-8 rounded-3xl border dark:border-slate-700 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <BarChart3 size={24} />
            </div>
            <div>
                <h2 className="text-lg font-bold dark:text-white">Menu Item Performance</h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Average ratings per food item across all feedbacks</p>
            </div>
        </div>
        
        {itemPerformance.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {itemPerformance.map((item) => (
                    <div key={item.name} className="flex items-center justify-between p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                        <span className="font-bold text-slate-700 dark:text-slate-200">{item.name}</span>
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{item.count} reviews</span>
                            <div className={`px-2 py-1 rounded-lg text-xs font-black ${
                                item.avg >= 4 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                item.avg >= 3 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}>
                                {item.avg} ★
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="text-center py-8 text-slate-400">No item ratings available yet.</div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-3xl border dark:border-slate-700 shadow-sm overflow-hidden">
        <div className="p-6 border-b dark:border-slate-700 flex items-center justify-between">
           <h3 className="text-lg font-bold dark:text-white">Feedback by Day & Meal</h3>
           <div className="flex items-center gap-2 text-xs text-slate-500 uppercase tracking-widest font-black">
              <Database size={14} /> Live Sync
           </div>
        </div>
        <div className="p-6">
           {liveRatings.length > 0 ? (
             viewMode === 'grouped' ? (
               <div className="space-y-8">
                 {groupedRatings.map(({ key, day, meal, date, items }) => (
                   <div key={key} className="border dark:border-slate-600 rounded-2xl overflow-hidden">
                     <div className="px-6 py-3 bg-slate-50 dark:bg-slate-700/50 border-b dark:border-slate-600 flex items-center justify-between">
                       <span className="font-bold dark:text-slate-200">{day} • {meal} <span className="font-normal text-slate-500 text-sm">({date})</span></span>
                       <span className="text-xs text-slate-500">{items.length} rating{items.length !== 1 ? 's' : ''}</span>
                     </div>
                     <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                       {items.map(rating => (
                         <div 
                           key={rating.id} 
                           onClick={() => setSelectedRating(rating)}
                           className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border dark:border-slate-600 transition-all hover:border-blue-500 cursor-pointer group hover:shadow-md"
                         >
                           <div className="flex justify-between items-start mb-3">
                             <div>
                               <p className="text-sm font-bold dark:text-slate-200">{rating.userName}</p>
                               <p className="text-[10px] text-slate-400">{rating.mealDate}</p>
                             </div>
                             <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded text-yellow-600 dark:text-yellow-400 text-xs font-black">
                               {typeof rating.averageRating === 'number' ? rating.averageRating.toFixed(1) : '?.?'} <Star size={12} className="fill-current" />
                             </div>
                           </div>
                           <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                             <span>Staff {rating.staffBehaviorRating}/5</span>
                             <span>Hygiene {rating.hygieneRating}/5</span>
                           </div>
                         </div>
                       ))}
                     </div>
                   </div>
                 ))}
               </div>
             ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sortedRatings.map(rating => (
                  <div 
                    key={rating.id} 
                    onClick={() => setSelectedRating(rating)}
                    className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-2xl border dark:border-slate-600 transition-all hover:border-blue-500 cursor-pointer group hover:shadow-md relative overflow-hidden"
                  >
                    <div className="flex justify-between items-start mb-3">
                       <div>
                          <p className="text-sm font-bold dark:text-slate-200">{rating.userName}</p>
                          <p className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">{rating.mealName} • {rating.mealDate}</p>
                       </div>
                       <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded text-yellow-600 dark:text-yellow-400 text-xs font-black">
                          {typeof rating.averageRating === 'number' ? rating.averageRating.toFixed(1) : '?.?'} <Star size={12} className="fill-current" />
                       </div>
                    </div>
                    <div className="space-y-2 mt-4">
                       <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                          <span>Staff</span>
                          <span>{rating.staffBehaviorRating}/5</span>
                       </div>
                       <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500">
                          <span>Hygiene</span>
                          <span>{rating.hygieneRating}/5</span>
                       </div>
                    </div>
                    
                    {/* Hover Effect */}
                    <div className="mt-3 pt-3 border-t dark:border-slate-600 flex justify-center text-blue-500 text-xs font-bold items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute bottom-2 left-0 right-0 bg-slate-50 dark:bg-slate-800 mx-4">
                        View Details <ChevronRight size={14} />
                    </div>
                  </div>
                ))}
             </div>
             )
           ) : (
             <div className="py-20 text-center text-slate-400 flex flex-col items-center justify-center">
                <Clock size={48} className="opacity-10 mb-4" />
                <p className="font-medium">No ratings found in <code>mealRatings</code> collection.</p>
             </div>
           )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedRating && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border dark:border-slate-700">
                <div className="p-6 border-b dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">Feedback Details</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{new Date(selectedRating.timestamp).toLocaleString()}</p>
                    </div>
                    <button onClick={() => setSelectedRating(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors dark:text-slate-400">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                    {/* User Info */}
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 flex items-center justify-center text-lg font-black shrink-0">
                            {selectedRating.userName.charAt(0)}
                        </div>
                        <div>
                            <p className="font-bold text-lg dark:text-slate-200">{selectedRating.userName}</p>
                            <p className="text-slate-500 text-sm truncate max-w-[150px]">{selectedRating.userEmail}</p>
                        </div>
                        <div className="ml-auto text-right">
                             <div className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Meal</div>
                             <div className="font-bold dark:text-slate-200 text-sm">{selectedRating.mealName}</div>
                        </div>
                    </div>

                    {/* Overall Score */}
                    <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800">
                        <span className="font-bold text-blue-800 dark:text-blue-300">Overall Experience</span>
                        <div className="flex items-center gap-1 text-2xl font-black text-blue-600 dark:text-blue-400">
                            {typeof selectedRating.averageRating === 'number' ? selectedRating.averageRating.toFixed(1) : selectedRating.averageRating} <Star className="fill-current" />
                        </div>
                    </div>

                    {/* Item Ratings */}
                    <div>
                        <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                           <Pizza size={14} /> Item Breakdown
                        </h4>
                        <div className="space-y-3">
                            {selectedRating.itemRatings && Object.entries(selectedRating.itemRatings).map(([item, score]) => (
                                <div key={item} className="flex items-center gap-4">
                                    <span className="w-32 font-medium text-slate-700 dark:text-slate-300 truncate text-sm">{item}</span>
                                    <div className="flex-1 h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${Number(score) >= 4 ? 'bg-green-500' : Number(score) >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`} 
                                            style={{ width: `${(Number(score)/5)*100}%` }}
                                        />
                                    </div>
                                    <span className="font-bold dark:text-slate-200 w-6 text-right text-sm">{score}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Service Ratings */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-xl border dark:border-slate-700 text-center bg-slate-50 dark:bg-slate-700/30">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Staff Behavior</p>
                            <p className="text-2xl font-black dark:text-white">{selectedRating.staffBehaviorRating}<span className="text-sm text-slate-400">/5</span></p>
                        </div>
                        <div className="p-4 rounded-xl border dark:border-slate-700 text-center bg-slate-50 dark:bg-slate-700/30">
                             <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Hygiene</p>
                             <p className="text-2xl font-black dark:text-white">{selectedRating.hygieneRating}<span className="text-sm text-slate-400">/5</span></p>
                        </div>
                    </div>
                </div>
             </div>
          </div>
      )}
    </div>
  );
}
