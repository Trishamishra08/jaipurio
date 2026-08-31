require('dotenv').config();
const mongoose = require('mongoose');
const Blog = require('./models/blogModel');
const connectDB = require('./config/db');

const blogs = [
  {
    title: 'The Ancient Power of Ashwagandha: A Complete Guide',
    category: 'Ayurvedic Herbs',
    excerpt: 'Discover how this ancient adaptogen can transform your modern lifestyle with science-backed benefits for stress, energy, and vitality.',
    content: `Ashwagandha (Withania somnifera), known as the "King of Herbs" in Ayurveda, has been used for over 3,000 years to relieve stress, increase energy levels, and improve concentration.\n\nIn today's fast-paced world, adaptogenic herbs like Ashwagandha offer a natural way to combat the effects of chronic stress. Studies show it can reduce cortisol levels by up to 28%, significantly improving overall wellbeing.\n\nKey Benefits:\n- Reduces stress and anxiety naturally\n- Boosts testosterone and improves male fertility\n- Enhances brain function and memory\n- Increases strength and muscle mass\n- Supports thyroid function\n\nAt Sada Bharat, our Ashwagandha is sourced directly from organic farms in Rajasthan and processed using traditional methods to preserve its potency.`,
    image: 'https://images.unsplash.com/photo-1611072172378-e5b58a07f5f9?w=800&auto=format&fit=crop',
    author: 'Dr. Priya Sharma',
    status: 'Published',
    readTime: '6 min'
  },
  {
    title: 'Neem: Nature\'s Ultimate Antibiotic',
    category: 'Skin & Beauty',
    excerpt: 'From ancient texts to modern dermatology — why Neem continues to be the gold standard in natural skincare and immunity.',
    content: `Neem (Azadirachta indica) has been called the "Village Pharmacy" of India. With over 130 biologically active compounds, it is one of the most researched plants in Ayurvedic medicine.\n\nNeem's antibacterial, antifungal, and anti-inflammatory properties make it a powerhouse ingredient for:\n\n**Skin Health**\n- Treats acne by killing bacteria that cause breakouts\n- Reduces inflammation and redness\n- Evens out skin tone and reduces dark spots\n- Fights fungal infections naturally\n\n**Immunity Boost**\nNeem's rich polysaccharide content activates the immune system, helping the body fight viral and bacterial infections.\n\nOur Neem Tulsi Face Wash combines the best of both herbs for a complete skincare ritual rooted in Ayurvedic wisdom.`,
    image: 'https://images.unsplash.com/photo-1604328471151-b52226907017?w=800&auto=format&fit=crop',
    author: 'Sada Bharat Team',
    status: 'Published',
    readTime: '5 min'
  },
  {
    title: 'Bhringraj Oil: The Secret to Lustrous, Healthy Hair',
    category: 'Hair Care',
    excerpt: 'Ancient Ayurvedic wisdom meets modern hair science. How Bhringraj reverses hair loss and promotes thick, healthy growth.',
    content: `Bhringraj, often called the "King of Hair" in Ayurveda, is a remarkable herb that has been used for centuries to maintain and restore hair health.\n\nThe name Bhringraj comes from Sanskrit meaning "ruler of bees" — a testament to how prized this herb was in ancient times.\n\n**Why Bhringraj Works**\n\nBhringraj oil penetrates the scalp deeply, stimulating hair follicles and improving blood circulation. This results in:\n- Reduced hair fall within 2-3 weeks of regular use\n- Promotion of new hair growth from dormant follicles\n- Natural darkening of premature grey hair\n- Strengthening of hair shaft, reducing breakage\n- Dandruff control through its antifungal properties\n\n**How to Use**\nWarm the oil slightly and massage into the scalp in circular motions. Leave for at least 30 minutes before washing. For best results, use 2-3 times per week.`,
    image: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&auto=format&fit=crop',
    author: 'Anita Verma',
    status: 'Published',
    readTime: '4 min'
  },
  {
    title: 'Tulsi: The Holy Basil That Heals',
    category: 'Immunity',
    excerpt: 'Revered in Hindu culture and proven by modern science, Tulsi is the ultimate adaptogen for respiratory health and immune strength.',
    content: `Tulsi (Ocimum sanctum), the "Queen of Herbs," holds a sacred place in Ayurvedic medicine and Hindu tradition. Growing in over 700 million Indian homes, Tulsi is more than just a plant — it's a medicine cabinet.\n\n**Proven Health Benefits**\n\n1. **Respiratory Health**: Tulsi contains compounds like eugenol, camphene, and cineole that open airways and fight respiratory infections.\n\n2. **Stress Relief**: As an adaptogen, Tulsi normalizes cortisol levels and supports the adrenal glands.\n\n3. **Blood Sugar Regulation**: Studies show Tulsi can lower blood glucose levels, making it valuable for diabetic management.\n\n4. **Anti-Cancer Properties**: Phytochemicals in Tulsi have shown anti-carcinogenic properties in preliminary studies.\n\n**Daily Ritual**\nStart your morning with Tulsi Green Tea — 5-6 Tulsi leaves steeped in hot water with a dash of honey. This simple ritual can transform your immunity over time.`,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=800&auto=format&fit=crop',
    author: 'Dr. Rajesh Kumar',
    status: 'Published',
    readTime: '7 min'
  },
  {
    title: 'Aloe Vera: The Miracle Plant for Modern Life',
    category: 'Skin & Beauty',
    excerpt: 'From sunburn relief to digestive health, Aloe Vera is the most versatile plant in Ayurvedic and modern natural medicine.',
    content: `Aloe Vera has been used medicinally for thousands of years across cultures — from ancient Egypt to Ayurvedic India. Today, it's backed by hundreds of scientific studies.\n\n**What Makes Aloe So Powerful?**\n\nAloe Vera gel contains over 75 active compounds including vitamins (A, C, E, B12), enzymes, minerals, sugars, anthraquinones, saponins, fatty acids, amino acids, and salicylic acid.\n\n**Key Uses**\n\n**Skin Care**\n- Heals burns and sunburns 8-9 days faster than conventional treatment\n- Moisturizes without clogging pores (perfect for oily skin)\n- Reduces appearance of stretch marks\n- Soothes eczema and psoriasis\n\n**Digestive Health**\n- Reduces symptoms of IBS\n- Acts as a gentle laxative\n- Balances gut bacteria\n\n**Dental Health**\n- As effective as mouthwash in reducing plaque\n- Treats mouth ulcers\n\nOur Organic Aloe Vera Gel is cold-processed to preserve all active enzymes and applied directly for maximum potency.`,
    image: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&auto=format&fit=crop',
    author: 'Sada Bharat Team',
    status: 'Published',
    readTime: '5 min'
  },
  {
    title: 'The Doshas: Understanding Your Ayurvedic Body Type',
    category: 'Ayurveda Basics',
    excerpt: 'Vata, Pitta, or Kapha? Understanding your prakriti (body constitution) is the foundation of personalized Ayurvedic wellness.',
    content: `Ayurveda, the 5,000-year-old system of medicine from India, recognizes that each person is unique. This recognition is expressed through the concept of Doshas — the three biological energies that govern all physical and mental processes.\n\n**The Three Doshas**\n\n**Vata (Air + Space)**\nVata types are typically thin, light, enthusiastic, and energetic. When balanced, they are creative and vibrant. When imbalanced: anxiety, dry skin, constipation, irregular digestion.\n\nBalance Vata with: warm foods, regular routine, Ashwagandha, sesame oil massage.\n\n**Pitta (Fire + Water)**\nPitta types are typically medium build, sharp intellect, and strong digestion. When balanced: intelligent and decisive. When imbalanced: anger, inflammation, acidity, skin rashes.\n\nBalance Pitta with: cooling foods, coconut oil, Amla, avoiding excess spicy food.\n\n**Kapha (Earth + Water)**\nKapha types are typically strong, steady, and nurturing. When balanced: loyal and calm. When imbalanced: weight gain, congestion, lethargy, depression.\n\nBalance Kapha with: light foods, exercise, Trikatu, dry massage (Udvartana).\n\n**Finding Your Balance**\nAt Sada Bharat, our products are formulated with specific dosha types in mind. Consult our free Ayurvedic guide to discover your unique constitution.`,
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=800&auto=format&fit=crop',
    author: 'Dr. Priya Sharma',
    status: 'Published',
    readTime: '8 min'
  }
];

const seedBlogs = async () => {
  try {
    await connectDB();
    const existing = await Blog.countDocuments();
    if (existing > 0) {
      console.log(`✅ ${existing} blogs already exist. Skipping seed.`);
      process.exit(0);
    }
    await Blog.insertMany(blogs);
    console.log(`✅ Successfully seeded ${blogs.length} blog posts!`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedBlogs();
