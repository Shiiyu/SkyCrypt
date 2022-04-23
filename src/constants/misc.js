// prevent specific players from appearing in leaderboards
export const blocked_players = [
  "20934ef9488c465180a78f861586b4cf", // Minikloon (Admin)
  "f025c1c7f55a4ea0b8d93f47d17dfe0f", // Plancke (Admin)
];

// Number of kills required for each level of expertise
export const expertise_kills_ladder = [50, 100, 250, 500, 1000, 2500, 5500, 10000, 15000];

// Walking distance required for each rarity level of the prehistoric egg
export const prehistoric_egg_blocks_walked_ladder = [4000, 10000, 20000, 40000, 100000];

// api names and their max value from the profile upgrades
export const profile_upgrades = {
  island_size: 10,
  minion_slots: 5,
  guests_count: 5,
  coop_slots: 3,
  coins_allowance: 5,
};

// Player stats on a completely new profile
export const base_stats = {
  health: 100,
  defense: 0,
  effective_health: 100,
  strength: 0,
  speed: 100,
  crit_chance: 30,
  crit_damage: 50,
  bonus_attack_speed: 0,
  intelligence: 0,
  sea_creature_chance: 20,
  magic_find: 0,
  pet_luck: 0,
  ferocity: 0,
  ability_damage: 0,
  mining_speed: 0,
  mining_fortune: 0,
  farming_fortune: 0,
  foraging_fortune: 0,
  pristine: 0,
  damage: 0,
  damage_increase: 0,
};

export const stat_template = {
  health: 0,
  defense: 0,
  effective_health: 0,
  strength: 0,
  speed: 0,
  crit_chance: 0,
  crit_damage: 0,
  bonus_attack_speed: 0,
  intelligence: 0,
  sea_creature_chance: 0,
  magic_find: 0,
  pet_luck: 0,
  ferocity: 0,
  ability_damage: 0,
  mining_speed: 0,
  mining_fortune: 0,
  farming_fortune: 0,
  foraging_fortune: 0,
  pristine: 0,
  damage: 0,
  damage_increase: 0,
};

export const slayer_cost = {
  1: 2000,
  2: 7500,
  3: 20000,
  4: 50000,
  5: 100000,
};

export const mob_mounts = {
  sea_emperor: ["guardian_emperor", "skeleton_emperor"],
  monster_of_the_deep: ["zombie_deep", "chicken_deep"],
};

export const mob_names = {
  pond_squid: "Squid",
  unburried_zombie: "Crypt Ghoul",
  zealot_enderman: "Zealot",
  invisible_creeper: "Sneaky Creeper",
  generator_ghast: "Minion Ghast",
  generator_magma_cube: "Minion Magma Cube",
  generator_slime: "Minion Slime",
  brood_mother_spider: "Brood Mother",
  obsidian_wither: "Obsidian Defender",
  sadan_statue: "Terracotta",
  diamond_guy: "Angry Archaeologist",
  tentaclees: "Fels",
  master_diamond_guy: "Master Angry Archaeologist",
  master_sadan_statue: "Master Terracotta",
  master_tentaclees: "Master Fels",
  maxor: "Necron",
};

