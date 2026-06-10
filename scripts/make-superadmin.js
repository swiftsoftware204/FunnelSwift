// Script to make swiftsoftware143@yahoo.com a Super Admin
// Run this in Supabase SQL Editor

const makeSuperAdminSQL = `
-- Make swiftsoftware143@yahoo.com a Super Admin
UPDATE user_profiles
SET is_superadmin = true
WHERE email = 'swiftsoftware143@yahoo.com';

-- Verify
SELECT email, is_superadmin FROM user_profiles WHERE email = 'swiftsoftware143@yahoo.com';
`;

console.log('Run this SQL in Supabase SQL Editor:');
console.log(makeSuperAdminSQL);
