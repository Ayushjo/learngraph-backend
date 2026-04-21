import neo4j from "neo4j-driver";
import dotenv from "dotenv";
import { TOPICS } from "../data/subtopics";
dotenv.config();

const driver = neo4j.driver(
  process.env.NEO4J_URI!,
  neo4j.auth.basic(process.env.NEO4J_USERNAME!, process.env.NEO4J_PASSWORD!),
);

interface Edge {
  from: string;
  to: string;
}

const prerequisites: Edge[] = [
  { from: "c11_structure_atom", to: "c11_basic_concepts" },
  { from: "c11_periodic_table", to: "c11_basic_concepts" },
  { from: "c11_periodic_table", to: "c11_structure_atom" },
  { from: "c11_chemical_bonding", to: "c11_structure_atom" },
  { from: "c11_chemical_bonding", to: "c11_periodic_table" },
  { from: "c11_states_matter", to: "c11_chemical_bonding" },
  { from: "c11_thermodynamics", to: "c11_basic_concepts" },
  { from: "c11_thermodynamics", to: "c11_chemical_bonding" },
  { from: "c11_equilibrium", to: "c11_thermodynamics" },
  { from: "c11_redox", to: "c11_basic_concepts" },
  { from: "c11_redox", to: "c11_structure_atom" },
  { from: "c11_organic_basic", to: "c11_redox" },
  { from: "c11_organic_basic", to: "c11_chemical_bonding" },
  { from: "c11_hydrocarbons", to: "c11_organic_basic" },
  { from: "c12_electrochemistry", to: "c11_redox" },
  { from: "c12_electrochemistry", to: "c11_thermodynamics" },
  { from: "c12_electrochemistry", to: "c11_equilibrium" },
  { from: "c12_solid_state", to: "c11_chemical_bonding" },
  { from: "c12_solid_state", to: "c11_states_matter" },
  { from: "c12_solutions", to: "c11_equilibrium" },
  { from: "c12_solutions", to: "c11_states_matter" },
  { from: "c12_solutions", to: "c11_basic_concepts" },
  { from: "c12_chemical_kinetics", to: "c11_equilibrium" },
  { from: "c12_chemical_kinetics", to: "c11_thermodynamics" },
  { from: "c12_surface_chemistry", to: "c11_chemical_bonding" },
  { from: "c12_surface_chemistry", to: "c12_chemical_kinetics" },
  { from: "c12_p_block", to: "c11_periodic_table" },
  { from: "c12_p_block", to: "c11_chemical_bonding" },
  { from: "c12_d_f_block", to: "c11_periodic_table" },
  { from: "c12_d_f_block", to: "c11_chemical_bonding" },
  { from: "c12_coordination", to: "c12_d_f_block" },
  { from: "c12_coordination", to: "c11_chemical_bonding" },
  { from: "c12_haloalkanes", to: "c11_organic_basic" },
  { from: "c12_haloalkanes", to: "c11_hydrocarbons" },
  { from: "c12_alcohols_phenols", to: "c12_haloalkanes" },
  { from: "c12_carbonyl", to: "c12_alcohols_phenols" },
  { from: "c12_amines", to: "c12_carbonyl" },
  { from: "c12_biomolecules", to: "c12_amines" },
  { from: "c12_polymers", to: "c11_organic_basic" },
  { from: "c12_polymers", to: "c12_carbonyl" },
  { from: "c12_polymers", to: "c12_amines" },
  { from: "c12_chemistry_everyday", to: "c12_biomolecules" },
  { from: "c12_chemistry_everyday", to: "c12_polymers" },
  { from: "c12_solutions", to: "c12_solid_state" },
  { from: "c12_electrochemistry", to: "c12_solutions" },
  { from: "c12_chemical_kinetics", to: "c12_electrochemistry" },
];

const related: Edge[] = [
  { from: "c11_thermodynamics", to: "c11_equilibrium" },
  { from: "c11_redox", to: "c12_electrochemistry" },
  { from: "c11_organic_basic", to: "c11_hydrocarbons" },
  { from: "c12_solid_state", to: "c12_solutions" },
  { from: "c12_electrochemistry", to: "c12_chemical_kinetics" },
  { from: "c12_d_f_block", to: "c12_coordination" },
  { from: "c12_haloalkanes", to: "c12_alcohols_phenols" },
  { from: "c12_alcohols_phenols", to: "c12_carbonyl" },
  { from: "c12_carbonyl", to: "c12_amines" },
  { from: "c12_amines", to: "c12_biomolecules" },
  { from: "c12_biomolecules", to: "c12_polymers" },
];

