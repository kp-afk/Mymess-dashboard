import menuData from '../menu.json';

export interface MealSlot {
  start: string; // HH:MM
  end: string;
  items: string[];
}

export interface DayMenu {
  day: string;
  breakfast: MealSlot;
  lunch: MealSlot;
  dinner: MealSlot;
}

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner';
export const MEAL_ORDER: MealType[] = ['Breakfast', 'Lunch', 'Dinner'];

const menu = menuData as DayMenu[];
const DAY_ORDER = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** Parse HH:MM to minutes since midnight */
function toMinutes(s: string): number {
  const [h, m] = s.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

/** Get today's day name (e.g. "Monday") */
export function getTodayDayName(): string {
  return DAY_ORDER[new Date().getDay()];
}

/** Get menu for a specific day */
export function getMenuForDay(dayName: string): DayMenu | undefined {
  return menu.find(m => m.day === dayName);
}

/** Get menu for a date string YYYY-MM-DD */
export function getMenuForDate(dateStr: string): DayMenu | undefined {
  const d = new Date(dateStr);
  const dayName = DAY_ORDER[d.getDay()];
  return getMenuForDay(dayName);
}

/** Check if current time is within a meal slot */
function isTimeInSlot(nowMinutes: number, slot: MealSlot): boolean {
  const start = toMinutes(slot.start);
  let end = toMinutes(slot.end);
  if (end < start) end += 24 * 60; // next day
  let n = nowMinutes;
  if (n < start && start > 12 * 60) n += 24 * 60;
  return n >= start && n <= end;
}

/** Returns current meal if one is ongoing, null otherwise */
export function getCurrentMeal(): MealType | null {
  const today = getTodayDayName();
  const dayMenu = getMenuForDay(today);
  if (!dayMenu) return null;

  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();

  if (isTimeInSlot(minutes, dayMenu.breakfast)) return 'Breakfast';
  if (isTimeInSlot(minutes, dayMenu.lunch)) return 'Lunch';
  if (isTimeInSlot(minutes, dayMenu.dinner)) return 'Dinner';
  return null;
}

/** Returns next meal info if no meal is ongoing: { meal, isToday } - isToday=false means tomorrow */
export function getNextMealInfo(): { meal: MealType; isToday: boolean } | null {
  if (getCurrentMeal()) return null;

  const today = getTodayDayName();
  const dayMenu = getMenuForDay(today);
  if (!dayMenu) return { meal: 'Breakfast', isToday: false };

  const now = new Date();
  const minutes = now.getHours() * 60 + now.getMinutes();

  const slots: { meal: MealType; start: number }[] = [
    { meal: 'Breakfast' as MealType, start: toMinutes(dayMenu.breakfast.start) },
    { meal: 'Lunch' as MealType, start: toMinutes(dayMenu.lunch.start) },
    { meal: 'Dinner' as MealType, start: toMinutes(dayMenu.dinner.start) },
  ].sort((a, b) => a.start - b.start);

  for (const s of slots) {
    if (minutes < s.start) return { meal: s.meal, isToday: true };
  }
  return { meal: 'Breakfast', isToday: false }; // tomorrow's breakfast
}

/** Get the meal to display on dashboard: current if ongoing, else next. Includes date for fetching attendance. */
export function getActiveMealForDashboard(): { meal: MealType; isLive: boolean; date: string; isTomorrow: boolean } {
  const current = getCurrentMeal();
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  if (current) return { meal: current, isLive: true, date: todayStr, isTomorrow: false };

  const next = getNextMealInfo();
  if (!next) return { meal: 'Breakfast', isLive: false, date: todayStr, isTomorrow: false };
  if (next.isToday) return { meal: next.meal, isLive: false, date: todayStr, isTomorrow: false };

  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  return { meal: next.meal, isLive: false, date: tomorrowStr, isTomorrow: true };
}

/** Sort key for day: 0=Sun, 1=Mon, ... */
export function getDaySortIndex(dayName: string): number {
  const i = DAY_ORDER.indexOf(dayName);
  return i >= 0 ? i : 7;
}

/** Sort key for meal: 0=Breakfast, 1=Lunch, 2=Dinner */
export function getMealSortIndex(meal: string): number {
  const m = meal as MealType;
  const i = MEAL_ORDER.indexOf(m);
  return i >= 0 ? i : 3;
}

/** Parse mealDate (YYYY-MM-DD) to day name */
export function dateToDayName(dateStr: string): string {
  const d = new Date(dateStr);
  return DAY_ORDER[d.getDay()];
}

/** Get full menu (for reference) */
export function getFullMenu(): DayMenu[] {
  return menu;
}
