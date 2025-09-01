import versionService from '@/services/version.js';
import { CliError } from '@/utils/error.js';
import consola from 'consola';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import minorCommand from './minor.js';

vi.mock('consola');
vi.mock('@/services/version.js');

describe('mutate:version:minor', () => {
  const mockConsola = vi.mocked(consola);
  const mockVersionService = vi.mocked(versionService);
  const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should increment minor version successfully', async () => {
    const currentVersion = { major: 1, minor: 2, patch: 3, hotfix: 0 };
    mockVersionService.ensureVersionsInSync.mockResolvedValue(currentVersion);
    mockVersionService.setVersion.mockResolvedValue(undefined);

    await minorCommand.action({}, undefined);

    expect(mockConsola.info).toHaveBeenCalledWith('Incrementing minor version from 1.2.3 to 1.3.0...');
    expect(mockVersionService.setVersion).toHaveBeenCalledWith({ major: 1, minor: 3, patch: 0 });
    expect(mockConsola.success).toHaveBeenCalledWith('Minor version incremented to 1.3.0');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should handle maximum minor version limit', async () => {
    const currentVersion = { major: 1, minor: 999, patch: 3, hotfix: 0 };
    mockVersionService.ensureVersionsInSync.mockResolvedValue(currentVersion);

    await expect(minorCommand.action({}, undefined)).rejects.toThrow(CliError);
    await expect(minorCommand.action({}, undefined)).rejects.toThrow(
      'Cannot increment minor version: would exceed maximum value of 999',
    );

    expect(mockVersionService.setVersion).not.toHaveBeenCalled();
  });

  it('should reset patch and hotfix when incrementing minor', async () => {
    const currentVersion = { major: 1, minor: 2, patch: 5, hotfix: 3 };
    mockVersionService.ensureVersionsInSync.mockResolvedValue(currentVersion);
    mockVersionService.setVersion.mockResolvedValue(undefined);

    await minorCommand.action({}, undefined);

    expect(mockVersionService.setVersion).toHaveBeenCalledWith({ major: 1, minor: 3, patch: 0 });
    expect(mockConsola.success).toHaveBeenCalledWith('Minor version incremented to 1.3.0');
  });

  it('should handle version sync errors', async () => {
    mockVersionService.ensureVersionsInSync.mockRejectedValue(
      new CliError('Versions are not synchronized across platforms'),
    );

    await expect(minorCommand.action({}, undefined)).rejects.toThrow('Versions are not synchronized across platforms');

    expect(mockVersionService.setVersion).not.toHaveBeenCalled();
  });
});
