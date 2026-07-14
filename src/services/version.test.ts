import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { VersionService } from './version.js';

describe('VersionService', () => {
  const testDir = '/tmp/capver-version-service-test';

  const writePackageJson = (relativePath: string, version: string) => {
    const filePath = join(testDir, relativePath);
    mkdirSync(join(filePath, '..'), { recursive: true });
    writeFileSync(filePath, JSON.stringify({ name: 'my-app', version }, null, 2));
  };

  const readVersion = (relativePath: string): string => {
    return JSON.parse(readFileSync(join(testDir, relativePath), 'utf-8')).version;
  };

  beforeEach(() => {
    mkdirSync(testDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(testDir, { recursive: true, force: true });
  });

  describe('getElectronVersion', () => {
    it('should read the version from electron/package.json', async () => {
      writePackageJson('electron/package.json', '1.2.3');

      const service = new VersionService(testDir);
      const result = await service.getElectronVersion();

      expect(result).toEqual({
        platform: 'electron',
        version: { major: 1, minor: 2, patch: 3 },
        source: 'electron/package.json',
      });
    });

    it('should return null when electron/package.json does not exist', async () => {
      const service = new VersionService(testDir);
      const result = await service.getElectronVersion();

      expect(result).toBeNull();
    });
  });

  describe('getAllVersions', () => {
    it('should include the Electron version', async () => {
      writePackageJson('package.json', '1.2.3');
      writePackageJson('electron/package.json', '1.2.3');

      const service = new VersionService(testDir);
      const versions = await service.getAllVersions();

      expect(versions).toContainEqual({
        platform: 'electron',
        version: { major: 1, minor: 2, patch: 3 },
        source: 'electron/package.json',
      });
    });
  });

  describe('setVersion', () => {
    it('should write the version to electron/package.json', async () => {
      writePackageJson('package.json', '1.0.0');
      writePackageJson('electron/package.json', '1.0.0');

      const service = new VersionService(testDir);
      await service.setVersion({ major: 2, minor: 3, patch: 4 });

      expect(readVersion('electron/package.json')).toBe('2.3.4');
      expect(readVersion('package.json')).toBe('2.3.4');
    });

    it('should not create electron/package.json when it does not exist', async () => {
      writePackageJson('package.json', '1.0.0');

      const service = new VersionService(testDir);
      await service.setVersion({ major: 2, minor: 3, patch: 4 });

      expect(existsSync(join(testDir, 'electron/package.json'))).toBe(false);
    });
  });
});
