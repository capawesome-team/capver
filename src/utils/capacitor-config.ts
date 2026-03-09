import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { join } from 'path';

export interface CapacitorPaths {
  iosPath: string;
  androidPath: string;
}

const DEFAULT_IOS_PATH = 'ios';
const DEFAULT_ANDROID_PATH = 'android';

const CONFIG_FILE_NAMES = ['capacitor.config.ts', 'capacitor.config.js', 'capacitor.config.json'];

export const loadCapacitorConfig = async (projectPath: string = process.cwd()): Promise<CapacitorPaths> => {
  for (const fileName of CONFIG_FILE_NAMES) {
    const filePath = join(projectPath, fileName);
    if (!existsSync(filePath)) {
      continue;
    }

    try {
      if (fileName.endsWith('.json')) {
        const content = await readFile(filePath, 'utf-8');
        const config = JSON.parse(content);
        return extractPaths(config);
      }

      const { createJiti } = await import('jiti');
      const jiti = createJiti(filePath);
      const config = (await jiti.import(filePath)) as Record<string, unknown>;
      return extractPaths(config);
    } catch {
      return defaults();
    }
  }

  return defaults();
};

const extractPaths = (config: Record<string, unknown>): CapacitorPaths => {
  const ios = config.ios as Record<string, unknown> | undefined;
  const android = config.android as Record<string, unknown> | undefined;

  return {
    iosPath: typeof ios?.path === 'string' ? ios.path : DEFAULT_IOS_PATH,
    androidPath: typeof android?.path === 'string' ? android.path : DEFAULT_ANDROID_PATH,
  };
};

const defaults = (): CapacitorPaths => ({
  iosPath: DEFAULT_IOS_PATH,
  androidPath: DEFAULT_ANDROID_PATH,
});
