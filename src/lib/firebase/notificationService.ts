
import { collection, getDocs, query, where, orderBy, limit, getDoc, doc, addDoc, Timestamp, setDoc, deleteDoc } from "firebase/firestore";
import { ref, onValue, off, get, set, push, update, remove } from "firebase/database";
import { db, rtdb, auth } from "./index";
import { Notification } from "./types";

export const fetchUnreadNotifications = async (): Promise<number> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      // Check for demo user
      const isDemo = localStorage.getItem("isAuthenticated") === "true";
      if (isDemo) return 3; // Return demo data
      return 0;
    }
    
    try {
      // Try Firestore first
      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef, 
        where("userId", "==", user.uid),
        where("read", "==", false)
      );
      const snapshot = await getDocs(q);
      
      return snapshot.size;
    } catch (firestoreError) {
      console.error("Error fetching from Firestore:", firestoreError);
      
      // Fall back to Realtime Database
      try {
        const rtdbRef = ref(rtdb, `notifications/${user.uid}`);
        const snapshot = await get(rtdbRef);
        if (!snapshot.exists()) return 0;
        
        const data = snapshot.val();
        const unreadCount = Object.values(data).filter((notif: any) => !notif.read).length;
        return unreadCount;
      } catch (rtdbError) {
        console.error("Error fetching from RTDB:", rtdbError);
        return 0;
      }
    }
  } catch (error) {
    console.error("Error fetching unread notifications:", error);
    return 0;
  }
}

export const fetchNotifications = async (limitCount = 10): Promise<Notification[]> => {
  try {
    const user = auth.currentUser;
    if (!user) {
      // Check for demo user
      const isDemo = localStorage.getItem("isAuthenticated") === "true";
      if (isDemo) {
        // Return demo data
        return getSampleNotifications();
      }
      return [];
    }
    
    try {
      // Try Firestore first
      const notificationsRef = collection(db, "notifications");
      const q = query(
        notificationsRef, 
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(limitCount)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        console.log("No notifications in Firestore, checking RTDB");
        return fetchNotificationsFromRTDB(user.uid, limitCount);
      }
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Notification));
    } catch (firestoreError) {
      console.error("Error fetching from Firestore:", firestoreError);
      return fetchNotificationsFromRTDB(user.uid, limitCount);
    }
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return getSampleNotifications();
  }
}

const fetchNotificationsFromRTDB = async (userId: string, limitCount: number): Promise<Notification[]> => {
  try {
    const rtdbRef = ref(rtdb, `notifications/${userId}`);
    const snapshot = await get(rtdbRef);
    if (!snapshot.exists()) return getSampleNotifications();
    
    const data = snapshot.val();
    if (!data) return [];
    
    // Ensure we have an array
    return Object.entries(data)
      .map(([key, value]: [string, any]) => ({
        id: key,
        ...value
      } as Notification))
      .slice(0, limitCount);
  } catch (rtdbError) {
    console.error("Error fetching from RTDB:", rtdbError);
    return getSampleNotifications();
  }
}

// Sample notification data as fallback
const getSampleNotifications = (): Notification[] => {
  return [
    {
      id: "1",
      title: "New Donation Received",
      message: "Metro Food Bank donated 150kg of rice",
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false
    },
    {
      id: "2",
      title: "New Message",
      message: "John Doe sent you a message",
      createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      read: false
    },
    {
      id: "3",
      title: "Approval Required",
      message: "New farmer registration needs approval",
      createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      read: false
    }
  ];
}

export const markNotificationAsRead = async (id: string): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    try {
      // Try Firestore first
      await setDoc(doc(db, "notifications", id), {
        read: true,
        updatedAt: Timestamp.now()
      }, { merge: true });
      return true;
    } catch (firestoreError) {
      console.error("Error updating in Firestore:", firestoreError);
      
      // Fall back to RTDB
      try {
        await update(ref(rtdb, `notifications/${user.uid}/${id}`), {
          read: true,
          updatedAt: new Date().toISOString()
        });
        return true;
      } catch (rtdbError) {
        console.error("Error updating in RTDB:", rtdbError);
        return false;
      }
    }
  } catch (error) {
    console.error("Error marking notification as read:", error);
    return false;
  }
}

export const deleteNotification = async (id: string): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    try {
      // Try Firestore first
      await deleteDoc(doc(db, "notifications", id));
      return true;
    } catch (firestoreError) {
      console.error("Error deleting from Firestore:", firestoreError);
      
      // Fall back to RTDB
      try {
        await remove(ref(rtdb, `notifications/${user.uid}/${id}`));
        return true;
      } catch (rtdbError) {
        console.error("Error deleting from RTDB:", rtdbError);
        return false;
      }
    }
  } catch (error) {
    console.error("Error deleting notification:", error);
    return false;
  }
}

// Subscribe to notifications (real-time)
export const subscribeToNotifications = (callback: (notifications: Notification[]) => void) => {
  const user = auth.currentUser;
  if (!user) return () => {};
  
  const notificationsRef = ref(rtdb, `notifications/${user.uid}`);
  
  onValue(notificationsRef, (snapshot) => {
    const data = snapshot.val();
    const notifications = data ? 
      Object.keys(data).map(key => ({
        id: key,
        ...data[key]
      } as Notification)) : [];
    
    callback(notifications);
  });
  
  // Return unsubscribe function
  return () => off(notificationsRef);
}

// Create a notification (for testing)
export const createNotification = async (title: string, message: string): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    
    try {
      // Try Firestore first
      await addDoc(collection(db, "notifications"), {
        userId: user.uid,
        title,
        message,
        createdAt: Timestamp.now(),
        read: false
      });
      return true;
    } catch (firestoreError) {
      console.error("Error adding to Firestore:", firestoreError);
      
      // Fall back to RTDB
      try {
        const newNotificationRef = push(ref(rtdb, `notifications/${user.uid}`));
        await set(newNotificationRef, {
          title,
          message,
          createdAt: new Date().toISOString(),
          read: false
        });
        return true;
      } catch (rtdbError) {
        console.error("Error adding to RTDB:", rtdbError);
        return false;
      }
    }
  } catch (error) {
    console.error("Error creating notification:", error);
    return false;
  }
}
