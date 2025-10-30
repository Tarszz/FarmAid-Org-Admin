
// Re-export all Firebase services from their respective modules
export * from './firebase/types';
export * from './firebase/userService';
export * from './firebase/notificationService';

// Re-export Firebase app instances for backward compatibility
export { auth, db, rtdb, storage, analytics } from './firebase/index';
