import versionService from '@/services/version.js';
import { CliError } from '@/utils/error.js';
import consola from 'consola';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import getCommand from './get.js';

vi.mock('consola');
vi.mock('@/services/version.js');

describe('mutate:version:get', () => {
  const mockConsola = vi.mocked(consola);
  const mockVersionService = vi.mocked(versionService);
  const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should display synchronized versions across all platforms', async () => {
    const mockVersions = [
      {
        platform: 'ios' as const,
        version: { major: 1, minor: 2, patch: 3, hotfix: 0 },
        source: 'ios/App/App.xcodeproj/project.pbxproj',
      },
      {
        platform: 'android' as const,
        version: { major: 1, minor: 2, patch: 3, hotfix: 0 },
        source: 'android/app/build.gradle',
      },
      { platform: 'web' as const, version: { major: 1, minor: 2, patch: 3 }, source: 'package.json' },
    ];

    mockVersionService.getAllVersions.mockResolvedValue(mockVersions);

    await getCommand.action({}, undefined);

    expect(mockConsola.success).toHaveBeenCalledWith('Version: 1.2.3');
    expect(mockConsola.log).toHaveBeenCalledWith('  ios: ios/App/App.xcodeproj/project.pbxproj');
    expect(mockConsola.log).toHaveBeenCalledWith('  android: android/app/build.gradle');
    expect(mockConsola.log).toHaveBeenCalledWith('  web: package.json');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should display hotfix when iOS/Android have one', async () => {
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
      { platform: 'web' as const, version: { major: 1, minor: 2, patch: 3 }, source: 'package.json' },
    ];

    mockVersionService.getAllVersions.mockResolvedValue(mockVersions);

    await getCommand.action({}, undefined);

    expect(mockConsola.success).toHaveBeenCalledWith('Version: 1.2.3 (hotfix: 5)');
  });

  it('should error when versions are not synchronized', async () => {
    const mockVersions = [
      {
        platform: 'ios' as const,
        version: { major: 1, minor: 2, patch: 3, hotfix: 0 },
        source: 'ios/App/App.xcodeproj/project.pbxproj',
      },
      {
        platform: 'android' as const,
        version: { major: 1, minor: 2, patch: 4, hotfix: 0 },
        source: 'android/app/build.gradle',
      },
      { platform: 'web' as const, version: { major: 1, minor: 2, patch: 3 }, source: 'package.json' },
    ];

    mockVersionService.getAllVersions.mockResolvedValue(mockVersions);

    await expect(getCommand.action({}, undefined)).rejects.toThrow(CliError);
    await expect(getCommand.action({}, undefined)).rejects.toThrow('Versions are not synchronized across platforms');

    expect(mockConsola.error).toHaveBeenCalledWith('Versions are not synchronized across platforms:');
    expect(mockConsola.log).toHaveBeenCalledWith('  ios: 1.2.3 (ios/App/App.xcodeproj/project.pbxproj)');
    expect(mockConsola.log).toHaveBeenCalledWith('  android: 1.2.4 (android/app/build.gradle)');
    expect(mockConsola.log).toHaveBeenCalledWith('  web: 1.2.3 (package.json)');
  });

  it('should error when no platform versions found', async () => {
    mockVersionService.getAllVersions.mockResolvedValue([]);

    await expect(getCommand.action({}, undefined)).rejects.toThrow(CliError);
    await expect(getCommand.action({}, undefined)).rejects.toThrow('No platform versions found');
  });
});
