-- ============================================================
-- Interaction App - Full Database Schema
-- Neon PostgreSQL
-- ============================================================

-- Enable UUID extension (cuid-style IDs generated app-side, but
-- gen_random_uuid() available as fallback)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id               TEXT        PRIMARY KEY,
  email            TEXT        NOT NULL UNIQUE,
  handle           TEXT        NOT NULL UNIQUE,
  display_name     TEXT,
  avatar           TEXT,
  banner           TEXT,
  bio              TEXT,
  website          TEXT,
  password         TEXT        NOT NULL,
  verified         BOOLEAN     NOT NULL DEFAULT FALSE,
  followers_count  INTEGER     NOT NULL DEFAULT 0,
  following_count  INTEGER     NOT NULL DEFAULT 0,
  posts_count      INTEGER     NOT NULL DEFAULT 0,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email  ON users (email);
CREATE INDEX IF NOT EXISTS idx_users_handle ON users (handle);

-- ============================================================
-- USER SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_settings (
  id                      TEXT        PRIMARY KEY,
  user_id                 TEXT        NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Privacy
  is_private              BOOLEAN     NOT NULL DEFAULT FALSE,
  show_followers          BOOLEAN     NOT NULL DEFAULT TRUE,
  show_following          BOOLEAN     NOT NULL DEFAULT TRUE,
  allow_tagging           BOOLEAN     NOT NULL DEFAULT TRUE,
  allow_mentions          BOOLEAN     NOT NULL DEFAULT TRUE,
  show_online_status      BOOLEAN     NOT NULL DEFAULT TRUE,

  -- Security
  two_factor_enabled      BOOLEAN     NOT NULL DEFAULT FALSE,
  login_alerts            BOOLEAN     NOT NULL DEFAULT TRUE,

  -- Notifications
  push_notifications      BOOLEAN     NOT NULL DEFAULT TRUE,
  email_notifications     BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_follows          BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_likes            BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_reposts          BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_replies          BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_mentions         BOOLEAN     NOT NULL DEFAULT TRUE,
  notify_quotes           BOOLEAN     NOT NULL DEFAULT TRUE,

  -- Content
  autoplay_videos         BOOLEAN     NOT NULL DEFAULT TRUE,
  show_sensitive_content  BOOLEAN     NOT NULL DEFAULT FALSE,
  media_quality           TEXT        NOT NULL DEFAULT 'auto',
  reduce_motion           BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Appearance
  theme                   TEXT        NOT NULL DEFAULT 'system',
  font_size               TEXT        NOT NULL DEFAULT 'medium',
  compact_mode            BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Accessibility
  screen_reader           BOOLEAN     NOT NULL DEFAULT FALSE,
  high_contrast           BOOLEAN     NOT NULL DEFAULT FALSE,
  reduce_animations       BOOLEAN     NOT NULL DEFAULT FALSE,

  -- Language
  language                TEXT        NOT NULL DEFAULT 'en',

  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS sessions (
  id            TEXT        PRIMARY KEY,
  session_token TEXT        NOT NULL UNIQUE,
  user_id       TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires       TIMESTAMPTZ NOT NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_token   ON sessions (session_token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires);

-- ============================================================
-- VERIFICATION TOKENS
-- ============================================================
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier  TEXT        NOT NULL,
  token       TEXT        NOT NULL UNIQUE,
  expires     TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (identifier, token)
);

-- ============================================================
-- POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS posts (
  id             TEXT        PRIMARY KEY,
  content        TEXT        NOT NULL DEFAULT '',
  images         TEXT,        -- JSON array of image URLs
  video          TEXT,
  link           TEXT,
  link_card      TEXT,        -- JSON object for link preview
  author_id      TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id      TEXT        REFERENCES posts(id) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED,
  quote_post_id  TEXT        REFERENCES posts(id) ON DELETE NO ACTION DEFERRABLE INITIALLY DEFERRED,
  reply_count    INTEGER     NOT NULL DEFAULT 0,
  repost_count   INTEGER     NOT NULL DEFAULT 0,
  like_count     INTEGER     NOT NULL DEFAULT 0,
  bookmark_count INTEGER     NOT NULL DEFAULT 0,
  is_pinned      BOOLEAN     NOT NULL DEFAULT FALSE,
  is_reply       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_author_id     ON posts (author_id);
CREATE INDEX IF NOT EXISTS idx_posts_parent_id     ON posts (parent_id);
CREATE INDEX IF NOT EXISTS idx_posts_quote_post_id ON posts (quote_post_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at    ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_like_count    ON posts (like_count DESC);
CREATE INDEX IF NOT EXISTS idx_posts_content_fts   ON posts USING gin(to_tsvector('english', content));

-- ============================================================
-- COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS comments (
  id         TEXT        PRIMARY KEY,
  content    TEXT        NOT NULL,
  post_id    TEXT        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id  TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id   ON comments (post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments (author_id);

-- ============================================================
-- LIKES
-- ============================================================
CREATE TABLE IF NOT EXISTS likes (
  id         TEXT        PRIMARY KEY,
  post_id    TEXT        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes (post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes (user_id);

-- ============================================================
-- REPOSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS reposts (
  id         TEXT        PRIMARY KEY,
  post_id    TEXT        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    TEXT,        -- For quote reposts
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_reposts_post_id ON reposts (post_id);
CREATE INDEX IF NOT EXISTS idx_reposts_user_id ON reposts (user_id);

-- ============================================================
-- BOOKMARKS
-- ============================================================
CREATE TABLE IF NOT EXISTS bookmarks (
  id         TEXT        PRIMARY KEY,
  post_id    TEXT        NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_bookmarks_post_id ON bookmarks (post_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks (user_id);

-- ============================================================
-- FOLLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS follows (
  id           TEXT        PRIMARY KEY,
  follower_id  TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (follower_id, following_id)
);

CREATE INDEX IF NOT EXISTS idx_follows_follower_id  ON follows (follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following_id ON follows (following_id);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id         TEXT        PRIMARY KEY,
  type       TEXT        NOT NULL, -- follow, like, repost, reply, mention, quote
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  actor_id   TEXT,
  post_id    TEXT,
  read       BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read       ON notifications (user_id, read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications (created_at DESC);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE IF NOT EXISTS messages (
  id          TEXT        PRIMARY KEY,
  content     TEXT        NOT NULL,
  sender_id   TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  receiver_id TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  read        BOOLEAN     NOT NULL DEFAULT FALSE,
  read_at     TIMESTAMPTZ,
  image_url   TEXT,
  image_alt   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender_id   ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages (receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_unread      ON messages (receiver_id, read);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages (sender_id, receiver_id);

-- ============================================================
-- FEEDS
-- ============================================================
CREATE TABLE IF NOT EXISTS feeds (
  id          TEXT        PRIMARY KEY,
  name        TEXT        NOT NULL,
  description TEXT,
  avatar      TEXT,
  creator_id  TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  is_public   BOOLEAN     NOT NULL DEFAULT TRUE,
  pins_count  INTEGER     NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feeds_creator_id ON feeds (creator_id);

-- ============================================================
-- LISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS lists (
  id            TEXT        PRIMARY KEY,
  name          TEXT        NOT NULL,
  description   TEXT,
  avatar        TEXT,
  creator_id    TEXT        NOT NULL,
  is_public     BOOLEAN     NOT NULL DEFAULT TRUE,
  members_count INTEGER     NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lists_creator_id ON lists (creator_id);

-- ============================================================
-- LIST MEMBERS
-- ============================================================
CREATE TABLE IF NOT EXISTS list_members (
  id         TEXT        PRIMARY KEY,
  list_id    TEXT        NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (list_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_list_members_list_id ON list_members (list_id);
CREATE INDEX IF NOT EXISTS idx_list_members_user_id ON list_members (user_id);

-- ============================================================
-- USER INTERESTS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_interests (
  id         TEXT        PRIMARY KEY,
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  interest   TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, interest)
);

CREATE INDEX IF NOT EXISTS idx_user_interests_user_id ON user_interests (user_id);

-- ============================================================
-- MUTES
-- ============================================================
CREATE TABLE IF NOT EXISTS mutes (
  id         TEXT        PRIMARY KEY,
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  muted_id   TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, muted_id)
);

CREATE INDEX IF NOT EXISTS idx_mutes_user_id ON mutes (user_id);

-- ============================================================
-- BLOCKS
-- ============================================================
CREATE TABLE IF NOT EXISTS blocks (
  id          TEXT        PRIMARY KEY,
  user_id     TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  blocked_id  TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, blocked_id)
);

CREATE INDEX IF NOT EXISTS idx_blocks_user_id ON blocks (user_id);

-- ============================================================
-- MUTED WORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS muted_words (
  id         TEXT        PRIMARY KEY,
  user_id    TEXT        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  word       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, word)
);

CREATE INDEX IF NOT EXISTS idx_muted_words_user_id ON muted_words (user_id);

-- ============================================================
-- updated_at TRIGGER FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users', 'user_settings', 'posts', 'comments', 'feeds', 'lists'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I;
       CREATE TRIGGER trg_%s_updated_at
         BEFORE UPDATE ON %I
         FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
      t, t, t, t
    );
  END LOOP;
END;
$$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE users               ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings       ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions            ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts               ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments            ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE reposts             ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks           ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows             ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages            ENABLE ROW LEVEL SECURITY;
ALTER TABLE feeds               ENABLE ROW LEVEL SECURITY;
ALTER TABLE lists               ENABLE ROW LEVEL SECURITY;
ALTER TABLE list_members        ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE mutes               ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocks              ENABLE ROW LEVEL SECURITY;
ALTER TABLE muted_words         ENABLE ROW LEVEL SECURITY;

-- -------------------------------------------------------
-- The app uses a server-side token-based auth pattern
-- (not Supabase Auth). All DB access goes through the
-- Next.js API routes running as a privileged server role.
-- We create a dedicated app role and grant it full access,
-- while keeping RLS policies that would apply to any
-- direct/anon client connections locked down.
-- -------------------------------------------------------

-- Create app role if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'app_server') THEN
    CREATE ROLE app_server;
  END IF;
END;
$$;

GRANT USAGE ON SCHEMA public TO app_server;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO app_server;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO app_server;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO app_server;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO app_server;

-- -------------------------------------------------------
-- USERS policies
-- -------------------------------------------------------
DROP POLICY IF EXISTS users_select_public  ON users;
DROP POLICY IF EXISTS users_insert_signup  ON users;
DROP POLICY IF EXISTS users_update_own     ON users;
DROP POLICY IF EXISTS users_delete_own     ON users;
DROP POLICY IF EXISTS users_server_all     ON users;

-- Server role bypasses RLS entirely
CREATE POLICY users_server_all ON users
  AS PERMISSIVE FOR ALL
  TO app_server
  USING (true) WITH CHECK (true);

-- Anyone can read public user profiles
CREATE POLICY users_select_public ON users
  AS PERMISSIVE FOR SELECT
  TO PUBLIC
  USING (true);

-- -------------------------------------------------------
-- USER SETTINGS policies
-- -------------------------------------------------------
DROP POLICY IF EXISTS user_settings_server_all ON user_settings;
DROP POLICY IF EXISTS user_settings_select_own ON user_settings;

CREATE POLICY user_settings_server_all ON user_settings
  AS PERMISSIVE FOR ALL TO app_server
  USING (true) WITH CHECK (true);

-- -------------------------------------------------------
-- SESSIONS policies
-- -------------------------------------------------------
DROP POLICY IF EXISTS sessions_server_all ON sessions;

CREATE POLICY sessions_server_all ON sessions
  AS PERMISSIVE FOR ALL TO app_server
  USING (true) WITH CHECK (true);

-- -------------------------------------------------------
-- VERIFICATION TOKENS policies
-- -------------------------------------------------------
DROP POLICY IF EXISTS verification_tokens_server_all ON verification_tokens;

CREATE POLICY verification_tokens_server_all ON verification_tokens
  AS PERMISSIVE FOR ALL TO app_server
  USING (true) WITH CHECK (true);

-- -------------------------------------------------------
-- POSTS policies
-- -------------------------------------------------------
DROP POLICY IF EXISTS posts_server_all    ON posts;
DROP POLICY IF EXISTS posts_select_public ON posts;

CREATE POLICY posts_server_all ON posts
  AS PERMISSIVE FOR ALL TO app_server
  USING (true) WITH CHECK (true);

CREATE POLICY posts_select_public ON posts
  AS PERMISSIVE FOR SELECT TO PUBLIC
  USING (true);

-- -------------------------------------------------------
-- COMMENTS policies
-- -------------------------------------------------------
DROP POLICY IF EXISTS comments_server_all    ON comments;
DROP POLICY IF EXISTS comments_select_public ON comments;

CREATE POLICY comments_server_all ON comments
  AS PERMISSIVE FOR ALL TO app_server
  USING (true) WITH CHECK (true);

CREATE POLICY comments_select_public ON comments
  AS PERMISSIVE FOR SELECT TO PUBLIC
  USING (true);

-- -------------------------------------------------------
-- LIKES policies
-- -------------------------------------------------------
DROP POLICY IF EXISTS likes_server_all    ON likes;
DROP POLICY IF EXISTS likes_select_public ON likes;

CREATE POLICY likes_server_all ON likes
  AS PERMISSIVE FOR ALL TO app_server
  USING (true) WITH CHECK (true);

CREATE POLICY likes_select_public ON likes
  AS PERMISSIVE FOR SELECT TO PUBLIC
  USING (true);

-- -------------------------------------------------------
-- REPOSTS policies
-- -------------------------------------------------------
DROP POLICY IF EXISTS reposts_server_all    ON reposts;
DROP POLICY IF EXISTS reposts_select_public ON reposts;

CREATE POLICY reposts_server_all ON reposts
  AS PERMISSIVE FOR ALL TO app_server
  USING (true) WITH CHECK (true);

CREATE POLICY reposts_select_public ON reposts
  AS PERMISSIVE FOR SELECT TO PUBLIC
  USING (true);

-- -------------------------------------------------------
-- BOOKMARKS policies (private - only owner)
-- -------------------------------------------------------
DROP POLICY IF EXISTS bookmarks_server_all ON bookmarks;

CREATE POLICY bookmarks_server_all ON bookmarks
  AS PERMISSIVE FOR ALL TO app_server
  USING (true) WITH CHECK (true);

-- -------------------------------------------------------
-- FOLLOWS policies
-- -------------------------------------------------------
DROP POLICY IF EXISTS follows_server_all    ON follows;
DROP POLICY IF EXISTS follows_select_public ON follows;

CREATE POLICY follows_server_all ON follows
  AS PERMISSIVE FOR ALL TO app_server
  USING (true) WITH CHECK (true);

CREATE POLICY follows_select_public ON follows
  AS PERMISSIVE FOR SELECT TO PUBLIC
  USING (true);

-- -------------------------------------------------------
-- NOTIFICATIONS policies (private - only recipient)
-- -------------------------------------------------------
DROP POLICY IF EXISTS notifications_server_all ON notifications;

CREATE POLICY notifications_server_all ON notifications
  AS PERMISSIVE FOR ALL TO app_server
  USING (true) WITH CHECK (true);

-- -------------------------------------------------------
-- MESSAGES policies (private - sender/receiver only)
-- -------------------------------------------------------
DROP POLICY IF EXISTS messages_server_all ON messages;

CREATE POLICY messages_server_all ON messages
  AS PERMISSIVE FOR ALL TO app_server
  USING (true) WITH CHECK (true);

-- -------------------------------------------------------
-- FEEDS policies
-- -------------------------------------------------------
DROP POLICY IF EXISTS feeds_server_all    ON feeds;
DROP POLICY IF EXISTS feeds_select_public ON feeds;

CREATE POLICY feeds_server_all ON feeds
  AS PERMISSIVE FOR ALL TO app_server
  USING (true) WITH CHECK (true);

CREATE POLICY feeds_select_public ON feeds
  AS PERMISSIVE FOR SELECT TO PUBLIC
  USING (is_public = true);

-- -------------------------------------------------------
-- LISTS policies
-- -------------------------------------------------------
DROP POLICY IF EXISTS lists_server_all    ON lists;
DROP POLICY IF EXISTS lists_select_public ON lists;

CREATE POLICY lists_server_all ON lists
  AS PERMISSIVE FOR ALL TO app_server
  USING (true) WITH CHECK (true);

CREATE POLICY lists_select_public ON lists
  AS PERMISSIVE FOR SELECT TO PUBLIC
  USING (is_public = true);

-- -------------------------------------------------------
-- LIST MEMBERS policies
-- -------------------------------------------------------
DROP POLICY IF EXISTS list_members_server_all    ON list_members;
DROP POLICY IF EXISTS list_members_select_public ON list_members;

CREATE POLICY list_members_server_all ON list_members
  AS PERMISSIVE FOR ALL TO app_server
  USING (true) WITH CHECK (true);

CREATE POLICY list_members_select_public ON list_members
  AS PERMISSIVE FOR SELECT TO PUBLIC
  USING (true);

-- -------------------------------------------------------
-- USER INTERESTS, MUTES, BLOCKS, MUTED WORDS (private)
-- -------------------------------------------------------
DROP POLICY IF EXISTS user_interests_server_all ON user_interests;
DROP POLICY IF EXISTS mutes_server_all          ON mutes;
DROP POLICY IF EXISTS blocks_server_all         ON blocks;
DROP POLICY IF EXISTS muted_words_server_all    ON muted_words;

CREATE POLICY user_interests_server_all ON user_interests
  AS PERMISSIVE FOR ALL TO app_server
  USING (true) WITH CHECK (true);

CREATE POLICY mutes_server_all ON mutes
  AS PERMISSIVE FOR ALL TO app_server
  USING (true) WITH CHECK (true);

CREATE POLICY blocks_server_all ON blocks
  AS PERMISSIVE FOR ALL TO app_server
  USING (true) WITH CHECK (true);

CREATE POLICY muted_words_server_all ON muted_words
  AS PERMISSIVE FOR ALL TO app_server
  USING (true) WITH CHECK (true);

-- ============================================================
-- DONE
-- ============================================================
