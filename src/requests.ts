import logger from '@wdio/logger';

const RestClientDelta = require('./rest');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const UniqId = require('uniqid');
const log = logger('wdio-delta-reporter-service');

class DeltaRequests {
  supportedFileTypes = ['img', 'video'];
  delta_promises: any;
  restClient: any;
  delta_launch_id: number;
  delta_test_run_id: number;
  test_suite_history_id: number;
  test_suite_id: number;
  temp_promises: {} = {};
  temp_suite_history: {};

  constructor(host) {
    this.delta_promises = {};
    this.restClient = new RestClientDelta({ baseURL: host });
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
    let response = this.restClient.create(url, data);
    this.test_suite_id = response.test_suite_id;
    this.test_suite_history_id = response.test_suite_history_id;

    return response;
  }

  createTestHistory(data: object) {
    const url = ['api/v1/test_history'];
    return this.restClient.create(url, data);
  }

  async createSkippedTestHistory(data: any, suite: string, options?: any) {
    let url = ['api/v1/test_history'];
    log.info(`Reading test file ${suite.replace(/ /g, '-')}.json`);
    if (this.checkFileExistsSync(`./.delta_service/${suite.replace(/ /g, '-')}.json`)) {
      const test_suite = JSON.parse(fs.readFileSync(`./.delta_service/${suite.replace(/ /g, '-')}.json`));
      data['test_suite_id'] = test_suite.test_suite_id;
      data['test_suite_history_id'] = test_suite.test_suite_history_id;
      data['status'] = 'Skipped';
      return await this.restClient.create(url, data);
    } else {
      log.info(`Test file ${suite.replace(/ /g, '-')}.json doesn't exists`);
      let test_run_suite = {
        name: suite,
        test_type: options.testType,
        // start_datetime: new Date(),
        test_run_id: data.test_run_id,
        project: options.project
      };

      this.temp_suite_history = this.startSuiteHistory(test_run_suite);
      // let response = await this.createTestSuiteHistory(test_run_suite);
      // fs.writeFileSync(path.resolve(`./.delta_service/${suite.replace(/ /g, '-')}.json`), JSON.stringify(response));
      // log.info(`Test file ${suite.replace(/ /g, '-')}.json written`);

      let response = await this.temp_suite_history['promise'];

      data['test_suite_id'] = response.test_suite_id;
      data['test_suite_history_id'] = response.test_suite_history_id;
      data['status'] = 'Skipped';
      return await this.restClient.create(url, data);
    }
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

  sendFile(test_history_id: number, type: string, file: any, description?: string) {
    if (this.supportedFileTypes.includes(type)) {
      const url = ['api/v1/file_receiver_test_history/' + test_history_id];
      const form = new FormData();
      form.append('type', type);
      form.append('file', file);
      description ? form.append('description', description) : form.append('description', '');
      return this.restClient.create(url, form, { headers: form.getHeaders() });
    } else {
      throw `This type of file: ${type} is not supported, please specify one of this: ${this.supportedFileTypes}`;
    }
  }

  checkFileExistsSync(filepath) {
    let flag = true;
    try {
      fs.accessSync(filepath, fs.constants.F_OK);
    } catch (e) {
      flag = false;
    }
    return flag;
  }

  getUniqId() {
    return UniqId();
  }

  getNewItemObj(startPromiseFunc) {
    let resolveFinish;
    let rejectFinish;
    const obj = {
      promiseStart: new Promise(startPromiseFunc),
      realId: '',
      childrens: [],
      finishSend: false,
      promiseFinish: new Promise((resolve, reject) => {
        resolveFinish = resolve;
        rejectFinish = reject;
      }),
      resolveFinish: null,
      rejectFinish: null
    };
    obj.resolveFinish = resolveFinish;
    obj.rejectFinish = rejectFinish;
    return obj;
  }

  startSuiteHistory(suiteHistoryPayload) {
    const tempId = this.getUniqId();

    if (Object.entries(this.temp_promises).length > 0) {
      this.temp_promises[tempId] = this.getNewItemObj(resolve => resolve(suiteHistoryPayload));
      fs.writeFileSync(
        path.resolve(`./.delta_service/${suiteHistoryPayload.name.replace(/ /g, '-')}.json`),
        JSON.stringify(suiteHistoryPayload)
      );
      log.info(`Test file ${suiteHistoryPayload.name.replace(/ /g, '-')}.json written`);
      this.test_suite_id = suiteHistoryPayload.test_suite_id;
      this.test_suite_history_id = suiteHistoryPayload.test_suite_history_id;
    } else {
      const suiteHistoryData = Object.assign({ start_datetime: new Date() }, suiteHistoryPayload);

      this.temp_promises[tempId] = this.getNewItemObj((resolve, reject) => {
        const url = ['api/v1/test_suite_history'];
        this.restClient.create(url, suiteHistoryData).then(
          response => {
            this.temp_promises[tempId].test_suite_id = response.test_suite_id;
            this.temp_promises[tempId].test_suite_history_id = response.test_suite_history_id;
            resolve(response);
          },
          error => {
            console.dir(error);
            reject(error);
          }
        );
      });
    }
    return {
      tempId,
      promise: this.temp_promises[tempId].promiseStart
    };
  }
}

module.exports = DeltaRequests;
