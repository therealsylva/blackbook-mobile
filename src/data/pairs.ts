export interface MajorPair {
  id: string;
  title: string;
  left: string;
  right: string;
}

export const MAJOR_PAIRS: MajorPair[] = [
  { id: 'el-clasico', title: 'El Clásico', left: 'RMD', right: 'BAR' },
  { id: 'manchester-derby', title: 'Manchester derby', left: 'MCI', right: 'MUN' },
  { id: 'nba-rivalry', title: 'NBA rivalry', left: 'LAL', right: 'BOS' },
];
