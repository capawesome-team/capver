export interface Version {
  major: number;
  minor: number;
  patch: number;
  hotfix?: number;
}

export const parseVersion = (versionString: string): Version => {
  const parts = versionString.split('.');
  if (parts.length !== 3) {
    throw new Error(`Invalid version format: ${versionString}. Expected format: major.minor.patch`);
  }

  const major = parseInt(parts[0] || '0', 10);
  const minor = parseInt(parts[1] || '0', 10);
  const patch = parseInt(parts[2] || '0', 10);

  if (isNaN(major) || isNaN(minor) || isNaN(patch)) {
    throw new Error(`Invalid version format: ${versionString}. Version parts must be numbers.`);
  }

  if (major < 0 || minor < 0 || patch < 0) {
    throw new Error(`Invalid version format: ${versionString}. Version parts must be non-negative.`);
  }

  return { major, minor, patch };
};

export const parseBuildNumber = (buildNumber: string | number): Version => {
  const buildStr = buildNumber.toString();

  // Build number format: [major][minor:3][patch:2][hotfix:2]
  // The last 7 digits are always minor(3) + patch(2) + hotfix(2)
  if (buildStr.length < 8) {
    throw new Error(`Invalid build number: ${buildNumber}. Build number must be at least 8 digits.`);
  }

  const fixedPartStart = buildStr.length - 7;
  const major = parseInt(buildStr.substring(0, fixedPartStart), 10);
  const minor = parseInt(buildStr.substring(fixedPartStart, fixedPartStart + 3), 10);
  const patch = parseInt(buildStr.substring(fixedPartStart + 3, fixedPartStart + 5), 10);
  const hotfix = parseInt(buildStr.substring(fixedPartStart + 5, fixedPartStart + 7), 10);

  return { major, minor, patch, hotfix };
};

export const versionToString = (version: Version): string => {
  return `${version.major}.${version.minor}.${version.patch}`;
};

export const versionToBuildNumber = (version: Version): number => {
  // Build number format: [major][minor:3][patch:2][hotfix:2]
  // Major version has no limit and uses as many digits as needed
  const majorStr = version.major.toString();
  const minor = version.minor.toString().padStart(3, '0');
  const patch = version.patch.toString().padStart(2, '0');
  const hotfix = (version.hotfix || 0).toString().padStart(2, '0');

  if (version.minor > 999) {
    throw new Error(`Minor version ${version.minor} exceeds maximum value of 999`);
  }
  if (version.patch > 99) {
    throw new Error(`Patch version ${version.patch} exceeds maximum value of 99`);
  }
  if (version.hotfix && version.hotfix > 99) {
    throw new Error(`Hotfix version ${version.hotfix} exceeds maximum value of 99`);
  }

  return parseInt(`${majorStr}${minor}${patch}${hotfix}`, 10);
};

export const incrementMajor = (version: Version): Version => {
  const newMajor = version.major + 1;
  return { major: newMajor, minor: 0, patch: 0 };
};

export const incrementMinor = (version: Version): Version => {
  const newMinor = version.minor + 1;
  if (newMinor > 999) {
    throw new Error(`Cannot increment minor version: would exceed maximum value of 999`);
  }
  return { major: version.major, minor: newMinor, patch: 0 };
};

export const incrementPatch = (version: Version): Version => {
  const newPatch = version.patch + 1;
  if (newPatch > 99) {
    throw new Error(`Cannot increment patch version: would exceed maximum value of 99`);
  }
  return { major: version.major, minor: version.minor, patch: newPatch };
};

export const incrementHotfix = (version: Version): Version => {
  const currentHotfix = version.hotfix || 0;
  const newHotfix = currentHotfix + 1;
  if (newHotfix > 99) {
    throw new Error(`Cannot increment hotfix version: would exceed maximum value of 99`);
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
