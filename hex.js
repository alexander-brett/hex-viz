var sideLength = 20;
var gridSpacing = 20;
var origin = {x: sideLength*gridSpacing, y: sideLength*gridSpacing};
var grid = function(){
  function getAt(ring, side, offset){
    return ring === 0 ? 0 : 1 + 3*ring*(ring-1) + side*ring + offset;
  }
  function firstInRing(r){ return getAt(r, 0, 0); }
  function lastInRing(r){ return getAt(r, 5, r-1); }
  this.getAdjacent = function(ring,side,offset) {
    // this is the centre
    if (ring === 0) { return [1,2,3,4,5,6] }
    if (offset === 0 && side === 0) { // this is the first node in this ring
      return [
          firstInRing(ring) + 1, // the next node (above and to the left)
          firstInRing(ring - 1), // the first node in the previous ring (left)
          firstInRing(ring+1),  // the first node in the next ring (right)
          lastInRing(ring), // the last node in this ring (below-left)
          firstInRing(ring+1) + 1, // the second node in the next ring (above-right)
          lastInRing(ring+1) // the last node in the next ring (below-right)
        ];
      }
      // this is the last node in the first ring
      // this is a special case because it's the only
      // last node which is also a corner node
      if (ring === 1 && side === 5){ return [0,1,5,18,17,16]; }
      // this is the last node in a ring
      if (side === 5 && offset === ring - 1) { // then i = 3*r*(r+1)
        return [
          lastInRing(ring) - 1, // the previous node (below and to the left)
          lastInRing(ring+1), // the last node in the next ring (right)
          lastInRing(ring+1)-1,// the penultimate node in the next ring (below-right)
          lastInRing(ring-1),// the last node in the previous ring (left)
          firstInRing(ring-1),// the first node in the previous ring (above-left)
          firstInRing(ring)// the first node in this ring (above-right)
        ]
      }
      if (offset === 0){
        return [
          getAt(ring, side, 1), // next (left)
          getAt(ring, side-1, ring-1),// previous (below-right)
          getAt(ring-1, side, 0),// inside same corner (below-left)
          getAt(ring+1, side, 0),// outside same corter (above-right)
          getAt(ring+1, side-1, ring),// outside same corner minus 1 (right)
          getAt(ring+1, side, 1)// outside same corner plus 1 (above-left)
        ];
      }
      return [
        getAt(ring, side, offset+1),
        getAt(ring, side, offset-1),
        getAt(ring+1, side, offset),
        getAt(ring+1, side, offset+1),
        getAt(ring-1, side, offset),
        getAt(ring-1, side, offset-1),
      ];
  }

  this.cells = [{
    x:origin.x,
    y:origin.y,
    i:0,
    neighbours: [1,2,3,4,5,6]
  }];
  // populate the grid
  for (var r = 1; r < sideLength; r++){
    for (var t = 0; t < 6; t++){
      for (var k = 0; k < r; k++){
        cells.push({
          x: origin.x + gridSpacing*(r*Math.cos(-t*Math.PI/3) + k * Math.cos((t+2)*Math.PI/3)),
          y: origin.y + gridSpacing*(r*Math.sin(t*Math.PI/3) + k * Math.sin((t+2)*Math.PI/3)),
          i: cells.length,
          neighbours: getAdjacent(r, t, k)
        });
      }
    }
  }

  this.sqdist = function(a, b) {
    return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
  };
  this.theta = function(p){
    if (p.x === origin.x ) return (p.y < 0 ? -1 : 1 )*Math.PI/2;
    return (p.x-origin.x<0 ? Math.PI : 0 ) + Math.atan((p.y-origin.y)/(p.x - origin.x))
  };
  this.norm = function(a, b){
    var dr = Math.abs(sqdist(origin, a) + sqdist(origin,b))/origin.x;
    var dtheta = theta(a) - theta(b);
    effectivedtheta = Math.min(
      Math.abs(dtheta + 2*Math.PI),
      Math.abs(dtheta),
      Math.abs(dtheta - 2*Math.PI));
    if (effectivedtheta > Math.PI/2) return 999999;
    return Math.pow(dr, 1)*Math.pow(effectivedtheta, 0.6)*Math.pow(sqdist(a,b)/origin.x,0.7);//*Math.pow(sqdist(origin,a)/origin.x, 0.6);
  };
  var boundary = new Set();
  boundary.add(0);
  this.occupyNearest = function(p) {
    var minDist = 1000000;
    var d;
    var candidate = null;
    boundary.forEach(function(b){
        if((d = this.norm(p, cells[b])) < minDist) {
          minDist = d;
          candidate = b;
        }
      });
    if (candidate === null) throw("upset");
    var result = cells[candidate];
    result.occupied = true;
    boundary.delete(candidate);
    result.neighbours.filter(function(b){
        return !boundary.has(b)
          && b < cells.length
            && cells[b].occupied != true
      }).forEach(function(b){boundary.add(b); });
    return result;
  }
  return this;
}();
var svg = d3.select('#hex')
  .append('svg')
  .attr('width', 2* origin.x)
  .attr('height', 2* origin.y);

function updateFakes(fakeNodes){
  fakeNodes.attr('transform', function(d){
    var nearest = grid.occupyNearest(d);
    d.fakeLocation = nearest;
    return 'translate('+nearest.x+','+nearest.y+') scale('+gridSpacing/2+') rotate(30) ';
  });
  svg.selectAll('.link')
}

function startForce(data, db){
  var options = Options(db);


  var fakeNodes = svg.selectAll('.fakeNode').data(data)
    .enter().append('polygon')
    .attr('points', '1,0 0.5,0.866 -0.5,0.866 -1,0 -0.5,-0.866 0.5,-0.866')
    .style('fill', 'rgba(0,0,0,0.2)');
  updateFakes(fakeNodes);

    var colourGenerator = options.Colours["Borough"](db);
    fakeNodes.style('fill', function(d,i){
      return colourGenerator.colour(d);
    });
};

var xhr = new XMLHttpRequest();
xhr.open('GET', 'data.db', true);
xhr.responseType = 'arraybuffer';
xhr.onload = function(e) {
  var uInt8Array = new Uint8Array(this.response);
  var db = new SQL.Database(uInt8Array);
  var statement = db.prepare(
    "SELECT * from boroughs " +
    "JOIN locations ON boroughs.id = locations.id " +
    "ORDER BY "+
    "(locations.lat-51.508)*(locations.lat-51.508)"
    +"+(locations.long+0.1)*(locations.long+0.1)"
    +" ASC "
    //+ "LIMIT 50"
  );
  var projection = d3.geoMercator()
    .scale(sideLength*2200)
    .center([-0.1, 51.5085300])
    .translate([origin.x,origin.y]);
  var data = [];
  while(statement.step()){
    var result = statement.getAsObject();
    result.desiredLocation = projection([result.long, result.lat]);
    result.x = result.desiredLocation[0];
    result.y = result.desiredLocation[1];
    data.push(result);
  }
  startForce(data, db);
};
xhr.send();
