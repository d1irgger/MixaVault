<div align="center" id="home">

<h1>Mixa Vault</h1>

A local-first Android password manager.

iOS-style lists · Local data · Offline AI · Encrypted backups

`Android 10+` · `0.9.2`

[Live Preview](https://d1irgger.github.io/MixaVault/) · [Download latest](https://github.com/d1irgger/MixaVault/releases/latest) · [中文](README.md)

</div>

---

<p align="center">
<a href="#screens">Screenshots</a> ·
<a href="#overview">Overview</a> ·
<a href="#details">Details</a> ·
<a href="#paths">Paths</a> ·
<a href="#license">License</a>
</p>

<h2 id="screens">Screenshots</h2>

<table align="center">
  <tr valign="top">
    <td align="center">
      <img src="docs/preview.png" width="300" alt="Account list">
      <br><sub>Account list</sub>
    </td>
    <td align="center">
      <img src="docs/preview-cards.png" width="300" alt="Account cards">
      <br><sub>Account cards</sub>
    </td>
  </tr>
</table>

<h2 id="overview">Overview</h2>

| Area | Details |
|---|---|
| Accounts | Search, add, edit, delete |
| Passwords | Show/hide, sensitive clipboard copy |
| Import | JSON, CSV, TXT, Markdown, HTML |
| On-device AI | Needle 2 extraction for Chinese labels and three-line notes |
| Backup | Plain JSON or AES-GCM encrypted `.mixa` |
| System | Light/dark, Chinese/English, no network permission |

<h2 id="details">Details</h2>

<details>
<summary><strong>Accounts & UI</strong></summary>

- iOS-style grouped cards and bottom tab bar.
- Search, add, edit, and delete accounts.
- Expand a card for password, URL, and note.
- Password masked by default; tap the eye to reveal.
- One-tap copy, marked as sensitive clipboard content on Android.
- Follows system light/dark mode.
- Follows system Chinese/English language.

</details>

<details>
<summary><strong>Security</strong></summary>

- Local accounts are plaintext JSON in the app's private directory, with no master password.
- The encrypted backup switch only affects exported `.mixa` files.
- Backup passwords are not stored and cannot be recovered.
- The app has no network permission and uploads no accounts or logs.
- Android auto-backup is disabled.
- Uninstalling the app or clearing data deletes local accounts.

> An unlocked or rooted device, or a debug build, may still expose local plaintext data.

</details>

<details>
<summary><strong>Install & Upgrade</strong></summary>

Download the latest APK from [GitHub Releases](https://github.com/d1irgger/MixaVault/releases/latest).

| Case | Action |
|---|---|
| First install | Allow installation from unknown sources |
| Same-signature update | Install over the existing app; data stays |
| Debug / old signature | Export `.mixa`, uninstall, install, import |
| AI support | `arm64` devices only; emulators hide the AI button |

GitHub releases do not update in the background. Download and install manually, or use Obtainium to follow releases.

</details>

<details>
<summary><strong>Backup & Restore</strong></summary>

Settings → File:

```text
Encrypted backup off → Download/MixaVault/plain JSON
Encrypted backup on  → Download/MixaVault/backups/.mixa
```

Restore:

```text
Import → choose .mixa → enter password
```

Diagnostics:

```text
Settings → Diagnostics → Export
```

</details>

<details>
<summary><strong>Build</strong></summary>

See [BUILD.md](BUILD.md) for the complete steps.

```powershell
cd mixa-vault
.\gradlew.bat assembleRelease
```

Requires JDK 21, Android SDK 35, NDK, CMake, and 64-bit Python 3.14. Exact versions are in [COMPATIBILITY.md](COMPATIBILITY.md).

</details>

<details>
<summary><strong>Docs</strong></summary>

- [BUILD.md](BUILD.md) — build from scratch
- [COMPATIBILITY.md](COMPATIBILITY.md) — toolchain and compatibility
- [GITHUB.md](GITHUB.md) — repository and release workflow
- [TRAINING.md](TRAINING.md) — offline AI fine-tuning
- [CHANGELOG.md](CHANGELOG.md) — version history

</details>

<h2 id="paths">Paths</h2>

| Content | Location |
|---|---|
| Local accounts | App private directory |
| Plain export | `Download/MixaVault` |
| Encrypted backup | `Download/MixaVault/backups` |
| Diagnostics | `Download` |

<h2 id="license">Third Party & License</h2>

Needle 2 is published by Cactus Compute under Apache-2.0. See [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Application code is licensed under MIT. See [LICENSE](LICENSE).

---

<p align="center">
<sub>Mixa Vault · 0.9.2 · No ads · No telemetry</sub>
</p>
