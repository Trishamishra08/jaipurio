require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const Contact = require('./models/contactModel');
const ContactCustomField = require('./models/contactCustomFieldModel');

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

const seedContacts = async () => {
  try {
    await connectDB();

    // Non-destructive: only adds documents, never clears existing data (this may be
    // a shared/production database — never run deleteMany() here without checking first).
    const existingFieldNames = new Set((await ContactCustomField.find().select('name')).map((f) => f.name));
    const customFieldsToAdd = [
      { type: 'Text', name: 'Address', slug: 'address', placeholder: 'Your address', isRequired: false, sortOrder: 1, status: 'Published' },
      { type: 'Phone', name: 'Alternate Phone', slug: 'alternate-phone', placeholder: 'Alternate phone number', isRequired: false, sortOrder: 2, status: 'Published' },
    ].filter((f) => !existingFieldNames.has(f.name));
    if (customFieldsToAdd.length) await ContactCustomField.insertMany(customFieldsToAdd);

    const contacts = [
      {
        name: 'Priya Sharma',
        email: 'priya.sharma@example.com',
        phone: '9829012345',
        subject: 'Question about Blue Pottery vase sizing',
        message:
          'Hi, I am interested in the Handcrafted Blue Pottery Vase but want to confirm the exact dimensions before ordering. Could you also tell me if it ships safely without breakage? Thank you!',
        fields: { Address: 'C-14, Malviya Nagar, Jaipur, Rajasthan 302017' },
        status: 'Unread',
        source: 'https://jaipurio.in/contact',
        ip: '103.21.244.12',
        createdAt: daysAgo(1),
      },
      {
        name: 'Rahul Verma',
        email: 'rahul.verma@example.com',
        phone: '9414055678',
        subject: 'Bulk order for wedding favors',
        message:
          'We are planning a wedding in December and would like to order 150 Kulhad sets as return gifts for guests. Do you offer bulk pricing and can you deliver by mid-November?',
        fields: { Address: '22 Civil Lines, Jodhpur, Rajasthan', 'Alternate Phone': '9829099887' },
        status: 'Unread',
        source: 'https://jaipurio.in/contact',
        ip: '117.198.10.44',
        createdAt: daysAgo(2),
      },
      {
        name: 'Anjali Mehta',
        email: 'anjali.mehta@example.com',
        phone: '9876543210',
        subject: 'Delayed delivery — Order #10000398',
        message:
          "My order was supposed to arrive 5 days ago and I haven't received any tracking update since. Could someone please check the status and let me know?",
        fields: {},
        status: 'Read',
        replies: [
          {
            message:
              'Hi Anjali, we\'re so sorry for the delay. Your order has been dispatched via Shiprocket and is currently in Jaipur\'s regional hub — it should reach you within 2 business days. Tracking link: https://jaipurio.in/track/10000398. Thank you for your patience!',
            repliedByName: 'Admin Final',
            emailSent: false,
            createdAt: daysAgo(0.5),
          },
        ],
        source: 'https://jaipurio.in/contact',
        ip: '49.36.88.201',
        createdAt: daysAgo(4),
      },
      {
        name: 'Vikram Joshi',
        email: 'vikram.joshi@example.com',
        phone: '',
        subject: 'Partnership / vendor onboarding inquiry',
        message:
          'I run a small marble handicrafts workshop in Makrana and would like to know how I can become a vendor on Jaipurio. Please share the onboarding process and commission structure.',
        fields: { Address: 'Makrana, Nagaur District, Rajasthan' },
        status: 'Read',
        replies: [
          {
            message:
              'Hi Vikram, thanks for reaching out! You can register as a vendor at jaipurio.in/vendor/register — our team will review your application within 2-3 business days. Our standard commission starts at 15% for new vendors, reducing as your sales grow. Let us know if you have questions!',
            repliedByName: 'Admin Final',
            emailSent: false,
            createdAt: daysAgo(6),
          },
        ],
        source: 'https://jaipurio.in/contact',
        ip: '182.68.14.9',
        createdAt: daysAgo(7),
      },
      {
        name: 'Neha Kapoor',
        email: 'neha.kapoor@example.com',
        phone: '9911223344',
        subject: 'Product care instructions',
        message:
          'I just received my marble Tulsi pot and it looks beautiful! Just wanted to double check the best way to clean it without damaging the carvings.',
        fields: {},
        status: 'Unread',
        source: 'https://jaipurio.in/contact',
        ip: '223.190.77.3',
        createdAt: daysAgo(0.2),
      },
    ];

    await Contact.insertMany(contacts);

    console.log(`Seeded ${contacts.length} contacts and ${customFieldsToAdd.length} new custom field(s) (existing data untouched).`);
    process.exit();
  } catch (error) {
    console.error('Error seeding contacts:', error);
    process.exit(1);
  }
};

seedContacts();
