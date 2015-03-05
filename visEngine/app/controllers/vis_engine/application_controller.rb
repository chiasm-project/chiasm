require 'net/http'
module VisEngine
  class ApplicationController < ActionController::Base
    def reduce_data

      #options = params[:options] 


      # This connects to a local Spark-Jobserver to run the
      # data reduction service. See
      # https://github.com/spark-jobserver/spark-jobserver
      uri = URI('http://localhost:8090/jobs')
      params = {
        'appName' => 'test',
        'classPath' => 'spark.jobserver.WordCountExample',
        'sync' => 'true'
      }
      uri.query = URI.encode_www_form(params)
      req = Net::HTTP::Post.new(uri)
      req.body = "input.string = a b c a b see"
      res = Net::HTTP.start(uri.host, uri.port) {|http|
        http.request(req)
      }

      render body: res.body #, content_type: "text/html"
    end
  end
end
