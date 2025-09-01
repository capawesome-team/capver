#!/usr/bin/env node
import { getMessageFromUnknownError } from '@/utils/error.js';
import { defineConfig, processConfig } from '@robingenz/zli';
import consola from 'consola';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pkg = require('../package.json');

const config = defineConfig({
  meta: {
    name: pkg.name,
    version: pkg.version,
    description: pkg.description,
  },
  commands: {
    doctor: await import('@/commands/doctor.js').then((mod) => mod.default),
    get: await import('@/commands/get.js').then((mod) => mod.default),
    set: await import('@/commands/set.js').then((mod) => mod.default),
    major: await import('@/commands/major.js').then((mod) => mod.default),
    minor: await import('@/commands/minor.js').then((mod) => mod.default),
    patch: await import('@/commands/patch.js').then((mod) => mod.default),
    hotfix: await import('@/commands/hotfix.js').then((mod) => mod.default),
    sync: await import('@/commands/sync.js').then((mod) => mod.default),
  },
});

try {
  const result = processConfig(config, process.argv.slice(2));
  await result.command.action(result.options, result.args);
} catch (error) {
  try {
    // Print the error message
    const message = getMessageFromUnknownError(error);
    consola.error(message);
  } finally {
    // Suggest opening an issue
    consola.log('If you think this is a bug, please open an issue at:');
    consola.log('  https://github.com/capawesome-team/capver/issues/new/choose');
    // Exit with a non-zero code
    process.exit(1);
  }
}
