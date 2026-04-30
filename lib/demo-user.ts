import { getPrisma } from "@/lib/prisma";

const demoUserEmail = "demo@dampener.local";
const demoUserPassword = "demo-password";

export async function getDemoUser() {
  const prisma = getPrisma();

  return prisma.user.upsert({
    where: { email: demoUserEmail },
    update: {},
    create: {
      email: demoUserEmail,
      password: demoUserPassword,
    },
  });
}
