import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '@/utils/firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Navbar from '@/components/Navbar';
import Link from 'next/link';
import { getUserPointsHistory, getRedeemItems, getTasks } from '@/utils/pointsSystem';

// Interesting loading animation component
const InterestingLoader = () => (
  <div className="flex justify-center items-center gap-2">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-3 h-3 bg-gradient-to-r from-[#FF6B35] to-[#00D4FF] rounded-full"
        animate={{
          y: [0, -12, 0],
          opacity: [1, 0.4, 1],
          scale: [1, 1.2, 1],
        }}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          delay: i * 0.15,
        }}
      />
    ))}
  </div>
);

// Shimmer loading skeleton
const ShimmerLoader = () => (
  <motion.div
    className="w-full h-32 bg-gradient-to-r from-white/5 via-white/10 to-white/5 rounded-xl"
    animate={{
      backgroundPosition: ['200% 0', '-200% 0'],
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: "linear",
    }}
  />
);

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
        <InterestingLoader />
      </div>
    );
  }

  const inviteLink = `${typeof window !== 'undefined' ? window.location.origin : ''}/auth?ref=${userData?.promote_code || ''}`;

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: "easeOut",
      },
    },
  };

  const tabContentVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.5,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      x: -20,
      transition: {
        duration: 0.3,
      },
    },
  };

  return (
    <>
      <Head><title>My Dashboard | Digital Hub Myanmar</title></Head>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gradient-to-br from-[#020617] via-[#0a0f2a] to-[#020617]' : 'bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100'}`}>
        <Navbar isDarkMode={isDarkMode} toggleTheme={toggleTheme} />
        
        <motion.div 
          className="container mx-auto px-4 py-24 max-w-6xl"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.h1 
            className={`text-3xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}
            variants={itemVariants}
          >
            👋 Welcome, {userData?.username || user?.email}
          </motion.h1>
          
          {/* Tab Navigation */}
          <motion.div 
            className={`rounded-2xl p-6 mb-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}
            variants={itemVariants}
          >
            <div className="flex flex-wrap gap-2 border-b border-white/20">
              {[
                { id: 'referral', label: '🎁 Referral', icon: '👥' },
                { id: 'points', label: '⭐ Points History', icon: '📊' },
                { id: 'redeem', label: '💎 Redeem', icon: '🏆' },
                { id: 'tasks', label: '✅ Tasks', icon: '📝' }
              ].map(tab => (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-3 font-semibold transition-all relative ${
                    activeTab === tab.id
                      ? 'text-[#FF6B35]'
                      : isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-800'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[#FF6B35] to-[#00D4FF]"
                      layoutId="activeTab"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </motion.button>
              ))}
            </div>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            {/* REFERRAL TAB */}
            {activeTab === 'referral' && (
              <motion.div 
                className="space-y-6"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Promote Code Section */}
                <motion.div 
                  className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}
                  variants={itemVariants}
                >
                  <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🎁 Your Promote Code</h2>
                  <motion.div 
                    className="flex flex-wrap gap-3 items-center"
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.code 
                      className={`px-4 py-2 rounded-lg font-mono text-lg ${isDarkMode ? 'bg-black/30 text-[#FF6B35]' : 'bg-gray-100 text-[#FF6B35]'}`}
                      whileHover={{ scale: 1.05 }}
                      animate={{ scale: [1, 1.02, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {userData?.promote_code || 'Loading...'}
                    </motion.code>
                    <motion.button 
                      onClick={() => copyToClipboard(userData?.promote_code)} 
                      className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg hover:bg-orange-600"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      📋 Copy Code
                    </motion.button>
                    <motion.button 
                      onClick={() => copyToClipboard(inviteLink)} 
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      🔗 Copy Invite Link
                    </motion.button>
                  </motion.div>
                  <motion.p 
                    className="text-sm text-gray-400 mt-3"
                    variants={itemVariants}
                  >
                    Share your code with friends. When they register and purchase, you'll earn points!
                  </motion.p>
                </motion.div>

                {/* Referral Stats */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div 
                    className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(255, 107, 53, 0.2)" }}
                  >
                    <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>👥 Total Invites</h3>
                    <motion.div 
                      className={`text-4xl font-bold ${isDarkMode ? 'text-[#FF6B35]' : 'text-[#FF6B35]'}`}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {referralStats.count}
                    </motion.div>
                  </motion.div>
                  <motion.div 
                    className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(34, 197, 94, 0.2)" }}
                  >
                    <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>💰 Total Purchased Amount</h3>
                    <motion.div 
                      className={`text-4xl font-bold ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                    >
                      {referralStats.totalPurchased.toLocaleString()} MMK
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Invitee List */}
                <motion.div 
                  className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}
                  variants={itemVariants}
                >
                  <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📋 Invitee Details</h3>
                  {inviteeList.length === 0 ? (
                    <motion.p 
                      className="text-gray-400"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      No invitees yet. Share your referral link to get started!
                    </motion.p>
                  ) : (
                    <motion.div 
                      className="overflow-x-auto"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
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
                          {inviteeList.map((invitee, idx) => (
                            <motion.tr 
                              key={invitee.id} 
                              className={`border-b ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}
                              variants={itemVariants}
                              whileHover={{ scale: 1.01 }}
                            >
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
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* POINTS HISTORY TAB */}
            {activeTab === 'points' && (
              <motion.div 
                className="space-y-6"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                {/* Points Summary */}
                <motion.div 
                  className="grid grid-cols-1 md:grid-cols-3 gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <motion.div 
                    className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(255, 107, 53, 0.2)" }}
                  >
                    <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>💰 Current Balance</h3>
                    <motion.div 
                      className={`text-4xl font-bold ${isDarkMode ? 'text-[#FF6B35]' : 'text-[#FF6B35]'}`}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      {currentBalance}
                    </motion.div>
                  </motion.div>
                  <motion.div 
                    className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(250, 204, 21, 0.2)" }}
                  >
                    <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🏆 Highest Points</h3>
                    <motion.div 
                      className={`text-4xl font-bold ${isDarkMode ? 'text-yellow-400' : 'text-yellow-600'}`}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                    >
                      {highestPoints}
                    </motion.div>
                  </motion.div>
                  <motion.div 
                    className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02, boxShadow: "0 20px 40px rgba(239, 68, 68, 0.2)" }}
                  >
                    <h3 className={`text-lg font-semibold mb-2 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📉 Used Points</h3>
                    <motion.div 
                      className={`text-4xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                    >
                      {totalUsedPoints}
                    </motion.div>
                  </motion.div>
                </motion.div>

                {/* Points History Table */}
                <motion.div 
                  className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}
                  variants={itemVariants}
                >
                  <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>📊 All Points Earned History</h3>
                  {pointsHistory.length === 0 ? (
                    <ShimmerLoader />
                  ) : (
                    <motion.div 
                      className="overflow-x-auto"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
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
                          {pointsHistory.map((entry, idx) => (
                            <motion.tr 
                              key={entry.id} 
                              className={`border-b ${isDarkMode ? 'border-white/10 hover:bg-white/5' : 'border-gray-200 hover:bg-gray-50'}`}
                              variants={itemVariants}
                              whileHover={{ scale: 1.01 }}
                            >
	                              <td className="py-3 px-2 text-gray-400">
	                                {entry.created_at?.toDate?.() ? 
                                    new Intl.DateTimeFormat('en-GB', {
                                      day: '2-digit',
                                      month: '2-digit',
                                      year: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      hour12: true,
                                      timeZone: 'Asia/Yangon'
                                    }).format(entry.created_at.toDate()) : 'N/A'}
	                              </td>
                              <td className="py-3 px-2">{entry.label}</td>
                              <td className={`py-3 px-2 text-center font-semibold ${entry.type === 'earn' ? 'text-green-400' : 'text-red-400'}`}>
                                {entry.type === 'earn' ? '+' : '-'}{Math.abs(entry.points)}
                              </td>
                              <td className="py-3 px-2 text-right font-semibold">{entry.new_balance}</td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* REDEEM TAB */}
            {activeTab === 'redeem' && (
              <motion.div 
                className="space-y-6"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.div 
                  className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}
                  variants={itemVariants}
                >
                  <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>💎 Available Rewards</h3>
                  {redeemItems.length === 0 ? (
                    <ShimmerLoader />
                  ) : (
                    <motion.div 
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {redeemItems.map((item) => (
                        <motion.div 
                          key={item.id} 
                          className={`p-4 rounded-xl border-2 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}
                          variants={itemVariants}
                          whileHover={{ scale: 1.05, borderColor: "#FF6B35" }}
                        >
                          <h4 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{item.name}</h4>
                          <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                          <div className="mt-3 flex justify-between items-center">
                            <span className={`text-lg font-bold ${isDarkMode ? 'text-[#FF6B35]' : 'text-[#FF6B35]'}`}>{item.required_points} Points</span>
                            <motion.button
                              disabled={currentBalance < item.required_points}
                              className={`px-4 py-2 rounded-lg font-semibold transition ${
                                currentBalance >= item.required_points
                                  ? 'bg-green-600 text-white hover:bg-green-700'
                                  : 'bg-gray-400 text-gray-600 cursor-not-allowed'
                              }`}
                              whileHover={currentBalance >= item.required_points ? { scale: 1.05 } : {}}
                              whileTap={currentBalance >= item.required_points ? { scale: 0.95 } : {}}
                            >
                              Redeem
                            </motion.button>
                          </div>
                          {item.time_limit && <p className="text-xs text-gray-500 mt-2">⏰ {item.time_limit}</p>}
                          {item.spots_limit && <p className="text-xs text-gray-500">📍 {item.spots_limit} spots left</p>}
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* TASKS TAB */}
            {activeTab === 'tasks' && (
              <motion.div 
                className="space-y-6"
                variants={tabContentVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
              >
                <motion.div 
                  className={`rounded-2xl p-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}
                  variants={itemVariants}
                >
                  <h3 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>✅ Available Tasks</h3>
                  {tasks.length === 0 ? (
                    <ShimmerLoader />
                  ) : (
                    <motion.div 
                      className="space-y-3"
                      variants={containerVariants}
                      initial="hidden"
                      animate="visible"
                    >
                      {tasks.map((task) => {
                        const isClaimed = userClaimedTasks.includes(task.id);
                        return (
                          <motion.div 
                            key={task.id} 
                            className={`p-4 rounded-xl border-2 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-gray-200 bg-gray-50'}`}
                            variants={itemVariants}
                            whileHover={{ scale: 1.02, borderColor: isClaimed ? "gray" : "#FF6B35" }}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <h4 className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{task.name}</h4>
                                <p className="text-sm text-gray-400 mt-1">{task.description}</p>
                                <div className="mt-2 flex gap-4">
                                  <span className={`text-sm font-semibold ${isDarkMode ? 'text-[#FF6B35]' : 'text-[#FF6B35]'}`}>🎁 {task.reward_points} Points</span>
                                  {task.deadline && <span className="text-sm text-gray-400">⏰ Deadline: {new Date(task.deadline).toLocaleDateString('en-MM-DD')}</span>}
                                </div>
                              </div>
                              <motion.button
                                disabled={isClaimed}
                                className={`px-4 py-2 rounded-lg font-semibold transition whitespace-nowrap ml-4 ${
                                  isClaimed
                                    ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                                whileHover={!isClaimed ? { scale: 1.05 } : {}}
                                whileTap={!isClaimed ? { scale: 0.95 } : {}}
                              >
                                {isClaimed ? '✓ Claimed' : 'Claim'}
                              </motion.button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Active Giveaways */}
          {activeGiveaways.length > 0 && (
            <motion.div 
              className={`rounded-2xl p-6 mt-6 ${isDarkMode ? 'bg-white/10' : 'bg-white/60 shadow-sm'}`}
              variants={itemVariants}
            >
              <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>🎁 Active Giveaways</h2>
              <motion.div 
                className="space-y-3"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                {activeGiveaways.map((giveaway) => (
                  <motion.div 
                    key={giveaway.id} 
                    className={`p-4 rounded-xl ${isDarkMode ? 'bg-white/5' : 'bg-gray-100'}`}
                    variants={itemVariants}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{giveaway.settings?.giveaway_name || 'Giveaway'}</h3>
                        <p className="text-sm text-gray-400">Draw Date: {giveaway.settings?.draw_date || 'TBA'}</p>
                      </div>
                      <motion.div
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <Link href="/giveaway" className="bg-[#FF6B35] text-white px-4 py-2 rounded-lg text-sm hover:bg-orange-600">View Details</Link>
                      </motion.div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </>
  );
}
