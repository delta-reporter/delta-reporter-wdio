import { expect } from 'chai';

describe('Basic validations', function() {
  this.retries(1);

  it('Should check that the page is loaded', () => {
    browser.url('http://the-internet.herokuapp.com/');
  });

  it('Should check that the nested frames page is loaded', () => {
    browser.url('http://the-internet.herokuapp.com/nested_frames');
    browser.pause(1000);
    browser.url('http://the-internet.herokuapp.com/slow');
    browser.pause(1000);
    browser.url('http://the-internet.herokuapp.com/typos');
    browser.pause(1000);
    browser.url('http://the-internet.herokuapp.com/shifting_content');
    browser.pause(1000);
    browser.url('http://the-internet.herokuapp.com/jqueryui/menu');
    browser.pause(1000);
    browser.url('http://the-internet.herokuapp.com/challenging_dom');
    browser.pause(1000);
    expect($('[name="frameset-middle"]').isDisplayed()).to.be.true;
  });

  it('Should check that the key presses page is loaded', () => {
    browser.url('http://the-internet.herokuapp.com/key_press');
    let card_text = browser.$('.nonexistent_class').getText();
    expect(card_text).to.be.equals('something');
  });

  it('Should check that the floating menu page is loaded', () => {
    browser.url('http://the-internet.herokuapp.com/floating_menu');
  });
});
