var expect = require("chai").expect,
    dataReduction = require("../src/plugins/dataReduction/dataReduction");

// This set of tests is for the data reduction plugin wrapper API
// around the data-reduction package found at
// https://github.com/curran/data-reduction
describe("plugins/dataReduction", function () {


  it("should compute filter", function(done) {
    var model = dataReduction();

    model.dataIn = [
      { x: 1, y: 3 },
      { x: 5, y: 9 },
      { x: 9, y: 5 },
      { x: 4, y: 0 }
    ];

    model.filter = [ { column: "x", min: 3 } ];

    model.when("dataOut", function (dataOut){
      expect(dataOut.length).to.equal(3);
      done();
    });
  });

  it("should compute aggregate (count)", function(done) {
    var model = dataReduction();

    model.dataIn = [
      { foo: "A", bar: 1 },
      { foo: "A", bar: 8 },
      { foo: "A", bar: 6 }, // A sum = 15, count = 3
      { foo: "B", bar: 4 },
      { foo: "B", bar: 3 }, // B sum = 7, count = 2
      { foo: "C", bar: 6 },
      { foo: "C", bar: 1 },
      { foo: "C", bar: 3 },
      { foo: "C", bar: 6 },
      { foo: "C", bar: 4 } // C sum = 20, count = 5
    ];

    model.aggregate = {
      dimensions: [{
        column: "foo"
      }],
      measures: [{
        outColumn: "total", 
        operator: "count"
      }]
    };

    model.when("dataOut", function (dataOut){
      expect(where(dataOut, "foo", "A")[0].total).to.equal(3);
      expect(where(dataOut, "foo", "B")[0].total).to.equal(2);
      expect(where(dataOut, "foo", "C")[0].total).to.equal(5);
      expect(where(dataOut, "foo", "A")[0].total).to.equal(3);
      done();
    });
  });
});

function where(data, column, value){
  return data.filter(function (d) {
    return d[column] === value;
  });
}
