# How to play Pawed Racer

Colby, an orange tabby, races Perring Parkway Pete, a gaunt red-eyed rat, around cheese-themed tracks. Finish the lap count in the top places to win. Hit a hazard and you lose health. Run out of health and you wreck, then respawn on the road after two seconds with no speed.

Play it in a browser at https://bsommers.github.io/pawedracer/ (the game is at `/play/`), or run it locally with `npm start` and open http://localhost:4861/.

## Controls (keyboard)

| Action | Keys |
|---|---|
| Steer | Left / Right arrows, or A / D |
| Throttle | Up arrow, or W |
| Brake | Down arrow, or S |
| Boost (uses boost charge, adds heat) | Space |
| Barrel roll (short invulnerability, slides sideways) | X |
| Yaw left / right | Z / C |
| Pause | P |
| Cycle visual style | G |
| Mute | M |
| Menus: confirm / back | Enter (or Space, Z, X) / Escape |

Gamepads and touch controls are supported by the input layer. Touch and gamepad controls have not been checked on real hardware.

## The HUD

- **Top left:** position (for example 3/8) and lap (for example 2/3).
- **Top right:** speed in km/h and your best lap.
- **Bottom left:** heat bar and hull (health) bar. Heat rises when you boost. At full heat your pod stalls until it cools.
- **Bottom centre:** boost charge. It shows "BOOST READY" when you can use it.
- **Bottom right:** Pete's radio portrait and subtitles. Pete taunts you there.

## Hazards

| Hazard | What it does |
|---|---|
| Cheddar wedge | Solid obstacle on the road. Damage. |
| Cheese wheel | Solid, rolls across the road on a timer. Damage. |
| Grater strip | Slows you and rattles you. Small damage. |
| Cutter | Solid, swings side to side on a timer. Heavy damage. |
| Fondue puddle | Small damage. |
| Stink cloud | No damage. Its effect is not documented here; check it in play. |
| Mine (Pete drops these) | Solid, heavy damage. Pete leaves them behind him on straights. |
| Hole | Costs you health. |

The table lists the hazard kinds defined in `src/core/defs.js`. The on-track behaviour is tuned in the sim, so check it in play.

## Pete

Pete is a dirty racer. He shoves you when you ride alongside, cuts the apex on corners, drops mines behind him when you are close behind on a straight, and boosts on the final lap. He also taunts you. The taunts are in `src/sim/pete.js`.

## Tracks and modes

Eight tracks, three laps each, except the Gouda Eve Classic (five laps in the track table):

1. Brie Beach Run
2. Cheddar Canyon
3. Swiss Hole Tunnels
4. Fondue Falls
5. Blue Cheese Bog
6. Parmesan Peaks
7. Camembert Caverns
8. Gouda Eve Classic

The main menu offers races, Time Trial, Ghost mode (race your best recorded run on a track), and a Cheese Cup of normal races. Pete's duel is a main-menu item on the Gouda Eve course (the duel's lap count is not confirmed here; check the menu).

## Pod parts

Between races you can buy upgrades in five groups, each with five tiers:

- **Engine:** higher top speed.
- **Cooling:** heat drops faster, so you can boost longer.
- **Grip:** less slide through corners.
- **Armour:** less damage from hazards.
- **Thrusters:** faster acceleration.

## Tips

- Boost on straights, not on corners. Heat builds fast.
- Read the next hazard early. Cutters and cheese wheels follow a fixed timer, so you can time your run through them.
- Rolling through a hazard (X) can dodge damage for a moment.
- Use Time Trial to learn a track before you race Pete on it.

## Known gaps

- Ghibli style is in the code but has not been checked in real play. Photo style is not built and draws the toon style.
- Sound effects and music are generated from code and have not been listened to in a full play session. The volume and balance are unverified.
