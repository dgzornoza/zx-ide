import { createTranslationPrefixFn } from 'src/helpers/vue-utils';
import { useProjectTypeLock } from 'src/shared/composables/useProjectTypeLock';
import { useGeneratedFilesWriter } from 'src/shared/composables/useGeneratedFilesWriter';
import { createSpritesCodeGenerator } from 'src/domain/code-generation/sprites/sprites-code-generator-factory';
import type { SpritesCodeGeneratorParameters } from 'src/domain/code-generation/sprites/sprites-code-generation';
import { SpriteChanges, SpriteDefinition, SpriteFlags, SpriteFrameChanges } from 'src/shared/models/spriteDefinition';
import { reactive, ref } from 'vue';

export function useCreateSprites() {
  const translate = createTranslationPrefixFn('create-sprites');

  const state = reactive({
    sprites: [] as SpriteDefinition[],
  });

  const { status, setStatus, clearStatus, writeFiles } = useGeneratedFilesWriter(translate);
  const { codeGenerationType, isCodeGenerationTypeReadOnly, useZx0Compression, isZx0CompressionReadOnly } = useProjectTypeLock();
  const binaryText = ref('');
  const outputName = ref('sprites');
  /** Combined sprite flags (SP1 padding, Use mask) forwarded to the generator. */
  const spriteFlags = ref<number>(SpriteFlags.None);
  /** Index of the sprite that receives the next "Add" from the BinaryInputPanel. */
  const activeSpriteIndex = ref(-1);

  function addSprite() {
    const newSprite: SpriteDefinition = {
      _id: crypto.randomUUID(),
      name: '',
      width: 0,
      height: 0,
      frames: [],
    };
    state.sprites.push(newSprite);
    activeSpriteIndex.value = state.sprites.length - 1;
  }

  function removeSprite(index: number) {
    state.sprites.splice(index, 1);
    if (activeSpriteIndex.value > index) {
      // Removed sprite was before the active one — shift the pointer down
      // so the "Active" badge stays on the same sprite.
      activeSpriteIndex.value -= 1;
    } else if (activeSpriteIndex.value >= state.sprites.length) {
      activeSpriteIndex.value = state.sprites.length - 1;
    }
  }

  /** Applies the fields edited in the sprite editor to the sprite at the given index. */
  function updateSprite(spriteIndex: number, changes: SpriteChanges) {
    const sprite = state.sprites[spriteIndex];
    if (!sprite) return;
    Object.assign(sprite, changes);
  }

  /** Applies the coordinates edited in the sprite editor to one frame. */
  function updateSpriteFrame(spriteIndex: number, frameIndex: number, changes: SpriteFrameChanges) {
    const frame = state.sprites[spriteIndex]?.frames[frameIndex];
    if (!frame) return;
    Object.assign(frame, changes);
  }

  function removeFrame(spriteIndex: number, frameIndex: number) {
    const sprite = state.sprites[spriteIndex];
    if (!sprite) return;
    sprite.frames.splice(frameIndex, 1);
  }

  /**
   * Called when the user clicks the per-sprite "Add frame" button in the
   * shared SpritesEditorSection. The button does not produce an empty frame;
   * it only marks the sprite as active so the next frame coming from the
   * BinaryInputPanel lands in it.
   */
  function addSpriteFrame(spriteIndex: number) {
    if (spriteIndex < 0 || spriteIndex >= state.sprites.length) return;
    activeSpriteIndex.value = spriteIndex;
  }

  /**
   * Adds a frame to the active sprite.
   * Auto-creates a sprite if none exists yet.
   * Rejects frames whose dimensions don't match the first frame of the sprite.
   */
  function addFrame(inkBitmap: boolean[], width: number, height: number, preview: string): void {
    // Auto-create a sprite if there is none
    if (state.sprites.length === 0 || activeSpriteIndex.value < 0) {
      addSprite();
    }

    const sprite = state.sprites[activeSpriteIndex.value];
    if (!sprite) return;

    // Validate dimensions against the sprite's current width/height.
    // On the first frame, adopt the bitmap dimensions as the sprite size.
    if (sprite.frames.length > 0) {
      if (sprite.width !== width || sprite.height !== height) {
        setStatus('error', translate('errorDimensionMismatch'));
        return;
      }
    } else {
      sprite.width = width;
      sprite.height = height;
    }

    sprite.frames.push({ x: 0, y: 0, bitmap: { inkBitmap, preview } });
    // Clear the binary input so the next frame starts from a clean slate.
    binaryText.value = '';
    clearStatus();
  }

  async function generateCode() {
    const sprites = state.sprites.filter((sprite) => sprite.frames.length > 0);

    if (sprites.length === 0) {
      setStatus('error', translate('errorNoSprites'));
      return;
    }

    // Build SpritesCodeGeneratorParameters. Each frame is reduced to (x=0, y=0)
    // because the pixel data lives in spriteBitmasks, which we derive from
    // the per-frame bitmap attached by addFrame().
    const generatorParameters: SpritesCodeGeneratorParameters = {
      name: outputName.value.trim() || 'sprites',
      sprites: sprites.map((sprite) => ({
        _id: sprite._id,
        name: sprite.name || sprite._id || '',
        width: sprite.width,
        height: sprite.height,
        frames: sprite.frames.map(() => ({ x: 0, y: 0 })),
      })),
      spriteFlags: spriteFlags.value,
      spriteBitmasks: sprites.map((sprite) => sprite.frames.map((frame) => frame.bitmap?.inkBitmap ?? [])),
      compressed: useZx0Compression.value,
    };

    const generator = createSpritesCodeGenerator(codeGenerationType.value);
    const codeFiles = generator.generate(generatorParameters);

    writeFiles(codeFiles);
  }

  return {
    state,
    status,
    binaryText,
    outputName,
    codeGenerationType,
    isCodeGenerationTypeReadOnly,
    useZx0Compression,
    isZx0CompressionReadOnly,
    spriteFlags,
    activeSpriteIndex,
    translate,
    addSprite,
    removeSprite,
    updateSprite,
    updateSpriteFrame,
    removeFrame,
    addSpriteFrame,
    addFrame,
    generateCode,
  };
}
