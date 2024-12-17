import { getCookie, setCookie } from "./common-defer";
import { SkinViewer, IdleAnimation } from "skinview3d";
import tippy from "tippy.js";

import { renderLore } from "../../../common/formatting.js";

import { getPlayerStats } from "./calculate-player-stats";
import { RARITY_COLORS } from "../../../common/constants.js";
import { owoifyMessage } from "../../../src/constants/themes/april-fools-2024/index.js";

import("./elements/inventory-view");
import("./elements/guild-button");

const favoriteElement = document.querySelector(".favorite") as HTMLButtonElement;

if ("share" in navigator) {
  // eslint-disable-next-line deprecation/deprecation
  const platform = navigator.platform ?? navigator.userAgentData?.platform ?? "unknown";
  const shareIcon = platform.match(/(Mac|iPhone|iPod|iPad)/i)
    ? /*mdiExportVariant*/ "M12,1L8,5H11V14H13V5H16M18,23H6C4.89,23 4,22.1 4,21V9A2,2 0 0,1 6,7H9V9H6V21H18V9H15V7H18A2,2 0 0,1 20,9V21A2,2 0 0,1 18,23Z"
    : /*mdiShareVariant*/ "M18,16.08C17.24,16.08 16.56,16.38 16.04,16.85L8.91,12.7C8.96,12.47 9,12.24 9,12C9,11.76 8.96,11.53 8.91,11.3L15.96,7.19C16.5,7.69 17.21,8 18,8A3,3 0 0,0 21,5A3,3 0 0,0 18,2A3,3 0 0,0 15,5C15,5.24 15.04,5.47 15.09,5.7L8.04,9.81C7.5,9.31 6.79,9 6,9A3,3 0 0,0 3,12A3,3 0 0,0 6,15C6.79,15 7.5,14.69 8.04,14.19L15.16,18.34C15.11,18.55 15.08,18.77 15.08,19C15.08,20.61 16.39,21.91 18,21.91C19.61,21.91 20.92,20.61 20.92,19A2.92,2.92 0 0,0 18,16.08Z";
  favoriteElement.insertAdjacentHTML(
    "afterend",
    /*html*/ `
      <button class="additional-player-stat svg-icon">
        <svg viewBox="0 0 24 24">
          <title>share</title>
          <path fill="white" d="${shareIcon}" />
        </svg>
      </button>
    `,
  );
  favoriteElement.nextElementSibling?.addEventListener("click", () => {
    navigator.share({
      text: `Check out ${calculated.display_name} on SkyCrypt`,
      url: location.href.split("#")[0],
    });
  });
}

tippy("*[data-tippy-content]:not(.interactive-tooltip)", {
  trigger: "mouseenter click",
});

const playerModel = document.getElementById("player_model") as HTMLElement;

let skinViewer: SkinViewer | undefined;

if (calculated.skin_data) {
  skinViewer = new SkinViewer({
    width: playerModel.offsetWidth,
    height: playerModel.offsetHeight,
    model: calculated.skin_data.model,
    skin: calculated.skin_data.skinurl,
    cape: calculated.skin_data.capeurl,
  });

  playerModel.appendChild(skinViewer.canvas);

  skinViewer.camera.position.set(-18, -3, 58);

  skinViewer.canvas.removeAttribute("tabindex");

  skinViewer.controls.enableZoom = true;
  skinViewer.controls.enablePan = true;
  skinViewer.controls.enableRotate = true;

  /**
   * the average Z rotation of the arms
   */
  const basicArmRotationZ = Math.PI * 0.02;

  /**
   * the average X rotation of the cape
   */
  const basicCapeRotationX = Math.PI * 0.06;

  if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    skinViewer.animation = new IdleAnimation();
  } else {
    skinViewer.playerObject.skin.leftArm.rotation.z = basicArmRotationZ;
    skinViewer.playerObject.skin.rightArm.rotation.z = basicArmRotationZ * -1;
    skinViewer.playerObject.cape.rotation.x = basicCapeRotationX;
  }
}

