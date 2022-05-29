import path from "path";
import { fileURLToPath } from "url";
import nbt from "prismarine-nbt";
import util from "util";
import sanitize from "mongo-sanitize";
import minecraftData from "minecraft-data";
const mcData = minecraftData("1.8.9");
import _ from "lodash";
import * as constants from "./constants.js";
import * as helper from "./helper.js";
const getId = helper.getId;
import axios from "axios";
import moment from "moment";
import { v4 } from "uuid";
import retry from "async-retry";
import credentials from "./credentials.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import { db } from "./mongo.js";

const Hypixel = axios.create({
  baseURL: "https://api.hypixel.net/",
});

import { redisClient } from "./redis.js";

import { calculateLilyWeight } from "./weight/lily-weight.js";
import { calculateSenitherWeight } from "./weight/senither-weight.js";
import { getTexture, packs } from "./custom-resources.js";

const parseNbt = util.promisify(nbt.parse);

function getMinMax(profiles, min, ...path) {
  let output = null;

  const compareValues = profiles.map((a) => helper.getPath(a, ...path)).filter((a) => !isNaN(a));

  if (compareValues.length == 0) {
    return output;
  }

  if (min) {
    output = Math.min(...compareValues);
  } else {
    output = Math.max(...compareValues);
  }

  if (isNaN(output)) {
    return null;
  }

  return output;
}

function getMax(profiles, ...path) {
  return getMinMax(profiles, false, ...path);
}

// Commented out because it is never used
// function getMin(profiles, ...path) {
//   return getMinMax(profiles, true, ...path);
// }

function getAllKeys(profiles, ...path) {
  return _.uniq([].concat(...profiles.map((a) => _.keys(helper.getPath(a, ...path)))));
}

/**
 * gets the xp table for the given type
 * @param {string} type
 * @returns {{[key: number]: number}}
 */
function getXpTable(type) {
  switch (type) {
    case "runecrafting":
      return constants.runecrafting_xp;
    case "social":
      return constants.social_xp;
    case "dungeoneering":
      return constants.dungeoneering_xp;
    case "hotm":
      return constants.hotm_xp;
    default:
      return constants.leveling_xp;
  }
}

/**
 * estimates the xp based on the level
 * @param {number} uncappedLevel
 * @param {{type?: string, cap?: number, skill?: string}} extra
 * @param type the type of levels (used to determine which xp table to use)
 * @param cap override the cap highest level the player can reach
 * @param skill the key of default_skill_caps
 */
function getXpByLevel(uncappedLevel, extra = {}) {
  const xpTable = getXpTable(extra.type);

  if (typeof uncappedLevel !== "number" || isNaN(uncappedLevel)) {
    uncappedLevel = 0;
  }

  /** the level that this player is caped at */
  const levelCap =
    extra.cap ?? constants.default_skill_caps[extra.skill] ?? Math.max(...Object.keys(xpTable).map((a) => Number(a)));

  /** the maximum level that any player can achieve (used for gold progress bars) */
  const maxLevel = constants.maxed_skill_caps[extra.skill] ?? levelCap;

  /** the amount of xp over the amount required for the level (used for calculation progress to next level) */
  const xpCurrent = 0;

  /** the sum of all levels including level */
  let xp = 0;

  for (let x = 1; x <= uncappedLevel; x++) {
    xp += xpTable[x];
  }

  /** the level as displayed by in game UI */
  const level = Math.min(levelCap, uncappedLevel);

  /** the amount amount of xp needed to reach the next level (used for calculation progress to next level) */
  const xpForNext = level < maxLevel ? Math.ceil(xpTable[level + 1]) : Infinity;

  /** the fraction of the way toward the next level */
  const progress = level < maxLevel ? 0.05 : 0;

  /** a floating point value representing the current level for example if you are half way to level 5 it would be 4.5 */
  const levelWithProgress = level + progress;

  return {
    xp,
    level,
    maxLevel,
    xpCurrent,
    xpForNext,
    progress,
    levelCap,
    uncappedLevel,
    levelWithProgress,
  };
}

/**
 * gets the level and some other information from an xp amount
 * @param {number} xp
 * @param {{type?: string, cap?: number, skill?: string}} extra
 * @param type the type of levels (used to determine which xp table to use)
 * @param cap override the cap highest level the player can reach
 * @param skill the key of default_skill_caps
 */
export function getLevelByXp(xp, extra = {}) {
  const xpTable = getXpTable(extra.type);

  if (typeof xp !== "number" || isNaN(xp)) {
    xp = 0;
  }

  /** the level that this player is caped at */
  const levelCap =
    extra.cap ?? constants.default_skill_caps[extra.skill] ?? Math.max(...Object.keys(xpTable).map((a) => Number(a)));

  /** the maximum level that any player can achieve (used for gold progress bars) */
  const maxLevel = constants.maxed_skill_caps[extra.skill] ?? levelCap;

  /** the level ignoring the cap and using only the table */
  let uncappedLevel = 0;

  /** the amount of xp over the amount required for the level (used for calculation progress to next level) */
  let xpCurrent = xp;

  /** like xpCurrent but ignores cap */
  let xpRemaining = xp;

  while (xpTable[uncappedLevel + 1] <= xpRemaining) {
    uncappedLevel++;
    xpRemaining -= xpTable[uncappedLevel];
    if (uncappedLevel <= levelCap) {
      xpCurrent = xpRemaining;
    }
  }

  // not sure why this is floored but I'm leaving it in for now
  xpCurrent = Math.floor(xpCurrent);

  /** the level as displayed by in game UI */
  const level = Math.min(levelCap, uncappedLevel);

  /** the amount amount of xp needed to reach the next level (used for calculation progress to next level) */
  const xpForNext = level < maxLevel ? Math.ceil(xpTable[level + 1]) : Infinity;

  /** the fraction of the way toward the next level */
  const progress = Math.max(0, Math.min(xpCurrent / xpForNext, 1));

  /** a floating point value representing the current level for example if you are half way to level 5 it would be 4.5 */
  const levelWithProgress = level + progress;

  /** a floating point value representing the current level ignoring the in-game unlockable caps for example if you are half way to level 5 it would be 4.5 */
  const unlockableLevelWithProgress = extra.cap ? Math.min(uncappedLevel + progress, maxLevel) : levelWithProgress;

  return {
    xp,
    level,
    maxLevel,
    xpCurrent,
    xpForNext,
    progress,
    levelCap,
    uncappedLevel,
    levelWithProgress,
    unlockableLevelWithProgress,
  };
}

function getSlayerLevel(slayer, slayerName) {
  const { xp, claimed_levels } = slayer;

  let currentLevel = 0;
  let progress = 0;
  let xpForNext = 0;

  const maxLevel = Math.max(...Object.keys(constants.slayer_xp[slayerName]));

  for (const level_name in claimed_levels) {
    // Ignoring legacy levels for zombie
    if (slayerName === "zombie" && ["level_7", "level_8", "level_9"].includes(level_name)) {
      continue;
    }

    const level = parseInt(level_name.split("_")[1]);

    if (level > currentLevel) {
      currentLevel = level;
    }
  }

  if (currentLevel < maxLevel) {
    const nextLevel = constants.slayer_xp[slayerName][currentLevel + 1];

    progress = xp / nextLevel;
    xpForNext = nextLevel;
  } else {
    progress = 1;
  }

  return { currentLevel, xp, maxLevel, progress, xpForNext };
}

function getPetLevel(petExp, offsetRarity, maxLevel) {
  const rarityOffset = constants.pet_rarity_offset[offsetRarity];
  const levels = constants.pet_levels.slice(rarityOffset, rarityOffset + maxLevel - 1);

  const xpMaxLevel = levels.reduce((a, b) => a + b, 0);
  let xpTotal = 0;
  let level = 1;

  let xpForNext = Infinity;

  for (let i = 0; i < maxLevel; i++) {
    xpTotal += levels[i];

    if (xpTotal > petExp) {
      xpTotal -= levels[i];
      break;
    } else {
      level++;
    }
  }

  let xpCurrent = Math.floor(petExp - xpTotal);
  let progress;

  if (level < maxLevel) {
    xpForNext = Math.ceil(levels[level - 1]);
    progress = Math.max(0, Math.min(xpCurrent / xpForNext, 1));
  } else {
    level = maxLevel;
    xpCurrent = petExp - levels[maxLevel - 1];
    xpForNext = 0;
    progress = 1;
  }

  return {
    level,
    xpCurrent,
    xpForNext,
    progress,
    xpMaxLevel,
  };
}

function getFairyBonus(fairyExchanges) {
  const bonus = Object.assign({}, constants.stat_template);

  bonus.speed = Math.floor(fairyExchanges / 10);

  for (let i = 0; i < fairyExchanges; i++) {
    bonus.strength += (i + 1) % 5 == 0 ? 2 : 1;
    bonus.defense += (i + 1) % 5 == 0 ? 2 : 1;
    bonus.health += 3 + Math.floor(i / 2);
  }

  return bonus;
}

function getBonusStat(level, skill, max, incremention) {
  const skill_stats = constants.bonus_stats[skill];
  const steps = Object.keys(skill_stats)
    .sort((a, b) => Number(a) - Number(b))
    .map((a) => Number(a));

  const bonus = Object.assign({}, constants.stat_template);

  for (let x = steps[0]; x <= max; x += incremention) {
    if (level < x) {
      break;
    }

    const skill_step = steps
      .slice()
      .reverse()
      .find((a) => a <= x);

    const skill_bonus = skill_stats[skill_step];

    for (const skill in skill_bonus) {
      bonus[skill] += skill_bonus[skill];
    }
  }

  return bonus;
}

// Calculate total health with defense
export function getEffectiveHealth(health, defense) {
  if (defense <= 0) {
    return health;
  }

  return Math.round(health * (1 + defense / 100));
}

async function getBackpackContents(arraybuf) {
  const buf = Buffer.from(arraybuf);

  let data = await parseNbt(buf);
  data = nbt.simplify(data);

  const items = data.i;

  for (const [index, item] of items.entries()) {
    item.isInactive = true;
    item.inBackpack = true;
    item.item_index = index;
  }

  return items;
}

const potionColors = {
  0: "375cc4", // None
  1: "cb5ba9", // Regeneration
  2: "420a09", // Speed
  3: "e19839", // Poison
  4: "4d9130", // Fire Resistance
  5: "f52423", // Instant Health
  6: "1f1f9e", // Night Vision
  7: "22fc4b", // Jump Boost
  8: "474c47", // Weakness
  9: "912423", // Strength
  10: "5c6e83", // Slowness
  11: "f500f5", // Uncraftable
  12: "420a09", // Instant Damage
  13: "2f549c", // Water Breathing
  14: "818595", // Invisibility
  15: "f500f5", // Uncraftable
};

