require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Faq = require('./models/faqModel');
const FaqCategory = require('./models/faqCategoryModel');

const slugify = (value = '') =>
  value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

const seedFaqs = async () => {
  try {
    await connectDB();

    // Non-destructive: only adds categories/FAQs that don't already exist by name/question
    // (never clears existing data — this connects to a shared/production MongoDB Atlas cluster).
    const existingCategoryNames = new Set((await FaqCategory.find().select('name')).map((c) => c.name));
    const categoriesToAdd = [
      { name: 'Shipping', slug: 'shipping', description: 'Delivery timelines and shipping-related questions.', sortOrder: 1, status: 'Published' },
      { name: 'Payment', slug: 'payment', description: 'Payment methods and billing questions.', sortOrder: 2, status: 'Published' },
      { name: 'Order & Returns', slug: 'order-returns', description: 'Placing, tracking, cancelling and returning orders.', sortOrder: 3, status: 'Published' },
    ].filter((c) => !existingCategoryNames.has(c.name));
    if (categoriesToAdd.length) await FaqCategory.insertMany(categoriesToAdd);

    const categories = await FaqCategory.find({ name: { $in: ['Shipping', 'Payment', 'Order & Returns'] } }).lean();
    const catByName = Object.fromEntries(categories.map((c) => [c.name, c]));

    const existingQuestions = new Set((await Faq.find().select('question')).map((f) => f.question));
    const faqsToAdd = [
      {
        question: 'How Long Will It Take To Get My Package?',
        answer: '<p>Most orders within India are delivered within 5-7 business days. Handcrafted items made to order may take an additional 2-3 days.</p>',
        categoryKey: 'Shipping',
        sortOrder: 1,
      },
      {
        question: 'What Payment Methods Are Accepted?',
        answer: '<p>We accept UPI, credit/debit cards, net banking and Cash on Delivery (for eligible pin codes).</p>',
        categoryKey: 'Payment',
        sortOrder: 1,
      },
      {
        question: 'Is Buying On-Line Safe?',
        answer: '<p>Yes — all payments are processed through PCI-DSS compliant, encrypted payment gateways. We never store your card details.</p>',
        categoryKey: 'Payment',
        sortOrder: 2,
      },
      {
        question: 'How do I place an Order?',
        answer: '<p>Browse products, add items to your cart, and proceed to checkout. You can pay online or choose Cash on Delivery.</p>',
        categoryKey: 'Order & Returns',
        sortOrder: 1,
      },
      {
        question: 'How Can I Cancel Or Change My Order?',
        answer: '<p>Orders can be cancelled or modified within 2 hours of placing them from the "My Orders" section, before they are dispatched.</p>',
        categoryKey: 'Order & Returns',
        sortOrder: 2,
      },
      {
        question: 'Do I need an account to place an order?',
        answer: '<p>No, you can check out as a guest. Creating an account lets you track orders and save addresses for faster checkout.</p>',
        categoryKey: 'Order & Returns',
        sortOrder: 3,
      },
      {
        question: 'How Do I Track My Order?',
        answer: '<p>Once shipped, you will receive a tracking link via email/SMS. You can also track it from "My Orders" in your account.</p>',
        categoryKey: 'Shipping',
        sortOrder: 2,
      },
    ]
      .filter((f) => !existingQuestions.has(f.question))
      .map(({ categoryKey, ...f }) => ({
        ...f,
        slug: slugify(f.question),
        category: catByName[categoryKey]?._id || null,
        categoryName: catByName[categoryKey]?.name || '',
        status: 'Published',
      }));

    if (faqsToAdd.length) await Faq.insertMany(faqsToAdd);

    console.log(`Seeded ${categoriesToAdd.length} new categor(y/ies) and ${faqsToAdd.length} new FAQ(s) (existing data untouched).`);
    process.exit();
  } catch (error) {
    console.error('Error seeding FAQs:', error);
    process.exit(1);
  }
};

seedFaqs();
