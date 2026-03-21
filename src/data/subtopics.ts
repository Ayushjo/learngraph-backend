export interface SubtopicDefinition {
  id: string;
  topicId: string; // parent chapter Neo4j id
  name: string;
  order: number; // 1-based, determines progression order
  keyConceptsSummary: string; // what Claude should focus on
  classLevel: number;
  subject: string;
}

export interface TopicDefinition {
  id: string;
  name: string;
  classLevel: number;
  subject: string;
  subtopics: SubtopicDefinition[];
}

export const TOPICS: TopicDefinition[] = [
  // ══════════════════════════════════════════════════════════════
  // CLASS 11 CHEMISTRY
  // ══════════════════════════════════════════════════════════════

  {
    id: "c11_basic_concepts",
    name: "Some Basic Concepts of Chemistry",
    classLevel: 11,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c11_basic_concepts_s1",
        topicId: "c11_basic_concepts",
        name: "Importance of Chemistry and Matter Classification",
        order: 1,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "importance of chemistry in daily life, matter classification into elements compounds and mixtures, physical and chemical properties, measurement and SI units",
      },
      {
        id: "c11_basic_concepts_s2",
        topicId: "c11_basic_concepts",
        name: "Laws of Chemical Combination and Dalton's Atomic Theory",
        order: 2,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "law of conservation of mass, law of definite proportions, law of multiple proportions, Gay-Lussac's law, Avogadro's law, Dalton's atomic theory and its postulates",
      },
      {
        id: "c11_basic_concepts_s3",
        topicId: "c11_basic_concepts",
        name: "Atomic and Molecular Masses and Mole Concept",
        order: 3,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "atomic mass unit, average atomic mass, molecular mass, formula mass, mole concept, Avogadro number, molar mass, relationship between mole number mass and volume",
      },
      {
        id: "c11_basic_concepts_s4",
        topicId: "c11_basic_concepts",
        name: "Percentage Composition and Empirical Formula",
        order: 4,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "percentage composition from molecular formula, empirical formula from percentage composition, molecular formula from empirical formula, determining formula of unknown compound",
      },
      {
        id: "c11_basic_concepts_s5",
        topicId: "c11_basic_concepts",
        name: "Stoichiometry and Limiting Reagent",
        order: 5,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "stoichiometric calculations, mole-mass-volume relationships in reactions, limiting reagent concept, theoretical yield actual yield percentage yield",
      },
    ],
  },

  {
    id: "c11_structure_atom",
    name: "Structure of Atom",
    classLevel: 11,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c11_structure_atom_s1",
        topicId: "c11_structure_atom",
        name: "Subatomic Particles and Early Atomic Models",
        order: 1,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "discovery of electron proton neutron, cathode ray experiment, Thomson plum pudding model, Rutherford gold foil experiment, nuclear model of atom, atomic number mass number",
      },
      {
        id: "c11_structure_atom_s2",
        topicId: "c11_structure_atom",
        name: "Bohr's Model and Hydrogen Spectrum",
        order: 2,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "Bohr's postulates, energy levels in hydrogen atom, hydrogen emission spectrum, Lyman Balmer Paschen series, limitations of Bohr's model",
      },
      {
        id: "c11_structure_atom_s3",
        topicId: "c11_structure_atom",
        name: "Dual Nature of Matter and de Broglie Equation",
        order: 3,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "wave-particle duality, photoelectric effect, de Broglie wavelength equation, evidence for wave nature of electrons, significance for atomic structure",
      },
      {
        id: "c11_structure_atom_s4",
        topicId: "c11_structure_atom",
        name: "Heisenberg Uncertainty Principle and Quantum Mechanics",
        order: 4,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "Heisenberg uncertainty principle statement and significance, quantum mechanical model vs Bohr model, concept of orbital vs orbit, probability density and radial distribution",
      },
      {
        id: "c11_structure_atom_s5",
        topicId: "c11_structure_atom",
        name: "Quantum Numbers and Shapes of Orbitals",
        order: 5,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "principal quantum number n, azimuthal quantum number l, magnetic quantum number ml, spin quantum number ms, shapes of s p d orbitals, nodes and nodal planes",
      },
      {
        id: "c11_structure_atom_s6",
        topicId: "c11_structure_atom",
        name: "Electronic Configuration and Filling Rules",
        order: 6,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "Aufbau principle, Pauli exclusion principle, Hund's rule of maximum multiplicity, (n+l) rule, electronic configuration of elements, exceptional configurations of Cr and Cu",
      },
    ],
  },

  {
    id: "c11_periodic_table",
    name: "Classification of Elements and Periodicity",
    classLevel: 11,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c11_periodic_table_s1",
        topicId: "c11_periodic_table",
        name: "Genesis of Periodic Table and Modern Periodic Law",
        order: 1,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "Dobereiner triads, Newlands law of octaves, Mendeleev periodic table and its merits defects, Moseley and modern periodic law, structure of modern periodic table periods and groups",
      },
      {
        id: "c11_periodic_table_s2",
        topicId: "c11_periodic_table",
        name: "Electronic Configuration and Types of Elements",
        order: 2,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "s-block p-block d-block f-block elements, representative elements transition elements inner transition elements, relationship between electronic configuration and position in periodic table",
      },
      {
        id: "c11_periodic_table_s3",
        topicId: "c11_periodic_table",
        name: "Periodic Trends in Atomic and Ionic Radius",
        order: 3,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "atomic radius definition covalent ionic van der Waals, trends across period and down group, ionic radius vs atomic radius, isoelectronic species",
      },
      {
        id: "c11_periodic_table_s4",
        topicId: "c11_periodic_table",
        name: "Ionisation Enthalpy and Electron Gain Enthalpy",
        order: 4,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "ionisation enthalpy definition factors affecting, successive ionisation enthalpies, trends across period and group, electron gain enthalpy definition trends, exceptions in trends",
      },
      {
        id: "c11_periodic_table_s5",
        topicId: "c11_periodic_table",
        name: "Electronegativity and Periodic Trends Summary",
        order: 5,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "electronegativity Pauling scale definition trends, valence and oxidation states, chemical reactivity trends, diagonal relationships, anomalous properties of second period elements",
      },
    ],
  },

  {
    id: "c11_chemical_bonding",
    name: "Chemical Bonding and Molecular Structure",
    classLevel: 11,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c11_chemical_bonding_s1",
        topicId: "c11_chemical_bonding",
        name: "Ionic Bond and Lattice Energy",
        order: 1,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "Kossel-Lewis approach, octet rule, electrovalent bond formation, lattice energy Born-Haber cycle, factors affecting ionic bond formation, properties of ionic compounds",
      },
      {
        id: "c11_chemical_bonding_s2",
        topicId: "c11_chemical_bonding",
        name: "Covalent Bond and Lewis Structures",
        order: 2,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "covalent bond formation, Lewis dot structures, formal charge calculation, resonance structures, exceptions to octet rule — expanded octets incomplete octets odd electron molecules",
      },
      {
        id: "c11_chemical_bonding_s3",
        topicId: "c11_chemical_bonding",
        name: "VSEPR Theory and Molecular Geometry",
        order: 3,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "VSEPR theory postulates, electron pair geometry vs molecular geometry, linear trigonal planar tetrahedral trigonal bipyramidal octahedral, effect of lone pairs on geometry, predicting shapes of molecules",
      },
      {
        id: "c11_chemical_bonding_s4",
        topicId: "c11_chemical_bonding",
        name: "Polarity and Dipole Moment",
        order: 4,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "bond polarity electronegativity difference, dipole moment definition and measurement, polar vs nonpolar molecules, resultant dipole moment of polyatomic molecules, applications of dipole moment",
      },
      {
        id: "c11_chemical_bonding_s5",
        topicId: "c11_chemical_bonding",
        name: "Valence Bond Theory and Hybridisation",
        order: 5,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "valence bond theory orbital overlap, sigma and pi bonds, sp sp2 sp3 hybridisation, sp3d sp3d2 hybridisation, hybridisation and molecular geometry, bond length bond angle bond energy",
      },
      {
        id: "c11_chemical_bonding_s6",
        topicId: "c11_chemical_bonding",
        name: "Molecular Orbital Theory",
        order: 6,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "MO theory vs VBT, bonding and antibonding MOs, energy level diagram for homonuclear diatomics, bond order calculation, magnetic properties from MO configuration, MO diagrams of O2 N2 F2",
      },
      {
        id: "c11_chemical_bonding_s7",
        topicId: "c11_chemical_bonding",
        name: "Hydrogen Bonding and Metallic Bonding",
        order: 7,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "intermolecular vs intramolecular hydrogen bonding, conditions for hydrogen bonding, effects on physical properties boiling point viscosity, metallic bonding electron sea model",
      },
    ],
  },

  {
    id: "c11_states_matter",
    name: "States of Matter",
    classLevel: 11,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c11_states_matter_s1",
        topicId: "c11_states_matter",
        name: "Intermolecular Forces",
        order: 1,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "dispersion forces London forces, dipole-dipole interactions, dipole-induced dipole, hydrogen bonding as intermolecular force, thermal energy vs intermolecular forces, effect on physical state",
      },
      {
        id: "c11_states_matter_s2",
        topicId: "c11_states_matter",
        name: "Gas Laws",
        order: 2,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "Boyle's law pressure-volume relationship, Charles' law temperature-volume relationship, Gay-Lussac's law pressure-temperature, Avogadro's law volume-moles, combined gas law",
      },
      {
        id: "c11_states_matter_s3",
        topicId: "c11_states_matter",
        name: "Ideal Gas Equation and Kinetic Theory",
        order: 3,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "ideal gas equation PV=nRT, universal gas constant, kinetic molecular theory postulates, root mean square velocity average velocity most probable velocity, Maxwell-Boltzmann distribution",
      },
      {
        id: "c11_states_matter_s4",
        topicId: "c11_states_matter",
        name: "Real Gases and van der Waals Equation",
        order: 4,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "deviation of real gases from ideal behaviour, compressibility factor Z, van der Waals equation corrections a and b, liquefaction of gases, critical temperature pressure volume",
      },
      {
        id: "c11_states_matter_s5",
        topicId: "c11_states_matter",
        name: "Liquid State Properties",
        order: 5,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "vapour pressure and boiling point, surface tension definition measurement applications, viscosity definition measurement applications, effect of temperature on liquid properties",
      },
    ],
  },

  {
    id: "c11_thermodynamics",
    name: "Thermodynamics",
    classLevel: 11,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c11_thermodynamics_s1",
        topicId: "c11_thermodynamics",
        name: "Basic Concepts and First Law",
        order: 1,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "system surroundings boundary, open closed isolated systems, state functions path functions, internal energy, work heat sign conventions, first law of thermodynamics, isothermal adiabatic processes",
      },
      {
        id: "c11_thermodynamics_s2",
        topicId: "c11_thermodynamics",
        name: "Enthalpy and Heat Capacity",
        order: 2,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "enthalpy definition H=U+PV, enthalpy change at constant pressure, heat capacity Cp and Cv, relationship Cp-Cv=R, measurement of enthalpy change, calorimetry",
      },
      {
        id: "c11_thermodynamics_s3",
        topicId: "c11_thermodynamics",
        name: "Hess's Law and Standard Enthalpies",
        order: 3,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "Hess's law of constant heat summation, standard enthalpy of formation combustion neutralisation, bond enthalpies, enthalpy of atomisation sublimation, Born-Haber cycle applications",
      },
      {
        id: "c11_thermodynamics_s4",
        topicId: "c11_thermodynamics",
        name: "Entropy and Second Law",
        order: 4,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "spontaneous processes, entropy definition disorder randomness, second law of thermodynamics, entropy changes in physical and chemical processes, standard entropy, third law of thermodynamics",
      },
      {
        id: "c11_thermodynamics_s5",
        topicId: "c11_thermodynamics",
        name: "Gibbs Energy and Spontaneity",
        order: 5,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "Gibbs energy G=H-TS, criterion for spontaneity delta G negative, Gibbs energy and equilibrium, standard Gibbs energy of formation, relationship between delta G and Keq",
      },
    ],
  },

  {
    id: "c11_equilibrium",
    name: "Equilibrium",
    classLevel: 11,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c11_equilibrium_s1",
        topicId: "c11_equilibrium",
        name: "Dynamic Equilibrium and Law of Mass Action",
        order: 1,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "physical and chemical equilibrium, dynamic nature of equilibrium, law of mass action, equilibrium constant expression Kc, characteristics of equilibrium state",
      },
      {
        id: "c11_equilibrium_s2",
        topicId: "c11_equilibrium",
        name: "Equilibrium Constants Kc and Kp",
        order: 2,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "Kc expression from balanced equation, Kp for gaseous reactions, relationship between Kc and Kp, reaction quotient Q vs K, predicting direction of reaction, homogeneous vs heterogeneous equilibrium",
      },
      {
        id: "c11_equilibrium_s3",
        topicId: "c11_equilibrium",
        name: "Le Chatelier's Principle",
        order: 3,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "Le Chatelier's principle statement, effect of concentration change, effect of pressure change, effect of temperature change, effect of catalyst, industrial applications Haber process Contact process",
      },
      {
        id: "c11_equilibrium_s4",
        topicId: "c11_equilibrium",
        name: "Ionic Equilibrium and Acid-Base Theories",
        order: 4,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "Arrhenius concept, Bronsted-Lowry proton transfer, conjugate acid-base pairs, Lewis acid-base concept, ionic product of water Kw, pH scale, strong vs weak electrolytes",
      },
      {
        id: "c11_equilibrium_s5",
        topicId: "c11_equilibrium",
        name: "Buffer Solutions and pH Calculations",
        order: 5,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "weak acid dissociation Ka, weak base dissociation Kb, relationship Ka×Kb=Kw, Henderson-Hasselbalch equation, buffer solutions preparation and action, buffer capacity",
      },
      {
        id: "c11_equilibrium_s6",
        topicId: "c11_equilibrium",
        name: "Solubility Product and Common Ion Effect",
        order: 6,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "solubility product Ksp expression, relationship between solubility and Ksp, condition for precipitation, common ion effect on solubility, applications in qualitative analysis",
      },
    ],
  },

  {
    id: "c11_redox",
    name: "Redox Reactions",
    classLevel: 11,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c11_redox_s1",
        topicId: "c11_redox",
        name: "Oxidation and Reduction Concepts",
        order: 1,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "classical concept gain loss of oxygen hydrogen, electronic concept loss gain of electrons, oxidising agent reducing agent, oxidation and reduction always simultaneous, examples from daily life",
      },
      {
        id: "c11_redox_s2",
        topicId: "c11_redox",
        name: "Oxidation Number",
        order: 2,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "oxidation number rules and assignment, oxidation number in ionic and covalent compounds, identifying oxidation and reduction from oxidation number change, disproportionation reactions",
      },
      {
        id: "c11_redox_s3",
        topicId: "c11_redox",
        name: "Balancing Redox Reactions",
        order: 3,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "half reaction method ion-electron method, balancing in acidic medium, balancing in basic medium, oxidation number change method, examples with KMnO4 K2Cr2O7",
      },
      {
        id: "c11_redox_s4",
        topicId: "c11_redox",
        name: "Redox Reactions and Electrode Processes",
        order: 4,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "redox reactions in electrochemical cells, electrode reactions oxidation at anode reduction at cathode, electrolysis applications, redox titrations, activity series and displacement reactions",
      },
    ],
  },

  {
    id: "c11_organic_basic",
    name: "Organic Chemistry: Basic Principles",
    classLevel: 11,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c11_organic_basic_s1",
        topicId: "c11_organic_basic",
        name: "Classification and Nomenclature of Organic Compounds",
        order: 1,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "acyclic cyclic aromatic classification, homologous series, functional groups, IUPAC nomenclature rules, naming alkanes alkenes alkynes, naming with functional groups substituents",
      },
      {
        id: "c11_organic_basic_s2",
        topicId: "c11_organic_basic",
        name: "Isomerism in Organic Compounds",
        order: 2,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "structural isomerism chain position functional group isomers, stereoisomerism geometrical cis-trans isomerism, optical isomerism chirality chiral centre, enantiomers and their properties",
      },
      {
        id: "c11_organic_basic_s3",
        topicId: "c11_organic_basic",
        name: "Electronic Displacement Effects",
        order: 3,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "inductive effect electron withdrawal donation, resonance mesomeric effect electron delocalization, hyperconjugation in alkyl groups, electromeric effect, application in predicting reactivity and acidity",
      },
      {
        id: "c11_organic_basic_s4",
        topicId: "c11_organic_basic",
        name: "Reactive Intermediates and Types of Reactions",
        order: 4,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "carbocations carbanions free radicals formation stability, homolytic heterolytic bond cleavage, nucleophiles and electrophiles, substitution addition elimination reactions, oxidation reduction in organic chemistry",
      },
    ],
  },

  {
    id: "c11_hydrocarbons",
    name: "Hydrocarbons",
    classLevel: 11,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c11_hydrocarbons_s1",
        topicId: "c11_hydrocarbons",
        name: "Alkanes: Properties and Reactions",
        order: 1,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "alkane structure sp3 hybridisation, conformations of ethane and butane, physical properties trends, halogenation free radical mechanism, combustion, cracking",
      },
      {
        id: "c11_hydrocarbons_s2",
        topicId: "c11_hydrocarbons",
        name: "Alkenes: Structure and Reactions",
        order: 2,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "alkene structure sp2 hybridisation pi bond, preparation from alcohol dehydration and dehydrohalogenation, electrophilic addition reactions, Markovnikov's rule, ozonolysis, polymerisation",
      },
      {
        id: "c11_hydrocarbons_s3",
        topicId: "c11_hydrocarbons",
        name: "Alkynes and Aromatic Hydrocarbons",
        order: 3,
        classLevel: 11,
        subject: "Chemistry",
        keyConceptsSummary:
          "alkyne structure sp hybridisation, acidic nature of terminal alkynes, addition reactions of alkynes, benzene structure resonance, aromatic stability Huckel rule, electrophilic aromatic substitution",
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // CLASS 12 CHEMISTRY
  // ══════════════════════════════════════════════════════════════

  {
    id: "c12_solid_state",
    name: "The Solid State",
    classLevel: 12,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c12_solid_state_s1",
        topicId: "c12_solid_state",
        name: "Types of Solids and Amorphous vs Crystalline",
        order: 1,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "amorphous and crystalline solids, ionic molecular covalent metallic solids, properties and examples of each type, anisotropy in crystals, glass as pseudo solid",
      },
      {
        id: "c12_solid_state_s2",
        topicId: "c12_solid_state",
        name: "Crystal Lattices and Unit Cells",
        order: 2,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "crystal lattice definition, unit cell types primitive body-centred face-centred, Bravais lattices, number of atoms per unit cell calculation, coordination number",
      },
      {
        id: "c12_solid_state_s3",
        topicId: "c12_solid_state",
        name: "Packing Efficiency and Density Calculations",
        order: 3,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "close packing in 2D and 3D, hcp and ccp arrangements, packing efficiency of simple cubic BCC FCC, tetrahedral and octahedral voids, density calculation from unit cell parameters",
      },
      {
        id: "c12_solid_state_s4",
        topicId: "c12_solid_state",
        name: "Imperfections in Solids",
        order: 4,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "point defects vacancy interstitial Frenkel Schottky, impurity defects, non-stoichiometric defects metal excess metal deficiency, effect of defects on properties, F-centres and colour",
      },
      {
        id: "c12_solid_state_s5",
        topicId: "c12_solid_state",
        name: "Electrical and Magnetic Properties",
        order: 5,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "conductors semiconductors insulators band theory, n-type p-type semiconductors doping, ferromagnetism paramagnetism diamagnetism ferrimagnetism antiferromagnetism, piezoelectric pyroelectric materials",
      },
    ],
  },

  {
    id: "c12_solutions",
    name: "Solutions",
    classLevel: 12,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c12_solutions_s1",
        topicId: "c12_solutions",
        name: "Types of Solutions and Concentration",
        order: 1,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "types of solutions solid liquid gaseous, concentration terms molarity molality mole fraction mass percentage, interconversion of concentration units, solubility and factors affecting it, Henry's law for gases",
      },
      {
        id: "c12_solutions_s2",
        topicId: "c12_solutions",
        name: "Vapour Pressure and Raoult's Law",
        order: 2,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "vapour pressure of pure solvent, Raoult's law for volatile and non-volatile solutes, ideal and non-ideal solutions, positive and negative deviations, azeotropes, miscibility",
      },
      {
        id: "c12_solutions_s3",
        topicId: "c12_solutions",
        name: "Colligative Properties: Boiling Point and Freezing Point",
        order: 3,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "colligative properties depend on number of particles, elevation of boiling point ebullioscopic constant, depression of freezing point cryoscopic constant, calculation of molar mass from colligative properties",
      },
      {
        id: "c12_solutions_s4",
        topicId: "c12_solutions",
        name: "Osmosis and Osmotic Pressure",
        order: 4,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "osmosis semipermeable membrane, osmotic pressure van't Hoff equation, isotonic hypertonic hypotonic solutions, reverse osmosis water purification, osmosis in biological systems",
      },
      {
        id: "c12_solutions_s5",
        topicId: "c12_solutions",
        name: "Abnormal Molar Mass and van't Hoff Factor",
        order: 5,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "van't Hoff factor i, association and dissociation of solutes, modified colligative property equations with i, calculating degree of dissociation association, abnormal molar masses examples",
      },
    ],
  },

  {
    id: "c12_electrochemistry",
    name: "Electrochemistry",
    classLevel: 12,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c12_electrochemistry_s1",
        topicId: "c12_electrochemistry",
        name: "Electrochemical Cells and EMF",
        order: 1,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "galvanic cell construction Daniel cell, electrode reactions anode cathode, cell notation, EMF of cell, standard electrode potential, standard hydrogen electrode, electrochemical series",
      },
      {
        id: "c12_electrochemistry_s2",
        topicId: "c12_electrochemistry",
        name: "Nernst Equation and Gibbs Energy",
        order: 2,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "Nernst equation derivation and application, effect of concentration on EMF, relationship between EMF and Gibbs energy, equilibrium constant from standard EMF, concentration cells",
      },
      {
        id: "c12_electrochemistry_s3",
        topicId: "c12_electrochemistry",
        name: "Conductance of Electrolytic Solutions",
        order: 3,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "resistance conductance resistivity conductivity, specific conductivity molar conductivity, variation with concentration, strong vs weak electrolytes, Debye-Huckel-Onsager equation",
      },
      {
        id: "c12_electrochemistry_s4",
        topicId: "c12_electrochemistry",
        name: "Kohlrausch Law and Electrolysis",
        order: 4,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "Kohlrausch law of independent migration of ions, calculation of molar conductivity at infinite dilution, degree of dissociation from conductance, Faraday's laws of electrolysis, electrolysis applications",
      },
      {
        id: "c12_electrochemistry_s5",
        topicId: "c12_electrochemistry",
        name: "Batteries, Fuel Cells and Corrosion",
        order: 5,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "primary batteries dry cell mercury cell, secondary batteries lead storage lithium ion, fuel cells H2-O2 fuel cell, corrosion as electrochemical process, factors affecting corrosion, prevention methods",
      },
    ],
  },

  {
    id: "c12_chemical_kinetics",
    name: "Chemical Kinetics",
    classLevel: 12,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c12_chemical_kinetics_s1",
        topicId: "c12_chemical_kinetics",
        name: "Rate of Reaction and Rate Law",
        order: 1,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "average and instantaneous rate, rate expression, rate constant, order of reaction from rate law, molecularity vs order, pseudo first order reactions, units of rate constant",
      },
      {
        id: "c12_chemical_kinetics_s2",
        topicId: "c12_chemical_kinetics",
        name: "Integrated Rate Equations",
        order: 2,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "zero order integrated rate equation, first order integrated rate equation, half life of zero and first order, graphical determination of order, radioactive decay as first order",
      },
      {
        id: "c12_chemical_kinetics_s3",
        topicId: "c12_chemical_kinetics",
        name: "Temperature Dependence and Activation Energy",
        order: 3,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "effect of temperature on rate, Arrhenius equation k=Ae^(-Ea/RT), activation energy definition, frequency factor, calculating Ea from rate constants at two temperatures, transition state theory",
      },
      {
        id: "c12_chemical_kinetics_s4",
        topicId: "c12_chemical_kinetics",
        name: "Collision Theory and Reaction Mechanisms",
        order: 4,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "collision theory effective collisions threshold energy orientation factor, elementary and complex reactions, reaction intermediates, rate determining step, mechanism consistent with rate law",
      },
    ],
  },

  {
    id: "c12_surface_chemistry",
    name: "Surface Chemistry",
    classLevel: 12,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c12_surface_chemistry_s1",
        topicId: "c12_surface_chemistry",
        name: "Adsorption",
        order: 1,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "adsorption vs absorption, physisorption chemisorption differences, factors affecting adsorption, Freundlich adsorption isotherm, Langmuir adsorption isotherm, adsorption applications",
      },
      {
        id: "c12_surface_chemistry_s2",
        topicId: "c12_surface_chemistry",
        name: "Catalysis",
        order: 2,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "homogeneous heterogeneous catalysis, mechanism of heterogeneous catalysis, promoters and catalytic poisons, enzyme catalysis characteristics lock and key mechanism, shape-selective zeolite catalysis",
      },
      {
        id: "c12_surface_chemistry_s3",
        topicId: "c12_surface_chemistry",
        name: "Colloids and Emulsions",
        order: 3,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "colloid classification lyophilic lyophobic, Tyndall effect Brownian motion, charge on colloids zeta potential, coagulation and Hardy-Schulze rule, emulsions types preparation, colloids in daily life",
      },
    ],
  },

  {
    id: "c12_p_block",
    name: "p-Block Elements",
    classLevel: 12,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c12_p_block_s1",
        topicId: "c12_p_block",
        name: "Group 15: Nitrogen Family",
        order: 1,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "Group 15 electronic configuration trends, nitrogen fixation ammonia preparation properties, oxides of nitrogen, phosphorus allotropes, phosphine, oxoacids of nitrogen and phosphorus",
      },
      {
        id: "c12_p_block_s2",
        topicId: "c12_p_block",
        name: "Group 16: Oxygen Family",
        order: 2,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "Group 16 trends, oxygen allotropes, ozone preparation properties uses ozone layer, sulphur allotropes, sulphur dioxide preparation properties, sulphuric acid manufacture Contact process",
      },
      {
        id: "c12_p_block_s3",
        topicId: "c12_p_block",
        name: "Group 17: Halogens and Group 18: Noble Gases",
        order: 3,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "halogen trends oxidising power, fluorine anomalous properties, chlorine preparation properties, hydrogen halides, interhalogen compounds, noble gas configuration stability uses, xenon fluorides",
      },
    ],
  },

  {
    id: "c12_d_f_block",
    name: "d and f Block Elements",
    classLevel: 12,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c12_d_f_block_s1",
        topicId: "c12_d_f_block",
        name: "Transition Metals: Properties and Trends",
        order: 1,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "electronic configuration of d-block, variable oxidation states, metallic character density hardness, catalytic properties, coloured compounds formation, magnetic properties paramagnetism, complex formation",
      },
      {
        id: "c12_d_f_block_s2",
        topicId: "c12_d_f_block",
        name: "Important Compounds of Transition Metals",
        order: 2,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "potassium dichromate preparation properties oxidising uses, potassium permanganate preparation properties oxidising uses in acidic neutral alkaline medium, oxometal anions",
      },
      {
        id: "c12_d_f_block_s3",
        topicId: "c12_d_f_block",
        name: "Lanthanoids and Actinoids",
        order: 3,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "lanthanoid electronic configuration, lanthanoid contraction cause effect consequences, oxidation states of lanthanoids, actinoid electronic configuration, comparison of lanthanoids and actinoids, radioactivity",
      },
    ],
  },

  {
    id: "c12_coordination",
    name: "Coordination Compounds",
    classLevel: 12,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c12_coordination_s1",
        topicId: "c12_coordination",
        name: "Werner's Theory and Terminology",
        order: 1,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "Werner's theory primary secondary valence, coordination sphere, central atom ligands, types of ligands monodentate bidentate polydentate ambidentate, coordination number, chelates",
      },
      {
        id: "c12_coordination_s2",
        topicId: "c12_coordination",
        name: "Nomenclature and Isomerism",
        order: 2,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "IUPAC nomenclature of coordination compounds rules, structural isomerism ionisation linkage coordination, stereoisomerism geometrical cis-trans, optical isomerism in coordination compounds",
      },
      {
        id: "c12_coordination_s3",
        topicId: "c12_coordination",
        name: "Bonding: VBT and Crystal Field Theory",
        order: 3,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "valence bond theory hybridisation inner outer orbital complexes, limitations of VBT, crystal field theory d-orbital splitting octahedral tetrahedral, CFSE high spin low spin, spectrochemical series, colour of complexes",
      },
      {
        id: "c12_coordination_s4",
        topicId: "c12_coordination",
        name: "Stability and Importance of Coordination Compounds",
        order: 4,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "stability constant of complexes, factors affecting stability chelate effect, importance in biological systems haemoglobin chlorophyll vitamin B12, metallurgy, analytical chemistry, medicines cisplatin EDTA",
      },
    ],
  },

  {
    id: "c12_haloalkanes",
    name: "Haloalkanes and Haloarenes",
    classLevel: 12,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c12_haloalkanes_s1",
        topicId: "c12_haloalkanes",
        name: "Classification, Nomenclature and Preparation",
        order: 1,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "classification mono di poly haloalkanes, IUPAC naming, nature of C-X bond polarity, preparation from alkanes alkenes alcohols, Hunsdiecker reaction, halogen exchange Finkelstein Swarts",
      },
      {
        id: "c12_haloalkanes_s2",
        topicId: "c12_haloalkanes",
        name: "Nucleophilic Substitution: SN1 and SN2",
        order: 2,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "SN2 mechanism bimolecular backside attack inversion Walden, SN1 mechanism unimolecular carbocation intermediate racemisation, factors affecting SN1 vs SN2, stereochemical outcomes",
      },
      {
        id: "c12_haloalkanes_s3",
        topicId: "c12_haloalkanes",
        name: "Elimination Reactions and Haloarenes",
        order: 3,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "elimination vs substitution competition, E1 E2 mechanisms Saytzeff rule, haloarenes preparation properties, lower reactivity of aryl halides, nucleophilic aromatic substitution, uses and environmental impact DDT freons",
      },
    ],
  },

  {
    id: "c12_alcohols_phenols",
    name: "Alcohols, Phenols and Ethers",
    classLevel: 12,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c12_alcohols_phenols_s1",
        topicId: "c12_alcohols_phenols",
        name: "Alcohols: Preparation and Properties",
        order: 1,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "classification primary secondary tertiary, preparation from alkenes hydration, from carbonyl compounds, from Grignard reagent, physical properties hydrogen bonding, acidic nature of alcohols",
      },
      {
        id: "c12_alcohols_phenols_s2",
        topicId: "c12_alcohols_phenols",
        name: "Chemical Reactions of Alcohols and Phenols",
        order: 2,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "reactions with Na HX POCl3, dehydration to alkenes, oxidation of primary secondary tertiary alcohols, phenol preparation from cumene, acidic nature of phenol vs alcohol, electrophilic substitution of phenol",
      },
      {
        id: "c12_alcohols_phenols_s3",
        topicId: "c12_alcohols_phenols",
        name: "Ethers: Preparation and Properties",
        order: 3,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "nomenclature of ethers, preparation Williamson synthesis dehydration, physical properties, cleavage by HI, reactions of ethers, uses of diethyl ether and other ethers",
      },
    ],
  },

  {
    id: "c12_carbonyl",
    name: "Aldehydes, Ketones and Carboxylic Acids",
    classLevel: 12,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c12_carbonyl_s1",
        topicId: "c12_carbonyl",
        name: "Aldehydes and Ketones: Preparation",
        order: 1,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "nomenclature structure carbonyl group, preparation of aldehydes from alcohols acyl chlorides nitriles, preparation of ketones from alcohols acyl chlorides, Rosenmund Stephens reactions, ozonolysis",
      },
      {
        id: "c12_carbonyl_s2",
        topicId: "c12_carbonyl",
        name: "Reactions of Aldehydes and Ketones",
        order: 2,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "nucleophilic addition mechanism, addition of HCN ROH NH2OH, Grignard addition, aldol condensation, Cannizzaro reaction, oxidation of aldehydes Tollens Benedict Fehling, reduction to alcohols",
      },
      {
        id: "c12_carbonyl_s3",
        topicId: "c12_carbonyl",
        name: "Carboxylic Acids: Properties and Reactions",
        order: 3,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "preparation of carboxylic acids, physical properties acidity hydrogen bonding, reactions with base alcohol PCl5, Hell-Volhard-Zelinsky reaction, decarboxylation, relative acidity of substituted acids",
      },
    ],
  },

  {
    id: "c12_amines",
    name: "Amines",
    classLevel: 12,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c12_amines_s1",
        topicId: "c12_amines",
        name: "Structure, Classification and Preparation",
        order: 1,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "classification primary secondary tertiary amines, IUPAC and common names, structure lone pair on nitrogen, preparation from nitro compounds nitriles amides, Gabriel synthesis Hofmann bromamide",
      },
      {
        id: "c12_amines_s2",
        topicId: "c12_amines",
        name: "Properties and Diazonium Salts",
        order: 2,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "basic nature of amines comparison, effect of substituents on basicity, reactions with acids alkyl halides acyl chlorides, distinction between primary secondary tertiary, diazonium salt preparation reactions importance in synthesis",
      },
    ],
  },

  {
    id: "c12_biomolecules",
    name: "Biomolecules",
    classLevel: 12,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c12_biomolecules_s1",
        topicId: "c12_biomolecules",
        name: "Carbohydrates",
        order: 1,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "classification mono di polysaccharides, glucose structure open chain Haworth, anomers mutarotation, fructose sucrose lactose maltose, starch cellulose glycogen structure and functions",
      },
      {
        id: "c12_biomolecules_s2",
        topicId: "c12_biomolecules",
        name: "Proteins and Enzymes",
        order: 2,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "amino acids structure classification zwitterion, peptide bond formation, primary secondary tertiary quaternary protein structure, denaturation, enzymes as biological catalysts specificity, coenzymes vitamins",
      },
      {
        id: "c12_biomolecules_s3",
        topicId: "c12_biomolecules",
        name: "Nucleic Acids and Hormones",
        order: 3,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "nucleotide structure purine pyrimidine bases, DNA double helix Watson-Crick model, RNA types mRNA tRNA rRNA, DNA replication transcription translation, hormones classification steroid peptide amino acid derived",
      },
    ],
  },

  {
    id: "c12_polymers",
    name: "Polymers",
    classLevel: 12,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c12_polymers_s1",
        topicId: "c12_polymers",
        name: "Classification and Addition Polymerisation",
        order: 1,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "natural synthetic polymers, classification by structure source mode of polymerisation, addition polymerisation free radical mechanism, polyethylene PVC polystyrene teflon, chain growth polymers",
      },
      {
        id: "c12_polymers_s2",
        topicId: "c12_polymers",
        name: "Condensation Polymerisation and Important Polymers",
        order: 2,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "condensation polymerisation step growth, nylon-6 nylon-66 polyester Dacron, Bakelite melamine formaldehyde, rubber natural and vulcanisation, synthetic rubber neoprene Buna-N, biodegradable polymers PHBV",
      },
    ],
  },

  {
    id: "c12_chemistry_everyday",
    name: "Chemistry in Everyday Life",
    classLevel: 12,
    subject: "Chemistry",
    subtopics: [
      {
        id: "c12_chemistry_everyday_s1",
        topicId: "c12_chemistry_everyday",
        name: "Drugs and Medicines",
        order: 1,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "drug target interaction enzymes receptors, classification analgesics antipyretics antibiotics antacids antihistamines, antimicrobials antifertility drugs, sulpha drugs penicillin, broad spectrum narrow spectrum antibiotics",
      },
      {
        id: "c12_chemistry_everyday_s2",
        topicId: "c12_chemistry_everyday",
        name: "Food Chemicals and Cleansing Agents",
        order: 2,
        classLevel: 12,
        subject: "Chemistry",
        keyConceptsSummary:
          "food preservatives sodium benzoate potassium metabisulphite, artificial sweeteners saccharin aspartame, antioxidants BHA BHT, soaps preparation saponification, detergents synthetic biodegradable, cleansing action micelle",
      },
    ],
  },
];

// ─── Helper functions ─────────────────────────────────────────────────────────

export const getAllSubtopics = (): SubtopicDefinition[] =>
  TOPICS.flatMap((t) => t.subtopics);

export const getSubtopicById = (id: string): SubtopicDefinition | undefined =>
  getAllSubtopics().find((s) => s.id === id);

export const getTopicById = (id: string): TopicDefinition | undefined =>
  TOPICS.find((t) => t.id === id);

export const getSubtopicsByTopic = (topicId: string): SubtopicDefinition[] =>
  TOPICS.find((t) => t.id === topicId)?.subtopics ?? [];

export const getNextSubtopic = (
  topicId: string,
  currentOrder: number,
): SubtopicDefinition | undefined =>
  TOPICS.find((t) => t.id === topicId)?.subtopics.find(
    (s) => s.order === currentOrder + 1,
  );
