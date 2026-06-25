/**
 * Per-class student writing profiles. Drives passage vocabulary, tone, depth and
 * the kinds of Indian examples used. Keyed by NCERT class level.
 */
export interface GradeProfile {
  vocabulary: string;
  sentenceStyle: string;
  analogyDomain: string;
  tone: string;
  conceptDepth: string;
  priorKnowledge: string;
  examContext: string;
}

export const gradeProfiles: Record<number, GradeProfile> = {
  11: {
    vocabulary:
      "NCERT Class 11 Chemistry terminology — introduce new terms with brief inline explanation, assume basic science knowledge from Class 10",
    sentenceStyle:
      "mix of medium and longer sentences, technical but readable, occasional short punchy statements for emphasis",
    analogyDomain:
      "laboratory experiments, everyday chemical phenomena, industrial processes, human body chemistry, Indian examples like rusting of iron gates, curd formation, cooking",
    tone: "academic and engaging — connects every concept to a real observation or experiment a student can visualise",
    conceptDepth:
      "fundamental principles with mechanisms — explain why not just what, introduce equations in word form, connect to periodic trends and atomic structure",
    priorKnowledge:
      "Class 10 CBSE Science and Maths — student knows basic atomic structure, chemical reactions, acids bases, periodic table basics",
    examContext:
      "Class 11 NCERT Chemistry — JEE and NEET foundation year, concepts must be precise and exam-relevant",
  },
  12: {
    vocabulary:
      "complete NCERT Class 12 Chemistry language — board exam and JEE/NEET aligned, precise definitions, technical terms used freely",
    sentenceStyle:
      "varied — technical descriptions, mechanistic explanations, comparative statements, precise and information-dense",
    analogyDomain:
      "industrial applications, medical relevance, environmental chemistry, real-world Indian examples like Lead acid battery in vehicles, electroplating industries, drug action",
    tone: "exam-precise and application-focused — every sentence carries information, connects theory to applications and board exam relevance",
    conceptDepth:
      "full depth — mechanisms, exceptions, numerical applications, interconnections between chapters, JEE/NEET level reasoning",
    priorKnowledge:
      "Complete Class 11 NCERT Chemistry — student has solid foundation in atomic structure, bonding, thermodynamics, equilibrium, organic basics",
    examContext:
      "Class 12 NCERT Chemistry — board exams and JEE/NEET, highest precision required",
  },
};
