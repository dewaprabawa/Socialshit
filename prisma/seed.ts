import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.account.count();
  if (existing > 0) {
    console.log(`Seed skipped: ${existing} account(s) already exist.`);
    return;
  }

  const ig = await prisma.account.create({
    data: {
      platform: "instagram",
      name: "Socialshit Demo (IG)",
      handle: "@socialshit.demo",
      externalId: "sandbox-ig-1",
      accessToken: "sandbox",
      sandbox: true,
      avatarUrl:
        "https://api.dicebear.com/9.x/shapes/svg?seed=socialshit-ig",
    },
  });

  const fb = await prisma.account.create({
    data: {
      platform: "facebook",
      name: "Socialshit Demo Page",
      handle: "Socialshit Demo Page",
      externalId: "sandbox-fb-1",
      accessToken: "sandbox",
      sandbox: true,
      avatarUrl:
        "https://api.dicebear.com/9.x/shapes/svg?seed=socialshit-fb",
    },
  });

  await prisma.post.create({
    data: {
      accountId: ig.id,
      platform: "instagram",
      caption:
        "New drop just landed. Minimal, bold, and made to move. Which colorway are you grabbing first?",
      hashtags: "#newdrop #streetwear #minimal #ootd",
      mediaUrl:
        "https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1080&q=80",
      status: "published",
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 24),
      externalId: "sandbox-media-seed-1",
      externalUrl: "https://instagram.com/p/sandbox-seed-1",
      aiGenerated: true,
    },
  });

  console.log("Seed complete:", { ig: ig.id, fb: fb.id });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
