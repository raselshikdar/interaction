-- ============================================================
-- Interaction App - Seed Data
-- Passwords are all bcrypt hash of: password123
-- ============================================================

-- Users
-- bcrypt hash for 'password123' with 10 rounds
INSERT INTO users (id, email, handle, display_name, bio, website, password, verified, followers_count, following_count, posts_count)
VALUES
  ('user_rasel',   'rasel@bsky.app',    'rasel',   'Rasel Shikdar', 'Full-stack developer | Open source enthusiast | Building amazing things', 'https://rasel.dev', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true,  890, 456, 12),
  ('user_alice',   'alice@bsky.app',   'alice',   'Alice Johnson', 'Tech enthusiast | Open source advocate | Building the future of social media', 'https://alice.dev', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true,  1250, 340, 8),
  ('user_bob',     'bob@bsky.app',     'bob',     'Bob Smith',     'Designer & Developer. Creating beautiful things.', null,                   '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', false,  542, 210, 4),
  ('user_charlie', 'charlie@bsky.app', 'charlie', 'Charlie Davis', 'Music lover | Coffee addict | San Francisco', 'https://charliedavis.me',  '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true,  3200, 890, 5),
  ('user_diana',   'diana@bsky.app',   'diana',   'Diana Lee',     'Science communicator. Making complex topics simple.', null,               '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', false,  890, 156, 4),
  ('user_edward',  'edward@bsky.app',  'edward',  'Edward Kim',    'Photographer | Traveler | Storyteller', null,                             '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', true,  4500, 234, 4)
ON CONFLICT (email) DO NOTHING;

-- Posts
INSERT INTO posts (id, content, author_id, like_count, repost_count, reply_count)
VALUES
  ('post_rasel_1', 'Welcome to my Bluesky profile! Excited to be part of this amazing community. #Bluesky #OpenWeb', 'user_rasel', 120, 34, 18),
  ('post_rasel_2', 'Just shipped a new feature. Feels good to deploy clean code to production! #Devlife', 'user_rasel', 245, 67, 42),
  ('post_1',  'Just discovered Bluesky and I''m already loving the community here! The decentralized approach to social media is exactly what we need. #Bluesky #Decentralized',          'user_alice',    45, 12,  8),
  ('post_2',  'Working on a new design system for our product. It''s amazing how much consistency matters when building at scale. Anyone else deep in design tokens? #TechNews',           'user_bob',      23,  5,  3),
  ('post_3',  'Coffee and coding - the perfect morning combo. What''s your go-to productivity hack?',                                                                                       'user_charlie',  89, 21, 34),
  ('post_4',  'New research shows that taking short breaks every hour can boost productivity by up to 30%. Time to set those reminders! #Science #Productivity',                            'user_diana',   156, 45, 12),
  ('post_5',  'Just got back from an amazing trip to Japan! The cherry blossoms were absolutely breathtaking this time of year. Can''t wait to share the photos.',                          'user_edward',  342, 78, 56),
  ('post_6',  'The future of social media isn''t about who owns the platform - it''s about who controls your data. That''s why I''m here on Bluesky. #ATProtocol #OpenWeb',               'user_alice',    67, 34, 15),
  ('post_7',  'Hot take: Dark mode should be the default for all development tools. Who''s with me? #TechNews',                                                                             'user_bob',     234, 67, 89),
  ('post_8',  'Just released my new album on Bandcamp! 2 years in the making and I couldn''t be happier with how it turned out. Link in bio.',                                             'user_charlie', 567,123, 78),
  ('post_9',  'Interesting paper on quantum computing just dropped. The implications for cryptography are fascinating - we might need to rethink our entire approach to security. #TechNews','user_diana',    89, 23,  7),
  ('post_10', 'Golden hour in Santorini. Sometimes you just need to stop and appreciate the beauty around us. #Photography',                                                                'user_edward',  890,234, 45),
  ('post_11', 'The #OpenWeb movement is gaining momentum! More people are realizing the importance of decentralized platforms. #Bluesky is leading the charge!',                           'user_alice',    78, 45, 23),
  ('post_12', 'Just read an amazing article about #Decentralized systems. The future is bright for those who value privacy and data ownership!',                                            'user_bob',     156, 67, 34),
  ('post_13', '#SocialMedia is evolving. Are you ready for the next generation of platforms?',                                                                                              'user_charlie', 234, 89, 56),
  ('post_14', 'Building on the #OpenWeb means building for everyone. No gatekeepers, no algorithms deciding what you see. Just pure connection.',                                           'user_diana',   345,123, 67),
  ('post_15', 'The beauty of #Decentralized social networks is that your data belongs to YOU. Not to a corporation. This is the future. #Bluesky',                                         'user_edward',  567,234, 89)
ON CONFLICT DO NOTHING;

-- Follows
INSERT INTO follows (id, follower_id, following_id) VALUES
  ('fol_1',  'user_alice',   'user_bob'),
  ('fol_2',  'user_alice',   'user_charlie'),
  ('fol_3',  'user_alice',   'user_diana'),
  ('fol_4',  'user_bob',     'user_alice'),
  ('fol_5',  'user_bob',     'user_edward'),
  ('fol_6',  'user_charlie', 'user_alice'),
  ('fol_7',  'user_charlie', 'user_edward'),
  ('fol_8',  'user_diana',   'user_alice'),
  ('fol_9',  'user_diana',   'user_charlie'),
  ('fol_10', 'user_edward',  'user_alice')
ON CONFLICT (follower_id, following_id) DO NOTHING;

-- Feeds
INSERT INTO feeds (id, name, description, creator_id, pins_count) VALUES
  ('feed_1', 'Discover',      'Discover new content from across the network', 'user_alice',  12500),
  ('feed_2', 'What''s Hot',   'The most popular posts right now',             'user_alice',   8900),
  ('feed_3', 'Science & Tech','Latest in science and technology',             'user_diana',   3200),
  ('feed_4', 'Photography',   'Beautiful photos from around the world',       'user_edward',  4500)
ON CONFLICT DO NOTHING;

-- User settings (defaults)
INSERT INTO user_settings (id, user_id) VALUES
  ('settings_alice',   'user_alice'),
  ('settings_bob',     'user_bob'),
  ('settings_charlie', 'user_charlie'),
  ('settings_diana',   'user_diana'),
  ('settings_edward',  'user_edward')
ON CONFLICT (user_id) DO NOTHING;
