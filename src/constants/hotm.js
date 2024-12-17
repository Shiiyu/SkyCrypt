import { SYMBOLS } from "../../common/constants.js";
import { round, floor, ceil, convertHMS, titleCase } from "../helper.js";

const UPGRADE_TYPES = {
  mithril_powder: {
    name: "Mithril Powder",
    color: "2",
  },
  gemstone_powder: {
    name: "Gemstone Powder",
    color: "d",
  },
  token_of_the_mountain: {
    name: "Token of the Mountain",
    color: "5",
  },
  free: {
    name: "FREE",
    color: "a",
  },
  glacite_powder: {
    name: "Glacite Powder",
    color: "b",
  },
};

const rewards = {
  hotm: {
    1: {
      token_of_the_mountain: 1,
      skyblock_experience: 35,
    },
    2: {
      token_of_the_mountain: 2,
      access_to_forge: 0,
      new_forgeable_items: 0,
      skyblock_experience: 45,
    },
    3: {
      token_of_the_mountain: 2,
      forge_slot: 1,
      new_forgeable_items: 0,
      access_crystal_hollows: 0,
      emissary_braum_crystal_hollows: 0,
      skyblock_experience: 60,
    },
    4: {
      token_of_the_mountain: 2,
      forge_slot: 1,
      new_forgeable_items: 0,
      skyblock_experience: 75,
    },
    5: {
      token_of_the_mountain: 2,
      new_forgeable_items: 0,
      skyblock_experience: 90,
    },
    6: {
      token_of_the_mountain: 2,
      new_forgeable_items: 0,
      skyblock_experience: 100,
    },
    7: {
      token_of_the_mountain: 3,
      new_forgeable_items: 0,
      skyblock_experience: 130,
    },
    8: {
      token_of_the_mountain: 2,
      new_forgeable_items: 0,
      skyblock_experience: 180,
    },
    9: {
      token_of_the_mountain: 2,
      new_forgeable_items: 0,
      skyblock_experience: 210,
    },
    10: {
      token_of_the_mountain: 2,
      new_forgeable_items: 0,
      skyblock_experience: 240,
    },
  },
  potm: {
    1: {
      token_of_the_mountain: 1,
      skyblock_experience: 25,
    },
    2: {
      pickaxe_ability_level: 1,
      skyblock_experience: 35,
    },
    3: {
      commission_slot: 1,
      skyblock_experience: 50,
    },
    4: {
      mithril_powder_when_mining_mithril: 1,
      skyblock_experience: 65,
    },
    5: {
      token_of_the_mountain: 1,
      skyblock_experience: 75,
    },
    6: {
      gemstone_powder_when_mining_gemstones: 2,
      skyblock_experience: 100,
    },
    7: {
      token_of_the_mountain: 1,
      skyblock_experience: 125,
    },
    8: {
      glacite_powder_when_mining_glacite: 3,
      skyblock_experience: 150,
    },
    9: {
      chance_for_glacite_mineshaft_to_spawn: "10%",
      skyblock_experience: 175,
    },
    10: {
      token_of_the_mountain: 2,
      skyblock_experience: 200,
    },
  },
  rewards: {
    token_of_the_mountain: {
      formatted: "§5Token of the Mountain",
      qtyColor: "5",
    },
    access_to_forge: {
      formatted: "§eAccess to the Forge",
      qtyColor: "e",
    },
    new_forgeable_items: {
      formatted: "§eNew Forgeable Items",
      qtyColor: "e",
    },
    forge_slot: {
      formatted: "§aForge Slot",
      qtyColor: "a",
    },
    access_crystal_hollows: {
      formatted: "§dAccess to the §5Crystal Hollows",
      qtyColor: "d",
    },
    emissary_braum_crystal_hollows: {
      formatted: "§eEmissary Braum §f- §bCrystal Hollows",
      qtyColor: "e",
    },
    pickaxe_ability_level: {
      formatted: "§cPickaxe Ability Level",
      qtyColor: "c",
    },
    commission_slot: {
      formatted: "§aCommission Slot",
      qtyColor: "a",
    },
    mithril_powder_when_mining_mithril: {
      formatted: "§2Base Mithril Powder §7when mining §fMithril",
      qtyColor: "2",
    },
    gemstone_powder_when_mining_gemstones: {
      formatted: "§dBase Gemstone Powder §7when mining §dGemstones",
      qtyColor: "d",
    },
    skyblock_experience: {
      formatted: "§bSkyblock XP",
      qtyColor: "b",
    },
    glacite_powder_when_mining_glacite: {
      formatted: "§bBase Glacite Powder §7when mining §bGlacite",
      qtyColor: "b",
    },
    chance_for_glacite_mineshaft_to_spawn: {
      formatted: "§achance §bfor Glacite Mineshaft §7to spawn.",
      qtyColor: "a",
    },
  },
};

/**
 * hypixel id -> friendly name translation table
 * @type {{[id: string]: string}}
 */
const nodeNames = {
  // HOTM 10
  gemstone_infusion: "Gemstone Infusion",
  crystalline: "Crystalline",
  gifts_from_the_departed: "Gifts from the Departed",
  mining_master: "Mining Master",
  hungry_for_more: "Dead Man's Chest",
  vanguard_seeker: "Vanguard Seeker",
  sheer_force: "Sheer Force",
  // HOTM 9
  metal_head: "Metal Head",
  rags_to_riches: "Rags to Riches",
  eager_adventurer: "Eager Adventurer",
  // HOTM 8
  miners_blessing: "Miner's Blessing",
  no_stone_unturned: "No Stone Unturned",
  strong_arm: "Strong Arm",
  steady_hand: "Steady Hand",
  warm_hearted: "Warm Heart",
  surveyor: "Surveyor",
  mineshaft_mayhem: "Mineshaft Mayhem",
  // HOTM 7
  mining_speed_2: "Speedy Mineman",
  powder_buff: "Powder Buff",
  mining_fortune_2: "Fortunate Mineman",
  // HOTM 6
  anomalous_desire: "Anomalous Desire",
  blockhead: "Blockhead",
  subterranean_fisher: "Subterranean Fisher",
  keep_it_cool: "Keep It Cool",
  lonesome_miner: "Lonesome Miner",
  great_explorer: "Great Explorer",
  maniac_miner: "Maniac Miner",
  // HOTM 5
  daily_grind: "Daily Grind",
  special_0: "Core of the Mountain",
  daily_powder: "Daily Powder",
  // HOTM 4
  daily_effect: "Sky Mall",
  old_school: "Old-School",
  professional: "Professional",
  mole: "Mole",
  fortunate: "Gem Lover",
  mining_experience: "Seasoned Mineman",
  front_loaded: "Front Loaded",
  // HOTM 3
  random_event: "Luck of the Cave",
  efficient_miner: "Efficient Miner",
  forge_time: "Quick Forge",
  // HOTM 2
  mining_speed_boost: "Mining Speed Boost",
  precision_mining: "Precision Mining",
  mining_fortune: "Mining Fortune",
  titanium_insanium: "Titanium Insanium",
  pickaxe_toss: "Pickobulus",
  // HOTM 1
  mining_speed: "Mining Speed",
};

/*
 .##.....##..#######..########.##.....##
 .##.....##.##.....##....##....###...###
 .##.....##.##.....##....##....####.####
 .#########.##.....##....##....##.###.##
 .##.....##.##.....##....##....##.....##
 .##.....##.##.....##....##....##.....##
 .##.....##..#######.....##....##.....##
 */

