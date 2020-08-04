import * as DeltaUtils from './utils';
const RestClientDelta = require('./rest');
import logger from '@wdio/logger';
const log = logger('wdio-delta-reporter-service');

class DeltaRequests {
  delta_promises: any;
  restClient: any;
  delta_launch_id: number;
  delta_test_run_id: number;

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

  startTestRun(testRunPayload: any, launchTempId?: string) {
    // DeltaUtils.getRejectAnswer();
    if (launchTempId) {
      const launchObj = this.delta_promises[launchTempId];
      console.log(launchObj);
      if (!launchObj) {
        return DeltaUtils.getRejectAnswer(launchTempId, new Error(`Launch "${launchTempId}" not found`));
      }
      if (launchObj.finishSend) {
        const err = new Error(`Launch "${launchTempId}" is already finished, you can not add an item to it`);
        return DeltaUtils.getRejectAnswer(launchTempId, err);
      }
      let launchPromise = launchObj.promiseStart;
      let tempId = DeltaUtils.getUniqId();
      launchPromise.then(() => {
        const generated_launch_id = this.delta_promises[launchTempId].realId;
        testRunPayload.launch_id = generated_launch_id;
        // let tempId = DeltaUtils.getUniqId();
        console.log('#### TEST RUN PAYLOAD - INSIDE PROMISE ####');
        console.log(testRunPayload);
        this.delta_promises[tempId] = DeltaUtils.storeNewPromise((resolve, reject) => {
          this.createTestRun(testRunPayload).then(
            response => {
              //   this.delta_test_run = response;
              //   log.info(response);
              //   return response
              this.delta_promises[tempId].realId = response.id;
              this.delta_test_run_id = response.id;
              resolve(response);
            },
            error => {
              console.dir(error);
              reject(error);
            }
          );
        });
        // return {
        //     tempId,
        //     promise: this.delta_promises[tempId].promiseStart
        //   };
      });
      return {
        tempId
        // promise: this.delta_promises[tempId].promiseStart
      };
    }
  }

  startTestSuite(testSuitePayload: any, testRunTempId: string) {
    // DeltaUtils.getRejectAnswer();
    const testRunObj = this.delta_promises[testRunTempId];
    console.log(testRunObj);
    if (!testRunObj) {
      console.log('#### TEST RUN REAL ID');
      console.log(this.delta_promises[testRunTempId].realId);
      return DeltaUtils.getRejectAnswer(testRunTempId, new Error(`Test Run "${testRunTempId}" not found`));
    }
    if (testRunObj.finishSend) {
      const err = new Error(`Test Run "${testRunTempId}" is already finished, you can not add an item to it`);
      return DeltaUtils.getRejectAnswer(testRunTempId, err);
    }
    let launchPromise = testRunObj.promiseStart;
    launchPromise.then(() => {
      const generated_test_run_id = this.delta_promises[testRunTempId].realId;
      testSuitePayload.test_run_id = generated_test_run_id;
      console.log('#### TEST SUITE PAYLOAD - INSIDE PROMISE ####');
      console.log(testSuitePayload);
      this.createTestSuiteHistory(testSuitePayload).then(response => {
        //   this.delta_test_run = response;
        log.info(response);
        return response;
      });
    });
  }

  // let tempId = DeltaUtils.getUniqId();
  // this.delta_promises[tempId] = DeltaUtils.storeNewPromise((resolve, reject) => {
  //   this.createLaunch(launchPayload).then(
  //     response => {
  //       this.delta_promises[tempId].realId = response.id;
  //       this.delta_launch_id = response.id;
  //       resolve(response);
  //     },
  //     error => {
  //       console.dir(error);
  //       reject(error);
  //     }
  //   );
  // });
  // return {
  //   tempId,
  //   promise: this.delta_promises[tempId].promiseStart
  // };
}

module.exports = DeltaRequests;
