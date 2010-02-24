var options = [
    { name : "global",
      title : "global options",
      optGroup : {
        "-r" : "--registry",
        "-h" : "--help",
        "-p" : "--package",
        "--registry" : {
          "help" : "Set the registry base URL."
        },
        "--help" : {
          "flag" : true,
          "help" : "Show help"
        },
        "--package" : {
          "help" : "Package json file."
        }
      }
    },
    { name : "command",
      required : true,
      options : [ "help", "push" ]
    },
    { name : "commandOptions",
      title : "command options",
      type : "argv",
      help : "Run help <command> to see the options for each command"
    }
  ],
  expect = {
    "" : undefined, // missing required arg
    "-r reg -hhh --package foo push foo bar baz" : {
      "global" : {
        "--registry" : "reg",
        "--help" : 3,
        "--package" : "foo"
      },
      "command" : "push",
      "commandOptions" : ["foo", "bar", "baz"]
    }
  },
  parseArgs = require("../lib/arg-parse").parseArgs,
  assert = require("assert"),
  sys = require("sys");

for (var e in expect) {
  var actual = parseArgs(e.split(/\s+/), "test", options, "", false);
  assert.deepEqual(expect[e], actual);
}

