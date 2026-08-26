export interface MoodEntryModel {
  id: number;
  userId: number;
  occurredAt: string;  // ISO 8601 UTC
  localDate: string;    // YYYY-MM-DD
  intensity: number;    // 1-10
  note: string | null;
  createdAt: string;
}