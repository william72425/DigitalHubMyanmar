import { db } from '@/utils/firebase';
import { 
  doc, 
  getDoc, 
  addDoc, 
  collection,
  serverTimestamp,
  updateDoc,
  increment,
  query,
  where,
  getDocs
} from 'firebase/firestore';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId, taskId } = req.body;

    if (!userId || !taskId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get user data
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();
    const currentBalance = userData.points_balance || 0;

    // Get task
    const taskDoc = await getDoc(doc(db, 'tasks', taskId));
    if (!taskDoc.exists()) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const taskData = taskDoc.data();

    // Check if user already claimed this task
    const claimQuery = query(
      collection(db, 'user_task_claims'),
      where('user_id', '==', userId),
      where('task_id', '==', taskId)
    );
    const claimSnapshot = await getDocs(claimQuery);
    
    if (!claimSnapshot.empty) {
      return res.status(400).json({ error: 'You already claimed this task' });
    }

    // Check if task deadline has passed
    if (taskData.deadline) {
      const deadline = new Date(taskData.deadline);
      if (new Date() > deadline) {
        return res.status(400).json({ error: 'Task deadline has passed' });
      }
    }

    // Add points to user
    const newBalance = currentBalance + taskData.reward_points;
    
    // Log the transaction
    await addDoc(collection(db, 'points_history'), {
      user_id: userId,
      points: taskData.reward_points,
      label: `Task completed: ${taskData.name}`,
      type: 'earn',
      metadata: { taskId, taskName: taskData.name },
      created_at: serverTimestamp(),
      previous_balance: currentBalance,
      new_balance: newBalance
    });

    // Update user points
    const updateData = {
      points_balance: increment(taskData.reward_points)
    };

    // Update highest points if applicable
    if (newBalance > (userData.highest_points_claimed || 0)) {
      updateData.highest_points_claimed = newBalance;
    }

    await updateDoc(doc(db, 'users', userId), updateData);

    // Record task claim
    await addDoc(collection(db, 'user_task_claims'), {
      user_id: userId,
      username: userData.username,
      task_id: taskId,
      task_name: taskData.name,
      reward_points: taskData.reward_points,
      claimed_at: serverTimestamp()
    });

    return res.status(200).json({ 
      success: true, 
      message: 'Task claimed successfully!',
      pointsEarned: taskData.reward_points,
      newBalance: newBalance
    });
  } catch (error) {
    console.error('Error claiming task:', error);
    return res.status(500).json({ error: 'Failed to claim task' });
  }
}
