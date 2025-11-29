# capver

[![npm version](https://img.shields.io/npm/v/@capawesome/capver)](https://www.npmjs.com/package/@capawesome/capver)
[![npm downloads](https://img.shields.io/npm/dm/@capawesome/capver)](https://www.npmjs.com/package/@capawesome/capver)
[![license](https://img.shields.io/npm/l/@capawesome/capver)](https://github.com/capawesome-team/capver/blob/main/LICENSE)

CLI for managing versions in a Capacitor project across multiple platforms. 

<div class="capawesome-z29o10a">
  <a href="https://cloud.capawesome.io/" target="_blank">
    <img alt="Deliver Live Updates to your Capacitor app with Capawesome Cloud" src="https://cloud.capawesome.io/assets/banners/cloud-build-and-deploy-capacitor-apps.png?t=1" />
  </a>
</div>

## Features

- 📱 **Capacitor-native**: Designed specifically for Capacitor projects and workflows.
- 🤖 **Android**: Full Android platform support with build.gradle integration.
- 🍎 **iOS**: Complete iOS platform support with Xcode project integration.
- 🌐 **Web**: Complete web platform support with package.json integration.
- ⬆️ **Automatic increase**: Easily increment major, minor, patch, and hotfix versions.
- 🔧 **Hotfixes**: Support for hotfix versioning on mobile platforms.
- ⚙️ **Configurable patterns**: Customize build number patterns to fit your project needs.
- 🩺 **Health checks**: Verify version consistency across platforms with built-in diagnostics.
- 🎯 **Easy usage**: Simple commands with intuitive CLI interface.
- ✅ **Fully tested**: Comprehensive test coverage for reliable operation.

## Installation

The CLI can be installed globally via npm:

```bash
npm install -g @capawesome/capver
```

## Configuration

You can customize the behavior of the CLI by adding a `capver` section to your `package.json`.

### Pattern

The `pattern` field allows you to define the format of your build numbers. Here is an example configuration:

```json
{
  "name": "my-app",
  "version": "1.2.3",
  "capver": {
    "pattern": "MMmmmpphh"
  }
}
```

**Pattern format:**

- `M` = Major version digit (variable length)
- `m` = Minor version digit (fixed length)
- `p` = Patch version digit (fixed length)
- `h` = Hotfix version digit (optional)

**Common patterns:**

- `MMmmmpphh` (default) - Supports up to 999 minor, 99 patch, 99 hotfix
- `MMmmmppph` - Extended patch support (up to 999)
- `MMmmpp` - No hotfix support

## Usage

The CLI can be invoked with the `@capawesome/capver` command.

```bash
npx @capawesome/capver <command> [options]
```

```bash
# Initialize a new Capacitor project with version 0.0.1
npx @capawesome/capver set 0.0.1

# Increment the patch version
npx @capawesome/capver patch

# Increment the minor version
npx @capawesome/capver minor

# Increment the major version
npx @capawesome/capver major

# Increment only the build number
npx @capawesome/capver hotfix

# Check version consistency across platforms
npx @capawesome/capver get

# Synchronize all platforms to use the highest version found
npx @capawesome/capver sync
```

## Commands

### get

Get the version of the app from all relevant files.

```bash
npx @capawesome/capver get
```

This command displays the current version across all platforms and verifies they are synchronized.

### set

Set the version of the app in all relevant files.

```bash
npx @capawesome/capver set <version>
```

**Arguments:**
- `version` - Version in format `major.minor.patch` (e.g., `1.2.3`)

### major

Increment the major version of the app in all relevant files.

```bash
npx @capawesome/capver major
```

Increments the major version number (e.g., `1.2.3` → `2.0.0`).

### minor

Increment the minor version of the app in all relevant files.

```bash
npx @capawesome/capver minor
```

Increments the minor version number (e.g., `1.2.3` → `1.3.0`). Maximum value depends on your configured pattern.

### patch

Increment the patch version of the app in all relevant files.

```bash
npx @capawesome/capver patch
```

Increments the patch version number (e.g., `1.2.3` → `1.2.4`). Maximum value depends on your configured pattern.

### hotfix

Increment the hotfix version of the app in all relevant files.

```bash
npx @capawesome/capver hotfix
```

Increments the hotfix version for mobile platforms (iOS/Android only). Maximum value depends on your configured pattern.

### sync

Set the highest version number among all platforms in all relevant files.

```bash
npx @capawesome/capver sync
```

Synchronizes all platforms to use the highest version found across any platform.

### doctor

Prints out necessary information for debugging.

```bash
npx @capawesome/capver doctor
```

Displays system information including Node.js, NPM, CLI version, and OS details.

## Help

The CLI ships with command documentation that is accessible with the `--help` flag.

```bash
npx @capawesome/capver --help
```

## Integrations

### Commit and Tag Version

The [commit-and-tag-version](https://www.npmjs.com/package/commit-and-tag-version) package offers automatic versioning, changelog generation, and Git tagging using conventional commits. You can integrate it with the `@capawesome/capver` CLI for a seamless versioning experience. Just add the following configuration to your `package.json`:

```json
{
    "version": "0.0.1",
    "scripts": {
        "release": "commit-and-tag-version --commit-all"
    },
    "commit-and-tag-version": {
        "scripts": {
            "postbump": "npx @capawesome/capver set $(node -p \"require('./package.json').version\") && git add android/app/build.gradle ios/App/App/Info.plist"
        }
    }
}
```

This configuration ensures that the version is automatically updated in all relevant files whenever a new version is released. Just run `npm run release` to automatically bump the version, update all relevant files, and commit the changes.

## Development

Run the following commands to get started with development:

1. Clone the repository:

    ```bash
    git clone https://github.com/capawesome-team/capver.git
    ```

2. Install dependencies:

    ```bash
    npm install
    ```

3. Run your first command:

    ```bash
    npm start -- --help
    ```

    **Note:** The `--` is required to pass arguments to the script.

## Changelog

See [CHANGELOG](./CHANGELOG.md).

## License

See [LICENSE](./LICENSE.md).
