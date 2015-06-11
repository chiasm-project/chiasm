var expect = require("chai").expect,
    requirejs = require("../configureRequireJS.js"),
    Model = requirejs("model"),
    DataReduction = requirejs("./src/plugins/dataReduction");

var data = [
  { x: 1, y: 3 },
  { x: 5, y: 9 },
  { x: 9, y: 5 },
  { x: 4, y: 0 }
];

var dataReduction = DataReduction(data);

describe("plugins/dataReduction", function () {
  it("should compute filter (min)", function(done) {
	  dataReduction.filter([
		  {
			  column: "x",
				min: 3
			}
		]).then(function (result){
			expect(result.length).to.equal(3);
			done();
		});
  });

  it("should compute filter (min, inclusive)", function(done) {
	  dataReduction.filter([
		  {
			  column: "x",
				min: 5
			}
		]).then(function (result){
			expect(result.length).to.equal(2);
			done();
		});
  });
});
