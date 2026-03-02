-- Add rasel user (authenticated user)
-- bcrypt hash for 'password123' with 10 rounds
INSERT INTO users (id, email, handle, display_name, bio, website, password, verified, followers_count, following_count, posts_count)
VALUES
  ('user_rasel', 'rasel@bsky.app', 'rasel', 'Rasel Shikdar', 'Full-stack developer | Open source enthusiast | Building amazing things', 'https://rasel.dev', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true, 890, 456, 12)
ON CONFLICT (email) DO NOTHING;

-- Add some posts for rasel
INSERT INTO posts (id, content, author_id, like_count, repost_count, reply_count)
VALUES
  ('post_rasel_1', 'Welcome to my Bluesky profile! Excited to be part of this amazing community. #Bluesky #OpenWeb', 'user_rasel', 120, 34, 18),
  ('post_rasel_2', 'Just shipped a new feature. Feels good to deploy clean code to production! #Devlife', 'user_rasel', 245, 67, 42),
  ('post_rasel_3', 'The future of social media is decentralized. That''s why I''m building on #ATProtocol', 'user_rasel', 156, 45, 23)
ON CONFLICT DO NOTHING;

-- Add some follows for rasel (following other users)
INSERT INTO follows (id, follower_id, following_id)
VALUES
  ('follow_rasel_alice', 'user_rasel', 'user_alice'),
  ('follow_rasel_charlie', 'user_rasel', 'user_charlie'),
  ('follow_rasel_diana', 'user_rasel', 'user_diana')
ON CONFLICT DO NOTHING;

-- Add some followers for rasel
INSERT INTO follows (id, follower_id, following_id)
VALUES
  ('follow_alice_rasel', 'user_alice', 'user_rasel'),
  ('follow_bob_rasel', 'user_bob', 'user_rasel'),
  ('follow_edward_rasel', 'user_edward', 'user_rasel')
ON CONFLICT DO NOTHING;
