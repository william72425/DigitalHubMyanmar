import { db } from '@/utils/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';

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
    const commissionPercent = promoData.partner_commission_percent || 0;

    // Get all users who used this promo code
    const usersQuery = query(collection(db, 'users'), where('used_promote_code', '==', promoCode));
    const usersSnapshot = await getDocs(usersQuery);
    const userIds = usersSnapshot.docs.map(doc => doc.id);

    if (userIds.length === 0) {
      return res.status(200).json({
        promoCode,
        commissionPercent,
        users: [],
        totalCommission: 0,
        pendingCommission: 0,
        paidCommission: 0,
        highestCommission: 0
      });
    }

    // Get all completed orders for these users
    let filteredOrders = [];
    for (const userId of userIds) {
      const ordersQuery = query(
        collection(db, 'orders'),
        where('user_id', '==', userId),
        where('status', '==', 'completed')
      );
      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({
        ...doc.data(),
        created_at: doc.data().created_at?.toDate() || new Date()
      }));
      filteredOrders = [...filteredOrders, ...orders];
    }

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

      if (period !== 'custom') {
        filteredOrders = filteredOrders.filter(o => o.created_at >= start);
      }
    }

    // Calculate commissions
    let totalAmount = 0;
    let totalCommission = 0;
    let highestCommission = 0;

    const userCommissions = {};

    filteredOrders.forEach(order => {
      const amount = order.final_price || 0;
      const commission = Math.floor(amount * commissionPercent / 100);
      
      totalAmount += amount;
      totalCommission += commission;
      highestCommission = Math.max(highestCommission, commission);

      if (!userCommissions[order.user_id]) {
        userCommissions[order.user_id] = {
          username: order.username || 'Unknown',
          totalPurchase: 0,
          totalCommission: 0,
          orders: []
        };
      }

      userCommissions[order.user_id].totalPurchase += amount;
      userCommissions[order.user_id].totalCommission += commission;
      userCommissions[order.user_id].orders.push({
        productName: order.product_name,
        amount: amount,
        commission: commission,
        date: order.created_at
      });
    });

    // Get commission payment records
    const paymentsQuery = query(
      collection(db, 'partner_commission_payments'),
      where('promo_code', '==', promoCode)
    );
    const paymentsSnapshot = await getDocs(paymentsQuery);
    const payments = paymentsSnapshot.docs.map(doc => doc.data());
    
    const paidCommission = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    const pendingCommission = totalCommission - paidCommission;

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
    return res.status(500).json({ error: 'Failed to fetch commission data' });
  }
}
