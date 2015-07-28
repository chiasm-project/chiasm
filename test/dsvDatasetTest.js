var assert = require("assert"),
    dsvDataset = require("../src/plugins/dsvDataset/dsvDataset");

// This set of tests is for the data reduction plugin wrapper API
// around the dsv-dataset package found at
// https://github.com/curran/dsv-dataset
describe("plugins/dsvDataset", function () {

  it("should parse a DSV string with metadata", function(done) {
    var model = dsvDataset();

    model.dsvString = [
      "sepal_length,sepal_width,petal_length,petal_width,class",
      "5.1,3.5,1.4,0.2,setosa",
      "4.9,3.0,1.4,0.2,setosa",
      "4.7,3.2,1.3,0.2,setosa",
      "6.2,2.9,4.3,1.3,versicolor",
      "5.1,2.5,3.0,1.1,versicolor",
      "5.7,2.8,4.1,1.3,versicolor",
      "6.3,3.3,6.0,2.5,virginica",
      "5.8,2.7,5.1,1.9,virginica",
      "7.1,3.0,5.9,2.1,virginica"
    ].join("\n");
    
    model.metadata = {
      delimiter: ",",
      columns: [
        { name: "sepal_length", type: "number" },
        { name: "sepal_width",  type: "number" },
        { name: "petal_length", type: "number" },
        { name: "petal_width",  type: "number" },
        { name: "class",        type: "string" }
      ]
    };

    model.when("data", function (data){
      assert.equal(data.length, model.dsvString.split("\n").length - 1);
      assert.equal(typeof data[0].sepal_length, "number");
      assert.equal(typeof data[0].sepal_width,  "number");
      assert.equal(typeof data[0].petal_length, "number");
      assert.equal(typeof data[0].petal_width,  "number");
      assert.equal(typeof data[0].class,        "string");
      done();
    });
  });
});
