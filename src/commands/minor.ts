import versionService from '@/services/version.js';
import { CliError } from '@/utils/error.js';
import { incrementMinor, versionToString } from '@/utils/version.js';
import { defineCommand } from '@robingenz/zli';
import consola from 'consola';

export default defineCommand({
  description: 'Increment the minor version of the app in all relevant files',
  action: async () => {
    const currentVersion = await versionService.ensureVersionsInSync();

    // Check for minor version limit
    if (currentVersion.minor >= 999) {
      throw new CliError('Cannot increment minor version: would exceed maximum value of 999');
    }

    const newVersion = incrementMinor(currentVersion);

    consola.info(
      `Incrementing minor version from ${versionToString(currentVersion)} to ${versionToString(newVersion)}...`,
    );

    await versionService.setVersion(newVersion);

    consola.success(`Minor version incremented to ${versionToString(newVersion)}`);
  },
});
