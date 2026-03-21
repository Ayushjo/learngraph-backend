import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { TOPICS } from "../data/subtopics";
import dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const seed = async () => {
  console.log("🌱 Seeding Postgres subtopics...");

  let count = 0;
  for (const topic of TOPICS) {
    for (const sub of topic.subtopics) {
      await prisma.subtopic.upsert({
        where: { id: sub.id },
        update: {
          name: sub.name,
          topicId: sub.topicId,
          order: sub.order,
          keyConceptsSummary: sub.keyConceptsSummary,
          classLevel: sub.classLevel,
          subject: sub.subject,
        },
        create: {
          id: sub.id,
          name: sub.name,
          topicId: sub.topicId,
          order: sub.order,
          keyConceptsSummary: sub.keyConceptsSummary,
          classLevel: sub.classLevel,
          subject: sub.subject,
        },
      });
      count++;
    }
  }

  console.log(`✅ Seeded ${count} subtopics`);
  await prisma.$disconnect();
};

seed();
