'use strict';
(function() {

  var events = new Rx.Subject();

  var MAPPED_ATTRIBUTES = {
    'model': bootstrapModel,
    'toggle-class': bootstrapToggleClass
  };

  function bootstrapModel(el, prop) {
    function update() {
      var event = {};
      events.next({
        name: prop,
        value: getInputValue(el)
      });
    }

    el.addEventListener('change', update);
    update();
  }

  function bootstrapToggleClass(el, value) {
    value.split(',').forEach(str => {
      var [className, prop] = str.split(':');
      watch(prop, function(on) {
        el.classList.toggle(className, on);
      });
    })
  }

  function getInputValue(el) {
    switch (el.nodeName) {
      case 'INPUT': return el.checked;
    }
  }

  function bootstrap() {
    var selector = Object.keys(MAPPED_ATTRIBUTES).map(attr => `[${attr}]`).join(',');
    var els = document.querySelectorAll(selector);
    for (var i = 0, el; el = els[i]; i++) {
      for (var j = 0, attr; attr = el.attributes[j]; j++) {
        var handler = MAPPED_ATTRIBUTES[attr.nodeName];
        if (handler) {
          handler(el, attr.nodeValue);
        }
      }
    }
  }

  function watch(name, fn) {
    events.filter(evt => evt.name === name).map(evt => evt.value).subscribe(fn);
  }

  window.Sally = {
    watch: watch
  }

  bootstrap();

})();
