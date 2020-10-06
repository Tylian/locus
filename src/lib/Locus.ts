import * as path from "path";
import { IFileSystem } from "../drivers/IFileSystem";
import FileResource from "./FileResource";
import Repository from "./Repository";

export default class Locus {
  protected repositories = new Map<string, Repository>();
  public driver: IFileSystem;
  public platform = "";

  constructor(options: { driver: IFileSystem, platform?: string }) {
    this.driver = options.driver;
    this.platform = options.platform || "win32";
  }

  private async _lazyInitialize() {
    const sqpackPath = path.normalize(`game/sqpack/`);
    let entities = await this.driver.readdir(sqpackPath);
    entities.forEach(entity => {
      if (entity.isDirectory()) {
        this.repositories.set(entity.name, new Repository(this, entity.name))
      };
    });
  }

  async fileExists(path: string): Promise<boolean> {
    await this._lazyInitialize();

    for (let repository of this.repositories.values()) {
      if (await repository.fileExists(path)) {
        return true;
      }
    }
    return false;
  }

  async getFile(path: string): Promise<FileResource | null> {
    await this._lazyInitialize();

    for (let repository of this.repositories.values()) {
      let file = await repository.getFile(path);
      if (file !== null) {
        return file;
      }
    }
    return null;
  }

  getSheet(arg0: string): any {
    throw new Error("Method not implemented.");
  }
}