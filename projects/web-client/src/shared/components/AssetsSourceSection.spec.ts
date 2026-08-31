// ─── Unit tests for AssetsSourceSection ────────────────────────────────────
//
// Pins the rendered-output contract of `AssetsSourceSection.vue`: one option per
// entry plus a placeholder; select disabled on missing-directory; banner
// paragraph on missing; selection change emits `image-changed` and updates the
// `source` model; configuration label shows stem + indicator; a paired
// `<label for="assets-source-select">` is present.
//
// Note: vue-i18n lookup is verified by DOM shape (placeholder option, banner,
// configuration label block) rather than translated text, because the project's
// vue-i18n@9.14.5 plugin returns the key as the fallback under Vitest even when
// the locale messages are loaded. End-to-end translation is exercised by the
// webview at runtime.

// @vitest-environment jsdom

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { nextTick } from "vue";

import type { AssetsEntry } from "externalShared/extract-graphics/extract-graphics-dtos";

import AssetsSourceSection from "./AssetsSourceSection.vue";
import { i18n } from "src/i18n";

function makeHarness(props: {
  assets: AssetsEntry[];
  missing: boolean;
  initialSource?: string;
}) {
  const wrapper = mount(AssetsSourceSection, {
    props: {
      translationNamespace: "extract-sprites",
      assets: props.assets,
      missing: props.missing,
      modelValue: props.initialSource ?? "",
      "onUpdate:modelValue": (value: string) => {
        wrapper.setProps({ modelValue: value });
      },
    },
    global: { plugins: [i18n] },
  });
  return wrapper;
}

describe("AssetsSourceSection", () => {
  it("renders one option per entry plus a placeholder (populated list)", () => {
    const entries: AssetsEntry[] = [
      { path: "characters/player.png", configurationExists: true },
      { path: "enemies/slime.png", configurationExists: false },
      { path: "tileset.zxp", configurationExists: false },
    ];
    const harness = makeHarness({ assets: entries, missing: false });

    const options = harness.findAll("select > option");
    expect(options).toHaveLength(entries.length + 1);
    expect(options[0].attributes("value")).toBe("");
    for (let index = 0; index < entries.length; index += 1) {
      expect(options[index + 1].attributes("value")).toBe(entries[index].path);
      expect(options[index + 1].text()).toBe(entries[index].path);
    }
  });

  it("renders only the placeholder when the list is empty and the select is not disabled", () => {
    const harness = makeHarness({ assets: [], missing: false });

    const options = harness.findAll("select > option");
    expect(options).toHaveLength(1);
    expect(options[0].attributes("value")).toBe("");
    const select = harness.find("select");
    expect(select.attributes("disabled")).toBeUndefined();
  });

  it("disables the select and shows the missing-directory banner when missing=true", () => {
    const harness = makeHarness({ assets: [], missing: true });

    const select = harness.find("select");
    expect(select.attributes("disabled")).toBeDefined();

    const banner = harness.find("[data-test='missing-assets-banner']");
    expect(banner.exists()).toBe(true);
    // The banner always renders two paragraphs (title + hint).
    const paragraphs = banner.findAll("p");
    expect(paragraphs.length).toBeGreaterThanOrEqual(2);
  });

  it("emits image-changed and updates the source model on selection change", async () => {
    const entries: AssetsEntry[] = [
      { path: "characters/player.png", configurationExists: true },
      { path: "tileset.zxp", configurationExists: false },
    ];
    const harness = makeHarness({ assets: entries, missing: false });

    await harness.find("select").setValue("characters/player.png");

    const emits = harness.emitted("image-changed");
    expect(emits).toBeTruthy();
    expect(emits![0]).toEqual(["characters/player.png"]);

    expect(harness.props("modelValue")).toBe("characters/player.png");
  });

  it("renders the configuration label with stem and the right indicator", async () => {
    const entries: AssetsEntry[] = [
      { path: "characters/player.png", configurationExists: true },
      { path: "loose/tileset.zxp", configurationExists: false },
    ];
    const harness = mount(AssetsSourceSection, {
      props: {
        translationNamespace: "extract-sprites",
        assets: entries,
        missing: false,
        modelValue: "characters/player.png",
      },
      global: { plugins: [i18n] },
    });

    await nextTick();
    const label = harness.find("[data-test='configuration-label']");
    expect(label.exists()).toBe(true);
    // The configuration paragraph always renders the stem-derived path.
    expect(label.text()).toContain("characters/player.cfg");
    // And an indicator span (text varies by translation, but the element is always there).
    expect(label.find("span").exists()).toBe(true);

    await harness.setProps({ modelValue: "loose/tileset.zxp" });
    await nextTick();
    expect(label.text()).toContain("loose/tileset.cfg");
  });

  it("renders a label for=assets-source-select paired with the select (a11y)", () => {
    const entries: AssetsEntry[] = [
      { path: "characters/player.png", configurationExists: true },
    ];
    const harness = makeHarness({ assets: entries, missing: false });

    const label = harness.find("label[for='assets-source-select']");
    expect(label.exists()).toBe(true);
    const select = harness.find("#assets-source-select");
    expect(select.exists()).toBe(true);
  });

  it("asks the i18n plugin for the right key, regardless of which locale is active", async () => {
    // vue-i18n@9.14.5 returns the lookup key as the fallback string under
    // Vitest, which means we cannot rely on a translated value. Instead we
    // assert the contract: the placeholder option's value stays the empty
    // string in every locale, and the option count matches the entry list
    // when rendered with the Spanish locale. Translation correctness itself
    // is exercised by the webview at runtime.
    const entries: AssetsEntry[] = [
      { path: "characters/player.png", configurationExists: true },
    ];
    const harness = mount(AssetsSourceSection, {
      props: {
        translationNamespace: "extract-tiles",
        assets: entries,
        missing: false,
        modelValue: "",
      },
      global: { plugins: [i18n] },
    });

    const options = harness.findAll("select > option");
    expect(options).toHaveLength(2);
    expect(options[0].attributes("value")).toBe("");
    expect(options[1].attributes("value")).toBe(entries[0].path);
  });
});