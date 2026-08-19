import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { gzipSync } from "node:zlib";

const nextDir = join(process.cwd(), ".next");
const chunkRoot = join(nextDir, "static", "chunks");
const markers = ["demo-chunk:freeze", "demo-chunk:traffic", "demo-chunk:stackflow"];
const forbiddenInHome = ["features/demos", "@stackflow", "traffic.worker", ...markers];
const budgetBytes = 150 * 1024;

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  return (
    await Promise.all(
      entries.map((entry) =>
        entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)],
      ),
    )
  ).flat();
}

// 1) 세 데모가 서로 다른 비동기 청크에 있는지 검사한다.
// Turbopack은 같은 dynamic import() 호출부라도 진입 라우트(홈 vs work/[slug])별로
// 물리 청크 파일을 다르게 생성할 수 있으므로(react-loadable-manifest로 확인됨),
// marker당 파일이 정확히 1개라고 가정하지 않고 "marker 간 파일 집합이 서로 겹치지 않는지"를 검사한다.
const allChunkFiles = (await files(chunkRoot)).filter((file) => file.endsWith(".js"));
const chunkContents = await Promise.all(allChunkFiles.map(async (file) => [file, await readFile(file, "utf8")]));

const locations = new Map(
  markers.map((marker) => [marker, chunkContents.filter(([, source]) => source.includes(marker)).map(([file]) => file)]),
);

for (const [marker, found] of locations) {
  if (found.length === 0) throw new Error(`${marker}가 어떤 client chunk에서도 발견되지 않았습니다.`);
}

const seenFiles = new Map();
for (const [marker, found] of locations) {
  for (const file of found) {
    const owner = seenFiles.get(file);
    if (owner && owner !== marker) {
      throw new Error(`${file}에 ${owner}와 ${marker}가 함께 들어있습니다. 데모 청크가 서로 격리되지 않았습니다.`);
    }
    seenFiles.set(file, marker);
  }
}

console.log("데모 청크 위치:", Object.fromEntries(locations));

// 2) 홈(`/`)이 실제로 내려주는 초기 스크립트 집합을 prerender된 HTML에서 읉어온다.
//    ES module 지원 브라우저는 `noModule` 스크립트(레거시 폴리필)를 요청하지 않으므로 제외한다.
const homeHtml = await readFile(join(nextDir, "server", "app", "index.html"), "utf8");
const scriptTagPattern = /<script\b([^>]*)>/g;
const homeScriptSrcs = new Set();
for (const match of homeHtml.matchAll(scriptTagPattern)) {
  const attrs = match[1];
  const srcMatch = attrs.match(/\ssrc="([^"]+)"/);
  if (!srcMatch) continue;
  const src = srcMatch[1];
  if (!src.startsWith("/_next/static/")) continue;
  if (/\bnoModule=/i.test(attrs)) continue;
  homeScriptSrcs.add(src);
}

if (homeScriptSrcs.size === 0) throw new Error("홈 prerender HTML에서 초기 스크립트를 찾지 못했습니다.");

const demoChunkFiles = new Set([...seenFiles.keys()]);

const homeChunkRows = [];
let homeTotalGzipBytes = 0;
for (const src of homeScriptSrcs) {
  const relativePath = src.replace(/^\/_next\//, "");
  const filePath = join(nextDir, relativePath);
  if (demoChunkFiles.has(filePath)) {
    throw new Error(`홈 초기 스크립트에 데모 청크(${filePath})가 포함되어 있습니다.`);
  }
  const raw = await readFile(filePath);
  const source = raw.toString("utf8");
  for (const forbidden of forbiddenInHome) {
    if (source.includes(forbidden)) {
      throw new Error(`홈 초기 청크(${filePath})에 금지된 문자열 "${forbidden}"이 포함되어 있습니다.`);
    }
  }
  const gzipBytes = gzipSync(raw, { level: 9 }).length;
  homeTotalGzipBytes += gzipBytes;
  homeChunkRows.push({ file: relativePath, rawBytes: raw.length, gzipBytes });
}

homeChunkRows.sort((a, b) => b.gzipBytes - a.gzipBytes);
console.log("홈 초기 청크 (gzip 기준):");
for (const row of homeChunkRows) {
  console.log(`  ${row.file}  raw=${row.rawBytes}B  gzip=${row.gzipBytes}B`);
}
console.log(
  `홈 초기 JavaScript gzip 합계: ${homeTotalGzipBytes}B (${(homeTotalGzipBytes / 1024).toFixed(2)}KB) / 예산 ${budgetBytes}B (${(budgetBytes / 1024).toFixed(2)}KB)`,
);

// 3) 데모별 청크 gzip 크기도 참고용으로 출력한다(예산 합계에는 포함하지 않는다).
console.log("데모 청크 크기 (gzip, 참고용 · 예산 제외):");
for (const [marker, found] of locations) {
  for (const file of found) {
    const raw = await readFile(file);
    const gzipBytes = gzipSync(raw, { level: 9 }).length;
    console.log(`  ${marker} -> ${file}  raw=${raw.length}B  gzip=${gzipBytes}B`);
  }
}

if (homeTotalGzipBytes >= budgetBytes) {
  throw new Error(
    `홈 초기 JavaScript gzip 합계가 예산을 초과했습니다: ${homeTotalGzipBytes}B (${(homeTotalGzipBytes / 1024).toFixed(2)}KB) >= ${budgetBytes}B (150KB)`,
  );
}

console.log("PASS: 데모 청크 분리 및 홈 초기 JS 예산 검사를 통과했습니다.");
