const CROP_TO_PEST = {
  CACTUS: "Mite",
  CARROT_ITEM: "Cricket",
  "INK_SACK:3": "Moth",
  MELON: "Earthworm",
  MUSHROOM_COLLECTION: "Slug",
  NETHER_STALK: "Beetle",
  POTATO_ITEM: "Locust",
  PUMPKIN: "Rat",
  SUGAR_CANE: "Mosquito",
  WHEAT: "Fly",
};

const PEST_COLLECTION_BRACKETS = [0, 50, 100, 250, 500, 750, 1000, 5000];

// Taken from https://api.elitebot.dev/weights/all
const PEST_COLLECTION_ADJUSTMENTS = {
  Mite: {
    0: 0,
    50: 392.81450646884014,
    100: 669.923748937681,
    250: 947.0330011428568,
    500: 1224.1422338753637,
    750: 1390.407781303933,
    1000: 1556.6733482051768,
    5000: 1778.3607382857135,
  },
  Cricket: {
    0: 0,
    50: 489.7523779006233,
    100: 902.7047558012473,
    250: 1315.6571428571424,
    500: 1728.609511602488,
    750: 1976.3809401739236,
    1000: 2224.152387055896,
    5000: 2554.5142857142855,
  },
  Moth: {
    0: 0,
    50: 298.189635562343,
    100: 495.4108711246863,
    250: 692.6321142857141,
    500: 889.8533422493692,
    750: 1008.1860851065103,
    1000: 1126.5188431610259,
    5000: 1284.2958285714303,
  },
  Earthworm: {
    0: 0,
    50: 213.57277446402622,
    100: 364.2367361280558,
    250: 514.9007030857138,
    500: 665.5646594561076,
    750: 755.9630375132474,
    1000: 846.3614261576658,
    5000: 966.8925933714272,
  },
  Slug: {
    0: 0,
    50: 167.24639496106215,
    100: 285.229618722125,
    250: 403.21284662857124,
    500: 521.1960662442498,
    750: 591.986001329964,
    1000: 662.7759447064464,
    5000: 757.1625220571423,
  },
  Beetle: {
    0: 0,
    50: 853.9206973770688,
    100: 1428.2624411541383,
    250: 2002.6042084571436,
    500: 2576.9459287082755,
    750: 2921.550979679705,
    1000: 3266.1560777030063,
    5000: 3725.629463314286,
  },
  Locust: {
    0: 0,
    50: 593.1620207157785,
    100: 1049.2292862315571,
    250: 1505.2965677714292,
    500: 1961.3638172631108,
    750: 2235.004179777403,
    1000: 2508.6445743398726,
    5000: 2873.4983803428586,
  },
  Rat: {
    0: 0,
    50: 14.107772226298493,
    100: 24.060037252596885,
    250: 34.01230262857098,
    500: 43.96456730519367,
    750: 49.93592639090821,
    1000: 55.90728617597506,
    5000: 63.869098057142764,
  },
  Mosquito: {
    0: 0,
    50: 20.584146115646945,
    100: 35.10514023129508,
    250: 49.62613485714246,
    500: 64.14712846258954,
    750: 72.85972503401717,
    1000: 81.57232262585057,
    5000: 93.18911771428247,
  },
  Fly: { 0: 0, 50: 0, 100: 0, 250: 0, 500: 0, 750: 0, 1000: 0, 5000: 0 },
};

const crops = {
  CACTUS: {
    name: "Cactus",
    weight: 178_730.65,
  },
  CARROT_ITEM: {
    name: "Carrot",
    weight: 300_000,
  },
  "INK_SACK:3": {
    name: "Cocoa Bean",
    weight: 276_733.75,
  },
  MELON: {
    name: "Melon",
    weight: 488_435.47,
  },
  MUSHROOM_COLLECTION: {
    name: "Mushroom",
    weight: 90_944.27,
  },
  NETHER_STALK: {
    name: "Nether Wart",
    weight: 248_606.81,
  },
  POTATO_ITEM: {
    name: "Potato",
    weight: 298_328.17,
  },
  PUMPKIN: {
    name: "Pumpkin",
    weight: 99_236.12,
  },
  SUGAR_CANE: {
    name: "Sugar Cane",
    weight: 198_885.45,
  },
  WHEAT: {
    name: "Wheat",
    weight: 100_000,
  },
};
function calculatePestCrops(pest) {
  let kills = pest?.kills ?? 0;
  let pestCount = 0;
  let pestCropCount = 0;
  for (let i = 0; i < PEST_COLLECTION_BRACKETS.length; i++) {
    const bracket = PEST_COLLECTION_BRACKETS[i];

    if (kills <= 0) break;

    const bracketCrops = PEST_COLLECTION_ADJUSTMENTS[pest.name][bracket];

    if (i === PEST_COLLECTION_BRACKETS.length - 1) {
      pestCropCount += Math.ceil(bracketCrops * kills);
      break;
    }

    const nextBracket = PEST_COLLECTION_BRACKETS.at(i + 1);

    pestCount = Math.min(nextBracket - pestCount, kills);

    if (bracketCrops === 0) {
      kills -= pestCount;
      continue;
    }

    kills -= pestCount;
    pestCropCount += Math.ceil(bracketCrops * pestCount);
  }
  return pestCropCount;
}

