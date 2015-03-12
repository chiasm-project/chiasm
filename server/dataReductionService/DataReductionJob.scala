package visEditor

import com.typesafe.config.{Config, ConfigFactory, ConfigRenderOptions}
import org.apache.spark._
import org.apache.spark.SparkContext._
import scala.util.Try
import spark.jobserver._

// Use JSON4S for JSON serialization
import org.json4s._
import org.json4s.jackson.Serialization.{read, write}
import org.json4s.JsonDSL._
import org.json4s.jackson.JsonMethods._


object DataReductionJob extends SparkJob {

  // Define types for JSON options passed in from the client.
  case class Options( dataset: String, cube: Cube )
  case class Cube(dimensions: List[Dimension], measures: List[Measure])
  case class Dimension(name: String, i: Int){
    def this(name: String) = this(name, 0)
  }
  case class Measure(aggregationOp: String, name: String, i: Int){
    def this(aggregationOp: String, name: String) = this(aggregationOp, name, 0)
    def this(aggregationOp: String) = this(aggregationOp, aggregationOp, 0)
  }

  // This is necessary for JSON parsing into case classes.
  // See https://github.com/json4s/json4s#extracting-values
  implicit val formats = DefaultFormats

  override def runJob(sc:SparkContext, config: Config): Any = {

    // Extract the config options as JSON. See also
    // http://typesafehub.github.io/config/latest/api/com/typesafe/config/Config.html
    // http://stackoverflow.com/questions/15821961/serializing-typesafe-config-objects
    val optionsJSON = config.getObject("options").render(ConfigRenderOptions.concise())
    
    // The read function is provided by json4s.jackson.Serialization.
    // It automagically parses JSON into instances of case classes.
    val options = parse(optionsJSON).extract[Options]

    // Extract things from the options object.

    // dataset should be a path to a directory that contains files "data.csv" and "schema.csv"
    val dataset = options.dataset

    val dataPath = dataset + "/data.csv"
    val schemaPath = dataset + "/schema.csv"
    var dimensions = options.cube.dimensions
    var measures = options.cube.measures

    // Use Spark to load the data files.
    val data = sc.textFile(dataPath)
    val schema = sc.textFile(schemaPath).collect()

    // Add attribute index information to dimensions and measures for later use.
    val attributeIndices = schema.map(_.split(",")(0).trim).zipWithIndex.toMap
    dimensions = dimensions.map(d => Dimension(d.name, attributeIndices(d.name)))
    measures = measures.map(m => 
      if (m.aggregationOp == "count"){ 
        // Present count as a column called "count" in the output.
        m
      }
      else {

        // For non-count aggregations, the attribute index is necessary.
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

    // Return the cube to the client as nicely formatted JSON.
    cube.map( observation =>
      (
        dimensions.map(_.name).zip(observation._1) :::
        measures.map(_.name).zip(observation._2)
      ).toMap
    )
  }

  override def validate(sc:SparkContext, config: Config): SparkJobValidation = {
    Try(config.getObject("options"))
      .map(x => SparkJobValid)
      .getOrElse(SparkJobInvalid("No options provided."))
  }
}
