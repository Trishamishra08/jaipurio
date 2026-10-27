const cod = require('./cod');
const razorpay = require('./razorpay');
const bankTransfer = require('./bankTransfer');
const stripe = require('./stripe');
const paypal = require('./paypal');
const paystack = require('./paystack');
const cashfree = require('./cashfree');

const REGISTRY = {
  cod,
  razorpay,
  bank_transfer: bankTransfer,
  stripe,
  paypal,
  paystack,
  cashfree,
};

const getGateway = (code) => REGISTRY[code] || null;

const listGatewayDefs = () => Object.values(REGISTRY);

module.exports = { getGateway, listGatewayDefs, REGISTRY };
