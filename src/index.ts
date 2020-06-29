import logger from '@wdio/logger';

const RestClientPro = require('./rest');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const FormData = require('form-data');
const log = logger('wdio-delta-reporter-service');

class DeltaService {
  restClient: any;
  options: any;
  delta_test: any;
  delta_test_suite: any;

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

  finishLaunch(data: object) {
    const url = ['api/v1/finish_launch'];
    return this.restClient.update(url, data);
  }

  sendFileToTest(test_history_id: number, type: string, file: any, description?: string) {
    const url = ['api/v1/file_receiver_test_history/' + test_history_id];
    const form = new FormData();
    form.append('type', type);
    form.append('file', file);
    description ? form.append('description', description) : form.append('description', '');
    return this.restClient.create(url, form, { headers: form.getHeaders() });
  }

  async onPrepare(config, capabilities) {
    log.setLevel(config.logLevel || 'info');

    rimraf.sync('./.delta_service');
    fs.mkdirSync('./.delta_service');

    var launchId: string = process.env.DELTA_LAUNCH_ID;

    if (!launchId) {
      log.info('No Launch detected, creating a new one...');
      var date = new Date();
      var name =
        this.options.testType +
        ' | ' +
        date.toDateString() +
        ' - ' +
        date.getHours() +
        ':' +
        date.getMinutes() +
        ':' +
        date.getSeconds();
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

  async before(capabilities, specs) {
    browser.addCommand('sendFileToTest', async (type, file, description?) => {
      var response = await this.sendFileToTest(this.delta_test.test_history_id, type, file, description);
      log.info(response);
    });
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
    this.delta_test_suite = response;
    log.info(response);
  }

  async beforeTest(test, context) {
    const testRun = JSON.parse(fs.readFileSync('./.delta_service/testRun.json'));

    var test_history = {
      name: test.title,
      start_datetime: new Date(),
      test_suite_id: this.delta_test_suite.test_suite_id,
      test_run_id: testRun.id,
      test_suite_history_id: this.delta_test_suite.test_suite_history_id
    };

    var response = await this.createTestHistory(test_history);
    this.delta_test = response;
    fs.writeFileSync(path.resolve('./.delta_service/test.json'), JSON.stringify(response));
    log.info(response);
  }

  async afterTest(test, context, { error, result, duration, passed, retries }) {
    var test_history = {
      test_history_id: this.delta_test.test_history_id,
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
    var test_suite_history = {
      test_suite_history_id: this.delta_test_suite.test_suite_history_id,
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
    let launch;
    try {
      launch = JSON.parse(fs.readFileSync('./.delta_service/launch.json'));
    } catch {
      launch = null;
    }

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

    if (launch) {
      var response = await this.finishLaunch({
        launch_id: launch.id
      });
      log.info(response);
    }
  }
}

module.exports = DeltaService;
