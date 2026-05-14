// data.jsx — course & round state (metric)

// Skjoldnæs Links — a fictional Nordic links course.
// Each hole has par, meters (from 3 tees), and abstract map geometry in a 100×140 box.
const COURSE = {
  name: 'Skjoldnæs Links',
  region: 'Ærø, Denmark',
  par: 71,
  rating: 70.4,
  slope: 124,
  tees: [
    { id: 'white',  label: 'White',  color: '#F2EFE8', total: 5655 },
    { id: 'yellow', label: 'Yellow', color: '#C8B86A', total: 5251 },
    { id: 'red',    label: 'Red',    color: '#A8584B', total: 4671 },
  ],
  holes: [
    { n: 1,  par: 4, m: { white: 340, yellow: 318, red: 285 },
      tee: [50, 130], green: [50, 18, 7],
      fairway: [[50,128],[48,110],[52,90],[50,70],[52,50],[50,30]],
      bunkers: [[34,28,4,3],[66,30,3,3]] },
    { n: 2,  par: 5, m: { white: 468, yellow: 446, red: 404 },
      tee: [22, 130], green: [80, 18, 8],
      fairway: [[22,128],[28,108],[40,90],[55,70],[70,50],[78,30]],
      bunkers: [[36,72,3,4],[72,38,4,3]], water:[[50,98,16,8]] },
    { n: 3,  par: 3, m: { white: 154, yellow: 139, red: 121 },
      tee: [50, 128], green: [50, 38, 9],
      fairway: [[50,124],[50,90],[50,60]],
      bunkers: [[36,46,4,3],[64,46,4,3]] },
    { n: 4,  par: 4, m: { white: 364, yellow: 344, red: 311 },
      tee: [78, 130], green: [22, 18, 7],
      fairway: [[78,128],[68,108],[55,88],[42,68],[30,46],[24,28]],
      bunkers: [[34,22,3,3]], water:[[55,86,12,10]] },
    { n: 5,  par: 4, m: { white: 377, yellow: 357, red: 322 },
      tee: [50, 130], green: [50, 18, 7],
      fairway: [[50,128],[50,100],[50,72],[50,44],[50,28]],
      bunkers: [[28,80,3,5],[72,80,3,5]] },
    { n: 6,  par: 5, m: { white: 496, yellow: 470, red: 430 },
      tee: [20, 132], green: [80, 18, 8],
      fairway: [[20,130],[32,108],[48,86],[64,66],[76,44],[80,28]],
      bunkers: [[58,72,3,3],[74,32,3,3]] },
    { n: 7,  par: 4, m: { white: 354, yellow: 335, red: 300 },
      tee: [28, 132], green: [72, 18, 8],
      fairway: [[28,130],[36,108],[46,86],[58,66],[68,44],[72,28]],
      bunkers: [[44,82,4,3],[66,32,3,3]], water:[[52,60,12,8]] },
    { n: 8,  par: 3, m: { white: 168, yellow: 154, red: 130 },
      tee: [50, 128], green: [50, 32, 8],
      fairway: [[50,124],[50,80],[50,52]],
      bunkers: [[38,40,3,3],[62,40,3,3]] },
    { n: 9,  par: 4, m: { white: 386, yellow: 364, red: 327 },
      tee: [72, 130], green: [28, 18, 7],
      fairway: [[72,128],[60,108],[48,88],[36,68],[30,44],[28,28]],
      bunkers: [[44,72,3,3],[34,28,4,3]] },
    { n: 10, par: 4, m: { white: 333, yellow: 313, red: 282 },
      tee: [50, 130], green: [50, 18, 7],
      fairway: [[50,128],[52,110],[48,90],[52,68],[50,42],[50,28]],
      bunkers: [[36,38,3,3]] },
    { n: 11, par: 5, m: { white: 483, yellow: 459, red: 419 },
      tee: [78, 130], green: [22, 18, 8],
      fairway: [[78,128],[70,108],[58,88],[44,68],[32,46],[24,28]],
      bunkers: [[54,80,3,3],[34,42,3,3]], water:[[40,68,14,8]] },
    { n: 12, par: 3, m: { white: 148, yellow: 135, red: 117 },
      tee: [50, 128], green: [50, 40, 8],
      fairway: [[50,124],[50,90],[50,62]],
      bunkers: [[36,48,4,3]] },
    { n: 13, par: 4, m: { white: 358, yellow: 338, red: 304 },
      tee: [28, 130], green: [72, 18, 7],
      fairway: [[28,128],[38,108],[50,86],[62,66],[70,44],[72,28]],
      bunkers: [[52,76,3,3],[68,32,3,3]] },
    { n: 14, par: 4, m: { white: 373, yellow: 351, red: 318 },
      tee: [50, 130], green: [50, 18, 7],
      fairway: [[50,128],[50,100],[50,72],[50,44],[50,28]],
      bunkers: [[68,82,3,5],[32,46,3,4]] },
    { n: 15, par: 5, m: { white: 461, yellow: 437, red: 399 },
      tee: [22, 132], green: [80, 18, 8],
      fairway: [[22,130],[34,108],[48,86],[62,66],[74,44],[80,28]],
      bunkers: [[44,74,3,3],[74,34,3,3]] },
    { n: 16, par: 3, m: { white: 176, yellow: 159, red: 135 },
      tee: [50, 128], green: [50, 30, 9],
      fairway: [[50,124],[50,80],[50,50]],
      bunkers: [[36,40,3,3],[64,40,3,3]], water:[[42,70,16,8]] },
    { n: 17, par: 4, m: { white: 346, yellow: 324, red: 291 },
      tee: [72, 130], green: [28, 18, 7],
      fairway: [[72,128],[62,108],[50,88],[38,68],[30,44],[28,28]],
      bunkers: [[48,80,3,3]] },
    { n: 18, par: 4, m: { white: 373, yellow: 353, red: 318 },
      tee: [50, 130], green: [50, 20, 8],
      fairway: [[50,128],[50,108],[52,88],[50,68],[52,46],[50,30]],
      bunkers: [[36,38,3,3],[64,38,3,3]] },
  ],
};