export function calculateFarmingWeight(userProfile) {
  const output = {
    weight: 0,
    crops: {},
    bonuses: {
      level: {
        level: 0,
        weight: 0,
      },
    },
  };

  const farmingCollection = userProfile?.collections?.farming?.collections;
  const pests = userProfile?.bestiary?.categories?.garden?.mobs;
  if (farmingCollection !== undefined) {
    let weight = 0;
    for (const [name, crop] of Object.entries(crops)) {
      const { amount = 0 } = farmingCollection.find((a) => a.id === name);

      const pest = pests?.find((a) => a.name === CROP_TO_PEST[name]);
      const pestCrops = calculatePestCrops(pest);

      const calculated = Math.max(amount - pestCrops, 0) / crop.weight;

      output.crops[name] = {
        name: crop.name,
        weight: calculated,
      };

      weight += calculated;
    }

    output.weight += weight;

    const mushroomCollection = farmingCollection.find((a) => a.id === "MUSHROOM_COLLECTION")?.amount ?? 0;

    const total = output.weight;
    const doubleBreakRatio = total <= 0 ? 0 : (output.crops.CACTUS.weight + output.crops.SUGAR_CANE.weight) / total;
    const normalRatio = total <= 0 ? 0 : (total - output.crops.CACTUS.weight - output.crops.SUGAR_CANE.weight) / total;

    const mushroomWeight =
      doubleBreakRatio * (mushroomCollection / (2 * crops.MUSHROOM_COLLECTION.weight)) +
      normalRatio * (mushroomCollection / crops.MUSHROOM_COLLECTION.weight);

    output.weight -= output.crops.MUSHROOM_COLLECTION.weight;
    output.crops.MUSHROOM_COLLECTION.weight = mushroomWeight;
    output.weight += mushroomWeight;
  }

  output.crop_weight = output.weight;

  let bonus = 0;

  const farmingSkill = userProfile?.skills?.skills?.farming;
  if (farmingSkill) {
    if (farmingSkill.level >= 50) {
      output.bonuses.level.level = 50;
      output.bonuses.level.weight += 100;
      bonus += 100;
    }
    if (farmingSkill.level >= 60) {
      output.bonuses.level.level = 60;
      output.bonuses.level.weight += 150;
      bonus += 150;
    }
  }

  if (userProfile?.farming) {
    const doubleDrops = userProfile.farming?.perks?.double_drops ?? 0;
    output.bonuses.double_drops = {
      double_drops: doubleDrops,
      weight: doubleDrops * 2,
    };

    bonus += doubleDrops * 2;

    const maxMedals = 1000;
    const medals = userProfile.farming?.total_badges;
    const diamondMedals = medals?.diamond ?? 0;
    const platinumMedals = Math.min(medals?.platinum ?? 0, maxMedals - diamondMedals);
    const goldMedals = Math.min(medals?.gold ?? 0, maxMedals - diamondMedals - platinumMedals);

    const diamondMedalBonus = diamondMedals * 0.75;
    const platinumMedalBonus = platinumMedals * 0.5;
    const goldMedalBonus = goldMedals * 0.25;

    const contestMedals = goldMedals + platinumMedals + diamondMedals;
    const contestMedalBonus = goldMedalBonus + platinumMedalBonus + diamondMedalBonus;

    output.bonuses.contest_medals = {
      medals: contestMedals,
      weight: contestMedalBonus,
    };

    bonus += contestMedalBonus;
  }

  if (userProfile.minions !== undefined) {
    const FARMING_MINIONS = [
      "WHEAT",
      "CARROT",
      "POTATO",
      "PUMPKIN",
      "MELON",
      "MUSHROOM",
      "COCOA",
      "CACTUS",
      "SUGAR_CANE",
      "NETHER_WARTS",
    ];

    let count = 0;
    for (const minion of userProfile.minions.minions.farming.minions) {
      if (FARMING_MINIONS.includes(minion.id) === false) {
        continue;
      }

      if (minion.tier == 12) {
        count++;
        bonus += 5;
      }
    }

    output.bonuses.minions = {
      count: count,
      weight: count * 5,
    };
  }

  output.bonus_weight = bonus;

  output.weight += bonus;

  return output;
}
