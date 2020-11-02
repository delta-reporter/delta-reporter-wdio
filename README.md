# Delta Reporter WebdriverIO Service #


A WebdriverIO reporter plugin to create [Delta reports](https://github.com/delta-reporter/delta-reporter)




![Screenshot of Delta reporter](/src/docs/delta-reporter.png)


### Installation ###

Installing this service is simple as:


```bash
npm i @delta-reporter/wdio-delta-reporter-service
```

### Configuration ###


Delta reporter WebdriverIO plugin consists of a mix between a [WebdriverIO Service](https://github.com/webdriverio/webdriverio/tree/master/packages/webdriverio) and [Reporter](https://github.com/webdriverio/webdriverio/tree/master/packages/wdio-reporter), so it needs to be declared as a reporter and as a service in config file.


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
  // ...
  services: [new DeltaService(delta_config)],
  // ...
}
```


### Add screenshots and videos ###

Screenshots and videos can be attached to the report by using the `sendFileToTest` command in afterTest hook in wdio config file. The parameters are `type`, `file` and `description`:
- `type`: Can be `img` or `video`
- `file`: Path to the file to be uploaded
- `description`: Optional value that will be displayed in the media container in Delta Reporter

Below is an example of wdio config file using this plugin along with [Video Reporter](https://github.com/presidenten/wdio-video-reporter), so that Delta Reporter is showing screenshots and videos of failed tests:

```js
var path = require('path');
const fs = require('fs');
const video = require('wdio-video-reporter');
const DeltaReporter = require('@delta-reporter/wdio-delta-reporter-service/lib/src/reporter');
const DeltaService = require("@delta-reporter/wdio-delta-reporter-service");

// ...

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

// ...

exports.config = {
  // ...
  reporters: [
    [DeltaReporter, delta_config]
  ],
  // ...
  services: [new DeltaService(delta_config)],

 // ...

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
