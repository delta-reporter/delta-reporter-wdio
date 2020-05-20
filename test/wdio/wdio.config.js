var path = require('path');
const DeltaService = require('../../lib/src');
var path = require('path');
var VisualRegressionCompare = require('wdio-novus-visual-regression-service/compare');

function getScreenshotName(basePath) {
  return function(context) {
    var type = context.type;
    var testName = context.test.title;
    var browserVersion = parseInt(context.browser.version, 10);
    var browserName = context.browser.name;
    var browserViewport = context.meta.viewport;
    var browserWidth = browserViewport.width;
    var browserHeight = browserViewport.height;

    return path.join(
      basePath,
      `${testName}_${type}_${browserName}_v${browserVersion}_${browserWidth}x${browserHeight}.png`
    );
  };
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
  reporters: ['dot', 'spec'],
  services: [
    'novus-visual-regression',
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
  visualRegression: {
    compare: new VisualRegressionCompare.LocalCompare({
      referenceName: getScreenshotName(path.join(process.cwd(), 'screenshots/reference')),
      screenshotName: getScreenshotName(path.join(process.cwd(), 'screenshots/screen')),
      diffName: getScreenshotName(path.join(process.cwd(), 'screenshots/diff')),
      misMatchTolerance: 0.01
    }),
    viewportChangePause: 300,
    viewports: [
      { width: 320, height: 480 },
      { width: 480, height: 320 },
      { width: 1024, height: 768 }
    ],
    orientations: ['landscape', 'portrait']
  },
  // Options for selenium-standalone
  // Path where all logs from the Selenium server should be stored.
  seleniumLogs: './logs/'
};
