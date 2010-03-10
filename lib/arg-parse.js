
var sys = require("sys");

// sys.debug("in arg-parser");

exports.tabStop = 24;
exports.parseArgs = parseArgs;
exports.parseOpt = parseOpt;
exports.parseOptGroup = parseOptGroup;
exports.parseOptList = parseOptList;
exports.usage = usage;

// sys.debug("exports set, returning");

return;

// just the option parsers down there.
// returns: [remaining, data]
function parseOptGroup (argv, opts, data) {
  data = data || {};
  
  // make sure they're all named.
  for (var o in opts) {
    var opt = opts[o];
    if (typeof(opt) === "object" && opt && !opt.name) opt.name = o;
  }
  
  // not caching length on purpose.
  while (argv.length > 0) {
    multiFlag(argv);
    var arg = argv[0];
    
    // p("parseOptGroup: "+arg);
    
    var opt = opts[arg];
    if (typeof(opt) === "string") opt = opts[opt];
    if (!opt) return argv;
    
    if (opt.type !== "flag") opt._prefix = arg;
    
    // If it eats something, then it'll be a different array
    var old = argv;
    argv = parseOpt(argv, opt, data);
    delete opt._prefix;
    if (argv === old) {
      // p("in parseOptGroup, argv didn't change: "+argv);
      return argv;
    }
  }
  // p("in parseOptGroup, done");
  return [];
}

function parseOptList (argv, opts, data) {
  var o = 0,
    ol = opts.length,
    opt, arg, parsing, awaitingValue, groupData, value, name;
  data = data || {};
  
  if (!Array.isArray(opts)) return parseOpt(argv, opts, data);
  
  for (var o = 0, ol = opts.length; o < ol && argv.length; o ++) {
    // parse a collection of flags and whatnot, until it doesn't match,
    // then advance to the next opt
    opt = opts[o];
    // make sure it has a name, so that data will be mutated.
    // groups fall up to the parent, but scalars need an index.
    if (!opt.name && !opt.optGroup) opt.name = o;
    argv = parseOpt(multiFlag(argv), opt, data);
  }
  return argv;
}

// returns [argv, data for this opt || null]
// note that, if provided with a data obj,
// and has a name, it'll also mutate the data obj.
function parseOpt (argv, opt, data) {
  
  if (!argv.length) return [];
  
  // we're only interested in the next 1 or 2 args.
  if (opt && opt._prefix && argv[0] !== opt._prefix) {
    return argv;
  }
  var value = opt._prefix ? argv[1] : argv[0];
  
  if (opt.name) data = data || {};
  else data = data || null;
  
  // support multiple flags like rsync -vazu or -vvv for triple-verbose
  argv = multiFlag(argv);
  
  // p("parseOpt "+argv+ " "+JSON.stringify(opt));
  // figure out what kind of argument this opt refers to.
  if ( Array.isArray(opt) || (opt && opt.list) ) {
    if (opt.name) data = data[opt.name] = data[opt.name] || {};
    return parseOptList(argv, opt.list || opt, data);
  } else if ( opt.optGroup ) {
    if (opt.name) data = data[opt.name] = data[opt.name] || {};
    return parseOptGroup(argv, opt.optGroup, data);
  } else if ( opt.type === "argv" ) {
    // swallow the rest of the argv
    // todo: take a restricted number of args, like 2 things or something
    if (opt.name) {
      if (Array.isArray(data[opt.name])) data[opt.name].concat(argv);
      else if (data[opt.name]) data[opt.name] = [data[opt.name]].concat(argv);
      else {
        if (argv[argv.length - 1] === "") argv.pop();
        data[opt.name] = argv;
      }
    }
    else data = argv;
    return [];
  } else if (Array.isArray(opt.options)) {
    // make sure it's one of the options
    if (opt.options.indexOf(value) === -1) {
      if (opt.required) throw new Error(
        "Required option not specified: "+opt.name);
      return argv;
    }
    if (opt.name) data[opt.name] = value;
    return argv.slice( opt._prefix ? 2 : 1 );
  } else if (typeof(opt.match) === "function" && opt.match(value)) {
    if (opt.name) data[opt.name] = value;
    return argv.slice( opt._prefix ? 2 : 1 );
  } else if ( opt.flag ) {
    if (opt.name) value = data[ opt.name ] = (data[ opt.name ] || 0) + 1;
    else value = 0;
    return argv.slice(1);
  } else {
    // no restrictions, just a simple --key val thing
    if (opt.name) data[opt.name] = value;
    return argv.slice( opt._prefix ? 2 : 1 );
  }
  return argv;
}

function multiFlag (argv) {
  if (argv[0].charAt(0) === "-" && argv[0].charAt(1) !== "-" && argv[0].length > 2) {
    argv.splice.apply(argv,
      [0, 1].concat(("-" + argv[0].slice(1).split("").join(" -")).split(" ")));
    // p("spliced argv into: "+argv);
    return argv.slice(0);
  }
  return argv;
}


function parseArgs (argv, cmd, options, __filename, doUsage) {
  // sys.debug("parseArgs");
  var arg;
  if (__filename === undefined) __filename = argv[1];
  while (__filename && __filename !== (arg = argv.shift()) && arg);
  argv.push("");
  var data = {};
  try {
    var remaining = parseOpt(argv, options, data);
  } catch (ex) {
    if (doUsage === false) return;
    sys.error(ex.message);
    return usage(cmd, options);
    // throw (ex);
  }
  remaining.pop();
  argv = remaining;
  if (!argv || argv.length) {
    if (doUsage === false) return;
    return usage(cmd, options);
  }
  return data;
}

function usage (cmd, options, b, level) {
  // just walk through the first layer for the banner
  // sys.debug("usage");
  var print = !b;
  level = level || "";
  // p("level: "+sys.inspect(level))
  b = b || {
    b : "\nUsage:\n  "+cmd+" ",
    h : "\n\n"
  };
  var h = b.h;
  b = b.b;
  
  for (var o in options) {
    var opt = options[o];
    // p(o+ " "+JSON.stringify(opt));
    if (isNaN(o) && typeof opt === "string") {
      opt = { name : o, help : opt+" (alias)", alias:true }
    }
    if (opt.options && !opt.help) opt.help = "One of: "+JSON.stringify(opt.options);
    var complex = opt.optGroup || Array.isArray(opt) || (opt && Array.isArray(opt.list));
    if (opt.name || opt.title) {
      var name = opt.title || opt.name;
      if (isNaN(o) && !complex && !opt.flag && !opt.alias) name += " <val>";
      if (!level) b += (opt.required ? "<%>" : "[%]").replace(/%/, name) + " ";
      h += pad(level + name, exports.tabStop) + (opt.help || "") + "\n";
    }
    if (complex) {
      var levelAdd = (opt.name || opt.title);
      if (opt.list) opt = opt.list;
      if (opt.optGroup) opt = opt.optGroup;
      var subs = usage(cmd, opt, {b:b,h:h},
        level + (levelAdd ? " " : ""));
      h = subs.h;
      b = subs.b;
    }
  }
  
  if (print) p(b + h);
  else return {b:b,h:h};
}

function p (m) { sys.error(m); return p }
function pad (s, n) {
  if (s.length >= n-2) {
    s += "\n";
    while (n --> 0) s += " ";
    return s;
  }
  n -= s.length;
  while (n --> 0) s += " ";
  return s;
}
