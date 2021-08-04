var path = require('path');
const fs = require('fs');
// const video = require('wdio-video-reporter');
const video = require('test-video-recorder');
const DeltaReporter = require('../../lib/src/reporter');
const DeltaService = require('../../lib/src/service');

// const path = require("path");
video.setPath(path.join(__dirname, "/videos"));

function fileName(name) {
  return encodeURIComponent(name.trim().replace(/\s+/g, "-"));
}

function getLatestFile({ directory, extension }, callback) {
  fs.readdir(directory, (_, dirlist) => {
    const latest = dirlist
      .map(_path => ({ stat: fs.lstatSync(path.join(directory, _path)), dir: _path }))
      .filter(_path => _path.stat.isFile())
      .filter(_path => (extension ? _path.dir.endsWith(`.${extension}`) : 1))
      .sort((a, b) => b.stat.mtime - a.stat.mtime)
      .map(_path => _path.dir);
    callback(directory + '/' + latest[0]);
  });
}

let delta_config = {
  enabled: true,
  host: 'http://localhost:5000',
  project: 'Delta Reporter',
  testType: 'End to End'
};

exports.config = {
  specs: [
    './test/wdio/DeltaReporterClient.test.ts',
    // './test/wdio/DeltaReporterClient2.test2.ts',
    // './test/wdio/DeltaReporterClient3.test3.ts'
  ],
  capabilities: [
    {
      browserName: 'chrome',
      'goog:chromeOptions': {
        args: [
          '--no-sandbox',
          '--disable-gpu',
          '--incognito',
          // '--remote-debugging-address=0.0.0.0', // expose to calls from the host machine!
          // '--remote-debugging-port=9222',
          // '--headless', // must be headless to use the the docker service with devtools support!
          // '--window-size=1366,768'
        ]
      }
    }
  ],
  runner: 'local',
  sync: true,
  port: 4444,
  protocol: 'http',
  path: '/wd/hub',
  logLevel: 'debug',
  coloredLogs: true,

  baseUrl: 'http://webdriver.io',

  waitforTimeout: 10000,
  connectionRetryTimeout: 90000,
  connectionRetryCount: 3,

  framework: 'mocha',
  mochaOpts: {
    ui: 'bdd',
    require: ['tsconfig-paths/register', 'ts-node/register'],
    timeout: 60000
  },
  reporters: [
    'dot',
    'spec',
    // [
    //   video,
    //   {
    //     saveAllVideos: false, // If true, also saves videos for successful test cases
    //     videoSlowdownMultiplier: 3 // Higher to get slower videos, lower for faster videos [Value 1-100]
    //   }
    // ],
    [DeltaReporter, delta_config]
  ],
  services: [
    // 'docker', 
    [new DeltaService(delta_config)]],
  // dockerLogs: './',
  // dockerOptions: {
  //   image: 'selenium/standalone-chrome-debug', // contains Chrome 85.0.4183.83
  //   healthCheck: {
  //     url: 'http://localhost:4444',
  //     maxRetries: 3,
  //     inspectInterval: 1000,
  //     startDelay: 2000
  //   },
  //   options: {
  //     // VNC and Selenium hub are already exposed in docker image, so we only need to add the
  //     // port for devtools
  //     expose: [ 9222 ],
  //     p: [
  //       '4444:4444',
  //       '5900:5900',
  //       '0.0.0.0:9222:9222' // 0.0.0.0 to expose devtools debugger from any location
  //     ],
  //     shmSize: '2g'
  //   }
  // },
  // onDockerReady: () => {
  //   console.log('Ready to connect VNC client on localhost:5900');
  // },
  // Options for selenium-standalone
  // Path where all logs from the Selenium server should be stored.
  seleniumLogs: './logs/',
  	// Start video before each test
	beforeTest: function ( test ) {
		video.start(test, 'wdio');
	},
  afterTest(test) {
    if (test.passed === false) {
      const file_name = 'screenshot.png';
      const outputFile = path.join(__dirname, file_name);
      browser.saveScreenshot(outputFile);
      browser.sendFileToTest('img', outputFile);
      video.stop();
      let video_file = `videos/${fileName(test.parent)}-${fileName(test.title)}.mp4`
      browser.sendFileToTest('video', video_file, 'Video captured during test execution');
      // getLatestFile({ directory: browser.options.outputDir + '/_results_', extension: 'mp4' }, (filename = null) => {
      //   browser.sendFileToTest('video', filename, 'Video captured during test execution');
      // });
    }
  },
  beforeSuite() {
    try {
      let spectreTestRunURL = fs.readFileSync('./.spectre_test_run_url.json');
      let test_run_payload = {
        spectre_test_run_url: spectreTestRunURL.toString()
      };
      browser.sendDataToTestRun(test_run_payload);
    } catch {
      log.info('No Spectre URL found');
    }
  }
};