class HotM {
  constructor(tier, level) {
    this.tier = tier;
    this.level = level.level;
    this.progress = level.progress;
    this.levelWithProgress = level.levelWithProgress;
    this.xp = level.xp;
    this.xpCurrent = level.xpCurrent;
    this.xpForNext = level.xpForNext;
  }

  get lore() {
    const output = [];

    // name
    output.push(this.displayName, "");

    // main
    if (this.status === "unlocked") {
      output.push(
        "§7You have unlocked this tier. All perks and abilities on this tier are available for unlocking with §5Token of the Mountain§7.",
        "",
      );
    } else {
      output.push(
        "§7Progress through your Heart of the Mountain by gaining §5HotM Exp§7, which is earned through completing §aCommissions§7.",
        "",
        "§7Commissions are tasks given by the §e§lKing§r§7 in the §bRoyal Palace§7. Complete them to earn bountiful rewards!",
        "",
      );
    }

    // progress
    if (this.status === "next") {
      const progress = round(this.progress * 100);
      const greenBars = ceil(progress / 5);
      const whiteBars = 20 - greenBars;
      output.push(
        `§7Progress: §e${progress}%`,
        `${"§2-".repeat(greenBars)}${"§f-".repeat(
          whiteBars,
        )} §e${this.xpCurrent.toLocaleString()} §6/ §e${this.xpForNext.toLocaleString()}`,
        "",
      );
    }

    // rewards
    output.push("§7Rewards");
    for (const [reward, qty] of Object.entries(rewards.hotm[this.tier])) {
      const quantity = qty > 0 ? `§${rewards.rewards[reward].qtyColor}${qty} ` : "";
      const name = rewards.rewards[reward].formatted;
      output.push(`§8+ ${quantity}${name}`);
    }
    output.push("");

    // status
    output.push(this.status === "unlocked" ? "§aUNLOCKED" : "§cLOCKED");

    return output;
  }

  get displayName() {
    const color = this.status === "unlocked" ? "a" : this.status === "next" ? "e" : "c";
    return `§${color}Tier ${this.tier}`;
  }

  get status() {
    if (this.tier <= this.level) {
      return "unlocked";
    }

    if (this.tier === ceil(this.levelWithProgress)) {
      return "next";
    }

    return "locked";
  }

  get itemData() {
    const data = {
      locked: "160:14",
      next: "160:4",
      unlocked: "160:5",
    };

    return {
      id: parseInt(data[this.status].split(":")[0], 10),
      Damage: parseInt(data[this.status].split(":")[1], 10),
      glowing: false,
    };
  }

  get position10x9() {
    return 9 * (HOTM.tiers - this.tier) + 1;
  }
}

/*
 .##....##..#######..########..########..######.
 .###...##.##.....##.##.....##.##.......##....##
 .####..##.##.....##.##.....##.##.......##......
 .##.##.##.##.....##.##.....##.######....######.
 .##..####.##.....##.##.....##.##.............##
 .##...###.##.....##.##.....##.##.......##....##
 .##....##..#######..########..########..######.
 */

class Node {
  constructor(data) {
    this.nodeType = "normal";
    this.level = data.level;
    this.enabled = data.enabled;
    this.nodes = data.nodes;
    this.hotmTier = data.hotmLevelData.level;
    this.potmLevel = data.nodes.special_0;
    this.selectedPickaxeAbility = data.selectedPickaxeAbility;
  }

  get position10x9() {
    return this.position + 1;
  }

  get itemData() {
    const data = {
      normal: {
        locked: "263:0",
        unlocked: "388:0",
        maxed: "264:0",
      },
      pickaxe_ability: {
        locked: "173:0",
        unlocked: "133:0",
        maxed: "133:0",
      },
      special: {
        locked: "7:0",
        unlocked: "152:0",
        maxed: "152:0",
      },
    };

    return {
      id: parseInt(data[this.nodeType][this.status].split(":")[0], 10),
      Damage: parseInt(data[this.nodeType][this.status].split(":")[1], 10),
      glowing: this.selectedPickaxeAbility === this.id,
    };
  }

  get lore() {
    const output = [];

    // Name
    output.push(this.displayName);

    // Level
    if (this.max_level > 1) {
      if (this.maxed) {
        output.push(`§7Level ${Math.max(1, this.level)}`);
      } else {
        output.push(`§7Level ${Math.max(1, this.level)}§8/${this.max_level}`);
      }
    }
    output.push("");

    // Perk
    output.push(...this.perk(Math.max(1, this.level)));

    // Upgradeable
    if (this.level > 0 && this.level < this.max_level) {
      // header
      output.push("", "§a=====[ §a§lUPGRADE §a] =====");

      // upgrade perk
      output.push(`§7Level ${this.level + 1}§8/${this.max_level}`, "", ...this.perk(this.level + 1));

      // upgrade cost
      output.push(
        "",
        "§7Cost",
        `§${UPGRADE_TYPES[this.upgrade_type].color}${this.upgradeCost.toLocaleString()} ${
          UPGRADE_TYPES[this.upgrade_type].name
        }`,
      );
    }

    // Maxed perk
    if (this.maxed && this.nodeType !== "pickaxe_ability") {
      output.push("", "§aUNLOCKED");
    }

    // Unlock cost
    if (this.level === 0) {
      output.push("", "§7Cost");
      for (const [upgradeId, upgradeQty] of Object.entries(this.unlockCost)) {
        output.push(
          `§${UPGRADE_TYPES[upgradeId].color}${upgradeQty > 0 ? `${upgradeQty} ` : ""}${UPGRADE_TYPES[upgradeId].name}`,
        );
      }
    }

    // Requirements
    if (this.level === 0) {
      if (this.requires.length > 0 && !this.requires.some((x) => Object.keys(this.nodes).includes(x))) {
        const reqs = this.requires.map((x) => nodeNames[x]);
        const reqsFriendly = reqs.length > 1 ? reqs.slice(0, -1).join(", ") + " or " + reqs.slice(-1) : reqs[0];
        output.push("", `§cRequires ${reqsFriendly}.`);
      }

      if (this.requiredHotmTier > this.hotmTier) {
        output.push("", `§cRequires HotM Tier ${this.requiredHotmTier}.`);
      }
    }

    // Status
    if (this.level > 0 && this.nodeType === "normal") {
      output.push("", this.enabled ? "§aENABLED" : "§cDISABLED");
    }

    // Selected Pickaxe Ability
    if (this.level > 0 && this.nodeType === "pickaxe_ability") {
      if (this.selectedPickaxeAbility === this.id) {
        output.push("", "§aSELECTED");
      } else {
        output.push("", "§eClick to select!");
      }
    }

    return output.map((x) => "§r" + x);
  }

  get pickaxeAbilityLevel() {
    // Blue Omelette gives +1 level, impossible to account for in here
    let level = 1;

    if (this.potmLevel >= 1) {
      level += 1;
    }

    return level;
  }

  get requiredHotmTier() {
    return Math.abs(ceil(this.position / 7) - 7) + 1;
  }

  get unlockCost() {
    return {
      token_of_the_mountain: 1,
    };
  }

