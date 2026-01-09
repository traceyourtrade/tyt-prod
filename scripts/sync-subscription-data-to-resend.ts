import { syncContactWithSubscription } from '../src/lib/resend';

async function connectDB() {
  const mongoose = await import('mongoose');
  const MONGO_URI = process.env.DATABASE || process.env.MONGODB_URI;
  
  if (!MONGO_URI) {
    throw new Error('DATABASE environment variable not found');
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
  
  const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
  
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
      
      // Rate limit: 2 requests per second max, so wait 600ms between requests
      await delay(600);
    } catch (error: any) {
      console.error(`Failed to sync ${user.email}:`, error.message);
      failed++;
      // Still wait on error to avoid hammering the API
      await delay(600);
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
