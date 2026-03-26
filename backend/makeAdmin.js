const mongoose = require('mongoose');

mongoose.connect('mongodb://127.0.0.1:27017/fashionhub').then(async () => {
  await mongoose.connection.collection('users').updateMany({}, { $set: { isAdmin: true } });
  console.log('✅ All users are now admins!');
  process.exit(0);
});
