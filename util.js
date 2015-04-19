var colors = require("colors/safe")

var shareWhereLogo =
"  ___ _               __      ___                \n" +
" / __| |_  __ _ _ _ __\\ \\    / / |_  ___ _ _ ___ \n" +
" \\__ \\ ' \\/ _` | '_/ -_) \\/\\/ /| ' \\/ -_) '_/ -_)\n" +
" |___/_||_\\__,_|_| \\___|\\_/\\_/ |_||_\\___|_| \\___|";


module.exports = {
  printLogo: function() {
    console.log(colors.cyan.bold(shareWhereLogo))
    console.log(colors.yellow("      Written for COP 4331C at UCF during Spr2015"));
    console.log();
  },
  getSuitablePort: function() {
    var port = 80; // default on Windows

    // on POSIX systems, fall back to another port
    if(process.getuid && process.getuid != 0)
      port = 8000;

    return port;
  },
  isEmptyObject: function(obj) {
    return !Object.keys(obj).length;
  }
}
