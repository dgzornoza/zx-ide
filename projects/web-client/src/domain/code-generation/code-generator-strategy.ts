import type { CodeGenerationType, FileEntry } from 'externalShared/extract-graphics/extract-graphics-dtos';

/** File produced by a code generator and sent to the extension to be written. */
export type GeneratedFile = FileEntry;

/** Strategy that produces every output file for one code generation language. */
export interface CodeGeneratorStrategy<TParameters> {
  generate(parameters: TParameters): GeneratedFile[];
}

/** One strategy factory per code generation language. */
export type CodeGeneratorStrategies<TParameters> = Record<CodeGenerationType, () => CodeGeneratorStrategy<TParameters>>;

/**
 * Returns a new strategy for the given code generation language, or `undefined`
 * for a value outside `CodeGenerationType` (as the previous per-domain `switch` did).
 */
export function createCodeGenerator<TParameters>(
  type: CodeGenerationType,
  strategies: CodeGeneratorStrategies<TParameters>
): CodeGeneratorStrategy<TParameters> {
  return strategies[type]?.();
}
