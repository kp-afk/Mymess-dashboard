/**
 * Ratings.tsx — Redesigned Admin Ratings Dashboard
 * Aesthetic: Refined dark analytics ("Observatory" style)
 * Typography: Syne (headings) + IBM Plex Mono (numbers)
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Star, Pizza, Heart, ShieldCheck, Clock, BarChart3, ChevronRight, X,
  ChevronDown, TrendingUp, TrendingDown, Users, Calendar, Coffee,
  Sun, Moon, AlertTriangle, Filter, Database, Minus
} from 'lucide-react';
import type { Rating, MealType } from '../types';
import { dateToDayName, getDaySortIndex, getMealSortIndex, MEAL_ORDER } from '../lib/menuUtils';

// ─── Types ────────────────────────────────────────────────────────────────────

interface RatingsProps { liveRatings: Rating[] }

type TabId = 'timeline' | 'performance' | 'users';

interface MealGroup { key: string; date: string; day: string; meal: MealType; items: Rating[]; avg: number }

interface DateGroup { date: string; day: string; meals: MealGroup[] }

// ─── Constants ────────────────────────────────────────────────────────────────

const MEALS: MealType[] = ['Breakfast', 'Lunch', 'Dinner'];

const MEAL_ICONS: Record<MealType, React.ReactNode> = {
  Breakfast: <Coffee size={13} />,
  Lunch:     <Sun    size={13} />,
  Dinner:    <Moon   size={13} />,
};

const MEAL_COLORS: Record<MealType, { bg: string; text: string; border: string }> = {
  Breakfast: { bg: 'rgba(251,191,36,0.12)',  text: '#fbbf24', border: 'rgba(251,191,36,0.3)'  },
  Lunch:     { bg: 'rgba(52,211,153,0.12)',  text: '#34d399', border: 'rgba(52,211,153,0.3)'  },
  Dinner:    { bg: 'rgba(139,92,246,0.12)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function ratingColor(val: number): string {
  if (val >= 4.5) return '#10b981';
  if (val >= 4.0) return '#34d399';
  if (val >= 3.5) return '#fbbf24';
  if (val >= 3.0) return '#f59e0b';
  if (val >= 2.0) return '#f97316';
  return '#f43f5e';
}

function ratingLabel(val: number): string {
  if (val >= 4.5) return 'Excellent';
  if (val >= 4.0) return 'Good';
  if (val >= 3.5) return 'Above Avg';
  if (val >= 3.0) return 'Average';
  if (val >= 2.0) return 'Below Avg';
  return 'Poor';
}

function heatmapBg(val: number | null): string {
  if (val === null) return 'rgba(255,255,255,0.03)';
  if (val >= 4.5) return 'rgba(16,185,129,0.28)';
  if (val >= 4.0) return 'rgba(16,185,129,0.16)';
  if (val >= 3.5) return 'rgba(251,191,36,0.22)';
  if (val >= 3.0) return 'rgba(245,158,11,0.16)';
  if (val >= 2.0) return 'rgba(249,115,22,0.22)';
  return 'rgba(244,63,94,0.22)';
}

function avgOf(ratings: Rating[]): number {
  const valid = ratings.filter(r => (r.averageRating ?? 0) > 0);
  if (!valid.length) return 0;
  return valid.reduce((s, r) => s + (r.averageRating ?? 0), 0) / valid.length;
}

function formatDate(dateStr: string): string {
  try {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  } catch { return dateStr; }
}

function getMonthKey(dateStr: string): string {
  return dateStr?.slice(0, 7) ?? '';
}

// ─── Data Transforms ──────────────────────────────────────────────────────────

function buildDateGroups(ratings: Rating[]): DateGroup[] {
  const byDate = new Map<string, Map<string, Rating[]>>();
  for (const r of ratings) {
    const d = r.mealDate ?? '';
    const m = r.mealName ?? 'Unknown';
    if (!byDate.has(d)) byDate.set(d, new Map());
    if (!byDate.get(d)!.has(m)) byDate.get(d)!.set(m, []);
    byDate.get(d)!.get(m)!.push(r);
  }
  return Array.from(byDate.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, mealMap]) => ({
      date,
      day: dateToDayName(date),
      meals: Array.from(mealMap.entries())
        .sort(([a], [b]) => MEAL_ORDER.indexOf(a as MealType) - MEAL_ORDER.indexOf(b as MealType))
        .map(([meal, items]) => ({
          key: `${date}-${meal}`,
          date, day: dateToDayName(date),
          meal: meal as MealType,
          items,
          avg: avgOf(items),
        })),
    }));
}

function buildHeatmapData(ratings: Rating[], weekDates: string[]): Record<string, Record<MealType, { avg: number | null; count: number }>> {
  const result: Record<string, Record<MealType, { avg: number | null; count: number }>> = {};
  for (const d of weekDates) {
    result[d] = { Breakfast: { avg: null, count: 0 }, Lunch: { avg: null, count: 0 }, Dinner: { avg: null, count: 0 } };
  }
  for (const r of ratings) {
    const d = r.mealDate ?? '';
    const m = r.mealName as MealType;
    if (!result[d] || !MEALS.includes(m)) continue;
    const cell = result[d][m];
    const val = r.averageRating ?? 0;
    if (val > 0) {
      cell.avg = cell.avg === null ? val : (cell.avg * cell.count + val) / (cell.count + 1);
      cell.count++;
    }
  }
  return result;
}

function buildItemPerformance(ratings: Rating[]) {
  const stats: Record<string, { sum: number; count: number; mealCounts: Partial<Record<MealType, number>> }> = {};
  for (const r of ratings) {
    if (!r.itemRatings) continue;
    for (const [item, score] of Object.entries(r.itemRatings)) {
      const n = Number(score);
      if (isNaN(n) || n <= 0) continue;
      if (!stats[item]) stats[item] = { sum: 0, count: 0, mealCounts: {} };
      stats[item].sum += n;
      stats[item].count++;
      const m = r.mealName as MealType;
      if (m) stats[item].mealCounts[m] = (stats[item].mealCounts[m] ?? 0) + 1;
    }
  }
  return Object.entries(stats)
    .map(([name, { sum, count, mealCounts }]) => ({
      name, avg: parseFloat((sum / count).toFixed(1)), count, mealCounts,
    }))
    .sort((a, b) => b.avg - a.avg);
}

function buildUserStats(ratings: Rating[]) {
  const map: Record<string, { name: string; email: string; ratings: Rating[] }> = {};
  for (const r of ratings) {
    const id = r.userEmail ?? r.userName ?? 'unknown';
    if (!map[id]) map[id] = { name: r.userName ?? '?', email: r.userEmail ?? '', ratings: [] };
    map[id].ratings.push(r);
  }
  return Object.values(map).map(({ name, email, ratings }) => {
    const avgs = ratings.map(r => r.averageRating ?? 0).filter(v => v > 0);
    const avg = avgs.length ? avgs.reduce((a, b) => a + b, 0) / avgs.length : 0;
    const variance = avgs.length > 1
      ? avgs.reduce((s, v) => s + (v - avg) ** 2, 0) / avgs.length : 0;
    const anomaly = variance > 1.5 || avg < 1.5 || avg > 4.9;
    return { name, email, count: ratings.length, avg: parseFloat(avg.toFixed(1)), variance: parseFloat(variance.toFixed(2)), anomaly };
  }).sort((a, b) => b.count - a.count);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RatingPill({ value, size = 'sm' }: { value: number | string | undefined | null; size?: 'sm' | 'lg' }) {
  const num = typeof value === 'number' ? value : parseFloat(String(value ?? '0'));
  const valid = !isNaN(num) && num > 0;
  const color = valid ? ratingColor(num) : '#475569';
  const label = valid ? num.toFixed(1) : '—';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: valid ? `${color}22` : 'rgba(255,255,255,0.05)',
      color, border: `1px solid ${color}44`,
      borderRadius: 6,
      padding: size === 'lg' ? '6px 12px' : '3px 8px',
      fontSize: size === 'lg' ? 15 : 12,
      fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace",
      fontWeight: 700, whiteSpace: 'nowrap',
    }}>
      <Star size={size === 'lg' ? 13 : 10} style={{ fill: color, flexShrink: 0 }} />
      {label}
    </span>
  );
}

function MiniBar({ value, max = 5, color }: { value: number; max?: number; color: string }) {
  const pct = Math.min(100, (value / max) * 100);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.6s ease' }} />
      </div>
      <span style={{ fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", fontSize: 11, color, minWidth: 24, textAlign: 'right' }}>{value}</span>
    </div>
  );
}

function StarRow({ value }: { value: number }) {
  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1,2,3,4,5].map(i => (
        <Star key={i} size={11}
          style={{ fill: i <= Math.round(value) ? '#f59e0b' : 'transparent', stroke: i <= Math.round(value) ? '#f59e0b' : '#334155' }} />
      ))}
    </div>
  );
}

// ─── Filter Bar ───────────────────────────────────────────────────────────────

interface FilterBarProps {
  months: string[];
  selectedMonth: string;
  setSelectedMonth: (m: string) => void;
  selectedMeals: MealType[];
  toggleMeal: (m: MealType) => void;
  dateRange: { from: string; to: string };
  setDateRange: (r: { from: string; to: string }) => void;
  totalCount: number;
  filteredCount: number;
}

function FilterBar({ months, selectedMonth, setSelectedMonth, selectedMeals, toggleMeal, dateRange, setDateRange, totalCount, filteredCount }: FilterBarProps) {
  const s: React.CSSProperties = {
    display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
    padding: '14px 20px',
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 14,
    marginBottom: 24,
  };
  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 8, padding: '6px 10px', color: '#f1f5f9', fontSize: 12,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", outline: 'none', cursor: 'pointer',
  };
  return (
    <div style={s}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b' }}>
        <Filter size={14} />
        <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace" }}>Filters</span>
      </div>

      {/* Month */}
      <select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} style={inputStyle}>
        <option value="">All Months</option>
        {months.map(m => <option key={m} value={m}>{new Date(m + '-01').toLocaleString('en-IN', { month: 'long', year: 'numeric' })}</option>)}
      </select>

      {/* Meal type pills */}
      <div style={{ display: 'flex', gap: 6 }}>
        {MEALS.map(meal => {
          const active = selectedMeals.includes(meal);
          const mc = MEAL_COLORS[meal];
          return (
            <button key={meal} onClick={() => toggleMeal(meal)} style={{
              display: 'inline-flex', alignItems: 'center', gap: 5, padding: '5px 10px',
              borderRadius: 20, border: `1px solid ${active ? mc.border : 'rgba(255,255,255,0.08)'}`,
              background: active ? mc.bg : 'transparent',
              color: active ? mc.text : '#64748b', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.2s', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
            }}>
              {MEAL_ICONS[meal]} {meal}
            </button>
          );
        })}
      </div>

      {/* Date range */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input type="date" value={dateRange.from}
          onChange={e => setDateRange({ ...dateRange, from: e.target.value })} style={inputStyle} />
        <span style={{ color: '#475569', fontSize: 12 }}>–</span>
        <input type="date" value={dateRange.to}
          onChange={e => setDateRange({ ...dateRange, to: e.target.value })} style={inputStyle} />
      </div>

      <div style={{ marginLeft: 'auto', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", fontSize: 11, color: '#475569' }}>
        {filteredCount !== totalCount ? (
          <span><span style={{ color: '#f1f5f9', fontWeight: 700 }}>{filteredCount}</span> / {totalCount} ratings</span>
        ) : (
          <span style={{ color: '#f1f5f9', fontWeight: 700 }}>{totalCount} total ratings</span>
        )}
      </div>
    </div>
  );
}

// ─── KPI Cards ────────────────────────────────────────────────────────────────

function KpiCard({ icon, label, value, sub, accent }: { icon: React.ReactNode; label: string; value: string | number; sub?: string; accent: string }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.07)`,
      borderRadius: 16, padding: '20px 24px', position: 'relative', overflow: 'hidden',
    }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${accent}, transparent)` }} />
      <div style={{ display: 'inline-flex', padding: '8px', background: `${accent}18`, borderRadius: 10, color: accent, marginBottom: 14 }}>
        {icon}
      </div>
      <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: 6, fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace" }}>{label}</p>
      <p style={{ fontSize: 28, fontWeight: 800, color: '#f8fafc', lineHeight: 1, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
        {value}
        {sub && <span style={{ fontSize: 13, fontWeight: 400, color: '#64748b', marginLeft: 4 }}>{sub}</span>}
      </p>
    </div>
  );
}

