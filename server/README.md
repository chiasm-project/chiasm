The server side of Chiasm is divided into two parts:

 * visEngine - This is a [Rails Engine](http://guides.rubyonrails.org/engines.html) that encapsulates the functionality of both the client-side data visualization features and the Spark-based data reduction service. Using this Engine, Chiasm can be integrated into any existing Rails application.
 * dataReductionService - This is an implementation of a data reduction service using [Apache Spark](http://spark.apache.org/).
