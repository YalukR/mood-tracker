export interface Migration {
  version: number;
  name: string;
  statements: string[];
}