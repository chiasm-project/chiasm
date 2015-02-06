// This program loads the configuration file called "visConfig.json".
require(["d3", "runtime"], function (d3, Runtime) {
  var runtime = Runtime(document.getElementById("container"));
  d3.json("visConfig.json", function (err, config) {
    if(err) {
      throw err;
    }
    console.log(config);
    runtime.config = config;
  });
});
