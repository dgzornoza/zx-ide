import { describe, expect, it } from 'vitest';
import { routeGeneratedFile, splitWorkspaceRelativePath } from './generated-file-routing';

describe('routeGeneratedFile', () => {
  it('places resource files under assets', () => {
    expect(routeGeneratedFile({ fileType: 'map', fileName: 'tiles/level1.cfg' })).toEqual({
      rootFolder: 'assets',
      pathSegments: ['tiles', 'level1.cfg'],
      isBinary: false,
    });
    expect(routeGeneratedFile({ fileType: 'png', fileName: 'tiles/level1.png' })).toEqual({
      rootFolder: 'assets',
      pathSegments: ['tiles', 'level1.png'],
      isBinary: true,
    });
  });

  it('places code files under src/data', () => {
    expect(routeGeneratedFile({ fileType: 'c-header', fileName: 'tiles/level1.h' })).toEqual({
      rootFolder: 'src/data',
      pathSegments: ['tiles', 'level1.h'],
      isBinary: false,
    });
    expect(routeGeneratedFile({ fileType: 'asm', fileName: 'tiles/level1.asm' }).rootFolder).toBe('src/data');
    expect(routeGeneratedFile({ fileType: 'binary', fileName: 'tiles/level1.bin' })).toEqual({
      rootFolder: 'src/data',
      pathSegments: ['tiles', 'level1.bin'],
      isBinary: true,
    });
  });
});

describe('splitWorkspaceRelativePath', () => {
  it('splits on forward and back slashes', () => {
    expect(splitWorkspaceRelativePath('tiles\\level1/level1.h')).toEqual(['tiles', 'level1', 'level1.h']);
  });

  it('drops leading separators, empty, current and parent segments so the path stays inside its root', () => {
    expect(splitWorkspaceRelativePath('/../../etc//./passwd')).toEqual(['etc', 'passwd']);
  });
});
