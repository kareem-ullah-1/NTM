import { assertValidImageFile } from "../utils/r2Storage";

let passed = 0;
let failed = 0;

function assertAccepts(label: string, mimetype: string, buffer: Buffer) {
  try {
    assertValidImageFile({ mimetype, size: buffer.length, buffer });
    console.log(`  ✅ PASS — ${label} → accepted`);
    passed++;
  } catch (e: any) {
    console.error(`  ❌ FAIL — ${label} → should be accepted but got: ${e.message}`);
    failed++;
  }
}

function assertRejects(label: string, mimetype: string, buffer: Buffer) {
  try {
    assertValidImageFile({ mimetype, size: buffer.length, buffer });
    console.error(`  ❌ FAIL — ${label} → should be rejected but was accepted`);
    failed++;
  } catch {
    console.log(`  ✅ PASS — ${label} → rejected`);
    passed++;
  }
}

console.log("\n1. Real JPEG (FF D8 FF …)");
const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46]);
assertAccepts("Real JPEG", "image/jpeg", jpeg);

console.log("\n2. Real PNG (89 50 4E 47 0D 0A 1A 0A …)");
const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]);
assertAccepts("Real PNG", "image/png", png);

console.log("\n3. Real WebP (RIFF…WEBP)");
const webp = Buffer.alloc(20);
webp.write("RIFF", 0, "ascii");
webp.writeUInt32LE(100, 4);
webp.write("WEBP", 8, "ascii");
assertAccepts("Real WebP", "image/webp", webp);

console.log("\n4. Text file pretending to be JPEG");
const fakeJpeg = Buffer.from("This is not a JPEG file at all");
assertRejects("Fake JPEG", "image/jpeg", fakeJpeg);

console.log("\n5. Text file pretending to be PNG");
const fakePng = Buffer.from("This is not a PNG file at all");
assertRejects("Fake PNG", "image/png", fakePng);

console.log("\n6. Text file pretending to be WebP");
const fakeWebp = Buffer.from("This is not a WebP file at all");
assertRejects("Fake WebP", "image/webp", fakeWebp);

console.log("\n7. Other RIFF file (e.g. AVIF container) pretending to be WebP");
const riffAvif = Buffer.alloc(12);
riffAvif.write("RIFF", 0, "ascii");
riffAvif.writeUInt32LE(100, 4);
riffAvif.write("AVIF", 8, "ascii");
assertRejects("RIFF/AVIF as WebP", "image/webp", riffAvif);

const riffAvif2 = Buffer.alloc(12);
riffAvif2.write("RIFF", 0, "ascii");
riffAvif2.writeUInt32LE(100, 4);
riffAvif2.write("AVI ", 8, "ascii");
assertRejects("RIFF/AVI as WebP", "image/webp", riffAvif2);

console.log("\n8. SVG → rejected");
const svg = Buffer.from('<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg"></svg>');
assertRejects("SVG as image/webp", "image/webp", svg);
assertRejects("SVG as image/png", "image/png", svg);
assertRejects("SVG as image/jpeg", "image/jpeg", svg);

console.log("\n9. EXE → rejected");
const exe = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
assertRejects("EXE as image/jpeg", "image/jpeg", exe);
assertRejects("EXE as image/png", "image/png", exe);
assertRejects("EXE as image/webp", "image/webp", exe);

console.log("\nBonus: Disallowed MIME types");
assertRejects("AVIF MIME rejected", "image/avif", Buffer.from([0x52, 0x49, 0x46, 0x46, 0x00, 0x00, 0x00, 0x00, 0x41, 0x56, 0x49, 0x46]));
assertRejects("GIF MIME rejected", "image/gif", Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]));
assertRejects("BMP MIME rejected", "image/bmp", Buffer.from([0x42, 0x4d]));
assertRejects("TIFF MIME rejected", "image/tiff", Buffer.from([0x49, 0x49, 0x2a, 0x00]));

console.log(`\n${"═".repeat(40)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
console.log(`${"═".repeat(40)}\n`);

process.exit(failed > 0 ? 1 : 0);
