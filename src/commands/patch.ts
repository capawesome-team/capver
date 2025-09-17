import versionService from '@/services/version.js';
import { incrementPatch, versionToString } from '@/utils/version.js';
import { defineCommand } from '@robingenz/zli';
import consola from 'consola';

export default defineCommand({
  description: 'Increment the patch version of the app in all relevant files',
  action: async () => {
    const currentVersion = await versionService.ensureVersionsInSync();
    const newVersion = incrementPatch(currentVersion, process.cwd());

    consola.info(
      `Incrementing patch version from ${versionToString(currentVersion)} to ${versionToString(newVersion)}...`,
    );

    await versionService.setVersion(newVersion);

    consola.success(`Patch version incremented to ${versionToString(newVersion)}`);
  },
});
