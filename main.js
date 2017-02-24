'use strict';

function ClockHand(selector, positionedScale = 1) {
  this.el = document.querySelector(selector);

  this.pos = new Vec3();
  this.scale = new Vec3(1, 1, 1);
  this.rotation = 0;

  this.maxDimension = Math.max(this.el.clientWidth, this.el.clientHeight);
  this.positionedScale = positionedScale;
  this.setCenterOffset();
}

ClockHand.prototype.update = function() {
  var operations = [];
  operations.push(`translate3d(${this.getX()}px, ${this.getY()}px, ${this.getZ()}px)`);
  if (this.rotation) {
    operations.push(`rotateZ(${this.rotation}rad)`);
  }
  operations.push(`scale3d(${this.scale.x}, ${this.scale.y}, ${this.scale.z})`);
  this.el.style.transform = operations.join(' ');
};

ClockHand.prototype.setPositioned = function(on) {
  if (on) {
    this.scale.x = this.positionedScale;
    this.scale.y = this.positionedScale;
    this.centered = true;
  } else {
    this.pos.x = 0;
    this.pos.y = 0;
    this.scale.x = 1;
    this.scale.y = 1;
    this.centered = false;
  }
};

ClockHand.prototype.setCenterOffset = function() {
  var x = this.el.clientWidth / 2 - this.el.parentNode.clientWidth / 2 + this.el.offsetLeft;
  var y = this.el.clientHeight / 2 - this.el.parentNode.clientHeight / 2 + this.el.offsetTop;
  this.centerOffset = new Vec3(x, y);
};

ClockHand.prototype.addCenterOffset = function(x, y, z) {
  this.centerOffset.add(new Vec3(x, y, z));
};

ClockHand.prototype.getVectorComponent = function(component) {
  return this.pos[component] - (this.centered ? this.centerOffset[component] : 0);
};

ClockHand.prototype.getX = function() {
  return this.getVectorComponent('x');
};

ClockHand.prototype.getY = function() {
  return this.getVectorComponent('y');
};

ClockHand.prototype.getZ = function() {
  return this.getVectorComponent('z');
};

var leftEye = document.querySelector('.sally__eye--left');
var rightEye = document.querySelector('.sally__eye--right');
var mouth = document.querySelector('.sally__mouth');
var face = document.querySelector('.sally__face');

var scrollMax = 8000;
var leftEyeRate = .2;
var rightEyeRate = .5;
var mouthRate = .8;

var leftEye  = new ClockHand('.sally__eye--left', .8);
var rightEye = new ClockHand('.sally__eye--right', .6);
var mouth    = new ClockHand('.sally__mouth');

mouth.addCenterOffset(-17, 0);

var clockRadius;

var zMin = -6000;
var zMax = 6000;

function toggleScrolling(on) {
  if (on) {
    document.addEventListener('scroll', handleScroll);
    document.body.style.height = scrollMax + 'px';
    window.scrollTo(0, scrollMax / 2);
  } else {
    document.body.style.height = '';
    document.removeEventListener('scroll', handleScroll);
    resetFaceZ();
  }
}

function handleScroll(evt) {
  var pct = window.scrollY / document.body.scrollHeight;
  var z = mapLinear(pct, 0, 1, zMin, zMax);
  mouth.pos.z     = mouthRate * z;
  leftEye.pos.z  = leftEyeRate * z;
  rightEye.pos.z = rightEyeRate * z;
  updateFace();
}

function resetFaceZ() {
  mouth.pos.z = 0;
  leftEye.pos.z = 0;
  rightEye.pos.z = 0;
  updateFace();
}

function updateFace() {
  mouth.update();
  leftEye.update();
  rightEye.update();
}

function mapLinear( x, a1, a2, b1, b2 ) {
  return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );
}

var timer;

