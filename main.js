
var leftEye = document.querySelector('.sally__eye--left');
var rightEye = document.querySelector('.sally__eye--right');
var mouth = document.querySelector('.sally__mouth');

var scrollMax = 8000;
var leftEyeRate = .2;
var rightEyeRate = .5;
var mouthRate = .8;

var zMin = 0;
var zMax = 2000;

document.body.style.height = scrollMax + 'px';

function mapLinear( x, a1, a2, b1, b2 ) {
  return b1 + ( x - a1 ) * ( b2 - b1 ) / ( a2 - a1 );
}

document.addEventListener('scroll', function(evt) {
  var pct = window.scrollY / document.body.scrollHeight;
  var z = mapLinear(pct, 0, 1, zMin, zMax);
  leftEye.style.transform = 'translateZ('+ z * leftEyeRate +'px)';
  rightEye.style.transform = 'translateZ('+ z * rightEyeRate +'px)';
  mouth.style.transform = 'translateZ('+ z * mouthRate +'px)';
});
