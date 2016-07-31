const five = require('johnny-five');
const Particle = require('particle-io');
const Shield = require("j5-sparkfun-weather-shield")(five);
const _ = require('lodash');

const HIGH = 91;
const LOW = 83;

const COORDS = [
  { board: '1', pin: 'D0' },
  { board: '1', pin: 'D1' },
  { board: '1', pin: 'D2' },
  { board: '1', pin: 'D3' },
  { board: '1', pin: 'D4' },
  { board: '1', pin: 'D5' },
  { board: '2', pin: 'D0' },
  { board: '2', pin: 'D1' },
  { board: '2', pin: 'D2' },
  { board: '2', pin: 'D3' },
  { board: '2', pin: 'D4' },
  { board: '2', pin: 'D5' },
];

const SENSOR = '0';

const ports = [
  {
    id: 'A',
    io: new Particle({
      token: "ffffffffffffffffffffffffffffffffffffffff",
      deviceId: "999999999999999999999999"
    })
  },

  {
    id: 'B',
    io: new Particle({
      token: "ffffffffffffffffffffffffffffffffffffffff",
      deviceId: "999999999999999999999999"
    })
  },

  {
    id: 'C',
    io: new Particle({
      token: "ffffffffffffffffffffffffffffffffffffffff",
      deviceId: "999999999999999999999999"
    })
  },

];
const boards = new five.Boards(ports);

boards.on('ready', function () {
  const leds = createLED(COORDS, this);

  const meter = createMeter(leds);


  const sensor = this[SENSOR];

  const weather = new Shield({
    variant: "PHOTON",
    freq: 1000,
    elevation: 500,
    board: sensor,
  });

  weather.on("data", function () {
    const percent = scale(this.fahrenheit);
    console.log("percent", percent);
    meter(percent);
  });
});

function createLED(coords, boards) {
  return _.map(coords, coord => {
    const board = boards[coord.board];
    return new five.Led({ pin: coord.pin, board: board })
  })
}

function scale(temperature) {
  return (temperature - LOW) / (HIGH - LOW);
}

function createMeter(leds) {
  return function (percent) {
    const numberOfLEDsOn = Math.floor(leds.length * percent);
    _.forEach(leds, (led, i) => {
      if (i < numberOfLEDsOn) {
        led.on();
      }
      else {
        led.off();
      }
    });
  }
}
