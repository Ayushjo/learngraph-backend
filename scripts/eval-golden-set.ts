/**
 * Golden-set eval harness for generation quality (B6).
 * Run: npm run eval:golden-set
 *
 * Reports per-case metrics from frozen student states. Validation scores
 * will populate once Pillar A validator (A4) is wired; until then reports
 * structural readiness checks.
 */
import dotenv from "dotenv";
dotenv.config();

import { generationLogService } from "../src/services/generation-log.service";
import { getSubtopicById } from "../src/data/subtopics";

interface GoldenCase {
  id: string;
  description: string;
  studentId: string;
  subtopicId: string;
  previousAttempts: number;
  previousMastery: number;
  weakConceptTags: string[];
}

const GOLDEN_CASES: GoldenCase[] = [
  {
    id: "gc01",
    description: "First attempt, no prior mastery",
    studentId: "golden-student-01",
    subtopicId: "c11_basic_concepts_s1",
    previousAttempts: 0,
    previousMastery: 0,
    weakConceptTags: ["matter_classification", "si_units_measurement"],
  },
  {
    id: "gc02",
    description: "Retry after weak mole concept performance",
    studentId: "golden-student-02",
    subtopicId: "c11_basic_concepts_s3",
    previousAttempts: 2,
    previousMastery: 0.35,
    weakConceptTags: ["mole_concept", "molar_mass"],
  },
  {
    id: "gc03",
    description: "Stoichiometry with prerequisite gaps",
    studentId: "golden-student-03",
    subtopicId: "c11_basic_concepts_s5",
    previousAttempts: 1,
    previousMastery: 0.42,
    weakConceptTags: ["stoichiometry", "limiting_reagent"],
  },
  {
    id: "gc04",
    description: "High mastery review-ready concepts",
    studentId: "golden-student-04",
    subtopicId: "c11_basic_concepts_s4",
    previousAttempts: 3,
    previousMastery: 0.82,
    weakConceptTags: [],
  },
  {
    id: "gc05",
    description: "Structure of atom — subatomic particles intro",
    studentId: "golden-student-05",
    subtopicId: "c11_structure_atom_s1",
    previousAttempts: 0,
    previousMastery: 0,
    weakConceptTags: ["subatomic_particles"],
  },
  { id: "gc06", description: "Bohr model retry", studentId: "golden-student-06", subtopicId: "c11_structure_atom_s2", previousAttempts: 2, previousMastery: 0.4, weakConceptTags: ["bohr_postulates"] },
  { id: "gc07", description: "Quantum numbers first pass", studentId: "golden-student-07", subtopicId: "c11_structure_atom_s5", previousAttempts: 0, previousMastery: 0, weakConceptTags: ["quantum_numbers"] },
  { id: "gc08", description: "Periodic table genesis", studentId: "golden-student-08", subtopicId: "c11_periodic_table_s1", previousAttempts: 0, previousMastery: 0, weakConceptTags: [] },
  { id: "gc09", description: "Chemical bonding ionic", studentId: "golden-student-09", subtopicId: "c11_chemical_bonding_s1", previousAttempts: 1, previousMastery: 0.5, weakConceptTags: ["lattice_energy"] },
  { id: "gc10", description: "Thermodynamics enthalpy weak", studentId: "golden-student-10", subtopicId: "c11_thermodynamics_s2", previousAttempts: 2, previousMastery: 0.38, weakConceptTags: ["enthalpy"] },
  { id: "gc11", description: "Equilibrium constants", studentId: "golden-student-11", subtopicId: "c11_equilibrium_s2", previousAttempts: 0, previousMastery: 0, weakConceptTags: [] },
  { id: "gc12", description: "Redox balancing retry", studentId: "golden-student-12", subtopicId: "c11_redox_s3", previousAttempts: 3, previousMastery: 0.55, weakConceptTags: [] },
  { id: "gc13", description: "Organic basics IUPAC", studentId: "golden-student-13", subtopicId: "c11_organic_basic_s1", previousAttempts: 0, previousMastery: 0, weakConceptTags: [] },
  { id: "gc14", description: "Solutions colligative", studentId: "golden-student-14", subtopicId: "c12_solutions_s3", previousAttempts: 1, previousMastery: 0.48, weakConceptTags: [] },
  { id: "gc15", description: "Electrochemistry cells", studentId: "golden-student-15", subtopicId: "c12_electrochemistry_s2", previousAttempts: 0, previousMastery: 0, weakConceptTags: [] },
  { id: "gc16", description: "Kinetics rate law", studentId: "golden-student-16", subtopicId: "c12_chemical_kinetics_s2", previousAttempts: 2, previousMastery: 0.44, weakConceptTags: [] },
  { id: "gc17", description: "Coordination compounds", studentId: "golden-student-17", subtopicId: "c12_coordination_s1", previousAttempts: 0, previousMastery: 0, weakConceptTags: [] },
  { id: "gc18", description: "Biomolecules proteins", studentId: "golden-student-18", subtopicId: "c12_biomolecules_s2", previousAttempts: 1, previousMastery: 0.6, weakConceptTags: [] },
  { id: "gc19", description: "Solid state packing", studentId: "golden-student-19", subtopicId: "c12_solid_state_s2", previousAttempts: 0, previousMastery: 0, weakConceptTags: [] },
  { id: "gc20", description: "Surface chemistry adsorption", studentId: "golden-student-20", subtopicId: "c12_surface_chemistry_s1", previousAttempts: 2, previousMastery: 0.7, weakConceptTags: [] },
];

function evaluateCase(c: GoldenCase): {
  id: string;
  description: string;
  subtopicValid: boolean;
  conceptCount: number;
  validationScore: number | null;
  status: string;
} {
  const subtopic = getSubtopicById(c.subtopicId);
  const subtopicValid = Boolean(subtopic);
  const conceptCount = subtopic?.concepts.length ?? 0;
  const weakResolvable = c.weakConceptTags.every((tag) =>
    subtopic?.concepts.some((concept) => concept.tag === tag) ?? false,
  );

  let status = "ok";
  if (!subtopicValid) status = "invalid_subtopic";
  else if (!weakResolvable && c.weakConceptTags.length > 0) status = "weak_tags_mismatch";

  return {
    id: c.id,
    description: c.description,
    subtopicValid,
    conceptCount,
    validationScore: null,
    status,
  };
}

async function main() {
  console.log("Golden set evaluation\n");
  console.log(
    ["Case", "Subtopic OK", "Concepts", "Validation", "Status"].join("\t"),
  );
  console.log("-".repeat(72));

  for (const c of GOLDEN_CASES) {
    const result = evaluateCase(c);
    console.log(
      [
        result.id,
        result.subtopicValid ? "yes" : "no",
        String(result.conceptCount),
        result.validationScore == null ? "n/a" : result.validationScore.toFixed(2),
        result.status,
      ].join("\t"),
    );
  }

  console.log("\nRecent generation observability (last 7 days):");
  try {
    const stats = await generationLogService.getDailyStats(7);
    if (stats.length === 0) {
      console.log("  No GenerationLog rows yet — run a generation session first.");
    } else {
      for (const row of stats) {
        console.log(
          `  ${row.day}: tokens=${row.totalTokens} bankHit=${(row.bankHitRate * 100).toFixed(0)}% ` +
            `val=${row.meanValidationScore?.toFixed(2) ?? "n/a"} p95=${row.p95LatencyMs ?? "n/a"}ms`,
        );
      }
    }
  } catch (err) {
    console.log(`  (GenerationLog table not available: ${(err as Error).message})`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
