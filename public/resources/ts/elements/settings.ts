import { html, LitElement, TemplateResult } from "lit";
import { customElement } from "lit/decorators.js";
import { ThemeList } from "../elements/theme-list";

@customElement("settings-list")
export class SettingList extends LitElement {
  constructor() {
    super();
  }

  protected render(): TemplateResult {
    return html`
      <label class="list-item default-item" @change="${() => this.openModule("theme-list")}">
        <svg viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M19,11.5C19,11.5 17,13.67 17,15A2,2 0 0,0 19,17A2,2 0 0,0 21,15C21,13.67 19,11.5 19,11.5M5.21,10L10,5.21L14.79,10M16.56,8.94L7.62,0L6.21,1.41L8.59,3.79L3.44,8.94C2.85,9.5 2.85,10.47 3.44,11.06L8.94,16.56C9.23,16.85 9.62,17 10,17C10.38,17 10.77,16.85 11.06,16.56L16.56,11.06C17.15,10.47 17.15,9.5 16.56,8.94Z"
          />
        </svg>

        <a class="name" target="_blank" rel="noreferrer"> Themes </a>
        <br />
        <div class="description">
          <span>Customize look of the website</span>
        </div>

        <input type="checkbox" name="pack" value="themes" />
      </label>

      <br />

      <label class="list-item default-item" @change="${() => this.openModule("pack-list")}">
        <svg viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M2,10.96C1.5,10.68 1.35,10.07 1.63,9.59L3.13,7C3.24,6.8 3.41,6.66 3.6,6.58L11.43,2.18C11.59,2.06 11.79,2 12,2C12.21,2 12.41,2.06 12.57,2.18L20.47,6.62C20.66,6.72 20.82,6.88 20.91,7.08L22.36,9.6C22.64,10.08 22.47,10.69 22,10.96L21,11.54V16.5C21,16.88 20.79,17.21 20.47,17.38L12.57,21.82C12.41,21.94 12.21,22 12,22C11.79,22 11.59,21.94 11.43,21.82L3.53,17.38C3.21,17.21 3,16.88 3,16.5V10.96C2.7,11.13 2.32,11.14 2,10.96M12,4.15V4.15L12,10.85V10.85L17.96,7.5L12,4.15M5,15.91L11,19.29V12.58L5,9.21V15.91M19,15.91V12.69L14,15.59C13.67,15.77 13.3,15.76 13,15.6V19.29L19,15.91M13.85,13.36L20.13,9.73L19.55,8.72L13.27,12.35L13.85,13.36Z"
          />
        </svg>

        <a class="name" target="_blank" rel="noreferrer"> Packs </a>
        <br />
        <div class="description">
          <span>Change the resource pack</span>
        </div>
        <input type="checkbox" name="pack" value="packs" />
      </label>
    `;
  }

  private async openModule(moduleName: string) {
    const moduleInstance = (await this.getModule(moduleName)) as ThemeList;
    const settingsBox = document.querySelector("#settings-box");
    if (settingsBox) {
      settingsBox.innerHTML = "";
      settingsBox.appendChild(moduleInstance);
    }

    document.addEventListener("click", this.closeSettings);
  }

  private async getModule(moduleName: string) {
    switch (moduleName) {
      case "theme-list": {
        const module = await import(`../elements/theme-list`);
        return new module.ThemeList();
      }

      case "pack-list": {
        const module = await import(`../elements/pack-list`);
        return new module.PackList();
      }

      default:
        throw new Error("Module not found");
    }
  }

  private closeSettings = (event: MouseEvent) => {
    const settingsBox = document.querySelector("#settings-box");
    if (settingsBox && !settingsBox?.contains(event.target as Node)) {
      settingsBox.innerHTML = "";
      settingsBox.appendChild(new SettingList());
      document.removeEventListener("click", this.closeSettings);
    }
  };

  // disable shadow root
  protected createRenderRoot(): Element | ShadowRoot {
    return this;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "settings-list": SettingList;
  }
}
