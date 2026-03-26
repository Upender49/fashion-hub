require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { sendMail, orderConfirmationEmail, tryOnOrderEmail, passwordResetEmail, otpEmail } = require('./utils/mailer');

const Product = require('./models/Product');
const User = require('./models/User');
const CartItem = require('./models/CartItem');
const TryOn = require('./models/TryOn');
const Order = require('./models/Order');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_fashion_key_123';

// Serve uploaded images statically
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);
app.use('/uploads', express.static(uploadsDir));

// Multer config for product images
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } }); // 5MB max

app.use(cors());
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fashionhub';
const maskedURI = MONGO_URI.replace(/:([^:@]+)@/, ':****@');
console.log(`📡 Attempting to connect to: ${maskedURI}`);

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ Connected to MongoDB Database'))
  .catch(err => console.error('❌ Database connection error:', err));


// --- API ROUTES ---

// 2. CREATE THE GET PRODUCTS ROUTE
app.get('/api/products', async (req, res) => {
  try {
    // This asks MongoDB to find ALL products in the collection
    const products = await Product.find({}); 
    
    // Send them back to the frontend as JSON
    res.json(products); 
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ message: 'Server error while fetching products' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }

    // 3. Hash the password (scramble it securely)
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // 4. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    // 5. Save the new user to the database
    const newUser = new User({ name, email, password_hash, otp, otpExpiry, isVerified: false });
    await newUser.save();

    // 6. Send OTP Email (non-blocking)
    sendMail(newUser.email, '🔐 Your Fashion Hub Login Code', otpEmail(newUser.name, otp));

    // 7. Tell frontend that OTP is required
    res.status(201).json({
      message: 'Account created. OTP sent to your email.',
      requiresOtp: true,
      email: newUser.email
    });

  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// --- AUTH API: LOGIN ---
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 3. Compare the typed password with the hashed password in the DB
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid email or password' });
    }

    // 4. Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    user.otp = otp;
    user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await user.save();

    // 5. Send OTP Email (non-blocking)
    sendMail(user.email, '🔐 Your Fashion Hub Login Code', otpEmail(user.name, otp));

    // 6. Tell frontend that OTP is required
    res.json({
      message: 'OTP sent to your email.',
      requiresOtp: true,
      email: user.email
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// --- AUTH API: VERIFY OTP ---
app.post('/api/auth/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) return res.status(400).json({ message: 'Email and OTP are required' });

    const user = await User.findOne({ email, otp, otpExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Invalid or expired OTP code' });

    // Valid OTP - clear it and generate Token
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: '7d' });
    
    res.json({
      message: 'Verified successfully! 🎉',
      token,
      user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin }
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ message: 'Server error during verification' });
  }
});

// Basic test route
app.get('/', (req, res) => {
  res.send('Fashion Hub API is running! 👗');
});


// --- IMPORT THE CART MODEL (Put this near the top with your other imports) ---

// ==========================================
// SECURITY MIDDLEWARE (The Bouncer)
// ==========================================
// This checks if the frontend sent a valid JWT token before allowing access
const protect = (req, res, next) => {
  const authHeader = req.header('Authorization');
  if (!authHeader) return res.status(401).json({ message: 'No security token found' });

  try {
    // Extract the token (usually formatted as "Bearer <token>")
    const token = authHeader.split(' ')[1];
    // Verify it using our secret key
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach the user ID to the request so our routes know who is asking
    req.userId = decoded.userId; 
    next(); // Pass them through!
  } catch (error) {
    res.status(401).json({ message: 'Invalid token. Please log in again.' });
  }
};

// ==========================================
// CART API ROUTES
// ==========================================

// 1. GET CART: Fetch the logged-in user's cart
app.get('/api/cart', protect, async (req, res) => {
  try {
    // Find the cart items and populate the actual product details
    const cartItems = await CartItem.find({ user_id: req.userId }).populate('product_id');
    
    // Map it so it's easy for the frontend to read
    const formattedCart = cartItems.map(item => ({
      cartItemId: item._id, // The ID of the cart record
      id: item.product_id._id, // The ID of the actual product
      name: item.product_id.name,
      price: item.product_id.price,
      emoji: item.product_id.emoji,
      image_url: item.product_id.image_url,
      color: item.product_id.color,
      qty: item.quantity
    }));
    
    res.json(formattedCart);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching cart' });
  }
});

