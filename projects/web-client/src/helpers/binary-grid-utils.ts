/**
 * Applies a 3D rotation (Euler ZYX order, orthographic projection) to a
 * binary grid using backward-mapping with nearest-neighbor interpolation.
 *
 * The grid is treated as lying on the Z=0 plane. Each destination pixel
 * (dx, dy) is mapped back to its source pixel (px, py) by solving the 2×2
 * linear system that results from the orthographic projection of R = Rz·Ry·Rx:
 *
 *   dx = R[0][0]*px + R[0][1]*py
 *   dy = R[1][0]*px + R[1][1]*py
 *
 * Inverse: px = ( R[1][1]*dx - R[0][1]*dy ) / det
 *          py = (-R[1][0]*dx + R[0][0]*dy ) / det
 *
 * where det = R[0][0]*R[1][1] - R[0][1]*R[1][0] = cos(ay)*cos(ax).
 * When det ≈ 0 the grid is edge-on and the result is blank.
 *
 * Pixels whose source falls outside the original bounds are set to false.
 */
export function rotateBinaryGrid(
  bitmap: boolean[][],
  degX: number,
  degY: number,
  degZ: number,
): boolean[][] {
  const height = bitmap.length;
  const width = bitmap[0].length;

  const ax = (degX * Math.PI) / 180;
  const ay = (degY * Math.PI) / 180;
  const az = (degZ * Math.PI) / 180;

  const cax = Math.cos(ax);
  const sax = Math.sin(ax);
  const cay = Math.cos(ay);
  const say = Math.sin(ay);
  const caz = Math.cos(az);
  const saz = Math.sin(az);

  // First two rows of R = Rz · Ry · Rx (source Z = 0, so col 2 drops out):
  //   R[0][0] =  caz*cay
  //   R[0][1] =  caz*say*sax - saz*cax
  //   R[1][0] =  saz*cay
  //   R[1][1] =  saz*say*sax + caz*cax
  const m00 = caz * cay;
  const m01 = caz * say * sax - saz * cax;
  const m10 = saz * cay;
  const m11 = saz * say * sax + caz * cax;

  // det = cos(ay)*cos(ax); ≈ 0 means the grid is seen edge-on → return blank.
  const det = m00 * m11 - m01 * m10;
  if (Math.abs(det) < 1e-6) {
    return Array.from({ length: height }, () =>
      Array<boolean>(width).fill(false),
    );
  }

  const cx = width / 2;
  const cy = height / 2;

  const result: boolean[][] = [];

  for (let dy = 0; dy < height; dy++) {
    const row: boolean[] = [];
    for (let dx = 0; dx < width; dx++) {
      // Center the destination coordinates.
      const px = dx - cx + 0.5;
      const py = dy - cy + 0.5;

      // Solve the 2×2 system for the source coordinates.
      const sx = ( m11 * px - m01 * py) / det + cx - 0.5;
      const sy = (-m10 * px + m00 * py) / det + cy - 0.5;

      const srcX = Math.round(sx);
      const srcY = Math.round(sy);

      if (srcX >= 0 && srcX < width && srcY >= 0 && srcY < height) {
        row.push(bitmap[srcY][srcX]);
      } else {
        row.push(false);
      }
    }
    result.push(row);
  }

  return result;
}

