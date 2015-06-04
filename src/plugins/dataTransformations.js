define(["d3"], function (d3){
  return function (data){
    return {
      filter: function (options){
        if(options.rowFilter){
        }
        if(options.columnFilter){
        }
      },
      sample: function (options){
        //options.n
      },
      aggregate: function (options){
        options.cube.dimensions.forEach(function (dimension){
          //dimension.columnName;
          if(dimension.histogram){
            //dimension.histogram.numBins
            //dimension.histogram.niceBins // Boolean
          }
        });
        options.cube.measures.forEach(function (measure){
          //measure.columnName;
          //measure.aggregationOp
        });
      }
    };
  });
});
