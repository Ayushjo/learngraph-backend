import { prisma } from "../db/prisma";
import { getNextSubtopic, getSubtopicById } from "../data/subtopics";
import { subtopicService } from "./subtopics.service";
import { contentService } from "./content.service";

export async function triggerPreemptiveGeneration(
  studentId: string,
  completedSubtopicId: string,
): Promise<void> {
  try {
    const subtopicDef = getSubtopicById(completedSubtopicId);
    if (!subtopicDef) {
      console.log(`Preemptive: completed subtopic ${completedSubtopicId} not found, skipping`);
      return;
    }

    const nextSubtopic = getNextSubtopic(subtopicDef.topicId, subtopicDef.order);
    if (!nextSubtopic) {
      console.log(`Preemptive: no next subtopic after ${completedSubtopicId}, skipping`);
      return;
    }

    const existingSession = await prisma.session.findFirst({
      where: {
        studentId,
        subtopicId: nextSubtopic.id,
        sessionStatus: "active",
      },
    });

    if (existingSession) {
      console.log(`Preemptive: active session already exists for ${nextSubtopic.id}, skipping`);
      return;
    }

    const studentContext = await subtopicService.getStudentContextForSubtopic(
      studentId,
      nextSubtopic.id,
    );

    await contentService.generatePassageAndQuestions(
      studentId,
      nextSubtopic.id,
      studentContext,
      undefined,
    );

    console.log(`Preemptive: generated content for ${nextSubtopic.id} for student ${studentId}`);
  } catch (error) {
    console.error(
      `Preemptive generation failed for ${completedSubtopicId} → next subtopic: ${(error as Error).message}`,
    );
    return;
  }
}
