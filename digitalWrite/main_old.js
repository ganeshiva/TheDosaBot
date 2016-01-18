/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */
/*global */

/*
A simple node.js application intended to write data to Digital pins on the Intel based development boards such as the Intel(R) Galileo and Edison with Arduino breakout board.

MRAA - Low Level Skeleton Library for Communication on GNU/Linux platforms
Library in C/C++ to interface with Galileo & other Intel platforms, in a structured and sane API with port nanmes/numbering that match boards & with bindings to javascript & python.

Steps for installing MRAA & UPM Library on Intel IoT Platform with IoTDevKit Linux* image
Using a ssh client: 
1. echo "src maa-upm http://iotdk.intel.com/repos/1.1/intelgalactic" > /etc/opkg/intel-iotdk.conf
2. opkg update
3. opkg upgrade

Article: https://software.intel.com/en-us/html5/articles/intel-xdk-iot-edition-nodejs-templates
*/

var B = 3975;
var mraa = require('mraa'); //require mraa
console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the console

//GROVE Kit A0 Connector --> Aio(0)
var myAnalogPin = new mraa.Aio(0);
var sleepInterval = 5000; // 5 seconds

var LOAD_ROTATION_INTERVAL = 1000; //ms
var UNLOAD_ROTATION_INTERVAL = 1200; //ms

var digitalPins = [];
var SWITCH_ON_PIN = 1;

for(var i = 0; i <= 13 ; i++) {
    digitalPins[i] = new mraa.Gpio(i);
    digitalPins[i].dir(mraa.DIR_OUT); //set the gpio direction to output
}


function rotateMotor1Forward() {
    stopMotor1();
    setDigitalPins([6,2,3] , 1); 
    setDigitalPins([4,5] , 0); // TODO : Check wit srini 
}

function rotateMotor1Backward() {
    stopMotor1();
    setDigitalPins([6,2,3,4,5], 1);
}

function stopMotor1() {
    setDigitalPins([6,2,3,4,5], 0);
    sleep(2000);
}

function stopMotor2() {
    setDigitalPins([6,4,5] , 0);
    sleep(2000);
}

function  rotateMotor2Backward() {
    stopMotor2();
    setDigitalPins([6], 1);
    setDigitalPins([2,3,4,5] , 0);
}

function rotateMotor2Forward() {
    stopMotor2();
    setDigitalPins([6,4,5] , 1);
    setDigitalPins([2,3] , 0); // Check with Srini
}

function setDigitalPins(pinIds, value) {
    for(var i in pinIds) {
     digitalPins[pinIds[i]].write(value);
    }
}
    
function switchONPin(pinId) {
    digitalPins[pinId].write(1);
}


function switchOFFPin(pinId) {
    digitalPins[pinId].write(0);
}

function resetAllPins() {
    setDigitalPins([2,3,4,5,6,7,8,9,10,11,12,13], 0);
}
//sleep(sleepInterval);
   
//}

function prepareFood(cookTime, cookTemp) {
    loadRawMaterial(LOAD_ROTATION_INTERVAL);
    cook(cookTime, cookTemp);
    unloadCookedMaterial(UNLOAD_ROTATION_INTERVAL);
}

function cook(cookTime, cookTemp) {

	var currentTemp = getTemp();
	if(currentTemp < cookTemp) {
		increaseTemp(cookTemp);
	}
	else {
		decreaseTemp(cookTemp);
	}

	sleep(cookTime*60*1000);

}
function loadRawMaterial(rotationInterval) {
    rotateMotor1Forward();
    sleep(rotationInterval);
    rotateMotor1Backward();
    sleep(rotationInterval);

    stopMotor1();
    stopMotor2();
}

function unloadCookedMaterial(rotationInterval) {
    rotateMotor2Forward();
    sleep(rotationInterval);
    rotateMotor2Backward();
    sleep(rotationInterval);

    stopMotor1();
    stopMotor2();
}

function decreaseTemp(minTemp) {

	while(getTemp() > minTemp) {
		switchONPin(9);
		sleep(500);
		switchOFFPin(9);sleep(500);
		sleep(2000);
	}

}

function increaseTemp(maxTemp) {
	while(getTemp() < maxTemp) {
		switchONPin(8);
		sleep(500);
		switchOFFPin(8);
		sleep(500);
		sleep(2000);
	}
}



function sleep(milliseconds) {
    var start = new Date().getTime();
    for (var i = 0; i < 1e7; i++) {
        if ((new Date().getTime() - start) > milliseconds){
            break;
        }
    }
}

function getTemp() {
    
    var a = myAnalogPin.read();
    console.log("Analog Pin (A0) Output: " + a);
    //console.log("Checking....");
    var resistance = (1023 - a) * 10000 / a; //get the resistance of the sensor;
    //console.log("Resistance: "+resistance);
    var celsius_temperature = 1 / (Math.log(resistance / 10000) / B + 1 / 298.15) - 273.15;//convert to temperature via datasheet ;
    console.log("Celsius Temperature "+celsius_temperature); 
    return celsius_temperature;
}


function startSensorWatch(socket) {
    'use strict';
    setInterval(function () {
        var a = myAnalogPin.read();
        console.log("Analog Pin (A0) Output: " + a);
        //console.log("Checking....");
        
        var resistance = (1023 - a) * 10000 / a; //get the resistance of the sensor;
        //console.log("Resistance: "+resistance);
        var celsius_temperature = 1 / (Math.log(resistance / 10000) / B + 1 / 298.15) - 273.15;//convert to temperature via datasheet ;
        //console.log("Celsius Temperature "+celsius_temperature); 
        var fahrenheit_temperature = (celsius_temperature * (9 / 5)) + 32;
        console.log("Fahrenheit Temperature: " + fahrenheit_temperature);
        socket.emit("message", fahrenheit_temperature);
    }, 4000);
}





console.log("Sample Reading Grove Kit Temperature Sensor");
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

    //Start watching Sensors connected to Galileo board
    //startSensorWatch(socket);

    prepareFood(0.1, 26);
    switchOFFPin(7);
    resetAllPins();
    socket.emit("message", 200);
    //Attach a 'disconnect' event handler to the socket
    socket.on('disconnect', function () {
        console.log('user disconnected');
    });
});

