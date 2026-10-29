import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';
import { ZX_IDE_TEMPLATE_VERSION } from './infrastructure';

// Fingerprint of the project templates released as ZX_IDE_TEMPLATE_VERSION.
// When a template zip changes, increase ZX_IDE_TEMPLATE_VERSION and update both values here.
const releasedTemplates = {
  version: '1.0.0',
  sha256: {
    'sjasmplus_base.zip': '433e575888e6533f2b5b57a93fdcc3c38121de7bea97a1a1671333b31eb89679',
    'sjasmplus_zxspectrum_sample.zip': '7ea233ffc34358ad675d52df2cd4b947c6becd42391d420b85fcf726bf9ea9da',
    'z88dk_base.zip': '6c7f7a3bda1435b513f74e2196aa82f4e798228e827b184141179d2b792c0cee',
    'z88dk_zxspectrum_sample.zip': '83a3340eff78f37433f3e6a122c343dc4be121296eaecfdaa0a565fa59bcb9d6',
  },
};

describe('project templates', () => {
  it('match the fingerprint of the released template version', () => {
    const templatesPath = path.join(__dirname, '..', 'templates');
    const actualHashes = Object.fromEntries(
      fs
        .readdirSync(templatesPath)
        .filter((fileName) => fileName.endsWith('.zip'))
        .map((fileName) => [
          fileName,
          createHash('sha256')
            .update(fs.readFileSync(path.join(templatesPath, fileName)))
            .digest('hex'),
        ])
    );

    expect(actualHashes, 'A template zip changed: increase ZX_IDE_TEMPLATE_VERSION and update the fingerprint in this spec').toEqual(
      releasedTemplates.sha256
    );
    expect(ZX_IDE_TEMPLATE_VERSION).toBe(releasedTemplates.version);
  });
});
