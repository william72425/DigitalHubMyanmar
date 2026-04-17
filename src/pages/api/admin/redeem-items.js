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
    const snapshot = await getDocs(collection(db, 'redeem_items'));
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return res.status(200).json({ items });
  } catch (error) {
    console.error('Error fetching redeem items:', error);
    return res.status(500).json({ error: 'Failed to fetch redeem items' });
  }
}

async function handlePost(req, res) {
  try {
    const { name, description, required_points, time_limit, spots_limit, is_active } = req.body;

    if (!name || !required_points) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newItem = {
      name,
      description,
      required_points,
      time_limit: time_limit || null,
      spots_limit: spots_limit || null,
      is_active: is_active !== false,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'redeem_items'), newItem);
    return res.status(201).json({ 
      success: true, 
      id: docRef.id, 
      item: { id: docRef.id, ...newItem } 
    });
  } catch (error) {
    console.error('Error creating redeem item:', error);
    return res.status(500).json({ error: 'Failed to create redeem item' });
  }
}

async function handlePut(req, res) {
  try {
    const { id, name, description, required_points, time_limit, spots_limit, is_active } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    const updateData = {
      updated_at: serverTimestamp()
    };

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (required_points !== undefined) updateData.required_points = required_points;
    if (time_limit !== undefined) updateData.time_limit = time_limit;
    if (spots_limit !== undefined) updateData.spots_limit = spots_limit;
    if (is_active !== undefined) updateData.is_active = is_active;

    await updateDoc(doc(db, 'redeem_items', id), updateData);
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating redeem item:', error);
    return res.status(500).json({ error: 'Failed to update redeem item' });
  }
}

async function handleDelete(req, res) {
  try {
    const { id } = req.body;

    if (!id) {
      return res.status(400).json({ error: 'Item ID is required' });
    }

    await deleteDoc(doc(db, 'redeem_items', id));
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error deleting redeem item:', error);
    return res.status(500).json({ error: 'Failed to delete redeem item' });
  }
}
