require('dotenv').config();
const connectDB = require('./config/db');
const Blog = require('./models/blogModel');

const blogs = [
  {
    title: 'The Art of Jaipur Terracotta: From Wheel to Home',
    category: 'Craft Heritage',
    excerpt: 'How Jaipur potters turn raw mitti into cooling matkas, chai kulhads, and festive diyas using age-old kiln traditions.',
    content: `Jaipur’s terracotta craft is rooted in the city’s historic pottery lanes. Artisans throw clay on manual wheels, dry pots under the Rajasthan sun, and fire them in wood kilns that give mitti its signature earthy aroma.\n\n**What Makes Jaipur Mitti Special**\n- Porous clay keeps water naturally cool\n- Hand-painted mandana motifs unique to Rajasthan\n- 100% natural — no chemical glaze on traditional pieces\n\nAt Jaipurio, every matka and kulhad is sourced from heritage workshops in Amer, Sanganer, and nearby pottery villages.`,
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786905/jaipurio/matka.webp',
    author: 'Jaipurio Team',
    status: 'Published',
    readTime: '5 min',
  },
  {
    title: 'Why Chai Tastes Better in a Kulhad',
    category: 'Kulhads',
    excerpt: 'The saunda pan of earthen kulhads is not nostalgia — it is chemistry meeting craft.',
    content: `Earthen kulhads release a subtle clay aroma when hot chai is poured. The porous walls absorb excess oils and keep the drink warm without plastic or metal aftertaste.\n\n**Buying Tips**\n- Choose kiln-fired kulhads over sun-dried only pieces\n- Season new kulhads with water before first use\n- Prefer packs of 4–6 for home and gatherings\n\nJaipurio kulhads are handcrafted for everyday chai and festive serving.`,
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786907/jaipurio/kulhad.webp',
    author: 'Jaipurio Team',
    status: 'Published',
    readTime: '4 min',
  },
  {
    title: 'Caring for Your Terracotta Planters',
    category: 'Planters',
    excerpt: 'Breathable mitti pots help roots thrive — here is how to season, water, and place them.',
    content: `Terracotta planters allow air and moisture exchange that plastic pots cannot. Before planting, soak the pot overnight so it does not steal water from young roots.\n\n**Care Guide**\n- Use a drainage hole and loose soil mix\n- Avoid harsh detergents when cleaning\n- Keep outdoor planters elevated during heavy monsoon\n\nExplore Jaipurio’s handmade planter sets for balconies and desks.`,
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786910/jaipurio/planter.webp',
    author: 'Meera Terracotta',
    status: 'Published',
    readTime: '4 min',
  },
  {
    title: 'Festive Diyas: Light Up Diwali the Handmade Way',
    category: 'Puja Essentials',
    excerpt: 'Hand-painted clay diyas bring warmth, ritual, and artisan livelihoods into your celebration.',
    content: `Clay diyas have lit Indian festivals for centuries. Painted diyas from Pushkar and Jaipur workshops add gold highlights and folk motifs that factory candles cannot match.\n\nSupport local artisans by choosing handmade diya sets this season — available in Jaipurio’s Puja Essentials collection.`,
    image: 'https://res.cloudinary.com/q3qtobyj/image/upload/f_webp,q_auto:good,c_limit,w_1600/v1788786912/jaipurio/diya.webp',
    author: 'Pushkar Clay Arts',
    status: 'Published',
    readTime: '3 min',
  },
];

const seedBlogs = async () => {
  try {
    await connectDB();
    await Blog.deleteMany({});
    await Blog.insertMany(blogs);
    console.log(`Jaipurio blogs seeded (${blogs.length})!`);
    process.exit(0);
  } catch (error) {
    console.error(`Error seeding blogs: ${error.message}`);
    process.exit(1);
  }
};

seedBlogs();
