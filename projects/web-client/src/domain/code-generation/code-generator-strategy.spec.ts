import { describe, expect, it } from 'vitest';

import { CodeGeneratorStrategy, createCodeGenerator, GeneratedFile } from 'src/domain/code-generation/code-generator-strategy';

interface GreetingParams {
  name: string;
}

class CGreetingGenerator implements CodeGeneratorStrategy<GreetingParams> {
  generate(params: GreetingParams): GeneratedFile[] {
    return [{ fileType: 'c-header', fileName: `${params.name}.h`, content: '' }];
  }
}

class AsmGreetingGenerator implements CodeGeneratorStrategy<GreetingParams> {
  generate(params: GreetingParams): GeneratedFile[] {
    return [{ fileType: 'asm', fileName: `${params.name}.asm`, content: '' }];
  }
}

const greetingStrategies = {
  c: () => new CGreetingGenerator(),
  asm: () => new AsmGreetingGenerator(),
};

describe('createCodeGenerator', () => {
  it('returns the strategy registered for each code generation type', () => {
    expect(createCodeGenerator('c', greetingStrategies)).toBeInstanceOf(CGreetingGenerator);
    expect(createCodeGenerator('asm', greetingStrategies)).toBeInstanceOf(AsmGreetingGenerator);
  });

  it('returns a new strategy on every call', () => {
    expect(createCodeGenerator('c', greetingStrategies)).not.toBe(createCodeGenerator('c', greetingStrategies));
  });
});