// Process items returned by API
async function processItems(base64, customTextures = false, packs, cacheOnly = false) {
  // API stores data as base64 encoded gzipped Minecraft NBT data
  const buf = Buffer.from(base64, "base64");

  let data = await parseNbt(buf);
  data = nbt.simplify(data);

  let items = data.i;

  // Check backpack contents and add them to the list of items
  for (const [index, item] of items.entries()) {
    if (
      item.tag?.display?.Name.includes("Backpack") ||
      ["NEW_YEAR_CAKE_BAG", "BUILDERS_WAND", "BASKET_OF_SEEDS"].includes(item.tag?.ExtraAttributes?.id)
    ) {
      let backpackData;

      for (const key of Object.keys(item.tag.ExtraAttributes)) {
        if (key.endsWith("_data")) backpackData = item.tag.ExtraAttributes[key];
      }

      if (!Array.isArray(backpackData)) {
        continue;
      }

      const backpackContents = await getBackpackContents(backpackData);

      for (const backpackItem of backpackContents) {
        backpackItem.backpackIndex = index;
      }

      item.containsItems = [];

      items.push(...backpackContents);
    }
  }

  for (const item of items) {
    // Get extra info about certain things
    if (item.tag?.ExtraAttributes != undefined) {
      item.extra = {
        hpbs: 0,
      };
    }

    if (item.tag?.ExtraAttributes?.rarity_upgrades != undefined) {
      const { rarity_upgrades } = item.tag.ExtraAttributes;

      if (rarity_upgrades > 0) {
        item.extra.recombobulated = true;
      }
    }

    if (item.tag?.ExtraAttributes?.hot_potato_count != undefined) {
      item.extra.hpbs = item.tag.ExtraAttributes.hot_potato_count;
    }

    if (item.tag?.ExtraAttributes?.expertise_kills != undefined) {
      const { expertise_kills } = item.tag.ExtraAttributes;

      if (expertise_kills > 0) {
        item.extra.expertise_kills = expertise_kills;
      }
    }

    if (item.tag?.ExtraAttributes?.blocks_walked != undefined) {
      const { blocks_walked } = item.tag.ExtraAttributes;

      if (blocks_walked > 0) {
        item.extra.blocks_walked = blocks_walked;
      }
    }

    if (item.tag?.ExtraAttributes?.timestamp != undefined) {
      const timestamp = item.tag.ExtraAttributes.timestamp;

      if (!isNaN(timestamp)) {
        item.extra.timestamp = timestamp;
      } else {
        item.extra.timestamp = Date.parse(timestamp + " EDT");
      }

      item.extra.timestamp;
    }

    if (item.tag?.ExtraAttributes?.spawnedFor != undefined) {
      item.extra.spawned_for = item.tag.ExtraAttributes.spawnedFor.replaceAll("-", "");
    }

    if (item.tag?.ExtraAttributes?.baseStatBoostPercentage != undefined) {
      item.extra.base_stat_boost = item.tag.ExtraAttributes.baseStatBoostPercentage;
    }

    if (item.tag?.ExtraAttributes?.item_tier != undefined) {
      item.extra.floor = item.tag.ExtraAttributes.item_tier;
    }

    if (item.tag?.ExtraAttributes?.winning_bid != undefined) {
      item.extra.price_paid = item.tag.ExtraAttributes.winning_bid;
    }

    if (item.tag?.ExtraAttributes?.modifier != undefined) {
      item.extra.reforge = item.tag.ExtraAttributes.modifier;
    }

    if (item.tag?.ExtraAttributes?.ability_scroll != undefined) {
      item.extra.ability_scroll = item.tag.ExtraAttributes.ability_scroll;
    }

    if (item.tag?.ExtraAttributes?.mined_crops != undefined) {
      item.extra.crop_counter = item.tag.ExtraAttributes.mined_crops;
    }

    if (item.tag?.ExtraAttributes?.petInfo != undefined) {
      item.tag.ExtraAttributes.petInfo = JSON.parse(item.tag.ExtraAttributes.petInfo);
    }

    if (item.tag?.ExtraAttributes?.gems != undefined) {
      item.extra.gems = item.tag.ExtraAttributes.gems;
    }

    if (item.tag?.ExtraAttributes?.skin != undefined) {
      item.extra.skin = item.tag.ExtraAttributes.skin;
    }

    if (item.tag?.ExtraAttributes?.petInfo?.skin != undefined) {
      item.extra.skin = `PET_SKIN_${item.tag.ExtraAttributes.petInfo.skin}`;
    }

    // Set custom texture for colored leather armor
    if (typeof item.id === "number" && item.id >= 298 && item.id <= 301) {
      const color = item.tag?.display?.color?.toString(16).padStart(6, "0") ?? "955e3b";

      const type = ["helmet", "chestplate", "leggings", "boots"][item.id - 298];

      item.texture_path = `/leather/${type}/${color}`;
    }

    // Set custom texture for colored potions
    if (item.id == 373) {
      const color = potionColors[item.Damage % 16];

      const type = item.Damage & 16384 ? "splash" : "normal";

      item.texture_path = `/potion/${type}/${color}`;
    }

    // Set raw display name without color and formatting codes
    if (item.tag?.display?.Name != undefined) {
      item.display_name = helper.getRawLore(item.tag.display.Name);
    }

    // Resolve skull textures to their image path
    if (
      Array.isArray(item.tag?.SkullOwner?.Properties?.textures) &&
      item.tag.SkullOwner.Properties.textures.length > 0
    ) {
      try {
        const json = JSON.parse(Buffer.from(item.tag.SkullOwner.Properties.textures[0].Value, "base64").toString());
        const url = json.textures.SKIN.url;
        const uuid = url.split("/").pop();

        item.texture_path = `/head/${uuid}?v6`;
      } catch (e) {
        console.error(e);
      }
    }

    // Gives animated texture on certain items, will be overwritten by custom textures
    if (constants.animated_items?.[getId(item)]) {
      item.texture_path = constants.animated_items[getId(item)].texture;
    }

    // Uses animated skin texture
    if (item?.extra?.skin != undefined && constants.animated_items?.[item.extra.skin]) {
      item.texture_path = constants.animated_items[item.extra.skin].texture;
    }

    if (item.tag?.ExtraAttributes?.skin == undefined && customTextures) {
      const customTexture = await getTexture(item, false, packs);

      if (customTexture) {
        item.animated = customTexture.animated;
        item.texture_path = "/" + customTexture.path;
        item.texture_pack = customTexture.pack.config;
        item.texture_pack.base_path =
          "/" + path.relative(path.resolve(__dirname, "..", "public"), customTexture.pack.basePath);
      }
    }

    // Lore stuff
    const itemLore = item?.tag?.display?.Lore ?? [];
    const lore_raw = [...itemLore];

    const lore = lore_raw != null ? lore_raw.map((a) => (a = helper.getRawLore(a))) : [];

    item.rarity = null;
    item.categories = [];

    if (lore.length > 0) {
      // todo: support `item.localized = boolean` when skyblock will support multilanguage

      // item categories, rarity, recombobulated, dungeon, shiny
      const itemType = helper.parseItemTypeFromLore(lore);

      for (const key in itemType) {
        item[key] = itemType[key];
      }

      // fix custom maps texture
      if (item.id == 358) {
        item.id = 395;
        item.Damage = 0;
      }

      item.stats = {};

      // Get item stats from lore
      // we need to use lore_raw so we can get the hpbs (since what part is hpbs depend on color)
      lore_raw.forEach((line) => {
        const split = helper.getRawLore(line).split(":");

        if (split.length < 2) {
          return;
        }

        const statType = split[0];
        const statValue = parseFloat(split[1].trim().replaceAll(",", ""));

        if (statType in constants.statNames) {
          // todo: get rid of common/constants/stats "export const statNames" after nuking this
          item.stats[constants.statNames[statType]] = statValue;
        }
      });

      // Apply Speed Talisman speed bonuses
      if (getId(item) == "SPEED_TALISMAN") {
        item.stats.speed = 1;
      }

      if (getId(item) == "SPEED_RING") {
        item.stats.speed = 3;
      }

      if (getId(item) == "SPEED_ARTIFACT") {
        item.stats.speed = 5;
      }

      // Apply Frozen Chicken bonus
      if (getId(item) == "FROZEN_CHICKEN") {
        item.stats.speed = 1;
      }
    }

    // Set HTML lore to be displayed on the website
    if (itemLore.length > 0) {
      if (item.extra?.recombobulated) {
        itemLore.push("§8(Recombobulated)");
      }

      if (item.extra?.gems) {
        itemLore.push(
          "",
          "§7Applied Gemstones:",
          ...helper.parseItemGems(item.extra.gems, item.rarity).map((gem) => `§7 - ${gem.lore}`)
        );
      }

      if (item.extra?.expertise_kills) {
        const expertise_kills = item.extra.expertise_kills;

        if (lore_raw) {
          itemLore.push("", `§7Expertise Kills: §c${expertise_kills}`);
          if (expertise_kills >= 15000) {
            itemLore.push(`§8MAXED OUT!`);
          } else {
            let toNextLevel = 0;
            for (const e of constants.expertise_kills_ladder) {
              if (expertise_kills < e) {
                toNextLevel = e - expertise_kills;
                break;
              }
            }
            itemLore.push(`§8${toNextLevel} kills to tier up!`);
          }
        }
      }

      if (item.extra?.blocks_walked) {
        const blocks_walked = item.extra.blocks_walked;

        if (lore_raw) {
          itemLore.push("", `§7Blocks Walked: §c${blocks_walked}`);
          if (blocks_walked >= 100000) {
            itemLore.push(`§8MAXED OUT!`);
          } else {
            let toNextLevel = 0;
            for (const e of constants.prehistoric_egg_blocks_walked_ladder) {
              if (blocks_walked < e) {
                toNextLevel = e - blocks_walked;
                break;
              }
            }
            itemLore.push(`§8Walk ${toNextLevel} blocks to tier up!`);
          }
        }
      }

      if (item.tag?.display?.color) {
        const hex = item.tag.display.color.toString(16).padStart(6, "0");
        itemLore.push("", `§7Color: #${hex.toUpperCase()}`);
      }

      if (item.extra?.timestamp) {
        itemLore.push("", `§7Obtained: §c<local-time timestamp="${item.extra.timestamp}"></local-time>`);
      }

      if (item.extra?.spawned_for) {
        if (!item.extra.timestamp) {
          itemLore.push("");
        }

        const spawnedFor = item.extra.spawned_for;
        const spawnedForUser = await helper.resolveUsernameOrUuid(spawnedFor, db, cacheOnly);

        itemLore.push(`§7By: §c<a href="/stats/${spawnedFor}">${spawnedForUser.display_name}</a>`);
      }

      if (item.extra?.base_stat_boost) {
        itemLore.push(
          "",
          `§7Dungeon Item Quality: ${item.extra.base_stat_boost == 50 ? "§6" : "§c"}${item.extra.base_stat_boost}/50%`
        );
      }

      if (item.extra?.floor) {
        itemLore.push(`§7Obtained From: §bFloor ${item.extra.floor}`);
      }

      if (item.extra?.price_paid) {
        itemLore.push(`§7Price Paid at Dark Auction: §b${item.extra.price_paid.toLocaleString()} coins`);
      }
    }

    if (!("display_name" in item) && "id" in item) {
      const vanillaItem = mcData.items[item.id];

      if ("displayName" in vanillaItem) {
        item.display_name = vanillaItem.displayName;
      }
    }
  }

  for (const item of items) {
    if (item.inBackpack) {
      items[item.backpackIndex].containsItems.push(Object.assign({}, item));
    }
  }

  items = items.filter((a) => !a.inBackpack);

  return items;
}

export function getMinions(coopMembers) {
  const minions = [];

  const craftedGenerators = [];

  for (const member in coopMembers) {
    if (!("crafted_generators" in coopMembers[member])) {
      continue;
    }

    craftedGenerators.push(...coopMembers[member].crafted_generators);
  }

  for (const generator of craftedGenerators) {
    const split = generator.split("_");

    const minionLevel = parseInt(split.pop());
    const minionName = split.join("_");

    const minion = minions.find((a) => a.id == minionName);

    if (minion == undefined) {
      minions.push(
        Object.assign({ id: minionName, maxLevel: 0, levels: [minionLevel] }, constants.minions[minionName])
      );
    } else {
      minion.levels.push(minionLevel);
    }
  }

  for (const minion in constants.minions) {
    if (minions.find((a) => a.id == minion) == undefined) {
      minions.push(Object.assign({ id: minion, levels: [], maxLevel: 0 }, constants.minions[minion]));
    }
  }

  for (const minion of minions) {
    minion.levels = _.uniq(minion.levels.sort((a, b) => a - b));
    minion.maxLevel = minion.levels.length > 0 ? Math.max(...minion.levels) : 0;
    minion.tiers = minion.tiers != null ? minion.tiers : 11;

    if (!("name" in minion)) {
      minion.name = _.startCase(_.toLower(minion.id));
    }
  }

  return minions;
}

export function getMinionSlots(minions) {
  let uniqueMinions = 0;

  for (const minion of minions) {
    uniqueMinions += minion.levels.length;
  }

  const output = { currentSlots: 5, toNext: 5 };

  const uniquesRequired = Object.keys(constants.minion_slots).sort((a, b) => parseInt(a) - parseInt(b));

  for (const [index, uniques] of uniquesRequired.entries()) {
    if (parseInt(uniques) <= uniqueMinions) {
      continue;
    }

    output.currentSlots = constants.minion_slots[uniquesRequired[index - 1]];
    output.toNextSlot = uniquesRequired[index] - uniqueMinions;
    break;
  }

  return output;
}

