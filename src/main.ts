import {
  App,
  Plugin,
  PluginSettingTab,
  Setting,
  MarkdownView,
  TFile,
} from "obsidian";

interface DynamicFontSizeSettings {
  minFontSize: number;
  maxFontSize: number;
  defaultFontSize: number;
}

const DEFAULT_SETTINGS: DynamicFontSizeSettings = {
  minFontSize: 0.5,
  maxFontSize: 3.0,
  defaultFontSize: 1.0,
};

export default class DynamicFontSizePlugin extends Plugin {
  settings: DynamicFontSizeSettings;
  private currentFile: TFile | null = null;
  private statusBarItem: HTMLElement;
  private sliderContainer: HTMLElement | null = null;

  async onload() {
    await this.loadSettings();

    // Add status bar item
    this.statusBarItem = this.addStatusBarItem();
    this.statusBarItem.addClass("dynamic-font-size-status");
    this.statusBarItem.hide();

    // Register events
    this.registerEvent(
      this.app.workspace.on("active-leaf-change", () => {
        this.updateFontSize();
      })
    );

    this.registerEvent(
      this.app.metadataCache.on("changed", (file) => {
        if (file === this.currentFile) {
          this.updateFontSize();
        }
      })
    );

    // Initial update
    this.updateFontSize();

    // Add command to toggle font size slider
    this.addCommand({
      id: "toggle-font-size-slider",
      name: "Toggle font size slider",
      callback: () => {
        this.toggleSlider();
      },
    });

    // Add settings tab
    this.addSettingTab(new DynamicFontSizeSettingTab(this.app, this));
  }

  onunload() {
    // Remove all applied styles
    this.removeAllFontSizeStyles();
    if (this.sliderContainer) {
      this.sliderContainer.remove();
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private updateFontSize() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (!activeView) {
      this.removeAllFontSizeStyles();
      this.statusBarItem.hide();
      if (this.sliderContainer) {
        this.sliderContainer.hide();
      }
      return;
    }

    this.currentFile = activeView.file;

    if (!this.currentFile) {
      this.removeAllFontSizeStyles();
      this.statusBarItem.hide();
      if (this.sliderContainer) {
        this.sliderContainer.hide();
      }
      return;
    }

    // Get frontmatter
    const cache = this.app.metadataCache.getFileCache(this.currentFile);
    const frontmatter = cache?.frontmatter;

    let fontSize: number | undefined;

    if (frontmatter && "font-size" in frontmatter) {
      const fontSizeValue = frontmatter["font-size"];

      // Parse the value (could be "1.5rem" or just "1.5")
      if (typeof fontSizeValue === "string") {
        fontSize = parseFloat(fontSizeValue.replace("rem", "").trim());
      } else if (typeof fontSizeValue === "number") {
        fontSize = fontSizeValue;
      }
    }

    if (fontSize !== undefined && !isNaN(fontSize)) {
      // Clamp the value between min and max
      fontSize = Math.max(
        this.settings.minFontSize,
        Math.min(this.settings.maxFontSize, fontSize)
      );
      this.applyFontSize(activeView, fontSize);
      this.statusBarItem.setText(`Font: ${fontSize.toFixed(2)}rem`);
      this.statusBarItem.show();

      if (this.sliderContainer) {
        const slider = this.sliderContainer.querySelector(
          'input[type="range"]'
        ) as HTMLInputElement;
        if (slider) {
          slider.value = fontSize.toString();
        }
        this.sliderContainer.show();
      }
    } else {
      this.removeFontSizeStyle(activeView);
      this.statusBarItem.hide();
      if (this.sliderContainer) {
        this.sliderContainer.hide();
      }
    }
  }

  private applyFontSize(view: MarkdownView, fontSize: number) {
    const contentEl = view.contentEl;

    // Target the reading view
    const readingView = contentEl.querySelector(".markdown-preview-view");
    if (readingView) {
      (readingView as HTMLElement).style.setProperty(
        "font-size",
        `${fontSize}rem`,
        "important"
      );
      (readingView as HTMLElement).addClass("dynamic-font-size-active");
    }

    // Target the editing view (CodeMirror)
    const editingView = contentEl.querySelector(".cm-content");
    if (editingView) {
      (editingView as HTMLElement).style.setProperty(
        "font-size",
        `${fontSize}rem`,
        "important"
      );
      (editingView as HTMLElement).addClass("dynamic-font-size-active");
    }

    // Also target the source view container
    const sourceView = contentEl.querySelector(".markdown-source-view");
    if (sourceView) {
      (sourceView as HTMLElement).style.setProperty(
        "font-size",
        `${fontSize}rem`,
        "important"
      );
      (sourceView as HTMLElement).addClass("dynamic-font-size-active");
    }
  }

  private removeFontSizeStyle(view: MarkdownView) {
    const contentEl = view.contentEl;

    // Remove from reading view
    const readingView = contentEl.querySelector(".markdown-preview-view");
    if (readingView) {
      (readingView as HTMLElement).style.removeProperty("font-size");
      (readingView as HTMLElement).removeClass("dynamic-font-size-active");
    }

    // Remove from editing view
    const editingView = contentEl.querySelector(".cm-content");
    if (editingView) {
      (editingView as HTMLElement).style.removeProperty("font-size");
      (editingView as HTMLElement).removeClass("dynamic-font-size-active");
    }

    // Remove from source view
    const sourceView = contentEl.querySelector(".markdown-source-view");
    if (sourceView) {
      (sourceView as HTMLElement).style.removeProperty("font-size");
      (sourceView as HTMLElement).removeClass("dynamic-font-size-active");
    }
  }

  private removeAllFontSizeStyles() {
    this.app.workspace.iterateAllLeaves((leaf) => {
      if (leaf.view instanceof MarkdownView) {
        this.removeFontSizeStyle(leaf.view);
      }
    });
  }

  private toggleSlider() {
    const activeView = this.app.workspace.getActiveViewOfType(MarkdownView);

    if (!activeView || !activeView.file) {
      return;
    }

    if (this.sliderContainer) {
      this.sliderContainer.remove();
      this.sliderContainer = null;
      return;
    }

    // Create slider container
    this.sliderContainer = document.createElement("div");
    this.sliderContainer.addClass("dynamic-font-size-slider-container");

    // Get current font size from frontmatter
    const cache = this.app.metadataCache.getFileCache(activeView.file);
    const frontmatter = cache?.frontmatter;
    let currentFontSize = this.settings.defaultFontSize;

    if (frontmatter && "font-size" in frontmatter) {
      const fontSizeValue = frontmatter["font-size"];
      if (typeof fontSizeValue === "string") {
        currentFontSize =
          parseFloat(fontSizeValue.replace("rem", "").trim()) ||
          this.settings.defaultFontSize;
      } else if (typeof fontSizeValue === "number") {
        currentFontSize = fontSizeValue;
      }
    }

    // Create slider with label
    const label = document.createElement("label");
    label.textContent = "Font size: ";
    label.addClass("dynamic-font-size-label");

    const valueDisplay = document.createElement("span");
    valueDisplay.textContent = `${currentFontSize.toFixed(2)}rem`;
    valueDisplay.addClass("dynamic-font-size-value");

    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = this.settings.minFontSize.toString();
    slider.max = this.settings.maxFontSize.toString();
    slider.step = "0.05";
    slider.value = currentFontSize.toString();
    slider.addClass("dynamic-font-size-slider");

    // Update on slider change
    slider.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      const newSize = parseFloat(target.value);
      valueDisplay.textContent = `${newSize.toFixed(2)}rem`;

      // Update frontmatter
      this.updateFrontmatterFontSize(activeView.file!, newSize).catch(
        (error) => {
          console.error("Failed to update frontmatter:", error);
        }
      );
    });

