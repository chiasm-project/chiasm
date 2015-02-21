// See https://spark.apache.org/docs/latest/sql-programming-guide.html
//val data = sc.textFile("/Users/Kelleher/Downloads/adult.data")

// Compute the number of rows.
val tupleSize = data.first().split(",").length

// Parse CSV rows.
// Filter out lines with parse errors.
val table = data.map(_.split(",").map(_.trim)).filter(_.length == tupleSize)


// Task 1: Detect columns with high cardinality.
// Task 2: Group by a single categorical dimension.
// Task 3: Group by numeric intervals (histogram).
// Task 3: Group by multiple categorical dimensions.
// Task 4: Group by multiple numeric intervals (2D histogram).
// Task 5: Group by numerical and categorical simultaneously.

// Approaches:
// - Use Spark SQL, generate histogram bin columns
// - Use direct Spark, no need to store generated histogram bin assignments

// This is one way of computing aggregations (multidimension group-by)
//
//val distinct1 = table.map(_(1)).distinct()
//val distinct3 = table.map(_(3)).distinct()
//
//val product = distinct1.cartesian(distinct3).collect()
//
////val result = distinct.zip(distinct.map(v => table.filter(_(1) == v).count()))
//
//val result = product.map(tuple => table.filter(_(1) == tuple(1)).count())
//
//result.foreach(println)