export const getItems = async (
  profile,
  customTextures = false,
  packs,
  options = { cacheOnly: false, debugId: `${helper.getClusterId()}/unknown@getItems` }
) => {
  const output = {};

  console.debug(`${options.debugId}: getItems called.`);
  const timeStarted = Date.now();

  // Process inventories returned by API
  const armor =
    "inv_armor" in profile ? await processItems(profile.inv_armor.data, customTextures, packs, options.cacheOnly) : [];
  const inventory =
    "inv_contents" in profile
      ? await processItems(profile.inv_contents.data, customTextures, packs, options.cacheOnly)
      : [];
  const wardrobe_inventory =
    "wardrobe_contents" in profile
      ? await processItems(profile.wardrobe_contents.data, customTextures, packs, options.cacheOnly)
      : [];
  let enderchest =
    "ender_chest_contents" in profile
      ? await processItems(profile.ender_chest_contents.data, customTextures, packs, options.cacheOnly)
      : [];
  const accessory_bag =
    "talisman_bag" in profile
      ? await processItems(profile.talisman_bag.data, customTextures, packs, options.cacheOnly)
      : [];
  const fishing_bag =
    "fishing_bag" in profile
      ? await processItems(profile.fishing_bag.data, customTextures, packs, options.cacheOnly)
      : [];
  const quiver =
    "quiver" in profile ? await processItems(profile.quiver.data, customTextures, packs, options.cacheOnly) : [];
  const potion_bag =
    "potion_bag" in profile
      ? await processItems(profile.potion_bag.data, customTextures, packs, options.cacheOnly)
      : [];
  const candy_bag =
    "candy_inventory_contents" in profile
      ? await processItems(profile.candy_inventory_contents.data, customTextures, packs, options.cacheOnly)
      : [];
  const personal_vault =
    "personal_vault_contents" in profile
      ? await processItems(profile.personal_vault_contents.data, customTextures, packs, options.cacheOnly)
      : [];

  let storage = [];
  if (profile.backpack_contents) {
    const storage_size = Math.max(18, Object.keys(profile.backpack_contents).length);
    for (let slot = 0; slot < storage_size; slot++) {
      storage.push({});

      if (profile.backpack_contents[slot] && profile.backpack_icons[slot]) {
        const icon = await processItems(profile.backpack_icons[slot].data, customTextures, packs, options.cacheOnly);
        const items = await processItems(
          profile.backpack_contents[slot].data,
          customTextures,
          packs,
          options.cacheOnly
        );

        for (const [index, item] of items.entries()) {
          item.isInactive = true;
          item.inBackpack = true;
          item.item_index = index;
        }

        const storage_unit = icon[0];
        storage_unit.containsItems = items;
        storage[slot] = storage_unit;
      }
    }
  }

  const wardrobeColumns = wardrobe_inventory.length / 4;

  const wardrobe = [];

  for (let i = 0; i < wardrobeColumns; i++) {
    const page = Math.floor(i / 9);

    const wardrobeSlot = [];

    for (let j = 0; j < 4; j++) {
      const index = 36 * page + (i % 9) + j * 9;

      if (getId(wardrobe_inventory[index]).length > 0) {
        wardrobeSlot.push(wardrobe_inventory[index]);
      } else {
        wardrobeSlot.push(null);
      }
    }

    if (wardrobeSlot.find((a) => a !== null) != undefined) {
      wardrobe.push(wardrobeSlot);
    }
  }

  let hotm = "mining_core" in profile ? await getHotmItems(profile, packs) : [];

  output.armor = armor.filter((x) => x.rarity);
  output.wardrobe = wardrobe;
  output.wardrobe_inventory = wardrobe_inventory;
  output.inventory = inventory;
  output.enderchest = enderchest;
  output.accessory_bag = accessory_bag;
  output.fishing_bag = fishing_bag;
  output.quiver = quiver;
  output.potion_bag = potion_bag;
  output.personal_vault = personal_vault;
  output.storage = storage;
  output.hotm = hotm;

  const all_items = armor.concat(
    inventory,
    enderchest,
    accessory_bag,
    fishing_bag,
    quiver,
    potion_bag,
    personal_vault,
    wardrobe_inventory,
    storage,
    hotm
  );

  for (const [index, item] of all_items.entries()) {
    item.item_index = index;
    item.itemId = v4("itemId");

    if ("containsItems" in item && Array.isArray(item.containsItems)) {
      item.containsItems.forEach((a, idx) => {
        a.backpackIndex = item.item_index;
        a.itemId = v4("itemId");
      });
    }
  }

  // All items not in the inventory or accessory bag should be inactive so they don't contribute to the total stats
  enderchest = enderchest.map((a) => Object.assign({ isInactive: true }, a));
  storage = storage.map((a) => Object.assign({ isInactive: true }, a));
  hotm = hotm.map((a) => Object.assign({ isInactive: true }, a));

  // Add candy bag contents as backpack contents to candy bag
  for (const item of all_items) {
    if (getId(item) == "TRICK_OR_TREAT_BAG") {
      item.containsItems = candy_bag;
    }
  }

  const accessories = [];
  const accessory_ids = [];
  const accessory_rarities = {
    common: 0,
    uncommon: 0,
    rare: 0,
    epic: 0,
    legendary: 0,
    mythic: 0,
    hegemony: null,
  };

  // Modify accessories on armor and add
  for (const accessory of armor.filter((a) => a.categories.includes("accessory"))) {
    const id = getId(accessory);

    if (id === "") {
      continue;
    }

    const insertAccessory = Object.assign({ isUnique: true, isInactive: false }, accessory);

    if (accessories.find((a) => !a.isInactive && getId(a) == id) != undefined) {
      insertAccessory.isInactive = true;
    }

    if (accessories.find((a) => getId(a) == id) != undefined) {
      insertAccessory.isUnique = false;
    }

    accessories.push(insertAccessory);
    accessory_ids.push(id);
  }

  // Add accessories from inventory
  for (const accessory of inventory.filter((a) => a.categories.includes("accessory"))) {
    const id = getId(accessory);

    if (id === "") {
      continue;
    }

    const insertAccessory = Object.assign({ isUnique: true, isInactive: false }, accessory);

    if (accessories.find((a) => !a.isInactive && getId(a) == id) != undefined) {
      insertAccessory.isInactive = true;
    }

    if (accessories.find((a) => getId(a) == id) != undefined) {
      insertAccessory.isUnique = false;
    }

    accessories.push(insertAccessory);
    accessory_ids.push(id);
  }

  // Add accessories from accessory bag if not already in inventory
  for (const accessory of accessory_bag) {
    const id = getId(accessory);

    if (id === "") {
      continue;
    }

    const insertAccessory = Object.assign({ isUnique: true, isInactive: false }, accessory);

    if (accessories.find((a) => !a.isInactive && getId(a) == id) != undefined) {
      insertAccessory.isInactive = true;
    }

    if (accessories.find((a) => getId(a) == id) != undefined) {
      insertAccessory.isUnique = false;
    }

    accessories.push(insertAccessory);
    accessory_ids.push(id);
    accessory_rarities[insertAccessory.rarity]++;
    if (id == "HEGEMONY_ARTIFACT") {
      accessory_rarities.hegemony = { rarity: insertAccessory.rarity };
    }
  }

  // Add inactive accessories from enderchest and backpacks
  for (const item of inventory.concat(enderchest, storage)) {
    // filter out filler or empty slots (such as empty storage slot)
    if (!("categories" in item)) {
      continue;
    }

    let items = [item];

    if (!item.categories.includes("accessory") && "containsItems" in item && Array.isArray(item.containsItems)) {
      items = item.containsItems.slice(0);
    }

    for (const accessory of items.filter((a) => a.categories.includes("accessory"))) {
      const id = getId(accessory);

      const insertAccessory = Object.assign({ isUnique: true, isInactive: true }, accessory);

      if (accessories.find((a) => getId(a) == id) != undefined) {
        insertAccessory.isUnique = false;
      }

      accessories.push(insertAccessory);
      accessory_ids.push(id);
    }
  }

  // Don't account for lower tier versions of the same accessory
  for (const accessory of accessories.concat(armor)) {
    const id = getId(accessory);

    if (id.startsWith("CAMPFIRE_TALISMAN_")) {
      const tier = parseInt(id.split("_").pop());

      const maxTier = Math.max(
        ...accessories.filter((a) => getId(a).startsWith("CAMPFIRE_TALISMAN_")).map((a) => getId(a).split("_").pop())
      );

      if (tier < maxTier) {
        accessory.isUnique = false;
        accessory.isInactive = true;
      }

      accessory_ids.splice(accessory_ids.indexOf(id), 1, `CAMPFIRE_TALISMAN_${maxTier}`);
    }

    if (id.startsWith("WEDDING_RING_")) {
      const tier = parseInt(id.split("_").pop());

      const maxTier = Math.max(
        ...accessories.filter((a) => getId(a).startsWith("WEDDING_RING_")).map((a) => getId(a).split("_").pop())
      );

      if (tier < maxTier) {
        accessory.isUnique = false;
        accessory.isInactive = true;
      }

      accessory_ids.splice(accessory_ids.indexOf(id), 1, `WEDDING_RING_${maxTier}`);
    }

    if (id in constants.accessory_upgrades) {
      const accessoryUpgrades = constants.accessory_upgrades[id];

      if (accessories.find((a) => !a.isInactive && accessoryUpgrades.includes(getId(a))) != undefined) {
        accessory.isInactive = true;
      }

      if (accessories.find((a) => accessoryUpgrades.includes(getId(a))) != undefined) {
        accessory.isUnique = false;
      }
    }

    if (id in constants.accessory_duplicates) {
      const accessoryDuplicates = constants.accessory_duplicates[id];

      if (accessories.find((a) => accessoryDuplicates.includes(getId(a))) != undefined) {
        accessory.isUnique = false;
      }
    }
  }

  // Add New Year Cake Bag health bonus (1 per unique cake)
  for (const accessory of accessories) {
    const id = getId(accessory);
    const cakes = [];

    if (id == "NEW_YEAR_CAKE_BAG" && Array.isArray(accessory?.containsItems)) {
      accessory.stats.health = 0;

      for (const item of accessory.containsItems) {
        if (
          item.tag?.ExtraAttributes?.new_years_cake != undefined &&
          !cakes.includes(item.tag.ExtraAttributes.new_years_cake)
        ) {
          accessory.stats.health++;
          cakes.push(item.tag.ExtraAttributes.new_years_cake);
        }
      }
    }
  }

  for (const accessory of accessories) {
    accessory.base_name = accessory.display_name;

    if (accessory.tag?.ExtraAttributes?.modifier != undefined) {
      accessory.base_name = accessory.display_name.split(" ").slice(1).join(" ");
      accessory.reforge = accessory.tag.ExtraAttributes.modifier;
    }

    if (accessory.tag?.ExtraAttributes?.accessory_enrichment != undefined) {
      accessory.enrichment = accessory.tag.ExtraAttributes.accessory_enrichment;
    }
  }

  output.accessories = accessories;
  output.accessory_ids = accessory_ids;
  output.accessory_rarities = accessory_rarities;

  output.weapons = all_items.filter((a) => a.categories?.includes("weapon"));
  output.farming_tools = all_items.filter((a) => a.categories?.includes("farming_tool"));
  output.mining_tools = all_items.filter((a) => a.categories?.includes("mining_tool"));
  output.fishing_tools = all_items.filter((a) => a.categories?.includes("fishing_tool"));

  output.pets = all_items
    .filter((a) => a.tag?.ExtraAttributes?.petInfo)
    .map((a) => ({
      uuid: a.tag.ExtraAttributes.uuid,
      type: a.tag.ExtraAttributes.petInfo.type,
      exp: a.tag.ExtraAttributes.petInfo.exp,
      active: a.tag.ExtraAttributes.petInfo.active,
      tier: a.tag.ExtraAttributes.petInfo.tier,
      heldItem: a.tag.ExtraAttributes.petInfo.heldItem || null,
      candyUsed: a.tag.ExtraAttributes.petInfo.candyUsed,
      skin: a.tag.ExtraAttributes.petInfo.skin || null,
    }));

  for (const item of all_items) {
    if (!Array.isArray(item.containsItems)) {
      continue;
    }

    output.weapons.push(...item.containsItems.filter((a) => a.categories.includes("weapon")));
    output.farming_tools.push(...item.containsItems.filter((a) => a.categories.includes("farming_tool")));
    output.mining_tools.push(...item.containsItems.filter((a) => a.categories.includes("mining_tool")));
    output.fishing_tools.push(...item.containsItems.filter((a) => a.categories.includes("fishing_tool")));

    output.pets.push(
      ...item.containsItems
        .filter((a) => a.tag?.ExtraAttributes?.petInfo)
        .map((a) => ({
          uuid: a.tag.ExtraAttributes.uuid,
          type: a.tag.ExtraAttributes.petInfo.type,
          exp: a.tag.ExtraAttributes.petInfo.exp,
          active: a.tag.ExtraAttributes.petInfo.active,
          tier: a.tag.ExtraAttributes.petInfo.tier,
          heldItem: a.tag.ExtraAttributes.petInfo.heldItem || null,
          candyUsed: a.tag.ExtraAttributes.petInfo.candyUsed,
          skin: a.tag.ExtraAttributes.petInfo.skin || null,
        }))
    );
  }

  // Check if inventory access disabled by user
  if (inventory.length == 0) {
    output.no_inventory = true;
  }

  // Same for personal vault
  if (personal_vault.length == 0) {
    output.no_personal_vault = true;
  }

  const itemSorter = (a, b) => {
    if (a.rarity !== b.rarity) {
      return constants.rarities.indexOf(b.rarity) - constants.rarities.indexOf(a.rarity);
    }

    if (b.inBackpack && !a.inBackpack) {
      return -1;
    }
    if (a.inBackpack && !b.inBackpack) {
      return 1;
    }

    return a.item_index - b.item_index;
  };

  // Sort accessories, weapons and rods by rarity
  output.weapons = output.weapons.sort(itemSorter);
  output.fishing_tools = output.fishing_tools.sort(itemSorter);
  output.farming_tools = output.farming_tools.sort(itemSorter);
  output.mining_tools = output.mining_tools.sort(itemSorter);
  output.accessories = output.accessories.sort(itemSorter);

  const countsOfId = {};

  for (const weapon of output.weapons) {
    const id = getId(weapon);

    countsOfId[id] = (countsOfId[id] || 0) + 1;

    if (id == "BONE_BOOMERANG") {
      if (countsOfId[id] > 6) {
        weapon.hidden = true;
      }
    } else if (countsOfId[id] > 2) {
      weapon.hidden = true;
    }
  }

  for (const item of output.fishing_tools) {
    const id = getId(item);

    countsOfId[id] = (countsOfId[id] || 0) + 1;

    if (countsOfId[id] > 2) {
      item.hidden = true;
    }
  }

  const swords = output.weapons.filter((a) => a.categories.includes("sword"));
  const bows = output.weapons.filter((a) => a.categories.includes("bow"));

  const swordsInventory = swords.filter((a) => a.backpackIndex === undefined);
  const bowsInventory = bows.filter((a) => a.backpackIndex === undefined);
  const fishingtoolsInventory = output.fishing_tools.filter((a) => a.backpackIndex === undefined);
  const farmingtoolsInventory = output.farming_tools.filter((a) => a.backpackIndex === undefined);
  const miningtoolsInventory = output.mining_tools.filter((a) => a.backpackIndex === undefined);

  if (swords.length > 0) {
    output.highest_rarity_sword = swordsInventory
      .filter((a) => a.rarity == swordsInventory[0].rarity)
      .sort((a, b) => a.item_index - b.item_index)[0];
  }

  if (bows.length > 0) {
    output.highest_rarity_bow = bowsInventory
      .filter((a) => a.rarity == bowsInventory[0].rarity)
      .sort((a, b) => a.item_index - b.item_index)[0];
  }

  if (output.fishing_tools.length > 0) {
    output.highest_rarity_fishing_tool = fishingtoolsInventory
      .filter((a) => a.rarity == fishingtoolsInventory[0].rarity)
      .sort((a, b) => a.item_index - b.item_index)[0];
  }

  if (output.farming_tools.length > 0) {
    output.highest_rarity_farming_tool = farmingtoolsInventory
      .filter((a) => a.rarity == farmingtoolsInventory[0].rarity)
      .sort((a, b) => a.item_index - b.item_index)[0];
  }

  if (output.mining_tools.length > 0) {
    output.highest_rarity_mining_tool = miningtoolsInventory
      .filter((a) => a.rarity == miningtoolsInventory[0].rarity)
      .sort((a, b) => a.item_index - b.item_index)[0];
  }

  if (armor.filter((x) => x.rarity).length === 1) {
    const armorPiece = armor.find((x) => x.rarity);

    output.armor_set = armorPiece.display_name;
    output.armor_set_rarity = armorPiece.rarity;
  }

  // Full armor set (4 pieces)
  if (armor.filter((x) => x.rarity).length === 4) {
    let output_name;
    let reforgeName;

    // Getting armor_name
    armor.forEach((armorPiece) => {
      let name = armorPiece.display_name;

      // Removing stars
      name = name.replaceAll(/✪|⍟/g, "").trim();

      // Removing skin
      name = name.replaceAll("✦", "").trim();

      // Removing modifier
      if (armorPiece.tag?.ExtraAttributes?.modifier != undefined) {
        name = name.split(" ").slice(1).join(" ");
      }

      // Converting armor_name to generic name
      // Ex: Superior Dragon Helmet -> Superior Dragon Armor
      if (/^Armor .*? (Helmet|Chestplate|Leggings|Boots)$/g.test(name)) {
        // name starts with Armor and ends with piece name, remove piece name
        name = name.replaceAll(/(Helmet|Chestplate|Leggings|Boots)/g, "").trim();
      } else {
        // removing old 'Armor' and replacing the piece name with 'Armor'
        name = name.replace("Armor", "").replace("  ", " ").trim();
        name = name.replaceAll(/(Helmet|Chestplate|Leggings|Boots)/g, "Armor").trim();
      }

      armorPiece.armor_name = name;
    });

    // Getting full armor reforge (same reforge on all pieces)
    if (
      armor.filter(
        (a) =>
          a.tag?.ExtraAttributes?.modifier != undefined &&
          a.tag?.ExtraAttributes?.modifier == armor[0].tag.ExtraAttributes.modifier
      ).length == 4
    ) {
      reforgeName = armor[0].display_name.split(" ")[0];
    }

    // Handling normal sets of armor
    if (armor.filter((a) => a.armor_name == armor[0].armor_name).length == 4) {
      output_name = armor[0].armor_name;
    }

    // Handling special sets of armor (where pieces aren't named the same)
    constants.special_sets.forEach((set) => {
      if (armor.filter((a) => set.pieces.includes(getId(a))).length == 4) {
        output_name = set.name;
      }
    });

    // Finalizing the output
    if (reforgeName && output_name) {
      output_name = reforgeName + " " + output_name;
    }

    output.armor_set = output_name;
    output.armor_set_rarity = constants.rarities[Math.max(...armor.map((a) => helper.rarityNameToInt(a.rarity)))];
  }

  console.debug(`${options.debugId}: getItems returned. (${Date.now() - timeStarted}ms)`);
  return output;
};

export async function getLevels(userProfile, hypixelProfile, levelCaps) {
  const output = {};

  let skillLevels;
  let totalSkillXp = 0;
  let average_level = 0;

  // Apply skill bonuses
  if (
    "experience_skill_taming" in userProfile ||
    "experience_skill_farming" in userProfile ||
    "experience_skill_mining" in userProfile ||
    "experience_skill_combat" in userProfile ||
    "experience_skill_foraging" in userProfile ||
    "experience_skill_fishing" in userProfile ||
    "experience_skill_enchanting" in userProfile ||
    "experience_skill_alchemy" in userProfile ||
    "experience_skill_carpentry" in userProfile ||
    "experience_skill_runecrafting" in userProfile ||
    "experience_skill_social" in userProfile
  ) {
    let average_level_no_progress = 0;

    skillLevels = {
      taming: getLevelByXp(userProfile.experience_skill_taming, { skill: "taming" }),
      farming: getLevelByXp(userProfile.experience_skill_farming, {
        skill: "farming",
        cap: levelCaps?.farming,
      }),
      mining: getLevelByXp(userProfile.experience_skill_mining, { skill: "mining" }),
      combat: getLevelByXp(userProfile.experience_skill_combat, { skill: "combat" }),
      foraging: getLevelByXp(userProfile.experience_skill_foraging, { skill: "foraging" }),
      fishing: getLevelByXp(userProfile.experience_skill_fishing, { skill: "fishing" }),
      enchanting: getLevelByXp(userProfile.experience_skill_enchanting, { skill: "enchanting" }),
      alchemy: getLevelByXp(userProfile.experience_skill_alchemy, { skill: "alchemy" }),
      carpentry: getLevelByXp(userProfile.experience_skill_carpentry, { skill: "carpentry" }),
      runecrafting: getLevelByXp(userProfile.experience_skill_runecrafting, {
        skill: "runecrafting",
        type: "runecrafting",
      }),
      social: getLevelByXp(userProfile.experience_skill_social, {
        skill: "social",
        type: "social",
      }),
    };

    for (const skill in skillLevels) {
      if (!constants.cosmetic_skills.includes(skill)) {
        average_level += skillLevels[skill].level + skillLevels[skill].progress;
        average_level_no_progress += skillLevels[skill].level;

        totalSkillXp += skillLevels[skill].xp;
      }
    }

    output.average_level =
      average_level / (Object.keys(skillLevels).length - Object.keys(constants.cosmetic_skills).length);
    output.average_level_no_progress =
      average_level_no_progress / (Object.keys(skillLevels).length - Object.keys(constants.cosmetic_skills).length);
    output.total_skill_xp = totalSkillXp;

    output.levels = Object.assign({}, skillLevels);
  } else {
    skillLevels = {
      farming: hypixelProfile.achievements.skyblock_harvester || 0,
      mining: hypixelProfile.achievements.skyblock_excavator || 0,
      combat: hypixelProfile.achievements.skyblock_combat || 0,
      foraging: hypixelProfile.achievements.skyblock_gatherer || 0,
      fishing: hypixelProfile.achievements.skyblock_angler || 0,
      enchanting: hypixelProfile.achievements.skyblock_augmentation || 0,
      alchemy: hypixelProfile.achievements.skyblock_concoctor || 0,
      taming: hypixelProfile.achievements.skyblock_domesticator || 0,
    };

    output.levels = {};

    let skillsAmount = 0;

    for (const skill in skillLevels) {
      output.levels[skill] = getXpByLevel(skillLevels[skill], { skill: skill });

      if (skillLevels[skill] < 0) {
        continue;
      }

      skillsAmount++;
      average_level += output.levels[skill].level;

      totalSkillXp += output.levels[skill].xp;
    }

    output.average_level = average_level / skillsAmount;
    output.average_level_no_progress = output.average_level;
    output.total_skill_xp = totalSkillXp;
  }

  const multi = redisClient.pipeline();

  const skillNames = Object.keys(output.levels);

  for (const skill of skillNames) {
    if (output.levels[skill].xp == null) {
      output.levels[skill].rank = 0;
      continue;
    }

    multi.zcount(`lb_skill_${skill}_xp`, output.levels[skill].xp, "+inf");
  }

  const results = await multi.exec();

  for (const [index, skill] of skillNames.entries()) {
    output.levels[skill].rank = results[index][1];
  }

  output.average_level_rank = await redisClient.zcount([`lb_average_level`, output.average_level, "+inf"]);

  return output;
}

