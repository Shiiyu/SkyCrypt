declare const page: string;

declare namespace extra {
  const isFoolsDay: boolean;
  const cacheOnly: boolean;
  const packs: Pack[];
  const themes: { [key: string]: Theme };
}

interface Pack {
  id: string;
  base_path: string;
  priority: number;
  name: string;
  author: string;
  url: string;
  version?: string;
  default?: boolean;
}

interface Theme {
  name: string;
  author: string;
  schema: number;
  light?: boolean;
  enchanted_glint?: string;
  images?: {
    [key: string]: string;
  };
  backgrounds?: {
    [key: string]:
      | {
          type: "color";
          color: string;
        }
      | {
          type: "stripes";
          angle: string;
          colors: string[];
          width: number;
        };
  };
  colors?: { [key: string]: string };
}

interface ProcessedTheme {
  light: boolean;
  styles: {
    [key: string]: string;
  };
  logoURL: string;
  enchantedGlint: string;
}

declare function applyProcessedTheme(processedTheme: ProcessedTheme): void;

declare const items: {
  accessories: {
    accessories: (ItemSlot | Item | Backpack)[];
  };
  equipment: {
    equipment: (ItemSlot | Item | Backpack)[];
    set_name: string;
    set_rarity: string;
  };
  armor: {
    armor: (ItemSlot | Item | Backpack)[];
    set_name: string;
    set_rarity: string;
  };
  hotm: (ItemSlot | Item | Backpack)[];
  inventory: (ItemSlot | Item | Backpack)[];
  enderchest: (ItemSlot | Item | Backpack)[];
  accessory_bag: (ItemSlot | Item | Backpack)[];
  fishing_bag: (ItemSlot | Item | Backpack)[];
  quiver: (ItemSlot | Item | Backpack)[];
  potion_bag: (ItemSlot | Item | Backpack)[];
  personal_vault: (ItemSlot | Item | Backpack)[];
  wardrobe_inventory: (ItemSlot | Item | Backpack)[];
  candy_bag: (ItemSlot | Item | Backpack)[];
  storage: (ItemSlot | Item | Backpack)[];
  bingo_card: (ItemSlot | Item | Backpack)[];
  museum: (ItemSlot | Item | Backpack)[];
};

type StatName =
  | "health"
  | "defense"
  | "strength"
  | "speed"
  | "crit_chance"
  | "crit_damage"
  | "intelligence"
  | "bonus_attack_speed"
  | "sea_creature_chance"
  | "magic_find"
  | "pet_luck"
  | "true_defense"
  | "ferocity"
  | "ability_damage"
  | "mining_speed"
  | "mining_fortune"
  | "farming_fortune"
  | "foraging_fortune"
  | "pristine"
  | "fishing_speed"
  | "health_regen"
  | "vitality"
  | "mending"
  | "combat_wisdom"
  | "mining_wisdom"
  | "farming_wisdom"
  | "foraging_wisdom"
  | "fishing_wisdom"
  | "enchanting_wisdom"
  | "alchemy_wisdom"
  | "carpentry_wisdom"
  | "runecrafting_wisdom"
  | "social_wisdom";

interface DisplayItem {
  display_name: string;
  texture_path?: string;
  categories: string[];
  rarity: string | null;
  recombobulated: boolean | null;
  dungeon: boolean | null;
  shiny: boolean | null;
  color: string | null;
}

interface ItemSlot {
  itemId: string;
  item_index: number;
}

interface Item extends DisplayItem, ItemSlot {
  glowing?: boolean;
  Count: number;
  Damage: number;
  animated: boolean;
  id: number;
  stats: {
    [key in StatName]: number;
  };
  tag: ItemTag;
  texture_pack?: Pack;
  isInactive?: boolean;
  containsItems: Item[];
}

