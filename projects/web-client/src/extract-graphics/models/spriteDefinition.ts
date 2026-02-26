export interface SpriteDefinition {
  /** Internal runtime ID used as a stable v-for key. Not included in serialized output. */
  _id?: string;
  name: string;
  width: number;
  height: number;
  frames: SpriteFrame[];
}

export interface SpriteFrame {
  column: number;
  row: number;
}