export const getStats = async (
  db,
  profile,
  allProfiles,
  items,
  options = { cacheOnly: false, debugId: `${helper.getClusterId()}/unknown@getStats` }
) => {
  const output = {};

  console.debug(`${options.debugId}: getStats called.`);
  const timeStarted = Date.now();

  const userProfile = profile.members[profile.uuid];
  const hypixelProfile = await helper.getRank(profile.uuid, db, options.cacheOnly);

  output.stats = Object.assign({}, constants.base_stats);

  if (isNaN(userProfile.fairy_souls_collected)) {
    userProfile.fairy_souls_collected = 0;
  }

  output.fairy_bonus = {};

  if (userProfile.fairy_exchanges > 0) {
    const fairyBonus = getFairyBonus(userProfile.fairy_exchanges);

    output.fairy_bonus = Object.assign({}, fairyBonus);

    // Apply fairy soul bonus
    for (const stat in fairyBonus) {
      output.stats[stat] += fairyBonus[stat];
    }
  }
  const totalSouls =
    profile.game_mode === "island" ? constants.fairy_souls.max.stranded : constants.fairy_souls.max.normal;

  output.fairy_souls = {
    collected: userProfile.fairy_souls_collected,
    total: totalSouls,
    progress: userProfile.fairy_souls_collected / totalSouls,
  };

  const levelCaps = {
    farming: constants.default_skill_caps.farming + (userProfile.jacob2?.perks?.farming_level_cap || 0),
  };

  const { levels, average_level, average_level_no_progress, total_skill_xp, average_level_rank } = await getLevels(
    userProfile,
    hypixelProfile,
    levelCaps
  );

  output.levels = levels;
  output.average_level = average_level;
  output.average_level_no_progress = average_level_no_progress;
  output.total_skill_xp = total_skill_xp;
  output.average_level_rank = average_level_rank;
  output.level_caps = levelCaps;
  output.fairy_exchanges = userProfile.fairy_exchanges;

  output.skill_bonus = {};

  for (const skill in levels) {
    if (levels[skill].level == 0) {
      continue;
    }

    // todo: when removing backend stats, nuke this and the src/constants/bonuses.js
    const skillBonus = getBonusStat(levels[skill].level || levels[skill], `${skill}_skill`, levels[skill].levelCap, 1);

    output.skill_bonus[skill] = Object.assign({}, skillBonus);

    for (const stat in skillBonus) {
      output.stats[stat] += skillBonus[stat];
    }
  }

  output.slayer_coins_spent = {};

  // Apply slayer bonuses
  if ("slayer_bosses" in userProfile) {
    output.slayer_bonus = {};

    const slayers = {};

    if ("slayer_bosses" in userProfile) {
      for (const slayerName in userProfile.slayer_bosses) {
        const slayer = userProfile.slayer_bosses[slayerName];

        if (!("claimed_levels" in slayer)) {
          continue;
        }

        slayers[slayerName] = {
          level: getSlayerLevel(slayer, slayerName),
          kills: {},
        };

        for (const property in slayer) {
          slayers[slayerName][property] = slayer[property];

          if (property.startsWith("boss_kills_tier_")) {
            const tier = parseInt(property.replace("boss_kills_tier_", "")) + 1;

            slayers[slayerName].kills[tier] = slayer[property];

            output.slayer_coins_spent[slayerName] =
              (output.slayer_coins_spent[slayerName] || 0) + slayer[property] * constants.slayer_cost[tier];
          }
        }
      }

      for (const slayerName in output.slayer_coins_spent) {
        output.slayer_coins_spent.total =
          (output.slayer_coins_spent.total || 0) + output.slayer_coins_spent[slayerName];
      }

      output.slayer_coins_spent.total = output.slayer_coins_spent.total || 0;
    }

    output.slayer_xp = 0;

    for (const slayer in slayers) {
      if (slayers[slayer]?.level?.currentLevel == undefined) {
        continue;
      }

      const slayerBonus = getBonusStat(slayers[slayer].level.currentLevel, `${slayer}_slayer`, 9, 1);

      output.slayer_bonus[slayer] = Object.assign({}, slayerBonus);

      output.slayer_xp += slayers[slayer].xp || 0;

      for (const stat in slayerBonus) {
        output.stats[stat] += slayerBonus[stat];
      }
    }

    output.slayers = Object.assign({}, slayers);
  }

  if (!items.no_inventory) {
    output.missingAccessories = await getMissingAccessories(items.accessory_ids);
  }

  if (!userProfile.pets) {
    userProfile.pets = [];
  }
  userProfile.pets.push(...items.pets);

  output.pets = await getPets(userProfile);
  output.missingPets = await getMissingPets(output.pets, profile.game_mode);
  output.petScore = await getPetScore(output.pets);

  const petScoreRequired = Object.keys(constants.pet_rewards).sort((a, b) => parseInt(b) - parseInt(a));

  output.pet_bonus = {};

  // eslint-disable-next-line no-unused-vars
  for (const [index, score] of petScoreRequired.entries()) {
    if (parseInt(score) > output.petScore) {
      continue;
    }

    output.pet_score_bonus = Object.assign({}, constants.pet_rewards[score]);

    break;
  }

  for (const pet of output.pets) {
    if (!pet.active) {
      continue;
    }

    for (const stat in pet.stats) {
      output.pet_bonus[stat] = (output.pet_bonus[stat] || 0) + pet.stats[stat];
    }
  }

  // Apply all harp bonuses when Melody's Hair has been acquired
  if (items.accessories.filter((a) => getId(a) == "MELODY_HAIR").length == 1) {
    output.stats.intelligence += 26;
  }

  // Apply pet score bonus
  for (const stat in output.pet_score_bonus) {
    output.stats[stat] += output.pet_score_bonus[stat];
  }

  output.base_stats = Object.assign({}, output.stats);

  // Apply stats from pets
  for (const stat in output.pet_bonus) {
    output.stats[stat] += output.pet_bonus[stat];
  }

  // Apply Lapis Armor full set bonus of +60 HP
  if (items.armor.filter((a) => getId(a).startsWith("LAPIS_ARMOR_")).length == 4) {
    items.armor[0].stats.health = (items.armor[0].stats.health || 0) + 60;
  }

  // Apply Emerald Armor full set bonus of +1 HP and +1 Defense per 3000 emeralds in collection with a maximum of 300
  if (
    !isNaN(userProfile.collection?.EMERALD) &&
    items.armor.filter((a) => getId(a).startsWith("EMERALD_ARMOR_")).length == 4
  ) {
    const emerald_bonus = Math.min(350, Math.floor(userProfile.collection.EMERALD / 3000));

    items.armor[0].stats.health += emerald_bonus;
    items.armor[0].stats.defense += emerald_bonus;
  }

  // Apply Fairy Armor full set bonus of +10 Speed
  if (items.armor.filter((a) => getId(a).startsWith("FAIRY_")).length == 4) {
    items.armor[0].stats.speed += 10;
  }

  // Apply Speedster Armor full set bonus of +20 Speed
  if (items.armor.filter((a) => getId(a).startsWith("SPEEDSTER_")).length == 4) {
    items.armor[0].stats.speed += 20;
  }

  // Apply Young Dragon Armor full set bonus of +70 Speed
  if (items.armor.filter((a) => getId(a).startsWith("YOUNG_DRAGON_")).length == 4) {
    items.armor[0].stats.speed += 70;
  }

  // Apply basic armor stats
  for (const item of items.armor) {
    if (item.isInactive || item.categories.includes("accessory")) {
      item.stats = {};

      if (getId(item) != "PARTY_HAT_CRAB") {
        continue;
      }

      for (const lore of item.tag.display.Lore) {
        const line = helper.getRawLore(lore);

        if (line.startsWith("Your bonus: ")) {
          item.stats.intelligence = parseInt(line.split(" ")[2].substring(1));
          break;
        }
      }
    }

    for (const stat in item.stats) {
      output.stats[stat] += item.stats[stat];
    }
  }

  // Apply stats of active accessories
  items.accessories
    .filter((a) => Object.keys(a).length != 0 && !a.isInactive)
    .forEach((item) => {
      for (const stat in item.stats) {
        output.stats[stat] += item.stats[stat];
      }
    });

  // Apply Mastiff Armor full set bonus of +50 HP per 1% Crit Damage
  if (items.armor.filter((a) => getId(a).startsWith("MASTIFF_")).length == 4) {
    output.stats.health += 50 * output.stats.crit_damage;
    items.armor[0].stats.health += 50 * output.stats.crit_damage;
  }

  // Apply +5 Defense and +5 Strength of Day/Night Crystal only if both are owned as this is required for a permanent bonus
  if (
    items.accessories.filter((a) => !a.isInactive && ["DAY_CRYSTAL", "NIGHT_CRYSTAL"].includes(getId(a))).length == 2
  ) {
    output.stats.defense += 5;
    output.stats.strength += 5;

    const dayCrystal = items.accessories.find((a) => getId(a) == "DAY_CRYSTAL");

    dayCrystal.stats.defense = (dayCrystal.stats.defense || 0) + 5;
    dayCrystal.stats.strength = (dayCrystal.stats.strength || 0) + 5;
  }

  // Apply Obsidian Chestplate bonus of +1 Speed per 20 Obsidian in inventory
  if (items.armor.filter((a) => getId(a) == "OBSIDIAN_CHESTPLATE").length == 1) {
    let obsidian = 0;

    for (const item of items.inventory) {
      if (item.id == 49) {
        obsidian += item.Count;
      }
    }

    output.stats.speed += Math.floor(obsidian / 20);
  }

  if (items.armor.filter((a) => getId(a).startsWith("CHEAP_TUXEDO_")).length == 3) {
    output.stats["health"] = 75;
  }

  if (items.armor.filter((a) => getId(a).startsWith("FANCY_TUXEDO_")).length == 3) {
    output.stats["health"] = 150;
  }

  if (items.armor.filter((a) => getId(a).startsWith("ELEGANT_TUXEDO_")).length == 3) {
    output.stats["health"] = 250;
  }

  output.weapon_stats = {};

  for (const item of [
    /*{itemId:"NONE",stats:{}}*/
  ]
    .concat(items.weapons)
    .concat(items.fishing_tools)) {
    const stats = Object.assign({}, output.stats);

    // Apply held weapon stats
    for (const stat in item.stats) {
      stats[stat] += item.stats[stat];
    }

    // Add crit damage from held weapon to Mastiff Armor full set bonus
    if (item.stats.crit_damage > 0 && items.armor.filter((a) => getId(a).startsWith("MASTIFF_")).length == 4) {
      stats.health += 50 * item.stats.crit_damage;
    }

    // Apply Superior Dragon Armor full set bonus of 5% stat increase
    if (items.armor.filter((a) => getId(a).startsWith("SUPERIOR_DRAGON_")).length == 4) {
      for (const stat in stats) {
        if (constants.increase_most_stats_exclude.includes(stat)) {
          continue;
        }
        stats[stat] *= 1.05;
      }
    }

    // Apply Renowened bonus (whoever made this please comment)
    for (let i = 0; i < items.armor.filter((a) => a?.tag?.ExtraAttributes?.modifier == "renowned").length; i++) {
      for (const stat in stats) {
        if (constants.increase_most_stats_exclude.includes(stat)) {
          continue;
        }
        stats[stat] *= 1.01;
      }
    }

    // Apply Loving reforge bonus
    for (let i = 0; i < items.armor.filter((a) => a.tag?.ExtraAttributes?.modifier == "loving").length; i++) {
      stats["ability_damage"] += 5;
    }

    if (items.armor.filter((a) => getId(a).startsWith("CHEAP_TUXEDO_")).length == 3) {
      stats["health"] = 75;
    }

    if (items.armor.filter((a) => getId(a).startsWith("FANCY_TUXEDO_")).length == 3) {
      stats["health"] = 150;
    }

    if (items.armor.filter((a) => getId(a).startsWith("ELEGANT_TUXEDO_")).length == 3) {
      stats["health"] = 250;
    }

    output.weapon_stats[item.itemId] = stats;

    // Stats shouldn't go into negative
    for (const stat in stats) {
      output.weapon_stats[item.itemId][stat] = Math.max(0, Math.round(stats[stat]));
    }

    stats.effective_health = getEffectiveHealth(stats.health, stats.defense);
  }

  const superiorBonus = Object.assign({}, constants.stat_template);

  // Apply Superior Dragon Armor full set bonus of 5% stat increase
  if (items.armor.filter((a) => getId(a).startsWith("SUPERIOR_DRAGON_")).length == 4) {
    for (const stat in output.stats) {
      if (constants.increase_most_stats_exclude.includes(stat)) {
        continue;
      }
      superiorBonus[stat] = output.stats[stat] * 0.05;
    }

    for (const stat in superiorBonus) {
      output.stats[stat] += superiorBonus[stat];

      if (!(stat in items.armor[0].stats)) {
        items.armor[0].stats[stat] = 0;
      }

      items.armor[0].stats[stat] += superiorBonus[stat];
    }
  }

  // Same thing as Superior armor but for Renowned armor
  const renownedBonus = Object.assign({}, constants.stat_template);

  for (const item of items.armor) {
    if (item.tag?.ExtraAttributes?.modifier == "renowned") {
      for (const stat in output.stats) {
        if (constants.increase_most_stats_exclude.includes(stat)) {
          continue;
        }
        renownedBonus[stat] += output.stats[stat] * 0.01;
        output.stats[stat] *= 1.01;
      }
    }
  }

  if (items.armor[0]?.stats != undefined) {
    for (const stat in renownedBonus) {
      if (!(stat in items.armor[0].stats)) {
        items.armor[0].stats[stat] = 0;
      }

      items.armor[0].stats[stat] += renownedBonus[stat];
    }
  }

  // Stats shouldn't go into negative
  for (const stat in output.stats) {
    output.stats[stat] = Math.max(0, Math.round(output.stats[stat]));
  }

  output.stats.effective_health = getEffectiveHealth(output.stats.health, output.stats.defense);

  let killsDeaths = [];

  for (const stat in userProfile.stats) {
    if (stat.startsWith("kills_") && userProfile.stats[stat] > 0) {
      killsDeaths.push({ type: "kills", entityId: stat.replace("kills_", ""), amount: userProfile.stats[stat] });
    }

    if (stat.startsWith("deaths_") && userProfile.stats[stat] > 0) {
      killsDeaths.push({ type: "deaths", entityId: stat.replace("deaths_", ""), amount: userProfile.stats[stat] });
    }
  }

  for (const stat of killsDeaths) {
    const { entityId } = stat;

    if (entityId in constants.mob_names) {
      stat.entityName = constants.mob_names[entityId];
      continue;
    }

    let entityName = "";

    entityId.split("_").forEach((split, index) => {
      entityName += split.charAt(0).toUpperCase() + split.slice(1);

      if (index < entityId.split("_").length - 1) {
        entityName += " ";
      }
    });

    stat.entityName = entityName;
  }

  if ("kills_guardian_emperor" in userProfile.stats || "kills_skeleton_emperor" in userProfile.stats) {
    killsDeaths.push({
      type: "kills",
      entityId: "sea_emperor",
      entityName: "Sea Emperor",
      amount: (userProfile.stats["kills_guardian_emperor"] || 0) + (userProfile.stats["kills_skeleton_emperor"] || 0),
    });
  }

  if ("kills_chicken_deep" in userProfile.stats || "kills_zombie_deep" in userProfile.stats) {
    killsDeaths.push({
      type: "kills",
      entityId: "monster_of_the_deep",
      entityName: "Monster of the Deep",
      amount: (userProfile.stats["kills_chicken_deep"] || 0) + (userProfile.stats["kills_zombie_deep"] || 0),
    });
  }

  const random = Math.random() < 0.01;

  killsDeaths = killsDeaths.filter((a) => {
    return !["guardian_emperor", "skeleton_emperor", "chicken_deep", "zombie_deep", random ? "yeti" : null].includes(
      a.entityId
    );
  });

  if ("kills_yeti" in userProfile.stats && random) {
    killsDeaths.push({
      type: "kills",
      entityId: "yeti",
      entityName: "Snow Monke",
      amount: userProfile.stats["kills_yeti"] || 0,
    });
  }

  if ("deaths_yeti" in userProfile.stats) {
    killsDeaths.push({
      type: "deaths",
      entityId: "yeti",
      entityName: "Snow Monke",
      amount: userProfile.stats["deaths_yeti"] || 0,
    });
  }

  output.kills = killsDeaths.filter((a) => a.type == "kills").sort((a, b) => b.amount - a.amount);
  output.deaths = killsDeaths.filter((a) => a.type == "deaths").sort((a, b) => b.amount - a.amount);

  const playerObject = await helper.resolveUsernameOrUuid(profile.uuid, db, options.cacheOnly);

  output.display_name = playerObject.display_name;

  if ("wardrobe_equipped_slot" in userProfile) {
    output.wardrobe_equipped_slot = userProfile.wardrobe_equipped_slot;
  }

  const userInfo = await db.collection("usernames").findOne({ uuid: profile.uuid });

  const members = await Promise.all(
    Object.keys(profile.members).map((a) => helper.resolveUsernameOrUuid(a, db, options.cacheOnly))
  );

  if (userInfo) {
    output.display_name = userInfo.username;

    members.push({
      uuid: profile.uuid,
      display_name: userInfo.username,
    });

    if ("emoji" in userInfo) {
      output.display_emoji = userInfo.emoji;
    }

    if ("emojiImg" in userInfo) {
      output.display_emoji_img = userInfo.emojiImg;
    }
    if (userInfo.username == "jjww2") {
      output.display_emoji = constants.randomEmoji();
    }
  }

  for (const member of members) {
    if (profile?.members?.[member.uuid]?.last_save == undefined) {
      continue;
    }

    const last_updated = profile.members[member.uuid].last_save;

    member.last_updated = {
      unix: last_updated,
      text:
        Date.now() - last_updated < 7 * 60 * 1000
          ? "currently online"
          : `last played ${moment(last_updated).fromNow()}`,
    };
  }

  if (profile.banking?.balance != undefined) {
    output.bank = profile.banking.balance;
  }

  output.guild = await helper.getGuild(profile.uuid, db, options.cacheOnly);

  output.rank_prefix = helper.renderRank(hypixelProfile);
  output.purse = userProfile.coin_purse || 0;
  output.uuid = profile.uuid;
  output.skin_data = playerObject.skin_data;

  output.profile = { profile_id: profile.profile_id, cute_name: profile.cute_name, game_mode: profile.game_mode };
  output.profiles = {};

  for (const sbProfile of allProfiles.filter((a) => a.profile_id != profile.profile_id)) {
    if (sbProfile?.members?.[profile.uuid]?.last_save == undefined) {
      continue;
    }

    output.profiles[sbProfile.profile_id] = {
      profile_id: sbProfile.profile_id,
      cute_name: sbProfile.cute_name,
      game_mode: sbProfile.game_mode,
      last_updated: {
        unix: sbProfile.members[profile.uuid].last_save,
        text: `last played ${moment(sbProfile.members[profile.uuid].last_save).fromNow()}`,
      },
    };
  }

  output.members = members.filter((a) => a.uuid != profile.uuid);
  output.minions = getMinions(profile.members);
  output.minion_slots = getMinionSlots(output.minions);
  output.collections = await getCollections(profile.uuid, profile, options.cacheOnly);
  output.social = hypixelProfile.socials;

  output.dungeons = await getDungeons(userProfile, hypixelProfile);

  output.essence = await getEssence(userProfile, hypixelProfile);

  output.fishing = {
    total: userProfile.stats.items_fished || 0,
    treasure: userProfile.stats.items_fished_treasure || 0,
    treasure_large: userProfile.stats.items_fished_large_treasure || 0,
    shredder_fished: userProfile.stats.shredder_fished || 0,
    shredder_bait: userProfile.stats.shredder_bait || 0,
  };

  //
  //  FARMING
  //

  const farming = {
    talked: userProfile.jacob2?.talked || false,
  };

  if (farming.talked) {
    // Your current badges
    farming.current_badges = {
      bronze: userProfile.jacob2.medals_inv.bronze || 0,
      silver: userProfile.jacob2.medals_inv.silver || 0,
      gold: userProfile.jacob2.medals_inv.gold || 0,
    };

    // Your total badges
    farming.total_badges = {
      bronze: 0,
      silver: 0,
      gold: 0,
    };

    // Your current perks
    farming.perks = {
      double_drops: userProfile.jacob2.perks?.double_drops || 0,
      farming_level_cap: userProfile.jacob2.perks?.farming_level_cap || 0,
    };

    // Your amount of unique golds
    farming.unique_golds = userProfile.jacob2.unique_golds2?.length || 0;

    // Things about individual crops
    farming.crops = {};

    for (const crop in constants.farming_crops) {
      farming.crops[crop] = constants.farming_crops[crop];

      Object.assign(farming.crops[crop], {
        attended: false,
        unique_gold: userProfile.jacob2.unique_golds2?.includes(crop) || false,
        contests: 0,
        personal_best: 0,
        badges: {
          gold: 0,
          silver: 0,
          bronze: 0,
        },
      });
    }

    // Template for contests
    const contests = {
      attended_contests: 0,
      all_contests: [],
    };

    for (const contest_id in userProfile.jacob2.contests) {
      const data = userProfile.jacob2.contests[contest_id];

      const contest_name = contest_id.split(":");
      const date = `${contest_name[1]}_${contest_name[0]}`;
      const crop = contest_name.slice(2).join(":");

      farming.crops[crop].contests++;
      farming.crops[crop].attended = true;
      if (farming.crops[crop].personal_best < data.collected) {
        farming.crops[crop].personal_best = data.collected;
      }

      const contest = {
        date: date,
        crop: crop,
        collected: data.collected,
        claimed: data.claimed_rewards || false,
        medal: null,
      };

      const placing = {};

      if (contest.claimed) {
        placing.position = data.claimed_position || 0;
        placing.percentage = (data.claimed_position / data.claimed_participants) * 100;

        if (placing.percentage <= 5) {
          contest.medal = "gold";
          farming.total_badges.gold++;
          farming.crops[crop].badges.gold++;
        } else if (placing.percentage <= 25) {
          contest.medal = "silver";
          farming.total_badges.silver++;
          farming.crops[crop].badges.silver++;
        } else if (placing.percentage <= 60) {
          contest.medal = "bronze";
          farming.total_badges.bronze++;
          farming.crops[crop].badges.bronze++;
        }
      }

      contest.placing = placing;

      contests.attended_contests++;
      contests.all_contests.push(contest);
    }

    farming.contests = contests;
  }

  output.farming = farming;

  //
  //  ENCHANTING
  //

  // simon = Chronomatron
  // numbers = Ultrasequencer
  // pairings = Superpairs

  const enchanting = {
    experimented:
      (userProfile.experimentation != null && Object.keys(userProfile.experimentation).length >= 1) || false,
    experiments: {},
  };

  if (enchanting.experimented) {
    const enchanting_data = userProfile.experimentation;

    for (const game in constants.experiments.games) {
      if (enchanting_data[game] == null) continue;
      if (!Object.keys(enchanting_data[game]).length >= 1) {
        continue;
      }

      const game_data = enchanting_data[game];
      const game_constants = constants.experiments.games[game];

      const game_output = {
        name: game_constants.name,
        stats: {},
        tiers: {},
      };

      for (const key in game_data) {
        if (key.startsWith("attempts") || key.startsWith("claims") || key.startsWith("best_score")) {
          let statKey = key.split("_");
          const tierValue = statKey.pop();

          statKey = statKey.join("_");
          const tierInfo = _.cloneDeep(constants.experiments.tiers[tierValue]);

          if (!game_output.tiers[tierValue]) {
            game_output.tiers[tierValue] = tierInfo;
          }

          Object.assign(game_output.tiers[tierValue], {
            [statKey]: game_data[key],
          });
          continue;
        }

        if (key == "last_attempt" || key == "last_claimed") {
          if (game_data[key] <= 0) continue;
          const last_time = {
            unix: game_data[key],
            text: moment(game_data[key]).fromNow(),
          };

          game_output.stats[key] = last_time;
          continue;
        }

        game_output.stats[key] = game_data[key];
      }

      enchanting.experiments[game] = game_output;
    }

    if (!Object.keys(enchanting.experiments).length >= 1) {
      enchanting.experimented = false;
    }
  }

  output.enchanting = enchanting;

  // MINING

  const mining = {
    commissions: {
      milestone: 0,
    },
  };

  for (const key of userProfile.tutorial) {
    if (key.startsWith("commission_milestone_reward_mining_xp_tier_")) {
      const milestone_tier = key.slice(43);
      if (mining.commissions.milestone < milestone_tier) {
        mining.commissions.milestone = milestone_tier;
      }
    } else {
      continue;
    }
  }

  mining.forge = await getForge(userProfile);
  mining.core = await getMiningCoreData(userProfile);

  output.mining = mining;

  // MISC

  const misc = {};

  misc.milestones = {};
  misc.objectives = {};
  misc.races = {};
  misc.gifts = {};
  misc.winter = {};
  misc.dragons = {};
  misc.protector = {};
  misc.damage = {};
  misc.burrows = {};
  misc.profile_upgrades = {};
  misc.auctions_sell = {};
  misc.auctions_buy = {};
  misc.claimed_items = {};

  if ("ender_crystals_destroyed" in userProfile.stats) {
    misc.dragons["ender_crystals_destroyed"] = userProfile.stats["ender_crystals_destroyed"];
  }

  misc.dragons["last_hits"] = 0;
  misc.dragons["deaths"] = 0;

  if (hypixelProfile.claimed_items) {
    misc.claimed_items = hypixelProfile.claimed_items;
  }

  const burrows = [
    "mythos_burrows_dug_next",
    "mythos_burrows_dug_combat",
    "mythos_burrows_dug_treasure",
    "mythos_burrows_chains_complete",
  ];

  const dug_next = {};
  const dug_combat = {};
  const dug_treasure = {};
  const chains_complete = {};

  for (const key of burrows) {
    if (key in userProfile.stats) {
      misc.burrows[key.replace("mythos_burrows_", "")] = { total: userProfile.stats[key] };
    }
  }

  misc.profile_upgrades = await getProfileUpgrades(profile);

  const auctions_buy = ["auctions_bids", "auctions_highest_bid", "auctions_won", "auctions_gold_spent"];
  const auctions_sell = ["auctions_fees", "auctions_gold_earned"];

  const auctions_bought = {};
  const auctions_sold = {};

  for (const key of auctions_sell) {
    if (key in userProfile.stats) {
      misc.auctions_sell[key.replace("auctions_", "")] = userProfile.stats[key];
    }
  }

  for (const key of auctions_buy) {
    if (key in userProfile.stats) {
      misc.auctions_buy[key.replace("auctions_", "")] = userProfile.stats[key];
    }
  }

  misc.objectives.completedRaces = [];

  for (const key in userProfile.objectives) {
    if (key.includes("complete_the_")) {
      const isCompleted = userProfile.objectives[key].status == "COMPLETE";
      const tierNumber = parseInt("" + key.charAt(key.length - 1)) ?? 0;
      const raceName = constants.raceObjectiveToStatName[key.substring(0, key.length - 2)];

      if (tierNumber == 1 && !isCompleted) {
        misc.objectives.completedRaces[raceName] = 0;
      } else if (isCompleted && tierNumber > (misc.objectives.completedRaces[raceName] ?? 0)) {
        misc.objectives.completedRaces[raceName] = tierNumber;
      }
    }
  }

  for (const key in userProfile.stats) {
    if (key.includes("_best_time")) {
      misc.races[key] = userProfile.stats[key];
    } else if (key.includes("gifts_")) {
      misc.gifts[key] = userProfile.stats[key];
    } else if (key.includes("most_winter")) {
      misc.winter[key] = userProfile.stats[key];
    } else if (key.includes("highest_critical_damage")) {
      misc.damage[key] = userProfile.stats[key];
    } else if (key.includes("auctions_sold_")) {
      auctions_sold[key.replace("auctions_sold_", "")] = userProfile.stats[key];
    } else if (key.includes("auctions_bought_")) {
      auctions_bought[key.replace("auctions_bought_", "")] = userProfile.stats[key];
    } else if (key.startsWith("kills_") && key.endsWith("_dragon")) {
      misc.dragons["last_hits"] += userProfile.stats[key];
    } else if (key.startsWith("deaths_") && key.endsWith("_dragon")) {
      misc.dragons["deaths"] += userProfile.stats[key];
    } else if (key.includes("kills_corrupted_protector")) {
      misc.protector["last_hits"] = userProfile.stats[key];
    } else if (key.includes("deaths_corrupted_protector")) {
      misc.protector["deaths"] = userProfile.stats[key];
    } else if (key.startsWith("pet_milestone_")) {
      misc.milestones[key.replace("pet_milestone_", "")] = userProfile.stats[key];
    } else if (key.startsWith("mythos_burrows_dug_next_")) {
      dug_next[key.replace("mythos_burrows_dug_next_", "").toLowerCase()] = userProfile.stats[key];
    } else if (key.startsWith("mythos_burrows_dug_combat_")) {
      dug_combat[key.replace("mythos_burrows_dug_combat_", "").toLowerCase()] = userProfile.stats[key];
    } else if (key.startsWith("mythos_burrows_dug_treasure_")) {
      dug_treasure[key.replace("mythos_burrows_dug_treasure_", "").toLowerCase()] = userProfile.stats[key];
    } else if (key.startsWith("mythos_burrows_chains_complete_")) {
      chains_complete[key.replace("mythos_burrows_chains_complete_", "").toLowerCase()] = userProfile.stats[key];
    }
  }

  for (const key in misc.dragons) {
    if (misc.dragons[key] == 0) {
      delete misc.dragons[key];
    }
  }

  for (const key in misc) {
    if (Object.keys(misc[key]).length == 0) {
      delete misc[key];
    }
  }

  for (const key in dug_next) {
    misc.burrows.dug_next[key] = dug_next[key];
  }

  for (const key in dug_combat) {
    misc.burrows.dug_combat[key] = dug_combat[key];
  }

  for (const key in dug_treasure) {
    misc.burrows.dug_treasure[key] = dug_treasure[key];
  }

  for (const key in chains_complete) {
    misc.burrows.chains_complete[key] = chains_complete[key];
  }

  for (const key in auctions_bought) {
    misc.auctions_buy["items_bought"] = (misc.auctions_buy["items_bought"] || 0) + auctions_bought[key];
  }

  for (const key in auctions_sold) {
    misc.auctions_sell["items_sold"] = (misc.auctions_sell["items_sold"] || 0) + auctions_sold[key];
  }

  output.misc = misc;
  output.auctions_bought = auctions_bought;
  output.auctions_sold = auctions_sold;

  const last_updated = userProfile.last_save;
  const first_join = userProfile.first_join;

  const diff = (+new Date() - last_updated) / 1000;

  let last_updated_text = moment(last_updated).fromNow();
  const first_join_text = moment(first_join).fromNow();

  if ("current_area" in userProfile) {
    output.current_area = userProfile.current_area;
  }

  if ("current_area_updated" in userProfile) {
    output.current_area_updated = userProfile.current_area_updated;
  }

  if (diff < 3) {
    last_updated_text = `Right now`;
  } else if (diff < 60) {
    last_updated_text = `${Math.floor(diff)} seconds ago`;
  }

  output.last_updated = {
    unix: last_updated,
    text: last_updated_text,
  };

  output.first_join = {
    unix: first_join,
    text: first_join_text,
  };

  /*

    WEIGHT

  */

  output.weight = {
    senither: calculateSenitherWeight(output),
    lily: calculateLilyWeight(output),
  };

  console.debug(`${options.debugId}: getStats returned. (${Date.now() - timeStarted}ms)`);
  return output;
};

