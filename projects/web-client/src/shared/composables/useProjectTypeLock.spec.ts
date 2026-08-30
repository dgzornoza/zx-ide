// ─── Unit tests for useProjectTypeLock ─────────────────────────────────────
//
// Pins the lifecycle behaviour of `useProjectTypeLock`: an InitMessage from
// the VS Code bridge must force the local code-generation refs to match the
// declared project type, while non-init messages and missing projectType must
// leave the refs untouched (so standalone / dev-mode keeps working).

// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";

import { useProjectTypeLock } from "./useProjectTypeLock";

interface ProjectTypeLock {
  codeGenerationType: { value: "asm" | "c" };
  isCodeGenerationTypeReadOnly: { value: boolean };
  useZx0Compression: { value: boolean };
  isZx0CompressionReadOnly: { value: boolean };
}

function dispatchInit(projectType: "sjasmplus" | "z88dk") {
  window.dispatchEvent(
    new MessageEvent("message", {
      data: { messageType: "initFromExtension", projectType },
    }),
  );
}

function setupHarness() {
  let lock!: ProjectTypeLock;
  const Host = defineComponent({
    setup() {
      lock = useProjectTypeLock() as unknown as ProjectTypeLock;
      return () => h("div");
    },
  });
  const wrapper = mount(Host);
  return { wrapper, lock };
}

describe("useProjectTypeLock", () => {
  afterEach(() => {
    // Each test owns its own mount; nothing to clean besides clearing mocks.
    vi.restoreAllMocks();
  });

  it("starts with sensible defaults (c, ro=false, zx0=true, zx0ro=false)", () => {
    const { lock } = setupHarness();
    expect(lock.codeGenerationType.value).toBe("c");
    expect(lock.isCodeGenerationTypeReadOnly.value).toBe(false);
    expect(lock.useZx0Compression.value).toBe(true);
    expect(lock.isZx0CompressionReadOnly.value).toBe(false);
  });

  it("locks to asm + readonly + zx0 off when projectType is sjasmplus", async () => {
    const { lock, wrapper } = setupHarness();
    dispatchInit("sjasmplus");
    await nextTick();
    await wrapper.vm.$nextTick();
    expect(lock.codeGenerationType.value).toBe("asm");
    expect(lock.isCodeGenerationTypeReadOnly.value).toBe(true);
    expect(lock.useZx0Compression.value).toBe(false);
    expect(lock.isZx0CompressionReadOnly.value).toBe(true);
  });

  it("locks to c + readonly + zx0 on when projectType is z88dk", async () => {
    const { lock, wrapper } = setupHarness();
    dispatchInit("z88dk");
    await nextTick();
    await wrapper.vm.$nextTick();
    expect(lock.codeGenerationType.value).toBe("c");
    expect(lock.isCodeGenerationTypeReadOnly.value).toBe(true);
    expect(lock.useZx0Compression.value).toBe(true);
    expect(lock.isZx0CompressionReadOnly.value).toBe(true);
  });

  it("leaves refs untouched when projectType is undefined", async () => {
    const { lock, wrapper } = setupHarness();
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { messageType: "initFromExtension" },
      }),
    );
    await nextTick();
    await wrapper.vm.$nextTick();
    expect(lock.codeGenerationType.value).toBe("c");
    expect(lock.isCodeGenerationTypeReadOnly.value).toBe(false);
    expect(lock.useZx0Compression.value).toBe(true);
    expect(lock.isZx0CompressionReadOnly.value).toBe(false);
  });

  it("ignores non-init messages", async () => {
    const { lock, wrapper } = setupHarness();
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { messageType: "writeFilesFromWebview", codeFiles: [] },
      }),
    );
    await nextTick();
    await wrapper.vm.$nextTick();
    expect(lock.codeGenerationType.value).toBe("c");
    expect(lock.isCodeGenerationTypeReadOnly.value).toBe(false);
    expect(lock.useZx0Compression.value).toBe(true);
    expect(lock.isZx0CompressionReadOnly.value).toBe(false);
  });

  it("ignores messages with null or undefined data", async () => {
    const { lock, wrapper } = setupHarness();
    window.dispatchEvent(new MessageEvent("message", { data: null }));
    window.dispatchEvent(new MessageEvent("message", { data: undefined }));
    await nextTick();
    await wrapper.vm.$nextTick();
    expect(lock.codeGenerationType.value).toBe("c");
    expect(lock.isCodeGenerationTypeReadOnly.value).toBe(false);
    expect(lock.isZx0CompressionReadOnly.value).toBe(false);
  });

  it("removes the message listener on unmount", async () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { lock, wrapper } = setupHarness();
    wrapper.unmount();
    expect(removeSpy).toHaveBeenCalledWith("message", expect.any(Function));

    // After unmount, dispatching an init must NOT change the captured refs.
    dispatchInit("sjasmplus");
    await nextTick();
    expect(lock.codeGenerationType.value).toBe("c");
    expect(lock.isZx0CompressionReadOnly.value).toBe(false);
  });
});