interface ItemTag {
  display: ItemTagDisplay;
  ench?: ItemTagEnch[];
  CustomPotionEffects?: ItemTagCustomPotionEffects[];
  ExtraAttributes?: ItemTagExtraAttributes;
  HideFlags?: number[];
  SkullOwner?: ItemTagSkullOwner[];
  Unbreakable?: number;
  [key: string]: unknown;
}

interface ItemTagExtraAttributes {
  [key: string]: unknown;
}

interface ItemTagSkullOwner {
  Id: string;
  Properties: {
    textures: {
      Value: string;
    }[];
  };
}

interface ItemTagCustomPotionEffects {
  Ambient: number;
  Duration: number;
  Id: number;
  Amplifier: number;
}

interface ItemTagEnch {
  lvl: number;
  id: number;
}

interface ItemTagDisplay {
  Lore?: string[];
  Name?: string;
}

interface Backpack extends Item {
  containsItems: Item[];
}

interface Level {
  xp: number;
  level: number;
  maxLevel: number;
  xpCurrent: number;
  xpForNext: number;
  progress: number;
  levelCap: number;
  uncappedLevel: number;
  levelWithProgress: number;
  rank?: number;
  unlockableLevelWithProgress: number;
  maxExperience?: number;
}

declare namespace constants {
  const MAX_FAVORITES: number;
}

