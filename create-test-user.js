#!/usr/bin/env node
/**
 * Create a pre-verified test user
 */
require('dotenv').config();
const { Pool } = require('pg');
const crypto = require('crypto');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function createTestUser() {
  try {
    const email = 'test@petforce.local';
    const password = 'TestUser123!';

    console.log('👤 Creating pre-verified test user...\n');

    // Generate password hash (Supabase uses bcrypt)
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(password, 10);

    const userId = crypto.randomUUID();

    // First, try to delete any existing test user
    await pool.query(`DELETE FROM auth.users WHERE email = $1;`, [email]);

    // Insert into auth.users (the user will be pre-confirmed)
    await pool.query(`
      INSERT INTO auth.users (
        id,
        instance_id,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        aud,
        role,
        created_at,
        updated_at,
        confirmation_token,
        is_sso_user
      ) VALUES (
        $1,
        '00000000-0000-0000-0000-000000000000',
        $2,
        $3,
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        'authenticated',
        'authenticated',
        NOW(),
        NOW(),
        '',
        false
      );
    `, [userId, email, passwordHash]);

    console.log('✅ Test user created!\n');
    console.log('📋 Login credentials:');
    console.log(`   Email:    ${email}`);
    console.log(`   Password: ${password}`);
    console.log('\n🚀 You can now:');
    console.log('   1. Go to http://localhost:3001/auth');
    console.log('   2. Click "Sign In" tab');
    console.log('   3. Login with the credentials above');
    console.log('   4. Test the household feature!');
    console.log('\n⚠️  This user bypasses email verification');

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('bcrypt')) {
      console.error('\n💡 Install bcrypt: npm install bcrypt');
    }
    await pool.end();
    process.exit(1);
  }
}

createTestUser();
