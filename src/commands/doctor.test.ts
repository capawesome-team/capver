import consola from 'consola';
import systeminformation from 'systeminformation';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import doctorCommand from './doctor.js';

// Mock dependencies
vi.mock('consola');
vi.mock('systeminformation');

describe('doctor', () => {
  const mockConsola = vi.mocked(consola);
  const mockSystemInformation = vi.mocked(systeminformation);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should display system information', async () => {
    const mockOsInfo = {
      distro: 'macOS',
      release: '14.0',
      codename: 'Sonoma',
    };

    const mockVersions = {
      node: '18.17.0',
      npm: '9.6.7',
    };

    mockSystemInformation.osInfo.mockResolvedValue(mockOsInfo as any);
    mockSystemInformation.versions.mockResolvedValue(mockVersions as any);

    await doctorCommand.action({}, undefined);

    expect(mockSystemInformation.osInfo).toHaveBeenCalled();
    expect(mockSystemInformation.versions).toHaveBeenCalledWith('npm, node');
    expect(mockConsola.box).toHaveBeenCalledWith(expect.stringContaining('NodeJS version: 18.17.0'));
    expect(mockConsola.box).toHaveBeenCalledWith(expect.stringContaining('NPM version: 9.6.7'));
    expect(mockConsola.box).toHaveBeenCalledWith(expect.stringContaining('OS: macOS 14.0 (Sonoma)'));
  });

  it('should handle OS info without codename', async () => {
    const mockOsInfo = {
      distro: 'Ubuntu',
      release: '22.04',
      codename: '',
    };

    const mockVersions = {
      node: '20.0.0',
      npm: '10.0.0',
    };

    mockSystemInformation.osInfo.mockResolvedValue(mockOsInfo as any);
    mockSystemInformation.versions.mockResolvedValue(mockVersions as any);

    await doctorCommand.action({}, undefined);

    expect(mockConsola.box).toHaveBeenCalledWith(expect.stringContaining('OS: Ubuntu 22.04'));
    expect(mockConsola.box).toHaveBeenCalledWith(expect.not.stringContaining('()'));
  });
});
