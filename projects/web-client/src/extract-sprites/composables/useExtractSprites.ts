import { FileEntry } from 'externalShared/extract-graphics/extract-graphics-dtos';
import { basenameFromPath } from 'src/helpers/file-utils';
import { imageBytesToFile } from 'src/helpers/image-utils';
import { createTranslationPrefixFn } from 'src/helpers/vue-utils';
import { createSpritesCodeGenerator } from 'src/domain/code-generation/sprites/sprites-code-generator-factory';
import { parseSpritesConfiguration } from 'src/domain/graphics-configuration/sprites-configuration';
import { useProjectTypeLock } from 'src/shared/composables/useProjectTypeLock';
import { useGeneratedFilesWriter } from 'src/shared/composables/useGeneratedFilesWriter';
import { SpriteChanges, SpriteDefinition, SpriteFlags, SpriteFrameChanges } from 'src/shared/models/spriteDefinition';
import { onMounted, reactive, ref } from 'vue';
import { convertZxpFileToImageFile, extractSpritesFromFile } from '../../helpers/image-utils';

/**
 * Composable that manages the full state and business logic for the
 * extract-sprites page.
 */
export function useExtractSprites() {
  /** Namespaced translation helper for the extract-sprites scope. */
  const translate = createTranslationPrefixFn('extract-sprites');

  const state = reactive({
    source: '',
    mapSource: '',
    sprites: [] as SpriteDefinition[],
  });

  /** The last source File chosen by the user (PNG or converted-from-ZXP PNG), kept for sprite frame preview extraction. */
  const currentImageFile = ref<File | undefined>(undefined);

  const { status, setStatus, writeFiles } = useGeneratedFilesWriter(translate);
  const { codeGenerationType, isCodeGenerationTypeReadOnly, useZx0Compression, isZx0CompressionReadOnly } = useProjectTypeLock();
  const spriteFlags = ref<number>(SpriteFlags.None);

  // ─── Load map ──────────────────────────────────────────────────────────────

  /**
   * Parses a `.cfg` file and restores sprite configuration from it.
   */
  const setMapFile = async (file: File): Promise<void> => {
    try {
      const mapData = parseSpritesConfiguration(await file.text());

      // Restore sprites — inject fresh runtime _id for each
      state.sprites.splice(
        0,
        state.sprites.length,
        ...mapData.sprites.map((sprite) => ({
          ...sprite,
          _id: crypto.randomUUID(),
        }))
      );
      spriteFlags.value = mapData.spriteFlags ?? SpriteFlags.None;
    } catch {
      setStatus('error', translate('errorMapLoadFailed'));
    }
  };

  // ─── Source file ───────────────────────────────────────────────────────────

  /**
   * Stores the selected source file for use in sprite frame previews.
   * `.zxp` files are converted to an in-memory PNG before storing so that
   * the rest of the pipeline (previews, bitmask extraction) works unchanged.
   */
  const setSourceImage = async (path: string, bytes: Uint8Array): Promise<void> => {
    try {
      const basename = basenameFromPath(path);
      const zxpFile = imageBytesToFile(bytes, basename);
      if (zxpFile.type === '') {
        // ZXP: convert to an in-memory PNG via the existing helper so the
        // downstream pipeline keeps working with PNGs.
        currentImageFile.value = await convertZxpFileToImageFile(zxpFile);
      } else {
        currentImageFile.value = zxpFile;
      }

      state.source = path;
      await extractFromCurrentImage();
    } catch (error) {
      console.error('Source image load failed:', error);
      setStatus('error', translate('errorSourceFileLoad'));
    }
  };

  /**
   * Re-runs the bitmask extraction for the currently loaded source image.
   * Used after `setSourceImage` swaps the file, and exposed for any future
   * callers (e.g. tile-size changes that need a re-extract).
   */
  const extractFromCurrentImage = async (): Promise<void> => {
    if (!currentImageFile.value) return;
    await extractSpritesFromFile(
      currentImageFile.value,
      state.sprites.map((sprite) =>
        sprite.frames.map((frame) => ({
          x: frame.x,
          y: frame.y,
          width: sprite.width,
          height: sprite.height,
        }))
      )
    );
  };

  // ─── Sprite actions ────────────────────────────────────────────────────────

  /** Returns a new sprite definition initialised with default values and one empty frame. */
  const createSprite = (): SpriteDefinition => ({
    _id: crypto.randomUUID(),
    name: '',
    width: 8,
    height: 8,
    frames: [{ x: 0, y: 0 }],
  });

  /** Appends a new default sprite to the sprites list. */
  const addSprite = () => state.sprites.push(createSprite());

  /** Removes the sprite at the given index from the sprites list. */
  const removeSprite = (index: number) => state.sprites.splice(index, 1);

  /** Applies the fields edited in the sprite editor to the sprite at the given index. */
  const updateSprite = (spriteIndex: number, changes: SpriteChanges) => {
    const sprite = state.sprites[spriteIndex];
    if (!sprite) return;
    Object.assign(sprite, changes);
  };

  /** Applies the coordinates edited in the sprite editor to one frame. */
  const updateSpriteFrame = (spriteIndex: number, frameIndex: number, changes: SpriteFrameChanges) => {
    const frame = state.sprites[spriteIndex]?.frames[frameIndex];
    if (!frame) return;
    Object.assign(frame, changes);
  };

  /** Appends a new default frame to the sprite at the given index. */
  const addSpriteFrame = (spriteIndex: number) => {
    const sprite = state.sprites[spriteIndex];
    if (!sprite) return;
    sprite.frames.push({ x: 0, y: 0 });
  };

  /** Removes the frame at frameIndex from the sprite at spriteIndex. */
  const removeSpriteFrame = (spriteIndex: number, frameIndex: number) => {
    const sprite = state.sprites[spriteIndex];
    if (!sprite) return;
    sprite.frames.splice(frameIndex, 1);
  };

  // ─── Create map ────────────────────────────────────────────────────────────

  /**
   * Generates all resource files for the current sprites and posts them to
   * the VS Code extension as a `writeFilesFromWebview` request.
   */
  const extractResources = async () => {
    if (!currentImageFile.value) {
      setStatus('error', translate('errorNoSourceFile'));
      return;
    }

    const fileNameWithoutExtension = currentImageFile.value.name.replace(/\.[^.]+$/, '');

    const generator = createSpritesCodeGenerator(codeGenerationType.value);
    const spriteBitmasks = await extractSpritesFromFile(
      currentImageFile.value,
      state.sprites.map((sprite) =>
        sprite.frames.map((frame) => ({
          x: frame.x,
          y: frame.y,
          width: sprite.width,
          height: sprite.height,
        }))
      )
    );
    const codeFiles: FileEntry[] = generator.generate({
      name: fileNameWithoutExtension,
      sprites: state.sprites,
      spriteFlags: spriteFlags.value,
      spriteBitmasks,
      compressed: useZx0Compression.value,
    });

    writeFiles(codeFiles);
  };

  // ─── Lifecycle ────────────────────────────────────────────────────────────

  onMounted(() => {
    if (!state.sprites.length) addSprite();
  });

  return {
    state,
    status,
    codeGenerationType,
    isCodeGenerationTypeReadOnly,
    useZx0Compression,
    isZx0CompressionReadOnly,
    spriteFlags,
    currentImageFile,
    translate,
    setSourceImage,
    setMapFile,
    addSprite,
    removeSprite,
    updateSprite,
    updateSpriteFrame,
    addSpriteFrame,
    removeSpriteFrame,
    extractResources,
  };
}
