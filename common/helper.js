import * as constants from "./constants.js";

/**
 * removes Minecraft formatting codes from a string
 * @param {string} string
 * @returns {string}
 */
export function removeFormatting(string) {
  return string.replaceAll(/§[0-9a-z]/g, "");
}

/**
 * @param  {Item} piece
 * @returns {ItemStats}
 */
export function getStatsFromItem(piece) {
  const regex = /^([A-Za-z ]+): ([+-]([0-9]+\.?[0-9]*))/;
  const stats = {};

  if (!piece) {
    return stats;
  }

  const lore = (piece.tag.display.Lore || []).map((line) => removeFormatting(line));

  for (const line of lore) {
    const match = regex.exec(line);

    if (match == null) {
      continue;
    }

    const statName = Object.keys(constants.statsData).find((key) => constants.statsData[key].nameLore === match[1]);
    const statValue = parseFloat(match[2]);

    if (statName) {
      stats[statName] ??= 0;
      stats[statName] += statValue;
    }
  }

  return stats;
}

/**
 * @param {string} string
 * @returns {string}
 */
export function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

/**
 * @param {string} string
 * @returns {string}
 */
export function titleCase(string) {
  let split = string.toLowerCase().split(" ");

  for (let i = 0; i < split.length; i++) {
    split[i] = split[i].charAt(0).toUpperCase() + split[i].substring(1);
  }

  return split.join(" ");
}
