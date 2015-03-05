
lazy val root = (project in file(".")).
  settings(
    name := "hello",
    version := "1.0",
    scalaVersion := "2.10.4",
    resolvers += "Job Server Bintray" at "https://dl.bintray.com/spark-jobserver/maven",
    libraryDependencies ++= Seq(
      "spark.jobserver" % "job-server-api" % "0.5.0" % "provided",
      "org.apache.spark" %% "spark-core" % "1.2.0" % "provided"
    )
  )
