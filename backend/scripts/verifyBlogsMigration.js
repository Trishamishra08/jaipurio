const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const connectDB = require('../config/db');
const Blog = require('../models/blogModel');
const BlogCategory = require('../models/blogCategoryModel');
const Category = require('../models/categoryModel');

async function auditBlogMigration() {
  await connectDB();

  const totalBlogs = await Blog.countDocuments();
  const publishedBlogs = await Blog.countDocuments({ status: 'Published' });
  const featuredBlogs = await Blog.countDocuments({ isFeatured: true });
  const totalBlogCats = await BlogCategory.countDocuments();
  const totalProductCats = await Category.countDocuments();

  const blogCatList = await BlogCategory.find().select('name slug description isFeatured isDefault').lean();
  const prodCatList = await Category.find().select('title slug').lean();

  const samples = await Blog.find()
    .limit(3)
    .select('name slug legacyId category categories author status readTime image createdAt')
    .lean();

  console.log('====================================================');
  console.log(' BLOG MIGRATION VERIFICATION AUDIT');
  console.log('====================================================');
  console.log(`Total Blogs in MongoDB       : ${totalBlogs}`);
  console.log(`Published Blogs              : ${publishedBlogs}`);
  console.log(`Featured Blogs               : ${featuredBlogs}`);
  console.log(`Blog Categories (BlogCategory): ${totalBlogCats}`);
  console.log(`Product Categories (Category) : ${totalProductCats}`);

  console.log('\n--- Blog Categories (BlogCategory Model) ---');
  blogCatList.forEach(c => console.log(`  • [${c.slug}] ${c.name}`));

  console.log('\n--- Product Categories (Category Model) ---');
  prodCatList.forEach(c => console.log(`  • [${c.slug}] ${c.title}`));

  console.log('\n--- Sample Migrated Blog Records ---');
  samples.forEach((s, idx) => {
    console.log(`\n[#${idx + 1}] (Legacy ID: ${s.legacyId}) ${s.name}`);
    console.log(`  Slug        : ${s.slug}`);
    console.log(`  Primary Cat : ${s.category}`);
    console.log(`  Categories  : [${(s.categories || []).join(', ')}]`);
    console.log(`  Read Time   : ${s.readTime} | Status: ${s.status} | Author: ${s.author}`);
    console.log(`  Cover Image : ${s.image}`);
    console.log(`  Created Date: ${s.createdAt}`);
  });

  await mongoose.disconnect();
}

auditBlogMigration().catch(err => {
  console.error(err);
  process.exit(1);
});
