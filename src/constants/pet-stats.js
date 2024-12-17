import { SYMBOLS, RARITIES } from "../../common/constants.js";
import { round, floor } from "../helper.js";

const COMMON = RARITIES.indexOf("common");
const UNCOMMON = RARITIES.indexOf("uncommon");
const RARE = RARITIES.indexOf("rare");
const EPIC = RARITIES.indexOf("epic");
const LEGENDARY = RARITIES.indexOf("legendary");
const MYTHIC = RARITIES.indexOf("mythic");

function formatStat(stat, red = false) {
  const formattedStat = stat.toFixed(2).replace(/\.?0+$/, "");
  const color = red ? "§c" : "§a";
  if (stat > 0) {
    return `${color}+${formattedStat}`;
  } else {
    return `${color}${formattedStat}`;
  }
}

function getValue(rarity, data) {
  const base = Object.values(data)[0];
  const common = data.common ?? base;
  const uncommon = data.uncommon ?? common;
  const rare = data.rare ?? uncommon;
  const epic = data.epic ?? rare;
  const legendary = data.legendary ?? epic;
  const mythic = data.mythic ?? legendary;

  switch (rarity) {
    case COMMON:
      return common;
    case UNCOMMON:
      return uncommon;
    case RARE:
      return rare;
    case EPIC:
      return epic;
    case LEGENDARY:
      return legendary;
    case MYTHIC:
      return mythic;
    default:
      console.log(`Unknown rarity: ${rarity}`);
    // throw new Error("Unknown rarity");
  }
}

class Pet {
  constructor(rarity, level, extra, profile) {
    this.rarity = rarity;
    this.level = level;
    this.extra = extra;
    this.profile = profile;
  }

  lore(newStats = false) {
    if (!newStats) {
      newStats = this.stats;
    }
    const list = [];
    for (const stat in newStats) {
      switch (stat) {
        case "health":
          list.push(`§7Health: ${formatStat(newStats[stat])}`);
          break;
        case "defense":
          list.push(`§7Defense: ${formatStat(newStats[stat])}`);
          break;
        case "strength":
          list.push(`§7Strength: ${formatStat(newStats[stat], true)}`);
          break;
        case "crit_chance":
          list.push(`§7Crit Chance: ${formatStat(newStats[stat], true)}%`);
          break;
        case "crit_damage":
          list.push(`§7Crit Damage: ${formatStat(newStats[stat], true)}%`);
          break;
        case "intelligence":
          list.push(`§7Intelligence: ${formatStat(newStats[stat])}`);
          break;
        case "speed":
          list.push(`§7Speed: ${formatStat(newStats[stat])}`);
          break;
        case "bonus_attack_speed":
          list.push(`§7Bonus Attack Speed: ${formatStat(newStats[stat], true)}%`);
          break;
        case "sea_creature_chance":
          list.push(`§7Sea Creature Chance: ${formatStat(newStats[stat], true)}%`);
          break;
        case "magic_find":
          list.push(`§7Magic Find: ${formatStat(newStats[stat])}`);
          break;
        case "pet_luck":
          list.push(`§7Pet Luck: ${formatStat(newStats[stat])}`);
          break;
        case "true_defense":
          list.push(`§7True Defense: ${formatStat(newStats[stat])}`);
          break;
        case "ability_damage":
          list.push(`§7Ability Damage: ${formatStat(newStats[stat])}%`);
          break;
        case "damage":
          list.push(`§7Damage: ${formatStat(newStats[stat])}`);
          break;
        case "ferocity":
          list.push(`§7Ferocity: ${formatStat(newStats[stat], true)}`);
          break;
        case "mining_speed":
          list.push(`§7Mining Speed: ${formatStat(newStats[stat])}`);
          break;
        case "mining_fortune":
          list.push(`§7Mining Fortune: ${formatStat(newStats[stat])}`);
          break;
        case "farming_fortune":
          list.push(`§7Farming Fortune: ${formatStat(newStats[stat])}`);
          break;
        case "health_regen":
          list.push(`§7Health Regen: ${formatStat(newStats[stat])}`);
          break;
        case "fishing_speed":
          list.push(`§7Fishing Speed: ${formatStat(newStats[stat])}`);
          break;
        case "rift_time":
          list.push(`§7Rift Time: §a${formatStat(newStats[stat])}s`);
          break;
        case "mana_regen":
          list.push(`§7Mana Regen: §a${formatStat(newStats[stat])}%`);
          break;
        case "foraging_fortune":
          list.push(`§7Foraging Fortune: ${formatStat(newStats[stat])}`);
          break;
        case "vitality":
          list.push(`§7Vitality: ${formatStat(newStats[stat])}`);
          break;
        case "mending":
          list.push(`§7Mending: ${formatStat(newStats[stat])}`);
          break;
        case "swing_range":
          list.push(`§7Swing Range: ${formatStat(newStats[stat])}`);
          break;
        case "cold_resistance":
          list.push(`§7Cold Resistance: ${formatStat(newStats[stat])}`);
          break;
        case "heat_resistance":
          list.push(`§7Heat Resistance: ${formatStat(newStats[stat])}`);
          break;
        default:
          list.push(`§cUNKNOWN: ${stat}`);
          break;
      }
    }
    return list;
  }
}

class Bee extends Pet {
  get stats() {
    if (this.rarity >= RARE) {
      const fortMult = getValue(this.rarity, { rare: 0.2, epic: 0.3 });
      return {
        strength: 5 + this.level * 0.25,
        intelligence: this.level * 0.5,
        speed: this.level * 0.1,
        mining_fortune: this.level * fortMult,
        farming_fortune: this.level * fortMult,
        foraging_fortune: this.level * fortMult,
      };
    }

    return {
      strength: 5 + this.level * 0.25,
      intelligence: this.level * 0.5,
      speed: this.level * 0.1,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const intMult = getValue(this.rarity, { common: 0.03, rare: 0.06, epic: 0.1 });
    const strMult = getValue(this.rarity, { common: 0.03, rare: 0.05, epic: 0.08 });
    const defMult = getValue(this.rarity, { common: 0.02, rare: 0.03, epic: 0.05 });

    return {
      name: "§6Hive",
      desc: [
        `§7For each player within §a25 §7blocks:`,
        `§b+${round(this.level * intMult, 1)} ${SYMBOLS.intelligence} Intelligence`,
        `§c+${round(this.level * strMult, 1)} ${SYMBOLS.strength} Strength`,
        `§a+${round(this.level * defMult, 1)} ${SYMBOLS.defense} Defense`,
        `§8Max 15 players`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.2, epic: 0.3 });
    return {
      name: "§6Busy Buzz Buzz",
      desc: [
        `§7Grants §a+${round(this.level * mult, 1)} §7of each to your pet:`,
        `§6${SYMBOLS.farming_fortune} Farming Fortune`,
        `§6${SYMBOLS.foraging_fortune} Foraging Fortune`,
        `§6${SYMBOLS.mining_fortune} Mining Fortune`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.2 });
    return {
      name: "§6Weaponized Honey",
      desc: [`§7Gain §a${round(5 + this.level * mult, 1)}% §7of received damage as §6${SYMBOLS.health} Absorption§7.`],
    };
  }
}

class Chicken extends Pet {
  get stats() {
    return {
      health: this.level * 2,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.3, uncommon: 0.4, epic: 0.5 });
    return {
      name: "§6Light Feet",
      desc: [`§7Reduces fall damage by §a${round(this.level * mult, 1)}%§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.75, epic: 1 });
    return {
      name: "§6Eggstra",
      desc: [`§7Killing chickens has a §a${round(this.level * mult, 1)}% §7chance to drop an egg§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.3 });
    return {
      name: "§6Mighty Chickens",
      desc: [`§7Chicken minions work §a${round(this.level * mult, 1)}% §7faster while on your island§7.`],
    };
  }
}

class Eerie extends Pet {
  get stats() {
    return {
      speed: this.level * 0.1,
      intelligence: this.level * 0.5,
    };
  }

  get abilities() {
    const list = [this.first];

    if (this.rarity >= RARE) {
      list.push(this.second);
    }

    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }

    return list;
  }

  get first() {
    return {
      name: "§6Fearnesy",
      desc: [
        "§5Fear §7from §5Great Spook §5Armor §7in your §bwardrobe §7applies to you, even if you aren't wearing it.",
      ],
    };
  }

  get second() {
    return {
      name: "§6Fearama",
      desc: [`§7Increases §cdamage §7dealt to Spooky Mobs by §a0.1 §7or §a1% §7for every §5Fear §7you have.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.01 });

    const primalFearKills = this.profile.kills
      ? this.profile.kills.kills.find((mob) => mob.entityId === "primal_fear")?.amount ?? 0
      : 0;
    const kills = Math.max(primalFearKills, 150);

    const killsFormatted = kills >= 150 ? `§a${kills}` : `§c${kills}`;

    return {
      name: "§6Fearcreasing",
      desc: [
        `§7Gives §a${round(
          (this.level / 2) * mult,
          1,
        )} §5Fear §7for every §a10 §cPrimal Fears §7killed, up to §a150 §cPrimal Fears§7.`,
        `§cPrimal Fear Kills§7: (${killsFormatted}§7/§a150§7)`,
      ],
    };
  }
}

class Elephant extends Pet {
  get stats() {
    return {
      health: this.level * 1,
      intelligence: this.level * 0.75,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.1, uncommon: 0.15, epic: 0.2 });
    return {
      name: "§6Stomp",
      desc: [
        `§7Gain §a${round(this.level * mult, 1)} ${SYMBOLS.defense} Defense §7for every §f100 ${
          SYMBOLS.speed
        } Speed§7.`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.01 });
    return {
      name: "§6Walking Fortress",
      desc: [
        `§7Gain §c${round(this.level * mult, 1)} ${SYMBOLS.health} Health §7for every §a10 ${
          SYMBOLS.defense
        } Defense§7.`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 1.5 });
    return {
      name: "§6Trunk Efficiency",
      desc: [
        `§7Grants §a+${round(this.level * mult, 1)} §6${
          SYMBOLS.farming_fortune
        } Farming Fortune§7, which increases your chance for multiple drops§7.`,
      ],
    };
  }
}

class Pig extends Pet {
  get stats() {
    return {
      speed: this.level * 0.25,
    };
  }

  get abilities() {
    const list = [this.first, this.second];
    if (this.rarity >= RARE) {
      list.push(this.third);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    return {
      name: "§6Ridable",
      desc: [`§7Right-click your summoned pet to ride it!`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { common: 0.3, uncommon: 0.4, epic: 0.5 });
    return {
      name: "§6Run",
      desc: [`§7Increases the speed of your mount by §a${round(this.level * mult, 1)}%`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { rare: 0.4, epic: 0.5 });
    return {
      name: "§6Sprint",
      desc: [
        `§7While holding an §aEnchanted Carrot on a Stick§7, increase the speed of your mount by §a${round(
          this.level * mult,
          1,
        )}%§7.`,
      ],
    };
  }

  get fourth() {
    return {
      name: "§6Trample",
      desc: [
        `§7Your pig will break all crops that it walks over while on your private island or Garden. While riding, §6${SYMBOLS.farming_fortune} Farming Fortune §7and §aFarming Exp §7gain is reduced by §a75%§7.`,
      ],
    };
  }
}

class Rabbit extends Pet {
  get stats() {
    return {
      health: this.level * 1,
      speed: this.level * 0.2,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    if (this.rarity >= MYTHIC) {
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.3, uncommon: 0.4, epic: 0.5 });
    return {
      name: "§6Happy Feet ",
      desc: [`§7Jump Potions also give §a+${round(this.level * mult, 0)} §7speed§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.25, epic: 0.3 });
    return {
      name: "§6Farming Wisdom Boost ",
      desc: [`§7Grants §3+${round(this.level * mult, 1)} ${SYMBOLS.farming_wisdom} Farming Wisdom§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.3 });
    return {
      name: "§6Efficient Farming",
      desc: [`§7Farming minions work §a${round(this.level * mult, 1)}% §7faster while on your island.`],
    };
  }

  get fourth() {
    return {
      name: "§6Chocolate Injections",
      desc: [
        `§7Increases §6Chocolate Factory§7 production by §a+${round(0.01 + (this.level - 1) * 0.0004, 3)}x§7. Duplicate §aChocolate Rabbits§7 that you find grant §6${round(1.3 + (this.level - 1) * 0.32, 1)}% Chocolate§7.`,
      ],
    };
  }
}

class Armadillo extends Pet {
  get stats() {
    return {
      defense: this.level * 2,
    };
  }

  get abilities() {
    const list = [this.first, this.second];
    if (this.rarity >= RARE) {
      list.push(this.third);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    return {
      name: "§6Rideable",
      desc: [`§7Right-click on your summoned pet to ride it! Moves faster based on your §f${SYMBOLS.speed} Speed§7.`],
    };
  }

  get second() {
    return {
      name: "§6Tunneler",
      desc: [`§7While riding in the §5Crystal Hollows§7, this Pet breaks all blocks in its path using your held item.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { rare: 0.2, epic: 0.3, legendary: 0.4 });
    return {
      name: "§6Rolling Miner",
      desc: [
        `§7Every §a${round(60 - this.level * mult, 1)} §7seconds, the next §5Gemstone§7 you mine gives §a2x §7drops.`,
      ],
    };
  }

  get fourth() {
    return {
      name: "§6Long Claws",
      desc: [`§7Grants §e+${round(this.level * 3)} ${SYMBOLS.mining_spread} Mining Spread§7 while mining Hard Stone.`],
    };
  }
}