tippy(".interactive-tooltip", {
  trigger: "mouseenter click",
  interactive: true,
  appendTo: () => document.body,
  onTrigger(instance: unknown, event: Event) {
    if (event.type == "click") {
      dimmer.classList.add("show-dimmer");
    }
  },
  onHide() {
    dimmer.classList.remove("show-dimmer");
  },
});

export const ALL_ITEMS = new Map(
  [
    items.armor.armor,
    items.equipment.equipment,
    items.inventory,
    items.enderchest,
    items.accessory_bag,
    items.fishing_bag,
    items.quiver,
    items.potion_bag,
    items.personal_vault,
    items.wardrobe_inventory,
    items.candy_bag,
    items.storage,
    items.hotm,
    items.bingo_card,
    items.museum,
  ]
    .flat()
    .flatMap((item) => {
      if ("containsItems" in item) {
        return [item, ...item.containsItems, ...item.containsItems.map((i) => i.containsItems ?? [])].flat();
      } else {
        return item;
      }
    })
    .map((item) => [item.itemId, item]),
);

const dimmer = document.querySelector("#dimmer") as HTMLElement;

const url = new URL(location.href);

url.searchParams.delete("__cf_chl_jschl_tk__");
url.searchParams.delete("__cf_chl_captcha_tk__");

if (calculated.profile.cute_name == "Deleted") {
  url.pathname = `/stats/${calculated.display_name}/${calculated.profile.profile_id}`;
} else {
  url.pathname = `/stats/${calculated.display_name}/${calculated.profile.cute_name}`;
}

history.replaceState({}, document.title, url.href);

export function isEnchanted(item: Item): boolean {
  // heads
  if ([397].includes(item.id)) {
    return false;
  }

  // enchanted book, bottle o' enchanting, nether star
  if ([403, 384, 399].includes(item.id)) {
    return true;
  }

  //potions with actual effects (not water bottles)
  if (item.id === 373 && item.Damage !== 0) {
    return true;
  }

  if ("tag" in item && Array.isArray(item.tag.ench)) {
    return true;
  }

  if (item.glowing) {
    return true;
  }

  return false;
}

export function isSlotItem(item: ItemSlot): item is Item {
  return "id" in item;
}

function switchInventory(type: string, backpack?: Backpack) {
  backpack;
  const inventoryView = document.querySelector<HTMLElement>(".stat-inventory inventory-view");

  if (!inventoryView) {
    return;
  }

  inventoryView.setAttribute("inventory-type", type);

  if (type === "backpack" && backpack) {
    inventoryView.setAttribute("backpack-id", backpack.itemId);
  }

  setTimeout(() => {
    const rect = (document.querySelector("#inventory_container") as HTMLElement).getBoundingClientRect();

    if (rect.top > 100 && rect.bottom > window.innerHeight) {
      let top;
      if (rect.height > window.innerHeight - 100) {
        top = rect.top - 100;
      } else {
        top = rect.bottom - window.innerHeight;
      }
      window.scrollBy({ top, behavior: "smooth" });
      scrollMemory.isSmoothScrolling = true;
    }
  });
}

export function isItem(item: ItemSlot | DisplayItem): item is Item {
  return "Count" in item && "Damage" in item && "id" in item;
}

export function isBackpack(item: DisplayItem): item is Backpack {
  return "containsItems" in item;
}

export function showBackpack(item: Backpack): void {
  const activeInventory = document.querySelector(".inventory-tab.active-inventory");

  if (activeInventory) {
    activeInventory.classList.remove("active-inventory");
  }

  switchInventory("backpack", item);

  closeLore();
}

