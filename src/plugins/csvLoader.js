// This module implements CSV file loading.
// by Curran Kelleher April 2015
define(["d3", "model"], function (d3, Model) {

  return function CsvLoader() {

    var model = Model({
      publicProperties: [ "csvPath", "numericColumns", "timeColumns" ],
      csvPath: Model.None,
      numericColumns: [],
      timeColumns: []
    });

    model.when(["csvPath", "numericColumns", "timeColumns"],
        function (csvPath, numericColumns, timeColumns){

      if(csvPath !== Model.None){

        d3.csv(csvPath, function(d){
  
          // Parse strings into numbers for numeric columns.
          numericColumns.forEach(function(column){
            d[column] = +d[column];
          });
  
          // Parse strings into dates for time columns.
          timeColumns.forEach(function(column){
            d[column] = new Date(d[column]);
          });
  
          return d;
        }, function(err, data){
          model.data = data;
        });
      }
    });

    return model;
  };
});
