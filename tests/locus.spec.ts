import { assert } from "chai";
import { promises as fs, constants as fsConstants } from "fs";
import Locus, { FileResource, NodeDriver } from '../src';

const GAME_PATH = String.raw`C:\Games\SquareEnix\FINAL FANTASY XIV - A Realm Reborn`;

function createLocus() {
  return new Locus({ driver: new NodeDriver(GAME_PATH) });
}

it('construct without errors', () => {
  const locus = createLocus();
  assert.instanceOf(locus, Locus);
});

describe("raw file handling", () => {
  describe("existing file", () => {
    it("returns a file resource", async () => {
      const locus = createLocus();
      const file = await locus.getFile('exd/root.exl');
      assert.instanceOf(file, FileResource);
    });

    it("save file to disk", async () => {
      after(async () => {
        await fs.unlink("./root.exl");
      });

      const locus = createLocus();
      const file = await locus.getFile('exd/root.exl');
      await file.saveFile("./root.exl");
      await fs.access("./root.exl", fsConstants.F_OK);
    });
  });

  it("non-existing file returns null", async () => {
    const locus = createLocus();
    let file = await locus.getFile('exd/ThisFileWillNeverExist.exl');
    assert.isNull(file);

  });
});

/*describe("sheet data handling", () => {
  it("can read sheet data", async () => {
    const locus = createLocus();
    const bgm = new BGM(locus.getSheet("BGM"));
  });
});*/
