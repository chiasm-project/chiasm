// This program loads the configuration file called "visConfig.json".
require(["d3", "chiasm", "./dropdown"], function (d3, Chiasm, Dropdown) {

  // Instantiate the Chiasm chiasm environment.
  var chiasm = Chiasm(document.getElementById("container"));

  // Set up the dropdown menu to load different configurations.
  var dropdown = Dropdown(document.getElementById("dropdown"));

  // Set up the dropdown with the list of configuration files.
  dropdown.data = [
    { name: "configBarChart", label: "Bar Chart" },
    { name: "configLineChart", label: "Line Chart" },
    { name: "configBarLineEditor", label: "Bar Chart and Line Chart With Editor" },
    { name: "configBarLineEditor2", label: "Bar Chart and Line Chart With Editor 2" },
    { name: "configBarLineEditor3", label: "Bar Chart and Line Chart With Editor 3" },
    { name: "configScatterPlot", label: "Scatter Plot" },
    { name: "configScatterPlot2", label: "Scatter Plot 2" },
    { name: "configScatterPlot3", label: "Scatter Plot 3" },
    { name: "configScatterPlot4", label: "Scatter Plot 4" },
    { name: "configScatterPlot5", label: "Scatter Plot 5" },
    { name: "configScatterPlot6", label: "Scatter Plot 6" },
    { name: "configScatterPlot7", label: "Scatter Plot 7" },
    { name: "configScatterPlot8", label: "Scatter Plot 8" }
  ];

  // Cache configurations so they are not loaded more than once.
  var getConfig = (function (){
    var cache = {};
    return function(configName, callback){
      if(configName in cache){
        callback(cache[configName]);
      } else {
        d3.json(configName + ".json", function (err, config) {
          callback(cache[configName] = config);
        });
      }
    };
  }());

  // When the user selects a configuration, load it.
  dropdown.when("selectedValue", function(configName){
    getConfig(configName, function(config){
      chiasm.config = config;
    });
  });

  // Initialize the selected value.
  dropdown.selectedValue = dropdown.data[0].name;

  // Scroll through all available configurations when any key is pressed.
  var i = 0;

  function nextConfig(){
    i = (i + 1) % dropdown.data.length;
    dropdown.selectedValue = dropdown.data[i].name;
  }

  function prevConfig(){
    i = (i - 1 + dropdown.data.length) % dropdown.data.length;
    dropdown.selectedValue = dropdown.data[i].name;
  }

  var interval = setInterval(nextConfig, 2000);
  document.addEventListener("keydown", function(e){

    // Use right arrow key to scroll through configs.
    var RIGHT_ARROW = 39;
    var LEFT_ARROW = 37;
    if(e.keyCode === RIGHT_ARROW){
      nextConfig();
    } else if(e.keyCode === LEFT_ARROW){
      prevConfig();
    }

    // When any key is pressed, stop automated scrolling through configs.
    clearInterval(interval);
  });
});