export const raceObjectiveToStatName = {
  complete_the_end_race: "end_race_best_time",
  complete_the_woods_race: "foraging_race_best_time",
  complete_the_chicken_race: "chicken_race_best_time_2",
  complete_the_giant_mushroom_anything_with_return_race: "dungeon_hub_giant_mushroom_anything_with_return_best_time",
  complete_the_giant_mushroom_no_pearls_with_return_race: "dungeon_hub_giant_mushroom_no_pearls_with_return_best_time",
  complete_the_giant_mushroom_no_abilities_with_return_race:
    "dungeon_hub_giant_mushroom_no_abilities_with_return_best_time",
  complete_the_giant_mushroom_nothing_with_return_race: "dungeon_hub_giant_mushroom_nothing_with_return_best_time",
  complete_the_precursor_ruins_anything_with_return_race: "dungeon_hub_precursor_ruins_anything_with_return_best_time",
  complete_the_precursor_ruins_no_pearls_with_return_race:
    "dungeon_hub_precursor_ruins_no_pearls_with_return_best_time",
  complete_the_precursor_ruins_no_abilities_with_return_race:
    "dungeon_hub_precursor_ruins_no_abilities_with_return_best_time",
  complete_the_precursor_ruins_nothing_with_return_race: "dungeon_hub_precursor_ruins_nothing_with_return_best_time",
  complete_the_crystal_core_anything_with_return_race: "dungeon_hub_crystal_core_anything_with_return_best_time",
  complete_the_crystal_core_no_pearls_with_return_race: "dungeon_hub_crystal_core_no_pearls_with_return_best_time",
  complete_the_crystal_core_no_abilities_with_return_race:
    "dungeon_hub_crystal_core_no_abilities_with_return_best_time",
  complete_the_crystal_core_nothing_with_return_race: "dungeon_hub_crystal_core_nothing_with_return_best_time",
  complete_the_giant_mushroom_anything_no_return_race: "dungeon_hub_giant_mushroom_anything_no_return_best_time",
  complete_the_giant_mushroom_no_pearls_no_return_race: "dungeon_hub_giant_mushroom_no_pearls_no_return_best_time",
  complete_the_giant_mushroom_no_abilities_no_return_race:
    "dungeon_hub_giant_mushroom_no_abilities_no_return_best_time",
  complete_the_giant_mushroom_nothing_no_return_race: "dungeon_hub_giant_mushroom_nothing_no_return_best_time",
  complete_the_precursor_ruins_anything_no_return_race: "dungeon_hub_precursor_ruins_anything_no_return_best_time",
  complete_the_precursor_ruins_no_pearls_no_return_race: "dungeon_hub_precursor_ruins_no_pearls_no_return_best_time",
  complete_the_precursor_ruins_no_abilities_no_return_race:
    "dungeon_hub_precursor_ruins_no_abilities_no_return_best_time",
  complete_the_precursor_ruins_nothing_no_return_race: "dungeon_hub_precursor_ruins_nothing_no_return_best_time",
  complete_the_crystal_core_anything_no_return_race: "dungeon_hub_crystal_core_anything_no_return_best_time",
  complete_the_crystal_core_no_pearls_no_return_race: "dungeon_hub_crystal_core_no_pearls_no_return_best_time",
  complete_the_crystal_core_no_abilities_no_return_race: "dungeon_hub_crystal_core_no_abilities_no_return_best_time",
  complete_the_crystal_core_nothing_no_return_race: "dungeon_hub_crystal_core_nothing_no_return_best_time",
};

export const area_names = {
  dynamic: "Private Island",
  hub: "Hub",
  mining_1: "Gold Mine",
  mining_2: "Deep Caverns",
  mining_3: "Dwarven Mines",
  combat_1: "Spider's Den",
  combat_2: "Blazing Fortress",
  combat_3: "The End",
  farming_1: "The Barn",
  farming_2: "Mushroom Desert",
  foraging_1: "The Park",
  winter: "Jerry's Workshop",
};

export const color_names = {
  BLACK: "0",
  DARK_BLUE: "1",
  DARK_GREEN: "2",
  DARK_AQUA: "3",
  DARK_RED: "4",
  DARK_PURPLE: "5",
  GOLD: "6",
  GRAY: "7",
  DARK_GRAY: "8",
  BLUE: "9",
  GREEN: "a",
  AQUA: "b",
  RED: "c",
  LIGHT_PURPLE: "d",
  YELLOW: "e",
  WHITE: "f",
};

