// This program loads the configuration file called "visConfig.json".
// Created by Curran Kelleher Feb 2015
require(["d3", "runtime"], function (d3, Runtime) {
  var runtime = Runtime(document.getElementById("container"));
  d3.json("visConfig.json", function (err, config) {
    runtime.config = config;
  });
});
