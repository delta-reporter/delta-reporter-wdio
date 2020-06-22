# Delta Reporter WebdriverIO Service #

This service is intended to send information to Delta Reporter

### Installation ###

Installing this service is simple as:


```bash
npm i @delta-reporter/wdio-delta-reporter-service
```

### Configuration ###


```js
const DeltaService = require("@delta-reporter/wdio-delta-reporter-service");

exports.config = {
  // ...
  services: [new DeltaService({
      host: 'delta_host',
      project: 'Project Name',
      testType: 'Test Type',
      job: {
        "jenkinsHost": process.env.HOST,
        "jobURL": process.env.BUILD_URL,
        "name": process.env.JOB_NAME,
      },
      run: {
        buildNumber: process.env.BUILD_NUMBER,
        startedBy: process.env.BUILD_CAUSE_MANUALTRIGGER ? 'HUMAN' : 'SCHEDULER' // Actually could be "SCHEDULER", "UPSTREAM_JOB", "HUMAN"
      }
    })],
  // ...
}
```