function fillLore(element: HTMLElement) {
  let item: DisplayItem | Item | Pet | undefined = undefined;

  if (element.hasAttribute("data-item-id")) {
    const itemId = element.getAttribute("data-item-id") as string;
    item = ALL_ITEMS.get(itemId) as Item;
  } else if (element.hasAttribute("data-pet-index")) {
    item = calculated.pets.pets[parseInt(element.getAttribute("data-pet-index") as string)];
  } else if (element.hasAttribute("data-missing-pet-index")) {
    item = calculated.pets.missing[parseInt(element.getAttribute("data-missing-pet-index") as string)];
  } else if (element.hasAttribute("data-missing-accessory-index")) {
    item = calculated.accessories.missing[parseInt(element.getAttribute("data-missing-accessory-index") as string)];
  } else if (element.hasAttribute("data-upgrade-accessory-index")) {
    item = calculated.accessories.upgrades[parseInt(element.getAttribute("data-upgrade-accessory-index") as string)];
  }

  if (item == undefined) {
    return;
  }

  const owofiyLore = localStorage.getItem("currentThemeUrl") === "/resources/themes/april-fools-2024.json";

  const itemNameString = ((item as Item).tag?.display?.Name ?? item.display_name ?? "???") as string;
  const colorCode = itemNameString.match(/^§([0-9a-fklmnor])/i);

  itemName.className = `item-name piece-${item.rarity || "common"}-bg nice-colors-dark`;
  if (item.color !== undefined) {
    itemName.style.backgroundColor = `#${item.color}`;
  } else if (colorCode && colorCode[1]) {
    itemName.style.backgroundColor = `var(--§${colorCode[1]})`;
  } else {
    itemName.style.backgroundColor = `var(--§${(RARITY_COLORS as RarityColors)[item.rarity || "common"]})`;
  }

  const itemNameHtml = renderLore(itemNameString);
  const isMulticolor = (itemNameHtml.match(/<\/span>/g) || []).length > 1;

  itemNameContent.innerHTML = isMulticolor ? itemNameHtml : itemNameString.replace(/§([0-9a-fklmnor])/gi, "") ?? "???";

  statsContent.style.setProperty("--scrollbar-color", itemName.style.backgroundColor);

  itemNameContent.dataset.multicolor = String(isMulticolor);

  if (element.hasAttribute("data-pet-index")) {
    itemNameContent.dataset.multicolor = "false";
    itemNameContent.innerHTML = `[Lvl ${(item as Pet).level.level}] ${item.display_name}`;
  }

  if (owofiyLore === true) {
    itemNameContent.innerHTML = owoifyMessage(itemNameContent.innerHTML);
  }

  if (item.texture_path) {
    itemIcon.style.backgroundImage = 'url("' + item.texture_path + '")';
    itemIcon.className = "stats-piece-icon item-icon custom-icon";
  } else if ("id" in item) {
    itemIcon.removeAttribute("style");
    itemIcon.classList.remove("custom-icon");
    const idClass = `icon-${item.id}_${item.Damage}` + " " + (item.Damage != 0 ? `icon-${item.id}_0` : "");
    itemIcon.className = ("stats-piece-icon item-icon " + idClass).trim();
  } else {
    throw new Error("item mush have either an id and a damage or a texture_path");
  }

  if ("id" in item && isEnchanted(item)) {
    itemIcon.classList.add("is-enchanted");
  }

  if ("lore" in item) {
    itemLore.innerHTML = item.lore;
  } else if ("tag" in item && Array.isArray(item.tag.display?.Lore)) {
    itemLore.innerHTML = item.tag.display.Lore.map((line: string) => {
      const newLine = owofiyLore ? owoifyMessage(line) : line;

      return '<span class="lore-row">' + renderLore(newLine) + "</span>";
    }).join("");
  } else {
    itemLore.innerHTML = "";
  }

  if ("texture_pack" in item && item.texture_pack != undefined) {
    const packContent = document.createElement("a");
    packContent.setAttribute("href", item.texture_pack.url);
    packContent.setAttribute("target", "_blank");
    packContent.setAttribute("rel", "noreferrer");
    packContent.classList.add("pack-credit");

    const packIcon = document.createElement("img");
    packIcon.setAttribute("src", item.texture_pack.base_path.replace("public/", "") + "/pack.png");
    packIcon.classList.add("icon");

    const packName = document.createElement("div");
    packName.classList.add("name");
    packName.innerHTML = item.texture_pack.name;

    const packAuthor = document.createElement("div");
    packAuthor.classList.add("author");
    packAuthor.innerHTML = `by <span>${item.texture_pack.author}</span>`;

    packContent.appendChild(packIcon);
    packContent.appendChild(packName);
    packContent.appendChild(packAuthor);

    itemLore.appendChild(packContent);
  }

  if (isBackpack(item)) {
    backpackContents.classList.add("contains-backpack");

    backpackContents.setAttribute("backpack-id", item.itemId);
    backpackContents.setAttribute("inventory-type", "backpack");
  } else {
    backpackContents.classList.remove("contains-backpack");
  }
}

