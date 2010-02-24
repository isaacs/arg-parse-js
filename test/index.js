
var sys = require("sys"),
  assert = require("assert"),
  path = require("path"),
  fs = require("fs");

if (module.id === ".") {
  var running = true,
    failures = 0;
  function fail (file, next, er) {
    sys.error("Failed: "+file);
    sys.error(er.message);
    failures ++;
    next();
  }
  
  fs.readdir(__dirname, function (error, files) {(function T (f) {
    var file = files[f];
    if (!file) {
      if (!failures) return sys.puts("ok");
      else return sys.error(failures + " failure" + (failures > 1 ? "s" : ""));
    }
    function next () { T(f + 1) };
    if (path.join(__dirname, file) === __filename)
      return process.nextTick(next);
    // run this test.
    if (/\.js$/.exec(file)) {
      require.async(__dirname + "/"+file.replace(/\.js$/, ''), function (er) {
        return (er) ? fail(file, next, er) : next()
      });
    }
  })(0)});
}