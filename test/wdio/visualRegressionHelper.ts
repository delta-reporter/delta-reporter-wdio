import { expect } from 'chai';
declare var browser: any;

export class VisualRegression {
  constructor() {}

  static expectSame(results, elementName) {
    results.forEach(
      (result, idx) =>
        expect(result.isExactSameImage, elementName + ' element on Image ' + idx + " isn't the same").to.be.true
    );
  }

  static expectWithinMisMatchTolerance(results, elementName) {
    // console.log(results);
    results.forEach(
      (result, idx) =>
        expect(
          result.isWithinMisMatchTolerance,
          elementName + ' element on Image ' + idx + " isn't the same, mismatch: " + result.misMatchPercentage
        ).to.be.true
    );
  }

  static checkElement(elementIdentifier: string, options?: object) {
    browser.pause(500);
    return browser.checkElement(elementIdentifier, options);
  }

  static checkDocument(options?: object) {
    browser.pause(500);
    return browser.checkDocument(options);
  }

  static checkViewport(options?: object) {
    browser.pause(500);
    return browser.checkViewport(options);
  }
}
