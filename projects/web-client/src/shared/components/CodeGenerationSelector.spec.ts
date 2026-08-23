// ─── Unit tests for CodeGenerationSelector ────────────────────────────────
//
// Pins the UI behaviour that locks the radios and the ZX0 checkbox based on
// the props `readOnly` (locks C/ASM radios) and `isZx0ReadOnly` (locks the
// ZX0 checkbox independently of the chosen target).

// @vitest-environment jsdom

import { mount, type VueWrapper } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { createI18n } from "vue-i18n";

import CodeGenerationSelector from "./CodeGenerationSelector.vue";

const i18n = createI18n({
  legacy: false,
  globalInjection: true,
  locale: "en",
  messages: {
    en: {
      test: {
        codeGenerationTypeLabel: "Code generation",
        codeGenerationTypeC: "C",
        codeGenerationTypeAsm: "ASM",
        codeGenerationTypeReadOnlyHint: "Locked by project type.",
        useZx0CompressionLabel: "Use ZX0 compression",
        useZx0CompressionAsmHint: "ASM doesn't support ZX0.",
        useZx0CompressionReadOnlyHint: "ZX0 is determined by project type.",
      },
    },
  },
});

function factory(props: Record<string, unknown> = {}): VueWrapper {
  return mount(CodeGenerationSelector, {
    props: {
      translationNamespace: "test",
      ...props,
    },
    global: {
      plugins: [i18n],
    },
  });
}

describe("CodeGenerationSelector", () => {
  describe("code generation type radios", () => {
    it("renders both radio options", () => {
      const wrapper = factory();
      const radios = wrapper.findAll('input[type="radio"]');
      expect(radios.length).toBe(2);
    });

    it("enables both radios by default", () => {
      const wrapper = factory();
      for (const radio of wrapper.findAll('input[type="radio"]')) {
        expect((radio.element as HTMLInputElement).disabled).toBe(false);
      }
    });

    it("disables both radios when readOnly=true", () => {
      const wrapper = factory({ readOnly: true });
      for (const radio of wrapper.findAll('input[type="radio"]')) {
        expect((radio.element as HTMLInputElement).disabled).toBe(true);
      }
    });

    it("emits the chosen value via update:codeGenerationType", async () => {
      const wrapper = factory();
      const assemblyRadio = wrapper.find('input[value="asm"]');
      await assemblyRadio.setValue();
      const events = wrapper.emitted("update:codeGenerationType");
      expect(events).toBeTruthy();
      expect(events![0]).toEqual(["asm"]);
    });

    it("shows the read-only hint when readOnly=true", () => {
      const wrapper = factory({ readOnly: true });
      expect(wrapper.text()).toContain("Locked by project type.");
    });

    it("does not show the read-only hint when readOnly=false", () => {
      const wrapper = factory();
      expect(wrapper.text()).not.toContain("Locked by project type.");
    });
  });

  describe("ZX0 compression checkbox", () => {
    it("renders the checkbox enabled by default (c target, no lock)", () => {
      const wrapper = factory();
      const checkbox = wrapper.find('input[type="checkbox"]');
      expect((checkbox.element as HTMLInputElement).disabled).toBe(false);
    });

    it("disables the checkbox when target flips to asm", async () => {
      const wrapper = factory();
      const assemblyRadio = wrapper.find('input[value="asm"]');
      await assemblyRadio.setValue();
      await wrapper.vm.$nextTick();
      const checkbox = wrapper.find('input[type="checkbox"]');
      expect((checkbox.element as HTMLInputElement).disabled).toBe(true);
    });

    it("disables the checkbox when isZx0ReadOnly=true (projectType lock)", () => {
      const wrapper = factory({ isZx0ReadOnly: true });
      const checkbox = wrapper.find('input[type="checkbox"]');
      expect((checkbox.element as HTMLInputElement).disabled).toBe(true);
    });

    it("disables the checkbox when isZx0ReadOnly=true AND target=asm", async () => {
      const wrapper = factory({ isZx0ReadOnly: true });
      const assemblyRadio = wrapper.find('input[value="asm"]');
      await assemblyRadio.setValue();
      await wrapper.vm.$nextTick();
      const checkbox = wrapper.find('input[type="checkbox"]');
      expect((checkbox.element as HTMLInputElement).disabled).toBe(true);
    });

    it("shows the read-only hint when isZx0ReadOnly=true", () => {
      const wrapper = factory({ isZx0ReadOnly: true });
      expect(wrapper.text()).toContain("ZX0 is determined by project type.");
    });

    it("does not show the read-only hint when isZx0ReadOnly=false", () => {
      const wrapper = factory();
      expect(wrapper.text()).not.toContain(
        "ZX0 is determined by project type.",
      );
    });

    it("emits update:useZx0Compression when toggled (no lock)", async () => {
      const wrapper = factory();
      const checkbox = wrapper.find('input[type="checkbox"]');
      await checkbox.setValue(false);
      const events = wrapper.emitted("update:useZx0Compression");
      expect(events).toBeTruthy();
      expect(events![0]).toEqual([false]);
    });
  });
});
