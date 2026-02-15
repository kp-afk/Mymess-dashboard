
import { User, Complaint, Rating, DailyStats, Activity, MealType, ComplaintCategory, ComplaintStatus } from '../types';

const MEAL_TYPES: MealType[] = ['Breakfast', 'Lunch', 'Dinner'];
const CATEGORIES: ComplaintCategory[] = ['Food Quality', 'Service', 'Hygiene', 'Staff Behavior', 'Other'];
const STATUSES: ComplaintStatus[] = ['Pending', 'In Progress', 'Resolved'];

export const mockUsers: User[] = Array.from({ length: 50 }, (_, i) => ({
  id: `u${i}`,
  name: `User ${i + 1}`,
  email: `user${i + 1}@example.com`,
  totalRSVPs: Math.floor(Math.random() * 100),
  totalRatings: Math.floor(Math.random() * 40),
  totalComplaints: Math.floor(Math.random() * 5),
  lastActive: new Date(Date.now() - Math.random() * 100000000).toISOString()
}));

export const mockComplaints: Complaint[] = Array.from({ length: 15 }, (_, i) => ({
  id: `c${i}`,
  userName: mockUsers[i % mockUsers.length].name,
  userEmail: mockUsers[i % mockUsers.length].email,
  userId: mockUsers[i % mockUsers.length].id,
  complaintText: `Sample complaint message ${i + 1} regarding ${CATEGORIES[i % CATEGORIES.length].toLowerCase()}.`,
  category: CATEGORIES[i % CATEGORIES.length],
  status: STATUSES[i % STATUSES.length],
  timestamp: Date.now() - Math.random() * 500000000,
  updatedAt: Date.now()
}));

export const mockRatings: Rating[] = Array.from({ length: 30 }, (_, i) => ({
  id: `r${i}`,
  userName: mockUsers[i % mockUsers.length].name,
  userEmail: mockUsers[i % mockUsers.length].email,
  mealName: MEAL_TYPES[i % 3],
  mealDate: '2024-02-04',
  itemRatings: { 'Rice': 4, 'Dal': 5, 'Curry': 3 },
  staffBehaviorRating: Math.ceil(Math.random() * 5),
  hygieneRating: Math.ceil(Math.random() * 5),
  timestamp: Date.now() - Math.random() * 10000000,
  averageRating: 4.2
}));

export const mockDailyStats: DailyStats[] = Array.from({ length: 7 }, (_, i) => ({
  date: `2024-02-0${i + 1}`,
  Breakfast: 450 + Math.floor(Math.random() * 50),
  Lunch: 500 + Math.floor(Math.random() * 80),
  Dinner: 480 + Math.floor(Math.random() * 60),
  total: 1400 + Math.floor(Math.random() * 200)
}));

export const initialActivities: Activity[] = [
  { id: 'a1', userName: 'John Doe', type: 'RSVP', detail: 'RSVPed for Lunch', timestamp: Date.now() - 60000 },
  { id: 'a2', userName: 'Sarah Smith', type: 'Complaint', detail: 'Submitted a hygiene complaint', timestamp: Date.now() - 120000 },
  { id: 'a3', userName: 'Michael Ross', type: 'Rating', detail: 'Rated Breakfast 4.5 stars', timestamp: Date.now() - 300000 },
];
