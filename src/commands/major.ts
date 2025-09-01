import versionService from '@/services/version.js';
import { incrementMajor, versionToString } from '@/utils/version.js';
import { defineCommand } from '@robingenz/zli';
import consola from 'consola';

export default defineCommand({
  description: 'Increment the major version of the app in all relevant files',
  action: async () => {
    const currentVersion = await versionService.ensureVersionsInSync();
    const newVersion = incrementMajor(currentVersion);

    consola.info(
      `Incrementing major version from ${versionToString(currentVersion)} to ${versionToString(newVersion)}...`,
    );

    await versionService.setVersion(newVersion);

    consola.success(`Major version incremented to ${versionToString(newVersion)}`);
  },
});
