import versionService from '@/services/version.js';
import { CliError } from '@/utils/error.js';
import consola from 'consola';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import syncCommand from './sync.js';

vi.mock('consola');
vi.mock('@/services/version.js');

describe('mutate:version:sync', () => {
  const mockConsola = vi.mocked(consola);
  const mockVersionService = vi.mocked(versionService);
  const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should sync to highest version across platforms', async () => {
    const mockVersions = [
      {
        platform: 'ios' as const,
        version: { major: 1, minor: 2, patch: 3, hotfix: 0 },
        source: 'ios/App/App.xcodeproj/project.pbxproj',
      },
      {
        platform: 'android' as const,
        version: { major: 1, minor: 3, patch: 0, hotfix: 0 },
        source: 'android/app/build.gradle',
      },
      { platform: 'web' as const, version: { major: 1, minor: 2, patch: 4 }, source: 'package.json' },
    ];
    const highestVersion = { major: 1, minor: 3, patch: 0, hotfix: 0 };

    mockVersionService.getAllVersions.mockResolvedValue(mockVersions);
    mockVersionService.getHighestVersion.mockResolvedValue(highestVersion);
    mockVersionService.setVersion.mockResolvedValue(undefined);

    await syncCommand.action({}, undefined);

    expect(mockConsola.info).toHaveBeenCalledWith('Current versions:');
    expect(mockConsola.log).toHaveBeenCalledWith('  ios: 1.2.3');
    expect(mockConsola.log).toHaveBeenCalledWith('  android: 1.3.0');
    expect(mockConsola.log).toHaveBeenCalledWith('  web: 1.2.4');
    expect(mockConsola.info).toHaveBeenCalledWith('Syncing all platforms to highest version: 1.3.0...');
    expect(mockVersionService.setVersion).toHaveBeenCalledWith(highestVersion);
    expect(mockConsola.success).toHaveBeenCalledWith('All platforms synced to version 1.3.0');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should sync including hotfix for iOS/Android', async () => {
    const mockVersions = [
      {
        platform: 'ios' as const,
        version: { major: 1, minor: 2, patch: 3, hotfix: 5 },
        source: 'ios/App/App.xcodeproj/project.pbxproj',
      },
      {
        platform: 'android' as const,
        version: { major: 1, minor: 2, patch: 3, hotfix: 5 },
        source: 'android/app/build.gradle',
      },
      { platform: 'web' as const, version: { major: 1, minor: 2, patch: 2 }, source: 'package.json' },
    ];
    const highestVersion = { major: 1, minor: 2, patch: 3, hotfix: 5 };

    mockVersionService.getAllVersions.mockResolvedValue(mockVersions);
    mockVersionService.getHighestVersion.mockResolvedValue(highestVersion);
    mockVersionService.setVersion.mockResolvedValue(undefined);

    await syncCommand.action({}, undefined);

    expect(mockConsola.log).toHaveBeenCalledWith('  ios: 1.2.3 (hotfix: 5)');
    expect(mockConsola.log).toHaveBeenCalledWith('  android: 1.2.3 (hotfix: 5)');
    expect(mockConsola.log).toHaveBeenCalledWith('  web: 1.2.2');
    expect(mockConsola.info).toHaveBeenCalledWith('Syncing all platforms to highest version: 1.2.3 (hotfix: 5)...');
    expect(mockConsola.success).toHaveBeenCalledWith('All platforms synced to version 1.2.3 (hotfix: 5)');
  });

  it('should handle no platform versions found', async () => {
    mockVersionService.getAllVersions.mockResolvedValue([]);

    await expect(syncCommand.action({}, undefined)).rejects.toThrow(CliError);
    await expect(syncCommand.action({}, undefined)).rejects.toThrow('No platform versions found');

    expect(mockVersionService.setVersion).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    const mockVersions = [
      {
        platform: 'ios' as const,
        version: { major: 1, minor: 2, patch: 3, hotfix: 0 },
        source: 'ios/App/App.xcodeproj/project.pbxproj',
      },
    ];
    mockVersionService.getAllVersions.mockResolvedValue(mockVersions);
    mockVersionService.getHighestVersion.mockRejectedValue(new Error('Failed to determine highest version'));

    await expect(syncCommand.action({}, undefined)).rejects.toThrow('Failed to determine highest version');

    expect(mockVersionService.setVersion).not.toHaveBeenCalled();
  });
});
