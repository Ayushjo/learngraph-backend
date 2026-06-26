import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import dotenv from "dotenv";
dotenv.config();

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const MISCONCEPTIONS = [
  {
    conceptTag: "mole_concept",
    belief: "One mole always equals 22.4 L regardless of temperature and pressure.",
    why: "22.4 L applies only to ideal gases at STP (273 K, 1 atm); liquids and solids have very different molar volumes.",
  },
  {
    conceptTag: "mole_concept",
    belief: "Mole is a unit of mass like gram.",
    why: "Mole counts particles (6.022×10²³); mass of one mole is molar mass in grams.",
  },
  {
    conceptTag: "stoichiometry",
    belief: "The limiting reagent is the substance with the smallest mass.",
    why: "Limiting reagent is determined by mole ratio from balanced equation, not by mass alone.",
  },
  {
    conceptTag: "stoichiometry",
    belief: "Coefficients in a balanced equation give mass ratios directly.",
    why: "Coefficients give mole ratios; mass ratios require multiplying by molar masses.",
  },
  {
    conceptTag: "limiting_reagent",
    belief: "The excess reagent is completely unused in the reaction.",
    why: "Excess reagent remains after reaction, but the limiting reagent is fully consumed first.",
  },
  {
    conceptTag: "dalton_theory",
    belief: "Atoms of the same element can have different atomic masses in a compound.",
    why: "Dalton's theory states atoms of the same element are identical in mass; isotopes were discovered later.",
  },
  {
    conceptTag: "conservation_mass",
    belief: "Mass is lost in a chemical reaction when a gas escapes.",
    why: "Mass is conserved in a closed system; apparent loss occurs only when products leave the system unmeasured.",
  },
  {
    conceptTag: "molar_mass",
    belief: "Molar mass and molecular mass are always numerically equal.",
    why: "They are equal in value but molar mass has units g/mol while molecular mass is dimensionless (amu).",
  },
  {
    conceptTag: "empirical_formula",
    belief: "Empirical formula is always the same as molecular formula.",
    why: "Molecular formula is a whole-number multiple of empirical formula (e.g. CH vs C₂H₂).",
  },
  {
    conceptTag: "lattice_energy",
    belief: "Lattice energy is always positive because energy is released on bond formation.",
    why: "Lattice energy is defined as energy required to separate one mole of ionic solid into gaseous ions — it is positive by convention.",
  },
  {
    conceptTag: "enthalpy",
    belief: "Enthalpy change equals heat at all temperatures and pressures.",
    why: "ΔH = q_p only at constant pressure; at constant volume the relevant quantity is ΔU.",
  },
  {
    conceptTag: "avogadro_number",
    belief: "Avogadro's number is the number of grams in one mole.",
    why: "Avogadro's number is the particle count per mole (6.022×10²³), not a mass value.",
  },
];

const seed = async () => {
  console.log("🌱 Seeding misconceptions...");

  let count = 0;
  for (const row of MISCONCEPTIONS) {
    const existing = await prisma.misconception.findFirst({
      where: { conceptTag: row.conceptTag, belief: row.belief },
    });
    if (existing) {
      await prisma.misconception.update({
        where: { id: existing.id },
        data: { why: row.why },
      });
    } else {
      await prisma.misconception.create({ data: row });
    }
    count++;
  }

  console.log(`✅ Seeded ${count} misconceptions`);
  await prisma.$disconnect();
};

seed();
