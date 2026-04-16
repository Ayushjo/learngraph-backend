import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { TOPICS } from "../data/subtopics";
import dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const seed = async () => {
  console.log("🌱 Seeding Postgres subtopics...");

  let subtopicCount = 0;
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
      subtopicCount++;
    }
  }

  console.log(`✅ Seeded ${subtopicCount} subtopics`);

  console.log("🌱 Seeding Postgres concepts...");

  let conceptCount = 0;
  for (const topic of TOPICS) {
    for (const sub of topic.subtopics) {
      for (const concept of sub.concepts) {
        await prisma.concept.upsert({
          where: { id: concept.id },
          update: {
            name: concept.name,
            tag: concept.tag,
          },
          create: {
            id: concept.id,
            subtopicId: sub.id,
            name: concept.name,
            tag: concept.tag,
          },
        });
        conceptCount++;
      }
    }
  }

  console.log(`✅ Seeded ${conceptCount} concepts`);
  await prisma.$disconnect();
};

seed();
