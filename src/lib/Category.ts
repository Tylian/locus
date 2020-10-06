import { normalize } from "path";
import crc32 from "../utils/crc32";
import IndexFile from "../files/IndexFile";
import FileResource from "./FileResource";
import Locus from "./Locus";

interface CategoryOptions {
  basePath: string;
}

export default class Category {
  public basePath = "";
  public indexes = new Set<IndexFile>();

  constructor(public locus: Locus, public id: number, public expansionId: number, options: CategoryOptions) {
    this.basePath = options.basePath;
  }

  private async _lazyInitialize() {
    const fs = this.locus.driver;
    for(let chunk = 0; chunk < 255; chunk++) {
      const indexPath = this.generateFilepath(chunk, "index");
      //const index2Path = this.generateFilepath(chunk, "index2");
      if(await fs.exists(indexPath)) {
        this.indexes.add(new IndexFile(this.locus, chunk, indexPath));
      }/* else if(await fs.exists(index2Path)) {
        this.indexes.add(new Index2File(this.locus, index2Path));
      }*/
    }
  }

  async fileExists(path: string): Promise<boolean> {
    await this._lazyInitialize();

    throw new Error("Unimplemented");

    return false;
  }

  async getFile(path: string): Promise<FileResource | null> {
    await this._lazyInitialize();

    // saint coinach does lowercase during the crc32??
    path = path.toLowerCase();

    let sep = path.lastIndexOf('/');
    let folderHash = crc32(path.slice(0, sep));
    let fileHash = crc32(path.slice(sep + 1));

    for(let index of this.indexes.values()) {
      let folders = await index.getFolders()
      let folder = folders.get(folderHash);
      if(folder === undefined) continue;

      let file = folder.files.get(fileHash);
      if (file === undefined) continue;
  
      let offset = (file.offset & ~0x7) << 3;
      let dat = (file.offset & 0x7) >> 1;
      let dataPath = this.generateFilepath(index.chunk, `dat${dat}`);

      return new FileResource(this.locus, dataPath, offset);
    }

    return null;
  }

  //#region Utility functions
  // Based on: https://github.com/SapphireServer/Sapphire/blob/master/deps/datReader/GameData.cpp#L135-L141
  private generateFilepath(chunk: number, type: string) {
    const f = (value: number) => value.toString(16).padStart(2, "0")
    return normalize(`${this.basePath}/${f(this.id)}${f(this.expansionId)}${f(chunk)}.${this.locus.platform}.${type}`); // hey sprintf would be nice
  }
  //#endregion
}