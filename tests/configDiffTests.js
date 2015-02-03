// This file contains tests for the configDiff module.
// Created by Curran Kelleher Feb 2015

// Use the "expect" assert style.
// See http://chaijs.com/guide/styles/
var expect = require("chai").expect;

// Load RequireJS for use in unit tests.
// "var" omitted intentionally to induce a global variable,
// so the requireJSConfig file can run properly in "eval".
// See http://stackoverflow.com/questions/24522719/node-js-global-eval-throwing-referenceerror
requirejs = require("requirejs");

// Configure AMD module paths.
// Using eval like this seems to be the simplest way to 
// share module paths between the browser and unit tests.
eval(require("../requireJSConfig.js"));

var configDiff = requirejs("configDiff");
var Action = requirejs("action");

// Calls configDiff and converts the returned actions to strings,
// for clean looking tests.
function diff(oldConfig, newConfig){
  return configDiff(oldConfig, newConfig).map(Action.toString);
}

// A convenience function that writes part of the unit test,
// for use only while developing tests.
function writeTest(actions){
  actions.forEach(function (action) {
    console.log('expect(actions).to.contain("' + action + '");');
  });
  console.log('expect(actions.length).to.equal(' + actions.length + ');');
}

describe("configDiff", function () {
  it("should handle one added alias", function() {
    var actions = diff({}, {
      myFoo: {
        module: "foo",
        model: {
          x: 50,
          y: 40
        }
      }
    });
    
    expect(actions).to.contain("create(myFoo, foo)");
    expect(actions).to.contain("set(myFoo, x, 50)");
    expect(actions).to.contain("set(myFoo, y, 40)");
    expect(actions.length).to.equal(3);
  });
});
