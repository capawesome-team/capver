export type Platform = 'ios' | 'android' | 'web' | 'electron';

// Only native platforms encode a build number and therefore support hotfixes.
// Web and Electron store a plain `major.minor.patch` version string in package.json.
export const platformSupportsHotfix = (platform: Platform): boolean => platform === 'ios' || platform === 'android';
