var path = require('path');
const DeltaService = require('../../lib/src');

exports.config = {
  specs: [
    './test/wdio/DeltaReporterClient.test.ts'
  ],
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
  reporters: ['dot', 'spec'],
  services: [
    'selenium-standalone',
    [new DeltaService({
      host: 'http://localhost:5001',
      project: 'Delta Reporter Demo',
      testType: 'End to End',
      job: {
        "jenkinsHost": process.env.HOST,
        "jobURL": process.env.BUILD_URL,
        "name": process.env.JOB_NAME,
      },
      run: {
        buildNumber: process.env.BUILD_NUMBER,
        startedBy: process.env.BUILD_CAUSE_MANUALTRIGGER ? 'HUMAN' : 'SCHEDULER' // Actually could be "SCHEDULER", "UPSTREAM_JOB", "HUMAN"
      }
    })]
  ],
  // Options for selenium-standalone
  // Path where all logs from the Selenium server should be stored.
  seleniumLogs: './logs/',
}
