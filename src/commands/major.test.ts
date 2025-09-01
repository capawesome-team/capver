import versionService from '@/services/version.js';
import { CliError } from '@/utils/error.js';
import consola from 'consola';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import majorCommand from './major.js';

vi.mock('consola');
vi.mock('@/services/version.js');

describe('mutate:version:major', () => {
  const mockConsola = vi.mocked(consola);
  const mockVersionService = vi.mocked(versionService);
  const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should increment major version successfully', async () => {
    const currentVersion = { major: 1, minor: 2, patch: 3, hotfix: 0 };
    mockVersionService.ensureVersionsInSync.mockResolvedValue(currentVersion);
    mockVersionService.setVersion.mockResolvedValue(undefined);

    await majorCommand.action({}, undefined);

    expect(mockConsola.info).toHaveBeenCalledWith('Incrementing major version from 1.2.3 to 2.0.0...');
    expect(mockVersionService.setVersion).toHaveBeenCalledWith({ major: 2, minor: 0, patch: 0 });
    expect(mockConsola.success).toHaveBeenCalledWith('Major version incremented to 2.0.0');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should handle large major versions', async () => {
    const currentVersion = { major: 999, minor: 2, patch: 3, hotfix: 0 };
    mockVersionService.ensureVersionsInSync.mockResolvedValue(currentVersion);
    mockVersionService.setVersion.mockResolvedValue(undefined);

    await majorCommand.action({}, undefined);

    expect(mockConsola.info).toHaveBeenCalledWith('Incrementing major version from 999.2.3 to 1000.0.0...');
    expect(mockVersionService.setVersion).toHaveBeenCalledWith({ major: 1000, minor: 0, patch: 0 });
    expect(mockConsola.success).toHaveBeenCalledWith('Major version incremented to 1000.0.0');
  });

  it('should handle version sync errors', async () => {
    mockVersionService.ensureVersionsInSync.mockRejectedValue(
      new CliError('Versions are not synchronized across platforms'),
    );

    await expect(majorCommand.action({}, undefined)).rejects.toThrow('Versions are not synchronized across platforms');

    expect(mockVersionService.setVersion).not.toHaveBeenCalled();
  });

  it('should handle service errors during set', async () => {
    const currentVersion = { major: 1, minor: 2, patch: 3, hotfix: 0 };
    mockVersionService.ensureVersionsInSync.mockResolvedValue(currentVersion);
    mockVersionService.setVersion.mockRejectedValue(new Error('Failed to update version'));

    await expect(majorCommand.action({}, undefined)).rejects.toThrow('Failed to update version');

    expect(mockVersionService.setVersion).toHaveBeenCalledWith({ major: 2, minor: 0, patch: 0 });
  });
});
