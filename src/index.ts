import WDIOReporter from '@wdio/reporter';
import logger from '@wdio/logger';

const RestClientDelta = require('./rest');
const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');
const FormData = require('form-data');
const log = logger('wdio-delta-reporter-service');

export interface ReporterOptions {
  host: string;
  project: string;
  testType: string;
  configFile: string;
  logFile: string;
  logLevel: string;
}

export default class DeltaService extends WDIOReporter {
  options: ReporterOptions;
  restClient: any;
  delta_launch: any;
  delta_test_run: any;
  delta_test: any;
  delta_test_suite: any;

  constructor(options: ReporterOptions) {
    options = Object.assign(options, { stdout: true });
    super(options);
    this.restClient = new RestClientDelta({
      baseURL: options.host
    });
    this.options = options;
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

  onRunnerStart() {
    browser.addCommand('sendFileToTest', async (type, file, description?) => {
      let response = await this.sendFileToTest(
        this.delta_test.test_history_id,
        type,
        fs.createReadStream(file),
        description
      );
      log.info(response);
    });
    log.setLevel(this.options.logLevel || 'info');

    rimraf.sync('./.delta_service');
    fs.mkdirSync('./.delta_service');

    let launchId: string = process.env.DELTA_LAUNCH_ID;

    if (!launchId || isNaN(Number(launchId))) {
      log.info('No Launch detected, creating a new one...');
      let date = new Date();
      let hours = date.getHours() < 10 ? '0' + date.getHours() : date.getHours();
      let minutes = date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes();
      let seconds = date.getSeconds() < 10 ? '0' + date.getSeconds() : date.getSeconds();
      let name = this.options.testType + ' | ' + date.toDateString() + ' - ' + hours + ':' + minutes + ':' + seconds;
      var launch = {
        name: name,
        project: this.options.project
      };
      let response = async () =>
        await this.createLaunch(launch).then(value => {
          launchId = value.id;
          this.delta_launch = response;
          log.info(response);
        });
      // fs.writeFileSync(path.resolve('./.delta_service/launch.json'), JSON.stringify(response));
      // launchId = response.id;
      // this.delta_launch = response;
      // log.info(response);
    }

    let test_run = {
      test_type: this.options.testType,
      launch_id: launchId,
      start_datetime: new Date()
    };

    let response = async () => await this.createTestRun(test_run);
    // fs.writeFileSync(path.resolve('./.delta_service/testRun.json'), JSON.stringify(response));
    this.delta_test_run = response;
    log.info(response);
  }
  onBeforeCommand() {}
  onAfterCommand() {}
  onScreenshot() {}

  onSuiteStart(suite) {
    // const testRun = JSON.parse(fs.readFileSync('./.delta_service/testRun.json'));

    var test_run_suite = {
      name: suite.title,
      test_type: this.options.testType,
      start_datetime: new Date(),
      test_run_id: this.delta_test_run.id,
      project: this.options.project
    };

    var response = async () => await this.createTestSuiteHistory(test_run_suite);
    this.delta_test_suite = response;
    log.info(response);
  }
  onHookStart() {}
  onHookEnd() {}
  onTestStart(test) {
    // const testRun = JSON.parse(fs.readFileSync('./.delta_service/testRun.json'));

    var test_history = {
      name: test.title,
      start_datetime: new Date(),
      test_suite_id: this.delta_test_suite.test_suite_id,
      test_run_id: this.delta_test_run.id,
      test_suite_history_id: this.delta_test_suite.test_suite_history_id
    };

    var response = async () => await this.createTestHistory(test_history);
    this.delta_test = response;
    fs.writeFileSync(path.resolve('./.delta_service/test.json'), JSON.stringify(response));
    log.info(response);
  }
  onTestPass() {}
  onTestSkip(test) {}
  onTestEnd() {}

  onSuiteEnd(suite) {
    var test_suite_history = {
      test_suite_history_id: this.delta_test_suite.test_suite_history_id,
      end_datetime: new Date(),
      test_suite_status: suite.error ? 'Failed' : 'Successful',
      data: {
        file: suite.file
      }
    };
    var response = async () => await this.updateSuiteHistory(test_suite_history);
    log.info(response);
  }

  onRunnerEnd() {
    // const testRun = JSON.parse(fs.readFileSync('./.delta_service/testRun.json'));
    // let launch;
    // try {
    //   launch = JSON.parse(fs.readFileSync('./.delta_service/launch.json'));
    // } catch {
    //   launch = null;
    // }

    var test_run = {
      test_run_id: this.delta_test_run.id,
      end_datetime: new Date(),
      test_run_status: 0 ? 'Failed' : 'Passed'
    };
    var response = async () => await this.updateTestRun(test_run);
    log.info(response);

    if (this.delta_launch) {
      var response = async () =>
        await this.finishLaunch({
          launch_id: this.delta_launch.id
        });
      log.info(response);
    }
  }
}

module.exports = DeltaService;
