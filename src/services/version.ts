import { CliError } from '@/utils/error.js';
import {
  Version,
  compareVersions,
  parseBuildNumber,
  parseVersion,
  versionToBuildNumber,
  versionToString,
} from '@/utils/version.js';
import { MobileProject, Logger } from '@trapezedev/project';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// Disable Trapeze logging
Logger.log = () => {};
Logger.v = () => {};
Logger.debug = () => {};
Logger.warn = () => {};
Logger.error = () => {};

export interface PlatformVersion {
  platform: 'ios' | 'android' | 'web';
  version: Version;
  source: string;
}

export class VersionService {
  private projectPath: string;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
  }

  async getAllVersions(): Promise<PlatformVersion[]> {
    const versions: PlatformVersion[] = [];

    const iosVersion = await this.getIosVersion();
    if (iosVersion) {
      versions.push(iosVersion);
    }

    const androidVersion = await this.getAndroidVersion();
    if (androidVersion) {
      versions.push(androidVersion);
    }

    const webVersion = await this.getWebVersion();
    if (webVersion) {
      versions.push(webVersion);
    }

    return versions;
  }

  async getIosVersion(): Promise<PlatformVersion | null> {
    const iosPath = join(this.projectPath, 'ios');
    if (!existsSync(iosPath)) {
      return null;
    }

    try {
      const project = new MobileProject(this.projectPath, {
        ios: {
          path: 'ios/App',
        },
      });
      await project.load();

      if (!project.ios) {
        return null;
      }

      const iosProject = project.ios.getPbxProject();
      if (!iosProject) {
        return null;
      }

      const buildNumber = await project.ios.getBuild(null, null);
      if (!buildNumber) {
        return null;
      }

      const version = parseBuildNumber(buildNumber);
      return {
        platform: 'ios',
        version,
        source: 'ios/App/App.xcodeproj/project.pbxproj',
      };
    } catch (error) {
      return null;
    }
  }

  async getAndroidVersion(): Promise<PlatformVersion | null> {
    const androidPath = join(this.projectPath, 'android');
    if (!existsSync(androidPath)) {
      return null;
    }

    try {
      const project = new MobileProject(this.projectPath, {
        android: {
          path: 'android',
        },
      });
      await project.load();

      if (!project.android) {
        return null;
      }

      const versionCode = await project.android.getVersionCode();
      if (!versionCode) {
        return null;
      }

      const version = parseBuildNumber(versionCode);
      return {
        platform: 'android',
        version,
        source: 'android/app/build.gradle',
      };
    } catch (error) {
      return null;
    }
  }

  async getWebVersion(): Promise<PlatformVersion | null> {
    const packageJsonPath = join(this.projectPath, 'package.json');
    if (!existsSync(packageJsonPath)) {
      return null;
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (!packageJson.version) {
        return null;
      }

      // Web only has version string, no build number (hotfix will always be 0)
      const version = parseVersion(packageJson.version);

      return {
        platform: 'web',
        version,
        source: 'package.json',
      };
    } catch (error) {
      return null;
    }
  }

  async setVersion(version: Version): Promise<void> {
    const iosPath = join(this.projectPath, 'ios');
    const androidPath = join(this.projectPath, 'android');
    const packageJsonPath = join(this.projectPath, 'package.json');

    const project = new MobileProject(this.projectPath, {
      ios: existsSync(iosPath)
        ? {
            path: 'ios/App',
          }
        : undefined,
      android: existsSync(androidPath)
        ? {
            path: 'android',
          }
        : undefined,
    });

    await project.load();

    const versionString = versionToString(version);
    const buildNumber = versionToBuildNumber(version);

    if (project.ios) {
      await project.ios.setVersion(null, null, versionString);
      await project.ios.setBuild(null, null, buildNumber.toString());

      const infoPlistPath = await project.ios.getInfoPlist(null, null);
      if (infoPlistPath) {
        const infoPlist = await project.ios.getPlistFile(infoPlistPath);
        if (infoPlist) {
          await infoPlist.set({
            CFBundleShortVersionString: versionString,
            CFBundleVersion: buildNumber.toString(),
          });
        }
      }
    }

    if (project.android) {
      await project.android.setVersionName(versionString);
      await project.android.setVersionCode(buildNumber);
    }

    if (existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      packageJson.version = versionString;
      // Web only stores version string, not build number
      const fs = await import('fs/promises');
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
    }

    await project.commit();
  }

  async ensureVersionsInSync(): Promise<Version> {
    const versions = await this.getAllVersions();

    const firstVersion = versions && versions[0] ? versions[0].version : null;
    if (!firstVersion) {
      throw new CliError('No platform versions found');
    }

    // Check major.minor.patch synchronization for all platforms
    const allVersionsInSync = versions.every(
      (pv) =>
        pv.version.major === firstVersion.major &&
        pv.version.minor === firstVersion.minor &&
        pv.version.patch === firstVersion.patch,
    );

    if (!allVersionsInSync) {
      const versionStrings = versions.map((pv) => {
        const versionStr = versionToString(pv.version);
        const hotfixStr = pv.platform !== 'web' && pv.version.hotfix ? ` (hotfix: ${pv.version.hotfix})` : '';
        return `${pv.platform}: ${versionStr}${hotfixStr} (${pv.source})`;
      });
      throw new CliError(`Versions are not synchronized across platforms:\n${versionStrings.join('\n')}`);
    }

    // Check hotfix synchronization between iOS and Android only
    const iosVersion = versions.find((pv) => pv.platform === 'ios');
    const androidVersion = versions.find((pv) => pv.platform === 'android');

    if (iosVersion && androidVersion) {
      const iosHotfix = iosVersion.version.hotfix || 0;
      const androidHotfix = androidVersion.version.hotfix || 0;

      if (iosHotfix !== androidHotfix) {
        throw new CliError(
          `Hotfix versions are not synchronized between iOS and Android:\n` +
            `iOS: ${versionToString(iosVersion.version)} (hotfix: ${iosHotfix})\n` +
            `Android: ${versionToString(androidVersion.version)} (hotfix: ${androidHotfix})`,
        );
      }
    }

    // Return version with hotfix from iOS or Android if available
    const versionWithHotfix = versions.find(
      (pv) => pv.platform !== 'web' && pv.version.hotfix && pv.version.hotfix > 0,
    );
    return versionWithHotfix ? versionWithHotfix.version : firstVersion;
  }

  async getHighestVersion(): Promise<Version> {
    const versions = await this.getAllVersions();

    if (versions.length === 0) {
      throw new CliError('No platform versions found');
    }

    let highest = versions[0]!;
    for (const current of versions) {
      if (compareVersions(current.version, highest.version) > 0) {
        highest = current;
      }
    }
    return highest.version;
  }
}

export default new VersionService();
