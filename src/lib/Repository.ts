import { normalize } from "path";
import Category from "./Category";
import FileResource from "./FileResource";
import Locus from "./Locus";

// TODO this can be an enum
const categoryIdMap: Record<string, number> = {
  "common": 0x00,
  "bgcommon": 0x01,
  "bg": 0x02,
  "cut": 0x03,
  "chara": 0x04,
  "shader": 0x05,
  "ui": 0x06,
  "sound": 0x07,
  "vfx": 0x08,
  "ui_script": 0x09,
  "exd": 0x0A,
  "game_script": 0x0B,
  "music": 0x0C,
  "sqpack_test": 0x12,
  "debug": 0x13,
};

export default class Repository {
  private expansionId = 0;
  private categories: Record<keyof typeof categoryIdMap, Category> = {};
  private basePath = normalize(`game/sqpack/${this.name}`);

  constructor(private locus: Locus, public name: string) {
    if(name.startsWith("ex")) {
      this.expansionId = parseInt(name.slice(2), 10);
    }
  }

  private async lazyInitialize() {
    for(let [category, id] of Object.entries(categoryIdMap)) {
      this.categories[category] = new Category(this.locus, id, this.expansionId, { basePath: this.basePath });
    }
  }

  async fileExists(path: string): Promise<boolean> {
    await this.lazyInitialize();

    let category = path.slice(0, path.indexOf("/"));
    return this.categories[category]?.fileExists(path) ?? false;
  }

  async getFile(path: string): Promise<FileResource | null> {
    await this.lazyInitialize();
    
    let category = path.slice(0, path.indexOf("/"));
    return this.categories[category]?.getFile(path) ?? null;
  }
}