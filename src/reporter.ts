import WDIOReporter from '@wdio/reporter';
import logger from '@wdio/logger';
const DeltaRequests = require('./requests');
const fs = require('fs');
const log = logger('wdio-delta-reporter-service');

export interface ReporterOptions {
  host: string;
  project: string;
  testType: string;
  configFile: string;
  logFile: string;
  logLevel: string;
}

export default class DeltaReporter extends WDIOReporter {
  options: ReporterOptions;
  requests: any;
  suite_title: string;

  constructor(options: ReporterOptions) {
    options = Object.assign(options, { stdout: true });
    super(options);
    this.options = options;
    this.requests = new DeltaRequests(options.host);
  }

  onRunnerStart() {}
  onBeforeCommand() {}
  onAfterCommand() {}
  onScreenshot() {}

  onSuiteStart(suite) {
    this.suite_title = suite.title;
    log.info(`Test Suite start at time: ${new Date()}`);
  }
  onHookStart() {}
  onHookEnd() {}
  onTestStart(test) {}
  onTestPass() {}
  async onTestSkip(test) {
    const testRun = JSON.parse(fs.readFileSync('./.delta_service/testRun.json'));

    let test_history = {
      name: test.title,
      start_datetime: new Date(),
      test_run_id: testRun.id
    };

    log.info(`Skipping test at time: ${new Date()}`);

    let response = await this.requests.createSkippedTestHistory(test_history, this.suite_title, this.options);
    log.info(response);
  }

  onTestEnd() {}

  onSuiteEnd(suite) {}

  onRunnerEnd() {}
}

module.exports = DeltaReporter;
