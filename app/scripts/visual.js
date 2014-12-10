
'use strict';


var numBefore = 0;

var atlasTrafficServer = '0.0.0.0';
var conn = new WebSocket('ws://' + atlasTrafficServer + ':3000');
var numPeople = 0;
var currentHour =0; 
var k = 0;
var counts = [];
var mostpeople = 10;
var hour = 0;

function TimeCount(i, h, c, a) {

this.iterations = i;
this.hour = h;
this.count = c;
this.averagenum = a;

}

for (var i = 0; i<24; i++) {
counts[i] = new TimeCount(0, i, 5, 0);
}


setInterval(function(){ 

var currentdate = new Date();
k = currentdate.getHours();
counts[hour].iterations = counts[hour].iterations + 1;
counts[hour].averagenum = parseInt((parseFloat(counts[hour].averagenum)*parseFloat(counts[hour].iterations-1) + parseFloat(numPeople))/counts[hour].iterations);
counts[hour].count = numPeople;
console.log("hour " + hour)
if (hour == 2) {
numPeople = 0;
}

}, 500);




function Ball(r, p, v) {
  this.radius = r;
  this.point = p;
  this.vector = v;
  this.maxVec = 15;
  this.numSegment = Math.floor(r / 3 + 2);
  this.boundOffset = [];
  this.boundOffsetBuff = [];
  this.sidePoints = [];
  this.path = new Path({
    fillColor: {
      /*hue: (0.7 + (numPeople / 60 * 0.3)) * 360,*/
      hue: Math.random() * 360,
      saturation: 1,
      brightness: 1
    },
    blendMode: 'screen'
  });

  for (var i = 0; i < this.numSegment; i ++) {
    this.boundOffset.push(this.radius);
    this.boundOffsetBuff.push(this.radius);
    this.path.add(new Point());
    this.sidePoints.push(new Point({
      angle: 360 / this.numSegment * i,
      length: 1
    }));
  }
}

Ball.prototype = {
  iterate: function() {
    this.checkBorders();

    if (this.vector.length > this.maxVec) {
      this.vector.length = this.maxVec;
    }

    this.point += this.vector;
    this.updateShape();
  },

  checkBorders: function() {
    var size = view.size;
    if (this.point.x < -this.radius) {
      this.point.x = size.width + this.radius;
    }

    if (this.point.x > size.width + this.radius) {
      this.point.x = -this.radius;
    }

    if (this.point.y < -this.radius) {
      this.point.y = size.height/2 + this.radius;
    }

    if (this.point.y > size.height/2 + this.radius) {
      this.point.y = -this.radius;
    }
  },

  updateShape: function() {
    var segments = this.path.segments;

    for (var i = 0; i < this.numSegment; i ++) {
      segments[i].point = this.getSidePoint(i);
    }

    this.path.smooth();
    for (i = 0; i < this.numSegment; i ++) {
      if (this.boundOffset[i] < this.radius / 4) {
        this.boundOffset[i] = this.radius / 4;
      }

      var next = (i + 1) % this.numSegment;
      var prev = (i > 0) ? i - 1 : this.numSegment - 1;
      var offset = this.boundOffset[i];
      offset += (this.radius - offset) / 15;
      offset += ((this.boundOffset[next] + this.boundOffset[prev]) / 2 - offset) / 3;
      this.boundOffsetBuff[i] = this.boundOffset[i] = offset;
    }
  },

  react: function(b) {
    var dist = this.point.getDistance(b.point);
    if (dist < this.radius + b.radius && dist !== 0) {
      var overlap = this.radius + b.radius - dist;
      var direc = (this.point - b.point).normalize(overlap * 0.015);
      this.vector += direc;
      b.vector -= direc;

      this.calcBounds(b);
      b.calcBounds(this);
      this.updateBounds();
      b.updateBounds();
    }
  },

  getBoundOffset: function(b) {
    var diff = this.point - b;
    var angle = (diff.angle + 180) % 360;
    return this.boundOffset[Math.floor(angle / 360 * this.boundOffset.length)];
  },

  calcBounds: function(b) {
    for (var i = 0; i < this.numSegment; i ++) {
      var tp = this.getSidePoint(i);
      var bLen = b.getBoundOffset(tp);
      var td = tp.getDistance(b.point);
      if (td < bLen) {
        this.boundOffsetBuff[i] -= (bLen  - td) / 2;
      }
    }
  },

  getSidePoint: function(index) {
    return this.point + this.sidePoints[index] * this.boundOffset[index];
  },

  updateBounds: function() {
    for (var i = 0; i < this.numSegment; i ++){
      this.boundOffset[i] = this.boundOffsetBuff[i];
    }
  }
};


