// This file contains tests for the configDiff module.
// Created by Curran Kelleher Feb 2015

// Use the "expect" assert style.
// See http://chaijs.com/guide/styles/
var expect = require("chai").expect,
    Chiasm = require("../src/index"),
    configDiff = Chiasm.configDiff,
    Action = Chiasm.Action;

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

  it("one added alias", function() {
    var actions = diff({}, {
      myFoo: {
        plugin: "foo"
      }
    });
    expect(actions).to.contain("create(myFoo, foo)");
    expect(actions.length).to.equal(1);
  });

  it("one added alias with two properties", function() {
    var actions = diff({}, {
      myFoo: {
        plugin: "foo",
        state: {
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

  it("one added property", function() {
    var actions = diff({
      myFoo: {
        plugin: "foo",
        state: {
          y: 40
        }
      }
    }, {
      myFoo: {
        plugin: "foo",
        state: {
          x: 50,
          y: 40
        }
      }
    });
    expect(actions).to.contain("set(myFoo, x, 50)");
    expect(actions.length).to.equal(1);
  });

  it("two added properties", function() {
    var actions = diff({
      myFoo: {
        plugin: "foo",
        state: {
          y: 40
        }
      }
    }, {
      myFoo: {
        plugin: "foo",
        state: {
          x: 50,
          y: 40,
          z: 70
        }
      }
    });
    expect(actions).to.contain("set(myFoo, x, 50)");
    expect(actions).to.contain("set(myFoo, z, 70)");
    expect(actions.length).to.equal(2);
  });

  it("one removed property", function() {
    var actions = diff({
      myFoo: {
        plugin: "foo",
        state: {
          x: 50,
          y: 40
        }
      }
    }, {
      myFoo: {
        plugin: "foo",
        state: {
          y: 40
        }
      }
    });
    expect(actions).to.contain("unset(myFoo, x)");
    expect(actions.length).to.equal(1);
  });

  it("two removed properties", function() {
    var actions = diff({
      myFoo: {
        plugin: "foo",
        state: {
          x: 50,
          y: 40
        }
      }
    }, {
      myFoo: {
        plugin: "foo",
        state: {
        }
      }
    });
    expect(actions).to.contain("unset(myFoo, x)");
    expect(actions).to.contain("unset(myFoo, y)");
    expect(actions.length).to.equal(2);
  });

  it("one updated property", function() {
    var actions = diff({
      myFoo: {
        plugin: "foo",
        state: {
          x: 50,
          y: 40
        }
      }
    }, {
      myFoo: {
        plugin: "foo",
        state: {
          x: 60,
          y: 40
        }
      }
    });
    expect(actions).to.contain("set(myFoo, x, 60)");
    expect(actions.length).to.equal(1);
  });

  it("two updated properties", function() {
    var actions = diff({
      myFoo: {
        plugin: "foo",
        state: {
          x: 50,
          y: 40
        }
      }
    }, {
      myFoo: {
        plugin: "foo",
        state: {
          x: 60,
          y: 50
        }
      }
    });
    expect(actions).to.contain("set(myFoo, x, 60)");
    expect(actions).to.contain("set(myFoo, y, 50)");
    expect(actions.length).to.equal(2);
  });

  it("one removed alias", function() {
    var actions = diff({
      myFoo: {
        plugin: "foo",
        state: {
          x: 50,
          y: 40
        }
      }
    }, {});
    expect(actions).to.contain("destroy(myFoo)");
    expect(actions.length).to.equal(1);
  });

  it("no change with missing state", function() {
    var actions = diff({
      myfoo: {
        plugin: "foo"
      }
    }, {
      myfoo: {
        plugin: "foo"
      }
    });
    expect(actions.length).to.equal(0);
  });

  it("changed plugin", function() {
    var actions = diff({
      thing: {
        plugin: "foo",
        state: {
          x: 50,
          y: 40
        }
      }
    }, {
      thing: {
        plugin: "bar",
        state: {
          x: 50,
          y: 40
        }
      }
    });

    expect(actions).to.contain("destroy(thing)");
    expect(actions).to.contain("create(thing, bar)");
    expect(actions).to.contain("set(thing, x, 50)");
    expect(actions).to.contain("set(thing, y, 40)");
    expect(actions.length).to.equal(4);
  });
});
