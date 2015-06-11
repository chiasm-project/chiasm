define([], function (){

  function filter(data, predicates){
    predicates.forEach(function (predicate){
      if("min" in predicate){
        data = data.filter(function (d){
          return d[predicate.column] >= predicate.min;
        });
      }
      if("max" in predicate){
        data = data.filter(function (d){
          return d[predicate.column] <= predicate.max;
        });
      }
    });
    return data;
  }

  function aggregate(data, options){

    var dataByKey = {};

    function getRow(d, dimensions){
      var key = makeKey(d, dimensions);
      if(key in dataByKey){
        return dataByKey[key];
      } else {
        var row = makeRow(d, dimensions);
        dataByKey[key] = row;
        return row;
      }
    }

    data.forEach(function (d){
      var row = getRow(d, options.dimensions);
      options.measures.forEach(function (measure){
        var outColumn = measure.outColumn;
        if(measure.operator === "count"){
          row[outColumn] = (row[outColumn] || 0) + 1;
        }
      });
    });

    return Object.keys(dataByKey).map(function (key){
      return dataByKey[key];
    });
  }

  function makeKey(d, dimensions){
    // TODO optimize
    return dimensions.map(function (dimension){
      return d[dimension.column];
    }).join(";");
  }

  function makeRow(d, dimensions){

    // TODO implement histogram dimensions
    //if(dimension.histogram){
    //  //dimension.histogram.numBins
    //  //dimension.histogram.niceBins // Boolean
    //}

    var row = {};
    dimensions.forEach(function (dimension){
      row[dimension.column] = d[dimension.column];
    });
    return row;
  }

  return function (data, options){
    if("filter" in options){
      data = filter(data, options.filter);
    }
    if("aggregate" in options){
      data = aggregate(data, options.aggregate);
    }
    return data;
  };
});
