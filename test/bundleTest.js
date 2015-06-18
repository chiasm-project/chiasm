var ChiasmBundle = require("../chiasm-bundle");
var chiasm = new ChiasmBundle();

var expect = require("chai").expect;

describe("chiasm-bundle", function () {
  it("should contain layout plugin", function() {
    expect("layout" in chiasm.plugins).to.equal(true);
  });
});