  get displayName() {
    const nameColor = this.status === "maxed" ? "a" : this.status === "unlocked" ? "e" : "c";
    return `§${nameColor}§l${this.name}`;
  }

  get status() {
    if (this.level === this.max_level) {
      return "maxed";
    }

    if (this.level === 0) {
      return "locked";
    }

    return "unlocked";
  }

  get maxed() {
    return this.level === this.max_level;
  }

  get upgradeCost() {
    return -1;
  }

  perk(level) {
    return ["Missing perk description."];
  }

  get totalUpgradeCost() {
    let total = 0;
    const originalLevel = this.level;

    for (let level = 1; level < this.max_level; level++) {
      this.level = level;
      total += this.upgradeCost;
    }

    this.level = originalLevel;

    return total;
  }
}

// HOTM 10
class GemstoneInfusion extends Node {
  constructor(data) {
    super(data);
    this.id = "gemstone_infusion";
    this.name = nodeNames[this.id];
    this.position = 1;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["crystalline"];
    this.nodeType = "pickaxe_ability";
    this.positionType = "right_ability";
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    const boost = 100;
    const duration = [20, 25, 30][this.pickaxeAbilityLevel - 1];
    const cooldown = 120;
    return [
      "§6Pickaxe Ability: Gemstone Infusion",
      `§7Increases the effectiveness of §6every Gemstone §7in your pick's Gemstone Slots by §a${boost}% §7for §a${duration}s.`,
      `§8Cooldown: §a${cooldown}s`,
      "",
      "§8Pickaxe Abilities apply to all of your pickaxes. You can select a Pickaxe Ability from your Heart of the Mountain.",
      "",
      "§8Upgrade your Pickaxe Abilities by unlocking §cPeak of the Mountain §8in this menu!",
    ];
  }
}

class Crystalline extends Node {
  constructor(data) {
    super(data);
    this.id = "crystalline";
    this.name = nodeNames[this.id];
    this.position = 2;
    this.max_level = 50;
    this.upgrade_type = "glacite_powder";
    this.requires = ["gifts_from_the_departed" /*, "metal_head"*/];
    this.positionType = "top";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.3));
  }

  perk(level) {
    const val = round(level * 0.5, 1);
    return [
      `§7Increases your chances of finding a §bGlacite Mineshaft §7containing a §dGemstone Crystal §7by §a${val}%§7.`,
    ];
  }
}

class GiftsFromTheDeparted extends Node {
  constructor(data) {
    super(data);
    this.id = "gifts_from_the_departed";
    this.name = nodeNames[this.id];
    this.position = 3;
    this.max_level = 100;
    this.upgrade_type = "glacite_powder";
    this.requires = ["mining_master" /*, "crystalline"*/];
    this.positionType = "horizontal_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 2.45));
  }

  perk(level) {
    const val = round(level * 0.2, 1);
    return [`§7Gain a §a${val}% §7chance to get an extra item when looting a §bFrozen Corpse§7.`];
  }
}

class MiningMaster extends Node {
  constructor(data) {
    super(data);
    this.id = "mining_master";
    this.name = nodeNames[this.id];
    this.position = 4;
    this.max_level = 10;
    this.upgrade_type = "glacite_powder";
    this.requires = ["rags_to_riches" /*, "gifts_from_the_departed", "hungry_for_more"*/];
    this.positionType = "top";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 7, 5));
  }

  perk(level) {
    const val = round(level * 0.1, 1);
    return [`§7Grants §5+${val} ${SYMBOLS.pristine} Pristine§7.`];
  }
}

class DeadMansChest extends Node {
  constructor(data) {
    super(data);
    this.id = "hungry_for_more";
    this.name = nodeNames[this.id];
    this.position = 5;
    this.max_level = 50;
    this.upgrade_type = "glacite_powder";
    this.requires = ["mining_master" /*, "vanguard_seeker"*/];
    this.positionType = "horizontal_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.2));
  }

  perk(level) {
    const val = round(level * 1, 1);
    return [
      `§7Gain a §a${val}% §7chance to spawn §a1 §7additional §bFrozen Corpse §7when you enter a §bGlacite Mineshaft§7.`,
    ];
  }
}

class VanguardSeeker extends Node {
  constructor(data) {
    super(data);
    this.id = "vanguard_seeker";
    this.name = nodeNames[this.id];
    this.position = 6;
    this.max_level = 50;
    this.upgrade_type = "glacite_powder";
    this.requires = ["hungry_for_more" /*, "eager_adventurer"*/];
    this.positionType = "top";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.1));
  }

  perk(level) {
    const val = round(level * 1, 1);
    return [
      `§7Increases your chances of finding a §bGlacite Mineshaft §7containing a §rVanguard Corpse §7by §a${val}%§7.`,
    ];
  }
}

class SheerForce extends Node {
  constructor(data) {
    super(data);
    this.id = "sheer_force";
    this.name = nodeNames[this.id];
    this.position = 7;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["vanguard_seeker"];
    this.nodeType = "pickaxe_ability";
    this.positionType = "left_ability";
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    const boost = 200;
    const duration = [20, 25, 30][this.pickaxeAbilityLevel - 1];
    const cooldown = 120;

    return [
      "§6Pickaxe Ability: Sheer Force",
      `§7Grants §e+${boost} ${SYMBOLS.mining_spread} Mining Spread §7for §a${duration}s§7.`,
      `§8Cooldown: §a${cooldown}s`,
      "",
      "§8Pickaxe Abilities apply to all of your pickaxes. You can select a Pickaxe Ability from your Heart of the Mountain.",
      "",
      "§8Upgrade your Pickaxe Abilities by unlocking §cPeak of the Mountain §8in this menu!",
    ];
  }
}

// HOTM 9
class MetalHead extends Node {
  constructor(data) {
    super(data);
    this.id = "metal_head";
    this.name = nodeNames[this.id];
    this.position = 11;
    this.max_level = 20;
    this.upgrade_type = "glacite_powder";
    this.requires = ["no_stone_unturned" /*, "crystalline"*/];
    this.positionType = "vertical_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 4));
  }

  perk(level) {
    const val = round(level * 5, 1);
    return [`§7Grants §6+${val} ${SYMBOLS.mining_fortune} Dwarven Metal Fortune§7.`];
  }
}

class RagsToRiches extends Node {
  constructor(data) {
    super(data);
    this.id = "rags_to_riches";
    this.name = nodeNames[this.id];
    this.position = 13;
    this.max_level = 50;
    this.upgrade_type = "glacite_powder";
    this.requires = ["steady_hand" /*, "mining_master"*/];
    this.positionType = "vertical_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.05));
  }

  perk(level) {
    const val = round(level * 4, 1);
    return [`§7Grants §6+${val} ${SYMBOLS.mining_speed} Mining Fortune §7while in a §bGlacite Mineshaft§7.`];
  }
}

class EagerAdventurer extends Node {
  constructor(data) {
    super(data);
    this.id = "eager_adventurer";
    this.name = nodeNames[this.id];
    this.position = 15;
    this.max_level = 100;
    this.upgrade_type = "glacite_powder";
    this.requires = ["surveyor" /*, "vanguard_seeker"*/];
    this.positionType = "vertical_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 2.3));
  }

  perk(level) {
    const val = round(level * 4, 1);
    return [`§7Grants §6+${val} ${SYMBOLS.mining_speed} Mining Speed §7while in a §bGlacite Mineshaft§7.`];
  }
}

