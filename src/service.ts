import logger from '@wdio/logger';

const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const DeltaRequests = require('./requests');
const log = logger('wdio-delta-reporter-service');

class DeltaService {
  restClient: any;
  options: any;
  delta_test: any;
  delta_test_suite: any = {};
  requests: any;

  constructor(options) {
    this.options = options;
    this.requests = new DeltaRequests(options.host);
  }

  async onPrepare(config, capabilities) {
    log.setLevel(config.logLevel || 'info');

    if (!this.options.enabled) return;

    rimraf.sync('./.delta_service');
    fs.mkdirSync('./.delta_service');

    let launchId: string = process.env.DELTA_LAUNCH_ID;
    let response: any;

    if (!launchId || isNaN(Number(launchId))) {
      log.info('No Launch detected, creating a new one...');
      let date = new Date();
      let hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
      let minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
      let seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
      let name = this.options.testType + ' | ' + date.toDateString() + ' - ' + hours + ':' + minutes + ':' + seconds;

      let launch = {
        name: name,
        project: this.options.project
      };
      response = await this.requests.createLaunch(launch);
      fs.writeFileSync(path.resolve('./.delta_service/launch.json'), JSON.stringify(response));
      launchId = response.id;
      log.info(response);
    }

    let test_run = {
      test_type: this.options.testType,
      environment: config.baseUrl,
      launch_id: launchId,
      start_datetime: new Date()
    };

    response = await this.requests.createTestRun(test_run);
    fs.writeFileSync(path.resolve('./.delta_service/testRun.json'), JSON.stringify(response));
    log.info(response);
  }

  async before(capabilities, specs) {
    if (!this.options.enabled) return;
    browser.addCommand('sendFileToTest', async (type, file, description?) => {
      try {
        let response = await this.requests.sendFile(
          this.delta_test.test_history_id,
          type,
          fs.createReadStream(file),
          description
        );
        log.info(response);
      } catch (e) {
        log.error(e);
      }
    });

    browser.addCommand('sendDataToTest', async data => {
      try {
        let payload = { data: data };
        let response = await this.requests.sendDataTest(this.delta_test.test_history_id, payload);
        log.info(response);
      } catch (e) {
        log.error(e);
      }
    });

    browser.addCommand('sendDataToTestRun', async data => {
      try {
        let payload = { data: data };
        const testRun = JSON.parse(fs.readFileSync('./.delta_service/testRun.json'));
        let response = await this.requests.sendDataTestRun(testRun.id, payload);
        log.info(response);
      } catch (e) {
        log.error(e);
      }
    });
  }

  async beforeSuite(suite) {
    if (!this.options.enabled) return;
    const testRun = JSON.parse(fs.readFileSync('./.delta_service/testRun.json'));
    let response: any;
    let test_run_suite = {
      name: suite.title,
      test_type: this.options.testType,
      start_datetime: new Date(),
      test_run_id: testRun.id,
      project: this.options.project
    };

    response = await this.requests.createTestSuiteHistory(test_run_suite);
    fs.writeFileSync(path.resolve(`./.delta_service/${suite.title.replace(/ /g, '-')}.json`), JSON.stringify(response));
    log.info(`Test file ${suite.title.replace(/ /g, '-')}.json written`);
    this.delta_test_suite[suite.file] = response;
    this.delta_test_suite[suite.file].title = suite.title
    log.info(response);
  }

  async beforeTest(test, context) {
    if (!this.options.enabled) return;
    const testRun = JSON.parse(fs.readFileSync('./.delta_service/testRun.json'));

    let test_title = test.title
    if (test.parent != this.delta_test_suite[test.file].title)
      test_title = `${test.parent} ${test.title}`;

    let test_history = {
      name: test_title,
      start_datetime: new Date(),
      test_suite_id: this.delta_test_suite[test.file].test_suite_id,
      test_run_id: testRun.id,
      test_suite_history_id: this.delta_test_suite[test.file].test_suite_history_id
    };

    let response = await this.requests.createTestHistory(test_history);
    this.delta_test = response;
    fs.writeFileSync(path.resolve('./.delta_service/test.json'), JSON.stringify(response));
    log.info(response);
  }

  async afterTest(test, context, { error, result, duration, passed, retries }) {
    if (!this.options.enabled) return;
    let test_history = {
      test_history_id: this.delta_test.test_history_id,
      end_datetime: new Date(),
      test_status: passed ? 'Passed' : 'Failed',
      trace: error ? error.stack : null,
      file: test.file,
      message: error ? error.message : null,
      error_type: error ? String(error).split(':')[0] : null,
      retries: test.retries
    };
    let response = await this.requests.updateTestHistory(test_history);
    log.info(response);
  }

  async afterSuite(suite) {
    if (!this.options.enabled) return;

    let test_suite_history = {
      test_suite_history_id: this.delta_test_suite[suite.file].test_suite_history_id,
      end_datetime: new Date(),
      // TODO: suite.error doesn't return nothing, other way to set failed suite is needed
      test_suite_status: suite.error ? 'Failed' : 'Successful',
      data: {
        file: suite.file
      }
    };
    let response = await this.requests.updateSuiteHistory(test_suite_history);
    log.info(response);
  }

  async onComplete(exitCode, config, capabilities, results) {
    if (!this.options.enabled) return;
    const testRun = JSON.parse(fs.readFileSync('./.delta_service/testRun.json'));
    let launch;
    let response: any;
    try {
      launch = JSON.parse(fs.readFileSync('./.delta_service/launch.json'));
    } catch {
      launch = null;
    }

    let test_run = {
      test_run_id: testRun.id,
      end_datetime: new Date(),
      test_run_status: exitCode ? 'Failed' : 'Passed'
    };
    response = await this.requests.updateTestRun(test_run);
    log.info(response);

    if (launch) {
      response = await this.requests.finishLaunch({ launch_id: launch.id });
      log.info(response);
    }
  }
}

module.exports = DeltaService;
