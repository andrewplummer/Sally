
var leftEye = document.querySelector('.sally__eye--left');
var rightEye = document.querySelector('.sally__eye--right');
var mouth = document.querySelector('.sally__mouth');

var scrollMax = 8000;
var leftEyeRate = .2;
var rightEyeRate = .5;
var mouthRate = .8;

var leftEyeZ      = 0;
var rightEyeZ     = 0;
var mouthZ        = 0;
var mouthRotation = 0;

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
    resetFace();
  }
}

function handleScroll(evt) {
  var pct = window.scrollY / document.body.scrollHeight;
  var z = mapLinear(pct, 0, 1, zMin, zMax);
  leftEyeZ  = leftEyeRate * z;
  rightEyeZ = rightEyeRate * z;
  mouthZ    = mouthRate * z;
  updateFace();
}

function resetFace() {
  leftEyeZ = 0;
  rightEyeZ = 0;
  mouthZ = 0;
  updateFace();
}

function updateFace() {
  leftEye.style.transform = 'translateZ('+ leftEyeZ +'px)';
  rightEye.style.transform = 'translateZ('+ rightEyeZ +'px)';
  mouth.style.transform = 'translateZ('+ mouthZ +'px) rotateZ(' + mouthRotation + 'deg)';
}

function mapLinear( x, a1, a2, b1, b2 ) {
  return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );
}

var timer;

function setupAnalogClock() {

  var el = document.querySelector('.analog-clock');
  var radius = parseFloat(window.getComputedStyle(el).width) / 2;

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

    var offset = -Math.PI / 2;
    var x = (radius * Math.cos(-r - offset) + radius).toFixed(1);
    var y = (radius * -Math.sin(-r - offset) + radius).toFixed(1);
    var child = document.createElement('span');
    child.className = className;
    child.style.top = y + 'px';
    child.style.left = x + 'px';
    child.style.transform = 'rotate('+ r +'rad)';
    el.appendChild(child);
  }

}

function toggleClock(on) {
  if (on) {
    tick();
  } else {
    mouthRotation = 0;
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

function updateDigitalClock() {
  var d = new Date();
  document.querySelector('.digital-clock__hours').textContent = padNumber(d.getHours(), 2);
  document.querySelector('.digital-clock__minutes').textContent = padNumber(d.getMinutes(), 2);
  document.querySelector('.digital-clock__seconds').textContent = padNumber(d.getSeconds(), 2);
}

function getRotationForTime() {
  var seconds = new Date().getSeconds();
  return mapLinear(seconds, 0, 60, 0, 360);
}

function tick() {
  mouthRotation = getRotationForTime();
  updateFace();
  updateDigitalClock();
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
    Sally.set('temp', null);
    Sally.set('weather', null);
  }
}

Sally.watch('scroll', toggleScrolling);
Sally.watch('clock', toggleClock);
Sally.watch('weather', toggleWeather);
Sally.set('geoIsAvailable', 'geolocation' in navigator);

setupAnalogClock();