// HOTM 8
class MinersBlessing extends Node {
  constructor(data) {
    super(data);
    this.id = "miners_blessing";
    this.name = nodeNames[this.id];
    this.position = 19;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["no_stone_unturned"];
    this.positionType = "left_perk";
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    return [`Grants §b+30 ${SYMBOLS.magic_find} Magic Find §7on all §bMining Islands§7.`];
  }
}

class NoStoneUnturned extends Node {
  constructor(data) {
    super(data);
    this.id = "no_stone_unturned";
    this.name = nodeNames[this.id];
    this.position = 20;
    this.max_level = 50;
    this.upgrade_type = "glacite_powder";
    this.requires = ["strong_arm" /*, "metal_head", "mining_speed_2"*/];
    this.positionType = "cross";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.05));
  }

  perk(level) {
    const val = round(level * 0.5, 1);
    return [
      `§7Increases your chances of finding a §9Suspicious Scrap §7when mining in a §bGlacite Mineshaft by §a${val}%§7.`,
    ];
  }
}

class StrongArm extends Node {
  constructor(data) {
    super(data);
    this.id = "strong_arm";
    this.name = nodeNames[this.id];
    this.position = 21;
    this.max_level = 100;
    this.upgrade_type = "glacite_powder";
    this.requires = ["steady_hand" /*, "no_stone_unturned"*/];
    this.positionType = "horizontal_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 2.3));
  }

  perk(level) {
    const val = round(level * 5, 1);
    return [`§7Gain §6+${val} ${SYMBOLS.mining_speed} Mining Speed §7when mining §6Dwarven Metals§7.`];
  }
}

class SteadyHand extends Node {
  constructor(data) {
    super(data);
    this.id = "steady_hand";
    this.name = nodeNames[this.id];
    this.position = 22;
    this.max_level = 100;
    this.upgrade_type = "glacite_powder";
    this.requires = ["powder_buff" /*, "rags_to_riches", "strong_arm", "warm_hearted"*/];
    this.positionType = "cross";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 2.6));
  }

  perk(level) {
    const val = round(level * 0.1, 2);
    return [`§7Grants §e+${val} ${SYMBOLS.mining_spread} Gemstone Spread §7while in the §bGlacite Mineshafts§7.`];
  }
}

class WarmHeart extends Node {
  constructor(data) {
    super(data);
    this.id = "warm_hearted";
    this.name = nodeNames[this.id];
    this.position = 23;
    this.max_level = 50;
    this.upgrade_type = "glacite_powder";
    this.requires = ["steady_hand" /*, "surveyor"*/];
    this.positionType = "horizontal_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.1));
  }

  perk(level) {
    const val = round(level * 0.4, 1);
    return [`§7Grants §b+${val} ${SYMBOLS.cold_resistance} Cold Resistance§7.`];
  }
}

class Surveyor extends Node {
  constructor(data) {
    super(data);
    this.id = "surveyor";
    this.name = nodeNames[this.id];
    this.position = 24;
    this.max_level = 20;
    this.upgrade_type = "glacite_powder";
    this.requires = ["warm_hearted" /*, "eager_adventurer", "mining_fortune_2"*/];
    this.positionType = "cross";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 4));
  }

  perk(level) {
    const val = round(level * 0.75, 1);
    return [
      `§7Increases your chance of finding a §bGlacite Mineshaft §7when mining in the §bGlacite Tunnels §7by §a+${val}%§7.`,
    ];
  }
}

class MineshaftMayhem extends Node {
  constructor(data) {
    super(data);
    this.id = "mineshaft_mayhem";
    this.name = nodeNames[this.id];
    this.position = 25;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["surveyor"];
    this.positionType = "right_perk";
  }

  perk() {
    return [
      "§7Every time your enter a §bGlacite Mineshaft§7, you receive a random buff.",
      "",
      "§7Possible Buffs",
      "§8 ■ §a+5% §7chance to find a §9Suspicious Scrap§7.",
      `§8 ■ §7Gain §6+100 ${SYMBOLS.mining_fortune} Mining Fortune`,
      `§8 ■ §7Gain §6+200 ${SYMBOLS.mining_speed} Mining Speed`,
      `§8 ■ §7Gain §b+10 ${SYMBOLS.cold_resistance} Cold Resistance`,
      "§8 ■ §7Reduce Pickaxe Ability cooldowns by §a-25%§7.",
    ];
  }
}

// HOTM 7
class SpeedyMineman extends Node {
  constructor(data) {
    super(data);
    this.id = "mining_speed_2";
    this.name = nodeNames[this.id];
    this.position = 29;
    this.max_level = 50;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["blockhead" /*, "no_stone_unturned"*/];
    this.positionType = "vertical_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.2));
  }

  perk(level) {
    const val = round(level * 40, 1);
    return [`§7Grants §6+${val} ${SYMBOLS.mining_speed} Mining Speed§7.`];
  }
}

class PowderBuff extends Node {
  constructor(data) {
    super(data);
    this.id = "powder_buff";
    this.name = nodeNames[this.id];
    this.position = 31;
    this.max_level = 50;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["keep_it_cool" /*, "steady_hand"*/];
    this.positionType = "vertical_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.2));
  }

  perk(level) {
    const val = round(level * 1, 1);
    return [`§7Gain §a+${val}% §7more Powder from any source.`];
  }
}

class FortunateMineman extends Node {
  constructor(data) {
    super(data);
    this.id = "mining_fortune_2";
    this.name = nodeNames[this.id];
    this.position = 33;
    this.max_level = 50;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["great_explorer" /*, "surveyor"*/];
    this.positionType = "vertical_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.2));
  }

  perk(level) {
    const val = round(level * 3, 1);
    return [`§7Grants §6+${val} ${SYMBOLS.mining_fortune} Mining Fortune§7.`];
  }
}

// HOTM 6
class AnomalousDesire extends Node {
  constructor(data) {
    super(data);
    this.id = "anomalous_desire";
    this.name = nodeNames[this.id];
    this.position = 37;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["blockhead"];
    this.positionType = "right_ability";
  }

  get upgradeCost() {
    return 0;
  }

  perk() {
    const boost = [30, 40, 50][this.pickaxeAbilityLevel - 1];
    const duration = 30;
    const cooldown = [120, 110, 100][this.pickaxeAbilityLevel - 1];

    return [
      "§6Pickaxe Ability: Anomalous Desire",
      `§Increases the chances of triggering rare occurrences by §e+${boost}% §7for §a${duration}s§7.`,
      "",
      "§7Rare occurrences include:",
      "§8 ■ §6Golden Goblins.",
      "§8 ■ §5Fallen Stars.",
      "§8 ■ §6Powder Ghasts.",
      "§8 ■ §6Worms.",
      "§8 ■ §bGlacite Mineshafts.",
      `§8Cooldown: §a${cooldown}s`,
      "",
      "§8Pickaxe Abilities apply to all of your pickaxes. You can select a Pickaxe Ability from your Heart of the Mountain.",
      "",
      "§8Upgrade your Pickaxe Abilities by unlocking §cPeak of the Mountain §8in this menu!",
    ];
  }
}