export async function getPets(profile) {
  let output = [];

  if (!("pets" in profile)) {
    return output;
  }

  // debug pets
  // profile.pets = helper.generateDebugPets("BINGO");

  for (const pet of profile.pets) {
    if (!("tier" in pet)) {
      continue;
    }

    const petData = constants.pet_data[pet.type] || {
      head: "/head/bc8ea1f51f253ff5142ca11ae45193a4ad8c3ab5e9c6eec8ba7a4fcb7bac40",
      type: "???",
      maxTier: "LEGENDARY",
      maxLevel: 100,
      emoji: "❓",
    };

    petData.typeGroup = petData.typeGroup ?? pet.type;

    pet.rarity = pet.tier.toLowerCase();
    pet.stats = {};
    pet.ignoresTierBoost = petData.ignoresTierBoost;
    const lore = [];

    // Rarity upgrades
    if (pet.heldItem == "PET_ITEM_TIER_BOOST" && !pet.ignoresTierBoost) {
      pet.rarity =
        constants.rarities[
          Math.min(constants.rarities.indexOf(petData.maxTier), constants.rarities.indexOf(pet.rarity) + 1)
        ];
    }

    if (pet.heldItem == "PET_ITEM_VAMPIRE_FANG" || pet.heldItem == "PET_ITEM_TOY_JERRY") {
      if (constants.rarities.indexOf(pet.rarity) === constants.rarities.indexOf(petData.maxTier) - 1) {
        pet.rarity = petData.maxTier;
      }
    }

    pet.level = getPetLevel(pet.exp, petData.customLevelExpRarityOffset ?? pet.rarity, petData.maxLevel);

    // Get texture
    if (typeof petData.head === "object") {
      pet.texture_path = petData.head[pet.rarity] ?? petData.head.default;
    } else {
      pet.texture_path = petData.head;
    }

    if (petData.hatching?.level > pet.level.level) {
      pet.texture_path = petData.hatching.head;
    }

    let petSkin = null;
    if (pet.skin && constants.pet_skins?.[`PET_SKIN_${pet.skin}`]) {
      pet.texture_path = constants.pet_skins[`PET_SKIN_${pet.skin}`].texture;
      petSkin = constants.pet_skins[`PET_SKIN_${pet.skin}`].name;
    }

    // Get first row of lore
    const loreFirstRow = ["§8"];

    if (petData.type === "all") {
      loreFirstRow.push("All Skills");
    } else {
      loreFirstRow.push(helper.capitalizeFirstLetter(petData.type), " ", petData.category ?? "Pet");

      if (petData.obtainsExp === "feed") {
        loreFirstRow.push(", feed to gain XP");
      }

      if (petSkin) {
        loreFirstRow.push(`, ${petSkin} Skin`);
      }
    }

    lore.push(loreFirstRow.join(""), "");

    // Get name
    const petName =
      petData.hatching?.level > pet.level.level
        ? petData.hatching.name
        : petData.name
        ? petData.name[pet.rarity] ?? petData.name.default
        : helper.titleCase(pet.type.replaceAll("_", " "));

    const rarity = constants.rarities.indexOf(pet.rarity);

    const searchName = pet.type in constants.petStats ? pet.type : "???";
    const petInstance = new constants.petStats[searchName](rarity, pet.level.level, pet.extra);
    pet.stats = Object.assign({}, petInstance.stats);
    pet.ref = petInstance;

    if (pet.heldItem) {
      const { heldItem } = pet;
      let heldItemObj = await db.collection("items").findOne({ id: heldItem });

      if (heldItem in constants.pet_items) {
        for (const stat in constants.pet_items[heldItem]?.stats) {
          pet.stats[stat] = (pet.stats[stat] || 0) + constants.pet_items[heldItem].stats[stat];
        }
        for (const stat in constants.pet_items[heldItem]?.statsPerLevel) {
          pet.stats[stat] =
            (pet.stats[stat] || 0) + constants.pet_items[heldItem].statsPerLevel[stat] * pet.level.level;
        }
        for (const stat in constants.pet_items[heldItem]?.multStats) {
          if (pet.stats[stat]) {
            pet.stats[stat] = (pet.stats[stat] || 0) * constants.pet_items[heldItem].multStats[stat];
          }
        }
        if ("multAllStats" in constants.pet_items[heldItem]) {
          for (const stat in pet.stats) {
            pet.stats[stat] *= constants.pet_items[heldItem].multAllStats;
          }
        }
      }

      // push pet lore after held item stats added
      const stats = pet.ref.lore(pet.stats);
      stats.forEach((line) => {
        lore.push(line);
      });

      // then the ability lore
      const abilities = pet.ref.abilities;
      abilities.forEach((ability) => {
        lore.push(" ", ability.name);
        ability.desc.forEach((line) => {
          lore.push(line);
        });
      });

      // now we push the lore of the held items
      if (!heldItemObj) {
        heldItemObj = constants.pet_items[heldItem];
      }
      lore.push("", `§6Held Item: §${constants.rarityColors[heldItemObj.tier.toLowerCase()]}${heldItemObj.name}`);

      if (heldItem in constants.pet_items) {
        lore.push(constants.pet_items[heldItem].description);
      }
      // extra line
      lore.push(" ");
    } else {
      // no held items so push the new stats
      const stats = pet.ref.lore();
      stats.forEach((line) => {
        lore.push(line);
      });

      const abilities = pet.ref.abilities;
      abilities.forEach((ability) => {
        lore.push(" ", ability.name);
        ability.desc.forEach((line) => {
          lore.push(line);
        });
      });

      // extra line
      lore.push(" ");
    }

    // passive perks text
    if (petData.passivePerks) {
      lore.push("§8This pet's perks are active even when the pet is not summoned!", "");
    }

    // always gains exp text
    if (petData.alwaysGainsExp) {
      lore.push("§8This pet gains XP even when not summoned!", "");

      if (typeof petData.alwaysGainsExp === "string") {
        lore.push(`§8This pet only gains XP on the ${petData.alwaysGainsExp}§8!`, "");
      }
    }

    if (pet.level.level < petData.maxLevel) {
      lore.push(`§7Progress to Level ${pet.level.level + 1}: §e${(pet.level.progress * 100).toFixed(1)}%`);

      const progress = Math.ceil(pet.level.progress * 20);
      const numerator = pet.level.xpCurrent.toLocaleString();
      const denominator = helper.formatNumber(pet.level.xpForNext, false, 10);

      lore.push(`§2${"-".repeat(progress)}§f${"-".repeat(20 - progress)} §e${numerator} §6/ §e${denominator}`);
    } else {
      lore.push("§bMAX LEVEL");
    }

    lore.push(
      "",
      `§7Total XP: §e${helper.formatNumber(pet.exp, true, 10)} §6/ §e${helper.formatNumber(
        pet.level.xpMaxLevel,
        true,
        10
      )} §6(${Math.floor((pet.exp / pet.level.xpMaxLevel) * 100)}%)`
    );

    if (petData.obtainsExp !== "feed") {
      lore.push(`§7Candy Used: §e${pet.candyUsed || 0} §6/ §e10`);
    }

    pet.lore = "";

    // eslint-disable-next-line no-unused-vars
    for (const [index, line] of lore.entries()) {
      pet.lore += '<span class="lore-row wrap">' + helper.renderLore(line) + "</span>";
    }

    pet.display_name = `${petName}${petSkin ? " ✦" : ""}`;
    pet.emoji = petData.emoji;

    output.push(pet);
  }

  output = output.sort((a, b) => {
    if (a.active === b.active) {
      if (a.rarity == b.rarity) {
        if (a.type == b.type) {
          return a.level.level > b.level.level ? -1 : 1;
        } else {
          let maxPetA = output
            .filter((x) => x.type == a.type && x.rarity == a.rarity)
            .sort((x, y) => y.level.level - x.level.level);

          maxPetA = maxPetA.length > 0 ? maxPetA[0].level.level : null;

          let maxPetB = output
            .filter((x) => x.type == b.type && x.rarity == b.rarity)
            .sort((x, y) => y.level.level - x.level.level);

          maxPetB = maxPetB.length > 0 ? maxPetB[0].level.level : null;

          if (maxPetA && maxPetB && maxPetA == maxPetB) {
            return a.type < b.type ? -1 : 1;
          } else {
            return maxPetA > maxPetB ? -1 : 1;
          }
        }
      } else {
        return constants.rarities.indexOf(a.rarity) < constants.rarities.indexOf(b.rarity) ? 1 : -1;
      }
    }

    return a.active ? -1 : 1;
  });

  return output;
}