// 2. ADD TO CART: Add an item or increase its quantity
app.post('/api/cart/add', protect, async (req, res) => {
  try {
    const { productId } = req.body;

    // Verify stock availability first
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Check if the item is already in their cart
    let cartItem = await CartItem.findOne({ user_id: req.userId, product_id: productId });
    
    const currentQty = cartItem ? cartItem.quantity : 0;
    if (currentQty + 1 > product.stock_quantity) {
      return res.status(400).json({ message: `Only ${product.stock_quantity} left in stock!` });
    }

    if (cartItem) {
      cartItem.quantity += 1; // Increase qty if it exists
      await cartItem.save();
    } else {
      cartItem = new CartItem({ user_id: req.userId, product_id: productId, quantity: 1 }); // Create new
      await cartItem.save();
    }
    
    res.json({ message: 'Added to cart successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error adding to cart' });
  }
});

// 3. UPDATE QUANTITY
app.put('/api/cart/update/:cartItemId', protect, async (req, res) => {
  try {
    const { delta } = req.body; // delta will be +1 or -1
    const cartItem = await CartItem.findById(req.params.cartItemId).populate('product_id');
    
    if (!cartItem) return res.status(404).json({ message: 'Item not found' });
    
    const newQty = Math.max(1, cartItem.quantity + delta); // Prevent going below 1
    if (newQty > cartItem.product_id.stock_quantity) {
      return res.status(400).json({ message: `Only ${cartItem.product_id.stock_quantity} left in stock!` });
    }

    cartItem.quantity = newQty;
    await cartItem.save();
    res.json({ message: 'Quantity updated' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating quantity' });
  }
});

// 4. REMOVE FROM CART
app.delete('/api/cart/remove/:cartItemId', protect, async (req, res) => {
  try {
    await CartItem.findByIdAndDelete(req.params.cartItemId);
    res.json({ message: 'Item removed from cart' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing item' });
  }
});

// ==========================================
// TRY-ON API ROUTES
// ==========================================

// 1. GET: Fetch the logged-in user's try-on list
app.get('/api/tryon', protect, async (req, res) => {
  try {
    const tryonItems = await TryOn.find({ user_id: req.userId }).populate('product_id');
    const formatted = tryonItems.map(item => ({
      _id: item._id,
      tryonId: item._id.toString(),
      id: item.product_id._id,
      name: item.product_id.name,
      price: item.product_id.price,
      emoji: item.product_id.emoji,
      image_url: item.product_id.image_url,
      color: item.product_id.color,
      category: item.product_id.category,
      status: item.status,
      measurements: item.measurements,
      address: item.delivery_address,
      phone: item.phone,
      feedback: item.feedback,
      orderedAt: item.updatedAt,
      estimatedDelivery: item.estimated_delivery
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching try-on list' });
  }
});

// 2. ADD: Add a product to the try-on list
app.post('/api/tryon/add', protect, async (req, res) => {
  try {
    const { productId } = req.body;
    const existing = await TryOn.findOne({ user_id: req.userId, product_id: productId, status: { $ne: 'delivered' } });
    if (existing) return res.status(400).json({ message: 'Already in your try-on list' });
    const item = new TryOn({ user_id: req.userId, product_id: productId });
    await item.save();
    res.status(201).json({ message: 'Added to try-on list', tryonId: item._id });
  } catch (error) {
    res.status(500).json({ message: 'Error adding to try-on list' });
  }
});

// 3. PLACE ORDER: Submit measurements and place the try-on order
app.put('/api/tryon/order/:tryonId', protect, async (req, res) => {
  try {
    const { chest, waist, hip, color, address, phone } = req.body;
    if (!chest || !waist || !address || !phone) {
      return res.status(400).json({ message: 'Please fill in all required fields' });
    }
    const est = new Date(Date.now() + (1 + Math.random() * 3) * 60 * 60 * 1000);
    const item = await TryOn.findByIdAndUpdate(
      req.params.tryonId,
      { status: 'ordered', measurements: { chest, waist, hip, preferred_color: color }, delivery_address: address, phone, estimated_delivery: est },
      { new: true }
    ).populate('product_id');
    if (!item) return res.status(404).json({ message: 'Try-on item not found' });

    res.json({ message: 'Order placed successfully', estimatedDelivery: est });

    // Send email notification (non-blocking)
    try {
      const user = await User.findById(req.userId);
      if (user) {
        const estStr = est.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
        sendMail(
          user.email,
          '👗 Your Sample Try-On is On the Way! – Fashion Hub',
          tryOnOrderEmail(user.name, item.product_id?.name || 'your item', estStr)
        );
      }
    } catch (emailErr) { console.error('Try-on email error:', emailErr.message); }

  } catch (error) {
    res.status(500).json({ message: 'Error placing order' });
  }
});

// 4. FEEDBACK: Submit feedback after delivery
app.put('/api/tryon/feedback/:tryonId', protect, async (req, res) => {
  try {
    const { feedback } = req.body;
    const item = await TryOn.findByIdAndUpdate(req.params.tryonId, { feedback, status: 'delivered' }, { new: true });
    if (!item) return res.status(404).json({ message: 'Try-on item not found' });
    res.json({ message: 'Feedback submitted' });
  } catch (error) {
    res.status(500).json({ message: 'Error submitting feedback' });
  }
});

// 5. REMOVE: Delete a try-on item
app.delete('/api/tryon/remove/:tryonId', protect, async (req, res) => {
  try {
    await TryOn.findByIdAndDelete(req.params.tryonId);
    res.json({ message: 'Removed from try-on list' });
  } catch (error) {
    res.status(500).json({ message: 'Error removing item' });
  }
});

// ==========================================
// ORDER / CHECKOUT API ROUTES
// ==========================================

// CHECKOUT: Create an order from the user's cart
app.post('/api/orders/checkout', protect, async (req, res) => {
  try {
    const { shippingAddress } = req.body;
    if (!shippingAddress) return res.status(400).json({ message: 'Shipping address is required' });

    const cartItems = await CartItem.find({ user_id: req.userId }).populate('product_id');
    if (cartItems.length === 0) return res.status(400).json({ message: 'Your cart is empty' });

    // Pre-flight stock validation
    for (const ci of cartItems) {
      if (ci.quantity > ci.product_id.stock_quantity) {
        return res.status(400).json({ message: `Sorry, we only have ${ci.product_id.stock_quantity} of ${ci.product_id.name} left.` });
      }
    }

    const items = cartItems.map(ci => ({
      product_id: ci.product_id._id,
      quantity: ci.quantity,
      price_at_purchase: ci.product_id.price,
      name: ci.product_id.name
    }));
    const total = items.reduce((sum, i) => sum + i.price_at_purchase * i.quantity, 0);
    const shipping = total > 2000 ? 0 : 99;

    const order = new Order({
      user_id: req.userId,
      items,
      total_amount: total + shipping,
      shipping_address: shippingAddress
    });
    await order.save();
    
    // Deduct stock physically and clear cart
    for (const ci of cartItems) {
      await Product.findByIdAndUpdate(ci.product_id._id, { $inc: { stock_quantity: -ci.quantity } });
    }
    await CartItem.deleteMany({ user_id: req.userId });

    res.status(201).json({ message: 'Order placed successfully! 🎉', orderId: order._id });

    // Send confirmation email (non-blocking)
    try {
      const user = await User.findById(req.userId);
      if (user) {
        sendMail(
          user.email,
          '🎉 Order Confirmed! – Fashion Hub',
          orderConfirmationEmail(user.name, order._id, items, total + shipping, shippingAddress)
        );
      }
    } catch (emailErr) { console.error('Order email error:', emailErr.message); }

  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ message: 'Error placing order' });
  }
});
// ==========================================
// PASSWORD RESET
// ==========================================

// FORGOT PASSWORD: Generate reset token + send email
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Always respond success to not leak which emails exist
    if (!user) return res.json({ message: 'If that email exists, a reset link has been sent.' });

    const token = uuidv4();
    const expiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    user.resetToken = token;
    user.resetTokenExpiry = expiry;
    await user.save();

    const resetLink = `${process.env.FRONTEND_URL || 'http://127.0.0.1:5500'}/frontend/index.html#reset-password?token=${token}`;
    sendMail(email, '🔐 Reset Your Fashion Hub Password', passwordResetEmail(user.name, resetLink));

    res.json({ message: 'If that email exists, a reset link has been sent.' });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// RESET PASSWORD: Validate token and save new password
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ message: 'Token and password are required' });
    if (password.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });

    const user = await User.findOne({ resetToken: token, resetTokenExpiry: { $gt: new Date() } });
    if (!user) return res.status(400).json({ message: 'Reset link is invalid or has expired' });

    const salt = await bcrypt.genSalt(10);
    user.password_hash = await bcrypt.hash(password, salt);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: 'Password reset successfully! You can now log in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ==========================================
// ADMIN MIDDLEWARE
// ==========================================
const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) return res.status(403).json({ message: 'Admin access required' });
    next();
  } catch { res.status(500).json({ message: 'Server error' }); }
};

