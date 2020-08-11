import WDIOReporter from '@wdio/reporter';

export interface ReporterOptions {
  outputDir?: string;
  fileName?: string;
  embedImages?: boolean;
  screenshotStrategy?: string;
  stdout?: boolean;
  configFile;
  logFile;
  logLevel;
}

class DeltaReporter extends WDIOReporter {
  reporterOptions: ReporterOptions;

  constructor(options?: ReporterOptions) {
    if (!options) {
      throw new Error('Set Delta Reporter options object');
    }
    options = { ...options, stdout: false };
    super(options);
  }

  onTestStart(test) {}

  onAfterCommand(command) {}

  onRunnerEnd(runner) {}

  prepareJson(runner) {}
}

export default DeltaReporter;
