import { Migration } from './migration.interface';
import { migration001CreateUsers } from './001-create-users';
import { migration002CreateEmotions } from './002-create-emotions';
import { migration003CreateCombinations } from './003-create-combinations';
import { migration004CreateCombinationComponents } from './004-create-combination-components';
import { migration005CreateColorPalette } from './005-create-color-palette';
import { migration006CreateMoodEntries } from './006-create-mood-entries';
import { migration007CreateMoodEntryEmotions } from './007-create-mood-entry-emotions';
import { migration008CreateUserEmotionColors } from './008-create-user-emotion-colors';
import { migration009CreateIndexes } from './009-create-indexes';
import { migration010SeedBaseData } from './010-seed-base-data';
import { migration011CreateAppSettings } from './011-create-app-settings';
import { migration012SeedColorPalette } from './012-seed-color-palette';
import { migration013SeedCombinations } from './013-seed-combinations';

export const MIGRATIONS: Migration[] = [
  migration001CreateUsers,
  migration002CreateEmotions,
  migration003CreateCombinations,
  migration004CreateCombinationComponents,
  migration005CreateColorPalette,
  migration006CreateMoodEntries,
  migration007CreateMoodEntryEmotions,
  migration008CreateUserEmotionColors,
  migration009CreateIndexes,
  migration010SeedBaseData,
  migration011CreateAppSettings,
  migration012SeedColorPalette,  
  migration013SeedCombinations,
];