// ==========================================
// ADMIN ROUTES
// ==========================================

// STATS
app.get('/api/admin/stats', protect, adminOnly, async (req, res) => {
  try {
    const [totalOrders, totalUsers, totalProducts, activeTryons, revenueData] = await Promise.all([
      Order.countDocuments(),
      User.countDocuments(),
      Product.countDocuments(),
      TryOn.countDocuments({ status: { $in: ['pending', 'ordered'] } }),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$total_amount' } } }])
    ]);
    res.json({
      totalOrders, totalUsers, totalProducts, activeTryons,
      totalRevenue: revenueData[0]?.total || 0
    });
  } catch (error) { res.status(500).json({ message: 'Error fetching stats' }); }
});

// ALL ORDERS (admin view)
app.get('/api/admin/orders', protect, adminOnly, async (req, res) => {
  try {
    const orders = await Order.find({}).populate('user_id', 'name email').sort({ createdAt: -1 });
    res.json(orders);
  } catch { res.status(500).json({ message: 'Error fetching orders' }); }
});

// UPDATE ORDER STATUS
app.put('/api/admin/orders/:id', protect, adminOnly, async (req, res) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json({ message: 'Order status updated', order });
  } catch { res.status(500).json({ message: 'Error updating order' }); }
});

// ALL TRY-ONS (admin view)
app.get('/api/admin/tryon', protect, adminOnly, async (req, res) => {
  try {
    const items = await TryOn.find({}).populate('user_id', 'name email').populate('product_id', 'name').sort({ createdAt: -1 });
    res.json(items);
  } catch { res.status(500).json({ message: 'Error fetching try-ons' }); }
});

