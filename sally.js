'use strict';
(function() {

  var INTERPOLATION_REG = /\{\{(\w+)\}\}/g;
  var CLASS_NAME_REG = /^class-/;

  var events = new Rx.Subject();

  var MAPPED_ATTRIBUTES = {
    'if': bootstrapIf,
    'model': bootstrapModel
  };

  function bootstrapIf(el, attr) {
    var [prop, match] = attr.split(':');
    watch(prop, function(val) {
      el.style.display = matchToggle(match, val) ? '' : 'none';
    });
    // TODO: use BehaviorSubject??
    set(name, null);
  }

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

  function bootstrapToggleClass(el, className, attr) {
    var [prop, match] = attr.split(':');
    watch(prop, function(val) {
      el.classList.toggle(className, matchToggle(match, val));
    });
  }

  function matchToggle(match, val) {
    return match ? match == val : !!val;
  }

  function getInputValue(el) {
    switch (el.nodeName) {
      case 'INPUT': return el.checked;
    }
  }

  function bootstrap() {
    setupFixedAttributes();
    setupClassAttributes();
    setupInterpolation();
  }

  function watch(name, fn) {
    getProperty(name).subscribe(fn);
  }

  function getProperty(name) {
    return events.filter(evt => evt.name === name).map(evt => evt.value);
  }

  function set(name, value) {
    events.next({
      name: name,
      value: value
    });
  }

  function forEachTextNode (fn) {
    var walker, node, nodes = [];
    walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null, false);
    while (node = walker.nextNode()) {
      fn(node);
    }
  };

  function forEachElementMatchAttribute(selector, matcher, fn) {
    var els = document.querySelectorAll(selector);
    for (var i = 0, el; el = els[i]; i++) {
      for (var j = 0, attr, name; attr = el.attributes[j]; j++) {
        name = attr.nodeName;
        if (matcher(name)) {
          fn(name, attr.nodeValue, el);
        }
      }
    }
  }

  function setupFixedAttributes() {
    var selector = Object.keys(MAPPED_ATTRIBUTES).map(attr => `[${attr}]`).join(',');
    forEachElementMatchAttribute(selector, hasMappedAttribute, function(name, value, el) {
      MAPPED_ATTRIBUTES[name](el, value);
    });
  }

  function hasMappedAttribute(name) {
    return MAPPED_ATTRIBUTES[name];
  }

  function hasClassAttribute(name) {
    return CLASS_NAME_REG.test(name);
  }

  function setupClassAttributes() {
    forEachElementMatchAttribute('*', hasClassAttribute, function(name, value, el) {
      var className = name.replace(CLASS_NAME_REG, '');
      bootstrapToggleClass(el, className, value);
    });
  }

  function setupInterpolation() {
    forEachTextNode(function(node) {
      var match = node.textContent.match(INTERPOLATION_REG);
      if (match) {
        watchTextNode(node);
      }
    });
  }

  function watchTextNode(node) {
    var names = [], template = node.textContent, combined;
    template.replace(INTERPOLATION_REG, function(all, name) {
      names.push(name);
    });
    combined = Rx.Observable.combineLatest(names.map(function(name) {
      return getProperty(name);
    }));
    combined.subscribe(function(values) {
      var i = 0;
      node.textContent = template.replace(INTERPOLATION_REG, function() {
        return values[i++] || '';
      });
    });
    names.forEach(function(name) {
      set(name, null);
    });
  }

  window.Sally = {
    watch: watch,
    set: set
  }

  bootstrap();

})();
