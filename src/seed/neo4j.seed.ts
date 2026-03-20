import neo4j from "neo4j-driver";
import dotenv from "dotenv";
dotenv.config();

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!),
);

// ============================================================
// DOMAIN DATA
// ============================================================

interface TopicNode {
  id: string;
  name: string;
  subject: string;
  classLevel: number;
}

interface PrerequisiteEdge {
  from: string; // topic id
  to: string; // topic id
}

interface RelatedEdge {
  a: string;
  b: string;
}

const topics: TopicNode[] = [
  // ── CLASS 6 ──────────────────────────────────────────────
  {
    id: "c6_food_sources",
    name: "Food: Where Does It Come From?",
    subject: "Science",
    classLevel: 6,
  },
  {
    id: "c6_components_food",
    name: "Components of Food",
    subject: "Science",
    classLevel: 6,
  },
  {
    id: "c6_fibre_fabric",
    name: "Fibre to Fabric",
    subject: "Science",
    classLevel: 6,
  },
  {
    id: "c6_sorting_materials",
    name: "Sorting Materials into Groups",
    subject: "Science",
    classLevel: 6,
  },
  {
    id: "c6_separation",
    name: "Separation of Substances",
    subject: "Science",
    classLevel: 6,
  },
  {
    id: "c6_changes",
    name: "Changes Around Us",
    subject: "Science",
    classLevel: 6,
  },
  {
    id: "c6_plants",
    name: "Getting to Know Plants",
    subject: "Science",
    classLevel: 6,
  },
  {
    id: "c6_body_movements",
    name: "Body Movements",
    subject: "Science",
    classLevel: 6,
  },
  {
    id: "c6_living_organisms",
    name: "The Living Organisms and Their Surroundings",
    subject: "Science",
    classLevel: 6,
  },
  {
    id: "c6_motion",
    name: "Motion and Measurement of Distances",
    subject: "Science",
    classLevel: 6,
  },
  {
    id: "c6_light_shadow",
    name: "Light, Shadows and Reflections",
    subject: "Science",
    classLevel: 6,
  },
  {
    id: "c6_electricity",
    name: "Electricity and Circuits",
    subject: "Science",
    classLevel: 6,
  },
  {
    id: "c6_magnets",
    name: "Fun with Magnets",
    subject: "Science",
    classLevel: 6,
  },
  { id: "c6_water", name: "Water", subject: "Science", classLevel: 6 },

  // ── CLASS 7 ──────────────────────────────────────────────
  {
    id: "c7_nutrition_plants",
    name: "Nutrition in Plants",
    subject: "Science",
    classLevel: 7,
  },
  {
    id: "c7_nutrition_animals",
    name: "Nutrition in Animals",
    subject: "Science",
    classLevel: 7,
  },
  {
    id: "c7_fibre_fabric",
    name: "Fibre to Fabric: Wool and Silk",
    subject: "Science",
    classLevel: 7,
  },
  { id: "c7_heat", name: "Heat", subject: "Science", classLevel: 7 },
  {
    id: "c7_acids_bases",
    name: "Acids, Bases and Salts",
    subject: "Science",
    classLevel: 7,
  },
  {
    id: "c7_physical_chemical",
    name: "Physical and Chemical Changes",
    subject: "Science",
    classLevel: 7,
  },
  {
    id: "c7_weather_climate",
    name: "Weather, Climate and Adaptations",
    subject: "Science",
    classLevel: 7,
  },
  {
    id: "c7_winds_storms",
    name: "Winds, Storms and Cyclones",
    subject: "Science",
    classLevel: 7,
  },
  { id: "c7_soil", name: "Soil", subject: "Science", classLevel: 7 },
  {
    id: "c7_respiration",
    name: "Respiration in Organisms",
    subject: "Science",
    classLevel: 7,
  },
  {
    id: "c7_transportation",
    name: "Transportation in Plants and Animals",
    subject: "Science",
    classLevel: 7,
  },
  {
    id: "c7_reproduction_plants",
    name: "Reproduction in Plants",
    subject: "Science",
    classLevel: 7,
  },
  {
    id: "c7_motion_time",
    name: "Motion and Time",
    subject: "Science",
    classLevel: 7,
  },
  {
    id: "c7_electric_current",
    name: "Electric Current and its Effects",
    subject: "Science",
    classLevel: 7,
  },
  { id: "c7_light", name: "Light", subject: "Science", classLevel: 7 },
  {
    id: "c7_water_resource",
    name: "Water: A Precious Resource",
    subject: "Science",
    classLevel: 7,
  },

  // ── CLASS 8 ──────────────────────────────────────────────
  {
    id: "c8_crop_production",
    name: "Crop Production and Management",
    subject: "Science",
    classLevel: 8,
  },
  {
    id: "c8_microorganisms",
    name: "Microorganisms: Friend and Foe",
    subject: "Science",
    classLevel: 8,
  },
  {
    id: "c8_synthetic_fibres",
    name: "Synthetic Fibres and Plastics",
    subject: "Science",
    classLevel: 8,
  },
  {
    id: "c8_metals_nonmetals",
    name: "Materials: Metals and Non-Metals",
    subject: "Science",
    classLevel: 8,
  },
  {
    id: "c8_coal_petroleum",
    name: "Coal and Petroleum",
    subject: "Science",
    classLevel: 8,
  },
  {
    id: "c8_combustion",
    name: "Combustion and Flame",
    subject: "Science",
    classLevel: 8,
  },
  {
    id: "c8_conservation",
    name: "Conservation of Plants and Animals",
    subject: "Science",
    classLevel: 8,
  },
  {
    id: "c8_cell_structure",
    name: "Cell Structure and Functions",
    subject: "Science",
    classLevel: 8,
  },
  {
    id: "c8_reproduction_animals",
    name: "Reproduction in Animals",
    subject: "Science",
    classLevel: 8,
  },
  {
    id: "c8_adolescence",
    name: "Reaching the Age of Adolescence",
    subject: "Science",
    classLevel: 8,
  },
  {
    id: "c8_force_pressure",
    name: "Force and Pressure",
    subject: "Science",
    classLevel: 8,
  },
  { id: "c8_friction", name: "Friction", subject: "Science", classLevel: 8 },
  { id: "c8_sound", name: "Sound", subject: "Science", classLevel: 8 },
  {
    id: "c8_chemical_effects",
    name: "Chemical Effects of Electric Current",
    subject: "Science",
    classLevel: 8,
  },
  {
    id: "c8_natural_phenomena",
    name: "Some Natural Phenomena",
    subject: "Science",
    classLevel: 8,
  },
  {
    id: "c8_light",
    name: "Light: Reflection and Refraction",
    subject: "Science",
    classLevel: 8,
  },

  // ── CLASS 9 ──────────────────────────────────────────────
  {
    id: "c9_matter",
    name: "Matter in Our Surroundings",
    subject: "Science",
    classLevel: 9,
  },
  {
    id: "c9_matter_pure",
    name: "Is Matter Around Us Pure",
    subject: "Science",
    classLevel: 9,
  },
  {
    id: "c9_atoms_molecules",
    name: "Atoms and Molecules",
    subject: "Science",
    classLevel: 9,
  },
  {
    id: "c9_structure_atom",
    name: "Structure of the Atom",
    subject: "Science",
    classLevel: 9,
  },
  {
    id: "c9_fundamental_unit",
    name: "The Fundamental Unit of Life",
    subject: "Science",
    classLevel: 9,
  },
  { id: "c9_tissues", name: "Tissues", subject: "Science", classLevel: 9 },
  {
    id: "c9_diversity",
    name: "Diversity in Living Organisms",
    subject: "Science",
    classLevel: 9,
  },
  { id: "c9_motion", name: "Motion", subject: "Science", classLevel: 9 },
  {
    id: "c9_force_laws",
    name: "Force and Laws of Motion",
    subject: "Science",
    classLevel: 9,
  },
  {
    id: "c9_gravitation",
    name: "Gravitation",
    subject: "Science",
    classLevel: 9,
  },
  {
    id: "c9_work_energy",
    name: "Work and Energy",
    subject: "Science",
    classLevel: 9,
  },
  { id: "c9_sound", name: "Sound", subject: "Science", classLevel: 9 },
  {
    id: "c9_why_fall_ill",
    name: "Why Do We Fall Ill",
    subject: "Science",
    classLevel: 9,
  },
  {
    id: "c9_natural_resources",
    name: "Natural Resources",
    subject: "Science",
    classLevel: 9,
  },
  {
    id: "c9_food_resources",
    name: "Improvement in Food Resources",
    subject: "Science",
    classLevel: 9,
  },

  // ── CLASS 10 ─────────────────────────────────────────────
  {
    id: "c10_chemical_reactions",
    name: "Chemical Reactions and Equations",
    subject: "Science",
    classLevel: 10,
  },
  {
    id: "c10_acids_bases",
    name: "Acids, Bases and Salts",
    subject: "Science",
    classLevel: 10,
  },
  {
    id: "c10_metals_nonmetals",
    name: "Metals and Non-Metals",
    subject: "Science",
    classLevel: 10,
  },
  {
    id: "c10_carbon",
    name: "Carbon and its Compounds",
    subject: "Science",
    classLevel: 10,
  },
  {
    id: "c10_life_processes",
    name: "Life Processes",
    subject: "Science",
    classLevel: 10,
  },
  {
    id: "c10_control_coord",
    name: "Control and Coordination",
    subject: "Science",
    classLevel: 10,
  },
  {
    id: "c10_reproduction",
    name: "How Do Organisms Reproduce",
    subject: "Science",
    classLevel: 10,
  },
  {
    id: "c10_heredity",
    name: "Heredity and Evolution",
    subject: "Science",
    classLevel: 10,
  },
  {
    id: "c10_light",
    name: "Light: Reflection and Refraction",
    subject: "Science",
    classLevel: 10,
  },
  {
    id: "c10_human_eye",
    name: "The Human Eye and the Colourful World",
    subject: "Science",
    classLevel: 10,
  },
  {
    id: "c10_electricity",
    name: "Electricity",
    subject: "Science",
    classLevel: 10,
  },
  {
    id: "c10_magnetic_effects",
    name: "Magnetic Effects of Electric Current",
    subject: "Science",
    classLevel: 10,
  },
  {
    id: "c10_energy_sources",
    name: "Sources of Energy",
    subject: "Science",
    classLevel: 10,
  },
  {
    id: "c10_environment",
    name: "Our Environment",
    subject: "Science",
    classLevel: 10,
  },
];

