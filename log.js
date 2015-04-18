/* log.js
 * Overwritten logging functions for ShareWhere.
 * Now with more colors!
 */

var colors = require("colors.js/safe")

module.exports = {
  error: function() {
    var args = [];
    for(var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    args[0] = colors.red.bold("[ERROR] " + args[0])

    console.log.apply(this, args);
  },
  info: function() {
    var args = [];
    for(var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    args[0] = colors.white("[info] " + args[0])

    console.log.apply(this, args);
  },
  endpoint: function(ip, verb, endpoint) {
    console.log(colors.white.bold("[route %s] %s %s"), ip, verb, endpoint);
  },
  notice: function() {
    var args = [];
    for(var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    args[0] = colors.yellow.bold("[notice] " + args[0])

    console.log.apply(this, args);
  },
  fail: function() {
    var args = [];
    for(var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    args[0] = colors.red(args[0])

    console.log.apply(this, args);
  },
  success: function() {
    var args = [];
    for(var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    args[0] = colors.green(args[0])

    console.log.apply(this, args);
  },
  debug: function() {
    var args = [];
    for(var i = 0; i < arguments.length; i++) {
        args.push(arguments[i]);
    }

    args[0] = colors.yellow("[debug] " + args[0])

    console.log.apply(this, args);
  },
}
