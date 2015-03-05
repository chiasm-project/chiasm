package visEditor

import com.typesafe.config.{Config, ConfigFactory}
import org.apache.spark._
import org.apache.spark.SparkContext._
import scala.util.Try
import spark.jobserver._

object SampleJob  extends SparkJob {
  override def validate(sc:SparkContext, config: Config): SparkJobValidation = {
    Try(config.getString("input.string"))
      .map(x => SparkJobValid)
      .getOrElse(SparkJobInvalid("No input.string config param"))
  }
  override def runJob(sc:SparkContext, config: Config): Any = {
    val dd = sc.parallelize(config.getString("input.string").split(" ").toSeq)
    dd.map((_, 1)).reduceByKey(_ + _).collect().toMap
  }
}
