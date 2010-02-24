
# arg-parse

A simple argument list parser that returns a settings object and can print a usage banner.

## Why?

Because optparse-js is too clever for my tastes.  This does a lot less, but it also does it *with* a lot less.

I really really wanted to be able to write a nice pretty self-documenting object in the code, and then have it all Just Work.  I found myself writing the same code over and over, and that's not ideal.

## How?

First, create your argument description object.  Let's say that your program looks like this:

    Usage: prog <foo> [--baz <val>] [--quux] [-q]

    var options = [ // array means that order matters, aka positional arguments
      { name : "foo",
        required : true
      },
      { optGroup : { // a group of order-independent options.
        "--baz" : { help : "Bazzer value" },
        "--quux" : { help : "Quuxify", flag : true },
        "-q" : "--quux"
      }}
    ];

Then, fire up the parser, and sick it on your `argv` list.
    
    // NB: This can potentially mutate the array, so be careful.
    var argsParsed = require("arg-parse").parseArgs(process.argv, "prog", options, __filename);
    
    // check it out!
    sys.debug(sys.inspect(argsParsed));

### More How...

An option is one of three things:

* A simple option (like `{name:"foo", required:true}`)
* An option list (the array in the example above)
* An option group (the guy with the optGroup up above)

The top-level should be either an option list or an option group, or else the `usage` won't work right.

Any option can have a name, and named options show up in the usage.  If you have an option group inside an option list, and it doesn't have a name, then its children look like first-class citizens within the option list for the purposes of the usage, but they'll be under a numeric index in the result object.

Beyond that, I'm not going to tell you too much.  The idea here is to support exploratory programming, because that's fun, and then when you grok how it works, you'll feel special.  Check out the tests folder to see it in action a bit more.  Write the object the way that you think it should look, and then look at what it does with that.  If you really want to flip to the end and see who did it, the answer key is only a couple hundred lines of JavaScript.

## Is this a port of [argparse](http://argparse.googlecode.com/svn/tags/r101/doc/index.html)?

No.  This is not related to anything other than my own needs.  It's just that "optparse" was [already taken](http://github.com/jfd/optparse-js/), and there's only so many things you can call an argument list parser.

## Help, it's broken!

That's wonderful!  Please either fix it, or don't, and [let me know](mailto:i@izs.me) either way.
