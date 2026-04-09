require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const products = [
  { name: 'Floral Sundress', price: 1299, category: 'Dresses', color: 'Blue', emoji: '👗', description: 'Light floral sundress perfect for summer', stock_quantity: 15 },
  { name: 'Silk Kurta Set', price: 2499, category: 'Ethnic', color: 'Ivory', emoji: '👘', description: 'Elegant silk kurta with matching pants', stock_quantity: 10 },
  { name: 'Boho Co-ord Set', price: 1899, category: 'Sets', color: 'Terracotta', emoji: '🩱', description: 'Trendy boho-style co-ord set', stock_quantity: 12 },
  { name: 'Linen Crop Top', price: 699, category: 'Tops', color: 'White', emoji: '👚', description: 'Breezy linen crop top for casual days', stock_quantity: 20 },
  { name: 'Embroidered Anarkali', price: 3499, category: 'Ethnic', color: 'Red', emoji: '🥻', description: 'Stunning embroidered anarkali suit', stock_quantity: 8 },
  { name: 'Wrap Midi Dress', price: 1599, category: 'Dresses', color: 'Green', emoji: '👗', description: 'Flattering wrap-style midi dress', stock_quantity: 14 },
  { name: 'Printed Palazzo Set', price: 1199, category: 'Sets', color: 'Multicolor', emoji: '🩲', description: 'Vibrant printed palazzo with top', stock_quantity: 18 },
  { name: 'Puff Sleeve Blouse', price: 849, category: 'Tops', color: 'Dusty Rose', emoji: '👕', description: 'Chic puff sleeve blouse for any occasion', stock_quantity: 22 },
  { name: 'Bandhani Lehenga', price: 4999, category: 'Ethnic', color: 'Yellow', emoji: '👗', description: 'Traditional bandhani lehenga choli', stock_quantity: 6 },
  { name: 'Asymmetric Hem Dress', price: 2199, category: 'Dresses', color: 'Black', emoji: '🖤', description: 'Modern asymmetric hem dress for evenings', stock_quantity: 11 },
];

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await Product.deleteMany({});
    console.log('🗑️ Cleared old products');

    const inserted = await Product.insertMany(products);
    console.log(`✅ Seeded ${inserted.length} products successfully!`);

    inserted.forEach(p => console.log(`  - ${p.emoji} ${p.name} (₹${p.price})`));
  } catch (err) {
    console.error('❌ Seed failed:', err);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected');
  }
}

seed();