class Blockhead extends Node {
  constructor(data) {
    super(data);
    this.id = "blockhead";
    this.name = nodeNames[this.id];
    this.position = 38;
    this.max_level = 20;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["subterranean_fisher" /*, "mining_speed_2", "daily_grind"*/];
    this.positionType = "cross";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 4));
  }

  perk(level) {
    const val = round(level * 5, 1);
    return [`§7Grants §6+${val} ${SYMBOLS.mining_fortune} Block Fortune§7.`];
  }
}

class SubterraneanFisher extends Node {
  constructor(data) {
    super(data);
    this.id = "subterranean_fisher";
    this.name = nodeNames[this.id];
    this.position = 39;
    this.max_level = 40;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["keep_it_cool" /*, "blockhead"*/];
    this.positionType = "horizontal_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.07));
  }

  perk(level) {
    const fs = 1 + level * 0.5; // Fishing Speed
    const scc = 1 + level * 0.1; // Sea Creature Chance

    return [
      `§7Grants §b+${fs} ${SYMBOLS.fishing_speed} Fishing Speed §7and §3+${scc} ${SYMBOLS.sea_creature_chance} Sea Creature Chance §7when in the §5Crystal Hollows §7and §bGlacite Tunnels§7.`,
    ];
  }
}

class KeepItCool extends Node {
  constructor(data) {
    super(data);
    this.id = "keep_it_cool";
    this.name = nodeNames[this.id];
    this.position = 40;
    this.max_level = 50;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["Mole" /*, "subterranean_fisher", "powder_buff", "lonesome_miner"*/];
    this.positionType = "cross";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.07));
  }

  perk(level) {
    const val = round(level * 0.4, 1);
    return [`§7Grants §c+${val} ${SYMBOLS.heat_resistance} Heat Resistance§7.`];
  }
}

class LonesomeMiner extends Node {
  constructor(data) {
    super(data);
    this.id = "lonesome_miner";
    this.name = nodeNames[this.id];
    this.position = 41;
    this.max_level = 45;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["goblin_killer" /*, "professional"*/];
    this.positionType = "horizontal_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.07));
  }

  perk(level) {
    const val = round(5 + (level - 1) * 0.5, 1);
    return [
      `§7Increases §c${SYMBOLS.strength} Strength, §9${SYMBOLS.crit_chance} Crit Chance, §9${SYMBOLS.crit_damage} Crit Damage, §a${SYMBOLS.defense} Defense, and §c${SYMBOLS.health} Health §7statistics gain by §a${val}% §7while on §bMining Islands§7.`,
    ];
  }
}

class GreatExplorer extends Node {
  constructor(data) {
    super(data);
    this.id = "great_explorer";
    this.name = nodeNames[this.id];
    this.position = 42;
    this.max_level = 20;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["lonesome_miner" /*, "daily_powder", "mining_fortune_2"*/];
    this.positionType = "cross";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 4));
  }

  perk(level) {
    const percentage = 20 + 4 * (level - 1);
    const val = round(1 + Math.floor(level / 5), 1);
    return [
      `§7Boosts the chance to find treasure chests while mining in the §5Crystal Hollows §7by §a+${percentage}% §7and reduces the amount of locks on the chest by §a${val}§7.`,
    ];
  }
}

class ManiacMiner extends Node {
  constructor(data) {
    super(data);
    this.id = "maniac_miner";
    this.name = nodeNames[this.id];
    this.position = 43;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["great_explorer"];
    this.nodeType = "pickaxe_ability";
    this.positionType = "left_ability";
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    const power = 1;
    const fortune = [5, 10, 15][this.pickaxeAbilityLevel - 1];
    const duration = [25, 30, 35][this.pickaxeAbilityLevel - 1];
    const cooldown = 60; // from the [hypixel wiki](https://wiki.hypixel.net/Heart_of_the_Mountain#Maniac_Miner_), in game says 120 ¯\_(ツ)_/¯

    return [
      "§6Pickaxe Ability: Maniac Miner",
      `§7Grants §2+${power} ${SYMBOLS.breaking_power} Breaking Power §7and a stack of §6+${fortune} ${SYMBOLS.mining_fortune} Mining Fortune §8(caps at 1000) §7per block broken for §a${duration}s§7.`,
      "§7Each block broken consumes §b20 Mana§7.",
      `§8Cooldown: §a${cooldown}s`,
      "",
      "§8Pickaxe Abilities apply to all of your pickaxes. You can select a Pickaxe Ability from your Heart of the Mountain.",
      "",
      "§8Upgrade your Pickaxe Abilities by unlocking §cPeak of the Mountain §8in this menu!",
    ];
  }
}

// HOTM 5
class DailyGrind extends Node {
  constructor(data) {
    super(data);
    this.id = "daily_grind";
    this.name = nodeNames[this.id];
    this.position = 47;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["old_school" /*, "blockhead"*/];
    this.positionType = "vertical_line";
  }

  get upgradeCost() {
    return 0;
  }

  perk() {
    const base = 500;
    const val = (base * this.hotmTier).toLocaleString();

    return [
      `§7Your first daily commission on each §bMining Island §7grants §9+${base} Powder§7, multiplied by your §5HOTM §7level.`,
      "",
      `§2Dwarven Mines§7: §a+${val} §2Mithril Powder`,
      `§5Crystal Hollows§7: §a+${val} §dGemstone Powder`,
      `§bGlacite Tunnels§7: §a+${val} §bGlacite Powder`,
    ];
  }
}

class CoreOfTheMountain extends Node {
  constructor(data) {
    super(data);
    this.id = "special_0";
    this.name = nodeNames[this.id];
    this.position = 49;
    this.max_level = 10;
    this.upgrade_type = data.level < 3 ? "mithril_powder" : data.level < 7 ? "gemstone_powder" : "glacite_powder"; // Mithril -> 1-3, Gemstone -> 4-7, Glacite -> 8-10
    this.requires = ["mole" /*, "keep_it_cool"*/];
    this.nodeType = "special";
    this.positionType = "peak_of_the_mountain";
  }

  get upgradeCost() {
    const levelCost = [
      0, // Level 1 (FREE)
      50000, // Level 2
      100000, // Level 3
      200000, // Level 4
      300000, // Level 5
      400000, // Level 6
      500000, // Level 7
      750000, // Level 8
      1000000, // Level 9
      1250000, // Level 10
    ];

    return levelCost[this.level];
  }

  perk(level) {
    const baseTier = level > this.level ? level : 1;

    const output = {};

    for (let tier = baseTier; tier <= level; tier++) {
      for (const [reward, qty] of Object.entries(rewards.potm[tier] ?? {})) {
        if (typeof qty === "number") {
          output[reward] = (output[reward] ?? 0) + qty;
        } else {
          const val = round(parseFloat(qty), 1);
          if (Number.isNaN(val)) {
            output[reward] = qty;
          } else {
            const suffix = qty.replace(val, "");
            output[reward] = parseFloat(output[reward] ?? 0) + val + suffix;
          }
        }
      }
    }

    return Object.entries(output)
      .sort(([, qty1], [, qty2]) => parseFloat(qty1) - parseFloat(qty2)) // sort by amount gained
      .map(([reward, qty]) => `§8+ §${rewards.rewards[reward].qtyColor}${qty} ${rewards.rewards[reward].formatted}`);
  }

  get unlockCost() {
    return {
      free: 0,
    };
  }
}

