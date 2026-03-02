import { db } from '../src/lib/db';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Seeding database...');

  // Create sample users
  const hashedPassword = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    db.user.create({
      data: {
        handle: 'alice',
        email: 'alice@bsky.app',
        password: hashedPassword,
        displayName: 'Alice Johnson',
        bio: 'Tech enthusiast | Open source advocate | Building the future of social media',
        website: 'https://alice.dev',
        verified: true,
        followersCount: 1250,
        followingCount: 340,
        postsCount: 89,
      }
    }),
    db.user.create({
      data: {
        handle: 'bob',
        email: 'bob@bsky.app',
        password: hashedPassword,
        displayName: 'Bob Smith',
        bio: 'Designer & Developer. Creating beautiful things.',
        verified: false,
        followersCount: 542,
        followingCount: 210,
        postsCount: 45,
      }
    }),
    db.user.create({
      data: {
        handle: 'charlie',
        email: 'charlie@bsky.app',
        password: hashedPassword,
        displayName: 'Charlie Davis',
        bio: 'Music lover | Coffee addict | San Francisco',
        website: 'https://charliedavis.me',
        verified: true,
        followersCount: 3200,
        followingCount: 890,
        postsCount: 234,
      }
    }),
    db.user.create({
      data: {
        handle: 'diana',
        email: 'diana@bsky.app',
        password: hashedPassword,
        displayName: 'Diana Lee',
        bio: 'Science communicator. Making complex topics simple.',
        verified: false,
        followersCount: 890,
        followingCount: 156,
        postsCount: 67,
      }
    }),
    db.user.create({
      data: {
        handle: 'edward',
        email: 'edward@bsky.app',
        password: hashedPassword,
        displayName: 'Edward Kim',
        bio: 'Photographer | Traveler | Storyteller',
        verified: true,
        followersCount: 4500,
        followingCount: 234,
        postsCount: 312,
      }
    }),
  ]);

  console.log(`Created ${users.length} users`);

  // Create sample posts
  const posts = [
    {
      content: "Just discovered Bluesky and I'm already loving the community here! The decentralized approach to social media is exactly what we need. 🦋 #Bluesky #Decentralized",
      authorId: users[0].id,
      likeCount: 45,
      repostCount: 12,
      replyCount: 8,
    },
    {
      content: "Working on a new design system for our product. It's amazing how much consistency matters when building at scale. Anyone else deep in design tokens? #TechNews",
      authorId: users[1].id,
      likeCount: 23,
      repostCount: 5,
      replyCount: 3,
    },
    {
      content: "Coffee and coding - the perfect morning combo ☕️ What's your go-to productivity hack?",
      authorId: users[2].id,
      likeCount: 89,
      repostCount: 21,
      replyCount: 34,
    },
    {
      content: "New research shows that taking short breaks every hour can boost productivity by up to 30%. Time to set those reminders! 📊 #Science #Productivity",
      authorId: users[3].id,
      likeCount: 156,
      repostCount: 45,
      replyCount: 12,
    },
    {
      content: "Just got back from an amazing trip to Japan! The cherry blossoms were absolutely breathtaking this time of year. Can't wait to share the photos 🌸",
      authorId: users[4].id,
      likeCount: 342,
      repostCount: 78,
      replyCount: 56,
    },
    {
      content: "The future of social media isn't about who owns the platform - it's about who controls your data. That's why I'm here on Bluesky. #ATProtocol #OpenWeb",
      authorId: users[0].id,
      likeCount: 67,
      repostCount: 34,
      replyCount: 15,
    },
    {
      content: "Hot take: Dark mode should be the default for all development tools. Who's with me? 🌙 #TechNews",
      authorId: users[1].id,
      likeCount: 234,
      repostCount: 67,
      replyCount: 89,
    },
    {
      content: "Just released my new album on Bandcamp! 2 years in the making and I couldn't be happier with how it turned out. Link in bio 🎵",
      authorId: users[2].id,
      likeCount: 567,
      repostCount: 123,
      replyCount: 78,
    },
    {
      content: "Interesting paper on quantum computing just dropped. The implications for cryptography are fascinating - we might need to rethink our entire approach to security in the next decade. #TechNews",
      authorId: users[3].id,
      likeCount: 89,
      repostCount: 23,
      replyCount: 7,
    },
    {
      content: "Golden hour in Santorini 🌅 Sometimes you just need to stop and appreciate the beauty around us. #Photography",
      authorId: users[4].id,
      likeCount: 890,
      repostCount: 234,
      replyCount: 45,
    },
    {
      content: "The #OpenWeb movement is gaining momentum! More people are realizing the importance of decentralized platforms. #Bluesky is leading the charge! 🚀",
      authorId: users[0].id,
      likeCount: 78,
      repostCount: 45,
      replyCount: 23,
    },
    {
      content: "Just read an amazing article about #Decentralized systems. The future is bright for those who value privacy and data ownership! 💡",
      authorId: users[1].id,
      likeCount: 156,
      repostCount: 67,
      replyCount: 34,
    },
    {
      content: "#SocialMedia is evolving. Are you ready for the next generation of platforms? 🌐",
      authorId: users[2].id,
      likeCount: 234,
      repostCount: 89,
      replyCount: 56,
    },
    {
      content: "Building on the #OpenWeb means building for everyone. No gatekeepers, no algorithms deciding what you see. Just pure connection. 🤝",
      authorId: users[3].id,
      likeCount: 345,
      repostCount: 123,
      replyCount: 67,
    },
    {
      content: "The beauty of #Decentralized social networks is that your data belongs to YOU. Not to a corporation. This is the future. #Bluesky",
      authorId: users[4].id,
      likeCount: 567,
      repostCount: 234,
      replyCount: 89,
    },
  ];

  for (const post of posts) {
    await db.post.create({ data: post });
  }

  console.log(`Created ${posts.length} posts`);

  // Create some follows
  await db.follow.createMany({
    data: [
      { followerId: users[0].id, followingId: users[1].id },
      { followerId: users[0].id, followingId: users[2].id },
      { followerId: users[0].id, followingId: users[3].id },
      { followerId: users[1].id, followingId: users[0].id },
      { followerId: users[1].id, followingId: users[4].id },
      { followerId: users[2].id, followingId: users[0].id },
      { followerId: users[2].id, followingId: users[4].id },
      { followerId: users[3].id, followingId: users[0].id },
      { followerId: users[3].id, followingId: users[2].id },
      { followerId: users[4].id, followingId: users[0].id },
    ]
  });

  console.log('Created follow relationships');

  // Create sample feeds
  await db.feed.createMany({
    data: [
      { name: 'Discover', description: 'Discover new content from across the network', creatorId: users[0].id, pinsCount: 12500 },
      { name: "What's Hot", description: 'The most popular posts right now', creatorId: users[0].id, pinsCount: 8900 },
      { name: 'Science & Tech', description: 'Latest in science and technology', creatorId: users[3].id, pinsCount: 3200 },
      { name: 'Photography', description: 'Beautiful photos from around the world', creatorId: users[4].id, pinsCount: 4500 },
    ]
  });

  console.log('Created sample feeds');

  console.log('✅ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
