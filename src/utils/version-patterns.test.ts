import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { parseBuildNumber, versionToBuildNumber, incrementMinor, incrementPatch, incrementHotfix } from './version.js';

describe('version with different patterns', () => {
  const testDir = '/tmp/capver-pattern-test';
  const packageJsonPath = join(testDir, 'package.json');

  beforeEach(() => {
    // Create test directory
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up
    try {
      unlinkSync(packageJsonPath);
    } catch (error) {
      // Ignore if file doesn't exist
    }
  });

  describe('with pattern Mmmpp (no hotfix)', () => {
    beforeEach(() => {
      const packageJson = {
        name: 'test-app',
        version: '1.0.0',
        capver: {
          pattern: 'Mmmpp',
        },
      };
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    });

    it('should parse build number correctly', () => {
      const version = parseBuildNumber('10203', testDir);
      expect(version).toEqual({
        major: 1,
        minor: 2,
        patch: 3,
        hotfix: undefined,
      });
    });

    it('should convert version to build number correctly', () => {
      const buildNumber = versionToBuildNumber({ major: 1, minor: 2, patch: 3 }, testDir);
      expect(buildNumber).toBe(10203);
    });

    it('should handle version limits correctly', () => {
      const version = { major: 1, minor: 99, patch: 99 };
      const buildNumber = versionToBuildNumber(version, testDir);
      expect(buildNumber).toBe(19999);
    });

    it('should throw error when incrementing hotfix', () => {
      const version = { major: 1, minor: 2, patch: 3 };
      expect(() => incrementHotfix(version, testDir)).toThrow(
        "Cannot increment hotfix version: pattern 'Mmmpp' does not include hotfix digits",
      );
    });

    it('should throw error when minor exceeds limit', () => {
      const version = { major: 1, minor: 100, patch: 0 };
      expect(() => versionToBuildNumber(version, testDir)).toThrow(
        "Minor version 100 exceeds maximum value of 99 for pattern 'Mmmpp'",
      );
    });

    it('should throw error when patch exceeds limit', () => {
      const version = { major: 1, minor: 0, patch: 100 };
      expect(() => versionToBuildNumber(version, testDir)).toThrow(
        "Patch version 100 exceeds maximum value of 99 for pattern 'Mmmpp'",
      );
    });
  });

  describe('with pattern MMmmmppph (extended)', () => {
    beforeEach(() => {
      const packageJson = {
        name: 'test-app',
        version: '1.0.0',
        capver: {
          pattern: 'MMmmmppph',
        },
      };
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    });

    it('should parse build number correctly', () => {
      // For pattern MMmmmppph, build number 123000041 means:
      // 12 = major (first 2 digits), 300 = minor (next 3 digits), 004 = patch (next 3 digits), 1 = hotfix (last 1 digit)
      const version = parseBuildNumber('123000041', testDir);
      expect(version).toEqual({
        major: 12,
        minor: 300,
        patch: 4,
        hotfix: 1,
      });
    });

    it('should convert version to build number correctly', () => {
      const buildNumber = versionToBuildNumber({ major: 12, minor: 300, patch: 4, hotfix: 1 }, testDir);
      expect(buildNumber).toBe(123000041);
    });

    it('should handle larger limits correctly', () => {
      const version = { major: 99, minor: 999, patch: 999, hotfix: 9 };
      const buildNumber = versionToBuildNumber(version, testDir);
      expect(buildNumber).toBe(999999999);
    });

    it('should increment versions correctly with new limits', () => {
      const baseVersion = { major: 1, minor: 998, patch: 5, hotfix: 2 };

      const newMinor = incrementMinor(baseVersion, testDir);
      expect(newMinor).toEqual({ major: 1, minor: 999, patch: 0 });

      const newPatch = incrementPatch(baseVersion, testDir);
      expect(newPatch).toEqual({ major: 1, minor: 998, patch: 6 });

      const newHotfix = incrementHotfix(baseVersion, testDir);
      expect(newHotfix).toEqual({ major: 1, minor: 998, patch: 5, hotfix: 3 });
    });

    it('should throw error when minor exceeds limit', () => {
      const version = { major: 1, minor: 1000, patch: 0 };
      expect(() => versionToBuildNumber(version, testDir)).toThrow(
        "Minor version 1000 exceeds maximum value of 999 for pattern 'MMmmmppph'",
      );
    });
  });

  describe('with default pattern MMmmmpphh', () => {
    beforeEach(() => {
      const packageJson = {
        name: 'test-app',
        version: '1.0.0',
      };
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
    });

    it('should work with default pattern when no capver config', () => {
      const version = parseBuildNumber('120030401', testDir);
      expect(version).toEqual({
        major: 12,
        minor: 3,
        patch: 4,
        hotfix: 1,
      });

      const buildNumber = versionToBuildNumber({ major: 12, minor: 3, patch: 4, hotfix: 1 }, testDir);
      expect(buildNumber).toBe(120030401);
    });

    it('should handle traditional limits', () => {
      const version = { major: 99, minor: 999, patch: 99, hotfix: 99 };
      const buildNumber = versionToBuildNumber(version, testDir);
      expect(buildNumber).toBe(999999999);
    });
  });
});
