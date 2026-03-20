import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";

export const studentService = {
  // Get or create a student by name
  // This is our "auth" — student types their name, we find or create them
  async findOrCreate(name: string) {
    if (!name || name.trim().length < 2) {
      throw new AppError(400, "Name must be at least 2 characters");
    }

    const normalizedName = name.trim().toLowerCase();

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
