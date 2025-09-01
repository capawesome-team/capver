import versionService from '@/services/version.js';
import { CliError } from '@/utils/error.js';
import consola from 'consola';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import patchCommand from './patch.js';

vi.mock('consola');
vi.mock('@/services/version.js');

describe('mutate:version:patch', () => {
  const mockConsola = vi.mocked(consola);
  const mockVersionService = vi.mocked(versionService);
  const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should increment patch version successfully', async () => {
    const currentVersion = { major: 1, minor: 2, patch: 3, hotfix: 0 };
    mockVersionService.ensureVersionsInSync.mockResolvedValue(currentVersion);
    mockVersionService.setVersion.mockResolvedValue(undefined);

    await patchCommand.action({}, undefined);

    expect(mockConsola.info).toHaveBeenCalledWith('Incrementing patch version from 1.2.3 to 1.2.4...');
    expect(mockVersionService.setVersion).toHaveBeenCalledWith({ major: 1, minor: 2, patch: 4 });
    expect(mockConsola.success).toHaveBeenCalledWith('Patch version incremented to 1.2.4');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should handle maximum patch version limit', async () => {
    const currentVersion = { major: 1, minor: 2, patch: 99, hotfix: 0 };
    mockVersionService.ensureVersionsInSync.mockResolvedValue(currentVersion);

    await expect(patchCommand.action({}, undefined)).rejects.toThrow(CliError);
    await expect(patchCommand.action({}, undefined)).rejects.toThrow(
      'Cannot increment patch version: would exceed maximum value of 99',
    );

    expect(mockVersionService.setVersion).not.toHaveBeenCalled();
  });

  it('should reset hotfix when incrementing patch', async () => {
    const currentVersion = { major: 1, minor: 2, patch: 3, hotfix: 5 };
    mockVersionService.ensureVersionsInSync.mockResolvedValue(currentVersion);
    mockVersionService.setVersion.mockResolvedValue(undefined);

    await patchCommand.action({}, undefined);

    expect(mockVersionService.setVersion).toHaveBeenCalledWith({ major: 1, minor: 2, patch: 4 });
    expect(mockConsola.success).toHaveBeenCalledWith('Patch version incremented to 1.2.4');
  });

  it('should handle version sync errors', async () => {
    mockVersionService.ensureVersionsInSync.mockRejectedValue(
      new CliError('Versions are not synchronized across platforms'),
    );

    await expect(patchCommand.action({}, undefined)).rejects.toThrow('Versions are not synchronized across platforms');

    expect(mockVersionService.setVersion).not.toHaveBeenCalled();
  });
});
