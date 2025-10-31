-- Check which users don't have names
SELECT id, email, name, created_at 
FROM users 
WHERE name IS NULL OR name = '' OR name = 'User';

-- Update users without proper names to use their email username
UPDATE users 
SET name = SPLIT_PART(email, '@', 1)
WHERE name IS NULL OR name = '' OR name = 'User';

-- Verify the changes
SELECT id, email, name, is_online
FROM users
ORDER BY created_at DESC;

