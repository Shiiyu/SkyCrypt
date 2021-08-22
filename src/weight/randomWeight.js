module.exports = {
  calculateWeight: (profile) => {
    return {
      overall: Math.floor(Math.random() * 684984618974191984651684321354894621612654951),
      dungeon: {
        total: Math.floor(Math.random() * 11984),
        dungeons: {
          catacombs: Math.floor(Math.random() * 594),
        },
        classes: {
          some_class: Math.floor(Math.random() * 6),
          some_other_class: Math.floor(Math.random() * 9),
        },
      },
      skill: {
        total: Math.floor(Math.random() * 851987),
        skills: {
          social: Math.floor(Math.random() * 2785),
        },
      },
      slayer: {
        total: Math.floor(Math.random() * -1),
        slayers: {
          slime: Math.floor(Math.random() * -19849),
        },
      },
    };
  },
};
