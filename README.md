# Pawed Racer

A pod-racing parody. Colby, an orange tabby, races Perring Parkway Pete, a gaunt red-eyed rat, across eight cheese-themed tracks.

- **Play:** https://bsommers.github.io/pawedracer/ (the game is at `/play/`)
- **Controls and rules:** [docs/HOW-TO-PLAY.md](docs/HOW-TO-PLAY.md)
- **How it was made:** [docs/HOW-IT-WAS-MADE.md](docs/HOW-IT-WAS-MADE.md)
- **Architecture contract:** [ARCHITECTURE.md](ARCHITECTURE.md)

## Run locally

Requires Node 22 or later. There are no runtime dependencies.

```sh
npm start            # dev server on http://localhost:4861/
node tools/build-web.mjs   # single-file build: dist/pawgger.html
npm test             # node test suite
```

Useful URL parameters: `?style=retro|toon|ghibli`, `track=<id>`, `seed=<n>`, `laps=<n>`, `nosound`.

## Status

Playable in the browser, with known gaps:

- **Ghibli style:** code exists but has not been checked by eye in real play.
- **Photo style:** not built. It draws the toon style.
- **Audio:** sound effects and music are generated from code and have not been listened to.
- **Balance:** the bot finished the Brie Beach Run test seeds. Other tracks and human play are not yet checked.

## Libraries

- `../pawfall-assets` (local) or [github.com/bsommers/pawfall-assets](https://github.com/bsommers/pawfall-assets)
- `../character-library` (local) or [github.com/bsommers/character-library](https://github.com/bsommers/character-library)
