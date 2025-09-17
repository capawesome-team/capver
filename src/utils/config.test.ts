import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { writeFileSync, unlinkSync } from 'fs';
import { join } from 'path';
import { loadConfig, parsePattern, getMaxValueForDigits } from './config.js';

describe('config', () => {
  const testDir = '/tmp/capver-test';
  const packageJsonPath = join(testDir, 'package.json');

  beforeEach(() => {
    // Create test directory
    const fs = require('fs');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
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

  describe('loadConfig', () => {
    it('should return default pattern when no package.json exists', () => {
      const config = loadConfig('/nonexistent/path');
      expect(config.pattern).toBe('MMmmmpphh');
    });

    it('should return default pattern when package.json has no capver config', () => {
      const packageJson = {
        name: 'test-app',
        version: '1.0.0',
      };
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

      const config = loadConfig(testDir);
      expect(config.pattern).toBe('MMmmmpphh');
    });

    it('should return custom pattern from package.json', () => {
      const packageJson = {
        name: 'test-app',
        version: '1.0.0',
        capver: {
          pattern: 'MMmmpp',
        },
      };
      writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

      const config = loadConfig(testDir);
      expect(config.pattern).toBe('MMmmpp');
    });

    it('should handle malformed JSON gracefully', () => {
      writeFileSync(packageJsonPath, '{ invalid json }');

      const config = loadConfig(testDir);
      expect(config.pattern).toBe('MMmmmpphh');
    });
  });

  describe('parsePattern', () => {
    it('should parse default pattern correctly', () => {
      const parsed = parsePattern('MMmmmpphh');
      expect(parsed).toEqual({
        majorDigits: 2,
        minorDigits: 3,
        patchDigits: 2,
        hotfixDigits: 2,
      });
    });

    it('should parse custom pattern correctly', () => {
      const parsed = parsePattern('Mmmpp');
      expect(parsed).toEqual({
        majorDigits: 1,
        minorDigits: 2,
        patchDigits: 2,
        hotfixDigits: 0,
      });
    });

    it('should handle pattern without hotfix', () => {
      const parsed = parsePattern('MMmmp');
      expect(parsed).toEqual({
        majorDigits: 2,
        minorDigits: 2,
        patchDigits: 1,
        hotfixDigits: 0,
      });
    });

    it('should throw error for invalid character', () => {
      expect(() => parsePattern('MMmmpx')).toThrow(
        "Invalid character 'x' in pattern 'MMmmpx'. Only 'M', 'm', 'p', 'h' are allowed."
      );
    });

    it('should throw error for missing major version', () => {
      expect(() => parsePattern('mmpp')).toThrow(
        "Pattern 'mmpp' must contain at least one 'M' for major version."
      );
    });

    it('should throw error for missing minor version', () => {
      expect(() => parsePattern('MMpp')).toThrow(
        "Pattern 'MMpp' must contain at least one 'm' for minor version."
      );
    });

    it('should throw error for missing patch version', () => {
      expect(() => parsePattern('MMmm')).toThrow(
        "Pattern 'MMmm' must contain at least one 'p' for patch version."
      );
    });
  });

  describe('getMaxValueForDigits', () => {
    it('should calculate correct max values', () => {
      expect(getMaxValueForDigits(1)).toBe(9);
      expect(getMaxValueForDigits(2)).toBe(99);
      expect(getMaxValueForDigits(3)).toBe(999);
      expect(getMaxValueForDigits(4)).toBe(9999);
    });
  });
});