export async function getMissingPets(pets, gameMode) {
  const profile = {
    pets: [],
  };

  const missingPets = [];

  const ownedPetTypes = pets.map((pet) => constants.pet_data[pet.type].typeGroup ?? pet.type);

  for (const [petType, petData] of Object.entries(constants.pet_data)) {
    if (
      ownedPetTypes.includes(petData.typeGroup ?? petType) ||
      (petData.bingoExclusive === true && gameMode !== "bingo")
    ) {
      continue;
    }

    const key = petData.typeGroup ?? petType;

    missingPets[key] ??= [];
    missingPets[key].push({
      type: petType,
      active: false,
      exp: helper.getPetExp(constants.pet_data[petType].maxTier, constants.pet_data[petType].maxLevel),
      tier: constants.pet_data[petType].maxTier,
      candyUsed: 0,
      heldItem: null,
      skin: null,
      uuid: helper.generateUUID(),
    });
  }

  for (const pets of Object.values(missingPets)) {
    if (pets.length > 1) {
      // using exp to find the highest tier
      profile.pets.push(pets.sort((a, b) => b.exp - a.exp)[0]);
      continue;
    }

    profile.pets.push(pets[0]);
  }

  return getPets(profile);
}

export async function getPetScore(pets) {
  const highestRarity = {};

  for (const pet of pets) {
    if (!(pet.type in highestRarity) || constants.pet_value[pet.rarity] > highestRarity[pet.type]) {
      highestRarity[pet.type] = constants.pet_value[pet.rarity];
    }
  }

  return Object.values(highestRarity).reduce((a, b) => a + b, 0);
}

export async function getMissingAccessories(accessories) {
  const unique = Object.keys(constants.accessories);
  unique.forEach((name) => {
    if (name in constants.accessory_duplicates) {
      for (const duplicate of constants.accessory_duplicates[name]) {
        if (accessories.includes(duplicate)) {
          accessories[accessories.indexOf(duplicate)] = name;
          break;
        }
      }
    }
  });

  let missing = unique.filter((accessory) => !accessories.includes(accessory));
  missing.forEach((name) => {
    if (name in constants.accessory_upgrades) {
      //if the name is in the upgrades list
      for (const upgrade of constants.accessory_upgrades[name]) {
        if (accessories.includes(upgrade)) {
          //if accessories list includes the upgrade
          missing = missing.filter((item) => item !== name);
          break;
        }
      }
    }
  });

  const upgrades = [];
  const other = [];
  missing.forEach(async (accessory) => {
    const object = {
      display_name: null,
      rarity: null,
      texture_path: null,
    };

    object.name ??= accessory;

    // MAIN ACCESSORIES
    if (constants.accessories[accessory] != null) {
      const data = constants.accessories[accessory];

      object.texture_path = data.texture || null;
      object.display_name = data.name || null;
      object.rarity = data.rarity || null;
    } else {
      const data = await db.collection("items").findOne({ id: accessory });

      if (data) {
        object.texture_path = data.texture ? `/head/${data.texture}` : `/item/${accessory}`;
        object.display_name = data.name;
        object.rarity = data.tier.toLowerCase();
      }
    }

    let includes = false;

    for (const array of Object.values(constants.accessory_upgrades)) {
      if (array.includes(accessory)) {
        includes = true;
      }
    }
    if (includes) {
      upgrades.push(object);
    } else {
      other.push(object);
    }
  });

  return {
    missing: other,
    upgrades: upgrades,
  };
}

