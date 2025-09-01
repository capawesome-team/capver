import versionService from '@/services/version.js';
import { CliError } from '@/utils/error.js';
import { parseVersion, versionToString } from '@/utils/version.js';
import { defineCommand } from '@robingenz/zli';
import consola from 'consola';
import { z } from 'zod';

export default defineCommand({
  description: 'Set the version of the app in all relevant files',
  args: z.tuple([z.string().describe('Version')]),
  action: async (_options, args) => {
    let version;
    try {
      version = parseVersion(args[0]);
    } catch (error) {
      throw new CliError("Invalid version format. Please use the format 'major.minor.patch' (e.g. '1.2.3').");
    }

    consola.info(`Setting version to ${versionToString(version)}...`);

    await versionService.setVersion(version);

    consola.success(`Version set to ${versionToString(version)}`);
  },
});
