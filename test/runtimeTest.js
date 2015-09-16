// This file contains tests for the top level Chiasm module.
//
// Draws from previous work found at
// https://github.com/curran/reactivis/blob/gh-pages/tests/reactivisTest.js
// https://github.com/curran/overseer/blob/master/tests/overseerTests.js
//
// Created by Curran Kelleher Feb 2015

// Use the "expect" assert style.
// See http://chaijs.com/guide/styles/
var expect = require("chai").expect,
    Chiasm = require("../src/index"),
    Model = require("model-js");

// The simplest possible plugin just returns a model (using model.js).
function SimplestPlugin(){
  return Model();
}

// Defining "publicProperties" allows changes to be propagated from
// components (instances of the plugin) to the configuration.
function SimplePlugin(){
  return Model({
    publicProperties: ["message"],
    message: Model.None
  });
}

function PointPlugin(){
  return Model({
    publicProperties: ["x", "y"],
    x: 0,
    y: 0
  });
}

// This plugin is invalid because no default property values are provided.
// Default values must be explicit, because the runtime engine must know
// what values to use when the property is "unset" - when the property is
// removed from the component state configuration.
function InvalidPlugin(){
  return Model({
    publicProperties: ["message"]
  });
}

// Demonstrates having default values for public properties.
function SimplePluginWithDefaults(){
  return Model({
    publicProperties: ["x", "y"],
    x: 5,
    y: 10
  });
}

