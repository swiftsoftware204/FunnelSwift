#!/usr/bin/env node
// ============================================
// FunnelSwift - Create Super Admin
// ============================================

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const SUPER_ADMIN_EMAIL = 'swiftsoftware143@yahoo.com';
const SUPER_ADMIN_NAME = 'David Giraudy';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

async function createSuperAdmin() {
  console.log('🚀 Creating FunnelSwift Super Admin...\n');

  try {
    // Check if user exists
    const { data: existingUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      process.exit(1);
    }

    const existingUser = existingUsers?.users.find(u => u.email === SUPER_ADMIN_EMAIL);

    if (existingUser) {
      console.log('⚠️  User already exists:', SUPER_ADMIN_EMAIL);
      
      // Check if profile exists and is superadmin
      const { data: profile } = await supabaseAdmin
        .from('user_profiles')
        .select('is_superadmin')
        .eq('id', existingUser.id)
        .single();

      if (profile?.is_superadmin) {
        console.log('✅ User is already Super Admin!');
        return;
      }

      // Make superadmin
      const { error: updateError } = await supabaseAdmin
        .from('user_profiles')
        .upsert({
          id: existingUser.id,
          email: SUPER_ADMIN_EMAIL,
          display_name: SUPER_ADMIN_NAME,
          is_superadmin: true,
        });

      if (updateError) {
        console.error('❌ Error updating profile:', updateError.message);
        process.exit(1);
      }

      console.log('✅ Existing user promoted to Super Admin!');
      return;
    }

    // Create new user
    const password = generatePassword();
    
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: SUPER_ADMIN_EMAIL,
      password: password,
      email_confirm: true,
      user_metadata: { full_name: SUPER_ADMIN_NAME },
    });

    if (authError) {
      console.error('❌ Error creating user:', authError.message);
      process.exit(1);
    }

    console.log('✅ Auth user created');

    // Create superadmin profile
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .insert({
        id: authUser.user.id,
        email: SUPER_ADMIN_EMAIL,
        display_name: SUPER_ADMIN_NAME,
        is_superadmin: true,
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message);
      process.exit(1);
    }

    console.log('✅ Super Admin profile created\n');
    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 SUPER ADMIN CREATED!');
    console.log('═══════════════════════════════════════════════════');
    console.log('');
    console.log('📧 Email:', SUPER_ADMIN_EMAIL);
    console.log('🔑 Password:', password);
    console.log('');
    console.log('⚠️  Save this password and change it after first login!');
    console.log('═══════════════════════════════════════════════════');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createSuperAdmin();
