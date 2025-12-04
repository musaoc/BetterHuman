import React, { useContext, useState, useEffect } from 'react';
import { auth } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { createUserProfile, getUserProfile, updateStreak } from '../services/userService';

const AuthContext = React.createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  async function signup(email, password, displayName = '') {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name if provided
    if (displayName) {
      await updateProfile(result.user, { displayName });
    }
    
    // Create user profile in Firestore
    await createUserProfile(result.user.uid, {
      email,
      displayName: displayName || email.split('@')[0],
      photoURL: null
    });
    
    return result;
  }

  function login(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout() {
    setUserProfile(null);
    return signOut(auth);
  }

  async function refreshUserProfile() {
    if (currentUser) {
      const profile = await getUserProfile(currentUser.uid);
      if (profile.success) {
        setUserProfile(profile.data);
      }
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Get user profile from Firestore
        const profile = await getUserProfile(user.uid);
        if (profile.success && profile.data) {
          setUserProfile(profile.data);
          // Update streak on login
          await updateStreak(user.uid);
        } else {
          // Create profile if it doesn't exist
          await createUserProfile(user.uid, {
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL
          });
          const newProfile = await getUserProfile(user.uid);
          if (newProfile.success) {
            setUserProfile(newProfile.data);
          }
        }
      } else {
        setUserProfile(null);
      }
      
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    signup,
    login,
    logout,
    refreshUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
