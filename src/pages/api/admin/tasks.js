import { db } from '@/utils/firebase';
import { 
  collection, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';

export default async function handler(req, res) {
  // Only allow GET and POST methods
  if (req.method === 'GET') {
    return handleGet(res);
  } else if (req.method === 'POST') {
    return handlePost(req, res);
  } else if (req.method === 'PUT') {
    return handlePut(req, res);
  } else if (req.method === 'DELETE') {
    return handleDelete(req, res);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(res) {
  try {
    const snapshot = await getDocs(collection(db, 'tasks'));
    const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json({ tasks });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({ error: 'Failed to fetch tasks' });
  }
}

async function handlePost(req, res) {
  try {
    const { name, description, reward_points, deadline, is_active } = req.body;

    if (!name || !reward_points) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newTask = {
      name,
      description,
      reward_points,
      deadline: deadline || null,
      is_active: is_active !== false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'tasks'), newTask);
    return res.status(201).json({ 
      success: true, 
      id: docRef.id, 
      task: { id: docRef.id, ...newTask } 
    });
  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({ error: 'Failed to create task' });
  }
}

async function handlePut(req, res) {
  try {
    const { id, name, description, reward_points, deadline, is_active } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    const updateData = {
      updated_at: serverTimestamp()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (reward_points !== undefined) updateData.reward_points = reward_points;
    if (deadline !== undefined) updateData.deadline = deadline;
    if (is_active !== undefined) updateData.is_active = is_active;

    await updateDoc(doc(db, 'tasks', id), updateData);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({ error: 'Failed to update task' });
  }
}

async function handleDelete(req, res) {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Task ID is required' });
    }

    await deleteDoc(doc(db, 'tasks', id));
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({ error: 'Failed to delete task' });
  }
}