// PREREQUISITE edges — from MUST be mastered before to
const prerequisites: PrerequisiteEdge[] = [
  // Class 6 → Class 7
  { from: "c6_components_food", to: "c7_nutrition_plants" },
  { from: "c6_plants", to: "c7_nutrition_plants" },
  { from: "c6_food_sources", to: "c7_nutrition_plants" },
  { from: "c7_nutrition_plants", to: "c7_nutrition_animals" },
  { from: "c6_body_movements", to: "c7_nutrition_animals" },
  { from: "c6_fibre_fabric", to: "c7_fibre_fabric" },
  { from: "c6_changes", to: "c7_heat" },
  { from: "c6_sorting_materials", to: "c7_acids_bases" },
  { from: "c6_changes", to: "c7_physical_chemical" },
  { from: "c6_separation", to: "c7_physical_chemical" },
  { from: "c6_living_organisms", to: "c7_weather_climate" },
  { from: "c7_weather_climate", to: "c7_winds_storms" },
  { from: "c6_separation", to: "c7_soil" },
  { from: "c7_nutrition_plants", to: "c7_respiration" },
  { from: "c7_nutrition_animals", to: "c7_respiration" },
  { from: "c7_nutrition_plants", to: "c7_transportation" },
  { from: "c7_nutrition_animals", to: "c7_transportation" },
  { from: "c7_nutrition_plants", to: "c7_reproduction_plants" },
  { from: "c6_plants", to: "c7_reproduction_plants" },
  { from: "c6_motion", to: "c7_motion_time" },
  { from: "c6_electricity", to: "c7_electric_current" },
  { from: "c6_light_shadow", to: "c7_light" },
  { from: "c6_water", to: "c7_water_resource" },

  // Class 7 → Class 8
  { from: "c7_nutrition_plants", to: "c8_crop_production" },
  { from: "c7_soil", to: "c8_crop_production" },
  { from: "c7_nutrition_animals", to: "c8_microorganisms" },
  { from: "c7_respiration", to: "c8_microorganisms" },
  { from: "c7_fibre_fabric", to: "c8_synthetic_fibres" },
  { from: "c6_sorting_materials", to: "c8_metals_nonmetals" },
  { from: "c7_acids_bases", to: "c8_metals_nonmetals" },
  { from: "c7_physical_chemical", to: "c8_coal_petroleum" },
  { from: "c8_coal_petroleum", to: "c8_combustion" },
  { from: "c7_physical_chemical", to: "c8_combustion" },
  { from: "c7_reproduction_plants", to: "c8_conservation" },
  { from: "c7_weather_climate", to: "c8_conservation" },
  { from: "c7_nutrition_plants", to: "c8_cell_structure" },
  { from: "c7_respiration", to: "c8_cell_structure" },
  { from: "c8_cell_structure", to: "c8_reproduction_animals" },
  { from: "c7_reproduction_plants", to: "c8_reproduction_animals" },
  { from: "c8_reproduction_animals", to: "c8_adolescence" },
  { from: "c7_motion_time", to: "c8_force_pressure" },
  { from: "c8_force_pressure", to: "c8_friction" },
  { from: "c7_light", to: "c8_sound" },
  { from: "c7_motion_time", to: "c8_sound" },
  { from: "c7_electric_current", to: "c8_chemical_effects" },
  { from: "c8_friction", to: "c8_natural_phenomena" },
  { from: "c8_chemical_effects", to: "c8_natural_phenomena" },
  { from: "c7_light", to: "c8_light" },

  // Class 8 → Class 9
  { from: "c7_physical_chemical", to: "c9_matter" },
  { from: "c8_metals_nonmetals", to: "c9_matter" },
  { from: "c9_matter", to: "c9_matter_pure" },
  { from: "c6_separation", to: "c9_matter_pure" },
  { from: "c9_matter_pure", to: "c9_atoms_molecules" },
  { from: "c9_atoms_molecules", to: "c9_structure_atom" },
  { from: "c8_cell_structure", to: "c9_fundamental_unit" },
  { from: "c9_fundamental_unit", to: "c9_tissues" },
  { from: "c9_tissues", to: "c9_diversity" },
  { from: "c6_living_organisms", to: "c9_diversity" },
  { from: "c7_motion_time", to: "c9_motion" },
  { from: "c8_force_pressure", to: "c9_motion" },
  { from: "c9_motion", to: "c9_force_laws" },
  { from: "c8_friction", to: "c9_force_laws" },
  { from: "c9_force_laws", to: "c9_gravitation" },
  { from: "c9_gravitation", to: "c9_work_energy" },
  { from: "c9_force_laws", to: "c9_work_energy" },
  { from: "c8_sound", to: "c9_sound" },
  { from: "c9_motion", to: "c9_sound" },
  { from: "c8_microorganisms", to: "c9_why_fall_ill" },
  { from: "c8_cell_structure", to: "c9_why_fall_ill" },
  { from: "c8_conservation", to: "c9_natural_resources" },
  { from: "c7_water_resource", to: "c9_natural_resources" },
  { from: "c7_soil", to: "c9_natural_resources" },
  { from: "c8_crop_production", to: "c9_food_resources" },
  { from: "c8_microorganisms", to: "c9_food_resources" },

  // Class 9 → Class 10
  { from: "c7_physical_chemical", to: "c10_chemical_reactions" },
  { from: "c9_atoms_molecules", to: "c10_chemical_reactions" },
  { from: "c7_acids_bases", to: "c10_acids_bases" },
  { from: "c10_chemical_reactions", to: "c10_acids_bases" },
  { from: "c8_metals_nonmetals", to: "c10_metals_nonmetals" },
  { from: "c10_chemical_reactions", to: "c10_metals_nonmetals" },
  { from: "c9_atoms_molecules", to: "c10_carbon" },
  { from: "c10_metals_nonmetals", to: "c10_carbon" },
  { from: "c9_tissues", to: "c10_life_processes" },
  { from: "c7_nutrition_plants", to: "c10_life_processes" },
  { from: "c7_respiration", to: "c10_life_processes" },
  { from: "c10_life_processes", to: "c10_control_coord" },
  { from: "c9_tissues", to: "c10_control_coord" },
  { from: "c8_reproduction_animals", to: "c10_reproduction" },
  { from: "c8_cell_structure", to: "c10_reproduction" },
  { from: "c10_reproduction", to: "c10_heredity" },
  { from: "c9_diversity", to: "c10_heredity" },
  { from: "c8_light", to: "c10_light" },
  { from: "c9_gravitation", to: "c10_light" },
  { from: "c10_light", to: "c10_human_eye" },
  { from: "c8_chemical_effects", to: "c10_electricity" },
  { from: "c9_work_energy", to: "c10_electricity" },
  { from: "c10_electricity", to: "c10_magnetic_effects" },
  { from: "c8_natural_phenomena", to: "c10_magnetic_effects" },
  { from: "c8_coal_petroleum", to: "c10_energy_sources" },
  { from: "c9_work_energy", to: "c10_energy_sources" },
  { from: "c9_natural_resources", to: "c10_environment" },
  { from: "c8_conservation", to: "c10_environment" },
];

