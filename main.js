'use strict';

var scrollMax = 8000;

var mouth    = new PositionedElement('.analog-clock__hand--second');
var leftEye  = new PositionedElement('.analog-clock__hand--hour');
var rightEye = new PositionedElement('.analog-clock__hand--minute');

var clock = new Clock('.analog-clock', leftEye, rightEye, mouth);
clock.onTick(updateAnalogClock);
clock.onTick(updateDigitalClock);

function updateSize() {
  clock.resize();
  leftEye.setScale(.32 / (mouth.el.clientWidth / clock.radius));
  rightEye.setScale(.22 / (mouth.el.clientWidth / clock.radius));
  mouth.setScale(.5 / (mouth.el.clientWidth / clock.radius));
}

// Scrolling

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
}

// Clock

function toggleClock(on) {
  if (on) {
    mouth.setActive(true);
    leftEye.setActive(true);
    rightEye.setActive(true);
    clock.activate();
  } else {
    mouth.setActive(false);
    leftEye.setActive(false);
    rightEye.setActive(false);
    mouth.rotation = 0;
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
  [leftEye.position.x, leftEye.position.y] = clock.getHourHandPosition(leftEye.maxDimension);
  [rightEye.position.x, rightEye.position.y] = clock.getMinuteHandPosition(leftEye.maxDimension);
  // TODO: prevent transitioning on zoom?
  mouth.rotation = clock.getSecondHandRotation(Math.PI / 2);
  updateFace();
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
Sally.watch('weather', toggleWeather);
Sally.set('geoIsAvailable', 'geolocation' in navigator);

window.addEventListener('resize', updateSize);
updateSize();

