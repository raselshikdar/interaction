-- Test the corrected query without deleted_at filter
SELECT
  u.id, u.handle, u.display_name, u.bio, u.avatar, u.banner,
  u.website, u.created_at,
  COUNT(DISTINCT f1.follower_id) AS followers_count,
  COUNT(DISTINCT f2.following_id) AS following_count,
  COUNT(DISTINCT p.id) AS posts_count,
  false AS is_following
FROM users u
LEFT JOIN follows f1 ON f1.following_id = u.id
LEFT JOIN follows f2 ON f2.follower_id = u.id
LEFT JOIN posts p ON p.author_id = u.id
WHERE LOWER(u.handle) = LOWER('rasel')
GROUP BY u.id
LIMIT 1;