declare const calculated: SkyCryptPlayer & {
  auctions_bought: { [key: string]: number };
  auctions_sold: { [key: string]: number };
  average_level: number;
  average_level_no_progress: number;
  average_level_rank: number;
  base_stats: { [key in StatName]?: number };
  collections: {
    [key: string]: {
      amount: number;
      amounts: {
        username: string;
        amount: number;
      }[];
      tier: number;
      totalAmount: number;
    };
  };
  current_area: string;
  deaths: {
    deaths: {
      amount: number;
      entity_id: string;
      entity_name: string;
      type: "deaths";
    }[];
    total: number;
  };
  dungeons: {
    boss_collections: {
      [key: string]: {
        claimed: string[];
        killed: number;
        maxed: boolean;
        name: string;
        texture: string;
        tier: number;
        unclaimed: number;
      };
    };
    catacombs: {
      bonuses: {
        [key: string]: number;
      };
      floors: {
        best_runs: {
          ally_healing: number;
          damage_dealt: number;
          damage_mitigated: number;
          deaths: number;
          dungeon_class: string;
          elapsed_time: number;
          mobs_killed: number;
          score_bonus: number;
          score_exploration: number;
          score_skill: number;
          score_speed: number;
          secrets_found: number;
          teammates: string[];
          timestamp: number;
        }[];
        icon_texture: string;
        most_damage: {
          class: string;
          value: number;
        };
        name: string;
        stats: {
          best_score: number;
          fastest_time: number;
          milestone_completions: number;
          mobs_killed: number;
          most_healing: number;
          most_mobs_killed: number;
          tier_completions: number;
          times_played: number;
          watcher_kills: number;
        };
      }[];
      highest_floor: string;
      id: string;
      level: Level;
      visited: boolean;
    };
    classes: {
      selected_class: string;
      classes: {
        [key: string]: {
          level: Level;
          current: boolean;
        };
      };
    };
    journals: {
      journal_entries: {
        name: string;
        pages_collected: number;
        total_pages: number;
      }[];
      journals_completed: number;
      maxed: boolean;
      pages_collected: number;
      total_pages: number;
    };
    master_catacombs: {
      floors: {
        best_runs: {
          ally_healing: number;
          damage_dealt: number;
          damage_mitigated: number;
          deaths: number;
          dungeon_class: string;
          elapsed_time: number;
          mobs_killed: number;
          score_bonus: number;
          score_exploration: number;
          score_skill: number;
          score_speed: number;
          secrets_found: number;
          teammates: string[];
          timestamp: number;
        }[];
        icon_texture: string;
        most_damage: {
          class: string;
          value: number;
        };
        name: string;
        stats: {
          best_score: number;
          fastest_time: number;
          fastest_time_s?: number;
          milestone_completions: number;
          mobs_killed: number;
          most_healing: number;
          most_mobs_killed: number;
          tier_completions: number;
        };
      }[];
      highest_floor: string;
      id: string;
      level: Level;
      visited: boolean;
    };
    secrets_found: number;
    selected_class: string;
    unlocked_collections: boolean;
    used_classes: boolean;
  };
  enchanting: {
    experimented: true;
    experiments: {
      [key in "numbers" | "pairings" | "simon"]: {
        name: string;
        stats: {
          bonus_clicks?: number;
          last_attempt?: SkyCryptRelativeTime;
          last_claimed: SkyCryptRelativeTime;
        };
        tiers: {
          [key: number]: {
            attempts?: number;
            best_score: number;
            claims: number;
            icon: string;
            name: string;
          };
        };
      };
    };
  };
  fairy_exchanges: number;
  fairy_souls: {
    collected: number;
    progress: number;
    total: number;
  };
  farming?: {
    contests: {
      all_contests: {
        claimed: boolean;
        collected: number;
        crop: string;
        date: string;
        medal: null | "bronze" | "silver" | "gold";
        placing: {
          percentage: number;
          position: number;
        };
      }[];
      attended_contests: number;
    };
    crops: {
      [key: string]: {
        attended: boolean;
        badges: { diamond: number; platinum: number; gold: number; silver: number; bronze: number };
        contests: number;
        icon: "81_0";
        name: "Cactus";
        personal_best: number;
        highest_tier: string;
      };
    };
    current_badges: { diamond: number; platinum: number; gold: number; silver: number; bronze: number };
    perks: {
      double_drops: number;
      farming_level_cap: number;
    };
    talked: boolean;
    total_badges: { gold: number; silver: number; bronze: number };
    unique_golds: number;
    unique_platinums: number;
    unique_diamonds: number;
  };
  first_joined: SkyCryptRelativeTime;
  fishing: {
    shredder_bait: number;
    shredder_fished: number;
    total: number;
    treasure: number;
    treasure_large: number;
  };
  kills: {
    kills: {
      amount: number;
      entity_id: string;
      entity_name: string;
      type: "kills";
    }[];
    total: number;
  };
  last_updated: SkyCryptRelativeTime;
  level_caps: {
    [key: string]: number;
  };
  skills: {
    skills: {
      [key: string]: Level;
    };
    averageSkillLevel: number;
    averageSkillLevelWithoutProgress: number;
    totalSkillXp: number;
  };
  members: SkyCryptPlayer[];
  mining: {
    commissions: {
      milestone: string;
    };
  };
  minion_slots: {
    currentSlots: number;
    toNext: number;
    toNextSlot: number;
  };
  minions: {
    head: string;
    id: string;
    levels: number[];
    maxLevel: number;
    name: string;
    tiers: number;
    type: string;
  }[];
  misc: {
    auctions_buy?: {
      bids: number;
      gold_spent: number;
      highest_bid: number;
      items_bought: number;
      won: number;
    };
    auctions_sell?: {
      fees: number;
      gold_earned: number;
      items_sold: number;
    };
    burrows: {
      [key in "chains_complete" | "dug_combat" | "dug_next" | "dug_treasure"]: {
        common: number;
        legendary: number;
        null: number;
        rare: number;
        total: number;
        uncommon: number;
      };
    };
    claimed_items: {
      [key: string]: number;
    };
    damage: {
      highest_critical_damage: number;
    };
    dragons: {
      deaths: number;
      ender_crystals_destroyed: number;
      last_hits: number;
    };
    gifts: {
      gifts_given: number;
      gifts_received: number;
    };
    milestones: {
      ores_mined: number;
      sea_creatures_killed: number;
    };
    profile_upgrades: {
      coins_allowance: number;
      coop_slots: number;
      guests_count: number;
      island_size: number;
      minion_slots: number;
    };
    protector: {
      deaths: number;
      last_hits: number;
    };
    races: {
      [key: string]: number;
    };
    winter: {
      most_winter_cannonballs_hit: number;
      most_winter_damage_dealt: number;
      most_winter_magma_damage_dealt: number;
      most_winter_snowballs_hit: number;
    };
    uncategorized?: {
      [key: string]: {
        raw?: number;
        formatted?: string;
        maxed?: boolean;
      };
    };
    effects: {
      active: {
        effect: string;
        level: number;
        modifiers: {
          key: string;
          amp: number;
        }[];
        ticks_remaining: number;
        infinite: boolean;
      }[];
      inactive: string[];
      disabled: string[];
    };
  };
  accessories: {
    [key in "missing" | "upgrades"]: DisplayItem[];
  };
  petScore: number;
  pet_bonus: {
    [key in StatName]?: number;
  };
  pets: {
    pets: Pet[];
    missing: PetBase[];
    pet_score: {
      total: number;
      amount: number;
      bonus: {
        magic_find: number;
      };
    };
    amount_pets: number;
    total_pets: number;
    total_pet_skins: number;
    amount_pet_skins: number;
    total_candy_used: number;
    total_pet_xp: number;
  };
  profile: Profile;
  profiles: {
    [key: string]: Profile & {
      last_updated: SkyCryptRelativeTime;
    };
  };
  purse: number;
  rank_prefix: string;
  slayer_coins_spent: {
    spider: number;
    total: number;
    wolf: number;
    zombie: number;
    blaze: number;
  };
  slayer: {
    slayers?: {
      [key in SlayerName]: {
        boss_kills_tier_0?: number;
        boss_kills_tier_1?: number;
        boss_kills_tier_2?: number;
        boss_kills_tier_3?: number;
        claimed_levels: {
          [key: string]: true;
        };
        kills: {
          [key: number]: number;
        };
        level: {
          currentLevel: number;
          maxLevel: number;
          progress: number;
          xp: number;
          xpForNext: number;
        };
        xp?: number;
      };
    };
    total_slayer_xp: number;
    total_coins_spent: number;
  };
  social: {
    DISCORD: string;
    TWITTER: string;
    YOUTUBE: string;
    INSTAGRAM: string;
    TWITCH: string;
    HYPIXEL: string;
  };
  stats: {
    [key in StatName]: number;
  };
  total_skill_xp: number;
  uuid: string;
  wardrobe_equipped_slot: number;
  weapon_stats: {
    [key: string]: {
      [key in StatName]: number;
    };
  };
  century_cakes: {
    stat: string;
    amount: number;
  }[];
  skyblock_level: Level;
  bestiary?: {
    categories: BestiaryCategory[];
    tiersUnlocked: number;
    totalTiers: number;
    milestone: number;
    maxMilestone: number;
  };
  harp_quest: {
    [key: string]: number;
  };
  perks: {
    [key: string]: number;
  };
};