function showLore(element: HTMLElement, shouldResize = true) {
  statsContent.classList.add("sticky-stats");
  element.classList.add("sticky-stats");
  dimmer.classList.add("show-dimmer");

  if (shouldResize) {
    resize();
  }
}

function closeLore() {
  const shownLore = document.querySelector<HTMLElement>("#stats_content.show-stats, #stats_content.sticky-stats");

  if (shownLore != null) {
    dimmer.classList.remove("show-dimmer");

    const stickyStatsPiece = document.querySelector<HTMLElement>(".rich-item.sticky-stats");

    if (stickyStatsPiece != null) {
      stickyStatsPiece.blur();
      stickyStatsPiece.classList.remove("sticky-stats");
    }

    statsContent.classList.remove("sticky-stats", "show-stats");
  }
}

let playerModelIsMobile = false;

const navBar = document.querySelector("#nav_bar") as HTMLElement;
const navBarLinks = navBar.querySelectorAll<HTMLAnchorElement>(".nav-item");
let navBarHeight: number;

function resize() {
  if (window.innerWidth <= 1590 && !playerModelIsMobile) {
    playerModelIsMobile = true;
    document.getElementById("skin_display_mobile")?.appendChild(playerModel);
  } else if (window.innerWidth > 1590 && playerModelIsMobile) {
    playerModelIsMobile = false;
    document.getElementById("skin_display")?.appendChild(playerModel);
  }

  tippy("*[data-tippy-content]");

  if (playerModel && skinViewer) {
    if (playerModel.offsetWidth / playerModel.offsetHeight < 0.6) {
      skinViewer.setSize(playerModel.offsetWidth, playerModel.offsetWidth * 2);
    } else {
      skinViewer.setSize(playerModel.offsetHeight / 2, playerModel.offsetHeight);
    }
  }

  navBarHeight = parseFloat(getComputedStyle(navBar).top);

  const element = document.querySelector<HTMLElement>(".rich-item.sticky-stats");

  if (element == null) {
    return;
  }

  const maxTop = window.innerHeight - statsContent.offsetHeight - 20;
  const rect = element.getBoundingClientRect();

  if (rect.x) {
    statsContent.style.left = rect.x - statsContent.offsetWidth - 10 + "px";
  }

  if (rect.y) {
    statsContent.style.top =
      Math.max(70, Math.min(maxTop, rect.y + element.offsetHeight / 2 - statsContent.offsetHeight / 2)) + "px";
  }
}

document.querySelectorAll(".extender").forEach((element) => {
  element.addEventListener("click", () =>
    element.setAttribute("aria-expanded", (element.getAttribute("aria-expanded") != "true").toString()),
  );
});

for (const element of document.querySelectorAll(".inventory-tab")) {
  const type = element.getAttribute("data-inventory-type") as string;

  element.addEventListener("click", () => {
    if (element.classList.contains("active-inventory")) {
      return;
    }

    const activeInventory = document.querySelector<HTMLElement>(".inventory-tab.active-inventory");

    if (activeInventory) {
      activeInventory.classList.remove("active-inventory");
    }

    element.classList.add("active-inventory");

    switchInventory(type);
  });
}