    this.sliderContainer.appendChild(label);
    this.sliderContainer.appendChild(slider);
    this.sliderContainer.appendChild(valueDisplay);

    // Append to workspace
    const containerEl = activeView.containerEl.querySelector(".view-header");
    if (containerEl) {
      containerEl.appendChild(this.sliderContainer);
    }
  }

  private async updateFrontmatterFontSize(file: TFile, fontSize: number) {
    await this.app.fileManager.processFrontMatter(file, (frontmatter) => {
      frontmatter["font-size"] = `${fontSize.toFixed(2)}rem`;
    });
  }
}

class DynamicFontSizeSettingTab extends PluginSettingTab {
  plugin: DynamicFontSizePlugin;

  constructor(app: App, plugin: DynamicFontSizePlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const { containerEl } = this;

    containerEl.empty();

    new Setting(containerEl)
      .setName("Minimum font size")
      .setDesc("Minimum font size in rem units (default: 0.5)")
      .addText((text) =>
        text
          .setPlaceholder("0.5")
          .setValue(this.plugin.settings.minFontSize.toString())
          .onChange(async (value) => {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue > 0) {
              this.plugin.settings.minFontSize = numValue;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName("Maximum font size")
      .setDesc("Maximum font size in rem units (default: 3.0)")
      .addText((text) =>
        text
          .setPlaceholder("3.0")
          .setValue(this.plugin.settings.maxFontSize.toString())
          .onChange(async (value) => {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue > 0) {
              this.plugin.settings.maxFontSize = numValue;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl)
      .setName("Default font size")
      .setDesc("Default font size when creating slider (default: 1.0)")
      .addText((text) =>
        text
          .setPlaceholder("1.0")
          .setValue(this.plugin.settings.defaultFontSize.toString())
          .onChange(async (value) => {
            const numValue = parseFloat(value);
            if (!isNaN(numValue) && numValue > 0) {
              this.plugin.settings.defaultFontSize = numValue;
              await this.plugin.saveSettings();
            }
          })
      );

    new Setting(containerEl).setName("How to use").setHeading();
    containerEl.createEl("p", {
      text: 'Add a "font-size" property to your note\'s frontmatter with a value in rem units (e.g., "1.5rem" or "1.5"). The font size will be applied automatically.',
    });
    containerEl.createEl("p", {
      text: 'Use the command "toggle font size slider" to show/hide a slider for easy adjustment.',
    });

    const example = containerEl.createEl("pre");
    example.textContent = `---
font-size: 1.5rem
---

Your note content here`;
  }
}
