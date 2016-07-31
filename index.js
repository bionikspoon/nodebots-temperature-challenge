const five = require('johnny-five');
const Particle = require('particle-io');
const Shield = require("j5-sparkfun-weather-shield")(five);
const _ = require('lodash');

// CONFIG
///////////
const HIGH = 91;
const LOW = 83;

const MOCK_METER = true; // print to console or light up a board
const MOCK_DATA = false; // dance through lights

const COORDS = [ // used to create a list of Led objects
  { board: 'METER_0', pin: 'D0' },
  { board: 'METER_0', pin: 'D1' },
  { board: 'METER_0', pin: 'D2' },
  { board: 'METER_0', pin: 'D3' },
  { board: 'METER_0', pin: 'D4' },
  { board: 'METER_0', pin: 'D5' },
  { board: 'METER_1', pin: 'D0' },
  { board: 'METER_1', pin: 'D1' },
  { board: 'METER_1', pin: 'D2' },
  { board: 'METER_1', pin: 'D3' },
  { board: 'METER_1', pin: 'D4' },
  { board: 'METER_1', pin: 'D5' },
];

const config = [ // used to create board objects keyed by id
  {
    id: 'SENSOR',
    token: 'ffffffffffffffffffffffffffffffffffffffff',
    deviceId: '999999999999999999999999',
  },
  {
    id: 'METER_0',
    token: 'ffffffffffffffffffffffffffffffffffffffff',
    deviceId: '999999999999999999999999',
  },
  {
    id: 'METER_1',
    token: 'ffffffffffffffffffffffffffffffffffffffff',
    deviceId: '999999999999999999999999',
  },
];
const SENSOR = 'SENSOR';

// BIND
/////////
const handle = new five.Boards(createPorts(MOCK_METER ? [config[0]] : config));
handle.on('ready', handleReady);

// MAIN
/////////
function handleReady(boards) {
  console.log('Device Ready...');

  const leds = createLEDs((MOCK_METER ? [] : COORDS), boards);
  const meter = createMeter(leds);

  // either stream weather data or stream test data
  MOCK_DATA ? streamTestData(meter) : streamWeatherData(boards[SENSOR], meter);
}

// UTILS
//////////

/** watch weather data*/
function streamWeatherData(board, callback) {
  const weather = new Shield({
    variant: "PHOTON",
    freq: 500,
    elevation: 500,
    board: board,
  });

  weather.on("data", data => {
    const percent = scale(data.fahrenheit);
    console.log("event fahrenheit=%s percent=%s", _.round(data.fahrenheit, 2), _.round(percent * 100, 2));
    callback(percent);
  });
}

/** cycle fake data */
function streamTestData(callback) {
  const testData = [1, .9, .8, .7, .6, .5, .4, .3, .2, .1, 0];

  const index = { value: 0 };

  setInterval(() => {
    const percent = testData[index.value];
    index.value++;

    if (index.value >= testData.length) index.value = 0;
    console.log("event percent=%s%", _.round(percent * 100, 2));
    callback(percent);
  }, 500);
}

/** create Particle objects */
function createPorts(configList) {
  return _.map(
    configList, config => ({
      id: config.id,
      io: new Particle({ token: config.token, deviceId: config.deviceId })
    })
  );
}

/** create five.Led objects */
function createLEDs(coords, boards) {
  return _.map(coords, coord => {
    const board = boards[coord.board];
    return new five.Led({ pin: coord.pin, board: board })
  })
}

/** scale raw value to percentage */
function scale(temperature) {
  return (temperature - LOW) / (HIGH - LOW);
}

/** use leds to create a meter function */
function createMeter(leds) {
  /** light up meter boards */
  return function (percent) {
    // number of lights to represent percentage
    const numberOfLEDsOn = Math.floor(leds.length * percent);

    // for each led with index ...
    _.forEach(leds, (led, i) => {
      if (i < numberOfLEDsOn) {
        led.on(); // light up first partition
      }
      else {
        led.off(); // shutdown second partition
      }
    });
  }
}
