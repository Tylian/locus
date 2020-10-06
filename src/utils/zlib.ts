import { inflateRaw as zlibInflateRaw } from "pako";

// note: forcing inflate to be async despite implementation being sync, so we can change the implementation later without changing the API surface
export async function inflateRaw(buffer: Uint8Array): Promise<Uint8Array> {
  return zlibInflateRaw(buffer);
}