function setupAnalogClock() {

  var el = document.querySelector('.analog-clock');
  clockRadius = el.clientWidth / 2;

  for (var i = 0; i < 60; i++) {
    var classNames = ['analog-clock__tick'];
    if (i % 15 === 0) {
      classNames.push('analog-clock__tick--major');
    }
    if (i % 5 === 0) {
      classNames.push('analog-clock__tick--minor');
    }
    addTick(mapLinear(i, 0, 60, 0, Math.PI * 2), classNames.join(' '));
  }

  function addTick(r, className) {
    var child = document.createElement('span');
    var [x, y] = getRotatedPosition(r, clockRadius);
    child.className = className;
    child.style.top = (y + clockRadius).toFixed(1) + 'px';
    child.style.left = (x + clockRadius).toFixed(1) + 'px';
    child.style.transform = 'rotate('+ r +'rad)';
    el.appendChild(child);
  }

}

function getRotatedPosition(r, radius) {
  var x = radius * Math.cos(-r + (Math.PI / 2));
  var y = radius * -Math.sin(-r + (Math.PI / 2));
  return [x, y];
}

function toggleClock(on) {
  if (on) {
    mouth.setPositioned(true);
    leftEye.setPositioned(true);
    rightEye.setPositioned(true);
    tick();
  } else {
    mouth.setPositioned(false);
    leftEye.setPositioned(false);
    rightEye.setPositioned(false);
    mouth.rotation = 0;
    updateFace();
    clearTimeout(timer);
  }
}

function padNumber(num, amt) {
  var str = num.toString();
  while (str.length < amt) {
    str = '0' + str;
  }
  return str;
}

function updateDigitalClock(d) {
  document.querySelector('.digital-clock__hours').textContent = padNumber(d.getHours(), 2);
  document.querySelector('.digital-clock__minutes').textContent = padNumber(d.getMinutes(), 2);
  document.querySelector('.digital-clock__seconds').textContent = padNumber(d.getSeconds(), 2);
}

function updateAnalogClock(d) {
  updateHandPosition(leftEye, d.getHours());
  updateHandPosition(rightEye, d.getMinutes());
  mouth.rotation = getRotationForTimeValue(d.getSeconds());
  updateFace();
}

function getRotationForTimeValue(val) {
  return mapLinear(val, 0, 60, 0, Math.PI * 2);
}

function updateHandPosition(hand, val) {
  [hand.pos.x, hand.pos.y] = getRotatedPosition(getRotationForTimeValue(val), clockRadius - hand.maxDimension);
}

function tick() {
  var d = new Date();
  updateAnalogClock(d);
  updateDigitalClock(d);
  timer = setTimeout(tick, 1000);
}

var API_KEY = 'BJp3YNwFF8hsmCg7iG9OeouKfZFmLOzJ';

function getWeatherUrl(locationId) {
  return `https://dataservice.accuweather.com/currentconditions/v1/${locationId}?apikey=${API_KEY}`;
}

function getLocationUrl(lat, lng) {
  return `https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${API_KEY}&q=${lat},${lng}`
}

var weather;

function getJson(url) {
  return new Promise(resolve => {
    fetch(url).then(response => {
      response.json().then(resolve);
    });
  });
}

function getWeather(coords) {
  if (weather) {
    return weather;
  }
  weather = new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(position => {
      getJson(getLocationUrl(position.coords.latitude, position.coords.longitude)).then(data => {
        getJson(getWeatherUrl(data.Key)).then(data => {
          resolve({
            temp: data[0].Temperature.Metric.Value,
            text: data[0].WeatherText
          });
        });
      });
    });
  });
  return weather;
}

function toggleWeather(on) {
  if (on) {
    getWeather().then(function(weather) {
      Sally.set('weatherTemp', weather.temp);
      Sally.set('weatherText', weather.text);
    });
  } else {
    Sally.set('weatherTemp', null);
    Sally.set('weatherText', null);
  }
}

Sally.watch('scroll', toggleScrolling);
Sally.watch('clock', toggleClock);
Sally.watch('weather', toggleWeather);
Sally.set('geoIsAvailable', 'geolocation' in navigator);

setupAnalogClock();
