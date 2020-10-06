//import { Parser } from 'binary-parser';
import { IFileHandle } from "../drivers/IFileSystem";
import Locus from "./Locus";
import * as zlib from "../utils/zlib";

const FileHeader = (buf: ArrayBuffer) => {
  let dat = new DataView(buf);
  return {
    headerLength: dat.getUint32(0x00 * 0, true),
    contentType: dat.getUint32(0x04 * 1, true),
    fileSize: dat.getUint32(0x08 * 2, true),
    blockSize: dat.getUint32(0x10, true),
    blockCount: dat.getUint32(0x14, true),
  }
}

const BlockHeader = (buf: ArrayBuffer) => {
  let dat = new DataView(buf);
  return {
    headerLength: dat.getUint32(0x00, true),
    blockSize: dat.getUint32(0x08, true),
    totalSize: dat.getUint32(0x0C, true),
  }
}

export default class FileResource {
  constructor(public locus: Locus, public dataPath: string, public offset: number) {
    
  }

  async readFile(): Promise<Uint8Array> {
    const fs = this.locus.driver;

    let fd = await fs.open(this.dataPath, 'r');
    let { buffer: bytes } = await fd.read({ buffer: Buffer.alloc(0x18), offset: 0, length: 0x18, position: this.offset });

    let header = FileHeader(bytes.buffer);

    if(header.contentType !== 2) {
      throw new Error(`Content type ${header.contentType} is unsupported!`);
    }

    let buf = new Uint8Array(header.blockCount * 0x08);
    let data = new DataView(buf.buffer);
    await fd.read({ buffer: buf, offset: 0, length: header.blockCount * 0x08, position: this.offset + 0x18 });

    let blocks: Uint8Array[] = [];
    let length = 0;
    for(let i = 0; i < header.blockCount; i++) {
      let blockOffset = data.getUint32(i * 0x08, true);
      let buffer = await this.extractBlock(fd, this.offset + header.headerLength + blockOffset);

      blocks.push(buffer);
      length += buffer.byteLength;
    }

    await fd.close();

    let result = new Uint8Array(length);
    let position = 0;

    for(let block of blocks) {
      result.set(block, position);
      position += block.byteLength;
    }

    return result;
  }

  private async extractBlock(fd: IFileHandle, offset: number): Promise<Uint8Array> {
    let { buffer: bytes } = await fd.read({ buffer: Buffer.alloc(0x10), offset: 0, length: 0x10, position: offset });

    let info = BlockHeader(bytes.buffer);
    let compressed = info.blockSize < 0x7d00;
    let trueSize = compressed ? info.blockSize : info.totalSize;

    let { buffer: file } = await fd.read({ buffer: Buffer.alloc(trueSize), offset: 0, length: trueSize, position: offset + info.headerLength });

    return compressed ? zlib.inflateRaw(file) : file;
  }

  async saveFile(path: string): Promise<void> {
    const fs = this.locus.driver;

    let file = await this.readFile();
    return fs.writeFile(path, file);
  }
}