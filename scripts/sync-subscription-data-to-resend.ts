import { syncContactWithSubscription } from '../src/lib/resend';

async function connectDB() {
  const mongoose = await import('mongoose');
  const MONGO_URI = process.env.MONGODB_URI || process.env.MONGO_URI;
  
  if (!MONGO_URI) {
    throw new Error('MongoDB URI not found in environment');
  }
  
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB');
  return mongoose;
}

async function main() {
  console.log('Starting subscription data sync to Resend...\n');
  
  const mongoose = await connectDB();
  
  // Get user model
  const { getUserModel } = await import('../src/models/main/user.model');
  const User = await getUserModel();
  
  // Get all users
  const users = await User.find({}).lean();
  console.log(`Found ${users.length} users to sync.\n`);
  
  let success = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const user of users) {
    try {
      if (!user.email) {
        console.log(`Skipping user without email: ${user._id}`);
        skipped++;
        continue;
      }
      
      await syncContactWithSubscription({
        email: user.email,
        fullName: user.fullName,
        subscription: user.subscription,
        date: user.date
      });
      
      success++;
    } catch (error: any) {
      console.error(`Failed to sync ${user.email}:`, error.message);
      failed++;
    }
  }
  
  console.log('\n--- Sync Summary ---');
  console.log(`Total users: ${users.length}`);
  console.log(`Successfully synced: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
  
  await mongoose.disconnect();
  process.exit(0);
}

main().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});
