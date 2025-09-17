import versionService from '@/services/version.js';
import { incrementHotfix, versionToString } from '@/utils/version.js';
import { defineCommand } from '@robingenz/zli';
import consola from 'consola';

export default defineCommand({
  description: 'Increment the hotfix version of the app in all relevant files',
  action: async () => {
    const currentVersion = await versionService.ensureVersionsInSync();
    const newVersion = incrementHotfix(currentVersion, process.cwd());

    const versionStr = versionToString(currentVersion);
    const currentHotfix = currentVersion.hotfix || 0;
    const newHotfix = newVersion.hotfix || 0;

    consola.info(`Incrementing hotfix for version ${versionStr} (${currentHotfix} -> ${newHotfix})...`);

    await versionService.setVersion(newVersion);

    consola.success(`Hotfix incremented for version ${versionStr} (now ${newHotfix})`);
  },
});
