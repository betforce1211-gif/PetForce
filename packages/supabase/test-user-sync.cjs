const { Client } = require('pg');

const DATABASE_URL = 'postgresql://postgres:U*&fdYZRW+3VQfH@db.pudipylsmvhccctzqezg.supabase.co:5432/postgres';

async function testUserSync() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🧪 Testing User Sync Trigger...\n');
    await client.connect();

    // Check current counts
    const beforeResult = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM auth.users) as auth_count,
        (SELECT COUNT(*) FROM public.users) as public_count;
    `);

    console.log('📊 Before Test:');
    console.log(`   Auth users: ${beforeResult.rows[0].auth_count}`);
    console.log(`   Public users: ${beforeResult.rows[0].public_count}\n`);

    // Create a test user in auth.users to trigger the sync
    const testEmail = `test-sync-${Date.now()}@petforce.test`;
    const testId = 'a7cfa7d5-b86d-480e-8aff-04b3a7decab0'.replace(/0$/, String(Date.now() % 10));

    console.log(`🧪 Creating test user: ${testEmail}`);
    console.log('   This should automatically create a public.users record...\n');

    // Insert test user into auth.users (this should trigger our function)
    await client.query(`
      INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        created_at,
        updated_at,
        aud,
        role
      ) VALUES (
        $1,
        '00000000-0000-0000-0000-000000000000',
        $2,
        '$2a$10$abcdefghijklmnopqrstuv',
        NOW(),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
      );
    `, [testId, testEmail]);

    console.log('✅ Test user created in auth.users');

    // Wait a moment for trigger to fire
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Check if user was synced to public.users
    const syncCheck = await client.query(`
      SELECT
        u.id,
        u.email,
        CASE WHEN pu.id IS NOT NULL THEN 'YES ✅' ELSE 'NO ❌' END as synced
      FROM auth.users u
      LEFT JOIN public.users pu ON u.id = pu.id
      WHERE u.email = $1;
    `, [testEmail]);

    console.log(`🔍 Sync Status: ${syncCheck.rows[0].synced}\n`);

    if (syncCheck.rows[0].synced === 'YES ✅') {
      console.log('✅ SUCCESS: Trigger is working correctly!');
      console.log('   New users will automatically sync to public.users\n');
    } else {
      console.log('❌ FAILURE: User was NOT synced!');
      console.log('   The trigger may not be working\n');
    }

    // Clean up test user
    console.log('🧹 Cleaning up test user...');
    await client.query('DELETE FROM auth.users WHERE email = $1', [testEmail]);
    await client.query('DELETE FROM public.users WHERE email = $1', [testEmail]);
    console.log('✅ Test user removed\n');

    // Final counts
    const afterResult = await client.query(`
      SELECT
        (SELECT COUNT(*) FROM auth.users) as auth_count,
        (SELECT COUNT(*) FROM public.users) as public_count;
    `);

    console.log('📊 After Test (should match Before Test):');
    console.log(`   Auth users: ${afterResult.rows[0].auth_count}`);
    console.log(`   Public users: ${afterResult.rows[0].public_count}\n`);

    console.log('✅ Test completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

testUserSync();
