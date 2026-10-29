// figlet 1.12 is an ES module with only a default export (a namespace import has no parseFont / textSync)
import figlet from 'figlet';
import { default as standard } from 'figlet/importable-fonts/Standard';

/** Title shown when the cli starts, as ASCII art. */
export function renderTitle(): string {
  figlet.parseFont('Standard', standard);
  return figlet.textSync('Zx-Ide');
}
