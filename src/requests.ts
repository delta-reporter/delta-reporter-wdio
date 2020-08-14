import * as DeltaUtils from './utils';
const RestClientDelta = require('./rest');
const FormData = require('form-data');
const fs = require('fs');

class DeltaRequests {
  delta_promises: any;
  restClient: any;
  delta_launch_id: number;
  delta_test_run_id: number;
  test_suite_history_id: number;
  test_suite_id: number;

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

  createSkippedTestHistory(data: object, suite: string) {
    const test_suite = JSON.parse(fs.readFileSync(`./.delta_service/${suite.replace(' ', '-')}.json`));
    data['test_suite_id'] = test_suite.test_suite_id;
    data['test_suite_history_id'] = test_suite.test_suite_history_id;
    data['status'] = 'Skipped';
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

  sendFile(test_history_id: number, type: string, file: any, description?: string) {
    const url = ['api/v1/file_receiver_test_history/' + test_history_id];
    const form = new FormData();
    form.append('type', type);
    form.append('file', file);
    description ? form.append('description', description) : form.append('description', '');
    return this.restClient.create(url, form, { headers: form.getHeaders() });
  }
}

module.exports = DeltaRequests;
