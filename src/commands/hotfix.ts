import versionService from '@/services/version.js';
import { CliError } from '@/utils/error.js';
import { incrementHotfix, versionToString } from '@/utils/version.js';
import { defineCommand } from '@robingenz/zli';
import consola from 'consola';

export default defineCommand({
  description: 'Increment the hotfix version of the app in all relevant files',
  action: async () => {
    const currentVersion = await versionService.ensureVersionsInSync();

    // Check for hotfix version limit
    const currentHotfix = currentVersion.hotfix || 0;
    if (currentHotfix >= 99) {
      throw new CliError('Cannot increment hotfix version: would exceed maximum value of 99');
    }

    const newVersion = incrementHotfix(currentVersion);

    const versionStr = versionToString(currentVersion);
    const newHotfix = newVersion.hotfix || 0;

    consola.info(`Incrementing hotfix for version ${versionStr} (${currentHotfix} -> ${newHotfix})...`);

    await versionService.setVersion(newVersion);

    consola.success(`Hotfix incremented for version ${versionStr} (now ${newHotfix})`);
  },
});