export const ranks = {
  OWNER: {
    color: "c",
    tag: "OWNER",
  },

  ADMIN: {
    color: "c",
    tag: "ADMIN",
  },

  GAME_MASTER: {
    color: "2",
    tag: "GM",
  },

  YOUTUBER: {
    color: "c",
    tag: "YOUTUBE",
  },

  SUPERSTAR: {
    color: "6",
    tag: "MVP",
    plus: "++",
    plusColor: "c",
  },

  MVP_PLUS: {
    color: "b",
    tag: "MVP",
    plus: "+",
    plusColor: "c",
  },

  MVP: {
    color: "b",
    tag: "MVP",
  },

  VIP_PLUS: {
    color: "a",
    tag: "VIP",
    plus: "+",
    plusColor: "6",
  },

  VIP: {
    color: "a",
    tag: "VIP",
  },

  "PIG+++": {
    color: "d",
    tag: "PIG",
    plus: "+++",
    plusColor: "b",
  },

  MAYOR: {
    color: "d",
    tag: "MAYOR",
  },

  MINISTER: {
    color: "c",
    tag: "MINISTER",
  },

  NONE: null,
};

export const farming_crops = {
  "INK_SACK:3": {
    name: "Cocoa Beans",
    icon: "351_3",
  },
  POTATO_ITEM: {
    name: "Potato",
    icon: "392_0",
  },
  CARROT_ITEM: {
    name: "Carrot",
    icon: "391_0",
  },
  CACTUS: {
    name: "Cactus",
    icon: "81_0",
  },
  SUGAR_CANE: {
    name: "Sugar Cane",
    icon: "338_0",
  },
  MUSHROOM_COLLECTION: {
    name: "Mushroom",
    icon: "40_0",
  },
  PUMPKIN: {
    name: "Pumpkin",
    icon: "86_0",
  },
  NETHER_STALK: {
    name: "Nether Wart",
    icon: "372_0",
  },
  WHEAT: {
    name: "Wheat",
    icon: "296_0",
  },
  MELON: {
    name: "Melon",
    icon: "360_0",
  },
};

export const experiments = {
  games: {
    simon: {
      name: "Chronomatron",
    },
    numbers: {
      name: "Ultrasequencer",
    },
    pairings: {
      name: "Superpairs",
    },
  },
  tiers: [
    {
      name: "Beginner",
      icon: "351:12",
    },
    {
      name: "High",
      icon: "351:10",
    },
    {
      name: "Grand",
      icon: "351:11",
    },
    {
      name: "Supreme",
      icon: "351:14",
    },
    {
      name: "Transcendent",
      icon: "351:1",
    },
    {
      name: "Metaphysical",
      icon: "351:13",
    },
  ],
};

export const max_favorites = 10;

export const increase_most_stats_exclude = [
  "mining_speed",
  "mining_fortune",
  "farming_fortune",
  "foraging_fortune",
  "pristine",
];

export const fairy_souls = {
  max: {
    normal: 238,
    stranded: 3,
  },
};

export const essence = {
  // Catacombs essences
  ice: {
    name: "Ice",
    head: "/head/ddba642efffa13ec3730eafc5914ab68115c1f998803f74452e2e0cd26af0b8",
  },
  wither: {
    name: "Wither",
    head: "/head/c4db4adfa9bf48ff5d41707ae34ea78bd2371659fcd8cd8934749af4cce9b",
  },
  spider: {
    name: "Spider",
    head: "/head/16617131250e578333a441fdf4a5b8c62163640a9d06cd67db89031d03accf6",
  },
  undead: {
    name: "Undead",
    head: "/head/71d7c816fc8c636d7f50a93a0ba7aaeff06c96a561645e9eb1bef391655c531",
  },
  diamond: {
    name: "Diamond",
    head: "/head/964f25cfff754f287a9838d8efe03998073c22df7a9d3025c425e3ed7ff52c20",
  },
  dragon: {
    name: "Dragon",
    head: "/head/33ff416aa8bec1665b92701fbe68a4effff3d06ed9147454fa77712dd6079b33",
  },
  gold: {
    name: "Gold",
    head: "/head/8816606260779b23ed15f87c56c932240db745f86f683d1f4deb83a4a125fa7b",
  },
  // Nether essences
  crimson: {
    name: "Crimson",
    head: "/head/67c41930f8ff0f2b0430e169ae5f38e984df1244215705c6f173862844543e9d",
  },
};
