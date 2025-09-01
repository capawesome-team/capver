import versionService from '@/services/version.js';
import { CliError } from '@/utils/error.js';
import consola from 'consola';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import hotfixCommand from './hotfix.js';

vi.mock('consola');
vi.mock('@/services/version.js');

describe('mutate:version:hotfix', () => {
  const mockConsola = vi.mocked(consola);
  const mockVersionService = vi.mocked(versionService);
  const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should increment hotfix version from 0', async () => {
    const currentVersion = { major: 1, minor: 2, patch: 3, hotfix: 0 };
    mockVersionService.ensureVersionsInSync.mockResolvedValue(currentVersion);
    mockVersionService.setVersion.mockResolvedValue(undefined);

    await hotfixCommand.action({}, undefined);

    expect(mockConsola.info).toHaveBeenCalledWith('Incrementing hotfix for version 1.2.3 (0 -> 1)...');
    expect(mockVersionService.setVersion).toHaveBeenCalledWith({ major: 1, minor: 2, patch: 3, hotfix: 1 });
    expect(mockConsola.success).toHaveBeenCalledWith('Hotfix incremented for version 1.2.3 (now 1)');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should increment existing hotfix version', async () => {
    const currentVersion = { major: 1, minor: 2, patch: 3, hotfix: 5 };
    mockVersionService.ensureVersionsInSync.mockResolvedValue(currentVersion);
    mockVersionService.setVersion.mockResolvedValue(undefined);

    await hotfixCommand.action({}, undefined);

    expect(mockConsola.info).toHaveBeenCalledWith('Incrementing hotfix for version 1.2.3 (5 -> 6)...');
    expect(mockVersionService.setVersion).toHaveBeenCalledWith({ major: 1, minor: 2, patch: 3, hotfix: 6 });
    expect(mockConsola.success).toHaveBeenCalledWith('Hotfix incremented for version 1.2.3 (now 6)');
  });

  it('should handle maximum hotfix version limit', async () => {
    const currentVersion = { major: 1, minor: 2, patch: 3, hotfix: 99 };
    mockVersionService.ensureVersionsInSync.mockResolvedValue(currentVersion);

    await expect(hotfixCommand.action({}, undefined)).rejects.toThrow(CliError);
    await expect(hotfixCommand.action({}, undefined)).rejects.toThrow(
      'Cannot increment hotfix version: would exceed maximum value of 99',
    );

    expect(mockVersionService.setVersion).not.toHaveBeenCalled();
  });

  it('should handle hotfix sync errors between iOS and Android', async () => {
    mockVersionService.ensureVersionsInSync.mockRejectedValue(
      new CliError('Hotfix versions are not synchronized between iOS and Android'),
    );

    await expect(hotfixCommand.action({}, undefined)).rejects.toThrow(
      'Hotfix versions are not synchronized between iOS and Android',
    );

    expect(mockVersionService.setVersion).not.toHaveBeenCalled();
  });
});
