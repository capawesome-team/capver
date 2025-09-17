import versionService from '@/services/version.js';
import { incrementMinor, versionToString } from '@/utils/version.js';
import { defineCommand } from '@robingenz/zli';
import consola from 'consola';

export default defineCommand({
  description: 'Increment the minor version of the app in all relevant files',
  action: async () => {
    const currentVersion = await versionService.ensureVersionsInSync();
    const newVersion = incrementMinor(currentVersion, process.cwd());

    consola.info(
      `Incrementing minor version from ${versionToString(currentVersion)} to ${versionToString(newVersion)}...`,
    );

    await versionService.setVersion(newVersion);

    consola.success(`Minor version incremented to ${versionToString(newVersion)}`);
  },
});
