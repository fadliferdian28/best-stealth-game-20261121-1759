// The three heists on Lantern Rock. Each level is one island zone: walls and crates
// that block sight, scrub bushes to hide in, lamps that light you up, lampwarden
// patrols, cameras, tripwire lasers, loot, one prize to steal and the boat home.
// Coordinates are canvas pixels inside the play field (x 10..970, y 56..710).
// The lighthouse tower stands at the same spot on every level: (455, 315, 70, 70).
export const LEVELS = [
  {
    name: 'The Shoreline',
    subtitle: 'Learn the island. Two wardens, open ground, plenty of scrub.',
    objectiveName: 'Brass Compass',
    objectiveBlurb: 'Steal the Brass Compass, then reach the boat unseen.',
    playerStart: { x: 60, y: 650 },
    objective: { x: 700, y: 130 },
    exit: { x: 930, y: 685 },
    walls: [
      { x: 455, y: 315, w: 70, h: 70, kind: 'tower' },
      { x: 60, y: 90, w: 150, h: 100, kind: 'cottage' },
      { x: 740, y: 90, w: 140, h: 90, kind: 'shed' },
      { x: 760, y: 560, w: 160, h: 110, kind: 'boathouse' },
      { x: 300, y: 420, w: 90, h: 60, kind: 'rock' },
      { x: 600, y: 500, w: 80, h: 50, kind: 'rock' },
      { x: 250, y: 250, w: 180, h: 10, kind: 'fence', tall: false },
      { x: 540, y: 250, w: 180, h: 10, kind: 'fence', tall: false },
    ],
    crates: [
      { x: 350, y: 150, w: 44, h: 44 }, { x: 395, y: 150, w: 44, h: 44 },
      { x: 200, y: 500, w: 44, h: 44 }, { x: 650, y: 300, w: 44, h: 44 },
      { x: 820, y: 350, w: 44, h: 44 },
    ],
    bushes: [
      { x: 150, y: 300, r: 34 }, { x: 320, y: 620, r: 38 }, { x: 520, y: 180, r: 36 },
      { x: 700, y: 450, r: 36 }, { x: 880, y: 200, r: 34 }, { x: 120, y: 620, r: 30 },
    ],
    lamps: [
      { x: 490, y: 250, r: 72 }, { x: 850, y: 480, r: 60 }, { x: 180, y: 420, r: 60 },
    ],
    hideSpots: [{ x: 250, y: 350, r: 26 }, { x: 750, y: 600, r: 26 }],
    loot: [
      { x: 200, y: 230 }, { x: 620, y: 130 }, { x: 880, y: 420 },
      { x: 420, y: 600 }, { x: 300, y: 300 },
    ],
    guards: [
      { waypoints: [[150, 210], [400, 210], [485, 210], [485, 300], [560, 300], [560, 495], [260, 495], [260, 560], [150, 560]] },
      { waypoints: [[720, 540], [800, 540], [800, 280], [720, 280]] },
    ],
    cameras: [],
    lasers: [],
  },
  {
    name: "The Keeper's Yard",
    subtitle: 'Four wardens, sweeping cameras and tripwire lasers. Mind the light.',
    objectiveName: "Keeper's Log",
    objectiveBlurb: "Steal the Keeper's Log from the cottage, then reach the boat.",
    playerStart: { x: 60, y: 650 },
    objective: { x: 175, y: 235 },
    exit: { x: 930, y: 685 },
    walls: [
      { x: 455, y: 315, w: 70, h: 70, kind: 'tower' },
      { x: 80, y: 80, w: 190, h: 120, kind: 'cottage' },
      { x: 700, y: 80, w: 180, h: 100, kind: 'shed' },
      { x: 300, y: 200, w: 10, h: 200, kind: 'wall' },
      { x: 660, y: 250, w: 10, h: 220, kind: 'wall' },
      { x: 350, y: 430, w: 260, h: 10, kind: 'wall' },
      { x: 740, y: 560, w: 180, h: 110, kind: 'boathouse' },
      { x: 450, y: 560, w: 100, h: 60, kind: 'rock' },
    ],
    crates: [
      { x: 320, y: 320, w: 44, h: 44 }, { x: 590, y: 180, w: 44, h: 44 },
      { x: 520, y: 480, w: 44, h: 44 }, { x: 180, y: 480, w: 44, h: 44 },
      { x: 830, y: 300, w: 44, h: 44 },
    ],
    bushes: [
      { x: 140, y: 300, r: 34 }, { x: 380, y: 120, r: 32 }, { x: 560, y: 300, r: 36 },
      { x: 760, y: 420, r: 34 }, { x: 300, y: 620, r: 36 }, { x: 900, y: 150, r: 30 },
    ],
    lamps: [
      { x: 490, y: 250, r: 72 }, { x: 200, y: 380, r: 60 },
      { x: 800, y: 480, r: 60 }, { x: 600, y: 620, r: 60 },
    ],
    hideSpots: [{ x: 250, y: 550, r: 26 }, { x: 700, y: 250, r: 26 }],
    loot: [
      { x: 150, y: 240 }, { x: 420, y: 90 }, { x: 850, y: 210 },
      { x: 350, y: 380 }, { x: 650, y: 620 }, { x: 920, y: 480 },
    ],
    guards: [
      { waypoints: [[140, 260], [260, 260], [260, 520], [140, 520]] },
      { waypoints: [[700, 210], [800, 210], [800, 380], [700, 380]] },
      { waypoints: [[480, 540], [700, 540], [700, 650], [480, 650]] },
      { waypoints: [[340, 120], [560, 120], [560, 220], [340, 220]] },
    ],
    cameras: [
      { x: 490, y: 90, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.5, fov: 0.7, range: 210 },
      { x: 880, y: 540, baseAngle: Math.PI, sweep: 0.8, speed: 0.65, fov: 0.7, range: 200 },
    ],
    lasers: [
      { x1: 610, y1: 430, x2: 610, y2: 560 },
      { x1: 250, y1: 620, x2: 450, y2: 620 },
    ],
  },
  {
    name: 'The Lantern Room',
    subtitle: 'Five wardens, cameras, a laser, and the beam at full speed. Ghost it.',
    objectiveName: 'Fresnel Lens',
    objectiveBlurb: 'Steal the Fresnel Lens from the tower door, then reach the boat.',
    playerStart: { x: 60, y: 650 },
    objective: { x: 490, y: 180 },
    exit: { x: 930, y: 685 },
    walls: [
      { x: 455, y: 315, w: 70, h: 70, kind: 'tower' },
      { x: 70, y: 80, w: 170, h: 110, kind: 'cottage' },
      { x: 720, y: 80, w: 180, h: 100, kind: 'shed' },
      { x: 280, y: 180, w: 10, h: 260, kind: 'wall' },
      { x: 680, y: 180, w: 10, h: 260, kind: 'wall' },
      { x: 330, y: 470, w: 300, h: 10, kind: 'wall' },
      { x: 740, y: 560, w: 180, h: 110, kind: 'boathouse' },
      { x: 430, y: 560, w: 90, h: 55, kind: 'rock' },
      { x: 200, y: 560, w: 70, h: 50, kind: 'rock' },
    ],
    crates: [
      { x: 330, y: 300, w: 44, h: 44 }, { x: 600, y: 300, w: 44, h: 44 },
      { x: 480, y: 200, w: 44, h: 44 }, { x: 160, y: 400, w: 44, h: 44 },
      { x: 840, y: 380, w: 44, h: 44 }, { x: 560, y: 600, w: 44, h: 44 },
    ],
    bushes: [
      { x: 120, y: 260, r: 32 }, { x: 360, y: 120, r: 32 }, { x: 620, y: 130, r: 32 },
      { x: 900, y: 250, r: 32 }, { x: 250, y: 640, r: 34 }, { x: 700, y: 520, r: 34 },
    ],
    lamps: [
      { x: 490, y: 250, r: 72 }, { x: 150, y: 480, r: 60 },
      { x: 830, y: 520, r: 60 }, { x: 490, y: 620, r: 60 },
    ],
    hideSpots: [{ x: 250, y: 350, r: 26 }, { x: 720, y: 300, r: 26 }, { x: 450, y: 640, r: 26 }],
    loot: [
      { x: 140, y: 220 }, { x: 420, y: 90 }, { x: 860, y: 210 },
      { x: 330, y: 380 }, { x: 640, y: 580 }, { x: 920, y: 420 },
    ],
    guards: [
      { waypoints: [[120, 240], [240, 240], [240, 420], [120, 420]] },
      { waypoints: [[580, 150], [705, 150], [705, 210], [800, 210], [800, 455], [580, 455]] },
      { waypoints: [[400, 500], [700, 500], [700, 660], [400, 660], [310, 660], [310, 500]] },
      { waypoints: [[320, 120], [560, 120], [560, 200], [320, 200]] },
      { waypoints: [[420, 300], [420, 420], [620, 420], [620, 300]] },
    ],
    cameras: [
      { x: 490, y: 90, baseAngle: Math.PI / 2, sweep: 0.9, speed: 0.6, fov: 0.7, range: 220 },
      { x: 880, y: 540, baseAngle: Math.PI, sweep: 0.8, speed: 0.7, fov: 0.7, range: 210 },
    ],
    lasers: [
      { x1: 630, y1: 470, x2: 630, y2: 600 },
    ],
  },
];

export function levelCount() { return LEVELS.length; }
