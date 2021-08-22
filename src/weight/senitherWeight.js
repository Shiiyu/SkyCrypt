const constants = require("../constants");

const level50SkillExp = 55172425;
const level60SkillExp = 111672425;

// Skill Weight

const skillWeight = {
  // Maxes out mining at 1,750 points at 60.
  mining: {
    exponent: 1.18207448,
    divider: 259634,
    maxLevel: 60,
  },
  // Maxes out foraging at 850 points at level 50.
  foraging: {
    exponent: 1.232826,
    divider: 259634,
    maxLevel: 50,
  },
  // Maxes out enchanting at 450 points at level 60.
  enchanting: {
    exponent: 0.96976583,
    divider: 882758,
    maxLevel: 60,
  },
  // Maxes out farming at 2,200 points at level 60.
  farming: {
    exponent: 1.217848139,
    divider: 220689,
    maxLevel: 60,
  },
  // Maxes out combat at 1,500 points at level 60.
  combat: {
    exponent: 1.15797687265,
    divider: 275862,
    maxLevel: 60,
  },
  // Maxes out fishing at 2,500 points at level 50.
  fishing: {
    exponent: 1.406418,
    divider: 88274,
    maxLevel: 50,
  },
  // Maxes out alchemy at 200 points at level 50.
  alchemy: {
    exponent: 1.0,
    divider: 1103448,
    maxLevel: 50,
  },
  // Maxes out taming at 500 points at level 50.
  taming: {
    exponent: 1.14744,
    divider: 441379,
    maxLevel: 50,
  },
  // Sets up carpentry and runecrafting without any weight components.
  carpentry: {
    maxLevel: 50,
  },
  runecrafting: {
    maxLevel: 25,
  },
};

function calcSkillWeight(skillGroup, level, experience) {
  if (skillGroup.exponent == undefined || skillGroup.divider == undefined) {
    return {
      weight: 0,
      weight_overflow: 0,
    };
  }

  let maxSkillLevelXP = skillGroup.maxLevel == 60 ? level60SkillExp : level50SkillExp;

  let base = Math.pow(level * 10, 0.5 + skillGroup.exponent + level / 100) / 1250;
  if (experience > maxSkillLevelXP) {
    base = Math.round(base);
  }

  if (experience <= maxSkillLevelXP) {
    return {
      weight: base,
      weight_overflow: 0,
    };
  }

  return {
    weight: base,
    weight_overflow: Math.pow((experience - maxSkillLevelXP) / skillGroup.divider, 0.968),
  };
}

// Dungeons Weight

const dungeonsWeight = {
  catacombs: 0.0002149604615,
  healer: 0.0000045254834,
  mage: 0.0000045254834,
  berserk: 0.0000045254834,
  archer: 0.0000045254834,
  tank: 0.0000045254834,
};

function calcDungeonsWeight(type, level, experience) {
  if (type.startsWith("master_")) {
    return {
      weight: 0,
      weight_overflow: 0,
    };
  }

  let percentageModifier = dungeonsWeight[type];
  let level50Experience = 569809640;

  let base = Math.pow(level, 4.5) * percentageModifier;

  if (experience <= level50Experience) {
    return {
      weight: base,
      weight_overflow: 0,
    };
  }

  let remaining = experience - level50Experience;
  let splitter = (4 * level50Experience) / base;

  return {
    weight: Math.floor(base),
    weight_overflow: Math.pow(remaining / splitter, 0.968),
  };
}

function calcDungeonsClassLevelWithProgress(experience) {
  let level = 0;

  for (let toRemove of Object.values(constants.dungeoneering_xp)) {
    experience -= toRemove;
    if (experience < 0) {
      return level + (1 - (experience * -1) / toRemove);
    }
    level++;
  }

  return Math.min(level, 50);
}

// Slayer Weight

const slayerWeight = {
  zombie: {
    divider: 2208,
    modifier: 0.15,
  },
  spider: {
    divider: 2118,
    modifier: 0.08,
  },
  wolf: {
    divider: 1962,
    modifier: 0.015,
  },
  enderman: {
    divider: 1430,
    modifier: 0.017,
  },
};

function calcSlayerWeight(type, experience) {
  let sw = slayerWeight[type];

  if (!experience || experience <= 1000000) {
    return {
      weight: !experience ? 0 : experience / sw.divider, // for some reason experience can be undefined
      weight_overflow: 0,
    };
  }

  let base = 1000000 / sw.divider;
  let remaining = experience - 1000000;

  let modifier = sw.modifier;
  let overflow = 0;

  while (remaining > 0) {
    let left = Math.min(remaining, 1000000);

    overflow += Math.pow(left / (sw.divider * (1.5 + modifier)), 0.942);
    modifier += sw.modifier;
    remaining -= left;
  }

  return {
    weight: base,
    weight_overflow: overflow,
  };
}

module.exports = {
  /*
    All weight calculations are provided by Senither (https://github.com/Senither/)
  */

  calculateWeight: (profile) => {
    let output = {
      overall: 0,
      dungeon: {
        total: 0,
        dungeons: {},
        classes: {},
      },
      skill: {
        total: 0,
        skills: {},
      },
      slayer: {
        total: 0,
        slayers: {},
      },
    };

    for (let skillName in profile.levels) {
      let data = profile.levels[skillName];

      let sw = calcSkillWeight(skillWeight[skillName], data.levelWithProgress, data.xp);

      output.skill.skills[skillName] = sw.weight + sw.weight_overflow;
      output.skill.total += output.skill.skills[skillName];
    }

    /*
      //dungeon dungeons

      let dungeonLevelWithProgress = calcDungeonsClassLevelWithProgress(dungeon.experience);

      let dungeonsWeight = calcDungeonsWeight(type, dungeonLevelWithProgress, dungeon.experience);
      output.dungeonsWeight += dungeonsWeight.weight;
      output.dungeonsWeight += dungeonsWeight.weight_overflow;

      //dungeon classes

      let levelWithProgress = calcDungeonsClassLevelWithProgress(data.experience);

      let classWeight = calcDungeonsWeight(className, levelWithProgress, data.experience);
      output.dungeonsWeight += classWeight.weight;
      output.dungeonsWeight += classWeight.weight_overflow;

      output.dungeonsWeight = output.dungeons.dungeonsWeight ?? -1;

    */

    for (let slayerName in profile.slayers) {
      let data = profile.slayers[slayerName];
      let sw = calcSlayerWeight(slayerName, data.level);

      output.slayer.slayers[slayerName] = sw.weight + sw.weight_overflow;
      output.slayer.total += output.slayer.slayers[slayerName];
    }

    output.overall = [output.dungeon.total, output.skill.total, output.slayer.total]
      .filter((x) => x >= 0)
      .reduce((total, value) => total + value);

    console.log(output);
    return output;
  },
};
