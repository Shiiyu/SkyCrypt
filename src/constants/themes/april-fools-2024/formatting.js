const faces = [
  "(・`ω´・)",
  ";;w;;",
  "owo",
  "UwU",
  ">w<",
  "^w^",
  "(* ^ ω ^)",
  "(⌒ω⌒)",
  "ヽ(*・ω・)ﾉ",
  "(o´∀`o)",
  "(o･ω･o)",
  "＼(＾▽＾)／",
];

// const mapBracketsToStarTrails = (input) => input.replace(/[({<]/g, "｡･:*:･ﾟ★,｡･:*:･ﾟ☆").replace(/[)}>]/g, "☆ﾟ･:*:･｡,★ﾟ･:*:･｡");
const mapPeriodCommaExclamationSemicolonToKaomojis = (input) =>
  input
    .replace(/[.,](?![0-9])/g, () => " " + faces[Math.floor(Math.random() * faces.length)])
    .replace(/[!;]+/g, () => " " + faces[Math.floor(Math.random() * faces.length)]);
const mapThatToDat = (input) => input.replace(/that/g, "dat").replace(/That/g, "Dat");
const mapThToF = (input) => input.replace(/[Tt]h(?![Ee])/g, "f").replace(/TH(?!E)/g, "F");
const mapLeToWal = (input) => input.replace(/le$/g, "wal");
const mapVeToWe = (input) => input.replace(/ve/g, "we").replace(/Ve/g, "We");
const mapRyToWwy = (input) => input.replace(/ry/g, "wwy");
const mapROrLToW = (input) => input.replace(/(?<!§)[rl]/g, "w").replace(/[RL]/g, "W");

export const UWU_MAPPING_ARRAY = [
  // mapBracketsToStarTrails,
  mapPeriodCommaExclamationSemicolonToKaomojis,
  mapThatToDat,
  mapThToF,
  mapLeToWal,
  mapVeToWe,
  mapRyToWwy,
  mapROrLToW,
];