const statsContent = document.querySelector("#stats_content") as HTMLElement;
const itemName = statsContent.querySelector(".item-name") as HTMLElement;
const itemIcon = itemName.querySelector(".stats-piece-icon") as HTMLDivElement;
const itemNameContent = itemName.querySelector(".item-name__name") as HTMLSpanElement;
const itemLore = statsContent.querySelector(".item-lore") as HTMLElement;
const backpackContents = statsContent.querySelector(".backpack-contents") as HTMLElement;

export function mouseenterLoreListener(event: MouseEvent): void {
  const element = event.target as HTMLElement;

  fillLore(element);

  statsContent.classList.add("show-stats");
}

export function mouseleaveLoreListener(): void {
  statsContent.classList.remove("show-stats");
}

export function mousemoveLoreListener(event: MouseEvent): void {
  const element = event.target as HTMLElement;
  if (statsContent.classList.contains("sticky-stats")) {
    return;
  }

  const maxTop = window.innerHeight - statsContent.offsetHeight - 20;
  const rect = element.getBoundingClientRect();

  let left = rect.x - statsContent.offsetWidth - 10;

  if (left < 10) {
    left = rect.x + 90;
  }

  if (rect.x) {
    statsContent.style.left = left + "px";
  }

  const top = Math.max(70, Math.min(maxTop, event.clientY - statsContent.offsetHeight / 2));

  statsContent.style.top = top + "px";
}

export function clickLoreListener(event: MouseEvent): void {
  const element = event.target as HTMLElement;

  if (statsContent.classList.contains("sticky-stats")) {
    closeLore();
  } else {
    showLore(element, false);
  }
}

for (const element of document.querySelectorAll<HTMLElement>(".rich-item")) {
  element.addEventListener("mouseenter", mouseenterLoreListener);

  element.addEventListener("mouseleave", mouseleaveLoreListener);

  element.addEventListener("mousemove", mousemoveLoreListener);

  element.addEventListener("click", clickLoreListener);
}

const enableApiPlayer = document.querySelector("#enable_api") as HTMLVideoElement;

for (const element of document.querySelectorAll(".enable-api")) {
  element.addEventListener("click", (event) => {
    event.preventDefault();
    dimmer.classList.add("show-dimmer");
    enableApiPlayer.classList.add("show");

    enableApiPlayer.currentTime = 0;
    enableApiPlayer.play();
  });
}

enableApiPlayer.addEventListener("click", (event) => {
  event.stopPropagation();
  if (enableApiPlayer.paused) {
    enableApiPlayer.play();
  } else {
    enableApiPlayer.pause();
  }
});

dimmer.addEventListener("click", () => {
  dimmer.classList.remove("show-dimmer");
  enableApiPlayer.classList.remove("show");

  closeLore();
});

for (const element of document.querySelectorAll<HTMLElement>(".close-lore")) {
  element.addEventListener("click", closeLore);
}

for (const element of document.querySelectorAll<HTMLElement>(".copy-text")) {
  const copyNotification = tippy(element, {
    content: "Copied to clipboard!",
    trigger: "manual",
  });

  element.addEventListener("click", () => {
    const text = element.getAttribute("data-copy-text");
    if (text != null) {
      navigator.clipboard.writeText(text).then(() => {
        copyNotification.show();

        setTimeout(() => {
          copyNotification.hide();
        }, 1500);
      });
    }
  });
}

function parseFavorites(cookie: string) {
  return cookie?.split(",").filter((uuid) => /^[0-9a-f]{32}$/.test(uuid)) || [];
}

function checkFavorite() {
  const favorited = parseFavorites(getCookie("favorite") ?? "").includes(
    favoriteElement.getAttribute("data-username") as string,
  );
  favoriteElement.setAttribute("aria-checked", favorited.toString());
  return favorited;
}
checkFavorite();

const favoriteNotification = tippy(favoriteElement, {
  trigger: "manual",
});

