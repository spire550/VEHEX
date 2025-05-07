import moment from 'moment';
import Product from '../../../DB/models/user/Product.model.js';
import User from '../../../DB/models/user/User.model.js';
import Order from '../../../DB/models/user/Order.model.js';

export const getDashboardStats = async (req, res, next) => {
  try {
    const now = moment();
    const startOfCurrentMonth = now.clone().startOf('month');
    const startOfLastMonth = now.clone().subtract(1, 'month').startOf('month');
    const endOfLastMonth = now.clone().startOf('month');

    // Revenue and Orders for Current Month
    const currentStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startOfCurrentMonth.toDate() },
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    // Revenue and Orders for Last Month
    const lastStats = await Order.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startOfLastMonth.toDate(),
            $lt: endOfLastMonth.toDate(),
          },
          paymentStatus: "paid",
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$totalPrice" },
          totalTransactions: { $sum: 1 },
        },
      },
    ]);

    // Total products and customers
    const [totalProducts, totalCustomers] = await Promise.all([
      Product.countDocuments(),
      User.countDocuments({ role: "user" }), // assuming "user" is the customer role
    ]);

    const revenueNow = currentStats[0]?.totalRevenue || 0;
    const revenueLast = lastStats[0]?.totalRevenue || 0;
    const transactionNow = currentStats[0]?.totalTransactions || 0;
    const transactionLast = lastStats[0]?.totalTransactions || 0;

    // Percent changes
    const revenueChange = revenueLast
      ? ((revenueNow - revenueLast) / revenueLast) * 100
      : 0;
    const transactionChange = transactionLast
      ? ((transactionNow - transactionLast) / transactionLast) * 100
      : 0;

    res.json({
      totalProducts,
      totalCustomers,
      totalRevenue: revenueNow,
      totalTransactions: transactionNow,
      revenueChange: revenueChange.toFixed(2),
      transactionChange: transactionChange.toFixed(2),
    });
  } catch (error) {
    next(error);
  }
};


export const sales = async (req, res, next) => {
    try {
      const stats = await Order.aggregate([
        {
          $match: {
            paymentStatus: "paid", // Only consider paid orders
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$totalPrice" },
            totalOrders: { $sum: 1 },
            totalItems: { $sum: { $sum: "$items.quantity" } },
          },
        },
        {
          $project: {
            _id: 0,
            averageSaleValue: {
              $cond: [
                { $eq: ["$totalOrders", 0] },
                0,
                { $divide: ["$totalRevenue", "$totalOrders"] },
              ],
            },
            averageItemsPerSale: {
              $cond: [
                { $eq: ["$totalOrders", 0] },
                0,
                { $divide: ["$totalItems", "$totalOrders"] },
              ],
            },
          },
        },
      ]);
  
      res.json(stats[0] || { averageSaleValue: 0, averageItemsPerSale: 0 });
    } catch (error) {
      next(error);
    }
  };
  