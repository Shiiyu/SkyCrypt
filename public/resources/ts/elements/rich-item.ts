import { html, LitElement, TemplateResult } from "lit";
import { customElement, property } from "lit/decorators.js";
import { classMap } from "lit/directives/class-map.js";
import { ifDefined } from "lit/directives/if-defined.js";
import {
  allItems,
  clickLoreListener,
  isEnchanted,
  isItem,
  mouseenterLoreListener,
  mouseleaveLoreListener,
  mousemoveLoreListener,
  showBackpack,
} from "../stats-defer";

@customElement("rich-item")
export class InventoryView extends LitElement {
  @property({ attribute: "data-item-id" })
  itemId: string | undefined = undefined;

  get item(): Item | Backpack {
    if (this.itemId == undefined) {
      throw new Error("item id is required");
    }
    const item = allItems.get(this.itemId);
    if (!item || !isItem(item)) {
      throw new Error("item id must be the id of an item");
    }
    return item;
  }

  constructor() {
    super();
    this.addEventListener("mouseenter", this.handleMouseEnter);
    this.addEventListener("mouseleave", mouseleaveLoreListener);
    this.addEventListener("mousemove", mousemoveLoreListener);
    this.addEventListener("contextmenu", this.handleContextMenu);
    this.addEventListener("click", clickLoreListener);
    this.addEventListener("click", this.handleClick);
  }

  render(): TemplateResult {
    const classes: { [name: string]: boolean } = {
      "piece-icon": true,
      "item-icon": true,
      "is-enchanted": isEnchanted(this.item),
    };
    let style: string | undefined = undefined;
    if (this.item.texture_path) {
      classes["custom-icon"] = true;
      style = `background-image: url("${this.item.texture_path}")`;
    } else {
      classes[`icon-${this.item.id}_0`] = this.item.Damage != 0;
      classes[`icon-${this.item.id}_${this.item.Damage}`] = true;
    }
    return html`
      <div style="${ifDefined(style)}" class="${classMap(classes)}"></div>
      ${this.item.Count != 1 ? html`<div class="item-count">${this.item.Count}</div>` : undefined}
    `;
  }

  private handleMouseEnter(event: MouseEvent) {
    mouseenterLoreListener(event);
  }

  private handleContextMenu(event: MouseEvent) {
    if ("containsItems" in this.item) {
      event.preventDefault();

      showBackpack(this.item);
    }
  }

  private handleClick(event: MouseEvent) {
    if (event.ctrlKey && "containsItems" in this.item) {
      event.preventDefault();

      showBackpack(this.item);
    }
  }

  // disable shadow root
  createRenderRoot(): Element | ShadowRoot {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "rich-item": InventoryView;
  }
}
