import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

export const logSuperAdminAction = async (action: string, details?: string) => {
  try {
    await addDoc(collection(db, "auditLogs"), {
      action,
      details: details || "",
      user: "SuperAdmin", // Or fetch dynamically
      timestamp: serverTimestamp(),
    });
  } catch (err) {
    console.error("Failed to log action:", err);
  }
};
