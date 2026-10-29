import { describe, expect, it } from 'vitest';
import {
  findAsmBreakpointLineInLisFile,
  findCBreakpointLineInLisFile,
  getBreakpointLanguage,
  getMappedBreakpointAction,
  getWorkspaceRelativePath,
  isBreakpointSourceFile,
} from './breakpoint-mapping';

const lisFileLines = [
  '1                          ; src/main.c:10:',
  '2     8000  3E 01          ld a,1',
  '3                          ; src/main.c:11:',
  '4                          ; comment only',
  '5     8002  C9             ret',
];

describe('isBreakpointSourceFile', () => {
  it('accepts c, h and asm files only', () => {
    expect(isBreakpointSourceFile('/project/src/main.c')).toBe(true);
    expect(isBreakpointSourceFile('/project/src/main.h')).toBe(true);
    expect(isBreakpointSourceFile('/project/src/sprites.asm')).toBe(true);
    expect(isBreakpointSourceFile('/project/bin/project.source.lis')).toBe(false);
  });
});

describe('getBreakpointLanguage', () => {
  it('maps c and asm files to their language and anything else to undefined', () => {
    expect(getBreakpointLanguage('/project/src/main.c')).toBe('c');
    expect(getBreakpointLanguage('/project/src/sprites.asm')).toBe('asm');
    expect(getBreakpointLanguage('/project/src/main.h')).toBeUndefined();
  });
});

describe('getWorkspaceRelativePath', () => {
  it('removes the workspace path prefix', () => {
    expect(getWorkspaceRelativePath('/project', '/project/src/main.c')).toBe('/src/main.c');
  });

  it('returns an empty path for a file outside the workspace', () => {
    expect(getWorkspaceRelativePath('/project', '/other/src/main.c')).toBe('');
  });
});

describe('findCBreakpointLineInLisFile', () => {
  it('returns the assembled line that follows the C label of the breakpoint line (0-based)', () => {
    expect(findCBreakpointLineInLisFile(lisFileLines, 'src/main.c', 9)).toBe(1);
  });

  it('returns undefined when the label is followed by a line without code', () => {
    expect(findCBreakpointLineInLisFile(lisFileLines, 'src/main.c', 10)).toBeUndefined();
  });

  it('returns undefined when the label is not in the listing', () => {
    expect(findCBreakpointLineInLisFile(lisFileLines, 'src/main.c', 40)).toBeUndefined();
  });
});

describe('findAsmBreakpointLineInLisFile', () => {
  const sourceLines = ['  ld a,1', '', '  ret', '  nop'];

  it('returns the listing line with the same instruction', () => {
    expect(findAsmBreakpointLineInLisFile(lisFileLines, sourceLines, 0)).toBe(1);
    expect(findAsmBreakpointLineInLisFile(lisFileLines, sourceLines, 2)).toBe(4);
  });

  it('returns undefined for a blank, missing or unknown source line', () => {
    expect(findAsmBreakpointLineInLisFile(lisFileLines, sourceLines, 1)).toBeUndefined();
    expect(findAsmBreakpointLineInLisFile(lisFileLines, sourceLines, 3)).toBeUndefined();
    expect(findAsmBreakpointLineInLisFile(lisFileLines, sourceLines, 99)).toBeUndefined();
  });
});

describe('getMappedBreakpointAction', () => {
  it('adds the .lis breakpoint of a valid mapping once', () => {
    expect(getMappedBreakpointAction({ hasSourceBreakpoint: true, hasLisBreakpoint: true, isLisBreakpointRegistered: false })).toBe(
      'add-lis-breakpoint'
    );
    expect(getMappedBreakpointAction({ hasSourceBreakpoint: true, hasLisBreakpoint: true, isLisBreakpointRegistered: true })).toBe('none');
  });

  it('removes a source breakpoint without .lis line and a .lis breakpoint without source', () => {
    expect(getMappedBreakpointAction({ hasSourceBreakpoint: true, hasLisBreakpoint: false, isLisBreakpointRegistered: false })).toBe(
      'remove-source-breakpoint'
    );
    expect(getMappedBreakpointAction({ hasSourceBreakpoint: false, hasLisBreakpoint: true, isLisBreakpointRegistered: true })).toBe(
      'remove-lis-breakpoint'
    );
  });
});
