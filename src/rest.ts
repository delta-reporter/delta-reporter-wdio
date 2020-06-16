const axios = require('axios').default;
const axiosRetry = require('axios-retry');

axiosRetry(axios, { retryDelay: () => 100, retries: 10, retryCondition: axiosRetry.isRetryableError });

class RestClient {
  baseURL: string;
  headers: any;

  constructor(options) {
    this.baseURL = options.baseURL;
  }

  buildPath(path) {
    return [this.baseURL, path].join('/');
  }

  static request(method, url, data, options: any = {}) {
    return axios({
      method,
      url,
      headers: options.headers,
      data
    })
      .then(response => response.data)
      .catch(error => {
        const errorMessage = error.message;
        const responseData = error.response && error.response.data;
        throw new Error(
          `${errorMessage}${
            responseData && typeof responseData === 'object' ? `: ${JSON.stringify(responseData)}` : ''
          }`
        );
      });
  }

  create(path, data, options = { headers: this.headers }) {
    console.log('### SEND FILE LOGS ###');
    console.log(data);
    console.log(options);
    return RestClient.request('POST', this.buildPath(path), data, options);
  }

  retrieve(path, options = { headers: this.headers }) {
    return RestClient.request('GET', this.buildPath(path), {}, options);
  }

  update(path, data, options = { headers: this.headers }) {
    return RestClient.request('PUT', this.buildPath(path), data, options);
  }

  delete(path, data, options = { headers: this.headers }) {
    return RestClient.request('DELETE', this.buildPath(path), data, options);
  }
}

module.exports = RestClient;
