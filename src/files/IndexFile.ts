import Locus from "../lib/Locus";

/*** SqPack header magic number */
// const SQPACK_MAGIC = Buffer.from('53715061636B0000', 'hex');

interface ISqpackFolder {
    files: Map<number, ISqpackFile>,
    offset: number,
}

interface ISqpackFile {
    folderKey: number,
    offset: number,
}

export default class IndexFile {
    public folders = new Map<number, ISqpackFolder>();
    constructor(public locus: Locus, public chunk: number, public filePath: string) {

    }

    public async getFolders(): Promise<Map<number, ISqpackFolder>> {
        await this._lazyInitialize();
        return this.folders;
    }

    private async _lazyInitialize() {
        const fs = this.locus.driver;
        const bytes = await fs.readFile(this.filePath);
        const data = new DataView(bytes.buffer);

        // TODO
        /*if(SQPACK_MAGIC.compare(data, 0, 8) !== 0) {
            throw new Error("SqPack magic doesn't match!");
        }*/

        let headerOffset = data.getUint32(0x0c, true);
        let folderOffset = data.getUint32(headerOffset + 0xe4, true);
        let folderSize   = data.getUint32(headerOffset + 0xe8, true);
    
        for(let i = 0; i < folderSize; i += 0x10) {
            let folderKey  = data.getUint32(folderOffset + i + 0x00, true);
            let fileOffset = data.getUint32(folderOffset + i + 0x04, true);
            let fileSize   = data.getUint32(folderOffset + i + 0x08, true);
    
            let files = new Map<number, ISqpackFile>();
            for(let j = 0; j < fileSize; j += 0x10) {
                let key = data.getUint32(fileOffset + j + 0x00, true);
                files.set(key, {
                    folderKey:  data.getUint32(fileOffset + j + 0x04, true),
                    offset:     data.getUint32(fileOffset + j + 0x08, true),
                });
            }
    
            this.folders.set(folderKey, {
                offset: fileOffset,
                files: files
            });
        }
    }
}