export async function getCollections(uuid, profile, cacheOnly = false) {
  const output = {};

  const userProfile = profile.members[uuid];

  if (!("unlocked_coll_tiers" in userProfile) || !("collection" in userProfile)) {
    return output;
  }

  const members = {};

  (await Promise.all(Object.keys(profile.members).map((a) => helper.resolveUsernameOrUuid(a, db, cacheOnly)))).forEach(
    (a) => (members[a.uuid] = a.display_name)
  );

  for (const collection of userProfile.unlocked_coll_tiers) {
    const split = collection.split("_");
    const tier = Math.max(0, parseInt(split.pop()));
    const type = split.join("_");
    const amount = userProfile.collection[type] || 0;
    const amounts = [];
    let totalAmount = 0;

    for (const member in profile.members) {
      const memberProfile = profile.members[member];

      if ("collection" in memberProfile) {
        amounts.push({ username: members[member], amount: memberProfile.collection[type] || 0 });
      }
    }

    for (const memberAmount of amounts) {
      totalAmount += memberAmount.amount;
    }

    if (!(type in output) || tier > output[type].tier) {
      output[type] = { tier, amount, totalAmount, amounts };
    }

    const collectionData = constants.collection_data.find((a) => a.skyblockId == type);

    for (const tier of collectionData?.tiers ?? []) {
      if (totalAmount >= tier.amountRequired) {
        output[type].tier = Math.max(tier.tier, output[type].tier);
      }
    }
  }

  return output;
}

export async function getDungeons(userProfile, hypixelProfile) {
  const output = {};

  const dungeons = userProfile.dungeons;
  if (dungeons == null || Object.keys(dungeons).length === 0) return output;

  const dungeons_data = constants.dungeons;
  if (dungeons.dungeon_types == null || Object.keys(dungeons.dungeon_types).length === 0) return output;

  // Main Dungeons Data
  for (const type of Object.keys(dungeons.dungeon_types)) {
    const dungeon = dungeons.dungeon_types[type];
    if (dungeon == null || Object.keys(dungeon).length === 0) {
      output[type] = { visited: false };
      continue;
    }

    const floors = {};

    for (const key of Object.keys(dungeon)) {
      if (typeof dungeon[key] != "object") continue;
      for (const floor of Object.keys(dungeon[key])) {
        if (!floors[floor]) {
          floors[floor] = {
            name: `floor_${floor}`,
            icon_texture: "908fc34531f652f5be7f27e4b27429986256ac422a8fb59f6d405b5c85c76f7",
            stats: {},
          };
        }

        const id = `${type}_${floor}`; // Floor ID
        if (dungeons_data.floors[id]) {
          if (dungeons_data.floors[id].name) {
            floors[floor].name = dungeons_data.floors[id].name;
          }
          if (dungeons_data.floors[id].texture) {
            floors[floor].icon_texture = dungeons_data.floors[id].texture;
          }
        }

        if (key.startsWith("most_damage")) {
          if (!floors[floor].most_damage || dungeon[key][floor] > floors[floor].most_damage.value) {
            floors[floor].most_damage = {
              class: key.replace("most_damage_", ""),
              value: dungeon[key][floor],
            };
          }
        } else if (key === "best_runs") {
          floors[floor][key] = dungeon[key][floor];
        } else {
          floors[floor].stats[key] = dungeon[key][floor];
        }
      }
    }

    const dungeon_id = `dungeon_${type}`; // Dungeon ID
    const highest_floor = dungeon.highest_tier_completed || 0;
    output[type] = {
      id: dungeon_id,
      visited: true,
      level: getLevelByXp(dungeon.experience, { type: "dungeoneering" }),
      highest_floor:
        dungeons_data.floors[`${type}_${highest_floor}`] && dungeons_data.floors[`${type}_${highest_floor}`].name
          ? dungeons_data.floors[`${type}_${highest_floor}`].name
          : `floor_${highest_floor}`,
      floors: floors,
    };
  }

  // Classes
  output.classes = {};

  let used_classes = false;
  const current_class = dungeons.selected_dungeon_class || "none";
  for (const className of Object.keys(dungeons.player_classes)) {
    const data = dungeons.player_classes[className];

    if (!data.experience) {
      data.experience = 0;
    }

    output.classes[className] = {
      experience: getLevelByXp(data.experience, { type: "dungeoneering" }),
      current: false,
    };

    if (data.experience > 0) {
      used_classes = true;
    }
    if (className == current_class) {
      output.classes[className].current = true;
    }
  }

  output.used_classes = used_classes;

  output.selected_class = current_class;
  output.secrets_found = hypixelProfile.achievements.skyblock_treasure_hunter || 0;

  if (!output.catacombs.visited) return output;

  // Boss Collections
  const collection_data = dungeons_data.boss_collections;
  const boss_data = dungeons_data.bosses;
  const collections = {};

  for (const coll_id in collection_data) {
    const coll = collection_data[coll_id];
    const boss = boss_data[coll.boss];

    for (const floor_id of boss.floors) {
      // This can be done much better. But I didn't want to deal with it.
      const a = floor_id.split("_");
      const dung_floor = a.pop();
      const dung_name = a.join("_");

      // I can't put these two into a single if. Welp, doesn't seem like a problem.
      if (output[dung_name] == null || !output[dung_name]?.visited) continue;
      if (output[dung_name].floors[dung_floor] == null) continue;

      const data = output[dung_name].floors[dung_floor];
      const num = data.stats.tier_completions || 0;

      if (num <= 0) continue;

      if (!collections[coll_id]) {
        collections[coll_id] = {
          name: boss.name,
          texture: boss.texture,
          tier: 0,
          maxed: false,
          killed: num,
          floors: {},
          unclaimed: 0,
          claimed: [],
        };
      } else {
        collections[coll_id].killed += num;
      }

      collections[coll_id].floors[floor_id] = num;
    }

    if (!collections[coll_id]) {
      continue;
    }

    for (const reward_id in coll.rewards) {
      const reward = coll.rewards[reward_id];
      if (collections[coll_id].killed >= reward.required) {
        collections[coll_id].tier = reward.tier;
        if (reward_id != "coming_soon") collections[coll_id].unclaimed++;
      } else {
        break;
      }

      if (collections[coll_id].tier == coll.max_tiers) {
        collections[coll_id].maxed = true;
      }
    }
  }

  const tasks = userProfile.tutorial;
  for (const i in tasks) {
    if (!tasks[i].startsWith("boss_collection_claimed")) continue;
    const task = tasks[i].split("_").splice(3);

    if (!Object.keys(boss_data).includes(task[0])) continue;
    const boss = boss_data[task[0]];

    if (!Object.keys(collection_data).includes(boss.collection)) continue;
    const coll = collection_data[boss.collection];

    const item = coll.rewards[task.splice(1).join("_")];

    if (item == null || boss == null) continue;
    collections[boss.collection].claimed.push(item.name);
    collections[boss.collection].unclaimed--;
  }

  if (Object.keys(collections).length === 0) {
    output.unlocked_collections = false;
  } else {
    output.unlocked_collections = true;
  }

  output.boss_collections = collections;

  // Journal Entries
  const journal_constants = constants.dungeons.journals;
  const journal_entries = dungeons.dungeon_journal.journal_entries;
  const journals = {
    pages_collected: 0,
    journals_completed: 0,
    total_pages: 0,
    maxed: false,
    journal_entries: [],
  };

  for (const entry_id in journal_entries) {
    const entry = {
      name: journal_constants[entry_id] ? journal_constants[entry_id].name : entry_id,
      pages_collected: journal_entries[entry_id].length || 0,
      total_pages: journal_constants[entry_id] ? journal_constants[entry_id].pages : null,
    };

    journals.pages_collected += entry.pages_collected;
    if (entry.total_pages != null) {
      if (entry.pages_collected >= entry.total_pages) {
        journals.journals_completed++;
      }
    }

    journals.journal_entries.push(entry);
  }

  for (const entry_id in journal_constants) {
    journals.total_pages += journal_constants[entry_id].pages || 0;
  }

  if (journals.pages_collected >= journals.total_pages) {
    journals.maxed = true;
  }

  output.journals = journals;

  // Level Bonuses (Only Catacombs Item Boost right now)
  for (const name in constants.dungeons.level_bonuses) {
    const level_stats = constants.dungeons.level_bonuses[name];
    const steps = Object.keys(level_stats)
      .sort((a, b) => Number(a) - Number(b))
      .map((a) => Number(a));

    let level = 0;
    switch (name) {
      case "dungeon_catacombs":
        level = output.catacombs.level.level;
        output.catacombs.bonuses = {
          item_boost: 0,
        };
        break;
      default:
        continue;
    }

    for (let x = steps[0]; x <= steps[steps.length - 1]; x += 1) {
      if (level < x) {
        break;
      }

      const level_step = steps
        .slice()
        .reverse()
        .find((a) => a <= x);

      const level_bonus = level_stats[level_step];

      for (const bonus in level_bonus) {
        switch (name) {
          case "dungeon_catacombs":
            output.catacombs.bonuses[bonus] += level_bonus[bonus];
        }
      }
    }
  }

  return output;
}

export async function getEssence(userProfile, hypixelProfile) {
  const output = {};

  for (const essence in constants.essence) {
    output[essence] = userProfile?.[`essence_${essence}`] ?? 0;
  }

  return output;
}

export function getHotmItems(userProfile, packs) {
  const data = userProfile.mining_core;
  const output = [];

  // Filling the space with empty items
  for (let index = 0; index < 7 * 9; index++) {
    output.push(helper.generateItem());
  }

  if (!data) {
    return output;
  }

  const hotmLevelData = data.experience ? getLevelByXp(data.experience, { type: "hotm" }) : 0;
  const nodes = data.nodes
    ? Object.fromEntries(Object.entries(data.nodes).filter(([key, value]) => !key.startsWith("toggle_")))
    : {};
  const toggles = data.nodes
    ? Object.fromEntries(Object.entries(data.nodes).filter(([key, value]) => key.startsWith("toggle_")))
    : {};
  const mcdata = getMiningCoreData(userProfile);

  // Check for missing node classes
  for (const nodeId in nodes) {
    if (constants.hotm.nodes[nodeId] == undefined) {
      throw new Error(`Missing Heart of the Mountain node: ${nodeId}`);
    }
  }

  // Processing nodes
  for (const nodeId in constants.hotm.nodes) {
    const enabled = toggles[`toggle_${nodeId}`] ?? true;
    const level = nodes[nodeId] ?? 0;
    const node = new constants.hotm.nodes[nodeId]({
      level,
      enabled,
      nodes,
      hotmLevelData,
      selectedPickaxeAbility: data.selected_pickaxe_ability,
    });

    output[node.position7x9 - 1] = helper.generateItem({
      display_name: node.name,
      id: node.itemData.id,
      Damage: node.itemData.Damage,
      glowing: node.itemData.glowing,
      tag: {
        display: {
          Name: node.displayName,
          Lore: node.lore,
        },
      },
      position: node.position7x9,
    });
  }

  // Processing HotM tiers
  for (let tier = 1; tier <= constants.hotm.tiers; tier++) {
    const hotm = new constants.hotm.hotm(tier, hotmLevelData);

    output[hotm.position7x9 - 1] = helper.generateItem({
      display_name: `Tier ${tier}`,
      id: hotm.itemData.id,
      Damage: hotm.itemData.Damage,
      glowing: hotm.itemData.glowing,
      tag: {
        display: {
          Name: hotm.displayName,
          Lore: hotm.lore,
        },
      },
      position: hotm.position7x9,
    });
  }

  // Processing HotM items (stats, hc crystals, reset)
  for (const itemClass of constants.hotm.items) {
    const item = new itemClass({
      resources: {
        token_of_the_mountain: mcdata.tokens,
        mithril_powder: mcdata.powder.mithril,
        gemstone_powder: mcdata.powder.gemstone,
      },
      crystals: mcdata.crystal_nucleus.crystals,
      last_reset: mcdata.hotm_last_reset,
    });

    output[item.position7x9 - 1] = helper.generateItem({
      display_name: helper.removeFormatting(item.displayName),
      id: item.itemData.id,
      Damage: item.itemData.Damage,
      glowing: item.itemData.glowing,
      texture_path: item.itemData?.texture_path,
      tag: {
        display: {
          Name: item.displayName,
          Lore: item.lore,
        },
      },
      position: item.position7x9,
    });
  }

  // Processing textures
  output.forEach(async (item) => {
    const customTexture = await getTexture(item, false, packs);

    if (customTexture) {
      item.animated = customTexture.animated;
      item.texture_path = "/" + customTexture.path;
      item.texture_pack = customTexture.pack.config;
      item.texture_pack.base_path =
        "/" + path.relative(path.resolve(__dirname, "..", "public"), customTexture.pack.basePath);
    }
  });

  return output;
}

export function getMiningCoreData(userProfile) {
  const output = {};
  const data = userProfile.mining_core;

  if (!data) {
    return null;
  }

  output.tier = getLevelByXp(data.experience, { type: "hotm" });

  const totalTokens = helper.calcHotmTokens(output.tier.level, data.nodes.special_0);
  output.tokens = {
    total: totalTokens,
    spent: data.tokens_spent || 0,
    available: totalTokens - (data.tokens_spent || 0),
  };

  output.selected_pickaxe_ability = data.selected_pickaxe_ability
    ? constants.hotm.names[data.selected_pickaxe_ability]
    : null;

  output.powder = {
    mithril: {
      total: (data.powder_mithril || 0) + (data.powder_spent_mithril || 0),
      spent: data.powder_spent_mithril || 0,
      available: data.powder_mithril || 0,
    },
    gemstone: {
      total: (data.powder_gemstone || 0) + (data.powder_spent_gemstone || 0),
      spent: data.powder_spent_gemstone || 0,
      available: data.powder_gemstone || 0,
    },
  };

  const crystals_completed = data.crystals
    ? Object.values(data.crystals)
        .filter((x) => x.total_placed)
        .map((x) => x.total_placed)
    : [];
  output.crystal_nucleus = {
    times_completed: crystals_completed.length > 0 ? Math.min(...crystals_completed) : 0,
    crystals: data.crystals || {},
    goblin: data.biomes?.goblin ?? null,
    precursor: data.biomes?.precursor ?? null,
  };

  output.daily_ores = {
    mined: data.daily_ores_mined,
    day: data.daily_ores_mined_day,
    ores: {
      mithril: {
        day: data.daily_ores_mined_day_mithril_ore,
        count: data.daily_ores_mined_mithril_ore,
      },
      gemstone: {
        day: data.daily_ores_mined_day_gemstone,
        count: data.daily_ores_mined_gemstone,
      },
    },
  };

  output.hotm_last_reset = data.last_reset || 0;

  output.crystal_hollows_last_access = data.greater_mines_last_access || 0;

  output.daily_effect = {
    effect: data.current_daily_effect || null,
    last_changed: data.current_daily_effect_last_changed || null,
  };

  return output;
}

