# Delta Reporter WebdriverIO Service #

This service is intended to send information to Delta Reporter

It consists of a mix between a WebdriverIO Service and Reporter, so it needs to be declared in both spaces

![Screenshot of Delta reporter](https://github.com/delta-reporter/delta-reporter-wdio/blob/docs/src/docs/delta-reporter.png)

### Installation ###

Installing this service is simple as:


```bash
npm i @delta-reporter/wdio-delta-reporter-service
```

### Configuration ###


```js
const DeltaReporter = require('@delta-reporter/wdio-delta-reporter-service/lib/src/reporter');
const DeltaService = require("@delta-reporter/wdio-delta-reporter-service");

let delta_config = {
  host: 'delta_host',
  project: 'Project Name',
  testType: 'Test Type'
};

exports.config = {
  // ...
  reporters: [
    [DeltaReporter, delta_config]
  ],
  services: [new DeltaService(delta_config)],
  // ...
}
```

Its possible to send images and videos to Delta Reporter, for this use the `sendFileToTest` command, the parameters are `type`, `file` and `description`:
- `type`: Can be `img` or `video`
- `file`: Path to the file to be uploaded
- `description`: Optional value that will be displayed in the media container in Delta Reporter

Here is an example using this plugin along with [Video Reporter](https://github.com/presidenten/wdio-video-reporter)

```js
var path = require('path');
const fs = require('fs');
const video = require('wdio-video-reporter');
const DeltaReporter = require('@delta-reporter/wdio-delta-reporter-service/lib/src/reporter');
const DeltaService = require("@delta-reporter/wdio-delta-reporter-service");


function getLatestFile({ directory, extension }, callback) {
  fs.readdir(directory, (_, dirlist) => {
    const latest = dirlist
      .map(_path => ({ stat: fs.lstatSync(path.join(directory, _path)), dir: _path }))
      .filter(_path => _path.stat.isFile())
      .filter(_path => (extension ? _path.dir.endsWith(`.${extension}`) : 1))
      .sort((a, b) => b.stat.mtime - a.stat.mtime)
      .map(_path => _path.dir);
    callback(directory + '/' + latest[0]);
  });
}

let delta_config = {
  host: 'delta_host',
  project: 'Project Name',
  testType: 'Test Type'
};

exports.config = {
  // ...
  reporters: [
    [DeltaReporter, delta_config]
  ],
  services: [new DeltaService(delta_config)],
  afterTest(test) {
    if (test.passed === false) {
      const file_name = 'screenshot.png';
      const outputFile = path.join(__dirname, file_name);
      browser.saveScreenshot(outputFile);
      browser.sendFileToTest('img', outputFile);
      getLatestFile({ directory: browser.options.outputDir + '/_results_', extension: 'mp4' }, (filename = null) => {
        browser.sendFileToTest('video', filename, 'Video captured during test execution');
      });
    }
  }
  // ...
}
