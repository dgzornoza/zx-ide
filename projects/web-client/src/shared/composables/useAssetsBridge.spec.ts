// ─── Unit tests for useAssetsBridge ────────────────────────────────────────
//
// Pins the lifecycle behaviour of `useAssetsBridge`: an `AssetsListMessage` from
// the VS Code bridge must populate the local `assets` and `missing` refs, while
// non-bridge messages and a missing list must leave the refs at their defaults.
// The `requestAssetBytes` API must post a `readAssetRequest` and resolve when
// the matching `readAssetResponse` arrives.

// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defineComponent, h, nextTick } from "vue";

import type {
  AssetsEntry,
  ReadAssetResponseMessage,
} from "externalShared/extract-graphics/extract-graphics-dtos";

import { useAssetsBridge } from "./useAssetsBridge";

interface AssetsBridge {
  assets: { value: AssetsEntry[] };
  missing: { value: boolean };
  requestAssetBytes(path: string): Promise<Uint8Array>;
}

function dispatchList(payload: {
  assets: AssetsEntry[];
  missing?: boolean;
}) {
  window.dispatchEvent(
    new MessageEvent("message", {
      data: { messageType: "assetsListFromExtension", ...payload },
    }),
  );
}

function dispatchResponse(payload: {
  path: string;
  requestId: string;
  contentBase64?: string;
  error?: string;
}) {
  const data: ReadAssetResponseMessage = {
    messageType: "readAssetResponseFromExtension",
    ...payload,
  };
  window.dispatchEvent(new MessageEvent("message", { data }));
}

function setupHarness() {
  let bridge!: AssetsBridge;
  const postSpy = vi.fn();
  const Host = defineComponent({
    setup() {
      bridge = useAssetsBridge(
        { postMessage: postSpy, isAvailable: true },
      ) as unknown as AssetsBridge;
      return () => h("div");
    },
  });
  const wrapper = mount(Host);
  return { wrapper, bridge, postSpy };
}

