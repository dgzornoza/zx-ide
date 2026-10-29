import { describe, expect, it } from 'vitest';

import { CodeGeneratorStrategy, createCodeGenerator, GeneratedFile } from 'src/domain/code-generation/code-generator-strategy';

interface GreetingParameters {
  name: string;
}

class CGreetingGenerator implements CodeGeneratorStrategy<GreetingParameters> {
  generate(parameters: GreetingParameters): GeneratedFile[] {
    return [{ fileType: 'c-header', fileName: `${parameters.name}.h`, content: '' }];
  }
}

class AsmGreetingGenerator implements CodeGeneratorStrategy<GreetingParameters> {
  generate(parameters: GreetingParameters): GeneratedFile[] {
    return [{ fileType: 'asm', fileName: `${parameters.name}.asm`, content: '' }];
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
