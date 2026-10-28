import type * as vscode from 'vscode';

/**
 * `true` when `definition` is the z88dk `make` task (sdcc or sccz80 compiler).
 * Task definitions from other providers may have no `id`; they are ignored.
 */
export function isZ88dkMakeTask(definition: vscode.TaskDefinition): boolean {
  const taskId: unknown = definition.id;
  if (typeof taskId !== 'string') {
    return false;
  }
  return taskId.includes('make') && (taskId.includes('COMPILER=sdcc') || taskId.includes('COMPILER=sccz80'));
}
