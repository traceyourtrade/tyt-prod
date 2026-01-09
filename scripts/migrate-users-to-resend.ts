import { getUserModel } from '../src/models/main/user.model';
import { addContactToAudience } from '../src/lib/resend';

async function migrateUsersToResend() {
  console.log('Starting migration of existing users to Resend...\n');
  
  const User = await getUserModel();
  const users = await User.find({}, { email: 1, fullName: 1, firstName: 1, lastName: 1 }).lean();
  
  console.log(`Found ${users.length} users to migrate.\n`);
  
  let success = 0;
  let failed = 0;
  let skipped = 0;
  
  for (const user of users) {
    try {
      let firstName = user.firstName || '';
      let lastName = user.lastName || '';
      
      if (!firstName && user.fullName) {
        const nameParts = user.fullName.trim().split(' ');
        firstName = nameParts[0] || '';
        lastName = nameParts.slice(1).join(' ') || '';
      }
      
      const result = await addContactToAudience({
        email: user.email,
        firstName,
        lastName
      });
      
      if (result === null) {
        skipped++;
        console.log(`⏭️  Skipped: ${user.email} (RESEND_AUDIENCE_ID not configured)`);
        break;
      } else {
        success++;
        console.log(`✅ Added: ${user.email}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error: any) {
      if (error?.message?.includes('already exists')) {
        success++;
        console.log(`✅ Already exists: ${user.email}`);
      } else {
        failed++;
        console.error(`❌ Failed: ${user.email} - ${error?.message || error}`);
      }
    }
  }
  
  console.log('\n--- Migration Summary ---');
  console.log(`Total users: ${users.length}`);
  console.log(`Successfully added: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
  
  process.exit(0);
}

migrateUsersToResend().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
