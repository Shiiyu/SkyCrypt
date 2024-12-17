import { getLevelByXp } from "./skills/leveling.js";
import * as constants from "../constants.js";
import * as helper from "../helper.js";
import moment from "moment";

export function getMiningCoreData(userProfile) {
  const output = {};

  const data = userProfile.mining_core;
  if (data === undefined) {
    return;
  }

  output.level = getLevelByXp(data.experience, { type: "hotm" });

  const totalTokens = helper.calcHotmTokens(output.level.level, data.nodes?.special_0 ?? 0);
  output.tokens = {
    total: totalTokens,
    spent: data.tokens_spent ?? 0,
    available: totalTokens - (data.tokens_spent ?? 0),
  };

  output.selected_pickaxe_ability = constants.HOTM.names[data.selected_pickaxe_ability] ?? null;

  output.powder = {
    mithril: {
      total: (data.powder_mithril ?? 0) + (data.powder_spent_mithril ?? 0),
      spent: data.powder_spent_mithril ?? 0,
      available: data.powder_mithril ?? 0,
    },
    gemstone: {
      total: (data.powder_gemstone ?? 0) + (data.powder_spent_gemstone ?? 0),
      spent: data.powder_spent_gemstone || 0,
      available: data.powder_gemstone ?? 0,
    },
    glacite: {
      total: (data.powder_glacite ?? 0) + (data.powder_spent_glacite ?? 0),
      spent: data.powder_spent_glacite ?? 0,
      available: data.powder_glacite ?? 0,
    },
  };

  const crystalsCompleted = data.crystals
    ? Object.values(data.crystals)
        .filter((x) => x.total_placed)
        .map((x) => x.total_placed)
    : [];
  output.crystal_nucleus = {
    times_completed: crystalsCompleted.length > 0 ? Math.min(...crystalsCompleted) : 0,
    crystals: data.crystals ?? {},
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

  output.hotm_last_reset = data.last_reset ?? 0;

  output.crystal_hollows_last_access = data.greater_mines_last_access ?? 0;

  output.daily_effect = {
    effect: data.current_daily_effect ?? null,
    last_changed: data.current_daily_effect_last_changed ?? null,
  };

  output.nodes = data.nodes ?? {};

  return output;
}

async function getForge(userProfile) {
  const output = {};

  if (userProfile.forge?.forge_processes?.forge_1) {
    const forge = Object.values(userProfile.forge.forge_processes.forge_1);

    const processes = [];
    for (const item of forge) {
      const forgeItem = {
        id: item.id,
        slot: item.slot,
        timeFinished: 0,
        timeFinishedText: "",
      };

      const dbObject = constants.ITEMS.get(item.id);

      if (item.id in constants.FORGE_TIMES) {
        let forgeTime = constants.FORGE_TIMES[item.id] * 60 * 1000;
        const quickForge = userProfile.mining_core?.nodes?.forge_time;
        if (quickForge != null) {
          forgeTime *= constants.QUICK_FORGE_MULTIPLIER[quickForge];
        }

        if (item.id == "BEJEWELED_COLLAR") {
          forgeItem.name = helper.titleCase(item.id.replace("_", " "));
        } else {
          forgeItem.name =
            item.type == "PETS" ? "[Lvl 1] " + helper.titleCase(item.id) : dbObject ? dbObject.name : item.id;
        }

        const timeFinished = item.startTime + forgeTime;
        forgeItem.timeFinished = timeFinished;
        forgeItem.timeFinishedText = moment(timeFinished).fromNow();
      } else {
        forgeItem.name = dbObject?.name ?? helper.titleCase(item.id);
        forgeItem.id = `UNKNOWN-${item.id}`;
      }

      processes.push(forgeItem);
    }

    output.processes = processes;
  }

  return output;
}

export async function getMining(userProfile, hypixelProfile) {
  const mining = {
    commissions: {
      milestone: 0,
      completions: hypixelProfile.achievements.skyblock_hard_working_miner || 0,
    },
    forge: {},
    core: {},
  };

  if (userProfile.objectives?.tutorial !== undefined) {
    for (const key of userProfile.objectives.tutorial) {
      if (key.startsWith("commission_milestone_reward_mining_xp_tier_") === false) {
        continue;
      }

      const tier = parseInt(key.slice(43));
      mining.commissions.milestone = Math.max(mining.commissions.milestone, tier);
    }
  }

  mining.core = getMiningCoreData(userProfile);

  mining.forge = await getForge(userProfile);

  return mining;
}
