import versionService from '@/services/version.js';
import { CliError } from '@/utils/error.js';
import { versionToString } from '@/utils/version.js';
import { defineCommand } from '@robingenz/zli';
import consola from 'consola';

export default defineCommand({
  description: 'Get the version of the app from all relevant files',
  action: async () => {
    const versions = await versionService.getAllVersions();

    if (versions.length === 0) {
      throw new CliError('No platform versions found');
    }

    const firstVersion = versions[0]!.version;
    // Check major.minor.patch synchronization for all platforms
    const allVersionsInSync = versions.every((pv) => {
      return (
        pv.version.major === firstVersion.major &&
        pv.version.minor === firstVersion.minor &&
        pv.version.patch === firstVersion.patch
      );
    });

    // Check hotfix synchronization between iOS and Android
    const iosVersion = versions.find((pv) => pv.platform === 'ios');
    const androidVersion = versions.find((pv) => pv.platform === 'android');
    let hotfixInSync = true;

    if (iosVersion && androidVersion) {
      const iosHotfix = iosVersion.version.hotfix || 0;
      const androidHotfix = androidVersion.version.hotfix || 0;
      hotfixInSync = iosHotfix === androidHotfix;
    }

    if (!allVersionsInSync || !hotfixInSync) {
      consola.error('Versions are not synchronized across platforms:');
      versions.forEach((pv) => {
        const versionStr = versionToString(pv.version);
        const hotfixStr = pv.platform !== 'web' && pv.version.hotfix ? ` (hotfix: ${pv.version.hotfix})` : '';
        consola.log(`  ${pv.platform}: ${versionStr}${hotfixStr} (${pv.source})`);
      });
      throw new CliError('Versions are not synchronized across platforms');
    }

    const versionStr = versionToString(firstVersion);
    // Show hotfix if iOS or Android has one
    const platformWithHotfix = versions.find(
      (pv) => pv.platform !== 'web' && pv.version.hotfix && pv.version.hotfix > 0,
    );
    const hotfixStr = platformWithHotfix ? ` (hotfix: ${platformWithHotfix.version.hotfix})` : '';

    consola.success(`Version: ${versionStr}${hotfixStr}`);

    versions.forEach((pv) => {
      consola.log(`  ${pv.platform}: ${pv.source}`);
    });
  },
});
