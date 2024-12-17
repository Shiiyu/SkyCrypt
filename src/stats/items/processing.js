import { getTexture } from "../../custom-resources.js";
import { getItemNetworth } from "skyhelper-networth";
import * as constants from "../../constants.js";
import minecraftData from "minecraft-data";
import * as helper from "../../helper.js";
const mcData = minecraftData("1.8.9");
import { fileURLToPath } from "url";
import { db } from "../../mongo.js";
import path from "path";

import util from "util";
import nbt from "prismarine-nbt";
import { v4 } from "uuid";
const parseNbt = util.promisify(nbt.parse);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function itemSorter(a, b) {
  if (a.rarity !== b.rarity) {
    return constants.RARITIES.indexOf(b.rarity) - constants.RARITIES.indexOf(a.rarity);
  }

  if (b.inBackpack && !a.inBackpack) {
    return -1;
  }
  if (a.inBackpack && !b.inBackpack) {
    return 1;
  }

  return a.item_index - b.item_index;
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

// Process items returned by API
export async function processItems(base64, source, customTextures = false, packs, cacheOnly = false) {
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

    if (
      item.tag?.ExtraAttributes?.id?.includes("PERSONAL_COMPACTOR_") ||
      item.tag?.ExtraAttributes?.id?.includes("PERSONAL_DELETOR_")
    ) {
      item.containsItems = [];
      for (const key in item.tag.ExtraAttributes) {
        if (key.startsWith("personal_compact_") || key.startsWith("personal_deletor_")) {
          const itemData = await helper.getItemData({ skyblockId: item.tag.ExtraAttributes[key] });

          itemData.itemId = v4();

          item.containsItems.push(itemData);
        }
      }
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
      const rarityUpgrades = item.tag.ExtraAttributes.rarity_upgrades;

      if (rarityUpgrades > 0) {
        item.extra.recombobulated = true;
      }
    }

    if (item.tag?.ExtraAttributes?.model != undefined) {
      item.extra.model = item.tag.ExtraAttributes.model;
    }

    if (item.tag?.ExtraAttributes?.hot_potato_count != undefined) {
      item.extra.hpbs = item.tag.ExtraAttributes.hot_potato_count;
    }

    if (item.tag?.ExtraAttributes?.expertise_kills != undefined) {
      const expertiseKills = item.tag.ExtraAttributes.expertise_kills;

      if (expertiseKills > 0) {
        item.extra.expertise_kills = expertiseKills;
      }
    }

    if (item.tag?.ExtraAttributes?.compact_blocks !== undefined) {
      const compactBlocks = item.tag.ExtraAttributes.compact_blocks;

      if (compactBlocks > 0) {
        item.extra.compact_blocks = compactBlocks;
      }
    }

    if (item.tag?.ExtraAttributes?.hecatomb_s_runs != undefined) {
      const hecatombSRuns = item.tag.ExtraAttributes.hecatomb_s_runs;

      if (hecatombSRuns > 0) {
        item.extra.hecatomb_s_runs = hecatombSRuns;
      }
    }

    if (item.tag?.ExtraAttributes?.champion_combat_xp != undefined) {
      const championCombatXp = item.tag.ExtraAttributes.champion_combat_xp;

      if (championCombatXp > 0) {
        item.extra.champion_combat_xp = championCombatXp;
      }
    }

    if (item.tag?.ExtraAttributes?.farmed_cultivating != undefined) {
      const farmedCultivating = item.tag.ExtraAttributes.farmed_cultivating;

      if (farmedCultivating > 0) {
        item.extra.farmed_cultivating = farmedCultivating.toString();
      }
    }

    if (item.tag?.ExtraAttributes?.blocks_walked != undefined) {
      const blocksWalked = item.tag.ExtraAttributes.blocks_walked;

      if (blocksWalked > 0) {
        item.extra.blocks_walked = blocksWalked;
      }
    }

    if (item.tag?.ExtraAttributes?.timestamp != undefined) {
      const timestamp = item.tag.ExtraAttributes.timestamp;

      if (!isNaN(Number(timestamp))) {
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

    if (item.tag?.display?.color) {
      const hex = item.tag.display.color.toString(16).padStart(6, "0");

      item.color = hex.toUpperCase();
    }

    // Set custom texture for colored leather armor
    if (typeof item.id === "number" && item.id >= 298 && item.id <= 301) {
      const color = item.tag?.display?.color?.toString(16).padStart(6, "0") ?? "955e3b";

      const type = ["helmet", "chestplate", "leggings", "boots"][item.id - 298];

      item.texture_path = `/leather/${type}/${color}`;
    }

    // Set custom texture for colored potions
    if (item.id == 373) {
      const color = constants.POTION_COLORS[item.Damage % 16];

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

    const animatedTexture = helper.getAnimatedTexture(item);

    // Gives animated texture on certain items, will be overwritten by custom textures
    if (animatedTexture) {
      item.texture_path = animatedTexture.texture;
    }

    // Uses animated skin texture
    if (item?.extra?.skin != undefined && constants.ANIMATED_ITEMS?.[item.extra.skin]) {
      item.texture_path = constants.ANIMATED_ITEMS[item.extra.skin].texture;
    }

    if (customTextures) {
      const customTexture = getTexture(item, {
        ignore_id: false,
        pack_ids: packs,
        hotm: source === "storage_icons",
      });

      if (customTexture) {
        item.animated = customTexture.animated;
        item.texture_path = "/" + customTexture.path;
        item.texture_pack = customTexture.pack.config;
        item.texture_pack.base_path =
          "/" + path.relative(path.resolve(__dirname, "..", "public"), customTexture.pack.base_path);
      }
    }

    if (source !== undefined) {
      item.extra ??= {};
      item.extra.source = helper.titleCase(source.replace("_", " "));
    }

    // Lore stuff
    const itemLore = item?.tag?.display?.Lore ?? [];
    const loreRaw = [...itemLore];

    const lore = loreRaw != null ? loreRaw.map((a) => (a = helper.getRawLore(a))) : [];

    item.rarity = null;
    item.categories = [];

    if (lore.length > 0) {
      // item categories, rarity, recombobulated, dungeon, shiny
      const itemType = helper.parseItemTypeFromLore(lore, item);

      for (const key in itemType) {
        item[key] = itemType[key];
      }

      // fix custom maps texture
      if (item.id == 358) {
        item.id = 395;
        item.Damage = 0;
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
          ...helper.parseItemGems(item.extra.gems, item.rarity).map((gem) => `§7 - ${gem.lore}`),
        );
      }

      if (item.extra?.compact_blocks) {
        const compactBlocks = item.extra.compact_blocks;

        if (loreRaw) {
          itemLore.push("", `§7Ores Mined: §c${compactBlocks.toLocaleString()}`);
          if (compactBlocks >= 15000) {
            itemLore.push(`§8MAXED OUT!`);
          } else {
            let toNextLevel = 0;
            for (const e of constants.ENCHANTMENT_LADDERS.compact_ores) {
              if (compactBlocks < e) {
                toNextLevel = e - compactBlocks;
                break;
              }
            }
            itemLore.push(`§8${toNextLevel.toLocaleString()} ores to tier up!`);
          }
        }
      }

      if (item.extra?.expertise_kills) {
        const expertiseKills = item.extra.expertise_kills;

        if (loreRaw) {
          itemLore.push("", `§7Expertise Kills: §c${expertiseKills.toLocaleString()}`);
          if (expertiseKills >= 15000) {
            itemLore.push(`§8MAXED OUT!`);
          } else {
            let toNextLevel = 0;
            for (const e of constants.ENCHANTMENT_LADDERS.expertise_kills) {
              if (expertiseKills < e) {
                toNextLevel = e - expertiseKills;
                break;
              }
            }
            itemLore.push(`§8${toNextLevel.toLocaleString()} kills to tier up!`);
          }
        }
      }

      if (item.extra?.hecatomb_s_runs) {
        const hecatombSRuns = item.extra.hecatomb_s_runs;

        if (loreRaw) {
          itemLore.push("", `§7Hecatomb Runs: §c${hecatombSRuns.toLocaleString()}`);
          if (hecatombSRuns >= 100) {
            itemLore.push(`§8MAXED OUT!`);
          } else {
            let toNextLevel = 0;
            for (const e of constants.ENCHANTMENT_LADDERS.hecatomb_s_runs) {
              if (hecatombSRuns < e) {
                toNextLevel = e - hecatombSRuns;
                break;
              }
            }
            itemLore.push(`§8${toNextLevel.toLocaleString()} runs to tier up!`);
          }
        }
      }

      if (item.extra?.champion_combat_xp) {
        const championCombatXp = Math.floor(item.extra.champion_combat_xp);

        if (loreRaw) {
          itemLore.push("", `§7Champion XP: §c${championCombatXp.toLocaleString()}`);
          if (championCombatXp >= 3000000) {
            itemLore.push(`§8MAXED OUT!`);
          } else {
            let toNextLevel = 0;
            for (const e of constants.ENCHANTMENT_LADDERS.champion_xp) {
              if (championCombatXp < e) {
                toNextLevel = Math.floor(e - championCombatXp);
                break;
              }
            }
            itemLore.push(`§8${toNextLevel.toLocaleString()} xp to tier up!`);
          }
        }
      }

      if (item.extra?.farmed_cultivating) {
        const farmedCultivating = Math.floor(item.extra.farmed_cultivating);

        if (loreRaw) {
          itemLore.push("", `§7Cultivating Crops: §c${farmedCultivating.toLocaleString()}`);
          if (farmedCultivating >= 100000000) {
            itemLore.push(`§8MAXED OUT!`);
          } else {
            let toNextLevel = 0;
            for (const e of constants.ENCHANTMENT_LADDERS.cultivating_crops) {
              if (farmedCultivating < e) {
                toNextLevel = Math.floor(e - farmedCultivating);
                break;
              }
            }
            itemLore.push(`§8${toNextLevel.toLocaleString()} crops to tier up!`);
          }
        }
      }

      if (item.extra?.blocks_walked) {
        const blocksWalked = item.extra.blocks_walked;

        if (loreRaw) {
          itemLore.push("", `§7Blocks Walked: §c${blocksWalked.toLocaleString()}`);
          if (blocksWalked >= 100000) {
            itemLore.push(`§8MAXED OUT!`);
          } else {
            let toNextLevel = 0;
            for (const e of constants.PREHISTORIC_EGG_BLOCKS_WALKED_LADDER) {
              if (blocksWalked < e) {
                toNextLevel = e - blocksWalked;
                break;
              }
            }
            itemLore.push(`§8Walk ${toNextLevel.toLocaleString()} blocks to tier up!`);
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
          `§7Dungeon Item Quality: ${item.extra.base_stat_boost == 50 ? "§6" : "§c"}${item.extra.base_stat_boost}/50%`,
        );
      }

      if (item.extra?.floor) {
        itemLore.push(`§7Obtained From: §bFloor ${item.extra.floor}`);
      }

      if (item.extra?.price_paid) {
        itemLore.push("", `§7Price Paid at Dark Auction: §6${item.extra.price_paid.toLocaleString()} Coins`);
      }
    }

    if ((item?.tag || item?.exp) && item.extra?.source !== "Storage Icons") {
      try {
        const ITEM_PRICE = await getItemNetworth(item, { cache: true });
        if (ITEM_PRICE?.price > 0) {
          itemLore.push(
            "",
            `§7Item Value: §6${Math.round(ITEM_PRICE.price).toLocaleString()} Coins §7(§6${helper.formatNumber(
              ITEM_PRICE.price,
            )}§7)`,
          );
        }
      } catch (error) {
        console.log(error);
        itemLore.push("", `§7Item Value: §cAn error occurred while calculating the value of this item.`);
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
