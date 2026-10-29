import * as assert from 'assert';
import * as vscode from 'vscode';

import { OwnBreakpointChanges } from '../../z88dk/models/own-breakpoint-changes';
import { findAsmLineInLisFile, isValidLisFileLineForBreakpoint } from '../../z88dk/domain/lis-file-lines';
import { isZ88dkMakeTask } from '../../z88dk/z88dk-task';

function createBreakpoint(line: number): vscode.SourceBreakpoint {
  return new vscode.SourceBreakpoint(new vscode.Location(vscode.Uri.file('/project/src/main.asm'), new vscode.Position(line, 0)));
}

suite('z88dk asm breakpoint mapping', () => {
  const lisFileLines = ['    1                    org 32768', '    2  0000  3e 01      ld a, 1', '    3  0002  c9         ret'];

  test('finds the .lis line that contains the asm source line', () => {
    assert.strictEqual(findAsmLineInLisFile(lisFileLines, 'ld a, 1'), 1);
  });

  test('finds a match on the first .lis line', () => {
    assert.strictEqual(findAsmLineInLisFile(['    1  0000  c9   ret'], 'ret'), 0);
  });

  test('returns undefined when the asm line is not in the .lis file', () => {
    assert.strictEqual(findAsmLineInLisFile(lisFileLines, 'jp 0'), undefined);
  });

  test('returns undefined for a blank or missing asm source line', () => {
    assert.strictEqual(findAsmLineInLisFile(lisFileLines, '   '), undefined);
    assert.strictEqual(findAsmLineInLisFile(lisFileLines, undefined), undefined);
  });

  test('rejects a missing .lis line without throwing', () => {
    assert.strictEqual(isValidLisFileLineForBreakpoint(undefined), false);
    assert.strictEqual(isValidLisFileLineForBreakpoint(lisFileLines[1]), true);
  });
});

suite('z88dk make task detection', () => {
  test('detects a z88dk make task', () => {
    assert.strictEqual(isZ88dkMakeTask({ type: 'shell', id: 'shell,make COMPILER=sdcc' }), true);
    assert.strictEqual(isZ88dkMakeTask({ type: 'shell', id: 'shell,make COMPILER=sccz80' }), true);
  });

  test('ignores other tasks, including tasks without an id', () => {
    assert.strictEqual(isZ88dkMakeTask({ type: 'npm', id: 'npm,build' }), false);
    assert.strictEqual(isZ88dkMakeTask({ type: 'npm', script: 'build' }), false);
  });
});

suite('z88dk own breakpoint changes', () => {
  test('filters out the breakpoints the extension changed itself, once', () => {
    const ownChanges = new OwnBreakpointChanges();
    const ownBreakpoint = createBreakpoint(1);
    const userBreakpoint = createBreakpoint(2);
    ownChanges.track([ownBreakpoint]);

    assert.deepStrictEqual(ownChanges.takeExternal([ownBreakpoint, userBreakpoint]), [userBreakpoint]);
    assert.deepStrictEqual(ownChanges.takeExternal([ownBreakpoint]), [ownBreakpoint]);
  });

  test('clear forgets the tracked breakpoints', () => {
    const ownChanges = new OwnBreakpointChanges();
    const breakpoint = createBreakpoint(1);
    ownChanges.track([breakpoint]);

    ownChanges.clear();

    assert.deepStrictEqual(ownChanges.takeExternal([breakpoint]), [breakpoint]);
  });
});
