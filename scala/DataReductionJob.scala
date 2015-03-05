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

// Define types for JSON options passed in from the client.
case class Options( dataset: String, cube: Cube )
case class Cube(dimensions: List[Dimension], measures: List[Measure])
case class Dimension(name: String)
case class Measure(aggregationOp: String)

object DataReductionJob extends SparkJob {

  // This is necessary for JSON parsing into case classes.
  // See https://github.com/json4s/json4s#extracting-values
  implicit val formats = DefaultFormats

  override def validate(sc:SparkContext, config: Config): SparkJobValidation = {
    SparkJobValid
  //  Try(config.getString("options"))
  //    .map(x => SparkJobValid)
  //    .getOrElse(SparkJobInvalid("No options provided."))
  }
  override def runJob(sc:SparkContext, config: Config): Any = {

    // Extract the config options as JSON. See also
    // http://typesafehub.github.io/config/latest/api/com/typesafe/config/Config.html
    // http://stackoverflow.com/questions/15821961/serializing-typesafe-config-objects
    val optionsJSON = config.getObject("options").render(ConfigRenderOptions.concise())
    
    val options = parse(optionsJSON).extract[Options]

    val data = sc.textFile(options.dataset)
    data.first()
  }
}
