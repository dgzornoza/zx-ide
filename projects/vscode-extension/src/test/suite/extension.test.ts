import * as assert from 'assert';
import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';

interface ExtensionManifest {
  publisher: string;
  name: string;
  contributes: { commands: { command: string }[] };
}

const extensionRoot = path.resolve(__dirname, '../../../');
const manifest: ExtensionManifest = JSON.parse(fs.readFileSync(path.join(extensionRoot, 'package.json'), 'utf8'));

suite('Extension activation', () => {
  test('registers every command contributed in package.json', async () => {
    const extension = vscode.extensions.getExtension(`${manifest.publisher}.${manifest.name}`);
    assert.ok(extension, 'extension not found');
    await extension.activate();

    const registeredCommands = await vscode.commands.getCommands(true);
    const missingCommands = manifest.contributes.commands
      .map((contribution) => contribution.command)
      .filter((command) => !registeredCommands.includes(command));

    assert.deepStrictEqual(missingCommands, []);
  });
});