interface SkyCryptRelativeTime {
  unix: number;
  text: string;
}

interface SkyCryptPlayer {
  display_name: string;
  display_emoji?: string;
  skin_data: {
    model: "default" | "slim";
    skinurl: string;
    capeurl?: string;
  };
  uuid: string;
}

interface PetBase extends DisplayItem {
  emoji: string;
  head: string;
  lore: string;
  type: string;
}

interface Pet extends PetBase {
  active: boolean;
  candyUsed: number;
  exp: number;
  heldItem: string | null;
  level: {
    level: number;
    xpCurrent: number;
    xpForNext: number;
    progress: number;
    xpMaxLevel: number;
  };
  lore: string;
  ref: {
    rarity: number;
    level: number;
  };
  skin: string | null;
  stats: {
    [key in StatName]?: number;
  };
  tier: string;
  uuid: string | null;
}

interface Profile {
  cute_name: string;
  game_mode: string | null;
  profile_id: string;
}

type SlayerName = "enderman" | "spider" | "wolf" | "zombie" | "blaze";

interface Navigator {
  userAgentData: NavigatorUAData;
}

interface NavigatorUAData {
  brands?: NavigatorUABrandVersion[];
  uaList?: NavigatorUABrandVersion[];
  mobile: boolean;
  getHighEntropyValues<T extends keyof UADataValues>(hints: T[]): Promise<{ [key in T]: UADataValues[T] }>;
  platform?: string;
}

