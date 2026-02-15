
export type MealType = 'Breakfast' | 'Lunch' | 'Dinner';
export type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved';
export type ComplaintCategory = 'Food Quality' | 'Service' | 'Hygiene' | 'Staff Behavior' | 'Other';

export interface User {
  id: string;
  name: string;
  email: string;
  totalRSVPs: number;
  totalRatings: number;
  totalComplaints: number;
  lastActive: string;
}

export interface AttendanceRecord {
  date: string;
  meal: MealType;
  userId: string;
  timestamp: string;
}

export interface Rating {
  id: string;
  userName: string;
  userEmail: string;
  mealName: MealType;
  mealDate: string;
  itemRatings: Record<string, number>;
  staffBehaviorRating: number;
  hygieneRating: number;
  timestamp: number;
  averageRating: number;
}

export interface Complaint {
  id: string;
  userName: string;
  userEmail: string;
  userId: string;
  complaintText: string;
  category: ComplaintCategory;
  status: ComplaintStatus;
  timestamp: number;
  updatedAt: number;
}

export interface Activity {
  id: string;
  userName: string;
  type: 'RSVP' | 'Complaint' | 'Rating' | 'StatusChange';
  detail: string;
  timestamp: number;
}

export interface DailyStats {
  date: string;
  Breakfast: number;
  Lunch: number;
  Dinner: number;
  total: number;
}
