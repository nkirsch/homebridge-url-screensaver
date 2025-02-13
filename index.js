const package = require('./package.json');
const exec = require('child_process').exec;
const http = require('http'); // or 'https' for HTTPS requests
let Service, Characteristic;

// Set up homebridge
module.exports = function(homebridge) {
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-url-screensaver", "ScreenSwitch", urlScreenSwitch); // register
};

function urlScreenSwitch(log, config) {
  this.log = log;
  this.config = config;

  this.log('config is ? ' + this.config);
}

urlScreenSwitch.prototype.getServices = function() {
  let informationService = new Service.AccessoryInformation();
  informationService
    .setCharacteristic(Characteristic.Manufacturer, "Kirsch")
    .setCharacteristic(Characteristic.Model, "ScreenSwitch")
    .setCharacteristic(Characteristic.SerialNumber, package.version);

  let switchService = new Service.Switch("ScreenSwitch");
  switchService
    .getCharacteristic(Characteristic.On)
    .on('set', this.setSwitchOnCharacteristic.bind(this))
    .on('get', this.getSwitchOnCharacteristic.bind(this));

  this.informationService = informationService;
  this.switchService = switchService;
  return [informationService, switchService];
}

urlScreenSwitch.prototype.isRunning = function () {
  return new Promise(function (resolve, reject) {
    // Define the HTTP options based on the platform
    const options = {
      hostname: 'nick.home.kirsch.org',
      port: 19820,
      path: '/',
      method: 'GET'
    };

    // Make an HTTP GET request
    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
          const parsedData = JSON.parse(responseData);

          // Check if the screensaver is running based on the parsed data
          const isRunning = parsedData.hasOwnProperty('isRunning') ? parsedData.isRunning : false;

          resolve(isRunning);
      });
    });

    // Handle potential errors
    req.on('error', (error) => {
      // Handle the error here
      console.error('HTTP GET request error:', error);
      resolve(false); // Return false in case of an error
    });

    // Send the HTTP GET request
    req.end();
  });
};


// Returns proper state of display
urlScreenSwitch.prototype.getSwitchOnCharacteristic = function(next) {
  this.isRunning().then((v) =>  
	{  
	this.log('screen saver running? ' + v);
	next(null, v)
	}
  );
  //next(null, false);
}


// Sets the display on or off
urlScreenSwitch.prototype.setSwitchOnCharacteristic = function (on, next) {
  this.log('Setting url screensaver: ' + (on ? 'on' : 'off'));

  if (on) {
    // Define the JSON data to send in the POST request
    const jsonData = {
      password: 'nightnight',
      display: true,
      on: true,
    };

    // Convert the JSON data to a string
    const jsonPayload = JSON.stringify(jsonData);

    // Set the options for the POST request
    const options = {
      hostname: 'nick.home.kirsch.org',
      port: '19820', // Replace with your target port (e.g., 443 for HTTPS)
      path: '/', // Replace with your API endpoint path
      method: 'POST', // Change to 'POST' for a POST request
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': jsonPayload.length,
      },
    };

    // Create the HTTP request
    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        // Send the JSON payload in the POST request
	req.write(jsonPayload);
	req.end();
        next();
      });
    });

    // Handle potential errors
    req.on('error', (error) => {
      this.log('HTTP request error:', error);
      next();
    });
  } else {
    // Define the JSON data to send in the POST request
    const jsonData = {
      password: 'nightnight',
      display: false,
      on: false,
    };

    // Convert the JSON data to a string
    const jsonPayload = JSON.stringify(jsonData);

    // Set the options for the POST request
    const options = {
      hostname: 'nick.home.kirsch.org',
      port: 19820, // Replace with your target port (e.g., 443 for HTTPS)
      path: '/', // Replace with your API endpoint path
      method: 'POST', // Change to 'POST' for a POST request
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': jsonPayload.length,
      },
    };

    // Create the HTTP request
    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
	// Send the JSON payload in the POST request
	req.write(jsonPayload);
	req.end();

        next();
      });
    });

    // Handle potential errors
    req.on('error', (error) => {
      this.log('HTTP request error:', error);
      next();
    });

  }
};

