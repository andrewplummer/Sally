
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
