export interface ConceptDefinition {
  id: string;
  name: string;
  tag: string;
}

export interface SubtopicDefinition {
  id: string;
  topicId: string;
  name: string;
  order: number;
  keyConceptsSummary: string;
  classLevel: number;
  subject: string;
  concepts: ConceptDefinition[];
}

export interface TopicDefinition {
  id: string;
  name: string;
  classLevel: number;
  subject: string;
  subtopics: SubtopicDefinition[];
}

export const TOPICS: TopicDefinition[] = [
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
        concepts: [
          { id: "c11_basic_concepts_s1_matter_classification", name: "Matter Classification", tag: "matter_classification" },
          { id: "c11_basic_concepts_s1_properties", name: "Physical Chemical Properties", tag: "physical_chemical_properties" },
          { id: "c11_basic_concepts_s1_si_units", name: "SI Units and Measurement", tag: "si_units_measurement" },
        ],
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
        concepts: [
          { id: "c11_basic_concepts_s2_conservation_mass", name: "Law of Conservation of Mass", tag: "conservation_mass" },
          { id: "c11_basic_concepts_s2_definite_proportions", name: "Law of Definite Proportions", tag: "definite_proportions" },
          { id: "c11_basic_concepts_s2_multiple_proportions", name: "Law of Multiple Proportions", tag: "multiple_proportions" },
          { id: "c11_basic_concepts_s2_dalton_theory", name: "Dalton's Atomic Theory", tag: "dalton_theory" },
        ],
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
        concepts: [
          { id: "c11_basic_concepts_s3_atomic_mass", name: "Atomic and Molecular Mass", tag: "atomic_molecular_mass" },
          { id: "c11_basic_concepts_s3_mole_concept", name: "Mole Concept", tag: "mole_concept" },
          { id: "c11_basic_concepts_s3_avogadro", name: "Avogadro's Number", tag: "avogadro_number" },
          { id: "c11_basic_concepts_s3_molar_mass", name: "Molar Mass Calculations", tag: "molar_mass" },
        ],
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
        concepts: [
          { id: "c11_basic_concepts_s4_percent_composition", name: "Percentage Composition", tag: "percent_composition" },
          { id: "c11_basic_concepts_s4_empirical_formula", name: "Empirical Formula", tag: "empirical_formula" },
          { id: "c11_basic_concepts_s4_molecular_formula", name: "Molecular Formula", tag: "molecular_formula" },
        ],
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
        concepts: [
          { id: "c11_basic_concepts_s5_stoichiometry", name: "Stoichiometric Calculations", tag: "stoichiometry" },
          { id: "c11_basic_concepts_s5_limiting_reagent", name: "Limiting Reagent", tag: "limiting_reagent" },
          { id: "c11_basic_concepts_s5_percent_yield", name: "Percentage Yield", tag: "percent_yield" },
        ],
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
        concepts: [
          { id: "c11_structure_atom_s1_subatomic_particles", name: "Subatomic Particles", tag: "subatomic_particles" },
          { id: "c11_structure_atom_s1_thomson_model", name: "Thomson's Model", tag: "thomson_model" },
          { id: "c11_structure_atom_s1_rutherford_model", name: "Rutherford's Model", tag: "rutherford_model" },
          { id: "c11_structure_atom_s1_atomic_number", name: "Atomic Number and Mass Number", tag: "atomic_number_mass_number" },
        ],
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
        concepts: [
          { id: "c11_structure_atom_s2_bohr_postulates", name: "Bohr's Postulates", tag: "bohr_postulates" },
          { id: "c11_structure_atom_s2_energy_levels", name: "Energy Levels in Hydrogen", tag: "energy_levels" },
          { id: "c11_structure_atom_s2_spectral_series", name: "Hydrogen Spectral Series", tag: "spectral_series" },
        ],
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
        concepts: [
          { id: "c11_structure_atom_s3_wave_particle", name: "Wave-Particle Duality", tag: "wave_particle_duality" },
          { id: "c11_structure_atom_s3_photoelectric", name: "Photoelectric Effect", tag: "photoelectric_effect" },
          { id: "c11_structure_atom_s3_de_broglie", name: "de Broglie Wavelength", tag: "de_broglie_wavelength" },
        ],
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
        concepts: [
          { id: "c11_structure_atom_s4_uncertainty", name: "Heisenberg Uncertainty Principle", tag: "uncertainty_principle" },
          { id: "c11_structure_atom_s4_quantum_model", name: "Quantum Mechanical Model", tag: "quantum_mechanical_model" },
          { id: "c11_structure_atom_s4_orbital_concept", name: "Orbital vs Orbit Concept", tag: "orbital_concept" },
          { id: "c11_structure_atom_s4_probability_density", name: "Probability Density", tag: "probability_density" },
        ],
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
        concepts: [
          { id: "c11_structure_atom_s5_quantum_numbers", name: "Four Quantum Numbers", tag: "quantum_numbers" },
          { id: "c11_structure_atom_s5_orbital_shapes", name: "Shapes of s p d Orbitals", tag: "orbital_shapes" },
          { id: "c11_structure_atom_s5_nodes", name: "Nodes and Nodal Planes", tag: "nodes_nodal_planes" },
        ],
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
        concepts: [
          { id: "c11_structure_atom_s6_aufbau", name: "Aufbau Principle", tag: "aufbau_principle" },
          { id: "c11_structure_atom_s6_pauli", name: "Pauli Exclusion Principle", tag: "pauli_exclusion" },
          { id: "c11_structure_atom_s6_hunds_rule", name: "Hund's Rule", tag: "hunds_rule" },
          { id: "c11_structure_atom_s6_exceptional_config", name: "Exceptional Configurations", tag: "exceptional_config" },
        ],
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
        concepts: [
          { id: "c11_periodic_table_s1_early_attempts", name: "Early Classification Attempts", tag: "early_attempts" },
          { id: "c11_periodic_table_s1_mendeleev", name: "Mendeleev's Periodic Table", tag: "mendeleev_table" },
          { id: "c11_periodic_table_s1_modern_periodic_law", name: "Modern Periodic Law", tag: "modern_periodic_law" },
          { id: "c11_periodic_table_s1_table_structure", name: "Structure of Modern Table", tag: "table_structure" },
        ],
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
        concepts: [
          { id: "c11_periodic_table_s2_block_elements", name: "s p d f Block Elements", tag: "block_elements" },
          { id: "c11_periodic_table_s2_representative", name: "Representative Elements", tag: "representative_elements" },
          { id: "c11_periodic_table_s2_config_position", name: "Config and Position Link", tag: "config_position_link" },
        ],
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
        concepts: [
          { id: "c11_periodic_table_s3_atomic_radius", name: "Atomic Radius Trends", tag: "atomic_radius" },
          { id: "c11_periodic_table_s3_ionic_radius", name: "Ionic Radius", tag: "ionic_radius" },
          { id: "c11_periodic_table_s3_isoelectronic", name: "Isoelectronic Species", tag: "isoelectronic_species" },
        ],
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
        concepts: [
          { id: "c11_periodic_table_s4_ionisation_enthalpy", name: "Ionisation Enthalpy Trends", tag: "ionisation_enthalpy" },
          { id: "c11_periodic_table_s4_successive_ie", name: "Successive Ionisation Enthalpies", tag: "successive_ie" },
          { id: "c11_periodic_table_s4_electron_gain", name: "Electron Gain Enthalpy", tag: "electron_gain_enthalpy" },
        ],
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
        concepts: [
          { id: "c11_periodic_table_s5_electronegativity", name: "Electronegativity Trends", tag: "electronegativity" },
          { id: "c11_periodic_table_s5_valence_oxidation", name: "Valence and Oxidation States", tag: "valence_oxidation_states" },
          { id: "c11_periodic_table_s5_diagonal_relationship", name: "Diagonal Relationships", tag: "diagonal_relationship" },
        ],
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
        concepts: [
          { id: "c11_chemical_bonding_s1_ionic_bond", name: "Ionic Bond Formation", tag: "ionic_bond_formation" },
          { id: "c11_chemical_bonding_s1_lattice_energy", name: "Lattice Energy", tag: "lattice_energy" },
          { id: "c11_chemical_bonding_s1_born_haber", name: "Born-Haber Cycle", tag: "born_haber_cycle" },
        ],
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
        concepts: [
          { id: "c11_chemical_bonding_s2_lewis_structures", name: "Lewis Dot Structures", tag: "lewis_structures" },
          { id: "c11_chemical_bonding_s2_formal_charge", name: "Formal Charge", tag: "formal_charge" },
          { id: "c11_chemical_bonding_s2_resonance", name: "Resonance Structures", tag: "resonance_structures" },
          { id: "c11_chemical_bonding_s2_octet_exceptions", name: "Exceptions to Octet Rule", tag: "octet_exceptions" },
        ],
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
        concepts: [
          { id: "c11_chemical_bonding_s3_vsepr", name: "VSEPR Theory", tag: "vsepr_theory" },
          { id: "c11_chemical_bonding_s3_geometry", name: "Molecular Geometry", tag: "molecular_geometry" },
          { id: "c11_chemical_bonding_s3_lone_pair_effect", name: "Lone Pair Effect on Shape", tag: "lone_pair_effect" },
        ],
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
        concepts: [
          { id: "c11_chemical_bonding_s4_bond_polarity", name: "Bond Polarity", tag: "bond_polarity" },
          { id: "c11_chemical_bonding_s4_dipole_moment", name: "Dipole Moment", tag: "dipole_moment" },
          { id: "c11_chemical_bonding_s4_polar_nonpolar", name: "Polar vs Nonpolar Molecules", tag: "polar_nonpolar" },
        ],
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
        concepts: [
          { id: "c11_chemical_bonding_s5_vbt", name: "Valence Bond Theory", tag: "valence_bond_theory" },
          { id: "c11_chemical_bonding_s5_sigma_pi", name: "Sigma and Pi Bonds", tag: "sigma_pi_bonds" },
          { id: "c11_chemical_bonding_s5_hybridisation", name: "Hybridisation Types", tag: "hybridisation" },
        ],
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
        concepts: [
          { id: "c11_chemical_bonding_s6_mo_theory", name: "Molecular Orbital Theory", tag: "mo_theory" },
          { id: "c11_chemical_bonding_s6_bond_order", name: "Bond Order Calculation", tag: "bond_order" },
          { id: "c11_chemical_bonding_s6_mo_diagrams", name: "MO Diagrams O2 N2 F2", tag: "mo_diagrams" },
          { id: "c11_chemical_bonding_s6_magnetic_properties", name: "Magnetic Properties from MO", tag: "magnetic_from_mo" },
        ],
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
        concepts: [
          { id: "c11_chemical_bonding_s7_hydrogen_bonding", name: "Hydrogen Bonding", tag: "hydrogen_bonding" },
          { id: "c11_chemical_bonding_s7_hb_effects", name: "Effects on Physical Properties", tag: "hb_effects_properties" },
          { id: "c11_chemical_bonding_s7_metallic_bonding", name: "Metallic Bonding", tag: "metallic_bonding" },
        ],
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
        concepts: [
          { id: "c11_states_matter_s1_dispersion_forces", name: "London Dispersion Forces", tag: "dispersion_forces" },
          { id: "c11_states_matter_s1_dipole_interactions", name: "Dipole-Dipole Interactions", tag: "dipole_interactions" },
          { id: "c11_states_matter_s1_thermal_vs_imf", name: "Thermal Energy vs IMF", tag: "thermal_vs_imf" },
        ],
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
        concepts: [
          { id: "c11_states_matter_s2_boyles_law", name: "Boyle's Law", tag: "boyles_law" },
          { id: "c11_states_matter_s2_charles_law", name: "Charles' Law", tag: "charles_law" },
          { id: "c11_states_matter_s2_avogadro_law", name: "Avogadro's Law", tag: "avogadro_law" },
          { id: "c11_states_matter_s2_combined_gas", name: "Combined Gas Law", tag: "combined_gas_law" },
        ],
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
        concepts: [
          { id: "c11_states_matter_s3_ideal_gas_equation", name: "Ideal Gas Equation PV=nRT", tag: "ideal_gas_equation" },
          { id: "c11_states_matter_s3_kinetic_theory", name: "Kinetic Molecular Theory", tag: "kinetic_theory" },
          { id: "c11_states_matter_s3_molecular_speeds", name: "Molecular Speed Types", tag: "molecular_speeds" },
        ],
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
        concepts: [
          { id: "c11_states_matter_s4_real_vs_ideal", name: "Real vs Ideal Gas Deviation", tag: "real_vs_ideal" },
          { id: "c11_states_matter_s4_vdw_equation", name: "van der Waals Equation", tag: "vdw_equation" },
          { id: "c11_states_matter_s4_liquefaction", name: "Liquefaction of Gases", tag: "liquefaction" },
        ],
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
        concepts: [
          { id: "c11_states_matter_s5_vapour_pressure", name: "Vapour Pressure", tag: "vapour_pressure" },
          { id: "c11_states_matter_s5_surface_tension", name: "Surface Tension", tag: "surface_tension" },
          { id: "c11_states_matter_s5_viscosity", name: "Viscosity", tag: "viscosity" },
        ],
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
        concepts: [
          { id: "c11_thermodynamics_s1_system_surroundings", name: "System and Surroundings", tag: "system_surroundings" },
          { id: "c11_thermodynamics_s1_state_functions", name: "State vs Path Functions", tag: "state_path_functions" },
          { id: "c11_thermodynamics_s1_first_law", name: "First Law of Thermodynamics", tag: "first_law" },
          { id: "c11_thermodynamics_s1_internal_energy", name: "Internal Energy", tag: "internal_energy" },
        ],
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
        concepts: [
          { id: "c11_thermodynamics_s2_enthalpy", name: "Enthalpy Definition", tag: "enthalpy" },
          { id: "c11_thermodynamics_s2_heat_capacity", name: "Heat Capacity Cp and Cv", tag: "heat_capacity" },
          { id: "c11_thermodynamics_s2_calorimetry", name: "Calorimetry", tag: "calorimetry" },
        ],
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
        concepts: [
          { id: "c11_thermodynamics_s3_hess_law", name: "Hess's Law", tag: "hess_law" },
          { id: "c11_thermodynamics_s3_standard_enthalpies", name: "Standard Enthalpies", tag: "standard_enthalpies" },
          { id: "c11_thermodynamics_s3_bond_enthalpy", name: "Bond Enthalpies", tag: "bond_enthalpy" },
        ],
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
        concepts: [
          { id: "c11_thermodynamics_s4_entropy", name: "Entropy and Disorder", tag: "entropy" },
          { id: "c11_thermodynamics_s4_second_law", name: "Second Law of Thermodynamics", tag: "second_law" },
          { id: "c11_thermodynamics_s4_entropy_changes", name: "Entropy Changes in Processes", tag: "entropy_changes" },
        ],
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
        concepts: [
          { id: "c11_thermodynamics_s5_gibbs_energy", name: "Gibbs Energy", tag: "gibbs_energy" },
          { id: "c11_thermodynamics_s5_spontaneity", name: "Criterion for Spontaneity", tag: "spontaneity" },
          { id: "c11_thermodynamics_s5_gibbs_equilibrium", name: "Gibbs Energy and Equilibrium", tag: "gibbs_equilibrium" },
        ],
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
        concepts: [
          { id: "c11_equilibrium_s1_dynamic_equilibrium", name: "Dynamic Equilibrium", tag: "dynamic_equilibrium" },
          { id: "c11_equilibrium_s1_law_mass_action", name: "Law of Mass Action", tag: "law_mass_action" },
          { id: "c11_equilibrium_s1_equilibrium_constant", name: "Equilibrium Constant Kc", tag: "equilibrium_constant_kc" },
        ],
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
        concepts: [
          { id: "c11_equilibrium_s2_kc_kp", name: "Kc and Kp Expressions", tag: "kc_kp" },
          { id: "c11_equilibrium_s2_kc_kp_relation", name: "Kc and Kp Relationship", tag: "kc_kp_relation" },
          { id: "c11_equilibrium_s2_reaction_quotient", name: "Reaction Quotient Q", tag: "reaction_quotient" },
        ],
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
        concepts: [
          { id: "c11_equilibrium_s3_le_chatelier", name: "Le Chatelier's Principle", tag: "le_chatelier" },
          { id: "c11_equilibrium_s3_concentration_effect", name: "Effect of Concentration Change", tag: "concentration_effect" },
          { id: "c11_equilibrium_s3_temperature_pressure", name: "Effect of Temperature and Pressure", tag: "temp_pressure_effect" },
          { id: "c11_equilibrium_s3_industrial_applications", name: "Industrial Applications", tag: "industrial_applications" },
        ],
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
        concepts: [
          { id: "c11_equilibrium_s4_acid_base_theories", name: "Acid-Base Theories", tag: "acid_base_theories" },
          { id: "c11_equilibrium_s4_conjugate_pairs", name: "Conjugate Acid-Base Pairs", tag: "conjugate_pairs" },
          { id: "c11_equilibrium_s4_ph_scale", name: "pH Scale and Kw", tag: "ph_scale_kw" },
        ],
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
        concepts: [
          { id: "c11_equilibrium_s5_ka_kb", name: "Ka and Kb Expressions", tag: "ka_kb" },
          { id: "c11_equilibrium_s5_henderson", name: "Henderson-Hasselbalch Equation", tag: "henderson_hasselbalch" },
          { id: "c11_equilibrium_s5_buffer_solutions", name: "Buffer Solutions", tag: "buffer_solutions" },
        ],
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
        concepts: [
          { id: "c11_equilibrium_s6_ksp", name: "Solubility Product Ksp", tag: "ksp" },
          { id: "c11_equilibrium_s6_precipitation", name: "Condition for Precipitation", tag: "precipitation_condition" },
          { id: "c11_equilibrium_s6_common_ion", name: "Common Ion Effect", tag: "common_ion_effect" },
        ],
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
        concepts: [
          { id: "c11_redox_s1_classical_concept", name: "Classical Oxidation Reduction", tag: "classical_redox" },
          { id: "c11_redox_s1_electronic_concept", name: "Electronic Concept of Redox", tag: "electronic_redox" },
          { id: "c11_redox_s1_oxidising_reducing", name: "Oxidising and Reducing Agents", tag: "oxidising_reducing_agents" },
        ],
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
        concepts: [
          { id: "c11_redox_s2_oxidation_number_rules", name: "Oxidation Number Rules", tag: "oxidation_number_rules" },
          { id: "c11_redox_s2_assign_on", name: "Assigning Oxidation Numbers", tag: "assigning_oxidation_numbers" },
          { id: "c11_redox_s2_disproportionation", name: "Disproportionation Reactions", tag: "disproportionation" },
        ],
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
        concepts: [
          { id: "c11_redox_s3_half_reaction", name: "Half Reaction Method", tag: "half_reaction_method" },
          { id: "c11_redox_s3_acidic_basic", name: "Balancing in Acidic and Basic Medium", tag: "acidic_basic_balancing" },
          { id: "c11_redox_s3_on_change_method", name: "Oxidation Number Change Method", tag: "on_change_method" },
        ],
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
        concepts: [
          { id: "c11_redox_s4_electrochemical_cells", name: "Redox in Electrochemical Cells", tag: "electrochemical_cells" },
          { id: "c11_redox_s4_electrode_reactions", name: "Electrode Reactions", tag: "electrode_reactions_basic" },
          { id: "c11_redox_s4_activity_series", name: "Activity Series", tag: "activity_series" },
        ],
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
        concepts: [
          { id: "c11_organic_basic_s1_classification", name: "Organic Compound Classification", tag: "organic_classification" },
          { id: "c11_organic_basic_s1_functional_groups", name: "Functional Groups", tag: "functional_groups" },
          { id: "c11_organic_basic_s1_iupac", name: "IUPAC Nomenclature", tag: "iupac_nomenclature" },
        ],
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
        concepts: [
          { id: "c11_organic_basic_s2_structural_isomerism", name: "Structural Isomerism", tag: "structural_isomerism" },
          { id: "c11_organic_basic_s2_geometrical_isomerism", name: "Geometrical Isomerism", tag: "geometrical_isomerism" },
          { id: "c11_organic_basic_s2_optical_isomerism", name: "Optical Isomerism", tag: "optical_isomerism" },
        ],
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
        concepts: [
          { id: "c11_organic_basic_s3_inductive", name: "Inductive Effect", tag: "inductive_effect" },
          { id: "c11_organic_basic_s3_resonance_effect", name: "Resonance Mesomeric Effect", tag: "resonance_effect" },
          { id: "c11_organic_basic_s3_hyperconjugation", name: "Hyperconjugation", tag: "hyperconjugation" },
        ],
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
        concepts: [
          { id: "c11_organic_basic_s4_intermediates", name: "Reactive Intermediates", tag: "reactive_intermediates" },
          { id: "c11_organic_basic_s4_nucleophiles_electrophiles", name: "Nucleophiles and Electrophiles", tag: "nucleophiles_electrophiles" },
          { id: "c11_organic_basic_s4_reaction_types", name: "Types of Organic Reactions", tag: "reaction_types" },
        ],
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
        concepts: [
          { id: "c11_hydrocarbons_s1_alkane_structure", name: "Alkane Structure and Conformations", tag: "alkane_structure" },
          { id: "c11_hydrocarbons_s1_halogenation", name: "Free Radical Halogenation", tag: "free_radical_halogenation" },
          { id: "c11_hydrocarbons_s1_combustion_cracking", name: "Combustion and Cracking", tag: "combustion_cracking" },
        ],
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
        concepts: [
          { id: "c11_hydrocarbons_s2_alkene_structure", name: "Alkene Structure and Pi Bond", tag: "alkene_structure" },
          { id: "c11_hydrocarbons_s2_electrophilic_addition", name: "Electrophilic Addition", tag: "electrophilic_addition" },
          { id: "c11_hydrocarbons_s2_markovnikov", name: "Markovnikov's Rule", tag: "markovnikov_rule" },
          { id: "c11_hydrocarbons_s2_polymerisation", name: "Polymerisation of Alkenes", tag: "alkene_polymerisation" },
        ],
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
        concepts: [
          { id: "c11_hydrocarbons_s3_alkyne_structure", name: "Alkyne Structure and Acidity", tag: "alkyne_structure" },
          { id: "c11_hydrocarbons_s3_benzene_structure", name: "Benzene Structure and Resonance", tag: "benzene_structure" },
          { id: "c11_hydrocarbons_s3_eas", name: "Electrophilic Aromatic Substitution", tag: "eas_reactions" },
        ],
      },
    ],
  },

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
        concepts: [
          { id: "c12_solid_state_s1_amorphous_crystalline", name: "Amorphous vs Crystalline Solids", tag: "amorphous_crystalline" },
          { id: "c12_solid_state_s1_solid_types", name: "Types of Crystalline Solids", tag: "solid_types" },
          { id: "c12_solid_state_s1_anisotropy", name: "Anisotropy in Crystals", tag: "anisotropy" },
        ],
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
        concepts: [
          { id: "c12_solid_state_s2_crystal_lattice", name: "Crystal Lattice Concept", tag: "crystal_lattice" },
          { id: "c12_solid_state_s2_unit_cell", name: "Unit Cell Types", tag: "unit_cell_types" },
          { id: "c12_solid_state_s2_atoms_per_cell", name: "Atoms per Unit Cell", tag: "atoms_per_cell" },
          { id: "c12_solid_state_s2_coordination_number", name: "Coordination Number", tag: "coordination_number_solid" },
        ],
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
        concepts: [
          { id: "c12_solid_state_s3_close_packing", name: "Close Packing Arrangements", tag: "close_packing" },
          { id: "c12_solid_state_s3_packing_efficiency", name: "Packing Efficiency", tag: "packing_efficiency" },
          { id: "c12_solid_state_s3_voids", name: "Tetrahedral and Octahedral Voids", tag: "voids" },
          { id: "c12_solid_state_s3_density_calc", name: "Density Calculation", tag: "density_calculation" },
        ],
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
        concepts: [
          { id: "c12_solid_state_s4_point_defects", name: "Point Defects", tag: "point_defects" },
          { id: "c12_solid_state_s4_frenkel_schottky", name: "Frenkel and Schottky Defects", tag: "frenkel_schottky" },
          { id: "c12_solid_state_s4_nonstoichiometric", name: "Non-stoichiometric Defects", tag: "nonstoichiometric_defects" },
        ],
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
        concepts: [
          { id: "c12_solid_state_s5_band_theory", name: "Band Theory of Solids", tag: "band_theory" },
          { id: "c12_solid_state_s5_semiconductors", name: "Semiconductors and Doping", tag: "semiconductors_doping" },
          { id: "c12_solid_state_s5_magnetic_properties", name: "Magnetic Properties of Solids", tag: "magnetic_properties_solid" },
        ],
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
        concepts: [
          { id: "c12_solutions_s1_solution_types", name: "Types of Solutions", tag: "solution_types" },
          { id: "c12_solutions_s1_concentration_terms", name: "Concentration Terms", tag: "concentration_terms" },
          { id: "c12_solutions_s1_solubility", name: "Solubility and Henry's Law", tag: "solubility_henrys" },
        ],
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
        concepts: [
          { id: "c12_solutions_s2_vapour_pressure", name: "Vapour Pressure of Solution", tag: "vapour_pressure_solution" },
          { id: "c12_solutions_s2_raoults_law", name: "Raoult's Law", tag: "raoults_law" },
          { id: "c12_solutions_s2_ideal_nonideal", name: "Ideal and Non-Ideal Solutions", tag: "ideal_nonideal_solutions" },
          { id: "c12_solutions_s2_azeotropes", name: "Azeotropes", tag: "azeotropes" },
        ],
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
        concepts: [
          { id: "c12_solutions_s3_colligative_intro", name: "Colligative Properties", tag: "colligative_properties" },
          { id: "c12_solutions_s3_boiling_elevation", name: "Boiling Point Elevation", tag: "boiling_point_elevation" },
          { id: "c12_solutions_s3_freezing_depression", name: "Freezing Point Depression", tag: "freezing_point_depression" },
        ],
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
        concepts: [
          { id: "c12_solutions_s4_osmosis", name: "Osmosis and Semipermeable Membrane", tag: "osmosis" },
          { id: "c12_solutions_s4_osmotic_pressure", name: "Osmotic Pressure", tag: "osmotic_pressure" },
          { id: "c12_solutions_s4_reverse_osmosis", name: "Reverse Osmosis", tag: "reverse_osmosis" },
        ],
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
        concepts: [
          { id: "c12_solutions_s5_vant_hoff", name: "van't Hoff Factor", tag: "vant_hoff_factor" },
          { id: "c12_solutions_s5_association_dissociation", name: "Association and Dissociation", tag: "association_dissociation" },
          { id: "c12_solutions_s5_abnormal_molar_mass", name: "Abnormal Molar Mass", tag: "abnormal_molar_mass" },
        ],
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
        concepts: [
          { id: "c12_electrochemistry_s1_galvanic_cell", name: "Galvanic Cell Construction", tag: "galvanic_cell" },
          { id: "c12_electrochemistry_s1_electrode_reactions", name: "Electrode Reactions", tag: "electrode_reactions" },
          { id: "c12_electrochemistry_s1_emf", name: "EMF Measurement", tag: "emf_measurement" },
          { id: "c12_electrochemistry_s1_standard_electrode", name: "Standard Electrode Potential", tag: "standard_electrode_potential" },
          { id: "c12_electrochemistry_s1_electrochemical_series", name: "Electrochemical Series", tag: "electrochemical_series" },
        ],
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
        concepts: [
          { id: "c12_electrochemistry_s2_nernst", name: "Nernst Equation", tag: "nernst_equation" },
          { id: "c12_electrochemistry_s2_emf_gibbs", name: "EMF and Gibbs Energy", tag: "emf_gibbs_relation" },
          { id: "c12_electrochemistry_s2_concentration_cells", name: "Concentration Cells", tag: "concentration_cells" },
        ],
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
        concepts: [
          { id: "c12_electrochemistry_s3_conductance", name: "Conductance and Conductivity", tag: "conductance_conductivity" },
          { id: "c12_electrochemistry_s3_molar_conductivity", name: "Molar Conductivity", tag: "molar_conductivity" },
          { id: "c12_electrochemistry_s3_strong_weak", name: "Strong vs Weak Electrolytes", tag: "strong_weak_electrolytes" },
        ],
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
        concepts: [
          { id: "c12_electrochemistry_s4_kohlrausch", name: "Kohlrausch's Law", tag: "kohlrausch_law" },
          { id: "c12_electrochemistry_s4_degree_dissociation", name: "Degree of Dissociation from Conductance", tag: "degree_dissociation_conductance" },
          { id: "c12_electrochemistry_s4_faradays_laws", name: "Faraday's Laws of Electrolysis", tag: "faradays_laws" },
        ],
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
        concepts: [
          { id: "c12_electrochemistry_s5_primary_batteries", name: "Primary Batteries", tag: "primary_batteries" },
          { id: "c12_electrochemistry_s5_secondary_batteries", name: "Secondary Batteries", tag: "secondary_batteries" },
          { id: "c12_electrochemistry_s5_fuel_cells", name: "Fuel Cells", tag: "fuel_cells" },
          { id: "c12_electrochemistry_s5_corrosion", name: "Corrosion as Electrochemical Process", tag: "corrosion" },
        ],
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
        concepts: [
          { id: "c12_chemical_kinetics_s1_rate_expression", name: "Rate Expression and Rate Constant", tag: "rate_expression" },
          { id: "c12_chemical_kinetics_s1_order", name: "Order of Reaction", tag: "order_of_reaction" },
          { id: "c12_chemical_kinetics_s1_molecularity", name: "Molecularity vs Order", tag: "molecularity_vs_order" },
        ],
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
        concepts: [
          { id: "c12_chemical_kinetics_s2_zero_order", name: "Zero Order Integrated Rate", tag: "zero_order_integrated" },
          { id: "c12_chemical_kinetics_s2_first_order", name: "First Order Integrated Rate", tag: "first_order_integrated" },
          { id: "c12_chemical_kinetics_s2_half_life", name: "Half Life Concept", tag: "half_life" },
        ],
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
        concepts: [
          { id: "c12_chemical_kinetics_s3_arrhenius", name: "Arrhenius Equation", tag: "arrhenius_equation" },
          { id: "c12_chemical_kinetics_s3_activation_energy", name: "Activation Energy", tag: "activation_energy" },
          { id: "c12_chemical_kinetics_s3_temp_effect", name: "Temperature Effect on Rate", tag: "temp_effect_rate" },
        ],
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
        concepts: [
          { id: "c12_chemical_kinetics_s4_collision_theory", name: "Collision Theory", tag: "collision_theory" },
          { id: "c12_chemical_kinetics_s4_reaction_mechanism", name: "Reaction Mechanism", tag: "reaction_mechanism" },
          { id: "c12_chemical_kinetics_s4_rate_determining", name: "Rate Determining Step", tag: "rate_determining_step" },
        ],
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
        concepts: [
          { id: "c12_surface_chemistry_s1_adsorption_types", name: "Physisorption vs Chemisorption", tag: "adsorption_types" },
          { id: "c12_surface_chemistry_s1_factors_adsorption", name: "Factors Affecting Adsorption", tag: "factors_adsorption" },
          { id: "c12_surface_chemistry_s1_adsorption_isotherms", name: "Adsorption Isotherms", tag: "adsorption_isotherms" },
        ],
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
        concepts: [
          { id: "c12_surface_chemistry_s2_heterogeneous_catalysis", name: "Heterogeneous Catalysis Mechanism", tag: "heterogeneous_catalysis" },
          { id: "c12_surface_chemistry_s2_enzyme_catalysis", name: "Enzyme Catalysis", tag: "enzyme_catalysis" },
          { id: "c12_surface_chemistry_s2_promoters_poisons", name: "Promoters and Poisons", tag: "promoters_poisons" },
        ],
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
        concepts: [
          { id: "c12_surface_chemistry_s3_colloid_types", name: "Types of Colloids", tag: "colloid_types" },
          { id: "c12_surface_chemistry_s3_tyndall_brownian", name: "Tyndall Effect and Brownian Motion", tag: "tyndall_brownian" },
          { id: "c12_surface_chemistry_s3_coagulation", name: "Coagulation", tag: "coagulation" },
          { id: "c12_surface_chemistry_s3_emulsions", name: "Emulsions", tag: "emulsions" },
        ],
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
        concepts: [
          { id: "c12_p_block_s1_group15_trends", name: "Group 15 Trends", tag: "group15_trends" },
          { id: "c12_p_block_s1_nitrogen_compounds", name: "Nitrogen and Ammonia", tag: "nitrogen_compounds" },
          { id: "c12_p_block_s1_phosphorus", name: "Phosphorus Allotropes and Compounds", tag: "phosphorus_compounds" },
        ],
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
        concepts: [
          { id: "c12_p_block_s2_oxygen_ozone", name: "Oxygen and Ozone", tag: "oxygen_ozone" },
          { id: "c12_p_block_s2_sulphur_allotropes", name: "Sulphur Allotropes", tag: "sulphur_allotropes" },
          { id: "c12_p_block_s2_sulphuric_acid", name: "Sulphuric Acid Manufacture", tag: "sulphuric_acid" },
        ],
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
        concepts: [
          { id: "c12_p_block_s3_halogen_trends", name: "Halogen Trends and Reactivity", tag: "halogen_trends" },
          { id: "c12_p_block_s3_chlorine", name: "Chlorine Preparation and Properties", tag: "chlorine_properties" },
          { id: "c12_p_block_s3_noble_gases", name: "Noble Gases and Xenon Compounds", tag: "noble_gases" },
        ],
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
        concepts: [
          { id: "c12_d_f_block_s1_variable_oxidation", name: "Variable Oxidation States", tag: "variable_oxidation_states" },
          { id: "c12_d_f_block_s1_coloured_complexes", name: "Coloured Complexes Formation", tag: "coloured_complexes" },
          { id: "c12_d_f_block_s1_catalytic_magnetic", name: "Catalytic and Magnetic Properties", tag: "catalytic_magnetic" },
        ],
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
        concepts: [
          { id: "c12_d_f_block_s2_potassium_dichromate", name: "Potassium Dichromate", tag: "potassium_dichromate" },
          { id: "c12_d_f_block_s2_potassium_permanganate", name: "Potassium Permanganate", tag: "potassium_permanganate" },
        ],
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
        concepts: [
          { id: "c12_d_f_block_s3_lanthanoid_config", name: "Lanthanoid Configuration", tag: "lanthanoid_config" },
          { id: "c12_d_f_block_s3_lanthanoid_contraction", name: "Lanthanoid Contraction", tag: "lanthanoid_contraction" },
          { id: "c12_d_f_block_s3_actinoids", name: "Actinoids Overview", tag: "actinoids" },
        ],
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
        concepts: [
          { id: "c12_coordination_s1_werner_theory", name: "Werner's Theory", tag: "werner_theory" },
          { id: "c12_coordination_s1_ligands", name: "Types of Ligands", tag: "ligand_types" },
          { id: "c12_coordination_s1_coordination_number", name: "Coordination Number", tag: "coordination_number" },
          { id: "c12_coordination_s1_chelates", name: "Chelates", tag: "chelates" },
        ],
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
        concepts: [
          { id: "c12_coordination_s2_iupac_nomenclature", name: "IUPAC Nomenclature", tag: "iupac_coordination" },
          { id: "c12_coordination_s2_structural_isomerism", name: "Structural Isomerism", tag: "structural_isomerism_coord" },
          { id: "c12_coordination_s2_stereoisomerism", name: "Stereoisomerism in Complexes", tag: "stereoisomerism_coord" },
        ],
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
        concepts: [
          { id: "c12_coordination_s3_vbt_complexes", name: "VBT for Complexes", tag: "vbt_complexes" },
          { id: "c12_coordination_s3_cft", name: "Crystal Field Theory", tag: "crystal_field_theory" },
          { id: "c12_coordination_s3_cfse", name: "CFSE and Spin States", tag: "cfse_spin" },
          { id: "c12_coordination_s3_spectrochemical", name: "Spectrochemical Series", tag: "spectrochemical_series" },
        ],
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
        concepts: [
          { id: "c12_coordination_s4_stability_constant", name: "Stability Constant", tag: "stability_constant" },
          { id: "c12_coordination_s4_biological_importance", name: "Biological Importance", tag: "biological_importance_coord" },
          { id: "c12_coordination_s4_applications", name: "Applications in Metallurgy and Medicine", tag: "coord_applications" },
        ],
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
        concepts: [
          { id: "c12_haloalkanes_s1_nomenclature", name: "Nomenclature of Haloalkanes", tag: "haloalkane_nomenclature" },
          { id: "c12_haloalkanes_s1_cx_bond", name: "Nature of C-X Bond", tag: "cx_bond_nature" },
          { id: "c12_haloalkanes_s1_preparation", name: "Preparation Methods", tag: "haloalkane_preparation" },
        ],
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
        concepts: [
          { id: "c12_haloalkanes_s2_sn2", name: "SN2 Mechanism", tag: "sn2_mechanism" },
          { id: "c12_haloalkanes_s2_sn1", name: "SN1 Mechanism", tag: "sn1_mechanism" },
          { id: "c12_haloalkanes_s2_sn1_vs_sn2", name: "SN1 vs SN2 Factors", tag: "sn1_vs_sn2" },
          { id: "c12_haloalkanes_s2_stereochemistry", name: "Stereochemical Outcomes", tag: "stereo_substitution" },
        ],
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
        concepts: [
          { id: "c12_haloalkanes_s3_elimination", name: "Elimination Reactions E1 E2", tag: "elimination_reactions" },
          { id: "c12_haloalkanes_s3_haloarenes", name: "Haloarenes Properties", tag: "haloarenes" },
          { id: "c12_haloalkanes_s3_nas", name: "Nucleophilic Aromatic Substitution", tag: "nas_reaction" },
        ],
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
        concepts: [
          { id: "c12_alcohols_phenols_s1_classification", name: "Classification of Alcohols", tag: "alcohol_classification" },
          { id: "c12_alcohols_phenols_s1_preparation", name: "Preparation of Alcohols", tag: "alcohol_preparation" },
          { id: "c12_alcohols_phenols_s1_physical_properties", name: "Physical Properties and H-Bonding", tag: "alcohol_physical_props" },
        ],
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
        concepts: [
          { id: "c12_alcohols_phenols_s2_reactions_alcohol", name: "Reactions of Alcohols", tag: "alcohol_reactions" },
          { id: "c12_alcohols_phenols_s2_phenol_prep", name: "Phenol Preparation", tag: "phenol_preparation" },
          { id: "c12_alcohols_phenols_s2_phenol_acidity", name: "Acidic Nature of Phenol", tag: "phenol_acidity" },
          { id: "c12_alcohols_phenols_s2_phenol_substitution", name: "Electrophilic Substitution of Phenol", tag: "phenol_eas" },
        ],
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
        concepts: [
          { id: "c12_alcohols_phenols_s3_ether_nomenclature", name: "Nomenclature of Ethers", tag: "ether_nomenclature" },
          { id: "c12_alcohols_phenols_s3_williamson", name: "Williamson Synthesis", tag: "williamson_synthesis" },
          { id: "c12_alcohols_phenols_s3_ether_reactions", name: "Reactions of Ethers", tag: "ether_reactions" },
        ],
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
        concepts: [
          { id: "c12_carbonyl_s1_carbonyl_structure", name: "Carbonyl Group Structure", tag: "carbonyl_structure" },
          { id: "c12_carbonyl_s1_aldehyde_prep", name: "Preparation of Aldehydes", tag: "aldehyde_preparation" },
          { id: "c12_carbonyl_s1_ketone_prep", name: "Preparation of Ketones", tag: "ketone_preparation" },
        ],
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
        concepts: [
          { id: "c12_carbonyl_s2_nucleophilic_addition", name: "Nucleophilic Addition Mechanism", tag: "nucleophilic_addition" },
          { id: "c12_carbonyl_s2_aldol_condensation", name: "Aldol Condensation", tag: "aldol_condensation" },
          { id: "c12_carbonyl_s2_cannizzaro", name: "Cannizzaro Reaction", tag: "cannizzaro_reaction" },
          { id: "c12_carbonyl_s2_oxidation_tests", name: "Oxidation Tests for Aldehydes", tag: "aldehyde_oxidation_tests" },
        ],
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
        concepts: [
          { id: "c12_carbonyl_s3_carboxylic_prep", name: "Preparation of Carboxylic Acids", tag: "carboxylic_acid_prep" },
          { id: "c12_carbonyl_s3_acidity", name: "Acidity and Substitution Effects", tag: "carboxylic_acidity" },
          { id: "c12_carbonyl_s3_reactions", name: "Reactions of Carboxylic Acids", tag: "carboxylic_reactions" },
        ],
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
        concepts: [
          { id: "c12_amines_s1_classification", name: "Classification of Amines", tag: "amine_classification" },
          { id: "c12_amines_s1_preparation", name: "Preparation of Amines", tag: "amine_preparation" },
          { id: "c12_amines_s1_gabriel_hofmann", name: "Gabriel and Hofmann Reactions", tag: "gabriel_hofmann" },
        ],
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
        concepts: [
          { id: "c12_amines_s2_basicity", name: "Basicity of Amines", tag: "amine_basicity" },
          { id: "c12_amines_s2_reactions", name: "Reactions of Amines", tag: "amine_reactions" },
          { id: "c12_amines_s2_diazonium", name: "Diazonium Salts", tag: "diazonium_salts" },
        ],
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
        concepts: [
          { id: "c12_biomolecules_s1_glucose_structure", name: "Glucose Structure", tag: "glucose_structure" },
          { id: "c12_biomolecules_s1_carb_classification", name: "Carbohydrate Classification", tag: "carb_classification" },
          { id: "c12_biomolecules_s1_polysaccharides", name: "Polysaccharides Functions", tag: "polysaccharides" },
        ],
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
        concepts: [
          { id: "c12_biomolecules_s2_amino_acids", name: "Amino Acids and Zwitterion", tag: "amino_acids" },
          { id: "c12_biomolecules_s2_protein_structure", name: "Protein Structure Levels", tag: "protein_structure" },
          { id: "c12_biomolecules_s2_enzymes", name: "Enzyme Action and Specificity", tag: "enzyme_action" },
        ],
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
        concepts: [
          { id: "c12_biomolecules_s3_nucleotides", name: "Nucleotide Structure", tag: "nucleotide_structure" },
          { id: "c12_biomolecules_s3_dna_structure", name: "DNA Double Helix", tag: "dna_structure" },
          { id: "c12_biomolecules_s3_rna_types", name: "RNA Types and Functions", tag: "rna_types" },
          { id: "c12_biomolecules_s3_hormones", name: "Hormones Classification", tag: "hormones" },
        ],
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
        concepts: [
          { id: "c12_polymers_s1_polymer_classification", name: "Polymer Classification", tag: "polymer_classification" },
          { id: "c12_polymers_s1_addition_polymerisation", name: "Addition Polymerisation", tag: "addition_polymerisation" },
          { id: "c12_polymers_s1_common_addition", name: "Common Addition Polymers", tag: "common_addition_polymers" },
        ],
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
        concepts: [
          { id: "c12_polymers_s2_condensation", name: "Condensation Polymerisation", tag: "condensation_polymerisation" },
          { id: "c12_polymers_s2_nylon_polyester", name: "Nylon and Polyester", tag: "nylon_polyester" },
          { id: "c12_polymers_s2_rubber", name: "Natural and Synthetic Rubber", tag: "rubber_types" },
          { id: "c12_polymers_s2_biodegradable", name: "Biodegradable Polymers", tag: "biodegradable_polymers" },
        ],
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
        concepts: [
          { id: "c12_chemistry_everyday_s1_drug_target", name: "Drug Target Interaction", tag: "drug_target" },
          { id: "c12_chemistry_everyday_s1_drug_classes", name: "Drug Classification", tag: "drug_classification" },
          { id: "c12_chemistry_everyday_s1_antibiotics", name: "Antibiotics", tag: "antibiotics" },
        ],
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
        concepts: [
          { id: "c12_chemistry_everyday_s2_preservatives", name: "Food Preservatives and Sweeteners", tag: "preservatives_sweeteners" },
          { id: "c12_chemistry_everyday_s2_soaps", name: "Soaps and Saponification", tag: "soaps_saponification" },
          { id: "c12_chemistry_everyday_s2_detergents", name: "Detergents and Cleansing Action", tag: "detergents_cleansing" },
        ],
      },
    ],
  },
];

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

export const getConceptsBySubtopic = (subtopicId: string): ConceptDefinition[] =>
  getSubtopicById(subtopicId)?.concepts ?? [];

export const getConceptById = (id: string): ConceptDefinition | undefined =>
  getAllSubtopics().flatMap((s) => s.concepts).find((c) => c.id === id);
