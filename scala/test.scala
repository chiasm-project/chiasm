// This script is a proof of concept implementation
// of data cube computation using Spark.
// Curran Kelleher Feb 2015

// Load the data files.
// See https://github.com/curran/data/tree/gh-pages/uci_ml/adult
val data = sc.textFile(  "/Users/Kelleher/repos/data/uci_ml/adult/data.csv")
val schema = sc.textFile("/Users/Kelleher/repos/data/uci_ml/adult/schema.csv").collect()

// Store the index of each attribute as a Map[String,Int].
// Keys are attribute names.
// Values are integer indices for use with parsed CSV rows.
val attributeIndices = schema.map(_.split(",")(0).trim).zipWithIndex.toMap

// Define types for options arguments.
// name is the attribute name.
// i is the index of this attribute in rows.
case class Dimension(name: String, i: Integer = 0)
case class Measure(aggregationOp: String, name:String = "", i: Integer = 0)

// Example options, simulating REST API arguments.
var dimensions = List(Dimension("sex"), Dimension("race"))
var measures = List(Measure("count"), Measure("sum", "capital-gain"))

// Add attribute index information to dimensions and measures for later use.
dimensions = dimensions.map(d => Dimension(d.name, attributeIndices(d.name)))
measures = measures.map(m => 
  if (m.aggregationOp == "count"){
    m // Index not necessary for "count"
  } else { 
    Measure(m.aggregationOp, m.name, attributeIndices(m.name))
  }
)

// Parse data into table, ignoring rows not parsed correctly.
val tupleSize = schema.length;
val table = data.map(_.split(",").map(_.trim)).filter(_.length == tupleSize)

// Compute a data cube using the specified dimensions and measures.
val cube = table.map(row =>
  (
    // Each key is a List of dimension values.
    dimensions.map(d => row(d.i)),

    // Each value is a List of measure values.
    measures.map(m =>
      if (m.aggregationOp == "count"){
        1.0
      } else {
        row(m.i).toDouble
      }
    )
  )
).reduceByKey((a, b) =>

  // Aggregate over unique dimension tuples
  // by summing measure values.
  (a, b).zipped.map(_+_)

).collect()

println(cube)

// prints cube: Array[(List[String], List[Double])] = Array(
// (List(Female, Other),List(109.0, 27759.0)), 
// (List(Female, Amer-Indian-Eskimo),List(119.0, 64808.0)), 
// (List(Female, Black),List(1555.0, 803303.0)), 
// (List(Male, Asian-Pac-Islander),List(693.0, 1266675.0)), 
// (List(Male, Amer-Indian-Eskimo),List(192.0, 129650.0)), 
// (List(Female, White),List(8642.0, 4957141.0)), 
// (List(Male, Black),List(1569.0, 1102151.0)), 
// (List(Female, Asian-Pac-Islander),List(346.0, 269339.0)), 
// (List(Male, White),List(19174.0, 2.6242964E7)), 
// (List(Male, Other),List(162.0, 225534.0)))