class Bat extends Pet {
  get stats() {
    const stats = {
      intelligence: this.level * 1,
      speed: this.level * 0.05,
    };
    if (this.rarity >= MYTHIC) {
      stats.sea_creature_chance = this.level * 0.05;
    }
    return stats;
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    if (this.rarity >= MYTHIC) {
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.1, uncommon: 0.15, epic: 0.2 });
    return {
      name: "§6Candy Lover",
      desc: [`§7Increases the chance for mobs to drop Candy by §a${round(this.level * mult, 1)}%§7.`],
    };
  }

  get second() {
    const multIntel = getValue(this.rarity, { rare: 0.2, epic: 0.3 });
    const multSpeed = getValue(this.rarity, { rare: 0.4, epic: 0.5 });
    return {
      name: "§6Nightmare",
      desc: [
        `§7During night, gain §a${round(this.level * multIntel, 1)} §b${SYMBOLS.intelligence} Intelligence§7, §a${round(
          this.level * multSpeed,
          1,
        )} §f${SYMBOLS.speed} Speed §7and §aNight Vision§7.`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.5 });
    return {
      name: "§6Wings of Steel",
      desc: [
        `§7Deals §a+${round(this.level * mult, 1)}% §7damage to §6Spooky §7enemies during the §6Spooky Festival§7.`,
      ],
    };
  }

  get fourth() {
    const mult = getValue(this.rarity, { mythic: 0.25 });
    return {
      name: "§6Sonar",
      desc: [`§7+§a${round(this.level * mult, 1)}% §7chance to fish up spooky sea creatures§7.`],
    };
  }
}

class Endermite extends Pet {
  get stats() {
    return {
      intelligence: this.level * 1.5,
      pet_luck: this.level * 0.1,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }

    if (this.rarity >= MYTHIC) {
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.5, uncommon: 0.75, epic: 1 });
    return {
      name: "§6More Stonks",
      desc: [
        `§7Gain more exp orbs for breaking end stone and gain a +§a${round(
          this.level * mult,
          1,
        )}% §7chance to get an extra block dropped.`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.3, epic: 0.4 });
    return {
      name: "§6Daily Commuter",
      desc: [`§9Transmission Abilities §7cost §a${round(this.level * mult, 1)}% §7less mana.`],
    };
  }

  get third() {
    return {
      name: "§6Mite Bait",
      desc: [
        `§7Gain a §a${round(this.level * 0.03, 1)}% §7chance to dig up a bonus §cNest Endermite §7per §d+1 ${
          SYMBOLS.pet_luck
        } Pet Luck §8(Stacks above 100%)`,
      ],
    };
  }

  get fourth() {
    return {
      name: "§6Sacrificer",
      desc: [
        `§7Increases the odds of rolling for bonus items in the §cDraconic Altar §7by §a${round(
          this.level * 0.1,
          1,
        )}%§7.`,
      ],
    };
  }
}

class MithrilGolem extends Pet {
  get stats() {
    return {
      true_defense: this.level * 0.5,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    if (this.rarity >= MYTHIC) {
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.5, uncommon: 0.75, epic: 1 });
    return {
      name: "§6Mithril Affinity",
      desc: [
        `§7Gain +§a${round(this.level * mult, 1)} §6${SYMBOLS.mining_speed} Mining Speed §7when mining §eMithril§7.`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.1, epic: 0.2 });
    return {
      name: "§6The Smell Of Powder",
      desc: [`§7Gain §a+${round(this.level * mult, 1)}% §7more §2Mithril Powder §7while mining.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.2 });
    return {
      name: "§6Danger Averse",
      desc: [`§7Increases MOST combat stats by §a+${round(this.level * mult, 1)}% §7on mining islands.`],
    };
  }

  get fourth() {
    const mult = getValue(this.rarity, { mythic: 0.1 });
    return {
      name: "§6Refined Senses",
      desc: [
        `§7Increases your §b${SYMBOLS.magic_find} Magic find §7by §a${round(
          this.level * mult,
          1,
        )}% §7when on a Mining Island.`,
      ],
    };
  }
}

class Rock extends Pet {
  get stats() {
    return {
      defense: this.level * 2,
      true_defense: this.level * 0.1,
    };
  }

  get abilities() {
    const list = [this.first, this.second];
    if (this.rarity >= RARE) {
      list.push(this.third);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    return {
      name: "§6Ridable",
      desc: [`§7Right-click on your summoned pet to ride it!`],
    };
  }

  get second() {
    return {
      name: "§6Sailing Stone",
      desc: [`§7Sneak to move your rock to your location (15s cooldown)§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { rare: 0.2, epic: 0.25 });
    return {
      name: "§6Fortify",
      desc: [`§7While sitting on your rock, gain §a+${round(this.level * mult, 1)}% §7defense.`],
    };
  }

  get fourth() {
    const mult = getValue(this.rarity, { legendary: 0.3 });
    return {
      name: "§6Steady Ground",
      desc: [`§7While sitting on your rock, gain §c+${round(this.level * mult, 1)}% §7damage.`],
    };
  }
}

class Scatha extends Pet {
  get stats() {
    return {
      defense: this.level * 1,
      mining_speed: this.level * 1,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= EPIC) {
      list.push(this.third);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { rare: 1, epic: 1.25 });
    return {
      name: "§6Grounded",
      desc: [`§7Gain §6+${round(this.level * mult - 0.01, 1)}${SYMBOLS.mining_fortune} Mining Fortune§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.025, epic: 0.03 });
    return {
      name: "§6Burrowing",
      desc: [`§7Grants a §a+${round(this.level * mult, 1)}% §7chance to find treasure while mining.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 1 });
    return {
      name: "§6Wormhole",
      desc: [`§7Gives a §a${round(this.level * mult, 1)}% §7to mine 2 adjacent stone or hard stone.`],
    };
  }
  get fourth() {
    const mult = getValue(this.rarity, { legendary: 0.2 });
    return {
      name: "§6Gemstone Power",
      desc: [`§7Gain §a+${round(this.level * mult, 1)}% §7more §dGemstone Powder§7.`],
    };
  }
}

class Silverfish extends Pet {
  get stats() {
    return {
      defense: this.level * 1,
      health: this.level * 0.2,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.05, uncommon: 0.1, epic: 0.15 });
    return {
      name: "§6True Defense Boost",
      desc: [`§7Boosts your §f${SYMBOLS.true_defense} True Defense §7by §a${floor(this.level * mult, 1)}§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.25, epic: 0.3 });
    return {
      name: "§6Mining Wisdom Boost",
      desc: [`§7Grants §3+${round(this.level * mult, 1)} ${SYMBOLS.mining_wisdom} Mining Wisdom§7.`],
    };
  }

  get third() {
    return {
      name: "§6Dexterity",
      desc: [`§7Gives permanent haste III§7.`],
    };
  }
}

class Slug extends Pet {
  get stats() {
    return {
      intelligence: this.level * 0.25,
      defense: this.level * 0.2,
    };
  }

  get abilities() {
    const list = [this.first, this.second];

    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { epic: 0.2 });
    return {
      name: "§6Slow and Steady",
      desc: [
        `§7When fishing in the §cCrimson §cIsle§7, §aSlugfish §7take §a${round(
          this.level * mult,
          1,
        )}% §7less time to catch.`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { epic: 0.4 });
    return {
      name: "§6Pest Friends",
      desc: [`§7Grants §a${round(this.level * mult, 1)} §a${SYMBOLS.bonus_pest_chance} Bonus Pest Chance.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 1 });
    return {
      name: "§6Repugnant Aroma",
      desc: [
        `§7When farming in a plot affected by a §aSprayonator§7, gain §6+${round(this.level * mult, 1)} ${
          SYMBOLS.farming_fortune
        } Farming Fortune§7.`,
      ],
    };
  }
}

class WitherSkeleton extends Pet {
  get stats() {
    return {
      crit_damage: this.level * 0.25,
      intelligence: this.level * 0.25,
      defense: this.level * 0.25,
      strength: this.level * 0.25,
      crit_chance: this.level * 0.05,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { epic: 0.3 });
    return {
      name: "§6Stronger Bones",
      desc: [`§7Take §a${round(this.level * mult, 1)}% §7less damage from skeletons.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { epic: 1.25 });
    return {
      name: "§6Wither Blood",
      desc: [`§7Deal §a${round(this.level * mult, 1)}% §7more damage to wither mobs.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 2 });
    return {
      name: "§6Death's Touch",
      desc: [
        `§7Upon hitting an enemy inflict the wither effect for §a${round(
          this.level * mult,
          1,
        )}% §7damage over 3 seconds.`,
        `§8Does not stack`,
      ],
    };
  }
}

