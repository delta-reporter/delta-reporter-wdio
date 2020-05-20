import { expect } from 'chai';
import { VisualRegression } from './visualRegressionHelper';

describe('Basic validations', function() {
  // this.retries(1);

  it('Should check that the page is loaded', () => {
    browser.url('http://the-internet.herokuapp.com/');
    VisualRegression.checkDocument();
  });

  it('Should check that the nested frames page is loaded', () => {
    browser.url('http://the-internet.herokuapp.com/nested_frames');
    VisualRegression.checkDocument();
    expect($('[name="frameset-middle"]').isDisplayed()).to.be.true;
  });

  it('Should check that the key presses page is loaded', () => {
    browser.url('http://the-internet.herokuapp.com/key_press');
    VisualRegression.checkDocument();
    let card_text = browser.$('.nonexistent_class').getText();
    expect(card_text).to.be.equals('something');
  });

  it('Should check that the floating menu page is loaded', () => {
    browser.url('http://the-internet.herokuapp.com/floating_menu');
    VisualRegression.checkDocument();
  });

  it('Should check that a visual regression test always fails', () => {
    browser.url('http://the-internet.herokuapp.com/dynamic_content');
    VisualRegression.checkDocument();
  });
});
