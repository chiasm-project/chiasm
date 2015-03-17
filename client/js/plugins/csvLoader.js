// This module implements CSV file loading.
// Created by Curran Kelleher Mar 2015
define(["d3", "model"], function (d3, Model) {

  return function CsvLoader(runtime) {

    var model = Model({
      publicProperties: [ "csvPath" ],
      numericColumns: []
    });

    model.when(["csvPath", "numericColumns"], function (csvPath, numericColumns){
      d3.csv(csvPath, function(d){
        // Parse strings into numbers for numeric columns.
        numericColumns.forEach(function(column){
          d[column] = +d[column];
        });
        return d;
      },function(err, data){
        console.log(data);
        model.data = data;
      });
    });

    return model;
  };
});
