// @ts-ignore
const UniqId = require('uniqid');
import logger from '@wdio/logger';

const log = logger('wdio-delta-reporter-service');

export const promiseErrorHandler = (promise: Promise<any>) => {
  promise.catch(err => {
    log.error(err);
  });
};

export const getRejectAnswer = (tempId, error) => {
  return { tempId, promise: Promise.reject(error) };
};

export const isEmpty = (object: object) => !object || Object.keys(object).length === 0;

export const getPromiseFinishAllItems = launchTempId => {
  const launchObj = this.map[launchTempId];
  return Promise.all(launchObj.childrens.map(itemId => this.map[itemId].promiseFinish));
};

export const getUniqId = () => {
  return UniqId();
};

export const storeNewPromise = startPromiseFunc => {
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
    })
  };
  obj['resolveFinish'] = resolveFinish;
  obj['rejectFinish'] = rejectFinish;
  return obj;
};
