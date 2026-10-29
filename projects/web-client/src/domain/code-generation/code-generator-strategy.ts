import type { CodeGenerationType, FileEntry } from 'externalShared/extract-graphics/extract-graphics-dtos';

/** File produced by a code generator and sent to the extension to be written. */
export type GeneratedFile = FileEntry;

/** Strategy that produces every output file for one code generation language. */
export interface CodeGeneratorStrategy<TParams> {
  generate(params: TParams): GeneratedFile[];
}

/** One strategy factory per code generation language. */
export type CodeGeneratorStrategies<TParams> = Record<CodeGenerationType, () => CodeGeneratorStrategy<TParams>>;

/**
 * Returns a new strategy for the given code generation language, or `undefined`
 * for a value outside `CodeGenerationType` (as the previous per-domain `switch` did).
 */
export function createCodeGenerator<TParams>(
  type: CodeGenerationType,
  strategies: CodeGeneratorStrategies<TParams>
): CodeGeneratorStrategy<TParams> {
  return strategies[type]?.();
}
