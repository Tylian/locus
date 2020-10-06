export type OpenFlags = "r" | "r+" | "w" | "w+" | "a" | "a+";

export interface IFileSystem {
    exists(path: string): Promise<boolean>;
    readdir(path: string): Promise<IDirectoryEntity[]>;
    open(path: string, mode: OpenFlags): Promise<IFileHandle>;
    readFile(path: string): Promise<Uint8Array>;
    writeFile(path: string, buffer: Uint8Array): Promise<void>;
}

export interface IDirectoryEntity {
    isDirectory(): boolean;
    isFile(): boolean;
    name: string;
}

export interface IFileHandle {
    read(options: { buffer?: Uint8Array, offset?: number, length?: number, position?: number | null }): Promise<{ bytesRead: number, buffer: Uint8Array }>;
    // write(): Promise<number>; // not needed
    close(): Promise<void>;
}