// ==========================================
// PRODUCT CRUD (Admin)
// ==========================================

// ADD PRODUCT (with optional image upload)
app.post('/api/products', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const { name, price, category, color, description, emoji, stock_quantity } = req.body;
    if (!name || !price || !category || !color) return res.status(400).json({ message: 'Name, price, category and color are required' });
    const image_url = req.file ? `/uploads/${req.file.filename}` : null;
    const product = new Product({ name, price: Number(price), category, color, description, emoji, image_url, stock_quantity: Number(stock_quantity) || 10 });
    await product.save();
    res.status(201).json({ message: 'Product added', product });
  } catch (error) { res.status(500).json({ message: 'Error adding product' }); }
});

// EDIT PRODUCT
app.put('/api/products/:id', protect, adminOnly, upload.single('image'), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (req.file) updates.image_url = `/uploads/${req.file.filename}`;
    if (updates.price) updates.price = Number(updates.price);
    if (updates.stock_quantity) updates.stock_quantity = Number(updates.stock_quantity);
    const product = await Product.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product updated', product });
  } catch { res.status(500).json({ message: 'Error updating product' }); }
});

// DELETE PRODUCT
app.delete('/api/products/:id', protect, adminOnly, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    // Delete the image file if it exists
    if (product.image_url) {
      const imgPath = path.join(__dirname, product.image_url);
      if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath);
    }
    res.json({ message: 'Product deleted' });
  } catch { res.status(500).json({ message: 'Error deleting product' }); }
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});