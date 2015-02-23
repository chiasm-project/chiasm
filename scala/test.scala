// Load the data file
//val data = sc.textFile("/Users/curran/repos/data/uci_ml/adult/adult.data")
//val schema = sc.textFile("/Users/curran/repos/data/uci_ml/adult/schema.csv").collect()

// Store the index of each attribute as a Map[String,Int].
// Keys are attribute names, values are integer indices for looking
// up values for the attribute in a given row of the table.
val attributeIndices = schema.map(_.split(",")(0)).zipWithIndex.toMap

case class Attribute(name: String, i: Integer = 0)

case class Measure(aggregationOp: String, name:String = "", i: Integer = 0)

// Example dimensions, simulating a REST API argument.
var dimensions = List(Attribute("sex"), Attribute("race"))
//var dimensions = List(Attribute("sex"))

//var measures = List(Measure("count"))
var measures = List(Measure("count"), Measure("sum", "capital-gain"))

// Add the index information for later use.
dimensions = dimensions.map(d => Attribute(d.name, attributeIndices(d.name)))
measures = measures.map(m => 
  if (m.aggregationOp == "count"){
    m
  } else { 
    Measure(m.aggregationOp, m.name, attributeIndices(m.name))
  }
)

// Parse data into table, ignore rows not parsed correctly.
val tupleSize = schema.length;
val table = data.map(_.split(",").map(_.trim)).filter(_.length == tupleSize)

// Computes a data cube of counts over the given dimensions.
val result = table.map(row =>
  (
    dimensions.map(d => row(d.i)),
    measures.map(m =>
      if (m.aggregationOp == "count"){
        1.0
      } else {
        row(m.i).toDouble
      }
    )
  )
).reduceByKey((a, b) =>
  (a, b).zipped.map(_+_)
).collect()
//val result = table.map(row =>
//  (
//    dimensions.map(d => row(d.i)), 
//    measures.map(m =>
//      if (m.aggregationOp == "count"){
//        1.0
//      } else if (m.aggregationOp == "sum"){
//        row(m.i).toDouble
//      }
//    )
//  )
//).reduceByKey((a, b) => a.zip(b).map(_+_)).collect()

println(result)


//// Compute the number of rows.
//val tupleSize = data.first().split(",").length
//
//// Parse CSV rows.
//// Filter out lines with parse errors.
//val table = data.map(_.split(",").map(_.trim)).filter(_.length == tupleSize)
//
//
//// Task 1: Detect columns with high cardinality.
//// Task 2: Group by a single categorical dimension.
//// Task 3: Group by numeric intervals (histogram).
//// Task 3: Group by multiple categorical dimensions.
//// Task 4: Group by multiple numeric intervals (2D histogram).
//// Task 5: Group by numerical and categorical simultaneously.
//
//// Approaches:
//// - Use Spark SQL, generate histogram bin columns
//// - Use direct Spark, no need to store generated histogram bin assignments
//
//// This is one way of computing aggregations (multidimension group-by)
////
////val distinct1 = table.map(_(1)).distinct()
////val distinct3 = table.map(_(3)).distinct()
////
////val product = distinct1.cartesian(distinct3).collect()
////
//////val result = distinct.zip(distinct.map(v => table.filter(_(1) == v).count()))
////
////val result = product.map(tuple => table.filter(_(1) == tuple(1)).count())
////
////result.foreach(println)
