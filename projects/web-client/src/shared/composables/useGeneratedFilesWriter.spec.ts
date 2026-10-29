// @vitest-environment jsdom
import { mount } from '@vue/test-utils';
import type { FileEntry, WriteFilesResultMessage } from 'externalShared/extract-graphics/extract-graphics-dtos';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { defineComponent, h, isReadonly } from 'vue';

import { createVsCodeBridge } from '../../bridge/vscode';
import { i18n } from 'src/i18n';
import { useGeneratedFilesWriter } from './useGeneratedFilesWriter';

vi.mock('../../bridge/vscode', () => ({
  createVsCodeBridge: vi.fn(),
}));

const mockedCreateVsCodeBridge = vi.mocked(createVsCodeBridge);

const codeFiles: FileEntry[] = [{ fileType: 'asm', fileName: 'hud.asm', content: '; hud' }];

function installBridge(isAvailable: boolean) {
  const bridge = { isAvailable, postMessage: vi.fn() };
  mockedCreateVsCodeBridge.mockReturnValue(bridge);
  return bridge;
}

function setupHarness() {
  let writer!: ReturnType<typeof useGeneratedFilesWriter>;
  const Host = defineComponent({
    setup() {
      writer = useGeneratedFilesWriter((key) => `page.${key}`);
      return () => h('div');
    },
  });
  const wrapper = mount(Host, { global: { plugins: [i18n] } });
  return { writer, wrapper };
}

function postWriteFilesResult(data: WriteFilesResultMessage) {
  window.dispatchEvent(new MessageEvent('message', { data }));
}

describe('useGeneratedFilesWriter', () => {
  beforeEach(() => {
    mockedCreateVsCodeBridge.mockReset();
  });

  it('posts the files to the extension and shows no status until the reply arrives', () => {
    const bridge = installBridge(true);
    const { writer } = setupHarness();

    writer.writeFiles(codeFiles);

    expect(bridge.postMessage).toHaveBeenCalledWith({ messageType: 'writeFilesFromWebview', codeFiles });
    expect(writer.status.value).toBeUndefined();
  });

  it('shows the success text when the extension reports the files were written', () => {
    installBridge(true);
    const { writer } = setupHarness();
    writer.writeFiles(codeFiles);

    postWriteFilesResult({ messageType: 'writeFilesResultFromExtension', success: true });

    expect(writer.status.value).toEqual({ type: 'success', text: 'page.statusSent' });
  });

  it('shows the error reported by the extension', () => {
    installBridge(true);
    const { writer } = setupHarness();
    writer.writeFiles(codeFiles);

    postWriteFilesResult({ messageType: 'writeFilesResultFromExtension', success: false, error: 'EACCES: permission denied' });

    expect(writer.status.value).toEqual({ type: 'error', text: 'EACCES: permission denied' });
  });

  it('shows an error and posts nothing outside VS Code', () => {
    const bridge = installBridge(false);
    const { writer } = setupHarness();

    writer.writeFiles(codeFiles);

    expect(bridge.postMessage).not.toHaveBeenCalled();
    expect(writer.status.value).toEqual({ type: 'error', text: 'page.errorVsCodeRequired' });
  });

  it('exposes a read-only status changed only through setStatus and clearStatus', () => {
    installBridge(true);
    const { writer } = setupHarness();

    writer.setStatus('error', 'invalid sprite');
    expect(writer.status.value).toEqual({ type: 'error', text: 'invalid sprite' });
    expect(isReadonly(writer.status)).toBe(true);

    writer.clearStatus();
    expect(writer.status.value).toBeUndefined();
  });

  it('ignores write results after the page is unmounted', () => {
    installBridge(true);
    const { writer, wrapper } = setupHarness();
    writer.writeFiles(codeFiles);

    wrapper.unmount();
    postWriteFilesResult({ messageType: 'writeFilesResultFromExtension', success: true });

    expect(writer.status.value).toBeUndefined();
  });
});
