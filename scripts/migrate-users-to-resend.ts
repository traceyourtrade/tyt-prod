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
  const errors: string[] = [];
  
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
      }
      
      await new Promise(resolve => setTimeout(resolve, 150));
      
    } catch (error: any) {
      failed++;
      const errorMsg = `${user.email}: ${error?.message || error}`;
      errors.push(errorMsg);
      console.error(`❌ Failed: ${errorMsg}`);
    }
  }
  
  console.log('\n--- Migration Summary ---');
  console.log(`Total users: ${users.length}`);
  console.log(`Successfully added: ${success}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
  
  if (errors.length > 0) {
    console.log('\n--- Errors ---');
    errors.forEach(e => console.log(e));
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

migrateUsersToResend().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
