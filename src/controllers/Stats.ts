import { nodeCache } from "../app.js";
import { TryCatchBlockWrapper } from "../middlewares/Error.js";
import { Order } from "../schema/Order.js";
import { Product } from "../schema/Product.js";
import { User } from "../schema/User.js";
import { calculatePercentage, getChartData } from "../utils/Features.js";


export const dashboardStats = TryCatchBlockWrapper(
    async (
        req,
        res,
        next,
    ) => {

        let stats;
        const key = "admin-stats"

        if (nodeCache.has(key)) {
            stats = JSON.parse(nodeCache.get(key) as string);
        }
        else {
            const today = new Date();
            const sixMonthAgo = new Date();

            sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6);

            const thisMonth = {
                start: new Date(today.getFullYear(), today.getMonth(), 1), // starting date of this month
                end: today,
            }

            const lastMonth = {
                start: new Date(today.getFullYear(), today.getMonth() - 1, 1), // Last month 1st date
                end: new Date(today.getFullYear(), today.getMonth(), 0) // Last month last date
            }

            const thisMonthProducts = Product.find({
                createdAt: {
                    $gte: thisMonth.start,
                    $lte: thisMonth.end
                },
            });

            const lastMonthProducts = Product.find({
                createdAt: {
                    $gte: lastMonth.start,
                    $lte: lastMonth.end
                },
            });

            const thisMonthUsers = User.find({
                createdAt: {
                    $gte: thisMonth.start,
                    $lte: thisMonth.end
                },
            });

            const lastMonthUsers = User.find({
                createdAt: {
                    $gte: lastMonth.start,
                    $lte: lastMonth.end
                },
            });

            const thisMonthOrders = Order.find({
                createdAt: {
                    $gte: thisMonth.start,
                    $lte: thisMonth.end
                },
            });

            const lastMonthOrders = Order.find({
                createdAt: {
                    $gte: lastMonth.start,
                    $lte: lastMonth.end
                },
            });

            // last six month 

            const sixMonthOrders = Order.find({
                createdAt: {
                    $gte: sixMonthAgo,
                    $lte: today,
                }
            });

            const latestTransaction = Order.find({}).select(["orderItems", "total", "discount", "status"]).limit(4);

            const [monthProducts, monthUsers, monthOrders, prevProducts, prevUsers, prevOrders, productsCount, usersCount, allOrders, prevSixMonthOrders, categories, femaleCount, maleCount, transactions] = await Promise.all(
                [
                    thisMonthProducts,
                    thisMonthUsers,
                    thisMonthOrders,
                    lastMonthProducts,
                    lastMonthUsers,
                    lastMonthOrders,
                    Product.countDocuments(),
                    User.countDocuments(),
                    Order.find({}).select("total"),
                    sixMonthOrders,
                    Product.distinct("category"),
                    User.countDocuments({ gender: "female" }),
                    User.countDocuments({ gender: "male" }),
                    latestTransaction,
                ]
            );

            const MonthRevenue = monthOrders.reduce(
                (total, order) => total + (order.total || 0), 0
            );
            const prevMonthRevenue = prevOrders.reduce(
                (total, order) => total + (order.total || 0), 0
            );

            const precent = {

                revenue: calculatePercentage(MonthRevenue, prevMonthRevenue),

                product: calculatePercentage(
                    monthProducts.length,
                    prevProducts.length
                ),


                user: calculatePercentage(
                    monthUsers.length,
                    prevUsers.length
                ),

                order: calculatePercentage(
                    monthOrders.length,
                    prevOrders.length
                ),

            };

            const Revenue = allOrders.reduce(
                (total, order) => total + (order.total || 0), 0
            );

            const count = {
                revenue: Revenue,
                product: productsCount,
                user: usersCount,
                order: allOrders.length,
            }

            const orderMonthCounts = new Array(6).fill(0);
            const orderMonthRevenue = new Array(6).fill(0);

            prevSixMonthOrders.forEach((order) => {
                const orderCreated = order.createdAt;
                const monthDiff = ((today.getMonth() - orderCreated.getMonth()) + 12) % 12;

                if (monthDiff < 6) {
                    orderMonthCounts[6 - monthDiff - 1] += 1;
                    orderMonthRevenue[6 - monthDiff - 1] += order.total;
                }
            });

            const countCategoriesArr = categories.map((category) =>
                Product.countDocuments({ category })
            );

            const countCategory = await Promise.all(countCategoriesArr);

            const releationOfCategories: Record<string, number>[] = [];

            categories.forEach((category, idx) => {
                releationOfCategories.push({
                    [category]: Math.round((countCategory[idx] / productsCount) * 100),
                });
            });

            const genderRatio = {
                male: maleCount,
                female: femaleCount,
                others: usersCount - (maleCount + femaleCount),
            }

            const modifiedTransanction = transactions.map(idx => ({
                _id: idx._id,
                discount: idx.discount,
                amount: idx.total,
                status: idx.status,
                quantity: idx.orderItems.length
            }))

            stats = {
                releationOfCategories,
                precent,
                count,
                chart: {
                    order: orderMonthCounts,
                    revenue: orderMonthRevenue,
                },
                genderRatio,
                latesttransactions: modifiedTransanction,
            };

            nodeCache.set(key, JSON.stringify(stats));
        }

        return res.status(200).json({
            success: true,
            stats,
        })

    }
);