interface NavigatorUABrandVersion {
  brand: string;
  version: string;
}

interface UADataValues {
  platform: string;
  platformVersion: string;
  architecture: string;
  model: string;
  uaFullVersion: string;
}

interface PlayerStats {
  [key: string]: {
    [key: string]: number;
  };
}

declare const redocInit: ((color?: string) => void) | undefined;

type ItemStats = {
  [key in StatName]?: number;
};

type BonusType =
  | "skill_farming"
  | "skill_mining"
  | "skill_combat"
  | "skill_foraging"
  | "skill_fishing"
  | "skill_enchanting"
  | "skill_alchemy"
  | "skill_taming"
  | "skill_dungeoneering"
  | "skill_social"
  | "skill_carpentry"
  | "skill_runecrafting"
  | "slayer_zombie"
  | "slayer_spider"
  | "slayer_wolf"
  | "slayer_enderman"
  | "slayer_blaze"
  | "HOTM_perk_mining_speed"
  | "HOTM_perk_mining_speed_2"
  | "HOTM_perk_mining_fortune"
  | "HOTM_perk_mining_fortune_2"
  | "HOTM_perk_mining_madness"
  | "HOTM_perk_mining_experience";

type StatsBonus = {
  [key in BonusType]: StatBonusType;
};

interface StatBonusType {
  [key: string]: {
    [key in StatName]?: number;
  };
}

type ColorCode = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "a" | "b" | "c" | "d" | "e" | "f";

interface RarityColors {
  [key: string]: ColorCode;
}

interface BestiaryCategory {
  name: string;
  texture: string;
  mobs: BestiaryMob[];
  mobsUnlocked: number;
  mobsMaxed: number;
}

interface BestiaryMob {
  name: string;
  texture: string;
  kills: number;
  nextTierKills: number;
  maxKills: number;
  tier: number;
  maxTier: number;
}

type HarpQuestSongs =
  | "song_hymn_joy_best_completion"
  | "song_frere_jacques_best_completion"
  | "song_amazing_grace_best_completion"
  | "song_brahms_best_completion"
  | "song_happy_birthday_best_completion"
  | "song_greensleeves_best_completion"
  | "song_jeopardy_best_completion"
  | "song_minuet_best_completion"
  | "song_joy_world_best_completion"
  | "song_pure_imagination_best_completion"
  | "song_vie_en_rose_best_completion"
  | "song_fire_and_flames_best_completion"
  | "song_pachelbel_best_completion";

type PotionEffectIDs =
  | "true_defense"
  | "strength"
  | "regeneration"
  | "enchanting_xp_boost"
  | "stun"
  | "experience"
  | "rabbit"
  | "magic_find"
  | "water_breathing"
  | "combat_xp_boost"
  | "fire_resistance"
  | "jump_boost"
  | "resistance"
  | "fishing_xp_boost"
  | "agility"
  | "archery"
  | "critical"
  | "speed"
  | "farming_xp_boost"
  | "adrenaline"
  | "spelunker"
  | "dodge"
  | "spirit"
  | "pet_luck"
  | "mining_xp_boost"
  | "haste"
  | "burning"
  | "mana"
  | "foraging_xp_boost"
  | "alchemy_xp_boost"
  | "jerry_candy"
  | "night_vision";

type Guild = GuildResponse | null;

interface GuildResponse {
  guildMaster: {
    uuid?: string;
    username?: string;
  };
  level: number;
  members: number;
  name: string;
  player: {
    uuid: string;
    username: string;
    rank: string;
  };
  tag?: string;
}
