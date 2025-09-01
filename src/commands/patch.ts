import versionService from '@/services/version.js';
import { CliError } from '@/utils/error.js';
import { incrementPatch, versionToString } from '@/utils/version.js';
import { defineCommand } from '@robingenz/zli';
import consola from 'consola';

export default defineCommand({
  description: 'Increment the patch version of the app in all relevant files',
  action: async () => {
    const currentVersion = await versionService.ensureVersionsInSync();

    // Check for patch version limit
    if (currentVersion.patch >= 99) {
      throw new CliError('Cannot increment patch version: would exceed maximum value of 99');
    }

    const newVersion = incrementPatch(currentVersion);

    consola.info(
      `Incrementing patch version from ${versionToString(currentVersion)} to ${versionToString(newVersion)}...`,
    );

    await versionService.setVersion(newVersion);

    consola.success(`Patch version incremented to ${versionToString(newVersion)}`);
  },
});