export async function getForge(userProfile) {
  const output = {};

  if (userProfile?.forge?.forge_processes?.forge_1) {
    const forge = Object.values(userProfile.forge.forge_processes.forge_1);
    const processes = [];
    for (const item of forge) {
      const forgeItem = {
        id: item.id,
        slot: item.slot,
        timeFinished: 0,
        timeFinishedText: "",
      };

      if (item.id in constants.forge_times) {
        let forgeTime = constants.forge_times[item.id] * 60 * 1000; // convert minutes to milliseconds
        const quickForge = userProfile.mining_core?.nodes?.forge_time;
        if (quickForge != null) {
          forgeTime *= constants.quick_forge_multiplier[quickForge];
        }
        const dbObject = await db.collection("items").findOne({ id: item.id });

        forgeItem.name = item.id == "PET" ? "[Lvl 1] Ammonite" : dbObject ? dbObject.name : item.id;
        const timeFinished = item.startTime + forgeTime;
        forgeItem.timeFinished = timeFinished;
        forgeItem.timeFinishedText = moment(timeFinished).fromNow();
      } else {
        forgeItem.id = `UNKNOWN-${item.id}`;
      }
      processes.push(forgeItem);
    }
    output.processes = processes;
  }

  return output;
}

export async function getProfileUpgrades(profile) {
  const output = {};
  for (const upgrade in constants.profile_upgrades) {
    output[upgrade] = 0;
  }
  if (profile.community_upgrades?.upgrade_states != undefined) {
    for (const u of profile.community_upgrades.upgrade_states) {
      output[u.upgrade] = Math.max(output[u.upgrade] || 0, u.tier);
    }
  }
  return output;
}

export const getProfile = async (
  db,
  paramPlayer,
  paramProfile,
  options = { cacheOnly: false, debugId: `${helper.getClusterId()}/unknown@getProfile` }
) => {
  console.debug(`${options.debugId}: getProfile called.`);
  const timeStarted = Date.now();

  if (paramPlayer.length != 32) {
    try {
      const { uuid } = await helper.resolveUsernameOrUuid(paramPlayer, db);

      paramPlayer = uuid;
    } catch (e) {
      console.error(e);
      throw e;
    }
  }

  if (paramProfile) {
    paramProfile = paramProfile.toLowerCase();
  }

  const params = {
    key: credentials.hypixel_api_key,
    uuid: paramPlayer,
  };

  let allSkyBlockProfiles = [];

  let profileObject = await db.collection("profileStore").findOne({ uuid: sanitize(paramPlayer) });

  let lastCachedSave = 0;

  if (profileObject) {
    const profileData = db
      .collection("profileCache")
      .find({ profile_id: { $in: Object.keys(profileObject.profiles) } });

    for await (const doc of profileData) {
      if (doc.members?.[paramPlayer] == undefined) {
        continue;
      }

      Object.assign(doc, profileObject.profiles[doc.profile_id]);

      allSkyBlockProfiles.push(doc);

      lastCachedSave = Math.max(lastCachedSave, doc.members[paramPlayer].last_save || 0);
    }
  } else {
    profileObject = { last_update: 0 };
  }

  let response = null;

  if (
    !options.cacheOnly &&
    ((Date.now() - lastCachedSave > 190 * 1000 && Date.now() - lastCachedSave < 300 * 1000) ||
      Date.now() - profileObject.last_update >= 300 * 1000)
  ) {
    try {
      response = await retry(
        async () => {
          return await Hypixel.get("skyblock/profiles", {
            params,
          });
        },
        { retries: 2 }
      );

      const { data } = response;

      if (!data.success) {
        throw new Error("Request to Hypixel API failed. Please try again!");
      }

      if (data.profiles == null) {
        throw new Error("Player has no SkyBlock profiles.");
      }

      allSkyBlockProfiles = data.profiles;
    } catch (e) {
      if (e?.response?.data?.cause != undefined) {
        throw new Error(`Hypixel API Error: ${e.response.data.cause}.`);
      }

      throw e;
    }
  }

  if (allSkyBlockProfiles.length == 0) {
    throw new Error("Player has no SkyBlock profiles.");
  }

  for (const profile of allSkyBlockProfiles) {
    for (const member in profile.members) {
      if (profile.members[member]?.last_save == undefined) {
        delete profile.members[member];
      }
    }

    profile.uuid = paramPlayer;
  }

  let skyBlockProfiles = [];

  if (paramProfile) {
    if (paramProfile.length == 32) {
      const filteredProfiles = allSkyBlockProfiles.filter((a) => a.profile_id.toLowerCase() == paramProfile);

      if (filteredProfiles.length > 0) {
        skyBlockProfiles = filteredProfiles;
      } else {
        const profileResponse = await retry(async () => {
          const response = await Hypixel.get(
            "skyblock/profile",
            {
              params: { key: credentials.hypixel_api_key, profile: paramProfile },
            },
            { retries: 2 }
          );

          if (!response.data.success) {
            throw new Error("api request failed");
          }

          return response.data.profile;
        });

        profileResponse.cute_name = "Deleted";
        profileResponse.uuid = paramPlayer;

        skyBlockProfiles.push(profileResponse);
      }
    } else {
      skyBlockProfiles = allSkyBlockProfiles.filter((a) => a.cute_name.toLowerCase() == paramProfile);
    }
  }

  if (skyBlockProfiles.length == 0) {
    skyBlockProfiles = allSkyBlockProfiles;
  }

  const profiles = [];

  // eslint-disable-next-line no-unused-vars
  for (const [index, profile] of skyBlockProfiles.entries()) {
    let memberCount = 0;

    for (const member in profile.members) {
      if (profile.members[member]?.last_save != undefined) {
        memberCount++;
      }
    }

    if (memberCount == 0) {
      if (paramProfile) {
        throw new Error("Uh oh, this SkyBlock profile has no players.");
      }

      continue;
    }

    profiles.push(profile);
  }

  if (profiles.length == 0) {
    throw new Error("No data returned by Hypixel API, please try again!");
  }

  let highest = 0;
  let profile;

  const storeProfiles = {};

  for (const _profile of allSkyBlockProfiles) {
    const userProfile = _profile.members[paramPlayer];

    if (!userProfile) {
      continue;
    }

    if (response && response.request.fromCache !== true) {
      const insertCache = {
        last_update: new Date(),
        members: _profile.members,
      };

      if ("banking" in _profile) {
        insertCache.banking = _profile.banking;
      }

      if ("community_upgrades" in _profile) {
        insertCache.community_upgrades = _profile.community_upgrades;
      }

      db.collection("profileCache")
        .updateOne({ profile_id: _profile.profile_id }, { $set: insertCache }, { upsert: true })
        .catch(console.error);
    }

    if ("last_save" in userProfile) {
      storeProfiles[_profile.profile_id] = {
        profile_id: _profile.profile_id,
        cute_name: _profile.cute_name,
        game_mode: _profile.game_mode,
        last_save: userProfile.last_save,
      };
    }
  }

  // eslint-disable-next-line no-unused-vars
  for (const [index, _profile] of profiles.entries()) {
    if (_profile === undefined || _profile === null) {
      return;
    }

    const userProfile = _profile.members[paramPlayer];

    if (userProfile?.last_save > highest) {
      profile = _profile;
      highest = userProfile.last_save;
    }
  }

  if (!profile) {
    throw new Error("User not found in selected profile. This is probably due to a declined co-op invite.");
  }

  const userProfile = profile.members[paramPlayer];

  if (profileObject && "current_area" in profileObject) {
    userProfile.current_area = profileObject.current_area;
  }

  if (Date.now() - userProfile.last_save < 5 * 60 * 1000) {
    userProfile.current_area_updated = true;
  }

  if (response && response.request.fromCache !== true) {
    const apisEnabled =
      "inv_contents" in userProfile &&
      Object.keys(userProfile).filter((a) => a.startsWith("experience_skill_")).length > 0 &&
      "collection" in userProfile;

    const insertProfileStore = {
      last_update: new Date(),
      last_save: Math.max(...allSkyBlockProfiles.map((a) => a.members?.[paramPlayer]?.last_save ?? 0)),
      apis: apisEnabled,
      profiles: storeProfiles,
    };

    if (options.updateArea && Date.now() - userProfile.last_save < 5 * 60 * 1000) {
      try {
        const statusResponse = await Hypixel.get("status", {
          params: { uuid: paramPlayer, key: credentials.hypixel_api_key },
        });

        const areaData = statusResponse.data.session;

        if (areaData.online && areaData.gameType == "SKYBLOCK") {
          const areaName = constants.area_names[areaData.mode] || helper.titleCase(areaData.mode.replaceAll("_", " "));

          userProfile.current_area = areaName;
          insertProfileStore.current_area = areaName;
        }
      } catch (e) {
        console.error(e);
      }
    }

    updateLeaderboardPositions(db, paramPlayer, allSkyBlockProfiles).catch(console.error);

    db.collection("profileStore")
      .updateOne({ uuid: sanitize(paramPlayer) }, { $set: insertProfileStore }, { upsert: true })
      .catch(console.error);
  }

  console.debug(`${options.debugId}: getProfile returned. (${Date.now() - timeStarted}ms)`);
  return { profile: profile, allProfiles: allSkyBlockProfiles, uuid: paramPlayer };
};

export async function updateLeaderboardPositions(db, uuid, allProfiles) {
  if (constants.blocked_players.includes(uuid)) {
    return;
  }

  const hypixelProfile = await helper.getRank(uuid, db, true);

  const memberProfiles = [];

  for (const singleProfile of allProfiles) {
    const userProfile = singleProfile.members[uuid];

    if (userProfile == null) {
      continue;
    }

    userProfile.levels = await getLevels(userProfile, hypixelProfile);

    let totalSlayerXp = 0;

    userProfile.slayer_xp = 0;

    if (userProfile.slayer_bosses != undefined) {
      for (const slayer in userProfile.slayer_bosses) {
        totalSlayerXp += userProfile.slayer_bosses[slayer].xp || 0;
      }

      userProfile.slayer_xp = totalSlayerXp;

      for (const mountMob in constants.mob_mounts) {
        const mounts = constants.mob_mounts[mountMob];

        userProfile.stats[`kills_${mountMob}`] = 0;
        userProfile.stats[`deaths_${mountMob}`] = 0;

        for (const mount of mounts) {
          userProfile.stats[`kills_${mountMob}`] += userProfile.stats[`kills_${mount}`] || 0;
          userProfile.stats[`deaths_${mountMob}`] += userProfile.stats[`deaths_${mount}`] || 0;

          delete userProfile.stats[`kills_${mount}`];
          delete userProfile.stats[`deaths_${mount}`];
        }
      }
    }

    userProfile.pet_score = 0;

    const maxPetRarity = {};
    if (Array.isArray(userProfile.pets)) {
      for (const pet of userProfile.pets) {
        if (!("tier" in pet)) {
          continue;
        }

        maxPetRarity[pet.type] = Math.max(maxPetRarity[pet.type] || 0, constants.pet_value[pet.tier.toLowerCase()]);
      }

      for (const key in maxPetRarity) {
        userProfile.pet_score += maxPetRarity[key];
      }
    }

    memberProfiles.push({
      profile_id: singleProfile.profile_id,
      data: userProfile,
    });
  }

  const values = {};

  values["pet_score"] = getMax(memberProfiles, "data", "pet_score");

  values["fairy_souls"] = getMax(memberProfiles, "data", "fairy_souls_collected");
  values["average_level"] = getMax(memberProfiles, "data", "levels", "average_level");
  values["total_skill_xp"] = getMax(memberProfiles, "data", "levels", "total_skill_xp");

  for (const skill of getAllKeys(memberProfiles, "data", "levels", "levels")) {
    values[`skill_${skill}_xp`] = getMax(memberProfiles, "data", "levels", "levels", skill, "xp");
  }

  values["slayer_xp"] = getMax(memberProfiles, "data", "slayer_xp");

  for (const slayer of getAllKeys(memberProfiles, "data", "slayer_bosses")) {
    for (const key of getAllKeys(memberProfiles, "data", "slayer_bosses", slayer)) {
      if (!key.startsWith("boss_kills_tier")) {
        continue;
      }

      const tier = key.split("_").pop();

      values[`${slayer}_slayer_boss_kills_tier_${tier}`] = getMax(memberProfiles, "data", "slayer_bosses", slayer, key);
    }

    values[`${slayer}_slayer_xp`] = getMax(memberProfiles, "data", "slayer_bosses", slayer, "xp");
  }

  for (const item of getAllKeys(memberProfiles, "data", "collection")) {
    values[`collection_${item.toLowerCase()}`] = getMax(memberProfiles, "data", "collection", item);
  }

  for (const stat of getAllKeys(memberProfiles, "data", "stats")) {
    values[stat] = getMax(memberProfiles, "data", "stats", stat);
  }

  // Dungeons (Mainly Catacombs now.)
  for (const stat of getAllKeys(memberProfiles, "data", "dungeons", "dungeon_types", "catacombs")) {
    switch (stat) {
      case "best_runs":
      case "highest_tier_completed":
        break;
      case "experience":
        values[`dungeons_catacombs_xp`] = getMax(
          memberProfiles,
          "data",
          "dungeons",
          "dungeon_types",
          "catacombs",
          "experience"
        );
        break;
      default:
        for (const floor of getAllKeys(memberProfiles, "data", "dungeons", "dungeon_types", "catacombs", stat)) {
          const floor_id = `catacombs_${floor}`;
          if (!constants.dungeons.floors[floor_id] || !constants.dungeons.floors[floor_id].name) continue;

          const floor_name = constants.dungeons.floors[floor_id].name;
          values[`dungeons_catacombs_${floor_name}_${stat}`] = getMax(
            memberProfiles,
            "data",
            "dungeons",
            "dungeon_types",
            "catacombs",
            stat,
            floor
          );
        }
    }
  }

  for (const dungeon_class of getAllKeys(memberProfiles, "data", "dungeons", "player_classes")) {
    values[`dungeons_class_${dungeon_class}_xp`] = getMax(
      memberProfiles,
      "data",
      "dungeons",
      "player_classes",
      dungeon_class,
      "experience"
    );
  }

  values[`dungeons_secrets_found`] = hypixelProfile.achievements.skyblock_treasure_hunter || 0;

  const multi = redisClient.pipeline();

  for (const key in values) {
    if (values[key] == null) {
      continue;
    }

    multi.zadd(`lb_${key}`, values[key], uuid);
  }
  for (const singleProfile of allProfiles) {
    if (singleProfile.banking?.balance != undefined) {
      multi.zadd(`lb_bank`, singleProfile.banking.balance, singleProfile.profile_id);
    }

    const minionCrafts = [];

    for (const member in singleProfile.members) {
      if (Array.isArray(singleProfile.members[member].crafted_generators)) {
        minionCrafts.push(...singleProfile.members[member].crafted_generators);
      }
    }

    multi.zadd(`lb_unique_minions`, _.uniq(minionCrafts).length, singleProfile.profile_id);
  }

  try {
    await multi.exec();
  } catch (e) {
    console.error(e);
  }
}

export function getPacks() {
  return packs.sort((a, b) => b.priority - a.priority);
}

async function init() {
  const response = await axios("https://api.hypixel.net/resources/skyblock/collections");

  if (!response?.data?.collections) {
    return;
  }

  for (const type in response.data.collections) {
    for (const itemType in response.data.collections[type].items) {
      const item = response.data.collections[type].items[itemType];
      try {
        const collectionData = constants.collection_data.find((a) => a.skyblockId == itemType);

        collectionData.maxTier = item.maxTiers;
        collectionData.tiers = item.tiers;
      } catch (e) {
        if (e instanceof TypeError) {
          //Collection Data filter error
        } else {
          //Throw exception unchanged
          throw e;
        }
      }
    }
  }
}

init();
