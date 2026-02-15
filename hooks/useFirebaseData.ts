
import { useState, useEffect, useRef } from 'react';
import { db, rtdb } from '../lib/firebase';
import { Complaint, Rating, User, Activity, DailyStats } from '../types';
import { getActiveMealForDashboard, MEAL_ORDER, MealType } from '../lib/menuUtils';

export function useFirebaseData(userId: string | null) {
  // Live RSVP counts for the active meal/date
  const [attendanceCount, setAttendanceCount] = useState(0);
  const [attendanceUserIds, setAttendanceUserIds] = useState<string[]>([]);
  const [attendanceByMeal, setAttendanceByMeal] = useState<{ Breakfast: number; Lunch: number; Dinner: number }>({ Breakfast: 0, Lunch: 0, Dinner: 0 });
  const [activeMealInfo, setActiveMealInfo] = useState<{ meal: MealType; isLive: boolean; date: string; isTomorrow: boolean }>(() => {
    const fallback = getActiveMealForDashboard();
    return fallback;
  });
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [adminCount, setAdminCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);
  const loadedRef = useRef({ complaints: false, ratings: false, users: false, attendance: false, admins: false });

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    loadedRef.current = { complaints: false, ratings: false, users: false, attendance: false, admins: false };

    const checkAllLoaded = () => {
      if (Object.values(loadedRef.current).every(Boolean)) setLoading(false);
    };

    // Helper: given an attendance node at attendance/{date}/{meal},
    // return ONLY the userIds that are explicitly "yes".
    //
    // Rules:
    // - If value has an explicit boolean flag (`attending` or `present`), use that.
    // - Else if the value itself is boolean, use that.
    // - Else (legacy: stored as bare `true` or some truthy value), treat presence as YES.
    // - Explicit `false` (or `attending:false` / `present:false`) is treated as NO and excluded.
    const extractYesUserIds = (raw: any): string[] => {
      if (!raw || typeof raw !== 'object') return [];
      const yesIds: string[] = [];
      Object.entries(raw).forEach(([uid, value]) => {
        let flag: boolean | null = null;
        if (value && typeof value === 'object') {
          const v: any = value;
          if (typeof v.attending === 'boolean') {
            flag = v.attending;
          } else if (typeof v.present === 'boolean') {
            flag = v.present;
          }
        } else if (typeof value === 'boolean') {
          flag = value;
        }

        if (flag === null) {
          // No explicit boolean flag; treat any stored value as a positive RSVP.
          flag = true;
        }
        if (flag) yesIds.push(uid);
      });
      return yesIds;
    };

    // 1. Determine active meal/date strictly from RTDB attendance (chronological), and wire live listeners.
    let attendanceRef: firebase.database.Reference | null = null;
    let onAttendanceValue: ((snapshot: firebase.database.DataSnapshot) => void) | null = null;
    const mealRefs: firebase.database.Reference[] = [];

    (async () => {
      const todayStr = new Date().toISOString().split('T')[0];

      try {
        // Latest attendance date (by key) and last meal on that date.
        const [lastSnap, historySnap] = await Promise.all([
          rtdb.ref('attendance').orderByKey().limitToLast(1).once('value'),
          rtdb.ref('attendance').orderByKey().limitToLast(7).once('value'),
        ]);

        let activeMeal: MealType;
        let activeDate: string;
        let isLive = false;
        let isTomorrow = false;

        const lastVal = lastSnap.val();
        if (lastVal && typeof lastVal === 'object') {
          const [dateKey, dayNode] = Object.entries(lastVal)[0] as [string, any];
          activeDate = dateKey;
          let lastMeal: MealType | null = null;
          MEAL_ORDER.forEach(meal => {
            if (dayNode && dayNode[meal]) {
              lastMeal = meal;
            }
          });
          activeMeal = lastMeal ?? 'Breakfast';
          isLive = activeDate === todayStr;
          isTomorrow = activeDate > todayStr;
        } else {
          // Fallback to time-based helper if no attendance yet.
          const fallback = getActiveMealForDashboard();
          activeMeal = fallback.meal;
          activeDate = fallback.date;
          isLive = fallback.isLive;
          isTomorrow = fallback.isTomorrow;
        }

        setActiveMealInfo({ meal: activeMeal, isLive, date: activeDate, isTomorrow });

        // Chronological last 7 attendance days for chart.
        const historyVal = historySnap.val();
        if (historyVal && typeof historyVal === 'object') {
          const entries = Object.entries(historyVal) as [string, any][];
          entries.sort((a, b) => a[0].localeCompare(b[0])); // ascending by date key

          const historyData: DailyStats[] = entries.map(([date, dayNode]) => {
            let total = 0;
            const breakdown: Record<string, number> = { Breakfast: 0, Lunch: 0, Dinner: 0 };
            MEAL_ORDER.forEach(meal => {
              const yesIds = extractYesUserIds(dayNode?.[meal]);
              breakdown[meal] = yesIds.length;
              total += yesIds.length;
            });
            return { date: date.slice(5), total, Breakfast: breakdown.Breakfast, Lunch: breakdown.Lunch, Dinner: breakdown.Dinner };
          });
          setDailyStats(historyData);
        } else {
          setDailyStats([]);
        }

        // Live Attendance Count & per-meal counts for the resolved active date.
        attendanceRef = rtdb.ref(`attendance/${activeDate}/${activeMeal}`);
        onAttendanceValue = (snapshot: firebase.database.DataSnapshot) => {
          const raw = snapshot.val();
          const yesIds = extractYesUserIds(raw);
          setAttendanceCount(yesIds.length);
          setAttendanceUserIds(yesIds);
          loadedRef.current.attendance = true;
          checkAllLoaded();
        };
        attendanceRef.on('value', onAttendanceValue);

        MEAL_ORDER.forEach(meal => {
          const mealRef = rtdb.ref(`attendance/${activeDate}/${meal}`);
          mealRefs.push(mealRef);
          mealRef.on('value', (snapshot) => {
            const raw = snapshot.val();
            const yesIds = extractYesUserIds(raw);
            setAttendanceByMeal(prev => ({ ...prev, [meal]: yesIds.length }));
          });
        });
      } catch (e) {
        console.error("Error initializing attendance from RTDB:", e);
        // In case of error, at least mark attendance as loaded so the UI doesn't hang.
        loadedRef.current.attendance = true;
        checkAllLoaded();
      }
    })();

    // 3. Complaints from Firestore - handle missing timestamp (sort client-side if needed)
    const setupComplaints = () => {
      const q = db.collection("complaints").limit(100);
      return q.onSnapshot((snapshot) => {
        const items = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            userName: d.userName ?? 'Unknown',
            userEmail: d.userEmail ?? '',
            userId: d.userId ?? '',
            complaintText: d.complaintText ?? '',
            category: d.category ?? 'Other',
            status: d.status ?? 'Pending',
            timestamp: typeof d.timestamp === 'number' ? d.timestamp : (d.createdAt ?? Date.now()),
            updatedAt: typeof d.updatedAt === 'number' ? d.updatedAt : Date.now()
          } as Complaint;
        });
        const sorted = items.sort((a, b) => b.timestamp - a.timestamp);
        setComplaints(sorted);
        loadedRef.current.complaints = true;
        checkAllLoaded();
      }, (error) => {
        console.warn("Error fetching complaints. Add your UID to Firestore 'admins' collection to manage all complaints.", error.message);
        loadedRef.current.complaints = true;
        checkAllLoaded();
      });
    };
    const unsubscribeComplaints = setupComplaints();

    // 4. Ratings from Firestore - handle missing timestamp
    const setupRatings = () => {
      const q = db.collection("mealRatings").limit(100);
      return q.onSnapshot((snapshot) => {
        const items = snapshot.docs.map(doc => {
          const data = doc.data();
          let calculatedAvg = Number(data.averageRating);
          if (isNaN(calculatedAvg) || calculatedAvg === 0) {
            const itemValues = Object.values(data.itemRatings || {}).map(v => Number(v)).filter(n => !isNaN(n) && n > 0);
            calculatedAvg = itemValues.length > 0 ? parseFloat((itemValues.reduce((a, b) => a + b, 0) / itemValues.length).toFixed(1)) : 0;
          }
          const ts = typeof data.timestamp === 'number' ? data.timestamp : (data.createdAt ?? Date.now());
          return { id: doc.id, ...data, averageRating: calculatedAvg, timestamp: ts } as Rating;
        });
        const sorted = items.sort((a, b) => b.timestamp - a.timestamp);
        setRatings(sorted);
        loadedRef.current.ratings = true;
        checkAllLoaded();
      }, (error) => {
        console.error("Error fetching ratings:", error);
        loadedRef.current.ratings = true;
        checkAllLoaded();
      });
    };
    const unsubscribeRatings = setupRatings();

    // 5. Users from Realtime Database
    const usersRef = rtdb.ref('users');
    const onUsersValue = usersRef.on('value', (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const mappedUsers: User[] = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          name: value.displayName ?? value.name ?? 'Unknown User',
          email: value.email ?? 'No Email',
          totalRSVPs: value.totalRSVPs ?? value.totalRsvps ?? 0,
          totalRatings: value.totalRatings ?? 0,
          totalComplaints: value.totalComplaints ?? 0,
          lastActive: value.lastActive ?? value.lastSignIn ?? new Date().toISOString()
        }));
        setUsers(mappedUsers);
      } else {
        setUsers([]);
      }
      loadedRef.current.users = true;
      checkAllLoaded();
    }, (error) => {
      console.error("Error fetching users from RTDB:", error);
      loadedRef.current.users = true;
      checkAllLoaded();
    });

    // 6. Admin count from Firestore
    db.collection("admins").get().then(snap => {
      setAdminCount(snap.size);
      loadedRef.current.admins = true;
      checkAllLoaded();
    }).catch(() => {
      loadedRef.current.admins = true;
      checkAllLoaded();
    });

    return () => {
      if (attendanceRef && onAttendanceValue) {
        attendanceRef.off('value', onAttendanceValue);
      }
      mealRefs.forEach(ref => ref.off('value'));
      usersRef.off('value', onUsersValue);
      unsubscribeComplaints();
      unsubscribeRatings();
    };
  }, [userId]);

  // Combine Complaints and Ratings into a unified Activity Feed
  useEffect(() => {
    const complaintActivities: Activity[] = complaints.map(c => ({
      id: `act_c_${c.id}`,
      userName: c.userName,
      type: 'Complaint',
      detail: `Reported: ${c.category} - ${c.status}`,
      timestamp: c.timestamp
    }));

    const ratingActivities: Activity[] = ratings.map(r => ({
      id: `act_r_${r.id}`,
      userName: r.userName,
      type: 'Rating',
      detail: `Rated ${r.mealName}: ${r.averageRating}/5`,
      timestamp: r.timestamp
    }));

    const merged = [...complaintActivities, ...ratingActivities]
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);

    setRecentActivities(merged);
  }, [complaints, ratings]);

  return { 
    attendanceCount, 
    attendanceByMeal, 
    attendanceUserIds,
    activeMealInfo, 
    complaints, 
    ratings, 
    users, 
    adminCount, 
    recentActivities, 
    dailyStats, 
    loading 
  };
}