describe("useAssetsBridge", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("starts with empty defaults (assets=[], missing=false)", () => {
    const { bridge } = setupHarness();
    expect(bridge.assets.value).toEqual([]);
    expect(bridge.missing.value).toBe(false);
  });

  it("reflects an AssetsListMessage payload into the refs", async () => {
    const { bridge, wrapper } = setupHarness();
    const entries: AssetsEntry[] = [
      { path: "characters/player.png", configurationExists: true },
      { path: "tileset.zxp", configurationExists: false },
    ];
    dispatchList({ assets: entries, missing: true });
    await nextTick();
    await wrapper.vm.$nextTick();
    expect(bridge.assets.value).toEqual(entries);
    expect(bridge.missing.value).toBe(true);
  });

  it("reflects a populated list with missing=false", async () => {
    const { bridge, wrapper } = setupHarness();
    const entries: AssetsEntry[] = [
      { path: "a.png", configurationExists: false },
    ];
    dispatchList({ assets: entries });
    await nextTick();
    await wrapper.vm.$nextTick();
    expect(bridge.assets.value).toEqual(entries);
    expect(bridge.missing.value).toBe(false);
  });

  it("ignores non-bridge messages", async () => {
    const { bridge, wrapper } = setupHarness();
    window.dispatchEvent(
      new MessageEvent("message", {
        data: { messageType: "initFromExtension", projectType: "sjasmplus" },
      }),
    );
    await nextTick();
    await wrapper.vm.$nextTick();
    expect(bridge.assets.value).toEqual([]);
    expect(bridge.missing.value).toBe(false);
  });

  it("ignores messages with null or undefined data", async () => {
    const { bridge, wrapper } = setupHarness();
    window.dispatchEvent(new MessageEvent("message", { data: null }));
    window.dispatchEvent(new MessageEvent("message", { data: undefined }));
    await nextTick();
    await wrapper.vm.$nextTick();
    expect(bridge.assets.value).toEqual([]);
    expect(bridge.missing.value).toBe(false);
  });

  it("removes the message listener on unmount and stops observing further messages", async () => {
    const removeSpy = vi.spyOn(window, "removeEventListener");
    const { bridge, wrapper } = setupHarness();
    wrapper.unmount();
    expect(removeSpy).toHaveBeenCalledWith("message", expect.any(Function));

    // After unmount, dispatching a list message must NOT change the captured refs.
    dispatchList({
      assets: [{ path: "characters/player.png", configurationExists: false }],
      missing: true,
    });
    await Promise.resolve();
    expect(bridge.assets.value).toEqual([]);
    expect(bridge.missing.value).toBe(false);
  });

  it("requestAssetBytes posts a readAssetRequest with a fresh non-empty requestId", () => {
    const { bridge, postSpy } = setupHarness();

    void bridge.requestAssetBytes("characters/player.png");

    expect(postSpy).toHaveBeenCalledTimes(1);
    const payload = postSpy.mock.calls[0][0];
    expect(payload).toMatchObject({
      messageType: "readAssetRequestFromWebview",
      path: "characters/player.png",
    });
    expect(typeof payload.requestId).toBe("string");
    expect(payload.requestId.length).toBeGreaterThan(0);
  });

  it("resolves requestAssetBytes when a matching readAssetResponse arrives", async () => {
    const { bridge, postSpy } = setupHarness();

    const promise = bridge.requestAssetBytes("characters/player.png");
    const requestId = postSpy.mock.calls[0][0].requestId;

    // Build a base64 payload that decodes to a known byte sequence.
    const bytes = new Uint8Array([0x01, 0x02, 0x03]);
    let binary = "";
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    const contentBase64 = btoa(binary);

    dispatchResponse({ path: "characters/player.png", requestId, contentBase64 });

    await expect(promise).resolves.toEqual(bytes);
  });

  it("ignores a readAssetResponse whose requestId does not match any pending request", async () => {
    const { bridge, postSpy } = setupHarness();

    const promise = bridge.requestAssetBytes("characters/player.png");
    const requestId = postSpy.mock.calls[0][0].requestId;
    expect(requestId).toBeTruthy();

    // Dispatch an UNRELATED response — different requestId.
    dispatchResponse({
      path: "characters/player.png",
      requestId: "different-id-does-not-match",
      contentBase64: btoa("ignored"),
    });

    // The original promise must still be pending (no resolution, no rejection).
    let settled = false;
    promise.then(
      () => {
        settled = true;
      },
      () => {
        settled = true;
      },
    );
    await Promise.resolve();
    expect(settled).toBe(false);
  });

  it("rejects the pending promise when a readAssetResponse carries an error", async () => {
    const { bridge, postSpy } = setupHarness();

    const promise = bridge.requestAssetBytes("characters/player.png");
    const requestId = postSpy.mock.calls[0][0].requestId;

    dispatchResponse({
      path: "characters/player.png",
      requestId,
      error: "file not found",
    });

    await expect(promise).rejects.toThrow("file not found");
  });

  it("resolves concurrent requests independently (cross-delivery rejection)", async () => {
    const { bridge, postSpy } = setupHarness();

    const promiseA = bridge.requestAssetBytes("characters/player.png");
    const promiseB = bridge.requestAssetBytes("tileset.zxp");

    const requestIdA = postSpy.mock.calls[0][0].requestId;
    const requestIdB = postSpy.mock.calls[1][0].requestId;
    expect(requestIdA).not.toBe(requestIdB);

    // Deliver B's response first — A must remain pending.
    const bytesB = new Uint8Array([0xaa, 0xbb]);
    let binary = "";
    for (const byte of bytesB) {
      binary += String.fromCharCode(byte);
    }
    dispatchResponse({
      path: "tileset.zxp",
      requestId: requestIdB,
      contentBase64: btoa(binary),
    });

    let aSettled = false;
    promiseA.then(
      () => {
        aSettled = true;
      },
      () => {
        aSettled = true;
      },
    );
    await expect(promiseB).resolves.toEqual(bytesB);
    await Promise.resolve();
    expect(aSettled).toBe(false);

    // Now deliver A's response — A resolves.
    const bytesA = new Uint8Array([0x01, 0x02]);
    let binaryA = "";
    for (const byte of bytesA) {
      binaryA += String.fromCharCode(byte);
    }
    dispatchResponse({
      path: "characters/player.png",
      requestId: requestIdA,
      contentBase64: btoa(binaryA),
    });
    await expect(promiseA).resolves.toEqual(bytesA);
  });
});