export const dashboardPie = TryCatchBlockWrapper(
    async (req, res, next) => {

        let charts;
        const key = "admin-pie-charts"
        if (nodeCache.has(key)) {
            charts = JSON.parse(nodeCache.get(key) as string);
        }
        else {

            const [processingCount, shippingCount, deliveredCount, categories, productsCount, productsOutofStocks, allOrders, userDOB, adminUser, clientUser] = await Promise.all([
                Order.countDocuments({ status: "Processing" }),
                Order.countDocuments({ status: "Shipped" }),
                Order.countDocuments({ status: "Delivered" }),
                Product.find({}).distinct("category"),
                Product.countDocuments(),
                Product.countDocuments({ stock: 0 }),
                Order.find({}).select(["total", "discount", "subtotal", "tax", "shippingCharges"]),
                User.find({}).select(["dob"]),
                User.countDocuments({ role: "admin" }),
                User.countDocuments({ role: "user" }),
            ]);

            const countCategoriesArr = categories.map((category) =>
                Product.countDocuments({ category })
            );

            const countCategory = await Promise.all(countCategoriesArr);

            const releationOfCategories: Record<string, number>[] = [];

            categories.forEach((category, idx) => {
                releationOfCategories.push({
                    [category]: Math.round((countCategory[idx] / productsCount) * 100),
                });
            });

            const orderFullfillment = {
                processing: processingCount,
                shipped: shippingCount,
                delivered: deliveredCount,
            }

            const stockAvailability = {
                inStock: productsCount - productsOutofStocks,
                outofStock: productsOutofStocks,
            }

            const grossIncome = allOrders.reduce(
                (prev, order) => prev + (order.total || 0), 0
            );
            const discount = allOrders.reduce(
                (prev, order) => prev + (order.discount || 0), 0
            );
            const productionCost = allOrders.reduce(
                (prev, order) => prev + (order.shippingCharges || 0), 0
            );
            const burnt = allOrders.reduce(
                (prev, order) => prev + (order.tax || 0), 0
            );
            const marketingCost = Math.round(grossIncome * (20 / 100));
            const netMargin = grossIncome - discount - productionCost - burnt - marketingCost;


            const revenueDistribution = {
                netMargin,
                discount,
                productionCost,
                burnt,
                marketingCost,
            }

            // const teen = 

            const usersAgeGroup = {
                teen: userDOB.filter(idx => idx.age < 20).length,
                adult: userDOB.filter(idx => idx.age > 20 && idx.age < 40).length,
                old: userDOB.filter(idx => idx.age > 40).length
            }

            const adminCustomer = {
                admin: adminUser,
                customers: clientUser,
            }

            charts = {
                orderFullfillment,
                releationOfCategories,
                stockAvailability,
                revenueDistribution,
                usersAgeGroup,
                adminCustomer,
            }

            nodeCache.set(key, JSON.stringify(charts));
        }


        return res.status(200).json({
            success: true,
            charts,
        })
    }
);


