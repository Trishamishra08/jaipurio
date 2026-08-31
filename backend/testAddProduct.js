require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Vendor = require('./models/vendorModel');
const jwt = require('jsonwebtoken');
const axios = require('axios');

const generateToken = (id) => {
  return jwt.sign({ id, role: 'vendor' }, process.env.JWT_ACCESS_SECRET || 'secret123', {
    expiresIn: '30d',
  });
};

const testAddProduct = async () => {
  await connectDB();
  
  let vendor = await Vendor.findOne();
  if (!vendor) {
    vendor = await Vendor.create({
      fullName: 'Test Vendor',
      email: 'vendor1@test.com',
      mobile: '9999999999',
      password: 'password',
      businessName: 'Vendor Store',
      gstNumber: 'GST123',
      businessType: 'Retail',
      businessAddress: '123 Test St',
      city: 'Delhi',
      state: 'Delhi',
      accountHolderName: 'Test Vendor',
      bankName: 'Test Bank',
      accountNumber: '1234567890',
      ifscCode: 'TEST001',
      storeName: 'Test Store',
      storeDescription: 'Test store description',
      isApproved: true
    });
  }

  const token = generateToken(vendor._id);
  console.log('Vendor token generated');

  try {
    const res = await axios.post('http://localhost:5000/api/products', {
      name: 'Vendor Test Product',
      price: 199,
      image: '/test.png',
      category: 'Wellness',
    }, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Product added successfully:', res.data);
  } catch (error) {
    console.error('Error adding product:', error.response ? error.response.data : error.message);
  }

  process.exit(0);
};

testAddProduct();
