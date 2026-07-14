import { CapacitorPaths, loadCapacitorConfig } from '@/utils/capacitor-config.js';
import { CliError } from '@/utils/error.js';
import { Platform, platformSupportsHotfix } from '@/utils/platform.js';
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
  platform: Platform;
  version: Version;
  source: string;
}

export class VersionService {
  private projectPath: string;
  private capacitorPaths: CapacitorPaths | undefined;

  constructor(projectPath: string = process.cwd()) {
    this.projectPath = projectPath;
  }

  private async getCapacitorPaths(): Promise<CapacitorPaths> {
    if (!this.capacitorPaths) {
      this.capacitorPaths = await loadCapacitorConfig(this.projectPath);
    }
    return this.capacitorPaths;
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

    const electronVersion = await this.getElectronVersion();
    if (electronVersion) {
      versions.push(electronVersion);
    }

    return versions;
  }

  async getIosVersion(): Promise<PlatformVersion | null> {
    const { iosPath } = await this.getCapacitorPaths();
    const fullIosPath = join(this.projectPath, iosPath);
    if (!existsSync(fullIosPath)) {
      return null;
    }

    try {
      const project = new MobileProject(this.projectPath, {
        ios: {
          path: `${iosPath}/App`,
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

      const version = parseBuildNumber(buildNumber, this.projectPath);
      return {
        platform: 'ios',
        version,
        source: `${iosPath}/App/App.xcodeproj/project.pbxproj`,
      };
    } catch (error) {
      return null;
    }
  }

  async getAndroidVersion(): Promise<PlatformVersion | null> {
    const { androidPath } = await this.getCapacitorPaths();
    const fullAndroidPath = join(this.projectPath, androidPath);
    if (!existsSync(fullAndroidPath)) {
      return null;
    }

    try {
      const project = new MobileProject(this.projectPath, {
        android: {
          path: androidPath,
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

      const version = parseBuildNumber(versionCode, this.projectPath);
      return {
        platform: 'android',
        version,
        source: `${androidPath}/app/build.gradle`,
      };
    } catch (error) {
      return null;
    }
  }

  async getWebVersion(): Promise<PlatformVersion | null> {
    return this.getPackageJsonVersion('package.json', 'web');
  }

  async getElectronVersion(): Promise<PlatformVersion | null> {
    return this.getPackageJsonVersion(join('electron', 'package.json'), 'electron');
  }

  private getPackageJsonVersion(relativePath: string, platform: Platform): PlatformVersion | null {
    const packageJsonPath = join(this.projectPath, relativePath);
    if (!existsSync(packageJsonPath)) {
      return null;
    }

    try {
      const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
      if (!packageJson.version) {
        return null;
      }

      // package.json only has a version string, no build number (hotfix will always be 0)
      const version = parseVersion(packageJson.version);

      return {
        platform,
        version,
        source: relativePath,
      };
    } catch (error) {
      return null;
    }
  }

  async setVersion(version: Version): Promise<void> {
    const capacitorPaths = await this.getCapacitorPaths();
    const fullIosPath = join(this.projectPath, capacitorPaths.iosPath);
    const fullAndroidPath = join(this.projectPath, capacitorPaths.androidPath);

    const project = new MobileProject(this.projectPath, {
      ios: existsSync(fullIosPath)
        ? {
            path: `${capacitorPaths.iosPath}/App`,
          }
        : undefined,
      android: existsSync(fullAndroidPath)
        ? {
            path: capacitorPaths.androidPath,
          }
        : undefined,
    });

    await project.load();

    const versionString = versionToString(version);
    const buildNumber = versionToBuildNumber(version, this.projectPath);

    if (project.ios) {
      await project.ios.setVersion(null, null, versionString);
      await project.ios.setBuild(null, null, buildNumber.toString());
    }

    if (project.android) {
      await project.android.setVersionName(versionString);
      await project.android.setVersionCode(buildNumber);
    }

    // Web and Electron only store a version string, not a build number
    await this.setPackageJsonVersion('package.json', versionString);
    await this.setPackageJsonVersion(join('electron', 'package.json'), versionString);

    await project.commit();
  }

  private async setPackageJsonVersion(relativePath: string, versionString: string): Promise<void> {
    const packageJsonPath = join(this.projectPath, relativePath);
    if (!existsSync(packageJsonPath)) {
      return;
    }

    const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));
    packageJson.version = versionString;
    const fs = await import('fs/promises');
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2) + '\n');
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
        const hotfixStr =
          platformSupportsHotfix(pv.platform) && pv.version.hotfix ? ` (hotfix: ${pv.version.hotfix})` : '';
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
      (pv) => platformSupportsHotfix(pv.platform) && pv.version.hotfix && pv.version.hotfix > 0,
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
