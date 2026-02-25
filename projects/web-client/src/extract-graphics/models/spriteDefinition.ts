export interface SpriteDefinition {
  name: string;
  width: number;
  height: number;
  frames: SpriteFrame[];
}

export interface SpriteFrame {
  column: number;
  row: number;
}
