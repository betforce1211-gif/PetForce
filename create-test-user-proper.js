#!/usr/bin/env node
/**
 * Create test user using Supabase Admin API (the proper way)
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SECRET_KEY in .env');
  process.exit(1);
}

// Create admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUser() {
  try {
    const email = 'test@petforce.local';
    const password = 'TestUser123!';

    console.log('👤 Creating test user via Supabase Admin API...\n');

    // First, try to delete existing user
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      console.log('🗑️  Deleting existing test user...');
      await supabase.auth.admin.deleteUser(existingUser.id);
    }

    // Create user with email_confirmed_at set (auto-confirmed)
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // This confirms the email immediately
      user_metadata: {
        created_by: 'test-script'
      }
    });

    if (error) {
      console.error('❌ Error creating user:', error.message);
      process.exit(1);
    }

    console.log('✅ Test user created!\n');
    console.log('📋 Login credentials:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log(`   User ID:  ${data.user.id}`);
    console.log(`   Email Confirmed: ${!!data.user.email_confirmed_at}`);
    console.log('\n🚀 You can now:');
    console.log('   1. Go to http://localhost:3001/auth');
    console.log('   2. Click "Sign In" tab');
    console.log('   3. Login with the credentials above');
    console.log('   4. Test the household feature!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createTestUser();
