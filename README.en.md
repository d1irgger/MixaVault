# Mixa Vault

[中文](README.md) | English

A personal Android password manager. The UI runs in a WebView, data is handled locally by Python, and AI extraction runs entirely on-device.

Current version: `0.9.2`

<table>
  <tr>
    <td><img src="docs/preview.png" width="300" alt="Main screen"></td>
    <td><img src="docs/preview-dark.png" width="300" alt="Dark mode"></td>
  </tr>
</table>

## Features

- iOS-style account list with search, add, edit, and delete.
- Show/hide passwords and copy them as sensitive clipboard content.
- Automatic light/dark mode and Chinese/English UI.
- Expandable cards for password, URL, and note.
- Import from JSON, CSV, TXT, Markdown, and HTML.
- On-device Needle 2 extraction for common Chinese labels and three-line notes.
- Optional encrypted backups with `.mixa` restore.
- Plain JSON and diagnostic logs are written directly to Download.
- No network permission, ads, analytics SDK, or telemetry.

## Security

- Account data is stored in the app's private directory as plaintext JSON by default.
- The app opens without a master password.
- The encryption switch only affects exported `.mixa` backups, not local data.
- Encrypted backups use standard authenticated encryption. The password is not stored and cannot be recovered.
- The app has no network permission and does not upload accounts or logs.
- Android auto-backup is disabled.
- Uninstalling the app or clearing app data deletes local accounts.

Anyone with an unlocked or rooted device, or a debug build, may still access local plaintext data.

## Install

Download the latest APK from GitHub Releases.

- Android 10 or later.
- `arm64` devices support on-device AI; `x86_64` emulators hide the AI button.
- Allow installation from unknown sources on first install.

### Updates

If the APK uses the same signing certificate and a higher `versionCode`, it can be installed over the existing app. **No uninstall is required**, and account data is preserved.

Back up to `.mixa`, uninstall, and reinstall only when:

- Moving from a debug-signed build
- The signing certificate changes
- The application ID changes

GitHub releases do not update in the background. Users can download and install a new APK manually, or use a tool such as Obtainium to follow releases.

## Backup

Settings → File:

- Encrypted backup off: export plaintext JSON to `Download/MixaVault`.
- Encrypted backup on: export `.mixa` to `Download/MixaVault/backups`.

Restore:

```text
Import → choose .mixa → enter password
```

Diagnostics:

```text
Settings → Diagnostics → Export
```

## Build

See [BUILD.md](BUILD.md) for the complete build steps.

```powershell
cd mixa-vault
.\gradlew.bat assembleRelease
```

Requires JDK 21, Android SDK 35, NDK, CMake, and 64-bit Python 3.14. Exact versions are listed in [COMPATIBILITY.md](COMPATIBILITY.md).

## Docs

- [BUILD.md](BUILD.md): build from scratch
- [COMPATIBILITY.md](COMPATIBILITY.md): toolchain and compatibility
- [GITHUB.md](GITHUB.md): repository and release workflow
- [TRAINING.md](TRAINING.md): offline AI fine-tuning
- [CHANGELOG.md](CHANGELOG.md): version history

## Third Party

Needle 2 is published by Cactus Compute under Apache-2.0.  
See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

## License

Application code is licensed under MIT. See [LICENSE](LICENSE).
