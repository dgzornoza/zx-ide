/**
 * Applies a 3D rotation (Euler ZYX order, orthographic projection) to a
 * binary grid using backward-mapping with nearest-neighbor interpolation.
 *
 * The grid is treated as lying on the Z=0 plane. Each destination pixel
 * (destinationX, destinationY) is mapped back to its source pixel
 * (sourceX, sourceY) by solving the 2×2 linear system that results from the
 * orthographic projection of R = Rz·Ry·Rx:
 *
 *   destinationX = R[0][0]*sourceX + R[0][1]*sourceY
 *   destinationY = R[1][0]*sourceX + R[1][1]*sourceY
 *
 * Inverse: sourceX = ( R[1][1]*destinationX - R[0][1]*destinationY ) / determinant
 *          sourceY = (-R[1][0]*destinationX + R[0][0]*destinationY ) / determinant
 *
 * where determinant = R[0][0]*R[1][1] - R[0][1]*R[1][0] = cos(angleY)*cos(angleX).
 * When the determinant ≈ 0 the grid is edge-on and the result is blank.
 *
 * Pixels whose source falls outside the original bounds are set to false.
 */
export function rotateBinaryGrid(bitmap: boolean[][], degreesX: number, degreesY: number, degreesZ: number): boolean[][] {
  const height = bitmap.length;
  const width = bitmap[0].length;

  const angleX = (degreesX * Math.PI) / 180;
  const angleY = (degreesY * Math.PI) / 180;
  const angleZ = (degreesZ * Math.PI) / 180;

  const cosineX = Math.cos(angleX);
  const sineX = Math.sin(angleX);
  const cosineY = Math.cos(angleY);
  const sineY = Math.sin(angleY);
  const cosineZ = Math.cos(angleZ);
  const sineZ = Math.sin(angleZ);

  // First two rows of R = Rz · Ry · Rx (source Z = 0, so column 2 drops out):
  //   R[0][0] =  cosineZ*cosineY
  //   R[0][1] =  cosineZ*sineY*sineX - sineZ*cosineX
  //   R[1][0] =  sineZ*cosineY
  //   R[1][1] =  sineZ*sineY*sineX + cosineZ*cosineX
  const rotationRow0Column0 = cosineZ * cosineY;
  const rotationRow0Column1 = cosineZ * sineY * sineX - sineZ * cosineX;
  const rotationRow1Column0 = sineZ * cosineY;
  const rotationRow1Column1 = sineZ * sineY * sineX + cosineZ * cosineX;

  // determinant = cos(angleY)*cos(angleX); ≈ 0 means the grid is seen edge-on → return blank.
  const determinant = rotationRow0Column0 * rotationRow1Column1 - rotationRow0Column1 * rotationRow1Column0;
  if (Math.abs(determinant) < 1e-6) {
    return Array.from({ length: height }, () => Array<boolean>(width).fill(false));
  }

  const centerX = width / 2;
  const centerY = height / 2;

  const result: boolean[][] = [];

  for (let destinationY = 0; destinationY < height; destinationY++) {
    const row: boolean[] = [];
    for (let destinationX = 0; destinationX < width; destinationX++) {
      // Center the destination coordinates.
      const centeredX = destinationX - centerX + 0.5;
      const centeredY = destinationY - centerY + 0.5;

      // Solve the 2×2 system for the source coordinates.
      const sourceX = (rotationRow1Column1 * centeredX - rotationRow0Column1 * centeredY) / determinant + centerX - 0.5;
      const sourceY = (-rotationRow1Column0 * centeredX + rotationRow0Column0 * centeredY) / determinant + centerY - 0.5;

      const sourceColumn = Math.round(sourceX);
      const sourceRow = Math.round(sourceY);

      if (sourceColumn >= 0 && sourceColumn < width && sourceRow >= 0 && sourceRow < height) {
        row.push(bitmap[sourceRow][sourceColumn]);
      } else {
        row.push(false);
      }
    }
    result.push(row);
  }

  return result;
}
