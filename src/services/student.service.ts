import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";

export const studentService = {
  // Get or create a student by name
  // This is our "auth" — student types their name, we find or create them
  async findOrCreate(name: string) {
    if (!name || typeof name !== "string") {
      throw new AppError(400, "Name is required");
    }

    // Strip HTML tags, trim whitespace
    const sanitized = name.replace(/<[^>]*>/g, "").trim();

    if (sanitized.length < 2) {
      throw new AppError(400, "Name must be at least 2 characters");
    }

    if (sanitized.length > 50) {
      throw new AppError(400, "Name must be under 50 characters");
    }

    // Only allow letters, spaces, dots, hyphens
    if (!/^[a-zA-Z\s.\-']+$/.test(sanitized)) {
      throw new AppError(
        400,
        "Name can only contain letters, spaces, and basic punctuation",
      );
    }

    const normalizedName = sanitized.toLowerCase();

    const student = await prisma.student.upsert({
      where: { name: normalizedName },
      update: { updatedAt: new Date() },
      create: { name: normalizedName },
    });

    return student;
  },

  async getById(id: string) {
    const student = await prisma.student.findUnique({
      where: { id },
    });

    if (!student) {
      throw new AppError(404, "Student not found");
    }

    return student;
  },

  // Get student with their full session + attempt history
  async getWithHistory(id: string) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        sessions: {
          orderBy: { createdAt: "desc" },
          take: 10, // last 10 sessions
          include: {
            topic: true,
            quizAttempt: true,
          },
        },
      },
    });

    if (!student) {
      throw new AppError(404, "Student not found");
    }

    return student;
  },
};