//--------------------- main ---------------------

var balls = [];
var numBalls = numPeople;



function newEvent(){

  for (var i = 0; i < numPeople; i++) {
  var position = Point.random() * view.size;
  var vector = new Point({
    angle: 360 * Math.random(),
    length: 0.1
  });
  var radius = 1-(numPeople/120) * 60 + 60;
  balls.push(new Ball(radius, position, vector));

}

}

var size = view.size;
var textin = new PointText(new Point(size.width/2, size.height/3));
textin.justification = 'center';
textin.fillColor = 'white';
textin.fontSize = 40;
textin.content = 'Number of People in Room: ' + numPeople;

conn.onmessage = function (ev) {
  
  project.activeLayer.removeChildren();

  for (var o = 0; o < balls.length; o++){
  balls = [];
  }  


  numBefore = numPeople;
  var evdata = JSON.parse(ev.data);
  numPeople = parseInt(numPeople) + parseInt(evdata.totalEntries);
  console.log(numPeople);
  if (numPeople < 0){
    numPeople = 0;
  }
  if (numPeople > mostpeople){
  if (numPeople > 10){
  mostpeople = numPeople;
  }
  }
  currentHour = evdata.timestamp;
  hour = parseInt(currentHour.substring(0, 2));
  console.log(currentHour);
  drawText(currentHour);
  newEvent();

  if (numPeople >= 10){
  textin.content = 'Number of People in Room: ' + numPeople;
  }
  if (numPeople < 10){
  textin.content = 'Number of People in Room: < 10';
  }


};


 /*jshint unused:false*/
function onFrame() {
  for (var i = 0; i < balls.length - 1; i++) {
    for (var j = i + 1; j < balls.length; j++) {
      balls[i].react(balls[j]);
    }
  }

  var l;
  for (i = 0, l = balls.length; i < l; i++) {
    balls[i].iterate();
  }
}


