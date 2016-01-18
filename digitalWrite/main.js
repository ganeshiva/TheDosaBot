var mraa = require('mraa'); //require mraa
console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the console
console.log("App deployed.. DosaBot");

//GROVE Kit A0 Connector --> Aio(0)
var myAnalogPin = new mraa.Aio(0);
var sleepInterval = 5000; // 5 seconds

var LOAD_ROTATION_INTERVAL = 1000; //ms
var UNLOAD_ROTATION_INTERVAL = 1200; //ms
var OIL_PUMP_TIME = 5*1000;
var FLOUR_PUMP_TIME = 6*1000;
var FLOUR_MOTOR_TIME = 10*1000;
var PULLER_MOTOR_TIME = 2*1000;

var digitalPins = [];
var INCREASE_TEMP_BUTTON = 1;

var POWER_BUTTON = 0;
var TEMP_INC = 2;
var TEMP_DEC = 3;
var FLOUR_MOTOR = 3;
var PULLER_MOTOR = 4;
var FLOUR_MOTOR_DIR = 5;
var PULLER_MOTOR_DIR = 6;
var OIL_PUMP = 7;
var FLOUR_PUMP = 8;


for(var i = 0; i <= 13 ; i++) {
    digitalPins[i] = new mraa.Gpio(i);
    digitalPins[i].dir(mraa.DIR_OUT); //set the gpio direction to output
}

//TODO Thermal sensor and LCD

function prepareFood() {
    resetAllPins();
    toggleInductionPower();sleep(20*1000); // wait for some time to heat the induction
    oilPump();
    flourPump();
    flourMotor();
    sleep(30*1000); // food gets prepared here
    toggleInductionPower();
    pullerMotorForward();
    pullerMotorBackward();
}

function toggleInductionPower() {
    switchONPin(POWER_BUTTON);
    /*setTimeout(function() {
	   switchOFFPin(POWER_BUTTON);
    } , 200);*/
    sleep(200);
    switchOFFPin(POWER_BUTTON);
}

function oilPump() {
    switchONPin(OIL_PUMP);
    sleep(OIL_PUMP_TIME);
    switchOFFPin(OIL_PUMP);
}

function flourPump() {
    switchONPin(FLOUR_PUMP);
    sleep(FLOUR_PUMP_TIME);
    switchOFFPin(FLOUR_PUMP);
}

function flourMotor() {
    switchONPin(FLOUR_MOTOR_DIR);
    switchONPin(FLOUR_MOTOR);
    sleep(FLOUR_MOTOR_TIME);
    switchOFFPin(FLOUR_MOTOR);
}

function pullerMotorForward() {
    switchONPin(PULLER_MOTOR_DIR);
    switchONPin(PULLER_MOTOR);
    sleep(PULLER_MOTOR_TIME);
    switchOFFPin(PULLER_MOTOR);
}

function pullerMotorBackward() {
    switchOFFPin(PULLER_MOTOR_DIR);
    switchONPin(PULLER_MOTOR);
    sleep(PULLER_MOTOR_TIME);
    switchOFFPin(PULLER_MOTOR);
}

//Create Socket.io server
var http = require('http');
var app = http.createServer(function (req, res) {
    'use strict';
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.end('<h1>Hello world from Intel IoT platform!</h1>');
}).listen(1337);
var io = require('socket.io')(app);

//Attach a 'connection' event handler to the server
io.on('connection', function (socket) {
    'use strict';
    console.log('a user connected');
    //Emits an event along with a message
    socket.emit('connected', 'Welcome');

    prepareFood();
    
    socket.emit("message", 200);
    //Attach a 'disconnect' event handler to the socket
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});

function increaseTemp() {
	for(var i = 0 ; i < 4 ; i++)
		switchONPin(INCREASE_TEMP_BUTTON);
		sleep(200);
		switchOFFPin(INCREASE_TEMP_BUTTON);
		sleep(500);
	}
}

function switchONPin(pinId) {
    digitalPins[pinId].write(1);
}

function switchOFFPin(pinId) {
    digitalPins[pinId].write(0);
}

function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
}

function resetAllPins() {
    setDigitalPins([0,1,2,3,4,5,6,7,8,9,10,11,12,13], 0);
}