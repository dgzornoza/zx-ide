import { DomainError, toDomainError } from 'src/domain/domain-error';
import { parseAsmTilesetData } from 'src/extract-map-tileset/composables/asmTilesetParser';
import { createMapCodeGenerator } from 'src/domain/code-generation/map-tileset/map-tileset-code-generator-factory';
import { createTranslationPrefixFn } from 'src/helpers/vue-utils';
import { useProjectTypeLock } from 'src/shared/composables/useProjectTypeLock';
import { useGeneratedFilesWriter } from 'src/shared/composables/useGeneratedFilesWriter';
import { computed, ref, watch } from 'vue';
import { renderTilesetMapPreviewFromTileData } from 'src/helpers/image-utils';
import type { MapTilesetMetadata } from 'src/extract-map-tileset/models/mapTilesetDefinition';
import { parseAndValidateTiledJson } from './tiledJsonValidation';

function normalizeGlobalTileIds(rawGlobalTileIds: number[]): number[] {
  const normalised: number[] = [];

  for (const globalTileId of rawGlobalTileIds) {
    const safeGlobalTileId = globalTileId ?? 0;
    const localIndex = safeGlobalTileId;

    if (localIndex < 0 || localIndex > 255) {
      throw new DomainError('errorGidOutOfRange');
    }

    normalised.push(localIndex);
  }

  return normalised;
}

export function useExtractMapTileset() {
  // ─── State ───────────────────────────────────────────────────────────────────

  const translate = createTranslationPrefixFn('extract-map-tileset');

  const mapSource = ref('');
  const asmSource = ref('');
  const metadata = ref<MapTilesetMetadata>();
  const tileIndices = ref<number[]>([]);
  const asmRawContent = ref('');
  const tileInkBitmaps = ref<boolean[][]>([]);
  const tileAttributeBytes = ref<number[]>([]);
  const errors = ref<DomainError[]>([]);
  const warnings = ref<DomainError[]>([]);
  const { codeGenerationType, isCodeGenerationTypeReadOnly, useZx0Compression, isZx0CompressionReadOnly } = useProjectTypeLock();
  const { status, writeFiles } = useGeneratedFilesWriter(translate);
  /**
   * Forces the map preview canvas to rerender when incremented.
   * Used as a reactive trigger when loading JSON or ASM files,
   */
  const previewRefreshKey = ref(0);

  const isReady = computed(
    () =>
      errors.value.length === 0 &&
      metadata.value !== undefined &&
      tileIndices.value.length > 0 &&
      mapSource.value !== '' &&
      asmSource.value !== '' &&
      tileInkBitmaps.value.length > 0
  );

  const usedTileCount = computed(() => {
    return new Set(tileIndices.value.filter((index) => index !== 0)).size;
  });

  const mapByteSize = computed(() => tileIndices.value.length);

  /** Bytes occupied by the used tiles (ZX Spectrum: ceil(tileWidth/8) × tileHeight per tile). */
  const usedTilesByteSize = computed(() => {
    if (!metadata.value) return 0;
    const { tileWidth, tileHeight } = metadata.value;
    return usedTileCount.value * Math.ceil(tileWidth / 8) * tileHeight;
  });

  const totalByteSize = computed(() => usedTilesByteSize.value + mapByteSize.value);

  function validateMapVsTileset(tileCount: number): void {
    const maximumMapIndex = Math.max(0, ...tileIndices.value);
    if (maximumMapIndex > tileCount) {
      throw new DomainError('errorAsmTileCountMismatch', [maximumMapIndex, tileCount]);
    }
  }

  function tryDecodeAsmData(): void {
    if (!metadata.value || asmRawContent.value.trim() === '') {
      return;
    }

    const parsed = parseAsmTilesetData(asmRawContent.value, metadata.value.tileWidth, metadata.value.tileHeight);

    validateMapVsTileset(parsed.tileCount);
    tileInkBitmaps.value = parsed.tileInkBitmaps;
    tileAttributeBytes.value = parsed.attributeBytes;
    previewRefreshKey.value += 1;
  }

  // ─── JSON Map File Loading ────────────────────────────────────────────────────

  async function setMapFile(file: File): Promise<void> {
    errors.value = [];
    warnings.value = [];
    metadata.value = undefined;
    tileIndices.value = [];
    tileInkBitmaps.value = [];
    tileAttributeBytes.value = [];
    previewRefreshKey.value += 1;
    mapSource.value = file.name;

    try {
      if (/\.(tmx|xml)$/i.test(file.name)) {
        throw new DomainError('errorJsonRequired');
      }
      if (!/\.json$/i.test(file.name)) {
        throw new DomainError('errorJsonUnsupportedFormat');
      }

      const content = await file.text();
      const parsedMap = parseAndValidateTiledJson(content);
      metadata.value = parsedMap.metadata;

      tileIndices.value = normalizeGlobalTileIds(parsedMap.layer.data);

      tryDecodeAsmData();
    } catch (error) {
      errors.value = [toDomainError(error, 'errorJsonInvalid')];
    }
  }

  // ─── ASM File Loading ─────────────────────────────────────────────────────────

  async function setAsmFile(file: File): Promise<void> {
    errors.value = [];
    warnings.value = [];
    tileInkBitmaps.value = [];
    tileAttributeBytes.value = [];
    previewRefreshKey.value += 1;
    asmSource.value = file.name;

    try {
      if (!/\.asm$/i.test(file.name)) {
        throw new DomainError('errorAsmUnsupportedFormat');
      }

      asmRawContent.value = await file.text();
      tryDecodeAsmData();
    } catch (error) {
      errors.value = [toDomainError(error, 'errorJsonInvalid')];
    }
  }

  // ─── Canvas Rendering ─────────────────────────────────────────────────────────

  function renderPreview(canvas: HTMLCanvasElement): void {
    if (!metadata.value) {
      return;
    }
    renderTilesetMapPreviewFromTileData(canvas, tileIndices.value, metadata.value, tileInkBitmaps.value, tileAttributeBytes.value);
  }

  // ─── Extraction ───────────────────────────────────────────────────────────────

  /**
   * Generates all resource files for the current map and posts them to the
   * VS Code extension as a `writeFilesFromWebview` request.
   */
  async function extractResources(baseName: string): Promise<void> {
    if (!isReady.value || !metadata.value) {
      return;
    }

    const generator = createMapCodeGenerator(codeGenerationType.value);
    const files = generator.generate({
      name: baseName,
      metadata: metadata.value,
      tileIndices: tileIndices.value,
      compressed: useZx0Compression.value,
    });

    writeFiles(files);
  }

  // ─── Watchers ─────────────────────────────────────────────────────────────────

  watch([tileIndices, tileInkBitmaps], () => {
    // Canvas re-render is triggered by the component via renderPreview()
  });

  return {
    mapSource,
    asmSource,
    metadata,
    tileIndices,
    errors,
    warnings,
    codeGenerationType,
    isCodeGenerationTypeReadOnly,
    useZx0Compression,
    isZx0CompressionReadOnly,
    isReady,
    usedTileCount,
    usedTilesByteSize,
    mapByteSize,
    totalByteSize,
    previewRefreshKey,
    status,
    setMapFile,
    setAsmFile,
    renderPreview,
    extractResources,
  };
}
