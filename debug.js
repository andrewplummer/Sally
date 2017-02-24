(function() {

  var consoleInfo = console.info;
  var consoleLast;
  var consoleCount = 0;

  console.info = function(arg) {
    if (arg && arg === consoleLast) {
      consoleCount++;
    } else {
      consoleLast = null;
      consoleCount = 0;
    }
    if (consoleCount > 100) {
      throw new Error('Infinite loop');
    }
    consoleLast = arg;
    consoleInfo.apply(this, arguments);
  }

})();