// RELATED_TO edges — bidirectional conceptual siblings
const related: RelatedEdge[] = [
  { a: "c7_nutrition_plants", b: "c7_respiration" },
  { a: "c7_nutrition_animals", b: "c7_respiration" },
  { a: "c7_nutrition_plants", b: "c7_transportation" },
  { a: "c7_reproduction_plants", b: "c8_reproduction_animals" },
  { a: "c8_sound", b: "c8_light" },
  { a: "c9_motion", b: "c9_force_laws" },
  { a: "c9_force_laws", b: "c9_gravitation" },
  { a: "c9_gravitation", b: "c9_work_energy" },
  { a: "c9_fundamental_unit", b: "c9_tissues" },
  { a: "c9_atoms_molecules", b: "c9_structure_atom" },
  { a: "c10_acids_bases", b: "c10_metals_nonmetals" },
  { a: "c10_acids_bases", b: "c10_carbon" },
  { a: "c10_life_processes", b: "c10_control_coord" },
  { a: "c10_reproduction", b: "c10_heredity" },
  { a: "c10_light", b: "c10_human_eye" },
  { a: "c10_electricity", b: "c10_magnetic_effects" },
  { a: "c10_energy_sources", b: "c10_environment" },
  { a: "c9_why_fall_ill", b: "c8_microorganisms" },
  { a: "c9_natural_resources", b: "c10_environment" },
  { a: "c9_sound", b: "c8_sound" },
];