// Clubs — carry distances in meters
const CLUBS = [
  { id: 'dr',  label: 'Driver',    short: 'Dr',  carry: 224 },
  { id: '3w',  label: '3-wood',    short: '3W',  carry: 206 },
  { id: '5w',  label: '5-wood',    short: '5W',  carry: 192 },
  { id: '4h',  label: '4-hybrid',  short: '4H',  carry: 178 },
  { id: '5i',  label: '5-iron',    short: '5i',  carry: 165 },
  { id: '6i',  label: '6-iron',    short: '6i',  carry: 154 },
  { id: '7i',  label: '7-iron',    short: '7i',  carry: 142 },
  { id: '8i',  label: '8-iron',    short: '8i',  carry: 130 },
  { id: '9i',  label: '9-iron',    short: '9i',  carry: 117 },
  { id: 'pw',  label: 'Pitching',  short: 'PW',  carry: 105 },
  { id: 'gw',  label: 'Gap',       short: 'GW',  carry: 91  },
  { id: 'sw',  label: 'Sand',      short: 'SW',  carry: 80  },
  { id: 'lw',  label: 'Lob',       short: 'LW',  carry: 64  },
  { id: 'pt',  label: 'Putter',    short: 'Pt',  carry: 0   },
];

const BALLS = [
  { id: 'prov1',  label: 'Pro V1' },
  { id: 'prov1x', label: 'Pro V1x' },
  { id: 'chrome', label: 'Chrome Soft' },
  { id: 'tp5',    label: 'TP5' },
];

// In-progress round.
// Each currentShots entry is a logged shot.
//   status: 'done' = ended, distance auto-calculated; 'in_flight' = next shoot will end it
//   result: 'in_play' | 'holed' | 'out' | 'hazard' | 'lost' (only on done shots)
//   dist:   meters carried (null while in_flight)
const ROUND = {
  courseId: 'skjoldnaes',
  teeId: 'white',
  startedAt: '2026-05-11T08:14',
  ball: 'prov1',
  currentHole: 7,
  scores: [4, 5, 3, 4, 5, 6, undefined, undefined, undefined,
           undefined, undefined, undefined, undefined, undefined,
           undefined, undefined, undefined, undefined],
  putts:  [2, 2, 1, 2, 2, 3, undefined, undefined, undefined,
           undefined, undefined, undefined, undefined, undefined,
           undefined, undefined, undefined, undefined],
  fairways: [true, false, null, true, true, false, null, null, null,
             null, null, null, null, null, null, null, null, null],
  gir:      [true, false, true, true, false, false, null, null, null,
             null, null, null, null, null, null, null, null, null],
  // Hole 7: 2 shots done, 3rd in flight
  currentShots: [
    { n: 1, club: 'dr', ball: 'prov1', startLie: 'tee',     status: 'done',      result: 'in_play', dist: 227 },
    { n: 2, club: '7i', ball: 'prov1', startLie: 'fairway', status: 'done',      result: 'in_play', dist: 124 },
    { n: 3, club: 'pt', ball: 'prov1', startLie: 'green',   status: 'in_flight', result: null,      dist: null },
  ],
};

const HISTORY = [
  { date: 'May 4',  course: 'Skjoldnæs Links',   tee: 'White',  score: 79, toPar: '+8',  fwy: '8/14', gir: '7/18', putts: 32 },
  { date: 'Apr 27', course: 'Furesø Golf Klub',  tee: 'Yellow', score: 84, toPar: '+13', fwy: '6/14', gir: '5/18', putts: 34 },
  { date: 'Apr 20', course: 'Skjoldnæs Links',   tee: 'White',  score: 82, toPar: '+11', fwy: '7/14', gir: '6/18', putts: 33 },
  { date: 'Apr 12', course: 'Mølleåen GK',       tee: 'White',  score: 77, toPar: '+6',  fwy: '9/14', gir: '9/18', putts: 30 },
  { date: 'Apr 5',  course: 'Skjoldnæs Links',   tee: 'White',  score: 81, toPar: '+10', fwy: '7/14', gir: '6/18', putts: 32 },
];

const COURSES = [
  { id: 'skjoldnaes', name: 'Skjoldnæs Links',  region: 'Ærø',         distance: '3.2 km',  par: 71, holes: 18 },
  { id: 'furesoe',    name: 'Furesø Golf Klub', region: 'Værløse',     distance: '12 km',   par: 72, holes: 18 },
  { id: 'molle',      name: 'Mølleåen GK',      region: 'Lyngby',      distance: '18 km',   par: 70, holes: 18 },
  { id: 'rungsted',   name: 'Rungsted Golf',    region: 'Hørsholm',    distance: '24 km',   par: 71, holes: 18 },
  { id: 'kbh',        name: 'Københavns GK',    region: 'Dyrehaven',   distance: '8 km',    par: 71, holes: 18 },
  { id: 'helsingor',  name: 'Helsingør Golf',   region: 'Helsingør',   distance: '42 km',   par: 70, holes: 18 },
];

Object.assign(window, { COURSE, COURSES, CLUBS, BALLS, ROUND, HISTORY });
