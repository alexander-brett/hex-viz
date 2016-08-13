// HEXAGONAL GEOMETRY (KINDA)

// A ring is a concentric hexagon
// A side is which side of the hexagon you're on
// An offset is where you are on that side

function getAt(ring, side, offset){
  return ring === 0 ? 0 : 1 + 3*ring*(ring-1) + side*ring + offset;
}

function firstInRing(r){ return getAt(r, 0, 0); }

function lastInRing(r){ return getAt(r, 5, r-1); }

function getAdjacent(ring,side,offset) {
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

function sqdist(a, b) {
  return Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2);
};

function HexGrid(size, numberOfElements){

  var origin = {x: size/2, y: size/2};

  var sideLength = 2;
  while (getAt(sideLength, 0, 0) < 2*numberOfElements+1){
    sideLength++;
  }

  var gridSpacing = size / (2*sideLength-1);

  var cells = [{x:origin.x, y:origin.y, i:0, neighbours: [1,2,3,4,5,6]}];
  // populate the grid
  for (var r = 1; r < sideLength+1; r++){
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

  function theta(p){
    if (p.x === origin.x ) return (p.y < 0 ? -1 : 1 )*Math.PI/2;
    return (p.x-origin.x<0 ? Math.PI : 0 ) + Math.atan((p.y-origin.y)/(p.x - origin.x))
  };
  // Not actually a norm.
  function norm(a, b){
    var dr = Math.abs(sqdist(origin, a) + sqdist(origin,b))/origin.x;
    var dtheta = theta(a) - theta(b);
    var effectivedtheta = Math.min(
      Math.abs(dtheta + 2*Math.PI),
      Math.abs(dtheta),
      Math.abs(dtheta - 2*Math.PI));
    if (effectivedtheta > Math.PI/2) return 999999;
    return Math.pow(dr, 1)*Math.pow(effectivedtheta, 0.6)*Math.pow(sqdist(a,b)/origin.x,0.7);
  };
  // A list of indices which are the current boundary.
  var boundary = new Set();
  boundary.add(0);
  this.occupyNearest = function(p) {
    var minDist = 1000000;
    var candidate = null;
    boundary.forEach(function(b){
      var d = norm(p, cells[b]);
      if(d < minDist) {
          minDist = d;
          candidate = b;
        }
      });
    if (candidate === null) throw("upset");
    var result = cells[candidate];
    result.occupied = true;
    boundary.delete(candidate);
    result.neighbours.filter(function(b){
        return !boundary.has(b) && b < cells.length && cells[b].occupied != true
      }).forEach(function(b){boundary.add(b); });
    return result;
  }
  return this;
};
