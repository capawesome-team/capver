import { getMaxValueForDigits, loadConfig, parsePattern } from './config.js';
import { CliError } from './error.js';

export interface Version {
  major: number;
  minor: number;
  patch: number;
  hotfix?: number;
}

export const parseVersion = (versionString: string): Version => {
  const parts = versionString.split('.');
  if (parts.length !== 3) {
    throw new CliError(`Invalid version format: ${versionString}. Expected format: major.minor.patch`);
  }

  const major = parseInt(parts[0] || '0', 10);
  const minor = parseInt(parts[1] || '0', 10);
  const patch = parseInt(parts[2] || '0', 10);

  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    throw new CliError(`Invalid version format: ${versionString}. Version parts must be numbers.`);
  }

  if (major < 0 || minor < 0 || patch < 0) {
    throw new CliError(`Invalid version format: ${versionString}. Version parts must be non-negative.`);
  }

  return { major, minor, patch };
};

export const parseBuildNumber = (buildNumber: string | number, projectPath: string = process.cwd()): Version => {
  const buildStr = buildNumber.toString();
  const config = loadConfig(projectPath);
  const pattern = parsePattern(config.pattern);

  const minRequiredLength = pattern.minorDigits + pattern.patchDigits + pattern.hotfixDigits;
  if (buildStr.length < minRequiredLength + 1) {
    // +1 for at least one major digit
    throw new CliError(
      `Invalid build number: ${buildNumber}. Build number must be at least ${minRequiredLength + 1} digits for pattern '${config.pattern}'.`,
    );
  }

  const fixedPartStart = buildStr.length - (pattern.minorDigits + pattern.patchDigits + pattern.hotfixDigits);
  const major = parseInt(buildStr.substring(0, fixedPartStart), 10);

  let currentPos = fixedPartStart;
  const minor = parseInt(buildStr.substring(currentPos, currentPos + pattern.minorDigits), 10);
  currentPos += pattern.minorDigits;

  const patch = parseInt(buildStr.substring(currentPos, currentPos + pattern.patchDigits), 10);
  currentPos += pattern.patchDigits;

  let hotfix = 0;
  if (pattern.hotfixDigits > 0) {
    hotfix = parseInt(buildStr.substring(currentPos, currentPos + pattern.hotfixDigits), 10);
  }

  return { major, minor, patch, hotfix: hotfix > 0 ? hotfix : undefined };
};

export const versionToString = (version: Version): string => {
  return `${version.major}.${version.minor}.${version.patch}`;
};

export const versionToBuildNumber = (version: Version, projectPath: string = process.cwd()): number => {
  const config = loadConfig(projectPath);
  const pattern = parsePattern(config.pattern);

  const majorStr = version.major.toString();
  const minor = version.minor.toString().padStart(pattern.minorDigits, '0');
  const patch = version.patch.toString().padStart(pattern.patchDigits, '0');
  let hotfix = '';

  if (pattern.hotfixDigits > 0) {
    hotfix = (version.hotfix || 0).toString().padStart(pattern.hotfixDigits, '0');
  }

  const maxMinor = getMaxValueForDigits(pattern.minorDigits);
  const maxPatch = getMaxValueForDigits(pattern.patchDigits);

  if (version.minor > maxMinor) {
    throw new CliError(
      `Minor version ${version.minor} exceeds maximum value of ${maxMinor} for pattern '${config.pattern}'`,
    );
  }
  if (version.patch > maxPatch) {
    throw new CliError(
      `Patch version ${version.patch} exceeds maximum value of ${maxPatch} for pattern '${config.pattern}'`,
    );
  }

  if (pattern.hotfixDigits > 0) {
    const maxHotfix = getMaxValueForDigits(pattern.hotfixDigits);
    if (version.hotfix && version.hotfix > maxHotfix) {
      throw new CliError(
        `Hotfix version ${version.hotfix} exceeds maximum value of ${maxHotfix} for pattern '${config.pattern}'`,
      );
    }
  }

  return parseInt(`${majorStr}${minor}${patch}${hotfix}`, 10);
};

export const incrementMajor = (version: Version): Version => {
  const newMajor = version.major + 1;
  return { major: newMajor, minor: 0, patch: 0 };
};

export const incrementMinor = (version: Version, projectPath: string = process.cwd()): Version => {
  const config = loadConfig(projectPath);
  const pattern = parsePattern(config.pattern);
  const maxMinor = getMaxValueForDigits(pattern.minorDigits);

  const newMinor = version.minor + 1;
  if (newMinor > maxMinor) {
    throw new CliError(
      `Cannot increment minor version: would exceed maximum value of ${maxMinor} for pattern '${config.pattern}'`,
    );
  }
  return { major: version.major, minor: newMinor, patch: 0 };
};

export const incrementPatch = (version: Version, projectPath: string = process.cwd()): Version => {
  const config = loadConfig(projectPath);
  const pattern = parsePattern(config.pattern);
  const maxPatch = getMaxValueForDigits(pattern.patchDigits);

  const newPatch = version.patch + 1;
  if (newPatch > maxPatch) {
    throw new CliError(
      `Cannot increment patch version: would exceed maximum value of ${maxPatch} for pattern '${config.pattern}'`,
    );
  }
  return { major: version.major, minor: version.minor, patch: newPatch };
};

export const incrementHotfix = (version: Version, projectPath: string = process.cwd()): Version => {
  const config = loadConfig(projectPath);
  const pattern = parsePattern(config.pattern);
  const maxHotfix = getMaxValueForDigits(pattern.hotfixDigits);

  if (pattern.hotfixDigits === 0) {
    throw new CliError(`Cannot increment hotfix version: pattern '${config.pattern}' does not include hotfix digits`);
  }

  const currentHotfix = version.hotfix || 0;
  const newHotfix = currentHotfix + 1;
  if (newHotfix > maxHotfix) {
    throw new CliError(
      `Cannot increment hotfix version: would exceed maximum value of ${maxHotfix} for pattern '${config.pattern}'`,
    );
  }
  return { ...version, hotfix: newHotfix };
};

export const compareVersions = (v1: Version, v2: Version): number => {
  if (v1.major !== v2.major) return v1.major - v2.major;
  if (v1.minor !== v2.minor) return v1.minor - v2.minor;
  if (v1.patch !== v2.patch) return v1.patch - v2.patch;
  const h1 = v1.hotfix || 0;
  const h2 = v2.hotfix || 0;
  if (h1 !== h2) return h1 - h2;
  return 0;
};

export const versionsEqual = (v1: Version, v2: Version, ignoreHotfix = false): boolean => {
  if (ignoreHotfix) {
    return v1.major === v2.major && v1.minor === v2.minor && v1.patch === v2.patch;
  }
  return compareVersions(v1, v2) === 0;
};
