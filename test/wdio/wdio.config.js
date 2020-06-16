var path = require('path');
const fs = require('fs');
const video = require('wdio-video-reporter');
const DeltaService = require('../../lib/src');

function getLatestFile({ directory, extension }, callback) {
  console.log(directory);
  console.log(extension);
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

exports.config = {
  specs: ['./test/wdio/DeltaReporterClient.test.ts'],
  capabilities: [
    {
      browserName: 'chrome'
    }
  ],
  sync: true,
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
    [
      video,
      {
        saveAllVideos: false, // If true, also saves videos for successful test cases
        videoSlowdownMultiplier: 3 // Higher to get slower videos, lower for faster videos [Value 1-100]
      }
    ]
  ],
  services: [
    'docker',
    [
      new DeltaService({
        host: 'http://localhost:5000',
        project: 'Delta Reporter',
        testType: 'End to End',
        job: {
          jenkinsHost: process.env.HOST,
          jobURL: process.env.BUILD_URL,
          name: process.env.JOB_NAME
        },
        run: {
          buildNumber: process.env.BUILD_NUMBER,
          startedBy: process.env.BUILD_CAUSE_MANUALTRIGGER ? 'HUMAN' : 'SCHEDULER' // Actually could be "SCHEDULER", "UPSTREAM_JOB", "HUMAN"
        }
      })
    ]
  ],
  dockerOptions: {
    image: 'selenium/standalone-chrome',
    healthCheck: 'http://localhost:4444',
    options: {
      p: ['4444:4444'],
      shmSize: '2g'
    }
  },
  // Options for selenium-standalone
  // Path where all logs from the Selenium server should be stored.
  seleniumLogs: './logs/',
  afterTest(test) {
    if (test.passed === false) {
      const file_name = 'screenshot.png';
      const outputFile = path.join(__dirname, file_name);
      console.log(__dirname);
      browser.saveScreenshot(outputFile);
      browser.sendFileToTest(fs.createReadStream(outputFile));
      getLatestFile({ directory: browser.options.outputDir + '/_results_', extension: 'mp4' }, (filename = null) => {
        console.log(filename);
        browser.sendFileToTest(fs.createReadStream(filename));
      });
    }
  }
};
