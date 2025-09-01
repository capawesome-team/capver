import versionService from '@/services/version.js';
import { CliError } from '@/utils/error.js';
import { versionToString } from '@/utils/version.js';
import { defineCommand } from '@robingenz/zli';
import consola from 'consola';

export default defineCommand({
  description: 'Set the highest version number among all platforms in all relevant files',
  action: async () => {
    const versions = await versionService.getAllVersions();

    if (versions.length === 0) {
      throw new CliError('No platform versions found');
    }

    const highestVersion = await versionService.getHighestVersion();

    consola.info('Current versions:');
    versions.forEach((pv) => {
      const versionStr = versionToString(pv.version);
      const hotfixStr = pv.platform !== 'web' && pv.version.hotfix ? ` (hotfix: ${pv.version.hotfix})` : '';
      consola.log(`  ${pv.platform}: ${versionStr}${hotfixStr}`);
    });

    const highestVersionStr = versionToString(highestVersion);
    const hotfixStr = highestVersion.hotfix ? ` (hotfix: ${highestVersion.hotfix})` : '';

    consola.info(`Syncing all platforms to highest version: ${highestVersionStr}${hotfixStr}...`);

    await versionService.setVersion(highestVersion);

    consola.success(`All platforms synced to version ${highestVersionStr}${hotfixStr}`);
  },
});
