export interface EmotionModel {
  id: number;
  name: string;
  description: string | null;
  isBase: boolean;
  isCustom: boolean;
  createdAt: string;
}