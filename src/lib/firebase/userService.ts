
import { collection, getDocs, query, where, limit, getDoc, doc } from "firebase/firestore";
import { db, auth } from "./index";
import { User } from "./types";

// User related functions
export const fetchUsers = async (limitCount = 10): Promise<User[]> => {
  try {
    // First check if we have a logged in user
    if (auth.currentUser || localStorage.getItem("isAuthenticated") === "true") {
      try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, limit(limitCount));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
          console.log("No users found in Firestore, using sample data");
          return getSampleUsers();
        }
        
        return snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));
      } catch (error) {
        console.error("Error fetching users from Firestore:", error);
        return getSampleUsers();
      }
    } else {
      console.log("No authenticated user, using sample data");
      return getSampleUsers();
    }
  } catch (error) {
    console.error("Error in fetchUsers:", error);
    return getSampleUsers();
  }
}

// Sample user data as fallback
const getSampleUsers = (): User[] => {
  return [
    { id: "USR-001", name: "Juan Dela Cruz", role: "Farmer", location: "Batangas", joinDate: "Jan 15, 2025" },
    { id: "USR-002", name: "Maria Santos", role: "Donor", location: "Manila", joinDate: "Feb 3, 2025" },
    { id: "USR-003", name: "Pedro Garcia", role: "Farmer", location: "Laguna", joinDate: "Mar 20, 2025" },
    { id: "USR-004", name: "Ana Reyes", role: "Admin", location: "Quezon City", joinDate: "Dec 10, 2024" },
  ];
}

export const fetchUserById = async (userId: string): Promise<User | null> => {
  try {
    const userDoc = await getDoc(doc(db, "users", userId));
    if (userDoc.exists()) {
      return {
        id: userDoc.id,
        ...userDoc.data()
      } as User;
    }
    return null;
  } catch (error) {
    console.error("Error fetching user:", error);
    return null;
  }
}

export const fetchCurrentUser = async (): Promise<User | null> => {
  const user = auth.currentUser;
  if (!user) {
    if (localStorage.getItem("isAuthenticated") === "true") {
      return { id: "demo-user", name: "Demo User", role: "Admin" };
    }
    return null;
  }
  
  return fetchUserById(user.uid);
}
