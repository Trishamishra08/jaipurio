const cod = require('./cod');
const razorpay = require('./razorpay');
const bankTransfer = require('./bankTransfer');
const stripe = require('./stripe');
const paypal = require('./paypal');
const paystack = require('./paystack');

const REGISTRY = {
  cod,
  razorpay,
  bank_transfer: bankTransfer,
  stripe,
  paypal,
  paystack,
};

const getGateway = (code) => REGISTRY[code] || null;

const listGatewayDefs = () => Object.values(REGISTRY);

module.exports = { getGateway, listGatewayDefs, REGISTRY };
