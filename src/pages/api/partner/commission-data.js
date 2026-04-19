import { db } from '@/utils/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Helper function to format date in Myanmar timezone (UTC+6:30)
function formatMyanmarDate(date) {
  if (!date) return 'N/A';
  
  let dateObj = date;
  if (typeof date.toDate === 'function') {
    dateObj = date.toDate();
  } else if (typeof date === 'string') {
    dateObj = new Date(date);
  }
  
  // Myanmar timezone is UTC+6:30
  const myanmarTime = new Date(dateObj.getTime() + (6.5 * 60 * 60 * 1000) - (dateObj.getTimezoneOffset() * 60 * 1000));
  
  return myanmarTime.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { promoCode, period = 'all', startDate, endDate } = req.query;

    if (!promoCode) {
      return res.status(400).json({ error: 'Promo code is required' });
    }

    // Get promo code document
    const promoQuery = query(collection(db, 'promo_codes'), where('code', '==', promoCode));
    const promoSnapshot = await getDocs(promoQuery);

    if (promoSnapshot.empty) {
      return res.status(404).json({ error: 'Promo code not found' });
    }

    const promoData = promoSnapshot.docs[0].data();
    const commissionPercent = Number(promoData.partner_commission_percent) || 0;

    // Get all users who used this promo code
    const usersQuery = query(collection(db, 'users'), where('used_promote_code', '==', promoCode));
    const usersSnapshot = await getDocs(usersQuery);
    
    const userMap = {};
    usersSnapshot.docs.forEach(doc => {
      userMap[doc.id] = doc.data().username || 'Unknown User';
    });
    
    const userIds = Object.keys(userMap);

    if (userIds.length === 0) {
      return res.status(200).json({
        promoCode,
        commissionPercent,
        users: [],
        totalAmount: 0,
        totalCommission: 0,
        pendingCommission: 0,
        paidCommission: 0,
        highestCommission: 0,
        paymentHistory: []
      });
    }

    // Fetch all completed orders for these users
    const ordersSnapshot = await getDocs(collection(db, 'orders'));
    let filteredOrders = ordersSnapshot.docs
      .map(doc => {
        const data = doc.data();
        let createdAtDate = new Date();
        if (data.created_at) {
          createdAtDate = typeof data.created_at.toDate === 'function' ? data.created_at.toDate() : new Date(data.created_at);
        }
        return { id: doc.id, ...data, created_at: createdAtDate };
      })
      .filter(o => o.status === 'completed' && userIds.includes(o.user_id));

    // Apply period filter
    if (period !== 'all') {
      const now = new Date();
      let start = new Date();

      if (period === 'daily') {
        start.setHours(0, 0, 0, 0);
      } else if (period === 'weekly') {
        start.setDate(now.getDate() - 7);
      } else if (period === 'monthly') {
        start.setMonth(now.getMonth() - 1);
      } else if (period === 'custom' && startDate && endDate) {
        start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filteredOrders = filteredOrders.filter(o => o.created_at >= start && o.created_at <= end);
      }

      if (period !== 'custom' && period !== 'all') {
        filteredOrders = filteredOrders.filter(o => o.created_at >= start);
      }
    }

    // Calculate commissions
    let totalAmount = 0;
    let totalCommission = 0;
    let highestCommission = 0;

    const userCommissions = {};

    filteredOrders.forEach(order => {
      const amount = Number(order.final_price) || 0;
      const commission = Math.floor(amount * commissionPercent / 100);
      
      totalAmount += amount;
      totalCommission += commission;
      highestCommission = Math.max(highestCommission, commission);

      if (!userCommissions[order.user_id]) {
        userCommissions[order.user_id] = {
          username: userMap[order.user_id] || order.username || 'Unknown',
          totalPurchase: 0,
          totalCommission: 0,
          orders: []
        };
      }

      userCommissions[order.user_id].totalPurchase += amount;
      userCommissions[order.user_id].totalCommission += commission;
      userCommissions[order.user_id].orders.push({
        productName: order.product_name || 'Product',
        amount: amount,
        commission: commission,
        date: order.created_at
      });
    });

    // Get commission payment records with proper date formatting
    const paymentsSnapshot = await getDocs(collection(db, 'partner_commission_payments'));
    const payments = paymentsSnapshot.docs
      .map(doc => {
        const data = doc.data();
        return {
          ...data,
          paid_at: formatMyanmarDate(data.paid_at),
          created_at: formatMyanmarDate(data.created_at)
        };
      })
      .filter(p => p.promo_code === promoCode)
      .sort((a, b) => {
        // Sort by date descending (newest first)
        const dateA = new Date(a.paid_at);
        const dateB = new Date(b.paid_at);
        return dateB - dateA;
      });
    
    const paidCommission = paymentsSnapshot.docs
      .map(doc => doc.data())
      .filter(p => p.promo_code === promoCode)
      .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    
    const pendingCommission = Math.max(0, totalCommission - paidCommission);

    return res.status(200).json({
      promoCode,
      commissionPercent,
      period,
      users: Object.values(userCommissions),
      totalAmount,
      totalCommission,
      paidCommission,
      pendingCommission,
      highestCommission,
      paymentHistory: payments
    });
  } catch (error) {
    console.error('Error fetching commission data:', error);
    return res.status(500).json({ error: 'Failed to fetch commission data: ' + error.message });
  }
}
