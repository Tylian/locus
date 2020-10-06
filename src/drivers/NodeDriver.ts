import { IFileSystem, IFileHandle, OpenFlags } from "./IFileSystem";
import { promises as fs, constants as fsConstants, Dirent } from "fs";
import { normalize as pathNormalize } from "path";

/**
 * FileSystem driver that's based upon node.js's fs module, usable in node.js
 */
export class NodeFileHandle implements IFileHandle {
    constructor(private file: fs.FileHandle) {

    }

    async read(options: { buffer?: Uint8Array; offset?: number; length?: number; position?: number; }): Promise<{ bytesRead: number; buffer: Uint8Array; }> {
        const buffer = options.buffer ?? new Uint8Array(16384);

        return this.file.read(buffer,
            options.offset ?? 0,
            options.length ?? buffer.length,
            options.position ?? null);
    }

    readFile(): Promise<Uint8Array> {
        return this.file.readFile();
    }

    close(): Promise<void> {
        return this.file.close();
    }
}

export default class NodeDriver implements IFileSystem {
    constructor(public basePath: string) {

    }

    async exists(path: string): Promise<boolean> {
        try {
            await fs.access(pathNormalize(`${this.basePath}/${path}`), fsConstants.F_OK);
            return true;
        } catch(e) {
            return false;
        }
    }

    async readdir(path: string): Promise<Dirent[]> {
        const dir = await fs.opendir(pathNormalize(`${this.basePath}/${path}`));
        const result: Dirent[] = [];
        for await (const dirent of dir) {
            result.push(dirent);
        }
        return result;
    }
    
    async open(path: string, mode: OpenFlags): Promise<IFileHandle> {
        let fd = await fs.open(pathNormalize(`${this.basePath}/${path}`), mode);
        return new NodeFileHandle(fd);
    }

    async readFile(path: string): Promise<Uint8Array> {
        return Uint8Array.from(await fs.readFile(pathNormalize(`${this.basePath}/${path}`)));
    }

    async writeFile(path: string, buffer: Uint8Array): Promise<void> {
        return fs.writeFile(path, buffer);
    }
}