favoriteElement.addEventListener("click", () => {
  const uuid = favoriteElement.getAttribute("data-username") as string;
  if (uuid == "0c0b857f415943248f772164bf76795c") {
    favoriteNotification.setContent("No");
  } else {
    const cookieArray = parseFavorites(getCookie("favorite") ?? "");
    if (cookieArray.includes(uuid)) {
      cookieArray.splice(cookieArray.indexOf(uuid), 1);

      favoriteNotification.setContent("Removed favorite!");
    } else if (cookieArray.length >= constants.MAX_FAVORITES) {
      favoriteNotification.setContent(`You can only have ${constants.MAX_FAVORITES} favorites!`);
    } else {
      cookieArray.push(uuid);

      favoriteNotification.setContent("Added favorite!");
    }
    setCookie("favorite", cookieArray.join(","), 365);
    checkFavorite();
  }
  favoriteNotification.show();

  setTimeout(() => {
    favoriteNotification.hide();
  }, 1500);
});

let socialsShown = false;
const revealSocials = document.querySelector("#reveal_socials") as HTMLElement;
const additionalSocials = document.querySelector("#additional_socials") as HTMLElement;

if (revealSocials) {
  revealSocials.addEventListener("click", () => {
    if (socialsShown) {
      socialsShown = false;
      additionalSocials.classList.remove("socials-shown");
      revealSocials.classList.remove("socials-shown");
    } else {
      socialsShown = true;
      additionalSocials.classList.add("socials-shown");
      revealSocials.classList.add("socials-shown");
    }
  });
}

class ScrollMemory {
  _isSmoothScrolling = false;
  _scrollTimeout = -1;
  _loaded = false;

  constructor() {
    window.addEventListener(
      "load",
      () => {
        this._loaded = true;
        this.isSmoothScrolling = true;
      },
      { once: true },
    );

    window.addEventListener("hashchange", () => {
      this.isSmoothScrolling = true;
    });

    document.addEventListener("focusin", () => {
      this.isSmoothScrolling = true;
    });
  }

  /** whether the document currently has a smooth scroll taking place */
  get isSmoothScrolling() {
    return this._isSmoothScrolling || !this._loaded;
  }

  set isSmoothScrolling(value) {
    if (this._isSmoothScrolling !== value) {
      this._isSmoothScrolling = value;
      if (value) {
        window.addEventListener("scroll", this._onScroll, { passive: true });
        this._onScroll();
      } else {
        window.removeEventListener("scroll", this._onScroll);
        scrollToTab();
      }
    }
  }

  _onScroll = () => {
    clearTimeout(this._scrollTimeout);
    this._scrollTimeout = window.setTimeout(() => {
      this.isSmoothScrolling = false;
    }, 500);
  };
}

const scrollMemory = new ScrollMemory();

const intersectingElements = new Map();

const sectionObserver = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      intersectingElements.set(entry.target, entry.isIntersecting);
    }
    for (const [element, isIntersecting] of intersectingElements) {
      if (isIntersecting) {
        let newHash;
        if (element !== playerProfileElement) {
          newHash = "#" + element.parentElement.querySelector("a[id]").id;
          history.replaceState({}, document.title, newHash);
        } else {
          history.replaceState({}, document.title, location.href.split("#")[0]);
        }
        for (const link of navBarLinks) {
          if (link.hash === newHash) {
            link.setAttribute("aria-current", "true");

            if (!scrollMemory.isSmoothScrolling) {
              scrollToTab(true, link);
            }
          } else {
            link.removeAttribute("aria-current");
          }
        }
        break;
      }
    }
  },
  { rootMargin: "-100px 0px -25% 0px" },
);

function scrollToTab(smooth = true, element?: HTMLElement) {
  const link = element ?? document.querySelector<HTMLAnchorElement>(`[href="${location.hash}"]`);

  if (link == null) {
    console.warn(`could not scroll to ${location.hash} tab because it does not exist`);
    return;
  }

  const behavior = smooth ? "smooth" : "auto";
  const left =
    link.offsetLeft +
    link.getBoundingClientRect().width / 2 -
    (link.parentElement as HTMLElement).getBoundingClientRect().width / 2;
  (link.parentElement as HTMLElement).scrollTo({ left, behavior });
}

scrollToTab(false);

