//Simulate browser globals
d3 = require("d3");
_ = require("lodash");

var ChiasmBundle = require("../chiasm-bundle");
var chiasm = new ChiasmBundle();

var expect = require("chai").expect;

describe("chiasm-bundle", function () {
  it("should contain layout plugin", function() {
    expect("layout" in chiasm.plugins).to.equal(true);
  });
  it("should contain barChart plugin", function() {
    expect("barChart" in chiasm.plugins).to.equal(true);
  });
  it("should contain lineChart plugin", function() {
    expect("lineChart" in chiasm.plugins).to.equal(true);
  });
  it("should contain scatterPlot plugin", function() {
    expect("scatterPlot" in chiasm.plugins).to.equal(true);
  });
  it("should contain links plugin", function() {
    expect("links" in chiasm.plugins).to.equal(true);
  });
  it("should contain dummyVis plugin", function() {
    expect("dummyVis" in chiasm.plugins).to.equal(true);
  });
  it("should contain csvLoader plugin", function() {
    expect("csvLoader" in chiasm.plugins).to.equal(true);
  });
});
