
function Clock(selector) {
  this.el = document.querySelector(selector);
  this.startTime = new Date();

  this.createTicks();

  this.tick = this.tick.bind(this);
  this.handlers = [];
}

Clock.prototype.activate = function() {
  this.active = true;
  this.tick();
};

Clock.prototype.deactivate = function() {
  clearTimeout(this.timer);
  this.active = false;
};

Clock.prototype.onTick = function(handler) {
  this.handlers.push(handler);
};

Clock.prototype.tick = function() {
  this.time = new Date();
  this.handlers.forEach(function(handler) {
    handler(this.time);
  }, this);
  if (this.active) {
    this.timer = setTimeout(this.tick, 1000);
  }
};

// --- Time Values ---

Clock.prototype.getHours = function(pad) {
  return this.getTimeComponent('hours', pad);
};

Clock.prototype.getMinutes = function(pad) {
  return this.getTimeComponent('minutes', pad);
};

Clock.prototype.getSeconds = function(pad) {
  return this.getTimeComponent('seconds', pad);
};

Clock.prototype.getAmpm = function() {
  return this.time.getHours() < 12 ? 'am' : 'pm';
};

Clock.prototype.getAdvancedHours = function() {
  return this.getAdvancedTimeComponent('hours');
};

Clock.prototype.getAdvancedMinutes = function() {
  return this.getAdvancedTimeComponent('minutes');
};

Clock.prototype.getAdvancedSeconds = function() {
  return this.getAdvancedTimeComponent('seconds');
};

Clock.prototype.getTimeComponent = function(unit, pad) {
  var val = this.getTimeValueForUnit(unit);
  return pad ? padNumber(val, 2) : val;
};

Clock.prototype.getAdvancedTimeComponent = function(unit) {
  var offset = 0;
  switch (unit) {
    case 'hours':
      offset += this.getOffsetFromStart('days') * 24;
      break;
    case 'minutes':
      offset += this.getOffsetFromStart('hours') * 60;
      offset += this.getOffsetFromStart('days') * 24 * 60;
      break;
    case 'seconds':
      offset += this.getOffsetFromStart('minutes') * 60;
      offset += this.getOffsetFromStart('hours') * 60 * 60;
      offset += this.getOffsetFromStart('days') * 24 * 60 * 60;
      break;
  }
  return offset + this.getTimeComponent(unit);
};

Clock.prototype.getOffsetFromStart = function(unit) {
  switch (unit) {
    case 'days':    return this.time.getDate() - this.startTime.getDate();
    case 'hours':   return this.time.getHours() - this.startTime.getHours();
    case 'minutes': return this.time.getMinutes() - this.startTime.getMinutes();
  }
};

Clock.prototype.getTimeValueForUnit = function(unit) {
  switch (unit) {
    case 'hours':   return this.time.getHours() % 12;
    case 'minutes': return this.time.getMinutes();
    case 'seconds': return this.time.getSeconds();
  }
};

// --- Time Hands ---

Clock.prototype.getHourHandPosition = function(radiusOffset) {
  return this.getFacePosition(this.getHourHandRotation(), this.radius / 8 + radiusOffset);
};

Clock.prototype.getMinuteHandPosition = function(radiusOffset) {
  return this.getFacePosition(this.getMinuteHandRotation(), radiusOffset);
};

Clock.prototype.getSecondHandPosition = function(radiusOffset) {
  return this.getFacePosition(this.getSecondHandRotation(), radiusOffset);
};

Clock.prototype.getFacePosition = function(r, radiusOffset = 0) {
  var radius = this.radius - radiusOffset;
  var x = radius * Math.cos(-r + Math.PI / 2);
  var y = radius * -Math.sin(-r + Math.PI / 2);
  return [x, y];
};

Clock.prototype.getHourHandRotation = function(rotationOffset) {
  return this.getFaceRotation(this.getAdvancedHours(), 12, rotationOffset);
};

Clock.prototype.getMinuteHandRotation = function(rotationOffset) {
  return this.getFaceRotation(this.getAdvancedMinutes(), 60, rotationOffset);
};