class Bal extends Pet {
  get stats() {
    return {
      mining_fortune: this.level * 1,
      heat_resistance: this.level * 1.5,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { epic: 0.02, legendary: 0.03 });
    return {
      name: "§6Furnace",
      desc: [
        `§7Grants §5+${round(this.level * mult, 1)} ${SYMBOLS.pristine} Pristine§7 while in the §cMagma Fields§7.`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { epic: 0.04 });
    return {
      name: "§6Dispersion",
      desc: [
        `§7While in the §5Crystal Hollows§7, killing mobs reduces your §c${SYMBOLS.heat_resistance} Heat§7 by §c${floor(this.level * mult, 1)}§7.`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.1 });
    return {
      name: "§6Chimney",
      desc: [`§7Reduce Pickaxe Ability cooldowns by §a${floor(this.level * mult, 1)}%§7.`],
    };
  }
}

class BlackCat extends Pet {
  get stats() {
    return {
      speed: this.level * 0.25,
      intelligence: this.level * 1,
      magic_find: this.level * 0.15,
      pet_luck: this.level * 0.15,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    if (this.rarity >= MYTHIC) {
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { legendary: 1 });
    return {
      name: "§6Hunter",
      desc: [`§7Increases your speed and speed cap by +§a${round(this.level * mult, 1)}§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { legendary: 0.15 });
    return {
      name: "§6Omen",
      desc: [`§7Grants §d${floor(this.level * mult, 1)} ${SYMBOLS.pet_luck} Pet Luck§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.15 });
    return {
      name: "§6Supernatural",
      desc: [`§7Grants §b${floor(this.level * mult, 1)} ${SYMBOLS.magic_find} Magic Find§7.`],
    };
  }

  get fourth() {
    const value = getValue(this.rarity, { mythic: 0.15 });
    return {
      name: "§6Looting",
      desc: [`§7Gain §c${floor(this.level * value, 1)}% §7more collection items from monsters!`],
    };
  }
}

class Blaze extends Pet {
  get stats() {
    return {
      intelligence: this.level * 1,
      defense: 10 + this.level * 0.2,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { epic: 0.1 });
    return {
      name: "§6Nether Embodiment",
      desc: [`§7Increases most stats by §a${round(this.level * mult, 1)}% §7while on the Crimson Isle.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { epic: 0.4 });
    return {
      name: "§6Bling Armor",
      desc: [`§7Upgrades §cBlaze Armor §7stats and ability by §a${round(this.level * mult, 1)}%§7.`],
    };
  }

  get third() {
    return {
      name: "§6Fusion-Style Potato",
      desc: [`§7Double effects of hot potato books.`],
    };
  }
}

class EnderDragon extends Pet {
  get stats() {
    return {
      strength: this.level * 0.5,
      crit_chance: this.level * 0.1,
      crit_damage: this.level * 0.5,
    };
  }

  get abilities() {
    const list = [this.first, this.second];
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { epic: 2 });
    return {
      name: "§6End Strike",
      desc: [`§7Deal §a${round(this.level * mult, 1)}% §7more damage to end mobs§7.`],
    };
  }

  get second() {
    return {
      name: "§6One With The Dragon",
      desc: [
        `§7Buffs the Aspect of the Dragons sword by §a${round(this.level * 0.5, 1)} §c${
          SYMBOLS.strength
        } Damage and §a${round(this.level * 0.3, 1)} §c${SYMBOLS.strength} Strength§7.`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.1 });
    return {
      name: "§6Superior",
      desc: [`§7Increases most stats by §a${round(this.level * mult, 1)}%§7.`],
    };
  }
}

class GoldenDragon extends Pet {
  get stats() {
    const stats = {};
    if (this.level >= 100) {
      const goldCollectionDigits =
        this.profile.collections?.mining?.collections
          ?.find((collection) => collection.id === "GOLD_INGOT")
          ?.amount.toString().length ?? 0;

      stats.strength = Math.floor(25 + Math.max(0, this.level - 100) * 0.25) + 10 * goldCollectionDigits;
      stats.bonus_attack_speed = Math.floor(25 + Math.max(0, this.level - 100) * 0.25);
      stats.magic_find = Math.floor(5 + Math.max(0, (this.level - 100) / 10) * 0.5) + 2 * goldCollectionDigits;
    }
    return stats;
  }

  get abilities() {
    const list = [];
    if (this.level < 100) {
      list.push(this.hatching_first);
      list.push(this.hatching_second);
    } else {
      list.push(this.first);
      list.push(this.second);
      list.push(this.third);
      list.push(this.fourth);
    }
    return list;
  }

  get hatching_first() {
    return {
      name: "§7Perks:",
      desc: [`§c§l???`],
    };
  }

  get hatching_second() {
    return {
      name: "§7Hatches at level §b100",
      desc: [""],
    };
  }

  get first() {
    const value = Math.max(0, this.level - 100) * 0.5 + 50;
    return {
      name: "§6Gold's Power",
      desc: [`§7Adds §c+${round(value, 1)} ${SYMBOLS.strength} Strength §7to all §6golden §7weapons.`],
    };
  }

  get second() {
    return {
      name: "§6Shining Scales",
      desc: [
        `§7Grants §c+10 ${SYMBOLS.strength} Strength §7and §b+2 ${SYMBOLS.magic_find} Magic Find §7to your pet for each digit in your §6gold collection§7.`,
      ],
    };
  }

  get third() {
    return {
      name: "§6Dragon's Greed",
      desc: [`§7Gain §c+0.5% ${SYMBOLS.strength} Strength §7per §b5 ${SYMBOLS.magic_find} Magic Find§7.`],
    };
  }

  get fourth() {
    const value = this.level * 0.00125;
    return {
      name: "§6Legendary Treasure",
      desc: [`§7Gain §c${round(value, 4)}% §7damage for every million coins in your bank.`],
    };
  }
}

class Enderman extends Pet {
  get stats() {
    return {
      crit_damage: this.level * 0.75,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    if (this.rarity >= MYTHIC) {
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.1, uncommon: 0.2, epic: 0.3 });
    return {
      name: "§6Enderian",
      desc: [`§7Take §a${round(this.level * mult, 1)}% §7less damage from end monsters§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.4, epic: 0.5 });
    return {
      name: "§6Teleport Savvy",
      desc: [
        `§7Buffs the Transmission abilities granting §a${round(this.level * mult, 1)} §7weapon damage for 5s on use.`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.25 });
    return {
      name: "§6Zealot Madness",
      desc: [`§7Increases your odds to find a special Zealot by §a${round(this.level * mult, 1)}%§7.`],
    };
  }

  get fourth() {
    const mult = getValue(this.rarity, { mythic: 0.004 });
    return {
      name: "§6Enderman Slayer",
      desc: [`§7Grants §b${round(1 + this.level * mult, 1)}x §7Combat XP against §aEndermen§7.`],
    };
  }
}

class Ghoul extends Pet {
  get stats() {
    return {
      health: this.level * 1,
      intelligence: this.level * 0.75,
      ferocity: this.level * 0.05,
      vitality: this.level * 0.25,
      mending: this.level * 0.25,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { epic: 0.005 });
    return {
      name: "§6Undead Slayer",
      desc: [`§7Gain §b${round(1 + this.level * mult, 3)}x §7Combat XP against §aZombies.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { epic: 0.2 });
    return {
      name: "§6Army of the Dead",
      desc: [
        `§7Increases the amount of souls you can store by §a2 §7and the chance of getting a mob's soul by §a${round(this.level * mult, 1)}%§7.`,
      ],
    };
  }