class DailyPowder extends Node {
  constructor(data) {
    super(data);
    this.id = "daily_powder";
    this.name = nodeNames[this.id];
    this.position = 51;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["mining_experience" /*, "great_explorer"*/];
    this.positionType = "vertical_line";
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    const base = 500;
    const val = (base * this.hotmTier).toLocaleString();

    return [
      `§7The first ore you mine each day grants §9+${base} Powder§7, multiplied by your §5HOTM §7level.`,
      "",
      `§2Mithril§7: §a+${val} §2Mithril Powder`,
      `§5Gemstone§7: §a+${val} §dGemstone Powder`,
      `§bGlacite§7: §a+${val} §bGlacite Powder`,
    ];
  }
}

// HOTM 4
class SkyMall extends Node {
  constructor(data) {
    super(data);
    this.id = "daily_effect";
    this.name = nodeNames[this.id];
    this.position = 55;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["old_school"];
    this.positionType = "left_perk";
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    return [
      "§7Every SkyBlock day, you receive a random buff while on any §bMining Island§7.",
      "",
      "§7Possible Buffs",
      `§8 ■ §7Gain §6+100 ${SYMBOLS.mining_speed} Mining Speed§7.`,
      `§8 ■ §7Gain §6+50 ${SYMBOLS.mining_fortune} Mining Fortune§7.`,
      "§8 ■ §7Gain §a+15% §7more Powder while mining.",
      "§8 ■ §a-20% §7Pickaxe Ability cooldowns.",
      "§8 ■ §7§a10x §7chance to find Golden and Diamond Goblins.",
      "§8 ■ §7Gain §a5x §9Titanium §7drops.",
    ];
  }
}

class OldSchool extends Node {
  constructor(data) {
    super(data);
    this.id = "old_school";
    this.name = nodeNames[this.id];
    this.position = 56;
    this.max_level = 20;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["professional" /*, "daily_grind", "random_event"*/];
    this.positionType = "cross";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 4));
  }

  perk(level) {
    const val = round(level * 5, 1);
    return [`§7Grants §6+${val} ${SYMBOLS.mining_fortune} Ore Fortune§7.`];
  }
}

class Professional extends Node {
  constructor(data) {
    super(data);
    this.id = "professional";
    this.name = nodeNames[this.id];
    this.position = 57;
    this.max_level = 140;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["mole"];
    this.positionType = "horizontal_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 2.3));
  }

  perk(level) {
    const val = round(50 + level * 5, 1);
    return [`§7Gain §6+${val} ${SYMBOLS.mining_speed} Mining Speed§7 when mining Gemstones.`];
  }
}

class Mole extends Node {
  constructor(data) {
    super(data);
    this.id = "mole";
    this.name = nodeNames[this.id];
    this.position = 58;
    this.max_level = 200;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["efficient_miner" /*, "professional", "fortunate"*/];
    this.positionType = "cross";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 2.17883));
  }

  perk(level) {
    const val = round(50 + (level - 1) * (350 / 199), 2);
    return [`§7Grants §e+${val} ${SYMBOLS.mining_spread} Mining Spread §7when mining Hard Stone.`];
  }
}

class GemLover extends Node {
  constructor(data) {
    super(data);
    this.id = "fortunate";
    this.name = nodeNames[this.id];
    this.position = 59;
    this.max_level = 20;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["mole" /*, "mining_experience"*/];
    this.positionType = "horizontal_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 4));
  }

  perk(level) {
    const val = round(20 + level * 4, 1);
    return [`§7Grants §6+${val} ${SYMBOLS.mining_fortune} Gemstone Fortune§7.`];
  }
}

class SeasonedMineman extends Node {
  constructor(data) {
    super(data);
    this.id = "mining_experience";
    this.name = nodeNames[this.id];
    this.position = 60;
    this.max_level = 100;
    this.upgrade_type = "gemstone_powder";
    this.requires = ["fortunate" /*, "forge_time", "daily_powder"*/];
    this.positionType = "cross";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 2.3));
  }

  perk(level) {
    const val = round(5 + level * 0.1, 1);
    return [`§7Grants §3+${val} ${SYMBOLS.mining_wisdom} Mining Wisdom§7.`];
  }
}

class FrontLoaded extends Node {
  constructor(data) {
    super(data);
    this.id = "front_loaded";
    this.name = nodeNames[this.id];
    this.position = 61;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["mining_experience"];
    this.positionType = "right_perk";
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    return [
      `§7Grants the following buffs for the first §a${(2500).toLocaleString()} §dGemstones §7you mine each day.`,
      "",
      " §8 ■ §d3x Gemstone Powder",
      ` §8 ■ §6+150 ${SYMBOLS.mining_fortune} Gemstone Fortune`,
      ` §8 ■ §6+250 ${SYMBOLS.mining_speed} Mining Speed`,
    ];
  }
}

// HOTM 3
class LuckOfTheCave extends Node {
  constructor(data) {
    super(data);
    this.id = "random_event";
    this.name = nodeNames[this.id];
    this.position = 65;
    this.max_level = 45;
    this.upgrade_type = "mithril_powder";
    this.requires = ["mining_speed_boost" /*, "mining_madness"*/];
    this.positionType = "vertical_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.07));
  }

  perk(level) {
    const val = round(5 + level, 1);
    return [
      `§7Increases the chance for you to trigger rare occurrences in the §2Dwarven Mines §7by §a${val}%§7.`,
      ``,
      `§7Rare occurrences include:`,
      `§8§l· §6Golden Goblins`,
      `§8§l· §5Fallen Stars`,
      `§8§l· §6Powder Ghasts`,
    ];
  }
}

class EfficientMiner extends Node {
  constructor(data) {
    super(data);
    this.id = "efficient_miner";
    this.name = nodeNames[this.id];
    this.position = 67;
    this.max_level = 100;
    this.upgrade_type = "mithril_powder";
    this.requires = ["mining_fortune" /*, "mole"*/];
    this.positionType = "vertical_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 2.6));
  }

  perk(level) {
    const val = floor(level * 3);
    return [`§7Grants §e+${val} ${SYMBOLS.mining_spread} Mining Spread§7.`];
  }
}

class QuickForge extends Node {
  constructor(data) {
    super(data);
    this.id = "forge_time";
    this.name = nodeNames[this.id];
    this.position = 69;
    this.max_level = 20;
    this.upgrade_type = "mithril_powder";
    this.requires = ["pickaxe_toss", "mining_experience"];
    this.positionType = "vertical_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.2));
  }

  perk(level) {
    const val = round(Math.min(30, 10 + level * 0.5 + Math.floor(level / 20) * 10), 1);
    return [`§7Decreases the time it takes to forge by §a${val}%§7.`];
  }
}

// HOTM 2
class MiningSpeedBoost extends Node {
  constructor(data) {
    super(data);
    this.id = "mining_speed_boost";
    this.name = nodeNames[this.id];
    this.position = 74;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["precision_mining" /*, "random_event"*/];
    this.nodeType = "pickaxe_ability";
    this.positionType = "left_l";
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    const effect = [200, 250, 300][this.pickaxeAbilityLevel - 1];
    const duration = [10, 15, 20][this.pickaxeAbilityLevel - 1];
    const cooldown = 120;
    return [
      "§6Pickaxe Ability: Mining Speed Boost",
      `§7Grants §6+${effect}% §6${SYMBOLS.mining_speed} Mining Speed §7for §a${duration}s§7.`,
      `§8Cooldown: §a${cooldown}s`,
      "",
      "§8Pickaxe Abilities apply to all of your pickaxes. You can select a Pickaxe Ability from your Heart of the Mountain.",
      "",
      "§8Upgrade your Pickaxe Abilities by unlocking §cPeak of the Mountain §8in this menu!",
    ];
  }
}

