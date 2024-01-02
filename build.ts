// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.

import { encodeBase64 } from "https://deno.land/std/encoding/base64.ts";

// 1. build wasm
async function buildWasm(path: string): Promise<void> {
  const cmd = [
    "build",
    "--target",
    "web",
    "--release",
    "-d",
    path,
  ];
  const builder = new Deno.Command("wasm-pack",{args: cmd}).spawn();
  const status = await builder.status;

  if (!status.success) {
    console.error(`Failed to build wasm: ${status.code}`);
    Deno.exit(1);
  }
}

// 2. encode wasm
async function encodeWasm(wasmPath: string): Promise<string> {
  const wasm = await Deno.readFile(`${wasmPath}/minifier_lib_bg.wasm`);
  return encodeBase64(wasm);
}

// 3. generate script
async function generate(wasm: string, output: string): Promise<void> {
  const initScript = await Deno.readTextFile(`${output}/minifier_lib.js`);
  const denoHashScript =
    "// deno-lint-ignore-file\n" +
    "//deno-fmt-ignore-file\n" +
    "//deno-lint-ignore-file\n" +
    `import { decodeBase64 } from "https://deno.land/std/encoding/base64.ts";` +
    `export const source = decodeBase64("${wasm}");` +
    initScript;

  await Deno.writeFile("wasm.js", new TextEncoder().encode(denoHashScript));
}

const OUTPUT_DIR = "./dist";

await buildWasm(OUTPUT_DIR);
const wasm = await encodeWasm(OUTPUT_DIR);
await generate(wasm, OUTPUT_DIR);
