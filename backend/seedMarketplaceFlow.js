require('dotenv').config();
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');
const User = require('./models/userModel');
const Vendor = require('./models/vendorModel');
const Product = require('./models/productModel');
const Inventory = require('./models/inventoryModel');
const Order = require('./models/orderModel');
const Earning = require('./models/earningModel');
const ReturnRequest = require('./models/returnRequestModel');
const Payout = require('./models/payoutModel');
const IncompleteOrder = require('./models/incompleteOrderModel');
const Category = require('./models/categoryModel');
const { stockStatusFromQty } = require('./constants/flow');

const upsertInventory = async (product, stock) => {
  const status = stockStatusFromQty(stock, product.trackQuantity);
  await Inventory.findOneAndUpdate(
    { product: product._id },
    {
      product: product._id,
      vendor: product.vendor,
      stock,
      warehouse: product.warehouse,
      trackQuantity: product.trackQuantity,
      stockStatus: status,
    },
    { upsert: true }
  );
  product.stockStatus = status;
  await product.save();
};

const run = async () => {
  await connectDB();

  const password = await bcrypt.hash('123456', 10);

  let admin = await User.findOne({ email: 'admin@gmail.com' });
  if (!admin) {
    admin = await User.create({
      name: 'Admin Final',
      email: 'admin@gmail.com',
      password: await bcrypt.hash('admin', 10),
      role: 'admin',
    });
    console.log('Created demo admin admin@gmail.com / admin');
  }

  let customer = await User.findOne({ email: 'rahul@jaipurio.com' });
  if (!customer) {
    customer = await User.create({
      name: 'Rahul Verma',
      email: 'rahul@jaipurio.com',
      mobile: '9829044521',
      password,
      role: 'user',
    });
  }

  let vendor = await Vendor.findOne({ email: 'vendor@jaipurio.com' });
  if (!vendor) {
    vendor = await Vendor.create({
      fullName: 'Shyam Lal',
      email: 'vendor@jaipurio.com',
      mobile: '9876543210',
      password,
      businessName: 'Shyam Pottery',
      gstNumber: '08ABCDE1234F1Z5',
      businessType: 'Handicrafts',
      businessAddress: 'Sanganer, Jaipur',
      city: 'Jaipur',
      state: 'Rajasthan',
      accountHolderName: 'Shyam Lal',
      bankName: 'SBI Jaipur',
      accountNumber: 'XXXXXXXX4521',
      ifscCode: 'SBIN0003024',
      storeName: 'Shyam Pottery',
      storeDescription: 'Handmade Jaipur jewellery and puja crafts.',
      categories: ['Jewellery', 'Home & Living'],
      documents: [],
      isApproved: true,
      kycStatus: 'Verified',
      bankVerified: true,
      plan: 'Growth',
      commissionRate: 12,
    });
    console.log('Created demo vendor vendor@jaipurio.com / 123456');
  } else {
    vendor.isApproved = true;
    vendor.isBlocked = false;
    vendor.kycStatus = 'Verified';
    vendor.plan = vendor.plan || 'Growth';
    vendor.commissionRate = vendor.commissionRate || 12;
    vendor.password = password;
    await vendor.save();
    console.log('Updated demo vendor vendor@jaipurio.com / 123456');
  }

  const jewellery = await Category.findOneAndUpdate(
    { title: 'Jewellery', parent: null },
    { title: 'Jewellery', path: 'Jewellery', level: 1, slug: 'jewellery', url: '' },
    { upsert: true, returnDocument: 'after' }
  );
  await Category.findOneAndUpdate(
    { title: 'Earrings', parent: jewellery._id },
    { title: 'Earrings', parent: jewellery._id, path: 'Jewellery / Earrings', level: 2, slug: 'earrings', url: '' },
    { upsert: true, returnDocument: 'after' }
  );

  const productsSeed = [
    {
      sku: 'JP-BAN-001',
      name: 'Kundan Bangle Set',
      title: 'Kundan Bangle Set',
      category: 'Jewellery / Bangles',
      price: 2499,
      salePrice: 1999,
      oldPrice: 1999,
      discountProductPrice: 200,
      costPerItem: 1100,
      barcode: '890123456001',
      stock: 12,
      lifecycle: 'Pending Approval',
      warehouse: 'Jaipur WH-1',
      tags: 'kundan, bridal',
    },
    {
      sku: 'JP-CHW-014',
      name: 'Marble Ganesh Chowki',
      title: 'Marble Ganesh Chowki',
      category: 'Home & Living / Spirituality & Religion / Religious Home & Decor / Chowki',
      price: 4599,
      costPerItem: 2100,
      barcode: '890123456014',
      stock: 0,
      lifecycle: 'Published',
      warehouse: 'Jaipur WH-1',
      isFeatured: true,
      tags: 'ganesh, marble',
    },
    {
      sku: 'JP-EAR-009',
      name: 'Silver Jhumka Earrings',
      title: 'Silver Jhumka Earrings',
      category: 'Jewellery / Earrings',
      price: 1299,
      costPerItem: 480,
      barcode: '890123456009',
      stock: 6,
      lifecycle: 'Draft',
      warehouse: 'Jaipur WH-1',
      tags: 'silver, jhumka',
    },
  ];

  const products = {};
  for (const row of productsSeed) {
    const payload = {
      ...row,
      vendor: vendor._id,
      storeName: 'Shyam Pottery',
      brand: 'Jaipurio Heritage',
      image: '',
      trackQuantity: true,
      sku: row.sku,
    };
    delete payload.stock;
    let product = await Product.findOne({ sku: row.sku });
    if (!product) product = await Product.create(payload);
    else {
      Object.assign(product, payload);
      await product.save();
    }
    await upsertInventory(product, row.stock);
    products[row.sku] = product;
  }

  const ensureOrder = async (orderNumber, data) => {
    let order = await Order.findOne({ orderNumber });
    if (order) return order;
    order = await Order.create({ orderNumber, ...data });
    return order;
  };

  const processing = await ensureOrder('00000373', {
    user: customer._id,
    customerName: 'Aditi Sharma',
    customerPhone: '98100 22311',
    guest: false,
    paymentStatus: 'Paid',
    orderStatus: 'Processing',
    isPaid: true,
    paidAmount: 2494,
    itemsPrice: 2499,
    discountAmount: 200,
    shippingPrice: 80,
    taxPrice: 115,
    totalPrice: 2494,
    paymentMethod: 'Online',
    shippingAddress: { address: 'C-12 Civil Lines', city: 'Jaipur', town: 'Jaipur', postalCode: '302001', country: 'India', phone: '9810022311' },
    orderItems: [{
      product: products['JP-BAN-001']._id,
      name: 'Kundan Bangle Set',
      qty: 1,
      price: 2499,
      lineTotal: 2499,
      vendor: vendor._id,
      status: 'Processing',
    }],
    shipment: { number: 'SHP-000373', method: 'Default', status: 'Processing', note: '' },
  });

  const completed = await ensureOrder('00000374', {
    user: customer._id,
    customerName: 'Rahul Verma',
    customerPhone: '98290 44521',
    guest: true,
    paymentStatus: 'Paid',
    orderStatus: 'Completed',
    isPaid: true,
    isDelivered: true,
    paidAmount: 4949,
    itemsPrice: 4599,
    discountAmount: 0,
    shippingPrice: 120,
    taxPrice: 230,
    totalPrice: 4949,
    paymentMethod: 'Online',
    completedAt: new Date('2026-08-12'),
    returnWindowClosesAt: new Date('2026-08-19'),
    shippingAddress: { address: 'Sanganer', city: 'Jaipur', town: 'Sanganer', postalCode: '302029', country: 'India', phone: '9829044521' },
    orderItems: [{
      product: products['JP-CHW-014']._id,
      name: 'Marble Ganesh Chowki',
      qty: 1,
      price: 4599,
      lineTotal: 4599,
      vendor: vendor._id,
      status: 'Delivered',
    }],
    shipment: { number: 'SHP-000374', method: 'Dispatched', status: 'Delivered', note: 'Delivered to customer' },
  });

  await ensureOrder('00000375', {
    user: customer._id,
    customerName: 'Priya Singh',
    customerPhone: '97654 11220',
    guest: false,
    paymentStatus: 'Paid',
    orderStatus: 'Payment Confirmed',
    isPaid: true,
    paidAmount: 1424,
    itemsPrice: 1299,
    discountAmount: 0,
    shippingPrice: 60,
    taxPrice: 65,
    totalPrice: 1424,
    paymentMethod: 'Online',
    shippingAddress: { address: 'Vaishali Nagar', city: 'Jaipur', town: 'Jaipur', postalCode: '302021', country: 'India', phone: '9765411220' },
    orderItems: [{
      product: products['JP-EAR-009']._id,
      name: 'Silver Jhumka Earrings',
      qty: 1,
      price: 1299,
      lineTotal: 1299,
      vendor: vendor._id,
      status: 'Processing',
    }],
    shipment: { status: 'Not created' },
  });

  if (!(await Earning.findOne({ order: completed._id }))) {
    const item = completed.orderItems[0];
    await Earning.create({
      vendor: vendor._id,
      order: completed._id,
      orderItem: item._id,
      productName: item.name,
      totalAmount: 4599,
      costPerItem: 2100,
      commissionRate: 12,
      commissionAmount: 552,
      netEarning: 4047,
      status: 'Available',
      availableAt: new Date(),
    });
  }

  if (processing.orderItems[0] && !(await Earning.findOne({ order: processing._id }))) {
    const item = processing.orderItems[0];
    await Earning.create({
      vendor: vendor._id,
      order: processing._id,
      orderItem: item._id,
      productName: item.name,
      totalAmount: 2499,
      costPerItem: 1100,
      commissionRate: 12,
      commissionAmount: 300,
      netEarning: 2199,
      status: 'Pending',
    });
  }

  if (!(await ReturnRequest.findOne({ rmaNumber: 'RMA-1001' }))) {
    await ReturnRequest.create({
      rmaNumber: 'RMA-1001',
      order: completed._id,
      vendor: vendor._id,
      user: customer._id,
      customer: 'Rahul Verma',
      reason: 'Chip on the corner of the chowki',
      photos: 2,
      status: 'Vendor Review',
    });
  }

  if (!(await Payout.findOne({ payoutNumber: 'PO-18' }))) {
    await Payout.create({
      payoutNumber: 'PO-18',
      vendor: vendor._id,
      amount: 1840,
      status: 'Pending approval',
      bankSnapshot: {
        accountHolderName: vendor.accountHolderName,
        bankName: vendor.bankName,
        accountNumber: vendor.accountNumber,
        ifscCode: vendor.ifscCode,
      },
    });
  }

  const incomplete = [
    { code: 'ORD-INC-1041', customer: 'Aditi Sharma', amount: 1247, status: 'Abandoned' },
    { code: 'ORD-INC-1042', customer: 'Rahul Verma', amount: 899, status: 'Awaiting payment' },
    { code: 'ORD-INC-1043', customer: 'Priya Singh', amount: 2150, status: 'Pending' },
  ];
  for (const row of incomplete) {
    await IncompleteOrder.findOneAndUpdate(
      { code: row.code },
      { ...row, vendor: vendor._id },
      { upsert: true }
    );
  }

  console.log('Marketplace flow seed complete.');
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
