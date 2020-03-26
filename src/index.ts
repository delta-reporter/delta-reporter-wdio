import logger from '@wdio/logger';

const RestClientPro = require('./rest');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const log = logger('wdio-delta-reporter-service');

var launchId: number;

class DeltaService {
  restClient: any;
  options: any;
  launchId = process.env.DELTA_LAUNCH_ID;

  constructor(options) {
    this.options = options;
    this.restClient = new RestClientPro({
      baseURL: this.options.host
    });
  }

  getLaunchById(id: number) {
    const url = ['api/v1/launch', id].join('/');
    return this.restClient.retrieve(url);
  }

  createLaunch(data: object) {
    const url = ['api/v1/launch'];
    return this.restClient.create(url, data);
  }

  createTestRun(data: object) {
    const url = ['api/v1/test_run'];
    return this.restClient.create(url, data);
  }

  createTestSuiteHistory(data: object) {
    const url = ['api/v1/test_suite_history'];
    return this.restClient.create(url, data);
  }

  createTestHistory(data: object) {
    const url = ['api/v1/test_history'];
    return this.restClient.create(url, data);
  }

  updateTestHistory(data: object) {
    const url = ['api/v1/test_history'];
    return this.restClient.update(url, data);
  }

  updateSuiteHistory(data: object) {
    const url = ['api/v1/test_suite_history'];
    return this.restClient.update(url, data);
  }

  updateTestRun(data: object) {
    const url = ['api/v1/test_run'];
    return this.restClient.update(url, data);
  }

  async onPrepare(config, capabilities) {
    log.setLevel(config.logLevel || 'info');

    rimraf.sync('./.delta_service');
    fs.mkdirSync('./.delta_service');

    if (!launchId) {
      log.info('No Launch detected, creating a new one...');
      var date = new Date();
      var name = 'Launch ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds();
      var launch = {
        name: name,
        project: this.options.project
      };
      var response = await this.createLaunch(launch);
      fs.writeFileSync(path.resolve('./.delta_service/launch.json'), JSON.stringify(response));
      launchId = response.id;
      log.info(response);
    }

    var test_run = {
      test_type: this.options.testType,
      launch_id: launchId,
      start_datetime: new Date()
    };

    var response = await this.createTestRun(test_run);
    fs.writeFileSync(path.resolve('./.delta_service/testRun.json'), JSON.stringify(response));
    log.info(response);
  }

  async beforeSuite(suite) {
    const testRun = JSON.parse(fs.readFileSync('./.delta_service/testRun.json'));

    var test_run_suite = {
      name: suite.title,
      test_type: this.options.testType,
      start_datetime: new Date(),
      test_run_id: testRun.id,
      project: this.options.project
    };

    var response = await this.createTestSuiteHistory(test_run_suite);
    fs.writeFileSync(path.resolve('./.delta_service/testSuite.json'), JSON.stringify(response));
    log.info(response);
  }

  async beforeTest(test, context) {
    const testSuite = JSON.parse(fs.readFileSync('./.delta_service/testSuite.json'));
    const testRun = JSON.parse(fs.readFileSync('./.delta_service/testRun.json'));

    var test_history = {
      name: test.title,
      start_datetime: new Date(),
      test_suite_id: testSuite.test_suite_id,
      test_run_id: testRun.id,
      test_suite_history_id: testSuite.test_suite_history_id
    };

    var response = await this.createTestHistory(test_history);
    fs.writeFileSync(path.resolve('./.delta_service/test.json'), JSON.stringify(response));
    log.info(response);
  }

  async afterTest(test, context, { error, result, duration, passed, retries }) {
    const delta_test = JSON.parse(fs.readFileSync('./.delta_service/test.json'));

    var test_history = {
      test_history_id: delta_test.test_history_id,
      end_datetime: new Date(),
      test_status: passed ? 'Passed' : 'Failed',
      trace: error ? error.stack : null,
      file: test.file,
      message: error ? error.message : null,
      error_type: error ? String(error).split(':')[0] : null,
      retries: test.retries
    };
    var response = await this.updateTestHistory(test_history);
    log.info(response);
  }

  async afterSuite(suite) {
    const testSuite = JSON.parse(fs.readFileSync('./.delta_service/testSuite.json'));

    var test_suite_history = {
      test_suite_history_id: testSuite.test_suite_history_id,
      end_datetime: new Date(),
      test_suite_status: suite.error ? 'Failed' : 'Successful',
      data: {
        file: suite.file
      }
    };
    var response = await this.updateSuiteHistory(test_suite_history);
    log.info(response);
  }

  async onComplete(exitCode, config, capabilities, results) {
    const testRun = JSON.parse(fs.readFileSync('./.delta_service/testRun.json'));

    var test_run = {
      test_run_id: testRun.id,
      end_datetime: new Date(),
      test_run_status: exitCode ? 'Failed' : 'Passed',
      data: {
        capabilities
      }
    };
    var response = await this.updateTestRun(test_run);
    log.info(response);
  }
}

module.exports = DeltaService;
