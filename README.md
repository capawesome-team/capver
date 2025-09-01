# capver

[![npm version](https://img.shields.io/npm/v/capver)](https://www.npmjs.com/package/capver)
[![npm downloads](https://img.shields.io/npm/dm/capver)](https://www.npmjs.com/package/capver)
[![license](https://img.shields.io/npm/l/capver)](https://github.com/capawesome-team/capver/blob/main/LICENSE)

CLI for managing versions in a Capacitor project across multiple platforms. 

## Features

- 📱 **Capacitor-native**: Designed specifically for Capacitor projects and workflows.
- 🚀 **Multi-platform**: Synchronize versions across iOS, Android, and web platforms.
- 🔄 **Version management**: Set, get, increment (major/minor/patch), and sync versions.
- 🩺 **Health checks**: Verify version consistency across platforms with built-in diagnostics.

## Installation

The CLI can be installed globally via npm:

```bash
npm install -g capver
```

## Usage

The CLI can be invoked with the `capver` command.

```bash
npx capver <command> [options]
```

## Commands

### get

Get the version of the app from all relevant files.

```bash
npx capver get
```

This command displays the current version across all platforms and verifies they are synchronized.

### set

Set the version of the app in all relevant files.

```bash
npx capver set <version>
```

**Arguments:**
- `version` - Version in format `major.minor.patch` (e.g., `1.2.3`)

### major

Increment the major version of the app in all relevant files.

```bash
npx capver major
```

Increments the major version number (e.g., `1.2.3` → `2.0.0`).

### minor

Increment the minor version of the app in all relevant files.

```bash
npx capver minor
```

Increments the minor version number (e.g., `1.2.3` → `1.3.0`). Maximum value: 999.

### patch

Increment the patch version of the app in all relevant files.

```bash
npx capver patch
```

Increments the patch version number (e.g., `1.2.3` → `1.2.4`). Maximum value: 99.

### hotfix

Increment the hotfix version of the app in all relevant files.

```bash
npx capver hotfix
```

Increments the hotfix version for mobile platforms (iOS/Android only). Maximum value: 99.

### sync

Set the highest version number among all platforms in all relevant files.

```bash
npx capver sync
```

Synchronizes all platforms to use the highest version found across any platform.

### doctor

Prints out necessary information for debugging.

```bash
npx capver doctor
```

Displays system information including Node.js, NPM, CLI version, and OS details.

## Help

The CLI ships with command documentation that is accessible with the `--help` flag.

```bash
npx capver --help
```

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
