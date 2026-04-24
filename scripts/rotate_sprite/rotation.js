const fs = require("fs");
const readline = require("readline");
const { PNG } = require("pngjs");

console.log("--- ZX Spectrum Sprite Rotator ---");

const filePath = process.argv[2];
if (!filePath) {
  console.error("Error: Debes especificar la ruta de un archivo de texto.");
  console.error("Uso: node rotation.js <archivo.txt>");
  process.exit(1);
}

let fileContent;
try {
  const fileBuffer = fs.readFileSync(filePath);
  // Detectar BOM UTF-16LE (FF FE) y decodificar correctamente
  if (
    fileBuffer.length >= 2 &&
    fileBuffer[0] === 0xff &&
    fileBuffer[1] === 0xfe
  ) {
    fileContent = fileBuffer.slice(2).toString("utf16le");
  } else {
    fileContent = fileBuffer.toString("utf-8");
  }
} catch (error) {
  console.error(`Error al leer el archivo: ${error.message}`);
  process.exit(1);
}

const lines = fileContent.split(/\r?\n/).filter((line) => line.trim() !== "");

if (lines.length === 0) {
  console.error("El archivo esta vacio.");
  process.exit(1);
}

// Parsear valores hexadecimales a cuadricula de bits
const pixelGrid = lines.map((line) => {
  return line
    .split(",")
    .map((hexString) => {
      const decimalValue = Number(hexString.trim());
      return decimalValue.toString(2).padStart(8, "0").split("").map(Number);
    })
    .flat();
});

const spriteHeight = pixelGrid.length;
const spriteWidth = pixelGrid[0].length;

console.log(
  `\nSprite cargado: ${spriteWidth}x${spriteHeight} pixeles desde ${filePath}`,
);
console.log(
  "\nIntroduce las rotaciones que deseas aplicar (puedes aniadir varias).",
);
console.log("Formato: <eje> <grados>   ejemplo: Y 45   o   Z 90");
console.log("Ejes disponibles: X, Y, Z");
console.log("Escribe 'fin' o deja vacio para terminar.\n");

const rotationInterface = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const rotationSteps = [];

function askNextRotation() {
  rotationInterface.question(
    `Rotacion ${rotationSteps.length + 1} (o 'fin'): `,
    (answer) => {
      const trimmedAnswer = answer.trim();

      if (trimmedAnswer.toLowerCase() === "fin" || trimmedAnswer === "") {
        rotationInterface.close();
        applyRotationsAndSave();
        return;
      }

      const parts = trimmedAnswer.split(/\s+/);
      if (parts.length !== 2) {
        console.log(
          "  Formato incorrecto. Usa: <eje> <grados>  (ejemplo: Y 45)",
        );
        askNextRotation();
        return;
      }

      const rotationAxis = parts[0].toUpperCase();
      const rotationDegrees = parseFloat(parts[1]);

      if (!["X", "Y", "Z"].includes(rotationAxis)) {
        console.log("  Eje no valido. Usa X, Y o Z.");
        askNextRotation();
        return;
      }

      if (isNaN(rotationDegrees)) {
        console.log("  Los grados deben ser un numero.");
        askNextRotation();
        return;
      }

      rotationSteps.push({ axis: rotationAxis, degrees: rotationDegrees });
      askNextRotation();
    },
  );
}

function applyRotationsAndSave() {
  if (rotationSteps.length === 0) {
    console.log("\nNo se especificaron rotaciones. Nada que guardar.");
    return;
  }

  let currentGrid = pixelGrid;
  for (const rotationStep of rotationSteps) {
    console.log(
      `\nAplicando rotacion en eje ${rotationStep.axis} a ${rotationStep.degrees} grados...`,
    );
    currentGrid = rotateSprite(
      currentGrid,
      spriteWidth,
      spriteHeight,
      rotationStep.axis,
      rotationStep.degrees,
    );
  }

  const outputFilePath = filePath + ".output";
  saveAsBinaryOutput(currentGrid, outputFilePath);
  saveAsPng(currentGrid, filePath + ".png");
}

function rotateSprite(
  pixelMatrix,
  width,
  height,
  rotationAxis,
  rotationDegrees,
) {
  const radians = (rotationDegrees * Math.PI) / 180;
  const centerXOffset = (width - 1) / 2;
  const centerYOffset = (height - 1) / 2;

  const rotatedGrid = Array(height)
    .fill(0)
    .map(() => Array(width).fill(0));

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      if (pixelMatrix[row][col] === 1) {
        const centeredX = col - centerXOffset;
        const centeredY = row - centerYOffset;

        let newX, newY;

        if (rotationAxis === "Y") {
          newX = centeredX * Math.cos(radians);
          newY = centeredY;
        } else if (rotationAxis === "X") {
          newX = centeredX;
          newY = centeredY * Math.cos(radians);
        } else {
          // Z
          newX = centeredX * Math.cos(radians) - centeredY * Math.sin(radians);
          newY = centeredX * Math.sin(radians) + centeredY * Math.cos(radians);
        }

        const projectedX = Math.round(newX + centerXOffset);
        const projectedY = Math.round(newY + centerYOffset);

        if (
          projectedX >= 0 &&
          projectedX < width &&
          projectedY >= 0 &&
          projectedY < height
        ) {
          rotatedGrid[projectedY][projectedX] = 1;
        }
      }
    }
  }
  return rotatedGrid;
}

function saveAsBinaryOutput(outputGrid, outputFilePath) {
  const outputLines = outputGrid.map((row) => {
    const byteGroups = [];
    for (let byteIndex = 0; byteIndex < row.length; byteIndex += 8) {
      const byteSlice = row.slice(byteIndex, byteIndex + 8).join("");
      byteGroups.push(byteSlice.padEnd(8, "0"));
    }
    return byteGroups.join(" ");
  });

  try {
    fs.writeFileSync(outputFilePath, outputLines.join("\n"), "utf-8");
    console.log(`\nResultado guardado en: ${outputFilePath}`);
  } catch (error) {
    console.error(`\nError al guardar el archivo: ${error.message}`);
  }
}

function saveAsPng(outputGrid, pngFilePath) {
  const imageHeight = outputGrid.length;
  const imageWidth = outputGrid[0].length;
  const png = new PNG({ width: imageWidth, height: imageHeight, colorType: 6 });

  for (let row = 0; row < imageHeight; row++) {
    for (let col = 0; col < imageWidth; col++) {
      const pixelIndex = (row * imageWidth + col) * 4;
      const isActive = outputGrid[row][col] === 1;
      png.data[pixelIndex] = 255; // R
      png.data[pixelIndex + 1] = 255; // G
      png.data[pixelIndex + 2] = 255; // B
      png.data[pixelIndex + 3] = isActive ? 255 : 0; // Alpha: opaco o transparente
    }
  }

  try {
    const pngBuffer = PNG.sync.write(png);
    fs.writeFileSync(pngFilePath, pngBuffer);
    console.log(`Imagen PNG guardada en: ${pngFilePath}`);
  } catch (error) {
    console.error(`\nError al guardar el PNG: ${error.message}`);
  }
}

askNextRotation();