const playerProfileElement = document.querySelector("#player_profile") as HTMLElement;

sectionObserver.observe(playerProfileElement);

document.querySelectorAll(".stat-header").forEach((element) => {
  sectionObserver.observe(element);
});

const statsContainer = document.querySelector<HTMLElement>("#base_stats_container");
const showStats = document.querySelector<HTMLElement>("#show_stats");

if (showStats != null) {
  showStats.addEventListener("click", () => {
    if ((statsContainer as HTMLElement).classList.contains("show-stats")) {
      (statsContainer as HTMLElement).classList.remove("show-stats");
      (showStats as HTMLElement).innerHTML = "Show Stats";
    } else {
      (statsContainer as HTMLElement).classList.add("show-stats");
      (showStats as HTMLElement).innerHTML = "Hide Stats";
    }
  });
}

for (const element of document.querySelectorAll(".kills-deaths-container .show-all.enabled")) {
  const parent = element.parentElement as HTMLElement;
  const type = element.getAttribute("data-type") as "kills" | "deaths";
  const kills = type === "kills" ? calculated.kills.kills : calculated.deaths.deaths;

  element.addEventListener("click", () => {
    parent.style.maxHeight = parent.offsetHeight + "px";
    parent.classList.add("all-shown");
    element.remove();

    kills.slice(10).forEach((kill, index) => {
      const killElement = document.createElement("div");
      const killRank = document.createElement("div");
      const killEntity = document.createElement("div");
      const killAmount = document.createElement("div");
      const statSeparator = document.createElement("div");

      killElement.className = "kill-stat";
      killRank.className = "kill-rank";
      killEntity.className = "kill-entity";
      killAmount.className = "kill-amount";
      statSeparator.className = "stat-separator";

      killRank.innerHTML = "#" + (index + 11) + "&nbsp;";
      killEntity.innerHTML = kill.entity_name;
      killAmount.innerHTML = kill.amount.toLocaleString();
      statSeparator.innerHTML = ":&nbsp;";

      killElement.appendChild(killRank);
      killElement.appendChild(killEntity);
      killElement.appendChild(statSeparator);
      killElement.appendChild(killAmount);

      parent.appendChild(killElement);
    });
  });
}

window.addEventListener("keydown", (event) => {
  const selectedPiece = document.querySelector<HTMLElement>(".rich-item:focus");

  if (selectedPiece !== null && event.key === "Enter") {
    fillLore(selectedPiece);
    showLore(selectedPiece);
  }

  if (event.key === "Escape") {
    dimmer.classList.remove("show-dimmer");
    enableApiPlayer.classList.remove("show");
    if (document.querySelector("#stats_content.sticky-stats") != null) {
      closeLore();
    }
  }

  if (document.querySelector(".rich-item.sticky-stats") != null && event.key === "Tab") {
    event.preventDefault();
  }
});

resize();

window.addEventListener("resize", resize);

function onScroll() {
  if (navBar.getBoundingClientRect().top <= navBarHeight) {
    navBar.classList.add("stuck");
  } else {
    navBar.classList.remove("stuck");
  }
}
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

setTimeout(resize, 1000);

/**
 * @param {number} number the number to be formatted
 * @param {boolean} floor rounds down if true, up if false
 * @param {number} rounding power of ten of the number of digits you want after the decimal point
 *
 * @example formatNumber(123456798, true, 10) = "123.4M"
 * @example formatNumber(123456798, true, 100) = "123.45M"
 */