describe("chiasm runtime", function () {

  it("create a component via setConfig(config)", function(done) {

    var chiasm = Chiasm();

    chiasm.plugins.simplestPlugin = SimplestPlugin;
    
    chiasm.setConfig({
      foo: {
        plugin: "simplestPlugin"
      }
    });

    chiasm.getComponent("foo").then(function(foo){
      expect(foo).to.exist;
      done();
    });
  });

  it("the promise returned by setConfig(config) should resolve", function(done) {
    var chiasm = Chiasm();

    chiasm.plugins.simplestPlugin = SimplestPlugin;
    
    // setConfig returns a promise that is resolved after the
    // configuration has been fully loaded.
    var promise = chiasm.setConfig({
      foo: {
        plugin: "simplestPlugin"
      }
    });
    
    promise.then(function(){
      chiasm.getComponent("foo").then(function(foo){
        expect(foo).to.exist;
        done();
      });
    });
  });

  //it("create a component via chiasm.config = config", function(done) {
  //  var chiasm = Chiasm();

  //  chiasm.plugins.simplestPlugin = SimplestPlugin;
  //  
  //  chiasm.config = {
  //    foo: {
  //      plugin: "simplestPlugin"
  //    }
  //  };

  //  chiasm.getComponent("foo").then(function(foo){
  //    expect(foo).to.exist;
  //    done();
  //  });
  //});

  it("report error when attempting to set a property without a default value", function(done) {
    var chiasm = Chiasm();
    chiasm.plugins.simplestPlugin = SimplestPlugin;
    
    chiasm.setConfig({
      foo: {
        plugin: "simplestPlugin",
        state: {
          message: "Hello"
        }
      }
    }).catch(function(err){
      expect(err.message).to.equal("Default value for public property 'message' " +
                                   "not specified for component with alias 'foo'.");
      done();
    });
  });

  it("create a component, set state with a single property", function(done) {
    var chiasm = Chiasm();
    chiasm.plugins.simplePlugin = SimplePlugin;
    
    chiasm.setConfig({
      foo: {
        plugin: "simplePlugin",
        state: {
          message: "Hello"
        }
      }
    });

    chiasm.getComponent("foo").then(function(foo){
      expect(foo).to.exist;
      foo.when("message", function(message){
        expect(message).to.equal("Hello");
        done();
      });
    });
  });

  it("create a component, set state with two properties", function(done) {
    var chiasm = Chiasm();
    chiasm.plugins.pointPlugin = PointPlugin;
    
    chiasm.setConfig({
      foo: {
        plugin: "pointPlugin",
        state: {
          x: 5,
          y: 10
        }
      }
    });

    chiasm.getComponent("foo").then(function(foo){
      expect(foo).to.exist;
      foo.when(["x", "y"], function(x, y){
        expect(x).to.equal(5);
        expect(y).to.equal(10);
        done();
      });
    });
  });

  it("propagate changes from config to components", function(done) {
    var chiasm = Chiasm();
    chiasm.plugins.pointPlugin = PointPlugin;
    
    chiasm.setConfig({
      foo: {
        plugin: "pointPlugin",
        state: {
          x: 5
        }
      }
    });

    chiasm.getComponent("foo").then(function(foo){
      foo.when(["x"], function(x){
        expect(x).to.equal(5);
        chiasm.setConfig({
          foo: {
            plugin: "pointPlugin",
            state: {
              x: 5,
              y: 10
            }
          }
        });
        foo.when(["y"], function(y){
          expect(y).to.equal(10);
          done();
        });
      });
    });
  });

  it("propagate changes from components to config (using 'publicProperties')", function(done) {
    var chiasm = Chiasm();
    chiasm.plugins.simplePlugin = SimplePlugin;
    
    chiasm.setConfig({
      foo: {
        plugin: "simplePlugin",
        state: {
          message: "Hello"
        }
      }
    });

    chiasm.getComponent("foo").then(function(foo){
      chiasm.when("config", function(config) {
        if(foo.message === "Hello"){
          foo.message = "World";
        } else {
          expect(config.foo.state.message).to.equal("World");
          done();
        }
      });
    });
  });

  it("do not propagate from component to config after component destroyed", function(done) {
    var chiasm = Chiasm();
    chiasm.plugins.simplePlugin = SimplePlugin;
    
    chiasm.setConfig({
      foo: {
        plugin: "simplePlugin",
        state: {
          message: "Hello"
        }
      }
    });

    chiasm.getComponent("foo").then(function(foo){
      chiasm.when("config", function(config){
        if("foo" in config){
          expect(config.foo.state.message).to.equal("Hello");
          chiasm.config = {};
        } else {
          foo.message = "World";
          setTimeout(done, 0);
        }
      });
    });
  });

  it("propagate from component to config when config state is undefined", function(done) {
    // This tests that the "state" property is automatically created in the config
    // before it is populated with the updated state property
    // when propagating changes from components to the config.
    var chiasm = Chiasm();
    chiasm.plugins.simplePlugin = SimplePlugin;
    
    chiasm.config = {
      foo: {
        plugin: "simplePlugin"
      }
    };

    chiasm.getComponent("foo").then(function(foo){
      foo.message = "Hello";

      setTimeout(function(){
        expect(chiasm.config.foo.state.message).to.equal("Hello");
        done();
      }, 0);
    });
  });

  it("should not propagate from component to config for defaults", function(done) {
    var chiasm = Chiasm();

    chiasm.plugins.simplePluginWithDefaults = SimplePluginWithDefaults;
    
    chiasm.config = {
      foo: {
        plugin: "simplePluginWithDefaults"
      }
    };

    var invocations = 0;
    chiasm.when("config", function(config){
      invocations++;
      expect(invocations).to.equal(1);
      setTimeout(done, 10);
    });
  });

  it("should unset a property, restoring default value", function(done) {
    var chiasm = Chiasm();
    chiasm.plugins.simplePluginWithDefaults = SimplePluginWithDefaults;
    
    chiasm.config = {
      foo: {
        plugin: "simplePluginWithDefaults",
        state: {
          x: 50
        }
      }
    };

    chiasm.getComponent("foo").then(function(foo){
      expect(foo).to.exist;
      foo.when("x", function(x){
        if(x === 50){
          chiasm.config = {
            foo: {
              plugin: "simplePluginWithDefaults",
              state: { }
            }
          };
        } else {
          expect(x).to.equal(5);
          done();
        }
      });
    });
  });

  it("should unset a property, setting None if default is None", function(done) {
    var chiasm = Chiasm();
    chiasm.plugins.simplePlugin = SimplePlugin;
    
    chiasm.setConfig({
      foo: {
        plugin: "simplePlugin",
        state: {
          message: "Hello"
        }
      }
    }).then(function (){
      chiasm.getComponent("foo").then(function(foo){
        expect(foo).to.exist;
        expect(foo.message).to.equal("Hello");
        chiasm.setConfig({
          foo: {
            plugin: "simplePlugin",
            state: { }
          }
        }).then(function(){
          expect(foo.message).to.equal(Model.None);
          done();
        });
      });
    });
  });

  it("should throw an error when no public property default is provided", function(done) {
    var chiasm = Chiasm();
    chiasm.plugins.invalidPlugin = InvalidPlugin;

    chiasm.setConfig({
      foo: {
        plugin: "invalidPlugin",
        state: { }
      }
    }).catch(function(err){
      expect(err.message).to.equal("Default value for public property 'message' not specified for component with alias 'foo'.");
      done();
    });
  });

  it("should change a plugin", function(done) {
    var chiasm = Chiasm();
    chiasm.plugins.pluginA = function(){
      return Model({
        pluginName: "A"
      });
    };

    chiasm.plugins.pluginB = function(){
      return Model({
        pluginName: "B"
      });
    };
    
    chiasm.config = {
      foo: {
        plugin: "pluginA"
      }
    };

    chiasm.getComponent("foo").then(function(foo){
      expect(foo.pluginName).to.equal("A");
      chiasm.setConfig({
        foo: {
          plugin: "pluginB"
        }
      }).then(function(){
        chiasm.getComponent("foo").then(function(foo){
          expect(foo.pluginName).to.equal("B");
          done();
        });
      });
    });
  });

  it("should change a plugin and transfer properties", function(done) {
    var chiasm = Chiasm();

    var config1 = {
      chart: {
        plugin: "barChart",
        state: { markColumn: "browser", sizeColumn: "popularity" }
      }
    };

    var config2 = {
      chart: {
        plugin: "pieChart",
        state: { markColumn: "browser", sizeColumn: "popularity" }
      }
    };

    chiasm.plugins.barChart = function(){
      return Model({
        pluginName: "barChart",
        publicProperties: ["markColumn", "sizeColumn"],
        markColumn: Model.None,
        sizeColumn: Model.None
      });
    };

    chiasm.plugins.pieChart = function(){
      return Model({
        pluginName: "pieChart",
        publicProperties: ["markColumn", "sizeColumn"],
        markColumn: Model.None,
        sizeColumn: Model.None
      });
    };

    chiasm.config = config1;
    
    chiasm.getComponent("chart").then(function(chart1){

      expect(chart1.pluginName).to.equal("barChart");
      expect(chart1.markColumn).to.equal("browser");
      expect(chart1.sizeColumn).to.equal("popularity");

      chiasm.setConfig(config2).then(function(){
        chiasm.getComponent("chart").then(function(chart2){
          expect(chart2.pluginName).to.equal("pieChart");
          expect(chart2.markColumn).to.equal("browser");
          expect(chart2.sizeColumn).to.equal("popularity");
          done();
        });
      });
    });
  });

  it("should report an error when timeout exceeded in getComponent", function(done) {
    var chiasm = Chiasm();

    // Set the timeout to 100ms so this test passes quickly.
    chiasm.timeout = 100;
    
    chiasm.getComponent("chart").catch(function(err){
      expect(err).to.exist;
      expect(err.message).to.equal("Component with alias 'chart' does not exist after timeout of 0.1 seconds exceeded.");
      done();
    });
  });

  it("should report an error for a missing plugin", function(done) {
    var chiasm = Chiasm();

    chiasm.setConfig({
      "foo": {
        "plugin": "bar"
      }
    }).catch(function(err){
      expect(err.message).to.equal("Plugin 'bar' has not defined in chiasm.plugins.");
      done();
    });
  });
});