const seed = async () => {
  const session = driver.session();

  try {
    console.log("🌱 Starting Neo4j seed...");

    console.log("🗑️  Clearing existing graph...");
    await session.run("MATCH (n) DETACH DELETE n");

    console.log("🔒 Creating constraints...");
    await session.run(`
      CREATE CONSTRAINT topic_id IF NOT EXISTS
      FOR (t:Topic) REQUIRE t.id IS UNIQUE
    `);
    await session.run(`
      CREATE CONSTRAINT subtopic_id IF NOT EXISTS
      FOR (s:Subtopic) REQUIRE s.id IS UNIQUE
    `);

    console.log(`📚 Creating ${TOPICS.length} topic nodes...`);
    for (const topic of TOPICS) {
      await session.run(
        `MERGE (t:Topic {id: $id})
         SET t.name       = $name,
             t.subject    = $subject,
             t.classLevel = $classLevel`,
        {
          id: topic.id,
          name: topic.name,
          subject: topic.subject,
          classLevel: topic.classLevel,
        },
      );
    }

    const allSubtopics = TOPICS.flatMap((t) => t.subtopics);
    console.log(`📖 Creating ${allSubtopics.length} subtopic nodes...`);
    for (const sub of allSubtopics) {
      await session.run(
        `MERGE (s:Subtopic {id: $id})
         SET s.name               = $name,
             s.topicId            = $topicId,
             s.order              = $order,
             s.keyConceptsSummary = $keyConceptsSummary,
             s.classLevel         = $classLevel,
             s.subject            = $subject`,
        {
          id: sub.id,
          name: sub.name,
          topicId: sub.topicId,
          order: sub.order,
          keyConceptsSummary: sub.keyConceptsSummary,
          classLevel: sub.classLevel,
          subject: sub.subject,
        },
      );

      await session.run(
        `MATCH (t:Topic {id: $topicId}), (s:Subtopic {id: $subtopicId})
         MERGE (t)-[:HAS_SUBTOPIC {order: $order}]->(s)`,
        { topicId: sub.topicId, subtopicId: sub.id, order: sub.order },
      );
    }

    console.log("🔗 Creating NEXT_SUBTOPIC edges...");
    for (const topic of TOPICS) {
      const subs = topic.subtopics.sort((a, b) => a.order - b.order);
      for (let i = 0; i < subs.length - 1; i++) {
        await session.run(
          `MATCH (a:Subtopic {id: $fromId}), (b:Subtopic {id: $toId})
           MERGE (a)-[:NEXT_SUBTOPIC]->(b)`,
          { fromId: subs[i].id, toId: subs[i + 1].id },
        );
      }
    }

    console.log(`🔗 Creating ${prerequisites.length} prerequisite edges...`);
    for (const edge of prerequisites) {
      await session.run(
        `MATCH (a:Topic {id: $from}), (b:Topic {id: $to})
         MERGE (a)-[:REQUIRES]->(b)`,
        edge,
      );
    }

    console.log(`🔗 Creating ${related.length} related edges...`);
    for (const edge of related) {
      await session.run(
        `MATCH (a:Topic {id: $from}), (b:Topic {id: $to})
         MERGE (a)-[:RELATED_TO]->(b)
         MERGE (b)-[:RELATED_TO]->(a)`,
        edge,
      );
    }

    const topicCount = await session.run("MATCH (t:Topic) RETURN count(t) AS c");
    const subCount = await session.run("MATCH (s:Subtopic) RETURN count(s) AS c");
    const reqCount = await session.run("MATCH ()-[r:REQUIRES]->() RETURN count(r) AS c");
    const nextCount = await session.run("MATCH ()-[r:NEXT_SUBTOPIC]->() RETURN count(r) AS c");

    console.log("\n✅ Seed complete!");
    console.log(`   Topics (chapters):  ${topicCount.records[0].get("c")}`);
    console.log(`   Subtopics:          ${subCount.records[0].get("c")}`);
    console.log(`   Prerequisites:      ${reqCount.records[0].get("c")}`);
    console.log(`   Next subtopic:      ${nextCount.records[0].get("c")}`);
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    await session.close();
    await driver.close();
  }
};

seed();
