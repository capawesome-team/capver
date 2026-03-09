import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdirSync, existsSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { loadCapacitorConfig } from './capacitor-config.js';

describe('capacitor-config', () => {
  const testDir = '/tmp/capver-capacitor-config-test';

  beforeEach(() => {
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('loadCapacitorConfig', () => {
    it('should return defaults when no config file exists', async () => {
      const result = await loadCapacitorConfig(testDir);
      expect(result).toEqual({
        iosPath: 'ios',
        androidPath: 'android',
      });
    });

    it('should load paths from capacitor.config.json', async () => {
      const config = {
        appId: 'com.example.app',
        ios: { path: 'custom-ios' },
        android: { path: 'custom-android' },
      };
      writeFileSync(join(testDir, 'capacitor.config.json'), JSON.stringify(config));

      const result = await loadCapacitorConfig(testDir);
      expect(result).toEqual({
        iosPath: 'custom-ios',
        androidPath: 'custom-android',
      });
    });

    it('should return defaults when capacitor.config.json has no paths', async () => {
      const config = {
        appId: 'com.example.app',
      };
      writeFileSync(join(testDir, 'capacitor.config.json'), JSON.stringify(config));

      const result = await loadCapacitorConfig(testDir);
      expect(result).toEqual({
        iosPath: 'ios',
        androidPath: 'android',
      });
    });

    it('should return defaults for partial config (only ios)', async () => {
      const config = {
        appId: 'com.example.app',
        ios: { path: 'custom-ios' },
      };
      writeFileSync(join(testDir, 'capacitor.config.json'), JSON.stringify(config));

      const result = await loadCapacitorConfig(testDir);
      expect(result).toEqual({
        iosPath: 'custom-ios',
        androidPath: 'android',
      });
    });

    it('should return defaults for partial config (only android)', async () => {
      const config = {
        appId: 'com.example.app',
        android: { path: 'custom-android' },
      };
      writeFileSync(join(testDir, 'capacitor.config.json'), JSON.stringify(config));

      const result = await loadCapacitorConfig(testDir);
      expect(result).toEqual({
        iosPath: 'ios',
        androidPath: 'custom-android',
      });
    });

    it('should return defaults when JSON is malformed', async () => {
      writeFileSync(join(testDir, 'capacitor.config.json'), '{ invalid }');

      const result = await loadCapacitorConfig(testDir);
      expect(result).toEqual({
        iosPath: 'ios',
        androidPath: 'android',
      });
    });

    it('should prefer .ts over .js over .json', async () => {
      const tsConfig = `
        const config = {
          appId: 'com.example.app',
          ios: { path: 'from-ts' },
          android: { path: 'from-ts' },
        };
        export default config;
      `;
      const jsonConfig = {
        appId: 'com.example.app',
        ios: { path: 'from-json' },
        android: { path: 'from-json' },
      };
      writeFileSync(join(testDir, 'capacitor.config.ts'), tsConfig);
      writeFileSync(join(testDir, 'capacitor.config.json'), JSON.stringify(jsonConfig));

      const result = await loadCapacitorConfig(testDir);
      expect(result).toEqual({
        iosPath: 'from-ts',
        androidPath: 'from-ts',
      });
    });

    it('should load paths from capacitor.config.js', async () => {
      const jsConfig = `
        const config = {
          appId: 'com.example.app',
          ios: { path: 'from-js' },
          android: { path: 'from-js' },
        };
        export default config;
      `;
      writeFileSync(join(testDir, 'capacitor.config.js'), jsConfig);

      const result = await loadCapacitorConfig(testDir);
      expect(result).toEqual({
        iosPath: 'from-js',
        androidPath: 'from-js',
      });
    });
  });
});
