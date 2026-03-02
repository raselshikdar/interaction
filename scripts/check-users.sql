-- Check what users exist in the database
SELECT id, handle, email, display_name FROM users ORDER BY created_at DESC;

-- Count total users
SELECT COUNT(*) as total_users FROM users;

-- Check if any sessions exist
SELECT COUNT(*) as total_sessions FROM sessions WHERE expires > NOW();
