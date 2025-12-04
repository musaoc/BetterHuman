// User service for Firestore operations
import { db } from '../firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc,
  query,
  where,
  orderBy,
  limit,
  getDocs,
  serverTimestamp 
} from 'firebase/firestore';

// Create or update user profile
export const createUserProfile = async (userId, userData) => {
  try {
    const userRef = doc(db, 'users', userId);
    await setDoc(userRef, {
      ...userData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      stats: {
        tasksCompleted: 0,
        totalTasks: 0,
        wordsRead: 0,
        readingTime: 0,
        typingTestsTaken: 0,
        averageWPM: 0,
        streakDays: 0,
        lastActiveDate: null,
        totalJournalEntries: 0,
        xpPoints: 0,
        level: 1
      }
    }, { merge: true });
    return { success: true };
  } catch (error) {
    console.error('Error creating user profile:', error);
    return { success: false, error };
  }
};

// Get user profile
export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      return { success: true, data: userSnap.data() };
    }
    return { success: false, data: null };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { success: false, error };
  }
};

// Update user stats
export const updateUserStats = async (userId, stats) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      stats: stats,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error updating user stats:', error);
    return { success: false, error };
  }
};

// Increment specific stat
export const incrementStat = async (userId, statName, incrementValue = 1) => {
  try {
    const userProfile = await getUserProfile(userId);
    if (userProfile.success && userProfile.data) {
      const currentStats = userProfile.data.stats || {};
      const newValue = (currentStats[statName] || 0) + incrementValue;
      
      await updateDoc(doc(db, 'users', userId), {
        [`stats.${statName}`]: newValue,
        updatedAt: serverTimestamp()
      });
      return { success: true, newValue };
    }
    return { success: false };
  } catch (error) {
    console.error('Error incrementing stat:', error);
    return { success: false, error };
  }
};

// Update streak
export const updateStreak = async (userId) => {
  try {
    const userProfile = await getUserProfile(userId);
    if (userProfile.success && userProfile.data) {
      const stats = userProfile.data.stats || {};
      const lastActive = stats.lastActiveDate?.toDate();
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      let newStreak = stats.streakDays || 0;
      
      if (lastActive) {
        const lastActiveDay = new Date(lastActive);
        lastActiveDay.setHours(0, 0, 0, 0);
        
        const diffDays = Math.floor((today - lastActiveDay) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 1) {
          newStreak += 1;
        } else if (diffDays > 1) {
          newStreak = 1; // Reset streak
        }
        // If diffDays === 0, keep the same streak (already active today)
      } else {
        newStreak = 1;
      }
      
      await updateDoc(doc(db, 'users', userId), {
        'stats.streakDays': newStreak,
        'stats.lastActiveDate': serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      return { success: true, newStreak };
    }
    return { success: false };
  } catch (error) {
    console.error('Error updating streak:', error);
    return { success: false, error };
  }
};

// Add XP points
export const addXP = async (userId, xpAmount) => {
  try {
    const userProfile = await getUserProfile(userId);
    if (userProfile.success && userProfile.data) {
      const stats = userProfile.data.stats || {};
      const newXP = (stats.xpPoints || 0) + xpAmount;
      const newLevel = Math.floor(newXP / 100) + 1; // Level up every 100 XP
      
      await updateDoc(doc(db, 'users', userId), {
        'stats.xpPoints': newXP,
        'stats.level': newLevel,
        updatedAt: serverTimestamp()
      });
      
      return { success: true, newXP, newLevel };
    }
    return { success: false };
  } catch (error) {
    console.error('Error adding XP:', error);
    return { success: false, error };
  }
};

// Save tasks to Firestore
export const saveTasks = async (userId, tasks) => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      tasks: tasks,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    console.error('Error saving tasks:', error);
    return { success: false, error };
  }
};

// Get tasks from Firestore
export const getTasks = async (userId) => {
  try {
    const userProfile = await getUserProfile(userId);
    if (userProfile.success && userProfile.data) {
      return { success: true, tasks: userProfile.data.tasks || [] };
    }
    return { success: false, tasks: [] };
  } catch (error) {
    console.error('Error getting tasks:', error);
    return { success: false, error, tasks: [] };
  }
};

// Save journal entry
export const saveJournalEntry = async (userId, entry) => {
  try {
    const journalRef = collection(db, 'users', userId, 'journal');
    await addDoc(journalRef, {
      ...entry,
      createdAt: serverTimestamp()
    });
    
    // Increment journal entries count and add XP
    await incrementStat(userId, 'totalJournalEntries', 1);
    await addXP(userId, 10); // 10 XP for each journal entry
    
    return { success: true };
  } catch (error) {
    console.error('Error saving journal entry:', error);
    return { success: false, error };
  }
};

// Get journal entries
export const getJournalEntries = async (userId, limitCount = 30) => {
  try {
    const journalRef = collection(db, 'users', userId, 'journal');
    const q = query(journalRef, orderBy('createdAt', 'desc'), limit(limitCount));
    const querySnapshot = await getDocs(q);
    
    const entries = [];
    querySnapshot.forEach((doc) => {
      entries.push({ id: doc.id, ...doc.data() });
    });
    
    return { success: true, entries };
  } catch (error) {
    console.error('Error getting journal entries:', error);
    return { success: false, error, entries: [] };
  }
};

// Record typing test result
export const recordTypingTest = async (userId, wpm, accuracy) => {
  try {
    // Add to typing history
    const typingRef = collection(db, 'users', userId, 'typingHistory');
    await addDoc(typingRef, {
      wpm,
      accuracy,
      createdAt: serverTimestamp()
    });
    
    // Update average WPM and tests taken
    const userProfile = await getUserProfile(userId);
    if (userProfile.success && userProfile.data) {
      const stats = userProfile.data.stats || {};
      const currentTests = stats.typingTestsTaken || 0;
      const currentAvg = stats.averageWPM || 0;
      
      const newTestCount = currentTests + 1;
      const newAvgWPM = Math.round(((currentAvg * currentTests) + wpm) / newTestCount);
      
      await updateDoc(doc(db, 'users', userId), {
        'stats.typingTestsTaken': newTestCount,
        'stats.averageWPM': newAvgWPM,
        updatedAt: serverTimestamp()
      });
      
      // Add XP based on WPM
      const xpEarned = Math.floor(wpm / 10);
      await addXP(userId, xpEarned);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error recording typing test:', error);
    return { success: false, error };
  }
};

// Record reading session
export const recordReadingSession = async (userId, wordsRead, timeSpentSeconds) => {
  try {
    const userProfile = await getUserProfile(userId);
    if (userProfile.success && userProfile.data) {
      const stats = userProfile.data.stats || {};
      
      await updateDoc(doc(db, 'users', userId), {
        'stats.wordsRead': (stats.wordsRead || 0) + wordsRead,
        'stats.readingTime': (stats.readingTime || 0) + timeSpentSeconds,
        updatedAt: serverTimestamp()
      });
      
      // Add XP based on words read
      const xpEarned = Math.floor(wordsRead / 50);
      await addXP(userId, xpEarned);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error recording reading session:', error);
    return { success: false, error };
  }
};
