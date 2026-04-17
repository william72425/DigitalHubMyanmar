import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { auth, db } from '@/utils/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { getUserPointsHistory, getRedeemItems, getTasks } from '@/utils/pointsSystem';

export default function UserDashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('referral');
  
  // Referral data
  const [referralStats, setReferralStats] = useState({ count: 0, totalPurchased: 0 });
  const [inviteeList, setInviteeList] = useState([]);
  
  // Points data
  const [pointsHistory, setPointsHistory] = useState([]);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [highestPoints, setHighestPoints] = useState(0);
  const [totalUsedPoints, setTotalUsedPoints] = useState(0);
  
  // Redeem data
  const [redeemItems, setRedeemItems] = useState([]);
  
  // Tasks data
  const [tasks, setTasks] = useState([]);
  const [userClaimedTasks, setUserClaimedTasks] = useState([]);
  
  // Active giveaways
  const [activeGiveaways, setActiveGiveaways] = useState([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') setIsDarkMode(false);
    else if (savedTheme === 'dark') setIsDarkMode(true);

    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/auth');
        return;
      }
      setUser(user);
      await loadUserData(user.uid);
      await loadReferralStats(user.uid);
      await loadPointsData(user.uid);
      await loadRedeemItems();
      await loadTasks(user.uid);
      await loadActiveGiveaways();
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const loadUserData = async (userId) => {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      const data = userDoc.data();
      setUserData(data);
      setCurrentBalance(data.points_balance || 0);
      setHighestPoints(data.highest_points_claimed || 0);
      setTotalUsedPoints(data.total_used_points || 0);
    }
  };

  const loadReferralStats = async (userId) => {
    try {
      const q = query(collection(db, 'users'), where('referred_by', '==', userId));
      const snapshot = await getDocs(q);
      
      let totalPurchased = 0;
      const invitees = [];

      for (const doc of snapshot.docs) {
        const inviteeData = doc.data();
        const ordersQuery = query(
          collection(db, 'orders'),
          where('user_id', '==', doc.id),
          where('status', 'in', ['completed'])
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        
        const purchases = ordersSnapshot.docs.map(order => ({
          productName: order.data().product_name,
          amount: order.data().final_price,
          date: order.data().created_at?.toDate?.() || new Date(),
          status: order.data().status
        }));

        const totalAmount = purchases.reduce((sum, p) => sum + p.amount, 0);
        totalPurchased += totalAmount;

        invitees.push({
          id: doc.id,
          username: inviteeData.username,
          email: inviteeData.email,
          joinedDate: inviteeData.created_at?.toDate?.() || new Date(),
          purchases: purchases,
          totalSpent: totalAmount
        });
      }

      setReferralStats({
        count: snapshot.size,
        totalPurchased: totalPurchased
      });
      setInviteeList(invitees);
    } catch (error) {
      console.error('Error loading referral stats:', error);
    }
  };

  const loadPointsData = async (userId) => {
    try {
      const history = await getUserPointsHistory(userId);
      setPointsHistory(history);
    } catch (error) {
      console.error('Error loading points history:', error);
    }
  };

  const loadRedeemItems = async () => {
    try {
      const items = await getRedeemItems();
      setRedeemItems(items);
    } catch (error) {
      console.error('Error loading redeem items:', error);
    }
  };

  const loadTasks = async (userId) => {
    try {
      const items = await getTasks();
      setTasks(items);
      
      // Load user's claimed tasks
      const claimedQuery = query(
        collection(db, 'user_task_claims'),
        where('user_id', '==', userId)
      );
      const claimedSnapshot = await getDocs(claimedQuery);
      const claimed = claimedSnapshot.docs.map(doc => doc.data().task_id);
      setUserClaimedTasks(claimed);
    } catch (error) {
      console.error('Error loading tasks:', error);
    }
  };

  const loadActiveGiveaways = async () => {
    try {
      const q = query(
        collection(db, 'promo_codes'),
        where('option_type', '==', 'giveaway'),
        where('is_active', '==', true)
      );
      const snapshot = await getDocs(q);
      const giveaways = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setActiveGiveaways(giveaways);
    } catch (error) {
      console.error('Error loading giveaways:', error);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF6B35] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth?ref=${userData?.promote_code || ''}`;

  return (
    <>
      <Head><title>My Dashboard | Digital Hub Myanmar</title></Head>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        
        <div className="container mx-auto px-4 py-24 max-w-6xl">
          <h1 className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
            👋 Welcome, {userData?.username || user?.email}
          </h1>
          
          {/* Tab Navigation */}
          <div className={`rounded-2xl p-6 mb-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
            <div className="flex flex-wrap gap-2 border-b border-white/20">
              {[
                { id: 'referral', label: '🎁 Referral', icon: '👥' },
                { id: 'points', label: '⭐ Points History', icon: '📊' },
                { id: 'redeem', label: '💎 Redeem', icon: '🏆' },
                { id: 'tasks', label: '✅ Tasks', icon: '📝' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'text-[#FF6B35] border-b-2 border-[#FF6B35]'
                      : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* REFERRAL TAB */}
          {activeTab === 'referral' && (
            <div className="space-y-6">
              {/* Promote Code Section */}
              <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
                <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🎁 Your Promote Code</h2>
                <div className="flex flex-wrap gap-3 items-center">
                  <code className={`px-4 py-2 rounded-lg font-mono text-lg ${isDarkMode ? 'bg-black/30 text-[#FF6B35]' : 'bg-gray-100 text-[#FF6B35]'}`}>
                    {userData?.promote_code || 'Loading...'}
                  </code>
                  <button onClick={() => copyToClipboard(userData?.promote_code)} className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg hover:bg-orange-600">📋 Copy Code</button>
                  <button onClick={() => copyToClipboard(inviteLink)} className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700">🔗 Copy Invite Link</button>
                </div>
                <p className="text-sm text-gray-400 mt-3">Share your code with friends. When they register and purchase, you'll earn points!</p>
              </div>

              {/* Referral Stats */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>👥 Total Invites</h3>
                  <div className={`text-4xl font-bold ${isDarkMode ? 'text-[#FF6B35]' : 'text-[#FF6B35]'}`}>{referralStats.count}</div>
                </div>
                <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>💰 Total Purchased Amount</h3>
                  <div className={`text-4xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>{referralStats.totalPurchased.toLocaleString()} MMK</div>
                </div>
              </div>

              {/* Invitee List */}
              <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
                <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📋 Invitee Details</h3>
                {inviteeList.length === 0 ? (
                  <p className="text-gray-400">No invitees yet. Share your referral link to get started!</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className={`border-b ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                          <th className="text-left py-3 px-2 text-sm font-semibold">Username</th>
                          <th className="text-left py-3 px-2 text-sm font-semibold">Joined Date</th>
                          <th className="text-left py-3 px-2 text-sm font-semibold">Purchases</th>
                          <th className="text-right py-3 px-2 text-sm font-semibold">Total Spent</th>
                        </tr>
                      </thead>
                      <tbody>
                        {inviteeList.map((invitee) => (
                          <tr key={invitee.id} className={`border-b ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <td className="py-3 px-2 text-sm">{invitee.username}</td>
                            <td className="py-3 px-2 text-sm text-gray-400">{invitee.joinedDate.toLocaleDateString('en-MM-DD')}</td>
                            <td className="py-3 px-2 text-sm">
                              <div className="space-y-1">
                                {invitee.purchases.map((purchase, idx) => (
                                  <div key={idx} className="text-xs text-gray-400">
                                    {purchase.productName} - {purchase.date.toLocaleDateString('en-MM-DD')}
                                  </div>
                                ))}
                              </div>
                            </td>
                            <td className="py-3 px-2 text-sm text-right font-semibold text-green-400">{invitee.totalSpent.toLocaleString()} MMK</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* POINTS HISTORY TAB */}
          {activeTab === 'points' && (
            <div className="space-y-6">
              {/* Points Summary */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>💰 Current Balance</h3>
                  <div className={`text-4xl font-bold ${isDarkMode ? 'text-[#FF6B35]' : 'text-[#FF6B35]'}`}>{currentBalance}</div>
                </div>
                <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🏆 Highest Points</h3>
                  <div className={`text-4xl font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}>{highestPoints}</div>
                </div>
                <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
                  <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📉 Used Points</h3>
                  <div className={`text-4xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>{totalUsedPoints}</div>
                </div>
              </div>

              {/* Points History Table */}
              <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
                <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📊 All Points Earned History</h3>
                {pointsHistory.length === 0 ? (
                  <p className="text-gray-400">No points history yet.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className={`border-b ${isDarkMode ? 'border-white/20' : 'border-gray-300'}`}>
                          <th className="text-left py-3 px-2">Date & Time</th>
                          <th className="text-left py-3 px-2">Label</th>
                          <th className="text-center py-3 px-2">Points</th>
                          <th className="text-right py-3 px-2">Balance</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pointsHistory.map((entry) => (
                          <tr key={entry.id} className={`border-b ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}>
                            <td className="py-3 px-2 text-gray-400">
                              {entry.created_at?.toDate?.()?.toLocaleString('en-MM-DD HH:mm') || 'N/A'}
                            </td>
                            <td className="py-3 px-2">{entry.label}</td>
                            <td className={`py-3 px-2 text-center font-semibold ${entry.type === 'earn' ? 'text-green-400' : 'text-red-400'}`}>
                              {entry.type === 'earn' ? '+' : '-'}{Math.abs(entry.points)}
                            </td>
                            <td className="py-3 px-2 text-right font-semibold">{entry.new_balance}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* REDEEM TAB */}
          {activeTab === 'redeem' && (
            <div className="space-y-6">
              <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
                <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>💎 Available Rewards</h3>
                {redeemItems.length === 0 ? (
                  <p className="text-gray-400">No redeem items available yet.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {redeemItems.map((item) => (
                      <div key={item.id} className={`p-4 rounded-xl border-2 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                        <h4 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{item.name}</h4>
                        <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                        <div className="mt-3 flex justify-between items-center">
                          <span className={`text-lg font-bold ${isDarkMode ? 'text-[#FF6B35]' : 'text-[#FF6B35]'}`}>{item.required_points} Points</span>
                          <button
                            disabled={currentBalance < item.required_points}
                            className={`px-4 py-2 rounded-lg font-semibold transition ${
                              currentBalance >= item.required_points
                                ? 'bg-green-600 text-white hover:bg-green-700'
                                : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                            }`}
                          >
                            Redeem
                          </button>
                        </div>
                        {item.time_limit && <p className="text-xs text-gray-500 mt-2">⏰ {item.time_limit}</p>}
                        {item.spots_limit && <p className="text-xs text-gray-500">📍 {item.spots_limit} spots left</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TASKS TAB */}
          {activeTab === 'tasks' && (
            <div className="space-y-6">
              <div className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
                <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>✅ Available Tasks</h3>
                {tasks.length === 0 ? (
                  <p className="text-gray-400">No tasks available yet.</p>
                ) : (
                  <div className="space-y-3">
                    {tasks.map((task) => {
                      const isClaimed = userClaimedTasks.includes(task.id);
                      return (
                        <div key={task.id} className={`p-4 rounded-xl border-2 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}>
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h4 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{task.name}</h4>
                              <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                              <div className="mt-2 flex gap-4">
                                <span className={`text-sm font-semibold ${isDarkMode ? 'text-[#FF6B35]' : 'text-[#FF6B35]'}`}>🎁 {task.reward_points} Points</span>
                                {task.deadline && <span className="text-sm text-gray-400">⏰ Deadline: {new Date(task.deadline).toLocaleDateString('en-MM-DD')}</span>}
                              </div>
                            </div>
                            <button
                              disabled={isClaimed}
                              className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ml-4 ${
                                isClaimed
                                  ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                  : 'bg-blue-600 text-white hover:bg-blue-700'
                              }`}
                            >
                              {isClaimed ? '✓ Claimed' : 'Claim'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Active Giveaways */}
          {activeGiveaways.length > 0 && (
            <div className={`rounded-2xl p-6 mt-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}>
              <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🎁 Active Giveaways</h2>
              <div className="space-y-3">
                {activeGiveaways.map((giveaway) => (
                  <div key={giveaway.id} className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}>
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{giveaway.settings?.giveaway_name || 'Giveaway'}</h3>
                        <p className="text-sm text-gray-400">Draw Date: {giveaway.settings?.draw_date || 'TBA'}</p>
                      </div>
                      <Link href="/giveaway" className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600">View Details</Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
