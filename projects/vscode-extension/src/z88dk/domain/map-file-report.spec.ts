import { describe, expect, it } from 'vitest';
import { createMapFileReport, findExecOutputName, formatReportLine, MapFileSymbols, parseMapFileSymbols } from './map-file-report';

const mapFileContent = [
  'CRT_ORG_CODE                    = $8000 ; const, public, def, , ,',
  '__code_compiler_size            = $0100 ; const, public, def, , ,',
  '__data_compiler_size            = $0010 ; const, public, def, , ,',
  '__rodata_compiler_size          = $0020 ; const, public, def, , ,',
  '__bss_compiler_size             = $0030 ; const, public, def, , ,',
  '__code_user_size                = $0200 ; const, public, def, , ,',
  '__data_user_size                = $0001 ; const, public, def, , ,',
  '__rodata_user_size              = $0002 ; const, public, def, , ,',
  '__bss_user_size                 = $0003 ; const, public, def, , ,',
  '__BSS_END_tail                  = $8400 ; addr, public, , , ,',
  '__register_sp                   = $FF58 ; const, public, def, , ,',
  '__crt_stack_size                = $0200 ; const, public, def, , ,',
  '_main                           = $8010 ; addr, public, , main_c, code_compiler, main.c:5',
].join('\r\n');

describe('parseMapFileSymbols', () => {
  it('reads the hexadecimal value of every known symbol and ignores the others', () => {
    const symbols = parseMapFileSymbols(mapFileContent);

    expect(symbols[MapFileSymbols.CRT_ORG_CODE]).toBe(0x8000);
    expect(symbols[MapFileSymbols.__register_sp]).toBe(0xff58);
    expect(Object.keys(symbols)).not.toContain('_main');
    expect(Object.keys(symbols)).toHaveLength(12);
  });
});

describe('createMapFileReport', () => {
  it('computes sizes, used and free memory from the symbols', () => {
    const report = createMapFileReport(parseMapFileSymbols(mapFileContent));

    expect(report).toEqual({
      startAddress: 0x8000,
      compilerCodeSize: 0x100,
      compilerDataSize: 0x10,
      compilerRoDataSize: 0x20,
      compilerBssSize: 0x30,
      userCodeSize: 0x200,
      userDataSize: 1,
      userRoDataSize: 2,
      userBssSize: 3,
      totalCompiledCode: 0x100 + 0x10 + 0x20 + 0x30 + 0x200 + 1 + 2 + 3,
      topStack: 0xff58,
      stackSize: 0x200,
      heapStart: 0x8400,
      usedMemory: 0x400,
      freeMemory: 0xff58 - 0x8400,
    });
  });

  it('uses CRT_MAX_HEAP_ADDRESS as top of stack when __register_sp is missing or out of range', () => {
    expect(createMapFileReport({ [MapFileSymbols.CRT_MAX_HEAP_ADDRESS]: 0xd000 }).topStack).toBe(0xd000);
    expect(
      createMapFileReport({ [MapFileSymbols.__register_sp]: 0x100000000, [MapFileSymbols.CRT_MAX_HEAP_ADDRESS]: 0xd000 }).topStack
    ).toBe(0xd000);
  });

  it('drops a stack size out of range', () => {
    expect(createMapFileReport({ [MapFileSymbols.__crt_stack_size]: 0x100000000 }).stackSize).toBeUndefined();
  });

  it('leaves the totals undefined when a symbol they need is missing', () => {
    const report = createMapFileReport({ [MapFileSymbols.CRT_ORG_CODE]: 0x8000 });

    expect(report.totalCompiledCode).toBeUndefined();
    expect(report.usedMemory).toBeUndefined();
    expect(report.freeMemory).toBeUndefined();
  });
});

describe('formatReportLine', () => {
  it('pads the description to 50 characters and prints the value in decimal and hexadecimal', () => {
    expect(formatReportLine('Code size:', 255)).toBe(`Code size:${' '.repeat(40)}255 (0xFF) bytes`);
  });

  it('prints zero as a value and a missing value as N/A', () => {
    expect(formatReportLine('Free memory:', 0)).toBe(`Free memory:${' '.repeat(38)}0 (0x0) bytes`);
    expect(formatReportLine('Free memory:', undefined)).toBe(`Free memory:${' '.repeat(38)}N/A`);
  });
});

describe('findExecOutputName', () => {
  it('reads EXEC_OUTPUT from the Makefile', () => {
    expect(findExecOutputName('CC = zcc\nEXEC_OUTPUT = my-game\n')).toBe('my-game');
  });

  it('returns undefined without a Makefile or without EXEC_OUTPUT', () => {
    expect(findExecOutputName(undefined)).toBeUndefined();
    expect(findExecOutputName('CC = zcc\n')).toBeUndefined();
  });
});
