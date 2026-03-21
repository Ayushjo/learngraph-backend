import { prisma } from "../db/prisma";
import { AppError } from "../middleware/errorHandler";

export const studentService = {
  async findOrCreate(name: string) {
    if (!name || typeof name !== "string") {
      throw new AppError(400, "Name is required");
    }

    const sanitized = name.replace(/<[^>]*>/g, "").trim();

    if (sanitized.length < 2)
      throw new AppError(400, "Name must be at least 2 characters");
    if (sanitized.length > 50)
      throw new AppError(400, "Name must be under 50 characters");
    if (!/^[a-zA-Z\s.\-']+$/.test(sanitized)) {
      throw new AppError(
        400,
        "Name can only contain letters, spaces, and basic punctuation",
      );
    }

    const normalizedName = sanitized.toLowerCase();

    return prisma.student.upsert({
      where: { name: normalizedName },
      update: { updatedAt: new Date() },
      create: { name: normalizedName },
    });
  },

  async getById(id: string) {
    const student = await prisma.student.findUnique({ where: { id } });
    if (!student) throw new AppError(404, "Student not found");
    return student;
  },

  async getWithHistory(id: string) {
    const student = await prisma.student.findUnique({
      where: { id },
      include: {
        sessions: {
          orderBy: { createdAt: "desc" },
          take: 10,
          include: { subtopic: true, quizAttempt: true },
        },
      },
    });
    if (!student) throw new AppError(404, "Student not found");
    return student;
  },
};