class PrecisionMining extends Node {
  constructor(data) {
    super(data);
    this.id = "precision_mining";
    this.name = nodeNames[this.id];
    this.position = 75;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["mining_fortune" /*, "mining_speed_boost"*/];
    this.positionType = "horizontal_line";
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    return [
      `§7When Mining §6Ores §7or §8Dwarven Metals§7, a particle target appears on the block that increases your §6${SYMBOLS.mining_speed} Mining Speed §7by §e30% §7when aiming at it.`,
    ];
  }
}

class MiningFortune extends Node {
  constructor(data) {
    super(data);
    this.id = "mining_fortune";
    this.name = nodeNames[this.id];
    this.position = 76;
    this.max_level = 50;
    this.upgrade_type = "mithril_powder";
    this.requires = ["mining_speed"];
    this.positionType = "cross";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.05));
  }

  perk(level) {
    const val = round(level * 2, 1);
    return [`§7Grants §6+${val} ${SYMBOLS.mining_fortune} Mining Fortune§7.`];
  }
}

class TitaniumInsanium extends Node {
  constructor(data) {
    super(data);
    this.id = "titanium_insanium";
    this.name = nodeNames[this.id];
    this.position = 77;
    this.max_level = 50;
    this.upgrade_type = "mithril_powder";
    this.requires = ["mining_fortune"];
    this.positionType = "horizontal_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3.1));
  }

  perk(level) {
    const val = round(2 + level * 0.1, 1);
    return [`§7When mining §2Mithril Ore§7, you have a §a${val}% §7chance to convert the block into §rTitanium Ore§7.`];
  }
}

class Pickobulus extends Node {
  constructor(data) {
    super(data);
    this.id = "pickaxe_toss";
    this.name = nodeNames[this.id];
    this.position = 78;
    this.max_level = 1;
    this.upgrade_type = null;
    this.requires = ["titanium_insanium", "forge_time"];
    this.nodeType = "pickaxe_ability";
    this.positionType = "right_l";
  }

  get upgradeCost() {
    return 0;
  }

  perk(level) {
    const radius = 3;
    const cooldown = [60, 50, 40][this.pickaxeAbilityLevel - 1];
    return [
      "§6Pickaxe Ability: Pickobulus",
      `§7Throw your pickaxe to create an explosion mining all ores in a §a${radius} §7block radius.`,
      `§8Cooldown: §a${cooldown}s`,
      "",
      "§8Pickaxe Abilities apply to all of your pickaxes. You can select a Pickaxe Ability from your Heart of the Mountain.",
      "",
      "§8Upgrade your Pickaxe Abilities by unlocking §cPeak of the Mountain §8in this menu!",
    ];
  }
}

// HOTM 1
class MiningSpeed extends Node {
  constructor(data) {
    super(data);
    this.id = "mining_speed";
    this.name = nodeNames[this.id];
    this.position = 85;
    this.max_level = 50;
    this.upgrade_type = "mithril_powder";
    this.requires = [];
    this.positionType = "vertical_line";
  }

  get upgradeCost() {
    const nextLevel = this.level + 1;
    return floor(Math.pow(nextLevel + 1, 3));
  }

  perk(level) {
    const val = round(level * 20, 1);
    return [`§7Grants §6+${val} ${SYMBOLS.mining_speed} Mining Speed§7.`];
  }
}

/*
 .####.########.########.##.....##..######.
 ..##.....##....##.......###...###.##....##
 ..##.....##....##.......####.####.##......
 ..##.....##....######...##.###.##..######.
 ..##.....##....##.......##.....##.......##
 ..##.....##....##.......##.....##.##....##
 .####....##....########.##.....##..######.
 */

class HotmItem {
  get position10x9() {
    return 9 * (HOTM.tiers - this.position) + 9;
  }
}

class HotmStats extends HotmItem {
  constructor(data) {
    super();
    this.displayName = "§5Heart of the Mountain";
    this.position = 1;
    this.itemData = {
      id: 397,
      Damage: 3,
      glowing: false,
      texture_path: "/head/86f06eaa3004aeed09b3d5b45d976de584e691c0e9cade133635de93d23b9edb",
    };
    this.resources = {
      token_of_the_mountain: data.resources.token_of_the_mountain.available || 0,
      mithril_powder: data.resources.mithril_powder.available || 0,
      gemstone_powder: data.resources.gemstone_powder.available || 0,
    };
  }

  get lore() {
    return [
      `§7Token of the Mountain: §5${this.resources.token_of_the_mountain.toLocaleString()}`,
      "",
      "§7§8Use §5Token of the Mountain §8to unlock perks and abilities above!",
      "",
      `§9${SYMBOLS.powder} Powder`,
      "§9Powders §8are dropped from mining ores in the §2Dwarven Mines §8and are used to upgrade the perks you've unlocked!",
      "",
      `§7Mithril Powder: §2${this.resources.mithril_powder.toLocaleString()}`,
      `§7Gemstone Powder: §d${this.resources.gemstone_powder.toLocaleString()}`,
      "",
      "§8Increase your chance to gain extra Powder by unlocking perks, equipping the §2Mithril Golem Pet§8, and more!",
    ];
  }
}

class CrystalHollowsCrystals extends HotmItem {
  constructor(data) {
    super();
    this.displayName = "§5Crystal Hollows Crystals";
    this.position = 2;
    this.itemData = {
      id: 397,
      Damage: 3,
      glowing: false,
      texture_path: "/head/ef7835fc9e6daf632160e9b7ff378788a408064cc75ebf9f5158e615bdd59603",
      skyblock_id: "hotm_crystal",
    };
    this.crystals = data.crystals;
  }

  get lore() {
    return [
      "§8Crystals are used to forge Gems into §dPerfect §8Gems. They can be found hidden within the §5Crystal Hollows§8.",
      "",
      "§8Find and place the full set of §55 §8Crystals in the §5Crystal Nucleus §8to unlock §6rare loot chests§8!",
      "",
      "§dYour §5Crystal Nucleus",
      `§8- §aJade ${this.formatCrystal("jade", this.crystals.jade_crystal?.state)}`,
      `§8- §6Amber ${this.formatCrystal("amber", this.crystals.amber_crystal?.state)}`,
      `§8- §5Amethyst ${this.formatCrystal("amethyst", this.crystals.amethyst_crystal?.state)}`,
      `§8- §bSapphire ${this.formatCrystal("sapphire", this.crystals.sapphire_crystal?.state)}`,
      `§8- §eTopaz ${this.formatCrystal("topaz", this.crystals.topaz_crystal?.state)}`,
      "",
      "§dYour Other Crystals",
      `§8- §dJasper ${this.formatCrystal("jasper", this.crystals.jasper_crystal?.state)}`,
      `§8- §cRuby ${this.formatCrystal("ruby", this.crystals.ruby_crystal?.state)}`,
      `§8- §fOpal ${this.formatCrystal("opal", this.crystals.opal_crystal?.state)}`,
      `§8- §bAquamarine ${this.formatCrystal("aquamarine", this.crystals.aquamarine_crystal?.state)}`,
      `§8- §2Peridot ${this.formatCrystal("peridot", this.crystals.peridot_crystal?.state)}`,
      `§8- §4Citrine ${this.formatCrystal("citrine", this.crystals.citrine_crystal?.state)}`,
      `§8- §0Onyx ${this.formatCrystal("onyx", this.crystals.onyx_crystal?.state)}`,
    ];
  }

