import { connectMainDB } from '../lib/db/connect';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env vars
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyConnection() {
    console.log('🚀 Starting connection verification test...');

    try {
        // Simulate 3 parallel connection attempts
        console.log('📡 Dispatching 3 parallel connection requests...');
        const startTime = Date.now();

        const connections = await Promise.all([
            connectMainDB(),
            connectMainDB(),
            connectMainDB()
        ]);

        const endTime = Date.now();
        console.log(`⏱️ All connections resolved in ${endTime - startTime}ms`);

        // Verify all are the same connection object
        const allSame = connections.every(conn => conn === connections[0]);
        console.log(`🔍 All connection instances are identical: ${allSame ? '✅ YES' : '❌ NO'}`);

        // Check ready state
        const readyState = connections[0].readyState;
        console.log(`📊 Connection readyState: ${readyState} (1 = connected)`);

        if (allSame && readyState === 1) {
            console.log('✅ VERIFICATION SUCCESSFUL: Connection pooling and caching working as expected.');
        } else {
            console.log('❌ VERIFICATION FAILED: Connections are not being cached correctly.');
            process.exit(1);
        }

        // Close connection
        await connections[0].close();
        console.log('🔌 Connection closed.');
        process.exit(0);

    } catch (error) {
        console.error('❌ Verification failed with error:', error);
        process.exit(1);
    }
}

verifyConnection();
