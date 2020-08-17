import { expect } from 'chai';

describe('Basic validations3', function() {
  this.retries(1);

  xit('Should check that the page is loaded3', () => {
    browser.url('http://the-internet.herokuapp.com/');
  });

  xit('Should check that the nested frames page is loaded3', () => {
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

  xit('Should check that the key presses page is loaded3', () => {
    browser.url('http://the-internet.herokuapp.com/key_press');
    let card_text = browser.$('.nonexistent_class').getText();
    expect(card_text).to.be.equals('something');
  });

  xit('Should check that the floating menu page is loaded3', () => {
    browser.url('http://the-internet.herokuapp.com/floating_menu');
  });

  it.skip('Should check that the floating menu page is displayed3', () => {
    browser.url('http://the-internet.herokuapp.com/floating_menu');
  });

  xit('Should check that the floating menu page is shown3', () => {
    browser.url('http://the-internet.herokuapp.com/floating_menu');
  });
});

describe('Basic validations4', function() {
  this.retries(1);

  xit('Should check that the page is loaded4', () => {
    browser.url('http://the-internet.herokuapp.com/');
  });

  xit('Should check that the nested frames page is loaded4', () => {
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

  it('Should check that the key presses page is loaded4', () => {
    browser.url('http://the-internet.herokuapp.com/key_press');
    let card_text = browser.$('.nonexistent_class').getText();
    expect(card_text).to.be.equals('something');
  });

  xit('Should check that the floating menu page is loaded4', () => {
    browser.url('http://the-internet.herokuapp.com/floating_menu');
  });

  it.skip('Should check that the floating menu page is displayed4', () => {
    browser.url('http://the-internet.herokuapp.com/floating_menu');
  });

  xit('Should check that the floating menu page is shown4', () => {
    browser.url('http://the-internet.herokuapp.com/floating_menu');
  });
});
