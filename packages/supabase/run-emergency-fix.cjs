const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://postgres:U*&fdYZRW+3VQfH@db.pudipylsmvhccctzqezg.supabase.co:5432/postgres';

async function runFix() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to Supabase production database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    const sql = fs.readFileSync('/tmp/emergency_fix.sql', 'utf8');

    console.log('🔧 Running emergency fix...');
    console.log('  - Dropping old trigger...');
    console.log('  - Creating new trigger function...');
    console.log('  - Setting up trigger...');
    console.log('  - Granting permissions...');
    console.log('  - Backfilling existing users...\n');

    const result = await client.query(sql);

    console.log('✅ Fix applied successfully!\n');

    // Display verification results
    if (result.rows && result.rows.length > 0) {
      console.log('📊 VERIFICATION RESULTS:');
      console.log('========================');
      result.rows.forEach(row => {
        console.log(`  ${row.metric.padEnd(20)}: ${row.count}`);
      });
      console.log('========================\n');
    }

    // Run additional verification
    console.log('🔍 Running additional verification...');
    const verifyResult = await client.query(`
      SELECT
        u.email,
        u.id,
        u.created_at,
        CASE WHEN pu.id IS NOT NULL THEN 'Synced ✅' ELSE 'Missing ❌' END as status
      FROM auth.users u
      LEFT JOIN public.users pu ON u.id = pu.id
      ORDER BY u.created_at DESC
      LIMIT 10;
    `);

    console.log('\n👥 Recent Users Status:');
    console.log('========================');
    verifyResult.rows.forEach(row => {
      const date = new Date(row.created_at).toLocaleString();
      console.log(`  ${row.email.padEnd(30)} | ${row.status} | ${date}`);
    });
    console.log('========================\n');

    // Test the trigger by checking it exists
    const triggerCheck = await client.query(`
      SELECT tgname, tgenabled
      FROM pg_trigger
      WHERE tgname = 'on_auth_user_created';
    `);

    if (triggerCheck.rows.length > 0) {
      console.log('✅ Trigger "on_auth_user_created" is ACTIVE');
      console.log(`   Status: ${triggerCheck.rows[0].tgenabled === 'O' ? 'Enabled' : 'Disabled'}\n`);
    } else {
      console.log('⚠️  WARNING: Trigger not found!\n');
    }

    console.log('✅ All operations completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('  1. Refresh your Supabase dashboard');
    console.log('  2. Check public.users table - you should see dzederi4@gmail.com');
    console.log('  3. Try creating a new user - it should automatically appear in public.users');

  } catch (error) {
    console.error('❌ Error running fix:', error.message);
    if (error.code) console.error('Error code:', error.code);
    if (error.detail) console.error('Detail:', error.detail);
    console.error('\nStack:', error.stack);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

runFix();