Clock.prototype.getSecondHandRotation = function(rotationOffset) {
  return this.getFaceRotation(this.getAdvancedSeconds(), 60, rotationOffset);
};

Clock.prototype.getFaceRotation = function(val, max, rotationOffset = 0) {
  return mapLinear(val, 0, max, 0, Math.PI * 2) + rotationOffset;
};

Clock.prototype.createTicks = function(r) {
  this.ticks = [];
  for (var i = 0, tick, r; i < 60; i++) {
    var classNames = ['analog-clock__tick'];
    if (i % 15 === 0) {
      classNames.push('analog-clock__tick--major');
    }
    if (i % 5 === 0) {
      classNames.push('analog-clock__tick--minor');
    }
    r = this.getFaceRotation(i, 60);
    tick = document.createElement('span');
    tick.className = classNames.join(' ');
    tick.style.transform = 'rotate('+ r +'rad)';
    this.el.appendChild(tick);
    this.ticks.push({
      r: r,
      el: tick
    });
  }
};

Clock.prototype.resize = function(r) {
  this.radius = this.el.clientWidth / 2;

  this.ticks.forEach(function(tick) {
    var [x, y] = this.getFacePosition(tick.r);
    tick.el.style.top = (y + this.radius).toFixed(1) + 'px';
    tick.el.style.left = (x + this.radius).toFixed(1) + 'px';
  }, this);
};


// ----------- Positioned Element ---------

function PositionedElement(selector) {
  this.el = document.querySelector(selector);

  this.position = new Vec3();
  this.scale    = new Vec3(1, 1, 1);
  this.rotation = 0;

  this.maxDimension = Math.max(this.el.clientWidth, this.el.clientHeight);
  this.setCenterOffset();
}

PositionedElement.prototype.update = function() {
  var operations = [];
  operations.push(`translate3d(${this.getX()}px, ${this.getY()}px, ${this.getZ()}px)`);
  operations.push(`scale3d(${this.getScaleX()}, ${this.getScaleY()}, ${this.getScaleZ()})`);
  if (this.rotation) {
    operations.push(`rotateZ(${this.rotation}rad)`);
  }
  this.el.style.transform = operations.join(' ');
};

PositionedElement.prototype.setActive = function(on) {
  this.active = on;
};

PositionedElement.prototype.setCenterOffset = function() {
  var x = this.el.clientWidth / 2 - this.el.parentNode.clientWidth / 2 + this.el.offsetLeft;
  var y = this.el.clientHeight / 2 - this.el.parentNode.clientHeight / 2 + this.el.offsetTop;
  this.centerOffset = new Vec3(x, y);
};

PositionedElement.prototype.addCenterOffset = function(x, y, z) {
  this.centerOffset.add(new Vec3(x, y, z));
};

PositionedElement.prototype.getX = function() {
  return this.getPositionComponent('x');
};

PositionedElement.prototype.getY = function() {
  return this.getPositionComponent('y');
};

PositionedElement.prototype.getZ = function() {
  return this.getPositionComponent('z');
};

PositionedElement.prototype.getPositionComponent = function(component) {
  return this.active ? this.position[component] - this.centerOffset[component] : 0;
};

PositionedElement.prototype.getScaleX = function() {
  return this.getScaleComponent('x');
};

PositionedElement.prototype.getScaleY = function() {
  return this.getScaleComponent('y');
};

PositionedElement.prototype.getScaleZ = function() {
  return this.getScaleComponent('z');
};

PositionedElement.prototype.getScaleComponent = function(component) {
  return this.active ? this.scale[component] : 1;
};

PositionedElement.prototype.setScale = function(x, y = x, z = y || x) {
  this.scale = new Vec3(x, y, z);
};

// ----------- Vec3 ---------

function Vec3(x, y, z) {
  this.x = x || 0;
  this.y = y || 0;
  this.z = z || 0;
}

Vec3.prototype.add = function(v2) {
  this.x += v2.x;
  this.y += v2.y;
  this.z += v2.z;
}

// ----------- Utility ---------

function padNumber(num, amt) {
  var str = num.toString();
  while (str.length < amt) {
    str = '0' + str;
  }
  return str;
}

function mapLinear( x, a1, a2, b1, b2 ) {
  return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );
}

