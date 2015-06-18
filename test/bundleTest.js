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
});