// ============================================================
// SEED FUNCTION
// ============================================================

const seed = async () => {
  const session = driver.session();

  try {
    console.log("🌱 Starting Neo4j domain graph seed...");

    // Step 1 — Clear existing data
    console.log("🗑️  Clearing existing graph...");
    await session.run("MATCH (n) DETACH DELETE n");

    // Step 2 — Create constraints (unique topic ids)
    console.log("🔒 Creating constraints...");
    await session.run(`
      CREATE CONSTRAINT topic_id_unique IF NOT EXISTS
      FOR (t:Topic) REQUIRE t.id IS UNIQUE
    `);

    // Step 3 — Create all Topic nodes
    console.log(`📚 Creating ${topics.length} topic nodes...`);
    for (const topic of topics) {
      await session.run(
        `MERGE (t:Topic {id: $id})
         SET t.name = $name,
             t.subject = $subject,
             t.classLevel = $classLevel`,
        topic,
      );
    }

    // Step 4 — Create REQUIRES edges
    console.log(`🔗 Creating ${prerequisites.length} prerequisite edges...`);
    for (const edge of prerequisites) {
      await session.run(
        `MATCH (a:Topic {id: $from}), (b:Topic {id: $to})
         MERGE (a)-[:REQUIRES]->(b)`,
        edge,
      );
    }

    // Step 5 — Create RELATED_TO edges (bidirectional)
    console.log(`🔗 Creating ${related.length} related edges...`);
    for (const edge of related) {
      await session.run(
        `MATCH (a:Topic {id: $a}), (b:Topic {id: $b})
         MERGE (a)-[:RELATED_TO]->(b)
         MERGE (b)-[:RELATED_TO]->(a)`,
        edge,
      );
    }

    // Step 6 — Verify
    const topicCount = await session.run(
      "MATCH (t:Topic) RETURN count(t) as count",
    );
    const reqCount = await session.run(
      "MATCH ()-[r:REQUIRES]->() RETURN count(r) as count",
    );
    const relCount = await session.run(
      "MATCH ()-[r:RELATED_TO]->() RETURN count(r) as count",
    );

    console.log("\n✅ Seed complete!");
    console.log(`   Topics:        ${topicCount.records[0].get("count")}`);
    console.log(`   Prerequisites: ${reqCount.records[0].get("count")}`);
    console.log(`   Related:       ${relCount.records[0].get("count")}`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await session.close();
    await driver.close();
  }
};

seed();
