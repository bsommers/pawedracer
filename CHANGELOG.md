# Changelog

All notable changes to Pawed Racer are documented here. Format: [Keep a Changelog](https://keepachangelog.com/); versioning: [SemVer](https://semver.org/).

## [Unreleased]

### Added
- Local SDXL + IP-Adapter generator adapter for the photo style (`--adapter sdxl`), see `tools/character-pipeline/SDXL.md`.
- `--tries N` best-of-N seed selection and a gradient-tolerant background matte (`floodMatte`) for the photo style.

## [v0.1.0] - 2026-11-21

### Added
- Pseudo-3D cheese pod racer: simulation core, procedural track generator, 4 tracks (parmesan, camembert, gouda, ...), AI opponents.
- Retro and toon art packs, plus a ghibli pack with its own render hooks (photoreal currently aliases toon).
- Synthesised audio: 30 SFX and 12 songs (not yet listened to by a human).
- UI shell: title, shop, tournament, pause and results flow; saved options and progress.
- Autopilot bot (`tools/botplay.mjs`) that finishes all tracks across seeds.
- Character pipeline (`tools/character-pipeline`) with placeholder assets in the public `character-library` repo.
- Web build (`tools/build-web.mjs`), smoke test, and a GitHub Pages showcase site at /play/.
- Swarm tracker dashboard.

### Changed
- Tracker listens on loopback only by default; set `TRACKER_ALLOW` to expose it on a LAN. LAN IP removed from docs.

### Known issues
- `render-frame.mjs` shows a red blob for sprites at near-zero distance.
- Pete's mock billboard fails the silhouette check.