export function formatNumber(number: number, floor: boolean, rounding = 10): string {
  if (number < 1000) {
    return "" + Math.floor(number);
  } else if (number < 10000) {
    if (floor) {
      return (Math.floor((number / 1000) * rounding) / rounding).toFixed(rounding.toString().length - 1) + "K";
    } else {
      return (Math.ceil((number / 1000) * rounding) / rounding).toFixed(rounding.toString().length - 1) + "K";
    }
  } else if (number < 1000000) {
    if (floor) {
      return Math.floor(number / 1000) + "K";
    } else {
      return Math.ceil(number / 1000) + "K";
    }
  } else if (number < 1000000000) {
    if (floor) {
      return (Math.floor((number / 1000 / 1000) * rounding) / rounding).toFixed(rounding.toString().length - 1) + "M";
    } else {
      return (Math.ceil((number / 1000 / 1000) * rounding) / rounding).toFixed(rounding.toString().length - 1) + "M";
    }
  } else if (floor) {
    return (
      (Math.floor((number / 1000 / 1000 / 1000) * rounding * 10) / (rounding * 10)).toFixed(
        rounding.toString().length,
      ) + "B"
    );
  } else {
    return (
      (Math.ceil((number / 1000 / 1000 / 1000) * rounding * 10) / (rounding * 10)).toFixed(rounding.toString().length) +
      "B"
    );
  }
}

// Player stats
{
  const stats = getPlayerStats();

  // Print the player stats
  const parent = document.querySelector("#base_stats_container");

  for (const stat in stats) {
    // Wrapping the player-stat node inside a div is required to fix Chromium v102 css columns bug
    const nodeWrapper = document.createElement("div");
    const node = document.createElement("player-stat");

    node.setAttribute("stat", stat);
    node.setAttribute(
      "value",
      Object.values(stats[stat])
        .reduce((a, b) => a + b, 0)
        .toString(),
    );

    node.data = stats[stat];

    // Special additions for some stats
    const totalHealth = Object.values(stats.health).reduce((a, b) => a + b, 0);
    const totalDefense = Object.values(stats.defense).reduce((a, b) => a + b, 0);
    const totalTrueDefense = Object.values(stats.true_defense).reduce((a, b) => a + b, 0);

    switch (stat) {
      case "defense":
        node.special = {
          "Damage Reduction": `${Math.round((totalDefense / (totalDefense + 100)) * 100)}%`,
          "Effective Health": `${Math.round(totalHealth * (1 + totalDefense / 100)).toLocaleString()}`,
        };
        break;

      case "true_defense":
        node.special = {
          "True Damage Reduction": `${Math.round((totalTrueDefense / (totalTrueDefense + 100)) * 100)}%`,
        };
        break;
    }

    nodeWrapper.appendChild(node);
    parent?.appendChild(nodeWrapper);
  }

  // Print bonus stats
  document.querySelectorAll("[data-bonus-stats]").forEach((element) => {
    const targetraw = (element as HTMLElement).dataset.bonusStats;

    if (!targetraw) {
      return;
    }

    const targets = targetraw.split(",");
    const bonusStats: { [key: string]: number } = {};

    for (const stat in stats) {
      for (const target of targets) {
        if (Object.keys(stats[stat]).includes(target)) {
          bonusStats[stat] ??= 0;
          bonusStats[stat] += stats[stat][target];
        }
      }
    }

    if (Object.keys(bonusStats).length === 0) {
      return;
    }

    const node = document.createElement("bonus-stats");
    node.data = bonusStats;

    element.appendChild(node);
  });
}

const currentTheme = localStorage.getItem("currentThemeUrl");
if (currentTheme === "/resources/themes/april-fools-2024.json") {
  document.querySelectorAll("*").forEach((element) => {
    // return lore text color to default color (so it's not pink)
    if (element.classList.contains("item-lore")) {
      element.classList.add("nice-colors-light");
      return;
    }

    element.classList.add("april-fools-2024");

    const owoifyElements = [
      "stat-name",
      "stat-value",
      "stat-sub-header",
      "narrow-info-name",
      "stat-header",
      "inventory-tab-name",
      "category-name",
      "nav-item",
      "text-stats-for",
      "pet-name",
      "pet-level",
      "skill-name",
      "kill-entity",
      "tier-name",
      "skill-name",
      "rank-name",
      "player-name",
      "profile-name",
    ];
    if (owoifyElements.some((owoifyElement) => element.classList.contains(owoifyElement))) {
      element.innerHTML = owoifyMessage(element.innerHTML);
    }
  });
}
