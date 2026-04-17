import { db } from './firebase';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  increment, 
  serverTimestamp,
  getDoc,
  query,
  where,
  getDocs,
  orderBy
} from 'firebase/firestore';

/**
 * Log a points transaction and update user's balance
 * @param {string} userId - The ID of the user
 * @param {number} points - Points to add (positive) or subtract (negative)
 * @param {string} label - Transaction label (e.g., 'invitee first purchase', 'task completion')
 * @param {string} type - 'earn' or 'use'
 * @param {object} metadata - Additional info (e.g., inviteeId, productId, taskId)
 */
export const logPointsTransaction = async (userId, points, label, type, metadata = {}) => {
  if (points === 0) return;

  try {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      console.error('User does not exist for points transaction');
      return;
    }

    const userData = userSnap.data();
    const currentBalance = userData.points_balance || 0;
    const newBalance = currentBalance + points;

    // Record the transaction in history
    await addDoc(collection(db, 'points_history'), {
      user_id: userId,
      points: points,
      label: label,
      type: type,
      metadata: metadata,
      created_at: serverTimestamp(),
      previous_balance: currentBalance,
      new_balance: newBalance
    });

    // Update user's aggregate points
    const updateData = {
      points_balance: increment(points)
    };

    // Update highest points if this is an 'earn' transaction
    if (type === 'earn' && newBalance > (userData.highest_points_claimed || 0)) {
      updateData.highest_points_claimed = newBalance;
    }

    // Track total used points
    if (type === 'use') {
      updateData.total_used_points = increment(Math.abs(points));
    }

    await updateDoc(userRef, updateData);
    
    return true;
  } catch (error) {
    console.error('Error logging points transaction:', error);
    throw error;
  }
};

/**
 * Fetch points history for a user
 */
export const getUserPointsHistory = async (userId) => {
  try {
    const historyQuery = query(
      collection(db, 'points_history'),
      where('user_id', '==', userId),
      orderBy('created_at', 'desc')
    );
    const snapshot = await getDocs(historyQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching points history:', error);
    return [];
  }
};

/**
 * Fetch redeem items from Firestore
 */
export const getRedeemItems = async () => {
  try {
    const q = query(collection(db, 'redeem_items'), where('is_active', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching redeem items:', error);
    return [];
  }
};

/**
 * Fetch tasks from Firestore
 */
export const getTasks = async () => {
  try {
    const q = query(collection(db, 'tasks'), where('is_active', '==', true));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return [];
  }
};
