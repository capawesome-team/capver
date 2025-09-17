import { readFileSync } from 'fs';
import { join } from 'path';
import { CliError } from './error.js';

export interface CapverConfig {
  pattern: string;
}

export interface ParsedPattern {
  majorDigits: number;
  minorDigits: number;
  patchDigits: number;
  hotfixDigits: number;
}

const DEFAULT_PATTERN = 'MMmmmpphh';

export const loadConfig = (projectPath: string = process.cwd()): CapverConfig => {
  const packageJsonPath = join(projectPath, 'package.json');

  try {
    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    return {
      pattern: packageJson.capver?.pattern || DEFAULT_PATTERN,
    };
  } catch (error) {
    return {
      pattern: DEFAULT_PATTERN,
    };
  }
};

export const parsePattern = (pattern: string): ParsedPattern => {
  let majorDigits = 0;
  let minorDigits = 0;
  let patchDigits = 0;
  let hotfixDigits = 0;

  for (const char of pattern) {
    switch (char) {
      case 'M':
        majorDigits++;
        break;
      case 'm':
        minorDigits++;
        break;
      case 'p':
        patchDigits++;
        break;
      case 'h':
        hotfixDigits++;
        break;
      default:
        throw new CliError(`Invalid character '${char}' in pattern '${pattern}'. Only 'M', 'm', 'p', 'h' are allowed.`);
    }
  }

  if (majorDigits === 0) {
    throw new CliError(`Pattern '${pattern}' must contain at least one 'M' for major version.`);
  }
  if (minorDigits === 0) {
    throw new CliError(`Pattern '${pattern}' must contain at least one 'm' for minor version.`);
  }
  if (patchDigits === 0) {
    throw new CliError(`Pattern '${pattern}' must contain at least one 'p' for patch version.`);
  }

  return {
    majorDigits,
    minorDigits,
    patchDigits,
    hotfixDigits,
  };
};

export const getMaxValueForDigits = (digits: number): number => {
  return Math.pow(10, digits) - 1;
};