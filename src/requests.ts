import * as DeltaUtils from './utils';
const RestClientDelta = require('./rest');

class DeltaRequests {
  delta_promises: any;
  restClient: any;
  delta_launch_id: number;

  constructor(host) {
    this.delta_promises = {};
    this.restClient = new RestClientDelta({
      baseURL: host
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

  // let delta_promises: any;

  // this.delta_promises = {};

  startLaunch(launchPayload: any) {
    let tempId = DeltaUtils.getUniqId();
    this.delta_promises[tempId] = DeltaUtils.storeNewPromise((resolve, reject) => {
      this.createLaunch(launchPayload).then(
        response => {
          this.delta_promises[tempId].realId = response.id;
          this.delta_launch_id = response.id;
          resolve(response);
        },
        error => {
          console.dir(error);
          reject(error);
        }
      );
    });
    return {
      tempId,
      promise: this.delta_promises[tempId].promiseStart
    };
  }
}

module.exports = DeltaRequests;