function drawText(ch) {

var textin = new PointText(new Point(size.width/2, size.height/3));
textin.justification = 'center';
textin.fillColor = 'white';
textin.fontSize = 40;
if (numPeople >= 10){
  textin.content = 'Number of People in Room: ' + numPeople;
  }
  if (numPeople < 10){
  textin.content = 'Number of People in Room: < 10';
  }

var beglong = new Point(0, 3*size.height/4);
var endlong = new Point(size.width, 3*size.height/4);
var path = new Path.Line(beglong, endlong);
path.strokeColor = 'white';

var  begone= new Point(size.width/5, 3*size.height/4);
var endone = new Point(size.width/5 , size.height);
var path = new Path.Line(begone, endone);
path.strokeColor = 'white';

var  begone= new Point(2*size.width/5, 3*size.height/4);
var endone = new Point(2*size.width/5 , size.height);
var path = new Path.Line(begone, endone);
path.strokeColor = 'white';

var  begone= new Point(3*size.width/5, 3*size.height/4);
var endone = new Point(3*size.width/5 , size.height);
var path = new Path.Line(begone, endone);
path.strokeColor = 'white';

var  begone= new Point(4*size.width/5, 3*size.height/4);
var endone = new Point(4*size.width/5 , size.height);
var path = new Path.Line(begone, endone);
path.strokeColor = 'white';


var text = new PointText(new Point(size.width/10, 16*size.height/20));
text.justification = 'center';
text.fillColor = 'white';
text.fontSize = 20;
if (parseInt(ch.substring(0, 2))-2 >= 0){
text.content = parseInt(ch.substring(0, 2)) - 2 + ':00';
}
if (parseInt(ch.substring(0, 2))-2 === -1){
text.content = '23:00';
}
if (parseInt(ch.substring(0, 2))-2 === -2){
text.content = '22:00';
}

var text = new PointText(new Point(3*size.width/10, 16*size.height/20));
text.justification = 'center';
text.fillColor = 'white';
text.fontSize = 20;
if (parseInt(ch.substring(0, 2))-1 >= 0){
text.content = parseInt(ch.substring(0, 2)) - 1 + ':00';
}
if (parseInt(ch.substring(0, 2))-1 === -1){
text.content = '23:00';
}

var text = new PointText(new Point(7*size.width/10, 16*size.height/20));
text.justification = 'center';
text.fillColor = 'white';
text.fontSize = 20;
text.content = parseInt(ch.substring(0, 2)) + 1 + ':00';
text.fontSize = 20;
if (parseInt(ch.substring(0, 2))+1 <= 23){
text.content = parseInt(ch.substring(0, 2)) + 1 + ':00';
}
if (parseInt(ch.substring(0, 2))+1 === 24){
text.content = '0:00';
}

var text = new PointText(new Point(9*size.width/10, 16*size.height/20));
text.justification = 'center';
text.fillColor = 'white';
text.fontSize = 20;
if (parseInt(ch.substring(0, 2))+2 <= 23){
text.content = parseInt(ch.substring(0, 2)) + 2 + ':00';
}
if (parseInt(ch.substring(0, 2))+2 === 24){
text.content = '0:00';
}
if (parseInt(ch.substring(0, 2))+2 === 25){
text.content = '1:00';
}

var countTwoAgo = new PointText(new Point(size.width/10, 18*size.height/20));
countTwoAgo.justification = 'center';
countTwoAgo.fillColor = 'white';
countTwoAgo.fontSize = 30;
if (parseInt(ch.substring(0, 2))-2 >= 0){
countTwoAgo.content = counts[parseInt(ch.substring(0, 2))-2].count;
}
if (parseInt(ch.substring(0, 2))-2 === -1){
countTwoAgo.content = counts[23].count;
}
if (parseInt(ch.substring(0, 2))-2 === -2){
countTwoAgo.content = counts[22].count;
}

var countOneAgo = new PointText(new Point(3*size.width/10, 18*size.height/20));
countOneAgo .justification = 'center';
countOneAgo .fillColor = 'white';
countOneAgo .fontSize = 30;
if (parseInt(ch.substring(0, 2))-1 >= 0){
countOneAgo.content = counts[parseInt(ch.substring(0, 2))-1].count;
}
if (parseInt(ch.substring(0, 2))-1 === -1){
countOneAgo.content = counts[23].count;
}


var predOne = new PointText(new Point(7*size.width/10, 18*size.height/20));
predOne.justification = 'center';
predOne.fillColor = 'white';
predOne.fontSize = 30;
if (parseInt(ch.substring(0, 2))+1 < 24){
predOne.content = counts[parseInt(ch.substring(0, 2))+1].averagenum;
}
if (parseInt(ch.substring(0, 2))+1 === 24){
predOne.content = counts[0].averagenum;
}

var predTwo = new PointText(new Point(9*size.width/10, 18*size.height/20));
predTwo.justification = 'center';
predTwo.fillColor = 'white';
predTwo.fontSize = 30;
if (parseInt(ch.substring(0, 2))+2 < 24){
predTwo.content = counts[parseInt(ch.substring(0, 2))+2].averagenum;
}
if (parseInt(ch.substring(0, 2))+2 === 24){
predTwo.content = counts[0].averagenum
}
if (parseInt(ch.substring(0, 2))+2 === 25){
predTwo.content = counts[1].averagenum
}


var labelMid = new PointText(new Point(5*size.width/10, 16*size.height/20));
labelMid .justification = 'center';
labelMid .fillColor = 'white';
labelMid .fontSize = 15;
labelMid .content = 'Most People';

var cellMid = new PointText(new Point(5*size.width/10, 18*size.height/20));
cellMid.justification = 'center';
cellMid.fillColor = 'green';
cellMid.fontSize = 30;
cellMid.content = mostpeople;
}
