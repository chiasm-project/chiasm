package visEditor

import com.typesafe.config.{Config, ConfigFactory}
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
case class Dimension(name: String, i: Integer = 0)
case class Measure(aggregationOp: String, name: String = "", i: Integer = 0)

object DataReductionJob extends SparkJob {
  override def validate(sc:SparkContext, config: Config): SparkJobValidation = {
    Try(config.getString("options"))
      .map(x => SparkJobValid)
      .getOrElse(SparkJobInvalid("No options provided."))
  }
  override def runJob(sc:SparkContext, config: Config): Any = {
    val options = config.getString("options");
    //val dd = sc.parallelize(config.getString("input.string").split(" ").toSeq)
    //dd.map((_, 1)).reduceByKey(_ + _).collect().toMap
    options
  }
}
