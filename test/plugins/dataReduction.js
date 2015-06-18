var expect = require("chai").expect,
    dataReduction = require("./src/plugins/dataReduction");

describe("plugins/dataReduction", function () {

  var data1 = [
    { x: 1, y: 3 },
    { x: 5, y: 9 },
    { x: 9, y: 5 },
    { x: 4, y: 0 }
  ];

  describe("filter", function (){
    it("should compute filter (min)", function() {
      var result = dataReduction(data1, {
        filter: [
          { column: "x", min: 3 }
        ]
      });
      expect(result.length).to.equal(3);
    });

    it("should compute filter (min, inclusive)", function() {
      var result = dataReduction(data1, {
        filter: [
          { column: "x", min: 5 }
        ]
      });
      expect(result.length).to.equal(2);
    });

    it("should compute filter (min, multiple fields)", function() {
      var result = dataReduction(data1, {
        filter: [
          { column: "x", min: 3 },
          { column: "y", min: 2 }
        ]
      });
      expect(result.length).to.equal(2);
    });

    it("should compute filter (max)", function() {
      var result = dataReduction(data1, {
        filter: [
          { column: "x", max: 3 }
        ]
      });
      expect(result.length).to.equal(1);
    });

    it("should compute filter (max, inclusive)", function() {
      var result = dataReduction(data1, {
        filter: [
          { column: "x", max: 5 }
        ]
      });
      expect(result.length).to.equal(3);
    });

    it("should compute filter (min & max)", function() {
      var result = dataReduction(data1, {
        filter: [
          { column: "x", min: 2, max: 6 }
        ]
      });
      expect(result.length).to.equal(2);
    });

    it("should compute filter (min & max, multiple fields)", function() {
      var result = dataReduction(data1, {
        filter: [
          { column: "x", min: 1, max: 6 },
          { column: "y", min: 6, max: 9 }
        ]
      });
      expect(result.length).to.equal(1);
    });
  });
  describe("aggregate", function (){

    var data2 = [
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

    it("should compute aggregate (count)", function() {
      var result = dataReduction(data2, {
        aggregate: {
          dimensions: [{
            column: "foo"
          }],
          measures: [{
            outColumn: "total", 
            operator: "count"
          }]
        }
      });

      expect(result.length).to.equal(3);

      expect(where(result, "foo", "A")[0].total).to.equal(3);
      expect(where(result, "foo", "B")[0].total).to.equal(2);
      expect(where(result, "foo", "C")[0].total).to.equal(5);
      expect(where(result, "foo", "A")[0].total).to.equal(3);
    });
  });
});
function where(data, column, value){
  return data.filter(function (d) {
    return d[column] === value;
  });
}
