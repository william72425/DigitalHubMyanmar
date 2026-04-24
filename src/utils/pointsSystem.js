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
    // Try with ordering first
    try {
      const historyQuery = query(
        collection(db, 'points_history'),
        where('user_id', '==', userId),
        orderBy('created_at', 'desc')
      );
      const snapshot = await getDocs(historyQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (orderError) {
      console.warn('Ordered points history failed, falling back to unordered:', orderError);
      // Fallback if index is missing or created_at is null
      const fallbackQuery = query(
        collection(db, 'points_history'),
        where('user_id', '==', userId)
      );
      const snapshot = await getDocs(fallbackQuery);
      const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort manually in JS
      return items.sort((a, b) => {
        const dateA = a.created_at?.toDate?.() || new Date(0);
        const dateB = b.created_at?.toDate?.() || new Date(0);
        return dateB - dateA;
      });
    }
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

/**
 * Award points for a purchase to the user and their inviter
 * @param {string} userId - The ID of the user who made the purchase
 * @param {number} totalAmount - Total amount of the purchase in MMK
 * @param {string} inviterId - The ID of the user who invited the purchaser (optional)
 */
export const awardPurchasePoints = async (userId, totalAmountInput, inviterId) => {
  try {
    // Ensure totalAmount is a number
    const totalAmount = Number(totalAmountInput) || 0;
    
    // 1. Fetch points settings
    const settingsRef = doc(db, 'settings', 'pointsConfig');
    const settingsSnap = await getDoc(settingsRef);
    
    let settings = {
      ownPurchaseRatio: 0.01, // Default: 1%
      inviteePurchaseRatio: 0.02, // Default: 2%
      minPurchaseAmount: 1000
    };

    if (settingsSnap.exists()) {
      settings = { ...settings, ...settingsSnap.data() };
    }

    console.log(`Processing points for user ${userId}, amount ${totalAmount}, inviter ${inviterId}`);
    if (totalAmount < (settings.minPurchaseAmount || 0)) {
      console.log(`Purchase amount ${totalAmount} is below minimum ${settings.minPurchaseAmount}`);
      return;
    }

    // 2. Award points to the buyer
    const ownPoints = Math.floor(totalAmount * (settings.ownPurchaseRatio || 0));
    if (ownPoints > 0) {
      await logPointsTransaction(
        userId, 
        ownPoints, 
        'Purchase Reward', 
        'earn', 
        { amount: totalAmount, type: 'own_purchase' }
      );
      console.log(`Awarded ${ownPoints} points to user ${userId}`);
    }

    // 3. Award points to the inviter if applicable
    if (inviterId) {
      const referralPoints = Math.floor(totalAmount * (settings.inviteePurchaseRatio || 0));
      if (referralPoints > 0) {
        await logPointsTransaction(
          inviterId, 
          referralPoints, 
          'Referral Purchase Reward', 
          'earn', 
          { amount: totalAmount, type: 'referral_purchase', purchaserId: userId }
        );
        console.log(`Awarded ${referralPoints} points to inviter ${inviterId}`);
      }
    }

    return true;
  } catch (error) {
    console.error('Error in awardPurchasePoints:', error);
    throw error;
  }
};
