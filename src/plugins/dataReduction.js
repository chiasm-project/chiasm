define(["d3"], function (d3){
  return function (data){
    return {
      filter: function (predicates){

			  // The API is asynchronous in anticipation of server-side implementations.
			  return new Promise(function (resolve, reject){
					var result = data;
					predicates.forEach(function (predicate){
						result = result.filter(function (d){
							return d[predicate.column] >= predicate.min;
						});
					});
					resolve(result);
				});
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
  };
});