// ─── Weekly Heatmap ───────────────────────────────────────────────────────────

function WeeklyHeatmap({ ratings }: { ratings: Rating[] }) {
  const weekDates = useMemo(() => {
    const dates = [...new Set(ratings.map(r => r.mealDate ?? '').filter(Boolean))].sort();
    return dates.slice(-7);
  }, [ratings]);

  const heatmap = useMemo(() => buildHeatmapData(ratings, weekDates), [ratings, weekDates]);

  if (!weekDates.length) return null;

  return (
    <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24, marginBottom: 28 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ display: 'inline-flex', padding: 8, background: 'rgba(99,102,241,0.15)', borderRadius: 10, color: '#818cf8' }}>
          <BarChart3 size={18} />
        </div>
        <div>
          <h3 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: 15, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Weekly Rating Heatmap</h3>
          <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Last 7 service days · Avg rating per slot</p>
        </div>
        {/* Legend */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          {['Poor', 'Avg', 'Good', 'Great'].map((l, i) => {
            const colors = ['rgba(244,63,94,0.35)', 'rgba(245,158,11,0.35)', 'rgba(16,185,129,0.25)', 'rgba(16,185,129,0.45)'];
            return (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 10, height: 10, borderRadius: 2, background: colors[i] }} />
                <span style={{ fontSize: 10, color: '#64748b', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace" }}>{l}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ borderCollapse: 'collapse', width: '100%', tableLayout: 'fixed', minWidth: 420 }}>
          <thead>
            <tr>
              <th style={{ width: 90, padding: '0 0 10px', textAlign: 'left', fontSize: 10, color: '#475569', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Meal</th>
              {weekDates.map(d => (
                <th key={d} style={{ padding: '0 4px 10px', textAlign: 'center', fontSize: 10, color: '#94a3b8', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", fontWeight: 500 }}>
                  <div>{dateToDayName(d).slice(0, 3).toUpperCase()}</div>
                  <div style={{ color: '#475569', marginTop: 2 }}>{new Date(d).getDate()}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {MEALS.map(meal => (
              <tr key={meal}>
                <td style={{ paddingBottom: 6, paddingRight: 12 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 6, background: MEAL_COLORS[meal].bg, color: MEAL_COLORS[meal].text, fontSize: 11, fontWeight: 600, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                    {MEAL_ICONS[meal]} {meal}
                  </div>
                </td>
                {weekDates.map(d => {
                  const cell = heatmap[d]?.[meal];
                  const avg = cell?.avg ?? null;
                  const count = cell?.count ?? 0;
                  return (
                    <td key={d} style={{ padding: '0 4px 6px', textAlign: 'center' }}>
                      <div title={avg !== null ? `${avg.toFixed(1)} ★ (${count} ratings)` : 'No data'}
                        style={{
                          borderRadius: 8, padding: '8px 4px',
                          background: heatmapBg(avg),
                          border: `1px solid ${avg !== null ? `${ratingColor(avg)}30` : 'rgba(255,255,255,0.04)'}`,
                          transition: 'all 0.2s', minHeight: 46, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
                        }}>
                        {avg !== null ? (
                          <>
                            <span style={{ fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", fontSize: 13, fontWeight: 700, color: ratingColor(avg) }}>{avg.toFixed(1)}</span>
                            <span style={{ fontSize: 9, color: '#64748b' }}>{count}r</span>
                          </>
                        ) : (
                          <Minus size={12} color="#1e293b" />
                        )}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Timeline View ────────────────────────────────────────────────────────────

function TimelineView({ dateGroups, onSelect }: { dateGroups: DateGroup[]; onSelect: (r: Rating) => void }) {
  const [expandedDates, setExpandedDates] = useState<Set<string>>(new Set([dateGroups[0]?.date ?? '']));
  const [expandedMeals, setExpandedMeals] = useState<Set<string>>(new Set());

  const toggleDate = useCallback((date: string) => {
    setExpandedDates(prev => {
      const n = new Set(prev);
      n.has(date) ? n.delete(date) : n.add(date);
      return n;
    });
  }, []);

  const toggleMeal = useCallback((key: string) => {
    setExpandedMeals(prev => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  }, []);

  if (!dateGroups.length) {
    return (
      <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569' }}>
        <Clock size={40} style={{ margin: '0 auto 16px', opacity: 0.2 }} />
        <p style={{ fontSize: 14 }}>No ratings match the current filters.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {dateGroups.map(({ date, day, meals }) => {
        const dateOpen = expandedDates.has(date);
        const allRatings = meals.flatMap(m => m.items);
        const dateAvg = avgOf(allRatings);

        return (
          <div key={date} style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, overflow: 'hidden', background: 'rgba(255,255,255,0.015)' }}>
            {/* Date header */}
            <button onClick={() => toggleDate(date)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 14,
              padding: '14px 20px', background: 'none', border: 'none', cursor: 'pointer',
              textAlign: 'left',
            }}>
              <Calendar size={15} color="#64748b" style={{ flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: 14, fontWeight: 700, color: '#f1f5f9' }}>
                  {day}
                </span>
                <span style={{ fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", fontSize: 11, color: '#64748b', marginLeft: 10 }}>
                  {formatDate(date)}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 6 }}>
                <span style={{ fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", fontSize: 11, color: '#64748b' }}>{allRatings.length} ratings</span>
                {dateAvg > 0 && <RatingPill value={dateAvg} />}
                <div style={{ display: 'flex', gap: 6 }}>
                  {meals.map(m => (
                    <div key={m.meal} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, background: MEAL_COLORS[m.meal].bg, color: MEAL_COLORS[m.meal].text, fontSize: 10, fontWeight: 600, border: `1px solid ${MEAL_COLORS[m.meal].border}` }}>
                      {MEAL_ICONS[m.meal]} {m.avg > 0 ? m.avg.toFixed(1) : '—'}
                    </div>
                  ))}
                </div>
              </div>
              <ChevronDown size={16} color="#64748b" style={{ transition: 'transform 0.2s', transform: dateOpen ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0 }} />
            </button>

            {dateOpen && (
              <div style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {meals.map(group => {
                  const mealOpen = expandedMeals.has(group.key);
                  const mc = MEAL_COLORS[group.meal];
                  return (
                    <div key={group.key} style={{ border: `1px solid ${mc.border}`, borderRadius: 10, overflow: 'hidden', background: `${mc.bg}` }}>
                      <button onClick={() => toggleMeal(group.key)} style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left',
                      }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: mc.text, fontSize: 12, fontWeight: 700, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                          {MEAL_ICONS[group.meal]} {group.meal}
                        </span>
                        <span style={{ fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", fontSize: 11, color: '#64748b' }}>{group.items.length} resp.</span>
                        {group.avg > 0 && <RatingPill value={group.avg} />}
                        <ChevronDown size={14} color="#64748b" style={{ marginLeft: 'auto', transition: 'transform 0.2s', transform: mealOpen ? 'rotate(180deg)' : 'rotate(0deg)' }} />
                      </button>

                      {mealOpen && (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10, padding: '8px 12px 14px' }}>
                          {group.items.map(rating => (
                            <div key={rating.id} onClick={() => onSelect(rating)}
                              style={{
                                background: 'rgba(0,0,0,0.25)', borderRadius: 10, padding: '12px 14px',
                                border: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer',
                                transition: 'border-color 0.2s, transform 0.15s',
                              }}
                              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = mc.border; (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)'; }}
                              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'none'; }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                  <div style={{ width: 28, height: 28, borderRadius: '50%', background: `${mc.bg}`, border: `1px solid ${mc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: mc.text, fontSize: 12, fontWeight: 700, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", flexShrink: 0 }}>
                                    {rating.userName?.charAt(0)?.toUpperCase() ?? '?'}
                                  </div>
                                  <p style={{ fontSize: 12, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{rating.userName}</p>
                                </div>
                                <RatingPill value={rating.averageRating} />
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <span style={{ fontSize: 10, color: '#64748b', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace" }}>Staff {rating.staffBehaviorRating}/5</span>
                                <span style={{ fontSize: 10, color: '#64748b', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace" }}>Hygiene {rating.hygieneRating}/5</span>
                                <ChevronRight size={11} color="#475569" />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Meal Performance View ────────────────────────────────────────────────────

function MealPerformanceView({ ratings }: { ratings: Rating[] }) {
  const itemPerf = useMemo(() => buildItemPerformance(ratings), [ratings]);

  const mealStats = useMemo(() => {
    return MEALS.map(meal => {
      const mealRatings = ratings.filter(r => r.mealName === meal && (r.averageRating ?? 0) > 0);
      const avg = mealRatings.length ? mealRatings.reduce((s, r) => s + (r.averageRating ?? 0), 0) / mealRatings.length : 0;
      const staffAvg = mealRatings.length ? mealRatings.reduce((s, r) => s + (r.staffBehaviorRating ?? 0), 0) / mealRatings.length : 0;
      const hygieneAvg = mealRatings.length ? mealRatings.reduce((s, r) => s + (r.hygieneRating ?? 0), 0) / mealRatings.length : 0;
      return { meal, avg, staffAvg, hygieneAvg, count: mealRatings.length };
    });
  }, [ratings]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Meal stat cards — one per meal, all metrics grouped inside */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
        {mealStats.map(({ meal, avg, staffAvg, hygieneAvg, count }) => {
          const mc = MEAL_COLORS[meal];
          const score = ratingColor(avg);
          return (
            <div key={meal} style={{
              background: 'rgba(255,255,255,0.02)', border: `1px solid ${mc.border}`,
              borderRadius: 16, padding: '20px 22px', position: 'relative', overflow: 'hidden',
            }}>
              {/* Top accent strip */}
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(90deg, ${mc.text}, transparent)` }} />

              {/* Meal label */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 10px', borderRadius: 20, background: mc.bg, color: mc.text, fontSize: 12, fontWeight: 700 }}>
                  {MEAL_ICONS[meal]} {meal}
                </div>
                <span style={{ fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", fontSize: 10, color: '#475569' }}>{count} resp.</span>
              </div>

              {/* Big overall score */}
              <div style={{ marginBottom: 18 }}>
                <p style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.09em', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", margin: '0 0 6px' }}>Overall</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 34, fontWeight: 800, color: avg > 0 ? score : '#334155', lineHeight: 1, fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace" }}>
                    {avg > 0 ? avg.toFixed(1) : '—'}
                  </span>
                  {avg > 0 && <span style={{ fontSize: 12, color: '#475569' }}>/5</span>}
                </div>
                {avg > 0 && (
                  <div style={{ marginTop: 8, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${(avg / 5) * 100}%`, height: '100%', background: score, borderRadius: 2, transition: 'width 0.6s ease' }} />
                  </div>
                )}
              </div>

              {/* Staff + Hygiene sub-metrics */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 14 }}>
                {([
                  { label: 'Staff',   value: staffAvg,   color: '#60a5fa' },
                  { label: 'Hygiene', value: hygieneAvg, color: '#a78bfa' },
                ] as const).map(({ label, value, color }) => (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 11, color: '#64748b', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace" }}>{label}</span>
                      <span style={{ fontSize: 11, fontWeight: 700, color: avg > 0 ? color : '#334155', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace" }}>
                        {avg > 0 ? value.toFixed(1) : '—'}
                      </span>
                    </div>
                    <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ width: avg > 0 ? `${(value / 5) * 100}%` : '0%', height: '100%', background: color, borderRadius: 2, opacity: 0.8, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Item performance table */}
      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 24 }}>
        <h3 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: 14, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20 }}>Menu Item Rankings</h3>
        {itemPerf.length === 0 ? (
          <p style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: '32px 0' }}>No item rating data available.</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 10 }}>
            {itemPerf.map((item, idx) => (
              <div key={item.name} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)',
              }}>
                <span style={{ fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", fontSize: 11, color: '#334155', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>#{idx + 1}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <StarRow value={item.avg} />
                    <span style={{ fontSize: 10, color: '#64748b', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace" }}>{item.count} reviews</span>
                  </div>
                </div>
                <RatingPill value={item.avg} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── User Analytics View ──────────────────────────────────────────────────────

function UserAnalyticsView({ ratings }: { ratings: Rating[] }) {
  const userStats = useMemo(() => buildUserStats(ratings), [ratings]);
  const anomalies = userStats.filter(u => u.anomaly);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {anomalies.length > 0 && (
        <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 14, padding: '16px 20px', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
          <AlertTriangle size={18} color="#f59e0b" style={{ flexShrink: 0, marginTop: 1 }} />
          <div>
            <p style={{ fontWeight: 700, color: '#fbbf24', fontSize: 13, margin: '0 0 4px', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
              {anomalies.length} anomalous rating pattern{anomalies.length > 1 ? 's' : ''} detected
            </p>
            <p style={{ fontSize: 12, color: '#92400e', margin: 0 }}>
              Users with extreme averages (&lt;1.5 or &gt;4.9) or high rating variance may indicate outliers or bias.
              Review: <strong style={{ color: '#fbbf24' }}>{anomalies.map(u => u.name).join(', ')}</strong>
            </p>
          </div>
        </div>
      )}

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Users size={16} color="#64748b" />
          <span style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: 14, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>User Feedback Summary</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                {['User', 'Ratings', 'Avg Rating', 'Staff', 'Hygiene', 'Variance', 'Flag'].map(col => (
                  <th key={col} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 10, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", fontWeight: 600 }}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {userStats.map((u, i) => {
                const userRatings = ratings.filter(r => (r.userEmail ?? r.userName) === (u.email ?? u.name));
                const staffAvg = userRatings.length ? userRatings.reduce((s, r) => s + (r.staffBehaviorRating ?? 0), 0) / userRatings.length : 0;
                const hygAvg = userRatings.length ? userRatings.reduce((s, r) => s + (r.hygieneRating ?? 0), 0) / userRatings.length : 0;
                return (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: u.anomaly ? 'rgba(245,158,11,0.04)' : 'transparent' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8', fontSize: 12, fontWeight: 700, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", flexShrink: 0 }}>
                          {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>{u.name}</p>
                          {u.email && <p style={{ fontSize: 10, color: '#475569', margin: 0, fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace" }}>{u.email}</p>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", fontSize: 13, color: '#94a3b8', fontWeight: 700 }}>{u.count}</td>
                    <td style={{ padding: '12px 16px' }}>{u.avg > 0 ? <RatingPill value={u.avg} /> : <span style={{ color: '#475569', fontSize: 12 }}>—</span>}</td>
                    <td style={{ padding: '12px 16px', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", fontSize: 12, color: '#64748b' }}>{staffAvg > 0 ? staffAvg.toFixed(1) : '—'}</td>
                    <td style={{ padding: '12px 16px', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", fontSize: 12, color: '#64748b' }}>{hygAvg > 0 ? hygAvg.toFixed(1) : '—'}</td>
                    <td style={{ padding: '12px 16px', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", fontSize: 12, color: u.variance > 1.5 ? '#f59e0b' : '#475569' }}>{u.variance}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {u.anomaly ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 12, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontSize: 10, fontWeight: 700, border: '1px solid rgba(245,158,11,0.25)', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace" }}>
                          <AlertTriangle size={9} /> ANOMALY
                        </span>
                      ) : (
                        <span style={{ fontSize: 10, color: '#1e293b', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace" }}>—</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

function RatingDetailModal({ rating, onClose }: { rating: Rating; onClose: () => void }) {
  const mc = MEAL_COLORS[(rating.mealName as MealType) ?? 'Breakfast'] ?? MEAL_COLORS.Breakfast;
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16, background: 'rgba(2,6,23,0.85)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.15s ease',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#0f172a', borderRadius: 20, width: '100%', maxWidth: 500,
        border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
        overflow: 'hidden', maxHeight: '90vh', display: 'flex', flexDirection: 'column',
      }}>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
          <div>
            <h3 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: 17, fontWeight: 800, color: '#f1f5f9', margin: '0 0 3px' }}>Feedback Details</h3>
            <p style={{ fontSize: 11, color: '#64748b', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", margin: 0 }}>
              {new Date(rating.timestamp).toLocaleString('en-IN')}
            </p>
          </div>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 8px', cursor: 'pointer', color: '#94a3b8', display: 'flex', lineHeight: 1 }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '24px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 22 }}>
          {/* User info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 46, height: 46, borderRadius: '50%', background: mc.bg, border: `1px solid ${mc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: mc.text, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", flexShrink: 0 }}>
              {rating.userName?.charAt(0)?.toUpperCase() ?? '?'}
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, fontSize: 15, color: '#f1f5f9', margin: '0 0 2px', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{rating.userName}</p>
              {rating.userEmail && <p style={{ fontSize: 11, color: '#64748b', margin: 0, fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace" }}>{rating.userEmail}</p>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", marginBottom: 4 }}>Meal</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, background: mc.bg, border: `1px solid ${mc.border}`, color: mc.text, fontSize: 12, fontWeight: 700, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
                {MEAL_ICONS[rating.mealName as MealType ?? 'Breakfast']} {rating.mealName}
              </div>
            </div>
          </div>

          {/* Overall score */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 12, padding: '14px 18px' }}>
            <div>
              <p style={{ fontSize: 11, color: '#92400e', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", marginBottom: 2 }}>Overall Experience</p>
              <StarRow value={rating.averageRating ?? 0} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <RatingPill value={rating.averageRating} size="lg" />
              {rating.averageRating != null && <p style={{ fontSize: 10, color: '#92400e', marginTop: 4, fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace" }}>{ratingLabel(rating.averageRating ?? 0)}</p>}
            </div>
          </div>

          {/* Item ratings */}
          {rating.itemRatings && Object.keys(rating.itemRatings).length > 0 && (
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#64748b', marginBottom: 12, fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", display: 'flex', alignItems: 'center', gap: 6 }}>
                <Pizza size={12} /> Item Breakdown
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Object.entries(rating.itemRatings).map(([item, score]) => {
                  const n = Number(score);
                  const color = ratingColor(n);
                  return (
                    <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ width: 130, fontSize: 13, color: '#cbd5e1', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>{item}</span>
                      <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${(n / 5) * 100}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
                      <span style={{ fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", fontSize: 12, color, fontWeight: 700, minWidth: 20, textAlign: 'right' }}>{score}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Staff + Hygiene */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {([
              { label: 'Staff Behavior', value: rating.staffBehaviorRating, icon: <Heart size={14} />, color: '#60a5fa' },
              { label: 'Hygiene', value: rating.hygieneRating, icon: <ShieldCheck size={14} />, color: '#a78bfa' },
            ] as const).map(({ label, value, icon, color }) => (
              <div key={label} style={{ background: `${color}0d`, border: `1px solid ${color}25`, borderRadius: 10, padding: '14px 16px', textAlign: 'center' }}>
                <div style={{ color, marginBottom: 8, display: 'flex', justifyContent: 'center' }}>{icon}</div>
                <p style={{ fontSize: 10, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 4, fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace" }}>{label}</p>
                <p style={{ fontSize: 24, fontWeight: 800, color, fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", margin: 0 }}>
                  {value}<span style={{ fontSize: 12, color: '#475569' }}>/5</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Ratings({ liveRatings }: RatingsProps) {
  const [activeTab, setActiveTab] = useState<TabId>('timeline');
  const [selectedRatingId, setSelectedRatingId] = useState<string | null>(null);
  const selectedRating = useMemo(
    () => liveRatings.find(r => r.id === selectedRatingId) ?? null,
    [selectedRatingId, liveRatings]
  );
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [selectedMeals, setSelectedMeals] = useState<MealType[]>([...MEALS]);
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({ from: '', to: '' });

  const toggleMeal = useCallback((m: MealType) => {
    setSelectedMeals(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  }, []);

  const availableMonths = useMemo(() => {
    const months = [...new Set(liveRatings.map(r => getMonthKey(r.mealDate ?? '')).filter(Boolean))].sort().reverse();
    return months;
  }, [liveRatings]);

  const filteredRatings = useMemo(() => {
    return liveRatings.filter(r => {
      if (selectedMonth && !r.mealDate?.startsWith(selectedMonth)) return false;
      if (!selectedMeals.includes(r.mealName as MealType)) return false;
      if (dateRange.from && (r.mealDate ?? '') < dateRange.from) return false;
      if (dateRange.to && (r.mealDate ?? '') > dateRange.to) return false;
      return true;
    });
  }, [liveRatings, selectedMonth, selectedMeals, dateRange]);

  const dateGroups = useMemo(() => buildDateGroups(filteredRatings), [filteredRatings]);

  const averages = useMemo(() => {
    const valid = filteredRatings.filter(r => (r.averageRating ?? 0) > 0);
    if (!valid.length) return { overall: '—', staff: '—', hygiene: '—' };
    const n = valid.length;
    return {
      overall: (valid.reduce((s, r) => s + (r.averageRating ?? 0), 0) / n).toFixed(1),
      staff:   (valid.reduce((s, r) => s + (r.staffBehaviorRating ?? 0), 0) / n).toFixed(1),
      hygiene: (valid.reduce((s, r) => s + (r.hygieneRating ?? 0), 0) / n).toFixed(1),
    };
  }, [filteredRatings]);

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'timeline',    label: 'Timeline',        icon: <Clock size={14} />     },
    { id: 'performance', label: 'Meal Performance', icon: <BarChart3 size={14} /> },
    { id: 'users',       label: 'User Analytics',   icon: <Users size={14} />     },
  ];

  return (
    <>
      {/* Fonts */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
      `}</style>

      <div style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: '#f1f5f9', padding: '0', minHeight: '100%' }}>

        {/* Page Header */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
              <div style={{ display: 'inline-flex', padding: 8, background: 'rgba(245,158,11,0.15)', borderRadius: 10, color: '#fbbf24' }}>
                <Star size={18} style={{ fill: '#fbbf24' }} />
              </div>
              <h1 style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: 24, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', color: '#f8fafc' }}>
                Ratings Dashboard
              </h1>
            </div>
            <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>
              Feedback analytics for mess meals · {liveRatings.length} total responses
              {selectedMonth && ` · ${new Date(selectedMonth + '-01').toLocaleString('en-IN', { month: 'long', year: 'numeric' })}`}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10 }}>
            <Database size={13} color="#10b981" />
            <span style={{ fontSize: 11, fontWeight: 700, color: '#10b981', fontFamily: "ui-monospace, 'SF Mono', 'Fira Code', monospace", textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live</span>
          </div>
        </div>

        {/* KPI Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 28 }}>
          <KpiCard icon={<Star size={18} style={{ fill: '#fbbf24' }} />}  label="Overall Rating" value={averages.overall} sub="/ 5.0" accent="#f59e0b" />
          <KpiCard icon={<Pizza size={18} />}      label="Total Responses" value={filteredRatings.length} accent="#60a5fa" />
          <KpiCard icon={<Heart size={18} />}       label="Staff Score"     value={averages.staff}   sub="/ 5.0" accent="#f472b6" />
          <KpiCard icon={<ShieldCheck size={18} />} label="Hygiene Score"   value={averages.hygiene} sub="/ 5.0" accent="#a78bfa" />
        </div>

        {/* Heatmap */}
        <WeeklyHeatmap ratings={filteredRatings} />

        {/* Filter Bar */}
        <FilterBar
          months={availableMonths}
          selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
          selectedMeals={selectedMeals} toggleMeal={toggleMeal}
          dateRange={dateRange} setDateRange={setDateRange}
          totalCount={liveRatings.length} filteredCount={filteredRatings.length}
        />

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', width: 'fit-content' }}>
          {tabs.map(tab => {
            const active = activeTab === tab.id;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
                fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", fontSize: 13, fontWeight: 600,
                background: active ? '#1e293b' : 'transparent',
                color: active ? '#f1f5f9' : '#64748b',
                boxShadow: active ? '0 1px 6px rgba(0,0,0,0.3)' : 'none',
                transition: 'all 0.2s',
              }}>
                <span style={{ color: active ? '#f59e0b' : '#475569' }}>{tab.icon}</span>
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div>
          {activeTab === 'timeline' && <TimelineView dateGroups={dateGroups} onSelect={r => setSelectedRatingId(r.id)} />}
          {activeTab === 'performance' && <MealPerformanceView ratings={filteredRatings} />}
          {activeTab === 'users' && <UserAnalyticsView ratings={filteredRatings} />}
        </div>

      </div>

      {/* Detail Modal */}
      {selectedRating && <RatingDetailModal rating={selectedRating} onClose={() => setSelectedRatingId(null)} />}
    </>
  );
}
