import fs from "fs";

// Copia aquí tus bytes tal cual, sin $ y sin comas.
// Puedes pegar todo el bloque ASM y el script lo limpiará.
const asmData = `
01 02 03 04 05 06 07 08 09 0A 0B 0C 0D 0E 0F 10 11 12 13 14 15 16 17 18 19 1A 1B 1C 1D 1E 1F 20
21 22 23 24 25 00 00 00 00 00 26 27 28 29 2A 2B 2C 2D 2E 2F 30 31 00 00 00 00 00 32 33 34 35 36
37 38 39 3A 3B 00 00 00 00 00 00 3C 3D 3E 3F 40 41 42 43 44 45 00 00 00 00 00 00 46 47 48 49 4A
4B 4C 4D 4E 4F 50 51 52 53 54 55 56 57 58 59 5A 5B 5C 5D 5E 5F 60 61 62 63 64 65 66 67 68 69 6A
`;

// Limpieza: elimina $, comas, "defb", saltos, etc.
const clean = asmData
  .replace(/defb/gi, "")
  .replace(/\$/g, "")
  .replace(/,/g, " ")
  .replace(/\s+/g, " ")
  .trim();

// Convierte a bytes
const bytes = Buffer.from(
  clean.split(" ").map(h => parseInt(h, 16))
);

// Escribe el binario
fs.writeFileSync("hud_tiles.bin", bytes);

console.log("✔ Archivo generado: hud_tiles.bin");
console.log("✔ Tamaño:", bytes.length, "bytes");