  formatCrystal(crystal, state) {
    if (!state) {
      state = "NOT_FOUND";
    }
    let formatted = state.split("_").join(" ").trim();
    formatted = titleCase(formatted);

    let color = "r";
    let symbol = "";
    switch (state) {
      case "NOT_FOUND":
        color = "c";
        symbol = "✖";
        break;
      case "FOUND":
        color = "e";
        symbol = "✖";
        break;
      case "PLACED":
        color = "a";
        symbol = "✔";
        break;
    }

    // Jasper and Ruby do not have a PLACED state
    if (["jasper", "ruby", "opal", "aquamarine", "peridot", "citrine", "onyx"].includes(crystal) && state === "FOUND") {
      color = "a";
      symbol = "✔";
    }

    return `§${color}${symbol} ${formatted}`;
  }
}

class HotmReset extends HotmItem {
  constructor(data) {
    super();
    this.displayName = "§cReset Heart of the Mountain";
    this.position = 3;
    this.itemData = {
      id: 397,
      Damage: 3,
      glowing: false,
      texture_path: "/head/6448e275313532f54c4ba21894809a23dce52af01ddd1e89fc7689481fab737e",
      skyblock_id: "hotm_reset",
    };
    this.last_reset = data.last_reset;
    this.resources = {
      token_of_the_mountain: data.resources.token_of_the_mountain.spent || 0,
      mithril_powder: data.resources.mithril_powder.spent || 0,
      gemstone_powder: data.resources.gemstone_powder.spent || 0,
    };
  }

  get lore() {
    const output = [
      "§7Resets the Perks and Abilities of your §5Heart of the Mountain§7, locking them and resetting their levels.",
      "",
      "§7You will be reimbursed with:",
      `§8- §5${this.resources.token_of_the_mountain.toLocaleString()} Token of the Mountain`,
      `§8- §2${this.resources.mithril_powder.toLocaleString()} Mithril Powder`,
      `§8- §d${this.resources.gemstone_powder.toLocaleString()} Gemstone Powder`,
      `§8- §b${this.resources.gemstone_powder.toLocaleString()} Glacite Powder`,
      "",
      "§7You will §akeep §7any Tiers and §cPeak of the Mountain §7that you have unlocked.",
    ];

    // cost
    output.push("", "§7Cost");
    if (this.last_reset === 0) {
      output.push("§aFREE §7for your first reset.");
    } else {
      output.push("§6100,000 Coins");
    }

    // cooldown or warning
    if (Date.now() - this.last_reset > 24 * 60 * 60 * 1000) {
      output.push(
        "",
        "§7§c§lWARNING: This is permanent.",
        "§c§lYou can not go back after resetting your Heart of the Mountain!",
      );
    } else {
      const timeLeft = Math.abs(Date.now() - (this.last_reset + 24 * 60 * 60 * 1000)); // ms
      output.push("", `§c§lYou can reset again in ${convertHMS(timeLeft / 1000, "friendlyhhmm")}`);
    }

    return output;
  }
}

/*
 .########.##.....##.########...#######..########..########..######.
 .##........##...##..##.....##.##.....##.##.....##....##....##....##
 .##.........##.##...##.....##.##.....##.##.....##....##....##......
 .######......###....########..##.....##.########.....##.....######.
 .##.........##.##...##........##.....##.##...##......##..........##
 .##........##...##..##........##.....##.##....##.....##....##....##
 .########.##.....##.##.........#######..##.....##....##.....######.
 */

const nodeClasses = {
  // HOTM 10
  gemstone_infusion: GemstoneInfusion,
  crystalline: Crystalline,
  gifts_from_the_departed: GiftsFromTheDeparted,
  mining_master: MiningMaster,
  hungry_for_more: DeadMansChest,
  vanguard_seeker: VanguardSeeker,
  sheer_force: SheerForce,
  // HOTM 9
  metal_head: MetalHead,
  rags_to_riches: RagsToRiches,
  eager_adventurer: EagerAdventurer,
  // HOTM 8
  miners_blessing: MinersBlessing,
  no_stone_unturned: NoStoneUnturned,
  strong_arm: StrongArm,
  steady_hand: SteadyHand,
  warm_hearted: WarmHeart,
  surveyor: Surveyor,
  mineshaft_mayhem: MineshaftMayhem,
  // HOTM 7
  mining_speed_2: SpeedyMineman,
  powder_buff: PowderBuff,
  mining_fortune_2: FortunateMineman,
  // HOTM 6
  anomalous_desire: AnomalousDesire,
  blockhead: Blockhead,
  subterranean_fisher: SubterraneanFisher,
  keep_it_cool: KeepItCool,
  lonesome_miner: LonesomeMiner,
  great_explorer: GreatExplorer,
  maniac_miner: ManiacMiner,
  // HOTM 5
  daily_grind: DailyGrind,
  special_0: CoreOfTheMountain,
  daily_powder: DailyPowder,
  // HOTM 4
  daily_effect: SkyMall,
  old_school: OldSchool,
  professional: Professional,
  mole: Mole,
  fortunate: GemLover,
  mining_experience: SeasonedMineman,
  front_loaded: FrontLoaded,
  // HOTM 3
  random_event: LuckOfTheCave,
  efficient_miner: EfficientMiner,
  forge_time: QuickForge,
  // HOTM 2
  mining_speed_boost: MiningSpeedBoost,
  precision_mining: PrecisionMining,
  mining_fortune: MiningFortune,
  titanium_insanium: TitaniumInsanium,
  pickaxe_toss: Pickobulus,
  // HOTM 1
  mining_speed: MiningSpeed,
};

const powderForMaxNodes = {};
for (const nodeClass of Object.values(nodeClasses)) {
  const node = new nodeClass({
    level: 0,
    enabled: true,
    nodes: [],
    hotmLevelData: {
      level: Object.keys(rewards.hotm).length,
    },
  });

  if (node.nodeType === "normal" && node.upgrade_type !== null) {
    powderForMaxNodes[node.upgrade_type] ??= 0;
    powderForMaxNodes[node.upgrade_type] += node.totalUpgradeCost;
  }
}

export const HOTM = {
  tiers: Object.keys(rewards.hotm).length,
  rewards: rewards,
  names: nodeNames,
  hotm: HotM,
  nodes: nodeClasses,
  items: [HotmStats, CrystalHollowsCrystals, HotmReset],
  powder_for_max_nodes: powderForMaxNodes,
};

export const PRECURSOR_PARTS = {
  ELECTRON_TRANSMITTER: "Electron Transmitter",
  FTX_3070: "FTX 3070",
  ROBOTRON_REFLECTOR: "Robotron Reflector",
  SUPERLITE_MOTOR: "Superlite Motor",
  CONTROL_SWITCH: "Control Switch",
  SYNTHETIC_HEART: "Synthetic Heart",
};

export const COMMISSIONS_MILESTONE = 6;

export const MAX_PEAK_OF_THE_MOUNTAIN_LEVEL = 10;