  get third() {
    const costMult = getValue(this.rarity, { legendary: 0.3 });
    const damageMult = getValue(this.rarity, { legendary: 0.2 });
    const healthMult = getValue(this.rarity, { legendary: 1 });
    return {
      name: "§6Reaper Soul",
      desc: [
        `§7Reduces the summoning cost of mobs by §a${round(this.level * costMult, 1)}% §7and increases their damage output by §a${round(this.level * damageMult, 1)}%§7. Increases the health of all summoned mobs by §a${round(this.level * healthMult, 1)}%§7.`,
      ],
    };
  }
}

class Golem extends Pet {
  get stats() {
    return {
      health: this.level * 1.5,
      strength: this.level * 0.5,
      swing_range: this.level * 0.01,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    return {
      name: "§6Last Stand",
      desc: [
        "§7While at less than §a20% HP§7, reduce incoming damage by §a20%§7. Additionally, gain a temporary shield equal to §a40% §7of your maximum health and deal §a40% §7more damage§7.",
        "§8(Lasts 12s, 60s cooldown)",
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { epic: 0.25 });
    return {
      name: "§6Ricochet",
      desc: [
        `§7Your iron plating causes §a${round(this.level * mult, 1)}% §7of attacks to ricochet and hit the attacker§7.`,
      ],
    };
  }

  get third() {
    return {
      name: "§6Toss",
      desc: [`§7Every 5 hits, throw the enemy up into the air and deal §a5x §7damage §8(5s cooldown)`],
    };
  }
}

class Griffin extends Pet {
  get stats() {
    return {
      magic_find: this.level * 0.1,
      strength: this.level * 0.25,
      crit_damage: this.level * 0.5,
      intelligence: this.level * 0.1,
      crit_chance: this.level * 0.1,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= UNCOMMON) {
      list.push(this.second);
    }
    if (this.rarity >= EPIC) {
      list.push(this.third);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    return {
      name: "§6Odyssey",
      desc: [
        `§2Mythological creatures §7you find and burrows you dig scale in §cdifficulty §7and §6rewards §7based on your equipped Griffin's rarity.`,
      ],
    };
  }

  get second() {
    const regen = getValue(this.rarity, { uncommon: "V", rare: "VI", legendary: "VII" });
    const strength = getValue(this.rarity, { uncommon: "VII", epic: "VIII" });
    return {
      name: "§6Legendary Constitution",
      desc: [`§7Permanent §cRegeneration ${regen} §7and §4Strength ${strength}§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { epic: 0.16, legendary: 0.2 });
    return {
      name: "§6Perpetual Empathy",
      desc: [
        `§7Heal nearby players for §a${round(this.level * mult, 0)}% §7of the final damage you receive.`,
        `§8Excludes other griffins.`,
      ],
    };
  }

  get fourth() {
    const mult = getValue(this.rarity, { legendary: 0.14 });
    return {
      name: "§6King of Kings",
      desc: [
        `§7Gain §c+${round(1 + this.level * mult, 1)}% §c${SYMBOLS.strength} Strength §7when above §c85% §7health.`,
      ],
    };
  }
}

class Guardian extends Pet {
  get stats() {
    return {
      defense: this.level * 0.5,
      intelligence: this.level * 1,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    if (this.rarity >= MYTHIC) {
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, {
      common: 0.02,
      uncommon: 0.06,
      rare: 0.1,
      epic: 0.15,
      legendary: 0.2,
      mythic: 1.2,
    });
    return {
      name: "§6Lazerbeam",
      desc: [
        `§7Zap your enemies for §b${round(this.level * mult, 1)}x §7your §b${
          SYMBOLS.intelligence
        } Intelligence §7every §a3s§7.`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.25, epic: 0.3 });
    return {
      name: "§6Enchanting Wisdom Boost",
      desc: [`§7Grants §3+${round(this.level * mult, 1)} ${SYMBOLS.enchanting_wisdom} Enchanting Wisdom§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.3 });
    return {
      name: "§6Mana Pool",
      desc: [`§7Regenerate §b${round(this.level * mult, 1)}% §7extra mana, doubled when near or in water§7.`],
    };
  }

  get fourth() {
    const mult = getValue(this.rarity, { mythic: 0.07 });
    return {
      name: "§6Lucky Seven",
      desc: [`§7Gain §b +${round(this.level * mult, 1)}% §7chance to find §5ultra rare §7books in §dSuperpairs.`],
    };
  }
}

class Horse extends Pet {
  get stats() {
    return {
      intelligence: this.level * 0.5,
      speed: this.level * 0.25,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    return {
      name: "§6Ridable",
      desc: [`§7Right-click your summoned pet to ride it!`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 1.1, epic: 1.2 });
    return {
      name: "§6Run",
      desc: [`§7Increases the speed of your mount by §a${round(this.level * mult, 1)}%§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.25 });
    return {
      name: "§6Ride Into Battle",
      desc: [`§7When riding your horse, gain +§a${round(this.level * mult, 1)}% §7bow damage.`],
    };
  }
}

class Hound extends Pet {
  get stats() {
    return {
      speed: this.level * 0.1,
      strength: this.level * 0.4,
      bonus_attack_speed: this.level * 0.25,
      ferocity: this.level * 0.05,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { epic: 0.05 });
    return {
      name: "§6Scavenger",
      desc: [`§7Gain §a+${round(this.level * mult, 1)} §7coins per monster kill§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { epic: 0.3 });
    return {
      name: "§6Finder",
      desc: [`§7Increases the chance for monsters to drop their armor by §a${round(this.level * mult, 1)}%§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { epic: 0.005 });
    return {
      name: "§6Fury Claws",
      desc: [`§7Gain §b${round(1 + this.level * mult, 3)}x §7Combat XP against §aWolves.`],
    };
  }
}

class MagmaCube extends Pet {
  get stats() {
    return {
      health: this.level * 0.5,
      strength: this.level * 0.2,
      defense: this.level * 0.33,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.2, rare: 0.25, epic: 0.3 });
    return {
      name: "§6Slimy Minions",
      desc: [`§7Slime minions work §a${round(this.level * mult, 1)}% §7faster while on your island§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.2, epic: 0.25 });
    return {
      name: "§6Salt Blade",
      desc: [`§7Deal §a${round(this.level * mult, 1)}% §7more damage to slimes.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.5 });
    return {
      name: "§6Hot Ember",
      desc: [`§7Buffs the stats of §5Rekindled Ember Armor §7by §a${round(this.level * mult, 1)}%§7.`],
    };
  }
}

class Phoenix extends Pet {
  get stats() {
    return {
      strength: 10 + this.level * 0.5,
      intelligence: 50 + this.level * 1,
    };
  }

  get abilities() {
    const list = [this.first, this.second];
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    const startStrength = getValue(this.rarity, { epic: 10, legendary: 15 });
    const multStrength = getValue(this.rarity, { epic: 0.1, legendary: 0.15 });
    const multTime = getValue(this.rarity, { epic: 0.02 });
    return {
      name: "§6Rekindle",
      desc: [
        `§7Before death, become §eimmune §7and gain §c${startStrength + round(this.level * multStrength, 1)} ${
          SYMBOLS.strength
        } Strength §7for §a${2 + round(this.level * multTime, 1)} §7seconds§7.`,
        `§81 minute cooldown`,
      ],
    };
  }

  get second() {
    const multDamage = getValue(this.rarity, { epic: 0.12, legendary: 0.14 });
    const multTime = getValue(this.rarity, { epic: 0.04, legendary: 0.03 });
    return {
      name: "§6Fourth Flare",
      desc: [
        `§7On 4th melee strike, §6ignite §7mobs, dealing §c${1 + round(this.level * multDamage, 1)}x §7your §9${
          SYMBOLS.crit_damage
        } Crit Damage §7each second for §a${2 + floor(this.level * multTime, 0)} §7seconds.`,
      ],
    };
  }

  get third() {
    return {
      name: "§6Magic Bird",
      desc: [`§7You may always fly on your private island§7.`],
    };
  }

  get fourth() {
    return {
      name: "§6Eternal Coins",
      desc: [`§7Don't lose coins from death.`],
    };
  }
}

class Pigman extends Pet {
  get stats() {
    return {
      strength: this.level * 0.5,
      defense: this.level * 0.5,
      ferocity: this.level * 0.05,
    };
  }

  get abilities() {
    const list = [this.first, this.second];
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { epic: 0.3 });
    return {
      name: "§6Bacon Farmer",
      desc: [`§7Pig minions work §a${round(this.level * mult, 1)}% §7faster while on your island§7.`],
    };
  }

  get second() {
    const multDamage = getValue(this.rarity, { epic: 0.4 });
    const multStrength = getValue(this.rarity, { epic: 0.25 });
    return {
      name: "§6Pork Master",
      desc: [
        `§7Buffs the Pigman sword by §a${round(this.level * multDamage, 1)} §c${
          SYMBOLS.strength
        } Damage §7and §a${round(this.level * multStrength, 1)} §c${SYMBOLS.strength} Strength§7.`,
      ],
    };
  }

  get third() {
    return {
      name: "§6Giant Slayer",
      desc: [`§7Deal §c+50% §7damage to monsters Level 50+ and §c+75% §7damage to monsters Level 100+.`],
    };
  }
}

class Rat extends Pet {
  get stats() {
    return {
      strength: this.level * 0.5,
      health: this.level * 1,
      crit_damage: this.level * 0.1,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    if (this.rarity >= MYTHIC) {
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    return {
      name: "§6Morph",
      desc: [`§7Right-click your summoned pet to morph into it!`],
    };
  }

  get second() {
    return {
      name: "§6CHEESE!",
      desc: [`§7As a Rat, you smell §e§lCHEESE §r§7nearby! Yummy!`],
    };
  }

  get third() {
    const multMf = getValue(this.rarity, { legendary: 0.05 });
    const multTime = getValue(this.rarity, { legendary: 0.4 });
    return {
      name: "§6Rat's Blessing",
      desc: [
        `§7Has a chance to grant a random player §b+${floor(2 + this.level * multMf, 1)} ${
          SYMBOLS.magic_find
        } Magic Find §7for §a${round(
          20 + this.level * multTime,
          0,
        )} §7seconds after finding a yummy piece of Cheese! If the player gets a drop during this buff, you have a §a20% §7chance to get it too.`,
      ],
    };
  }

  get fourth() {
    return {
      name: "§6Extreme Speed",
      desc: [`§7The Rat is TWO times faster.`],
    };
  }
}

class SkeletonHorse extends Pet {
  get stats() {
    return {
      intelligence: this.level * 1,
      speed: this.level * 0.5,
    };
  }

  get abilities() {
    const list = [this.first, this.second, this.third];
    return list;
  }

  get first() {
    return {
      name: "§6Ridable",
      desc: [`§7Right-click your summoned pet to ride it!`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { legendary: 1.5 });
    return {
      name: "§6Run",
      desc: [`§7Increases the speed of your mount by §a${round(this.level * mult, 1)}%§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.4 });
    return {
      name: "§6Ride Into Battle",
      desc: [`§7When riding your horse, gain §a+${round(this.level * mult, 1)}% §7bow damage§7.`],
    };
  }
}

class Skeleton extends Pet {
  get stats() {
    return {
      crit_chance: this.level * 0.15,
      crit_damage: this.level * 0.3,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.15, uncommon: 0.2, rare: 0.25, epic: 0.5, legendary: 0.75 });
    return {
      name: "§6Bone Arrows",
      desc: [`§7Increase arrow damage by §a${round(this.level * mult, 1)}% §7which is doubled while in dungeons§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.15, epic: 0.17, legendary: 0.2 });
    return {
      name: "§6Combo",
      desc: [
        `§7Gain a combo stack for every bow hit granting §c+3 ${SYMBOLS.strength} Strength§7. Max §a${round(
          this.level * mult,
          1,
        )} §7stacks, stacks disappear after 8 seconds§7.`,
      ],
    };
  }

  get third() {
    return {
      name: "§6Skeletal Defense",
      desc: [
        `§7Your skeleton shoots an arrow dealing §a30x §7your §9${SYMBOLS.crit_damage} Crit Damage §7when a mob gets close to you (5s cooldown)§7.`,
      ],
    };
  }
}

class Snowman extends Pet {
  get stats() {
    return {
      strength: this.level * 0.25,
      crit_damage: this.level * 0.25,
      damage: this.level * 0.25,
    };
  }

  get abilities() {
    const list = [this.first, this.second, this.third];

    if (this.rarity >= LEGENDARY) {
      list.push(this.fourth);
    }

    return list;
  }

  get first() {
    const blockMult = getValue(this.rarity, { legendary: 0.08 });
    const damageMult = getValue(this.rarity, { legendary: 0.1 });
    return {
      name: "§6Blizzard",
      desc: [
        `§7Enemies within §a${8 + round(this.level * blockMult, 1)} §7blocks are slowed by §a25% §7and deal §a${round(this.level * damageMult, 1)}% §7less damage.`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { legendary: 0.1 });
    return {
      name: "§6Frostbite",
      desc: [
        `§7Your freezing aura slows enemy attacks causing you to take §a${floor(
          this.level * mult,
          1,
        )}% §7reduced damage.`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.1 });
    return {
      name: "§6Snow Cannon",
      desc: [
        `§7Shoots a snowball towards an enemy when you attack dealing §a${round(this.level * mult)}% §7 of your last dealt melee damage, capped at §f200,000§7. §8(1s cooldown).`,
      ],
    };
  }

  get fourth() {
    return {
      name: "§6Ouch!",
      desc: [`§7Your snowballs have §a50% §7chance chance of dealing §cdouble §7damage!`],
    };
  }
}

class Spider extends Pet {
  get stats() {
    return {
      strength: this.level * 0.5,
      crit_chance: this.level * 0.1,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    if (this.rarity >= MYTHIC) {
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.02, uncommon: 0.04, rare: 0.06, epic: 0.08, legendary: 0.1 });
    return {
      name: "§6One With The Spider",
      desc: [
        `§7Applies §c+${5 + round(this.level * mult, 1)} ${SYMBOLS.strength} Strength §7to all §4Arachnal ${SYMBOLS.arachnal} §7weapons, armor, and equipment you have equipped.`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { epic: 0.4 });
    return {
      name: "§6Web-weaver",
      desc: [`§7Upon hitting a monster it becomes slowed by §a${round(this.level * mult, 1)}%§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.3 });
    return {
      name: "§6Spider Whisperer",
      desc: [`§7Spider and tarantula minions work §a${round(this.level * mult, 1)}% §7faster while on your island.`],
    };
  }

  get fourth() {
    return {
      name: "§6Web Battlefield",
      desc: [
        `§7Killing mobs grants §c+6 ${SYMBOLS.strength} Strength §7and §b+1 ${SYMBOLS.magic_find} Magic Find §7for §a40s §7to all players staying within §a20 §7blocks of where they died. §8Stacks up to 10 times.`,
      ],
    };
  }
}

class Spirit extends Pet {
  get stats() {
    return {
      intelligence: this.level * 1,
      speed: this.level * 0.3,
    };
  }

  get abilities() {
    const list = [this.first, this.second];
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    return {
      name: "§6Spirit Assistance",
      desc: [`§7Spawns and assists you when you are ghost in Dungeons.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { epic: 0.45 });
    return {
      name: "§6Spirit Cooldowns",
      desc: [`§7Reduces the cooldown of your ghost abilities in dungeons by §a${round(5 + this.level * mult, 1)}%§7.`],
    };
  }

  get third() {
    return {
      name: "§6Half Life",
      desc: [
        `§7If you are the first player to die in a dungeon, the score penalty for that death is reduced to §a1§7.`,
      ],
    };
  }
}

class Tarantula extends Pet {
  get stats() {
    return {
      crit_damage: this.level * 0.3,
      strength: this.level * 0.1,
      crit_chance: this.level * 0.1,
    };
  }

  get abilities() {
    const list = [this.first, this.second];
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    if (this.rarity >= MYTHIC) {
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { epic: 0.3 });
    return {
      name: "§6Webbed Cells",
      desc: [`§7Anti-healing is §a${round(this.level * mult, 1)}% §7less effective against you.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { epic: 0.5 });
    return {
      name: "§6Eight Legs",
      desc: [`§7Decreases the mana cost of Spider, Tarantula and Spirit boots by §a${round(this.level * mult, 1)}%§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.005 });
    return {
      name: "§6Arachnid Slayer",
      desc: [`§7Gain §b${round(1 + this.level * mult, 1)}x §7Combat XP against §aSpiders§7.`],
    };
  }

  get fourth() {
    return {
      name: "§6Web Battlefield",
      desc: [
        `§7Killing mob grants §c+6 ${SYMBOLS.strength} Strength §7and §b+1 ${SYMBOLS.magic_find} Magic Find §7for §a40s §7to all players staying within §a20 §7blocks of where they died. §8Stacks up to 10 times.`,
      ],
    };
  }
}

class Tiger extends Pet {
  get stats() {
    return {
      crit_damage: this.level * 0.5,
      ferocity: this.level * 0.25,
      strength: 5 + this.level * 0.1,
      crit_chance: this.level * 0.05,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.1, uncommon: 0.2, epic: 0.3 });
    return {
      name: "§6Merciless Swipe",
      desc: [`§7Gain 	§c+${round(this.level * mult, 1)}% ${SYMBOLS.ferocity} Ferocity§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.3, epic: 0.55 });
    return {
      name: "§6Hemorrhage",
      desc: [`§7Melee attacks reduce healing by §6${round(this.level * mult, 1)}% §7for §a10s§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 1 });
    return {
      name: "§6Apex Predator",
      desc: [
        `§7Deal §c+${round(this.level * mult, 1)}% §7damage against targets with no other mobs within §a15 §7blocks.`,
      ],
    };
  }
}

class Turtle extends Pet {
  get stats() {
    return {
      health: 50 + this.level * 0.25,
      defense: 100 + this.level * 0.5,
      true_defense: this.level * 0.15,
    };
  }

  get abilities() {
    const list = [this.first, this.second];
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { epic: 0.27 });
    return {
      name: "§6Turtle Tactics",
      desc: [
        `§7Gain §a+${round(3 + this.level * mult, 1)}% ${SYMBOLS.defense} Defense §7and an additional §a+10% §a${SYMBOLS.defense} Defense §7when standing still.`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { epic: 0.015 });
    return {
      name: "§6Genius Amniote",
      desc: [
        `§7Grants §a+${round(1 + this.level * mult, 1)} ${SYMBOLS.defense}% Defense §7to 4 players within 50 blocks of you.`,
      ],
    };
  }

  get third() {
    return {
      name: "§6Unflippable",
      desc: [`§7Gain §aimmunity §7to knockback.`],
    };
  }

  get fourth() {
    const damageMult = getValue(this.rarity, { legendary: 0.25 });
    const vitalityMult = getValue(this.rarity, { legendary: 0.1 });
    return {
      name: "§6Turtle Shell",
      desc: [
        `§7When under §c40% §7maximum HP, you take §a${round(this.level * damageMult, 1)}% §7less damage. Gain §4+${round(10 + this.level * vitalityMult, 1)}♨ Vitality §7for 15 seconds after taking 10 hits.`,
      ],
    };
  }
}

class Wolf extends Pet {
  get stats() {
    return {
      crit_damage: this.level * 0.1,
      true_defense: this.level * 0.1,
      speed: this.level * 0.2,
      health: this.level * 0.5,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.1, uncommon: 0.2, epic: 0.3 });
    return {
      name: "§6Alpha Dog",
      desc: [`§7Take §a${round(this.level * mult, 1)}% §7less damage from wolves.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.1, epic: 0.15 });
    return {
      name: "§6Pack Leader",
      desc: [
        `§7Gain §a${round(this.level * mult, 1)} §9 ${
          SYMBOLS.crit_damage
        } Crit Damage §7for every nearby wolf monsters.`,
        `§8Max 10 wolves`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.3 });
    return {
      name: "§6Combat Wisdom Boost",
      desc: [`§7Grants §3+${round(this.level * mult, 1)} ${SYMBOLS.combat_wisdom} Combat Wisdom§7.`],
    };
  }
}

class GrandmaWolf extends Pet {
  get stats() {
    return {
      health: this.level * 1,
      strength: this.level * 0.25,
    };
  }

  get abilities() {
    const list = [this.first];
    return list;
  }

  get first() {
    const coins = getValue(this.rarity, { common: 2, uncommon: 4, rare: 6, epic: 8, legendary: 10 });

    return {
      name: "§6Kill Combo",
      desc: [
        `§7Gain buffs for combo kills. Effects stack as you increase your combo.`,
        ``,
        `§a5 Combo §8(lasts §a${Math.floor((8 + this.level * 0.02) * 10) / 10}s§8)`,
        `§8+ §b3% §b${SYMBOLS.magic_find} Magic Find`,
        `§a10 Combo §8(lasts §a${Math.floor((6 + this.level * 0.02) * 10) / 10}s§8)`,
        `§8+ §6${coins} §7coins per kill`,
        `§a15 Combo §8(lasts §a${Math.floor((4 + this.level * 0.02) * 10) / 10}s§8)`,
        `§8+ §b3% §b${SYMBOLS.magic_find} Magic Find`,
        `§a20 Combo §8(lasts §a${Math.floor((3 + this.level * 0.02) * 10) / 10}s§8)`,
        `§8+ §315 ${SYMBOLS.combat_wisdom} Combat Wisdom`,
        `§a25 Combo §8(lasts §a${Math.floor((3 + this.level * 0.01) * 10) / 10}s§8)`,
        `§8+ §b3% §b${SYMBOLS.magic_find} Magic Find`,
        `§a30 Combo §8(lasts §a${Math.floor((2 + this.level * 0.01) * 10) / 10}s§8)`,
        `§8+ §6${coins} §7coins per kill`,
      ],
    };
  }
}

class Zombie extends Pet {
  get stats() {
    return {
      crit_damage: this.level * 0.3,
      health: this.level * 1,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const base = getValue(this.rarity, { common: 5, uncommon: 10, epic: 15 });
    const mult = getValue(this.rarity, { common: 0.1 });
    return {
      name: "§6Bite Shield",
      desc: [`§7Reduce the damage taken from zombies by §a${round(base + this.level * mult, 1)}%§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 1.25 });
    return {
      name: "§6Rotten Blade",
      desc: [`§7Deal §a${round(25 + this.level * mult, 1)}% §7more damage to zombies.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.25 });
    return {
      name: "§6Living Dead",
      desc: [`§7Increases all stats on §7§2Undead ${SYMBOLS.undead} §7armor by §a${round(this.level * mult, 1)}%§7.`],
    };
  }
}

class Giraffe extends Pet {
  get stats() {
    return {
      health: this.level * 1,
      crit_chance: this.level * 0.05,
      swing_range: this.level * 0.01,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const base = getValue(this.rarity, { common: 1, uncommon: 1.5, epic: 2 });
    const mult = getValue(this.rarity, { common: 0.99, uncommon: 1.485, epic: 1.98 });
    return {
      name: "§6Good Heart",
      desc: [`§7Grants §c+${round(base + this.level * mult, 1)} ${SYMBOLS.health_regen} Health Regen§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.0015 });
    return {
      name: "§6Higher Ground",
      desc: [
        `§7Increases your §9${SYMBOLS.crit_damage} Crit Damage §7and §c${SYMBOLS.strength} Strength §7by §c${round(this.level * mult, 2)}% §7for every §e0.1 ${SYMBOLS.swing_range} Swing Range §7over §e3${SYMBOLS.swing_range} §7(up to §e6${SYMBOLS.swing_range}§7).`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.5 });
    return {
      name: "§6Long Neck",
      desc: [
        `§7Increases your melee damage by §c${50 + round(this.level * mult, 1)}% §7if you are more than 3 blocks away from the target.`,
      ],
    };
  }
}

class Lion extends Pet {
  get stats() {
    return {
      ferocity: this.level * 0.05,
      strength: this.level * 0.5,
      speed: this.level * 0.25,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.03, uncommon: 0.05, rare: 0.1, epic: 0.15, legendary: 0.2 });
    return {
      name: "§6Primal Force",
      desc: [
        `§7Adds §c+${round(this.level * mult, 1)} ${SYMBOLS.strength} Damage §7and §c+${round(this.level * mult, 1)} ${
          SYMBOLS.strength
        } Strength §7to your weapons§7.`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.75, epic: 1 });
    return {
      name: "§6First Pounce",
      desc: [
        `§7First Strike, Triple-Strike, and §d§lCombo §r§7are §a${round(this.level * mult, 1)}% §7more effective.`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 1.5 });
    return {
      name: "§6King of the Jungle",
      desc: [
        `§7Deal §c+${round(this.level * mult, 1)}% ${SYMBOLS.strength} Damage §7against mobs that have attacked you.`,
      ],
    };
  }
}

class Monkey extends Pet {
  get stats() {
    return {
      intelligence: this.level * 0.5,
      speed: this.level * 0.2,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.4, uncommon: 0.5, epic: 0.6 });
    return {
      name: "§6Treeborn",
      desc: [
        `§7Grants §a+${round(this.level * mult, 1)} §6${
          SYMBOLS.foraging_fortune
        } Foraging Fortune§7, which increases your chance at double logs.`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.75, epic: 1 });
    return {
      name: "§6Vine Swing",
      desc: [`§7Gain §a+${round(this.level * mult, 1)}	§f${SYMBOLS.speed} Speed §7while in The Park.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.5 });
    return {
      name: "§6Evolved Axes",
      desc: [`§7Reduce the cooldown of Jungle Axe and Treecapitator by §a${round(this.level * mult, 1)}%§7.`],
    };
  }
}

class Montezuma extends Pet {
  get stats() {
    const riftSouls = (this.profile?.rift?.dead_cats?.found_cats ?? []).length;

    return {
      rift_time: 10 + riftSouls * 15,
      mana_regen: riftSouls * 2,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }

    return list;
  }

  get first() {
    return {
      name: "§6Nine Lives",
      desc: [`§7Gain §a+15${SYMBOLS.rift_time} Rift Time §7per Soul piece.`],
    };
  }

  get second() {
    return {
      name: "§6Trickery",
      desc: [`§7Gain §b+2 ${SYMBOLS.mana_regen} Mana Regen §7per soul piece found.`],
    };
  }
}

class Ocelot extends Pet {
  get stats() {
    return {
      speed: this.level * 0.5,
      ferocity: this.level * 0.1,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.2, uncommon: 0.25, epic: 0.3 });
    return {
      name: "§6Foraging Wisdom Boost",
      desc: [`§7Grants §3+${round(this.level * mult, 1)} ${SYMBOLS.foraging_wisdom} Foraging Wisdom§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.3 });
    return {
      name: "§6Tree Hugger",
      desc: [`§7Foraging minions work §a${round(this.level * mult, 1)}% §7faster while on your island§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.3 });
    return {
      name: "§6Tree Essence",
      desc: [`§7Gain a §a${round(this.level * mult, 1)}% §7chance to get exp from breaking a log§7.`],
    };
  }
}

class Owl extends Pet {
  get stats() {
    return {};
  }

  get abilities() {
    const list = [this.first, this.second, this.third];

    return list;
  }

  get first() {
    return {
      name: "§6Training Refunds",
      desc: [`§7The more coins to spend on Fann's Sessions, the less coins they will cost. §8(max 5% off).`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { legendary: 0.1 });
    return {
      name: "§6Efficient Trainer",
      desc: [
        `§7Makes training sessions at Fann more efficient when added into a session.`,
        ``,
        `§7Increased EXP: §b+${round(this.level * mult, 1)}% EXP.`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.05 });
    return {
      name: "§6Fast Learner",
      desc: [`§7Passively grants §3+${round(this.level * mult, 2)} ${SYMBOLS.taming_wisdom} Taming Wisdom§7`],
    };
  }
}
class BabyYeti extends Pet {
  get stats() {
    return {
      intelligence: this.level * 0.75,
      strength: this.level * 0.4,
    };
  }

  get abilities() {
    const list = [this.first, this.second];
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { epic: 0.5 });
    return {
      name: "§6Cold Breeze",
      desc: [
        `§7Gives §a${round(this.level * mult, 1)} §c${SYMBOLS.strength} Strength §7and §9${
          SYMBOLS.crit_damage
        } Crit Damage §7when near snow`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { epic: 0.5, legendary: 0.75 });
    return {
      name: "§6Ice Shields",
      desc: [`§7Gain §a${floor(this.level * mult, 1)}% §7of your strength as §a${SYMBOLS.defense} Defense§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 1 });
    return {
      name: "§6Yeti Fury",
      desc: [
        `§7Buff the Yeti sword by §a${round(this.level * mult, 1)} §c${SYMBOLS.strength} Damage §7and §b${
          SYMBOLS.intelligence
        } Intelligence§7.`,
      ],
    };
  }
}

class BlueWhale extends Pet {
  get stats() {
    return {
      health: this.level * 2,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.5, uncommon: 1, rare: 1.5, epic: 2, legendary: 2.5 });
    return {
      name: "§6Ingest",
      desc: [`§7All potions heal §c+${round(this.level * mult, 1)} ${SYMBOLS.health}§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.01 });
    const health = getValue(this.rarity, { rare: "30.0", epic: "25.0", legendary: "20.0" });
    return {
      name: "§6Bulk",
      desc: [
        `§7Gain §a${round(this.level * mult, 1)} ${SYMBOLS.defense} Defense §7per §c${health} Max ${
          SYMBOLS.health
        } Health§7.`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.2 });
    return {
      name: "§6Archimedes",
      desc: [`§7Gain §c+${round(this.level * mult, 1)}% Max ${SYMBOLS.health} Health§7.`],
    };
  }
}

class Ammonite extends Pet {
  get stats() {
    return {
      sea_creature_chance: this.level * (0.05 + 0.01 * (this.profile?.mining?.core?.level?.level || 0)),
    };
  }

  get abilities() {
    const list = [this.first, this.second, this.third];
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { legendary: 0.01 });
    return {
      name: "§6Heart of the Sea",
      desc: [
        `§7Grants §3+${round(this.level * mult, 2)} ${
          SYMBOLS.sea_creature_chance
        } Sea Creature Chance §7to your pet for each §5Heart of the Mountain §7level.`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { legendary: 1 });
    return {
      name: "§6Expert Cave Fisher",
      desc: [
        `§7The fishing speed reduction from being underground is attenuated by §a${round(this.level * mult, 2)}%§7.`,
      ],
    };
  }

  get third() {
    const fSpeed = getValue(this.rarity, { legendary: 0.005 });
    const speed = getValue(this.rarity, { legendary: 0.02 });
    const def = getValue(this.rarity, { legendary: 0.02 });
    return {
      name: "§6Gift of the Ammonite",
      desc: [
        `§7Each Mining and Fishing level grants §b+${round(this.level * fSpeed, 3)} ${
          SYMBOLS.fishing_speed
        } Fishing Speed§7, §f+${round(this.level * speed, 2)} ${SYMBOLS.speed} Speed §7and §a+${round(
          this.level * def,
          2,
        )} ${SYMBOLS.defense} Defense§7.`,
      ],
    };
  }
}

class Dolphin extends Pet {
  get stats() {
    return {
      intelligence: this.level * 1,
      sea_creature_chance: this.level * 0.05,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.07, uncommon: 0.08, epic: 0.1 });
    return {
      name: "§6Pod Tactics",
      desc: [
        `§7Grants §b+${round(this.level * mult, 2)}${
          SYMBOLS.fishing_speed
        } Fishing Speed §7for each player within §a30 §7blocks, up to §a5 §7players.`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.07, epic: 0.1 });
    return {
      name: "§6Echolocation",
      desc: [`§7Grants §3+${round(this.level * mult, 2)} ${SYMBOLS.sea_creature_chance} Sea Creature Chance§7.`],
    };
  }

  get third() {
    return {
      name: "§6Splash Surprise",
      desc: [`§7Stun sea creatures for §a5s §7after fishing them up.`],
    };
  }
}

class FlyingFish extends Pet {
  get stats() {
    return {
      defense: this.level * 0.5,
      strength: this.level * 0.5,
    };
  }

  get abilities() {
    const list = [this.first, this.second];
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    if (this.rarity >= MYTHIC) {
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { rare: 0.6, epic: 0.75, legendary: 0.8 });
    return {
      name: "§6Quick Reel",
      desc: [`§7Grants §b+${round(this.level * mult, 2)}${SYMBOLS.fishing_speed} Fishing Speed§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.8, epic: 1 });
    const type = getValue(this.rarity, { rare: "water", mythic: "lava" });
    return {
      name: getValue(this.rarity, { rare: "§6Water Bender", mythic: "§6Lava Bender" }),
      desc: [
        `§7Gives §a${round(this.level * mult, 1)} §c${SYMBOLS.strength} Strength §7and §a${
          SYMBOLS.defense
        } Defense §7when near ${type}§7.`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.2 });
    const armor = getValue(this.rarity, { legendary: "Diver Armor", mythic: "Magma Lord armor" });
    return {
      name: getValue(this.rarity, { rare: "§6Deep Sea Diver", mythic: "§6Magmatic Diver" }),
      desc: [`§7Increases the stats of ${armor} by §a${round(this.level * mult, 1)}%§7.`],
    };
  }

  get fourth() {
    const mult = getValue(this.rarity, { mythic: 0.5 });
    return {
      name: "§6Rapid Decay",
      desc: [`§7Increases the chance to activate Flash Enchantment by §a${round(this.level * mult, 1)}%§7.`],
    };
  }
}

class Megalodon extends Pet {
  get stats() {
    return {
      strength: this.level * 0.5,
      magic_find: this.level * 0.1,
      ferocity: this.level * 0.05,
      sea_creature_chance: this.level * 0.05,
      fishing_speed: this.level * 0.3,
    };
  }

  get abilities() {
    const list = [this.first, this.second];
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { epic: 1 });
    return {
      name: "§6Blood Scent",
      desc: [
        `§7Deal up to §c+${round(50 + mult * this.level, 1)}% ${
          SYMBOLS.strength
        } Damage §7based on the enemy's missing health.`,
      ],
    };
  }

  get second() {
    return {
      name: "§6Enhanced scales",
      desc: [`§7Doubles the pet's base stats during the §bFishing Festival§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.1 });
    return {
      name: "§6Feeding frenzy",
      desc: [
        `§7Increases your chance to catch Sharks during the §bFishing Festival §7by §a${round(10 + this.level * mult, 1)}%§7.`,
      ],
    };
  }
}

class Squid extends Pet {
  get stats() {
    return {
      health: this.level * 0.5,
      intelligence: this.level * 0.5,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.5, uncommon: 0.75, epic: 1 });
    return {
      name: "§6More Ink",
      desc: [`§7Gain a §a${round(this.level * mult, 1)}% §7chance to get double drops from squids.`],
    };
  }

  get second() {
    const multDamage = getValue(this.rarity, { rare: 0.3, epic: 0.4 });
    const multStrength = getValue(this.rarity, { rare: 0.15, epic: 0.2 });
    return {
      name: "§6Ink Specialty",
      desc: [
        `§7Buffs the Ink Wand by §a${round(this.level * multDamage, 1)} §c${SYMBOLS.strength} Damage §7and §a${round(
          this.level * multStrength,
          1,
        )} §c${SYMBOLS.strength} Strength§7.`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.3 });
    return {
      name: "§6Fishing Wisdom Boost",
      desc: [`§7Grants §3+${round(this.level * mult, 1)} ${SYMBOLS.fishing_wisdom} Fishing Wisdom§7.`],
    };
  }
}

class Jellyfish extends Pet {
  get stats() {
    return {
      health: this.level * 2,
      health_regen: this.level * 1,
    };
  }

  get abilities() {
    const list = [this.first, this.second];
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const multMana = getValue(this.rarity, { epic: 0.5 });
    return {
      name: "§6Radiant Scyphozoa",
      desc: [`§7While in dungeons, reduces the mana cost of Power Orbs by §a${round(this.level * multMana, 1)}%§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { epic: 0.01 });
    return {
      name: "§6Stored Energy",
      desc: [
        `§7While in dungeons, for every §c2,000 HP §7you heal teammates the cooldown of §aWish §7is reduced by §a${round(
          this.level * mult,
          2,
        )}s§7, up to §a30s§7.`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.5 });
    return {
      name: "§6Powerful Potions",
      desc: [
        `§7While in dungeons, increase the effectiveness of Dungeon Potions by §a${round(this.level * mult, 1)}%§7.`,
      ],
    };
  }
}

class Parrot extends Pet {
  get stats() {
    return {
      crit_damage: this.level * 0.1,
      intelligence: this.level * 1,
    };
  }

  get abilities() {
    const list = [this.first, this.second];
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { epic: 0.15, legendary: 0.2 });
    return {
      name: "§6Flamboyant",
      desc: [`§7Adds §a${Math.max(round(this.level * mult, 0), 1)} §7levels to intimidation accessories§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { epic: 0.35 });
    return {
      name: "§6Repeat",
      desc: [`§7Boosts potion duration by §a${round(5 + this.level * mult, 1)}%§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.25 });
    return {
      name: "§6Bird Discourse",
      desc: [
        `§7Gives §c+${round(5 + this.level * mult, 1)} ${SYMBOLS.strength} Strength §7to players within §a20 §7blocks`,
        `§8Doesn't stack`,
      ],
    };
  }

  get fourth() {
    const mult = getValue(this.rarity, { legendary: 0.2 });
    return {
      name: "§6Parrot Feather Infusion",
      desc: [
        `§7When summoned or in your pets menu, boost the duration of consumed §cGod Potions §7by §a${round(
          this.level * mult,
          1,
        )}%§7.`,
      ],
    };
  }
}

class Sheep extends Pet {
  get stats() {
    return {
      intelligence: this.level * 1,
      ability_damage: this.level * 0.2,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.1, uncommon: 0.15, epic: 0.2 });
    return {
      name: "§6Mana Saver",
      desc: [`§7Reduces the mana cost of abilities by §a${round(this.level * mult, 1)}%§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.1 });
    return {
      name: "§6Overheal",
      desc: [`§7Gives a §a${round(this.level * mult, 1)}% §7shield after not taking damage for 10s§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.25 });
    return {
      name: "§6Dungeon Wizard",
      desc: [`§7Increases your total mana by §a${round(this.level * mult, 1)}% §7while in dungeons§7.`],
    };
  }
}

class Jerry extends Pet {
  get stats() {
    return {
      intelligence: this.level * -1,
    };
  }

  get abilities() {
    const list = [this.first, this.second];
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    if (this.rarity >= MYTHIC) {
      list.push(this.fourth);
    }
    return list;
  }

  get first() {
    return {
      name: "§6Jerry",
      desc: [`§7Gain §a50% §7chance to deal your regular damage.`],
    };
  }

  get second() {
    return {
      name: "§6Jerry",
      desc: [`§7Gain §a100% §7chance to receive a normal amount of drops from mobs.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.1, mythic: 0.5 });
    return {
      name: "§6Jerry",
      desc: [`§7Actually adds §c${Math.floor(this.level * mult)} damage §7to the Aspect of the Jerry.`],
    };
  }

  get fourth() {
    return {
      name: "§6Jerry",
      desc: [`§7Tiny chance to find Jerry Candies when killing mobs.`],
    };
  }
}

class Bingo extends Pet {
  get stats() {
    return {
      health: 25 + this.level * 0.75,
      strength: 5 + this.level * 0.2,
      speed: 25 + this.level * 0.5,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= UNCOMMON) {
      list.push(this.second);
    }
    if (this.rarity >= RARE) {
      list.push(this.third);
    }
    if (this.rarity >= EPIC) {
      list.push(this.fourth);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.fifth);
    }
    if (this.rarity >= MYTHIC) {
      list.push(this.sixth);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.2 });
    return {
      name: "§6Lucky Looting",
      desc: [`§7Gain §c${floor(5 + this.level * mult, 1)}% §7more collection items from any source!`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { uncommon: 0.1 });
    return {
      name: "§6Fast Learner",
      desc: [
        `§7Gain §c${floor(5 + this.level * mult, 1)}% §7more Skill Experience, HOTM Experience, and Slayer Experience.`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { rare: 0.3 });
    return {
      name: "§6Chimera",
      desc: [`§7Increases your base stats of your active pet by §c${floor(10 + this.level * mult, 1)}% §7per level.`],
    };
  }

  get fourth() {
    const mult = getValue(this.rarity, { epic: 0.009 });
    return {
      name: "§6Scavenger",
      desc: [`§7Gain §c${round(0.1 + this.level * mult, 1)} §7more §l§6Coins §r§7per monster level on kill.`],
    };
  }

  get fifth() {
    const mult = getValue(this.rarity, { legendary: 0.5 });

    return {
      name: "§6Recovery",
      desc: [
        `§7Upon death, your active potion effects will be retained with §c${round(
          25 + this.level * mult,
          1,
        )}% §7of their time.`,
      ],
    };
  }

  get sixth() {
    return {
      name: "§6Power Of Completion",
      desc: [
        `§7Gain §c+2 ${SYMBOLS.strength} Strength§7, §9+1 Crit Chance§7, and §c+5 ${SYMBOLS.health} Health §7per completed Personal Bingo Goal in the current Bingo Event.`,
      ],
    };
  }
}

class Wisp extends Pet {
  get stats() {
    const damageMulitiplier = getValue(this.rarity, { common: 0.1, uncommon: 0.15, rare: 0.2, epic: 0.25 });
    const trueDefenseMultiplier = getValue(this.rarity, { rare: 0.15, epic: 0.3, legendary: 0.35 });
    const healthMultiplier = getValue(this.rarity, { uncommon: 1, rare: 2.5, epic: 4, legendary: 6 });
    const intelligenceMultiplier = getValue(this.rarity, { rare: 0.5, epic: 1.25, legendary: 2.5 });

    if (this.rarity <= UNCOMMON) {
      return {
        health: this.level * healthMultiplier,
        damage: this.level * damageMulitiplier,
      };
    } else {
      return {
        intelligence: this.level * intelligenceMultiplier,
        damage: this.level * damageMulitiplier,
        true_defense: this.level * trueDefenseMultiplier,
        health: this.level * healthMultiplier,
      };
    }
  }

  get abilities() {
    const list = [this.first, this.second, this.third];
    if (this.rarity >= RARE) {
      list.push(this.fourth);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.fifth);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 15, uncommon: 25, epic: 40, legendary: 50 });
    return {
      name: "§6Drophammer",
      desc: [
        "§7Lets you break fire pillars,",
        `§7which heals you for §c${mult}% §7of`,
        `§7your max §c${SYMBOLS.health} §7over §a3s§7.`,
      ],
    };
  }

  get second() {
    const BONUSES = [
      { kills: 0, defense: 0, true_defense: 0 },
      { kills: 100, defense: 30, true_defense: 3 },
      { kills: 200, defense: 60, true_defense: 6 },
      { kills: 300, defense: 90, true_defense: 9 },
      { kills: 500, defense: 135, true_defense: 14 },
      { kills: 800, defense: 180, true_defense: 18 },
      { kills: 1200, defense: 225, true_defense: 23 },
      { kills: 1750, defense: 270, true_defense: 27 },
      { kills: 2500, defense: 315, true_defense: 32 },
      { kills: 3500, defense: 360, true_defense: 36 },
      { kills: 5000, defense: 405, true_defense: 41 },
      { kills: 10000, defense: 465, true_defense: 47 },
      { kills: 25000, defense: 500, true_defense: 50 },
      { kills: 50000, defense: 535, true_defense: 53 },
      { kills: 100000, defense: 570, true_defense: 57 },
      { kills: 125000, defense: 585, true_defense: 58 },
      { kills: 150000, defense: 595, true_defense: 59 },
      { kills: 200000, defense: 600, true_defense: 60 },
    ];

    const blazeKills = this.extra?.blaze_kills ?? 0;

    let maxTier = false;
    let bonusIndex = BONUSES.findIndex((x) => x.kills > blazeKills);

    if (bonusIndex === -1) {
      bonusIndex = BONUSES.length;
      maxTier = true;
    }

    const current = BONUSES[bonusIndex - 1];

    let next = null;
    if (!maxTier) {
      next = BONUSES[bonusIndex];
    }

    return {
      name: "§6Bulwark",
      desc: [
        `§7Kill Blazes to gain defense against them and demons.`,
        `§7Bonus: §a+${current.defense} ${SYMBOLS.defense} §7§ §f+${current.true_defense} ${SYMBOLS.true_defense}`,
        !maxTier
          ? `§7Next Upgrade: §a+${next.defense} ${SYMBOLS.defense} §7§ §f+${next.true_defense} ${
              SYMBOLS.true_defense
            } §7(§a${blazeKills.toLocaleString()}§7/§c${next.kills.toLocaleString()}§7)`
          : "§aMAXED OUT!",
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { uncommon: 0.003, rare: 0.004, legendary: 0.005 });

    return {
      name: "§6Blaze Slayer",
      desc: [`§7Grants §b${round(1 + this.level * mult, 1)}x §7Combat XP against §aBlazes§7.`],
    };
  }

  get fourth() {
    const mult1 = getValue(this.rarity, { rare: 0.15, epic: 0.2, legendary: 0.25 });
    const mult2 = getValue(this.rarity, { rare: 0.04, epic: 0.07, legendary: 0.1 });
    const val1 = round(this.level * mult1, 1);
    const val2 = round(this.level * mult2, 1);
    return {
      name: "§6Ephemeral Stability",
      desc: [
        `§7While in combat on the Crimson Isle, spawn a pool every §a8s§7. Bathing in it heals §c${val1}% ${SYMBOLS.health} Health §7now and §c${val2}% ${SYMBOLS.health} Health§7/s for §a8s`,
      ],
    };
  }

  get fifth() {
    const mult = getValue(this.rarity, { legendary: 0.4 });
    return {
      name: "§6Cold Fusion",
      desc: [`§7Regenerate mana §b${round(this.level * mult, 1)}% §7faster§7.`],
    };
  }
}

class MooshroomCow extends Pet {
  get stats() {
    return {
      health: this.level * 1,
      farming_fortune: 10 + this.level * 1,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.2, rare: 0.3 });

    return {
      name: "§6Efficient Mushrooms",
      desc: [`§7Mushroom and Mycelium minions work §a${round(this.level * mult, 1)}% §7faster while on your island§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.99 });
    return {
      name: "§6Mushroom Eater",
      desc: [
        `§7When breaking crops, there is a §a${round(
          this.level * mult + 1.01,
          1,
        )}% §7chance that a mushroom will drop§7.`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.2 });

    return {
      name: "§6Farming Strength",
      desc: [
        `§7Gain §6+0.7 ${SYMBOLS.farming_fortune} Farming Fortune §7per every §c${round(40 - this.level * mult, 1)} ${
          SYMBOLS.strength
        } Strength§7.`,
      ],
    };
  }
}

class Snail extends Pet {
  get stats() {
    return {
      intelligence: this.level * 1,
    };
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { comMONTEZUMA: 0.1, uncommon: 0.2, rare: 0.3 });

    return {
      name: "§6Red Sand Enjoyer",
      desc: [`§7Red Sand minions work §a${round(this.level * mult, 1)}% §7faster while on your island§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { rare: 0.3, epic: 0.5 });

    return {
      name: "§6Slow Moving",
      desc: [
        `§7Converts all §f${SYMBOLS.speed} Speed §7over 100 into §6${
          SYMBOLS.mining_fortune
        } Mining Fortune §7for non-ores at §a${round(this.level * mult, 1)}% §7efficiency§7.`,
        `§7Current bonus: §6+0 ${SYMBOLS.mining_fortune} Mining Fortune§7.`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.01 });

    return {
      name: "§6Slow But Efficient",
      desc: [
        `§7Reduces the mana cost of §9Utility Abilities §7by §a${round(this.level * mult, 1)}% §7for every +15 §f${
          SYMBOLS.speed
        } Speed §7converted§7.`,
      ],
    };
  }
}

class Kuudra extends Pet {
  get stats() {
    return {
      health: this.level * 4,
      strength: this.level * 0.4,
    };
  }

  get abilities() {
    const list = [this.first, this.second];
    if (this.rarity >= RARE) {
      list.push(this.third);
    }
    if (this.rarity >= EPIC) {
      list.push(this.fourth);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.fifth);
    }
    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { common: 0.1, uncommon: 0.15, epic: 0.2 });

    return {
      name: "§6Crimson",
      desc: [`§7Grants §a${round(this.level * mult, 1)}% §7extra Crimson Essence.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { common: 0.1, uncommon: 0.15, epic: 0.2 });

    return {
      name: "§6Wither Bait",
      desc: [`§7Increases the odds of finding a vanquisher by §a${round(this.level * mult, 1)}%§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { rare: 0.5, epic: 1 });

    return {
      name: "§6Kuudra Fortune",
      desc: [
        `§7Gain §6+${round(this.level * mult, 1)} ${
          SYMBOLS.mining_fortune
        } Mining Fortune §7while on the Crimson Isle.`,
      ],
    };
  }

  get fourth() {
    const mult = getValue(this.rarity, { epic: 0.2 });

    return {
      name: "§6Trophy Bait",
      desc: [`§7Increases the odds of fishing Trophy Fish by §a${round(this.level * mult, 1)}%§7.`],
    };
  }

  get fifth() {
    return {
      name: "§6Kuudra Specialist",
      desc: [`§7Increases all damage to Kuudra by §c5%§7.`],
    };
  }
}

class Reindeer extends Pet {
  get stats() {
    return {
      health: this.level * 1,
      sea_creature_chance: this.level * 0.05,
      fishing_speed: this.level * 0.25,
    };
  }

  get abilities() {
    const list = [this.first, this.second, this.third, this.fourth];

    return list;
  }

  get first() {
    return {
      name: "§6Winter Sprint",
      desc: [`§7Gain §ddouble §7pet §aEXP§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { legendary: 0.75 });

    return {
      name: "§6Infused",
      desc: [
        `§7Gives §b+${round(this.level * mult, 1)} ${SYMBOLS.fishing_speed} Fishing Speed §7and §3+10 ${
          SYMBOLS.sea_creature_chance
        } Sea Creature Chance §7while on §cJerry's Workshop§7.`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.1 });

    return {
      name: "§6Snow Power",
      desc: [`§7Grants §a+${round(this.level * mult, 1)}% §7bonus gift chance during the §cGift Attack §7event.`],
    };
  }

  get fourth() {
    const mult = getValue(this.rarity, { legendary: 0.2 });

    return {
      name: "§6Icy Wind",
      desc: [`§7Grants §a+${round(this.level * mult, 1)}% §7chance of getting double §bIce Essence§7.`],
    };
  }
}

class RiftFerret extends Pet {
  get stats() {
    return {
      speed: 0.5 * this.level,
      intelligence: -0.02 * this.level,
    };
  }

  get abilities() {
    const list = [this.first];

    return list;
  }

  get first() {
    return {
      name: "§6Orbs are Fun",
      desc: [`§7Gain §a+10% §7experience from §bXP Orbs§7.`],
    };
  }
}

class Tyrannosaurus extends Pet {
  get stats() {
    return {
      strength: 0.75 * this.level,
      crit_chance: 0.05 * this.level,
      ferocity: 0.25 * this.level,
    };
  }

  get abilities() {
    const list = [this.first, this.second, this.third];

    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { legendary: 1 });

    return {
      name: "§6Close Combat",
      desc: [`§7Deal §a${round(this.level * mult, 1)}% §7more §cdamage §7to enemies within 1.5 blocks.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { legendary: 0.1 });

    return {
      name: "§6Ferocious Roar",
      desc: [`§7Attacks have a §a${round(this.level * mult, 1)}% §7chance to stun the target.`, `§8Cooldown: 10s`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 1 });

    return {
      name: "§6Tyrant",
      desc: [`§7Stats granted by pet items on this pet are increased by §a${round(this.level * mult, 1)}%§7.`],
    };
  }
}

class Spinosaurus extends Pet {
  get stats() {
    return {
      sea_creature_chance: 0.08 * this.level,
      fishing_speed: 0.25 * this.level,
    };
  }

  get abilities() {
    const list = [this.first, this.second, this.third];

    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { legendary: 0.15 });

    return {
      name: "§6Sharp Attitude",
      desc: [`§bSea Creatures §7spawn with §a${round(this.level * mult, 1)}% §7of their maximum health missing.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { legendary: 0.08 });

    return {
      name: "§6Pursuit",
      desc: [`§7Gain §b+${round(this.level * mult, 1)} ${SYMBOLS.magic_find} Magic Find §7against §bSea Creatures§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.75 });

    return {
      name: "§6Primoridal Fisher",
      desc: [
        `§7During §9rain§7, increases this pet's base stats and stats granted by perks by §a${round(this.level * mult, 1)}%§7.`,
      ],
    };
  }
}

class Goblin extends Pet {
  get stats() {
    return {
      speed: 0.2 * this.level,
      crit_chance: 0.1 * this.level,
    };
  }

  get abilities() {
    const list = [this.first, this.second, this.third];

    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { legendary: 0.5 });

    return {
      name: "§6Pickpocket",
      desc: [`§7Increases the coins obtained from goblin coin bags by §a${round(this.level * mult, 1)}%§7.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { legendary: 1 });

    return {
      name: "§6Offensive Odor",
      desc: [`§7The Kings scent potion effect lasts §a${round(this.level * mult, 1)}% §7longer on you.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.5 });

    return {
      name: "§6Free-range Eggs",
      desc: [`§7Increases the chances of finding rare goblin eggs by §a${round(this.level * mult, 1)}%§7.`],
    };
  }
}

class Ankylosaurus extends Pet {
  get stats() {
    return {
      health: 1.5 * this.level,
      defense: 0.5 * this.level,
      true_defense: 0.15 * this.level,
    };
  }

  get abilities() {
    const list = [this.first, this.second, this.third];

    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { legendary: 0.15 });

    return {
      name: "§6Armored Tank",
      desc: [
        `§7Gain §a${round(this.level * mult, 1)}% §7of your §a${SYMBOLS.defense} Defense §7as §c${SYMBOLS.strength} Strength§7.`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { legendary: 0.5 });

    return {
      name: "§6Unyielding",
      desc: [`§7Increases the effectiveness of §dLast Stand §7and §cLifeline by §a${round(this.level * mult, 1)}%§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.5 });

    return {
      name: "§6Superior",
      desc: [
        `§7Every 5th hit deals §a${round(this.level * mult, 1)}% §7of your final damage to enemies within 5 blocks. Enemies hit deal 10 less damage for 10s.`,
      ],
    };
  }
}

class Penguin extends Pet {
  get stats() {
    return {
      sea_creature_chance: 0.1 * this.level,
    };
  }

  get abilities() {
    const list = [this.first, this.second, this.third];

    return list;
  }

  get first() {
    const val = getValue(this.rarity, { legendary: 20 });

    return {
      name: "§6Thick Blubber",
      desc: [
        `§7Each time you catch a Sea Creature, reduce your §b${SYMBOLS.cold_resistance} Cold §7by §a${round(1 + floor(this.level / val), 1)}§7.`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { legendary: 1 });

    return {
      name: "§6Expert Glacite Fisher ",
      desc: [`§7The fishing speed reduction from being underground is reduced by §a${round(this.level * mult, 1)}%§7.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.75 });

    return {
      name: "§6Subzero Hero",
      desc: [
        `§7Gain §b+${round(this.level * mult, 1)} ${SYMBOLS.fishing_speed} Fishing Speed §7while in the §bGlacite Tunnels§7.`,
      ],
    };
  }
}

class Mammoth extends Pet {
  get stats() {
    return {
      defense: 0.5 * this.level,
      cold_resistance: 0.1 * this.level,
    };
  }

  get abilities() {
    const list = [this.first, this.second, this.third];

    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { legendary: 1 });

    return {
      name: "§6Wooly Coat",
      desc: [
        `§7Gain a §a${round(this.level * mult, 1)}% §7chance for mobs to not inflict §b${SYMBOLS.cold_resistance} Cold §7when damaging you in the §bGlacite Mineshafts§7.`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { legendary: 0.005 });

    return {
      name: "§6Tusk Luck",
      desc: [
        `§7Gain §b+${round(this.level * mult, 1)} ${SYMBOLS.magic_find} Magic Find §7for every §6100 ${SYMBOLS.mining_fortune} Mining Fortune§7, doubled in the §bGlacite Tunnels §7and §bGlacite Mineshafts§7.`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.3 });

    return {
      name: "§6Superior",
      desc: [
        `§7Gain §6+${round(this.level * mult, 1)} ${SYMBOLS.mining_fortune} Mining Fortune §7for each §bFrozen Corpse §7looted in your current §bGlacite Mineshaft§7.`,
      ],
    };
  }
}

class Mole extends Pet {
  get stats() {
    return {
      intelligence: 1 * this.level,
      mining_speed: 0.75 * this.level,
    };
  }

  get abilities() {
    const list = [this.first, this.second, this.third];

    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { legendary: 0.25 });

    return {
      name: "§6Archaeologist",
      desc: [
        `§7Increases your chance of finding §cScavenged Items §7in the §aMines of Divan §7by §a${round(this.level * mult, 1)}%§7.`,
      ],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { legendary: 1 });

    return {
      name: "§6Blind as a Mole",
      desc: [`§7Gain a §a${round(this.level * mult, 1)}% §7chance for §eProfessor Robot §7to ask for 1 less part.`],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 1 });

    return {
      name: "§6Nucleic Explorer",
      desc: [
        `§7Gain a §a${round(this.level * mult, 1)}% §7chance to receive an extra drop when completing the §dCrystal Nucleus§7.`,
      ],
    };
  }
}

class GlaciteGolem extends Pet {
  get stats() {
    return {
      mining_speed: 1.25 * this.level,
      cold_resistance: 0.05 * this.level,
    };
  }

  get abilities() {
    const list = [this.first, this.second, this.third];

    return list;
  }

  get first() {
    const mult = getValue(this.rarity, { legendary: 0.2 });

    return {
      name: "§6Powder-powered",
      desc: [`§7Gain §a+${round(this.level * mult, 1)}% §7more §bGlacite Powder §7from most sources.`],
    };
  }

  get second() {
    const mult = getValue(this.rarity, { legendary: 1 });

    return {
      name: "§6Iceborn",
      desc: [
        `§7Gain §a+${round(this.level * mult, 1)} §6${SYMBOLS.mining_fortune} Mining Fortune §7while in the §bGlacite Mineshafts§7.`,
      ],
    };
  }

  get third() {
    const mult = getValue(this.rarity, { legendary: 0.01 });

    return {
      name: "§6Frozen Perfection",
      desc: [
        `§7Gain §a+${round(this.level * mult, 1)} §5${SYMBOLS.pristine} Pristine §7for every §bFrozen Corpse §7you've looted in the current §bGlacite Mineshaft§7.`,
      ],
    };
  }
}

class QuestionMark extends Pet {
  get stats() {
    return {};
  }

  get abilities() {
    const list = [this.first];
    if (this.rarity >= RARE) {
      list.push(this.second);
    }
    if (this.rarity >= LEGENDARY) {
      list.push(this.third);
    }
    return list;
  }

  get first() {
    return {
      name: "§6???",
      desc: [`§7???`],
    };
  }

  get second() {
    return {
      name: "§6???",
      desc: [`§7???`],
    };
  }

  get third() {
    return {
      name: "§6???",
      desc: [`§7???`],
    };
  }
}

export const PET_STATS = {
  "???": QuestionMark,
  AMMONITE: Ammonite,
  ANKYLOSAURUS: Ankylosaurus,
  ARMADILLO: Armadillo,
  BABY_YETI: BabyYeti,
  BAL: Bal,
  BAT: Bat,
  BEE: Bee,
  BINGO: Bingo,
  BLACK_CAT: BlackCat,
  BLAZE: Blaze,
  BLUE_WHALE: BlueWhale,
  CHICKEN: Chicken,
  DOLPHIN: Dolphin,
  DROPLET_WISP: Wisp,
  FROST_WISP: Wisp,
  GLACIAL_WISP: Wisp,
  SUBZERO_WISP: Wisp,
  EERIE: Eerie,
  ELEPHANT: Elephant,
  ENDER_DRAGON: EnderDragon,
  ENDERMAN: Enderman,
  ENDERMITE: Endermite,
  FLYING_FISH: FlyingFish,
  GHOUL: Ghoul,
  GIRAFFE: Giraffe,
  GLACITE_GOLEM: GlaciteGolem,
  GOBLIN: Goblin,
  GOLDEN_DRAGON: GoldenDragon,
  GOLEM: Golem,
  GRANDMA_WOLF: GrandmaWolf,
  GRIFFIN: Griffin,
  GUARDIAN: Guardian,
  FRACTURED_MONTEZUMA_SOUL: Montezuma,
  HORSE: Horse,
  HOUND: Hound,
  JELLYFISH: Jellyfish,
  JERRY: Jerry,
  KUUDRA: Kuudra,
  LION: Lion,
  MAGMA_CUBE: MagmaCube,
  MAMMOTH: Mammoth,
  MEGALODON: Megalodon,
  MITHRIL_GOLEM: MithrilGolem,
  MONKEY: Monkey,
  MOLE: Mole,
  MOOSHROOM_COW: MooshroomCow,
  OCELOT: Ocelot,
  OWL: Owl,
  PARROT: Parrot,
  PENGUIN: Penguin,
  PHOENIX: Phoenix,
  PIG: Pig,
  PIGMAN: Pigman,
  RABBIT: Rabbit,
  RAT: Rat,
  REINDEER: Reindeer,
  RIFT_FERRET: RiftFerret,
  ROCK: Rock,
  SCATHA: Scatha,
  SHEEP: Sheep,
  SILVERFISH: Silverfish,
  SLUG: Slug,
  SKELETON_HORSE: SkeletonHorse,
  SKELETON: Skeleton,
  SNAIL: Snail,
  SNOWMAN: Snowman,
  SPIDER: Spider,
  SPINOSAURUS: Spinosaurus,
  SPIRIT: Spirit,
  SQUID: Squid,
  TARANTULA: Tarantula,
  TIGER: Tiger,
  TURTLE: Turtle,
  TYRANNOSAURUS: Tyrannosaurus,
  WITHER_SKELETON: WitherSkeleton,
  WOLF: Wolf,
  ZOMBIE: Zombie,
};
