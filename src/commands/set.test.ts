import versionService from '@/services/version.js';
import { CliError } from '@/utils/error.js';
import consola from 'consola';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import setCommand from './set.js';

vi.mock('consola');
vi.mock('@/services/version.js');

describe('mutate:version:set', () => {
  const mockConsola = vi.mocked(consola);
  const mockVersionService = vi.mocked(versionService);
  const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined as never);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should set a valid version', async () => {
    mockVersionService.setVersion.mockResolvedValue(undefined);

    await setCommand.action({}, ['1.2.3']);

    expect(mockConsola.info).toHaveBeenCalledWith('Setting version to 1.2.3...');
    expect(mockVersionService.setVersion).toHaveBeenCalledWith({ major: 1, minor: 2, patch: 3 });
    expect(mockConsola.success).toHaveBeenCalledWith('Version set to 1.2.3');
    expect(mockExit).not.toHaveBeenCalled();
  });

  it('should handle invalid version format', async () => {
    await expect(setCommand.action({}, ['1.2'])).rejects.toThrow(CliError);
    await expect(setCommand.action({}, ['1.2'])).rejects.toThrow(
      "Invalid version format. Please use the format 'major.minor.patch' (e.g. '1.2.3').",
    );

    expect(mockVersionService.setVersion).not.toHaveBeenCalled();
  });

  it('should handle non-numeric version parts', async () => {
    await expect(setCommand.action({}, ['1.2.abc'])).rejects.toThrow(CliError);
    await expect(setCommand.action({}, ['1.2.abc'])).rejects.toThrow(
      "Invalid version format. Please use the format 'major.minor.patch' (e.g. '1.2.3').",
    );

    expect(mockVersionService.setVersion).not.toHaveBeenCalled();
  });

  it('should handle service errors', async () => {
    mockVersionService.setVersion.mockRejectedValue(new Error('Failed to set version'));

    await expect(setCommand.action({}, ['1.2.3'])).rejects.toThrow('Failed to set version');

    expect(mockVersionService.setVersion).toHaveBeenCalledWith({ major: 1, minor: 2, patch: 3 });
  });
});
