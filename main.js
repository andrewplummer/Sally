'use strict';

var scrollMax = 8000;

var face     = new PositionedElement('.sally__face');
var mouth    = new PositionedElement('.sally__mouth');
var leftEye  = new PositionedElement('.sally__eye--left');
var rightEye = new PositionedElement('.sally__eye--right');

var hourHand   = new PositionedElement('.analog-clock__hand--hour');
var minuteHand = new PositionedElement('.analog-clock__hand--minute');
var secondHand = new PositionedElement('.analog-clock__hand--second');

hourHand.setOffsetFromParentCenter('.sally__face');
minuteHand.setOffsetFromParentCenter('.sally__face');
secondHand.setOffsetFromParentCenter('.sally__face');

var clock = new Clock('.analog-clock');
clock.onTick(updateAnalogClock);
clock.onTick(updateDigitalClock);

function updateSize() {
  clock.resize();
  hourHand.setScale(.32 / (secondHand.el.clientWidth / clock.radius));
  minuteHand.setScale(.22 / (secondHand.el.clientWidth / clock.radius));
  secondHand.setScale(.5 / (secondHand.el.clientWidth / clock.radius));
}

// Scrolling

var zMin = -6000;
var zMax = 6000;

function toggleScrolling(on) {
  if (on) {
    document.addEventListener('scroll', handleScroll);
    document.body.style.height = scrollMax + 'px';
    mouth.setActive(true);
    leftEye.setActive(true);
    rightEye.setActive(true);
    window.scrollTo(0, scrollMax / 2);
  } else {
    document.body.style.height = '';
    document.removeEventListener('scroll', handleScroll);
    mouth.el.style.opacity = '';
    leftEye.el.style.opacity = '';
    rightEye.el.style.opacity = '';

    mouth.setActive(false);
    leftEye.setActive(false);
    rightEye.setActive(false);
    updateFace();
  }
}

function handleScroll(evt) {
  var pct = window.scrollY / document.body.scrollHeight;
  var z = mapLinear(pct, 0, 1, zMin, zMax);
  var opacity = Math.min(mapLinear(pct, 0, .1, 0, 1));

  mouth.el.style.opacity = opacity;
  leftEye.el.style.opacity = opacity;
  rightEye.el.style.opacity = opacity;

  mouth.position.z    = .8 * z;
  leftEye.position.z  = .2 * z;
  rightEye.position.z = .5 * z;
  updateFace();
}

function resetFaceZ() {
  mouth.position.z = 0;
  leftEye.position.z = 0;
  rightEye.position.z = 0;
  updateFace();
}

function updateFace() {
  mouth.update();
  leftEye.update();
  rightEye.update();
  hourHand.update();
  minuteHand.update();
  secondHand.update();
}

// Clock

function toggleClock(on) {
  if (on) {
    hourHand.setActive(true);
    minuteHand.setActive(true);
    secondHand.setActive(true);
    clock.activate();
  } else {
    hourHand.setActive(false);
    minuteHand.setActive(false);
    secondHand.setActive(false);
    clock.deactivate();
    updateFace();
  }
}

function updateDigitalClock(d) {
  document.querySelector('.digital-clock__hours').textContent = clock.getHours(true);
  document.querySelector('.digital-clock__minutes').textContent = clock.getMinutes(true);
  document.querySelector('.digital-clock__seconds').textContent = clock.getSeconds(true);
  document.querySelector('.digital-clock__ampm').textContent = clock.getAmpm();
}

function updateAnalogClock(d) {
  [hourHand.position.x, hourHand.position.y] = clock.getHourHandPosition(hourHand.maxDimension);
  [minuteHand.position.x, minuteHand.position.y] = clock.getMinuteHandPosition(minuteHand.maxDimension);
  secondHand.rotation = clock.getSecondHandRotation(Math.PI / 2);
  updateFace();
}

// Weather

function togglePull(on) {
  if (on) {
    face.setActive(true);
    addDocEvent('mousedown', pullStart);
    addDocEvent('touchstart', pullStart);
  } else {
    face.setActive(false);
    removeDocEvent('mousedown', pullStart);
    removeDocEvent('touchstart', pullStart);
  }
}
togglePull(true);

function easeOutQuad (t) {
  return t*(2-t)
}

function easeOutCubic (t) {
  return (--t)*t*t+1
}

function easeOutElastic (t, b, c, d) {
  var s=1.70158;
  var p=0;
  var a=c;
  if (t==0) return b;
  if ((t/=d)==1) return b+c;
  if (!p) {
    p = d*.3;
  }
  if (a < Math.abs(c)) {
    a = c;
    s = p / 4;
  } else {
    s = p / (2 * Math.PI) * Math.asin (c / a);
  }
  return a*Math.pow(2,-10*t) * Math.sin( (t*d-s)*(2*Math.PI)/p ) + c + b;
}

function addDocEvent(eventName, handler) {
  document.documentElement.addEventListener(eventName, handler);
}

function removeDocEvent(eventName, handler) {
  document.documentElement.removeEventListener(eventName, handler);
}

var pullStartY;

function pullStart(evt) {
  pullStartY = getEventCoordinates(evt)[1];
  addDocEvent('mousemove', pullDrag);
  addDocEvent('touchmove', pullDrag);
  addDocEvent('mouseup',  pullEnd);
  addDocEvent('touchend', pullEnd);
}

function pullDrag(evt) {
  var dy = getEventCoordinates(evt)[1] - pullStartY;
  if (dy > 0) {
    var t = mapLinear(dy, 0, window.innerHeight, 0, 1);
    t = easeOutCubic(t);
    face.rotation = mapLinear(t, 0, 1, 0, Math.PI * 4);
    face.update();
  }
}

function pullEnd(evt) {
  pullUpdate();
  removeDocEvent('mousemove', pullDrag);
  removeDocEvent('touchmove', pullDrag);
  removeDocEvent('mouseup',  pullEnd);
  removeDocEvent('touchend', pullEnd);
}

function pullUpdate() {
  TweenLite.to(face, 4, {
    rotation: 0,
    ease: Elastic.easeOut.config(1, 0.3),
    onUpdate: function() {
      face.update();
    }
  });
}

function getEventCoordinates(evt) {
  var obj = evt;
  if (obj.targetTouches) {
    obj = obj.targetTouches[0];
  }
  return [obj.clientX, obj.clientY];
}

// Weather

var API_KEY = 'BJp3YNwFF8hsmCg7iG9OeouKfZFmLOzJ';

var weather;

function getWeatherUrl(locationId) {
  return `https://dataservice.accuweather.com/currentconditions/v1/${locationId}?apikey=${API_KEY}`;
}

function getLocationUrl(lat, lng) {
  return `https://dataservice.accuweather.com/locations/v1/cities/geoposition/search?apikey=${API_KEY}&q=${lat},${lng}`
}

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
Sally.watch('pull', togglePull);
Sally.watch('weather', toggleWeather);
Sally.set('geoIsAvailable', 'geolocation' in navigator);

window.addEventListener('resize', updateSize);
updateSize();