export const dashboardBar = TryCatchBlockWrapper(
    async (req,res,next) => {
        let charts;
        const key = "admin-bar-charts";

        if(nodeCache.has(key))
        {
            charts = JSON.parse(nodeCache.get(key) as string);
        }
        else
        {

            const today = new Date();
            const sixMonthAgo = new Date();
            sixMonthAgo.setMonth(sixMonthAgo.getMonth() - 6); 

            const twelveMonthAgo = new Date();
            twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12); 

            const lastSixMonthProducts = Product.find({createdAt:{
                $gte: sixMonthAgo,
                $lte: today
            }}).select("createdAt");
            const lasttwelveMonthOrders = Order.find({createdAt:{
                $gte: twelveMonthAgo,
                $lte: today
            }}).select("createdAt");
            const lastSixMonthUsers = User.find({createdAt:{
                $gte: sixMonthAgo,
                $lte: today
            }}).select("createdAt");

            const [sixMonthProducts,twelveMonthOrders,sixMonthUsers] = await Promise.all([
                lastSixMonthProducts,
                lasttwelveMonthOrders,
                lastSixMonthUsers,
            ]);

            const productsCount = getChartData({length: 6, docArr: sixMonthProducts});
            const ordersCount = getChartData({length: 12, docArr: twelveMonthOrders});
            const usersCount = getChartData({length: 6, docArr: sixMonthUsers});

            charts = {
                products: productsCount,
                orders: ordersCount,
                users: usersCount,
            };

            nodeCache.set(key,JSON.stringify(charts));
        }

        return res.status(200).json({
            success: true,
            charts,
        })
    }
);
export const dashboardLine = TryCatchBlockWrapper(
    async (req,res,next) => {
        let charts;
        const key = "admin-line-charts";

        if(nodeCache.has(key))
        {
            charts = JSON.parse(nodeCache.get(key) as string);
        }
        else
        {

            const today = new Date();

            const twelveMonthAgo = new Date();
            twelveMonthAgo.setMonth(twelveMonthAgo.getMonth() - 12); 

            const lasttwelveMonthProducts = Product.find({createdAt:{
                $gte: twelveMonthAgo,
                $lte: today
            }}).select("createdAt");
            const lasttwelveMonthUsers = User.find({createdAt:{
                $gte: twelveMonthAgo,
                $lte: today
            }}).select("createdAt");
            const lasttwelveMonthOrdes = Order.find({createdAt:{
                $gte: twelveMonthAgo,
                $lte: today
            }}).select(["createdAt","discount","total"]);

            const [twelveMonthProducts,twelveMonthUsers,twelveMonthOrders] = await Promise.all([
                lasttwelveMonthProducts,
                lasttwelveMonthUsers,
                lasttwelveMonthOrdes,
            ]);

            const productsCount = getChartData({length: 12, docArr: twelveMonthProducts}); 
            const usersCount = getChartData({length: 12, docArr: twelveMonthUsers});
            const discount = getChartData({length: 12, docArr: twelveMonthOrders, property: "discount"});
            const revenue = getChartData({length: 12, docArr: twelveMonthOrders, property: "total"});

            charts = {
                users: usersCount,
                products: productsCount,
                discount,
                revenue,
            };

            nodeCache.set(key,JSON.stringify(charts));
        }

        return res.status(200).json({
            success: true,
            charts,
        })
    }
);