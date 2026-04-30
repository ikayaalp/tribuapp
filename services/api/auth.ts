import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  updateProfile
} from 'firebase/auth';
import { auth } from './firebase';

export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
}

export const authApi = {
  // Register a new user
  register: async (email: string, password: string, displayName?: string): Promise<User> => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    
    // Set display name if provided
    if (displayName) {
      await updateProfile(user, { displayName });
      // Reload user so next auth state observer gets the updated data
      await user.reload();
    }
    
    return auth.currentUser || user;
  },

  // Update Profile
  updateProfileData: async (displayName: string): Promise<void> => {
    const user = auth.currentUser;
    if (user) {
      await updateProfile(user, { displayName });
      await user.reload();
    } else {
      throw new Error('Kullanıcı oturumu bulunamadı');
    }
  },

  // Log in
  login: async (email: string, password: string): Promise<User> => {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential.user;
  },

  // Log out
  logout: async (): Promise<void> => {
    await signOut(auth);
  },

  // Listen to auth state changes
  onAuthStateChanged: (callback: (user: UserProfile | null) => void) => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        callback({
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
        });
      } else {
        callback(null);
      }
    });
  },

  // Get current user immediately
  getCurrentUser: (): UserProfile | null => {
    const user = auth.currentUser;
    if (user) {
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      };
    }
    return null;
  }
};
