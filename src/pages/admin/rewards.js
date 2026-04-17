import { useState, useEffect } from 'react';
import Head from 'next/head';
import AdminNavbar from '@/components/AdminNavbar';

export default function RewardsAdmin() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('redeem');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Redeem items state
  const [redeemItems, setRedeemItems] = useState([]);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [editingRedeemId, setEditingRedeemId] = useState(null);
  const [redeemForm, setRedeemForm] = useState({
    name: '',
    description: '',
    required_points: 0,
    time_limit: '',
    spots_limit: '',
    is_active: true
  });

  // Tasks state
  const [tasks, setTasks] = useState([]);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState(null);
  const [taskForm, setTaskForm] = useState({
    name: '',
    description: '',
    reward_points: 0,
    deadline: '',
    is_active: true
  });

  useEffect(() => {
    const auth = sessionStorage.getItem('admin_auth');
    if (auth === 'true') {
      setIsAuthenticated(true);
      loadRedeemItems();
      loadTasks();
    } else {
      window.location.href = '/admin';
    }
  }, []);

  // ===== REDEEM ITEMS FUNCTIONS =====
  const loadRedeemItems = async () => {
    try {
      const res = await fetch('/api/admin/redeem-items');
      const data = await res.json();
      setRedeemItems(data.items || []);
    } catch (error) {
      console.error('Error loading redeem items:', error);
      setMessage('❌ Failed to load redeem items');
    }
  };

  const handleRedeemSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = editingRedeemId ? 'PUT' : 'POST';
      const body = editingRedeemId 
        ? { ...redeemForm, id: editingRedeemId }
        : redeemForm;

      const res = await fetch('/api/admin/redeem-items', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setMessage(editingRedeemId ? '✅ Redeem item updated!' : '✅ Redeem item created!');
        setShowRedeemModal(false);
        setEditingRedeemId(null);
        setRedeemForm({
          name: '',
          description: '',
          required_points: 0,
          time_limit: '',
          spots_limit: '',
          is_active: true
        });
        loadRedeemItems();
      } else {
        setMessage('❌ Failed to save redeem item');
      }
    } catch (error) {
      console.error('Error saving redeem item:', error);
      setMessage('❌ Error saving redeem item');
    }
    setLoading(false);
  };

  const handleDeleteRedeem = async (id) => {
    if (!confirm('Are you sure you want to delete this redeem item?')) return;

    try {
      const res = await fetch('/api/admin/redeem-items', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (res.ok) {
        setMessage('✅ Redeem item deleted!');
        loadRedeemItems();
      } else {
        setMessage('❌ Failed to delete redeem item');
      }
    } catch (error) {
      console.error('Error deleting redeem item:', error);
      setMessage('❌ Error deleting redeem item');
    }
  };

  const handleEditRedeem = (item) => {
    setRedeemForm(item);
    setEditingRedeemId(item.id);
    setShowRedeemModal(true);
  };

  // ===== TASKS FUNCTIONS =====
  const loadTasks = async () => {
    try {
      const res = await fetch('/api/admin/tasks');
      const data = await res.json();
      setTasks(data.tasks || []);
    } catch (error) {
      console.error('Error loading tasks:', error);
      setMessage('❌ Failed to load tasks');
    }
  };

  const handleTaskSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const method = editingTaskId ? 'PUT' : 'POST';
      const body = editingTaskId 
        ? { ...taskForm, id: editingTaskId }
        : taskForm;

      const res = await fetch('/api/admin/tasks', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (res.ok) {
        setMessage(editingTaskId ? '✅ Task updated!' : '✅ Task created!');
        setShowTaskModal(false);
        setEditingTaskId(null);
        setTaskForm({
          name: '',
          description: '',
          reward_points: 0,
          deadline: '',
          is_active: true
        });
        loadTasks();
      } else {
        setMessage('❌ Failed to save task');
      }
    } catch (error) {
      console.error('Error saving task:', error);
      setMessage('❌ Error saving task');
    }
    setLoading(false);
  };

  const handleDeleteTask = async (id) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    try {
      const res = await fetch('/api/admin/tasks', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });

      if (res.ok) {
        setMessage('✅ Task deleted!');
        loadTasks();
      } else {
        setMessage('❌ Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      setMessage('❌ Error deleting task');
    }
  };

  const handleEditTask = (task) => {
    setTaskForm(task);
    setEditingTaskId(task.id);
    setShowTaskModal(true);
  };

  if (!isAuthenticated) {
    return <div className="text-center py-20">Loading...</div>;
  }

  return (
    <>
      <Head><title>Rewards Management | Admin</title></Head>
      <div className="min-h-screen bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617] text-white">
        <AdminNavbar />
        
        <div className="container mx-auto px-4 py-24 max-w-6xl">
          <h1 className="text-3xl font-bold mb-6">🎁 Rewards Management</h1>

          {/* Message */}
          {message && (
            <div className="mb-4 p-4 rounded-lg bg-white/10 border border-white/20">
              {message}
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex gap-4 mb-6 border-b border-white/20 pb-4">
            <button
              onClick={() => setActiveTab('redeem')}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === 'redeem'
                  ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              💎 Redeem Items
            </button>
            <button
              onClick={() => setActiveTab('tasks')}
              className={`px-4 py-2 font-semibold transition ${
                activeTab === 'tasks'
                  ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              ✅ Tasks
            </button>
          </div>

          {/* REDEEM ITEMS TAB */}
          {activeTab === 'redeem' && (
            <div>
              <button
                onClick={() => {
                  setShowRedeemModal(true);
                  setEditingRedeemId(null);
                  setRedeemForm({
                    name: '',
                    description: '',
                    required_points: 0,
                    time_limit: '',
                    spots_limit: '',
                    is_active: true
                  });
                }}
                className="mb-6 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                ➕ Add Redeem Item
              </button>

              <div className="space-y-4">
                {redeemItems.map((item) => (
                  <div key={item.id} className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{item.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                        <div className="mt-2 flex gap-4 text-sm">
                          <span className="text-[#FF6B35]">🎁 {item.required_points} Points</span>
                          {item.time_limit && <span className="text-gray-400">⏰ {item.time_limit}</span>}
                          {item.spots_limit && <span className="text-gray-400">📍 {item.spots_limit} spots</span>}
                          <span className={item.is_active ? 'text-green-400' : 'text-red-400'}>
                            {item.is_active ? '✓ Active' : '✗ Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditRedeem(item)}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRedeem(item.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <div>
              <button
                onClick={() => {
                  setShowTaskModal(true);
                  setEditingTaskId(null);
                  setTaskForm({
                    name: '',
                    description: '',
                    reward_points: 0,
                    deadline: '',
                    is_active: true
                  });
                }}
                className="mb-6 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                ➕ Add Task
              </button>

              <div className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="bg-white/10 rounded-lg p-4 border border-white/20">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-bold">{task.name}</h3>
                        <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                        <div className="mt-2 flex gap-4 text-sm">
                          <span className="text-[#FF6B35]">🎁 {task.reward_points} Points</span>
                          {task.deadline && <span className="text-gray-400">⏰ Deadline: {new Date(task.deadline).toLocaleDateString('en-MM-DD')}</span>}
                          <span className={task.is_active ? 'text-green-400' : 'text-red-400'}>
                            {task.is_active ? '✓ Active' : '✗ Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                        >
                          ✏️ Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* REDEEM MODAL */}
          {showRedeemModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-[#0a0f2a] rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold mb-4">{editingRedeemId ? 'Edit Redeem Item' : 'Add Redeem Item'}</h2>
                <form onSubmit={handleRedeemSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Item Name *</label>
                    <input
                      type="text"
                      value={redeemForm.name}
                      onChange={(e) => setRedeemForm({ ...redeemForm, name: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Description</label>
                    <textarea
                      value={redeemForm.description}
                      onChange={(e) => setRedeemForm({ ...redeemForm, description: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Required Points *</label>
                    <input
                      type="number"
                      value={redeemForm.required_points}
                      onChange={(e) => setRedeemForm({ ...redeemForm, required_points: parseInt(e.target.value) })}
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Time Limit (optional)</label>
                    <input
                      type="text"
                      value={redeemForm.time_limit}
                      onChange={(e) => setRedeemForm({ ...redeemForm, time_limit: e.target.value })}
                      placeholder="e.g., 30 days"
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Spots Limit (optional)</label>
                    <input
                      type="number"
                      value={redeemForm.spots_limit}
                      onChange={(e) => setRedeemForm({ ...redeemForm, spots_limit: e.target.value })}
                      placeholder="e.g., 10"
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={redeemForm.is_active}
                      onChange={(e) => setRedeemForm({ ...redeemForm, is_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label className="text-sm font-semibold">Active</label>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRedeemModal(false)}
                      className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* TASK MODAL */}
          {showTaskModal && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
              <div className="bg-[#0a0f2a] rounded-lg p-6 max-w-md w-full mx-4">
                <h2 className="text-2xl font-bold mb-4">{editingTaskId ? 'Edit Task' : 'Add Task'}</h2>
                <form onSubmit={handleTaskSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold mb-2">Task Name *</label>
                    <input
                      type="text"
                      value={taskForm.name}
                      onChange={(e) => setTaskForm({ ...taskForm, name: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Description</label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                      rows="3"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Reward Points *</label>
                    <input
                      type="number"
                      value={taskForm.reward_points}
                      onChange={(e) => setTaskForm({ ...taskForm, reward_points: parseInt(e.target.value) })}
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold mb-2">Deadline (optional)</label>
                    <input
                      type="date"
                      value={taskForm.deadline}
                      onChange={(e) => setTaskForm({ ...taskForm, deadline: e.target.value })}
                      className="w-full bg-white/10 border border-white/20 rounded px-3 py-2 text-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={taskForm.is_active}
                      onChange={(e) => setTaskForm({ ...taskForm, is_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <label className="text-sm font-semibold">Active</label>
                  </div>
                  <div className="flex gap-2 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowTaskModal(false)}
                      className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
