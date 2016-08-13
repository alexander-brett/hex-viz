//var sideLength = 20;
var gridSpacing = 20;


function Node(data, projection){
  var desiredLocation = projection([data.long, data.lat]);
  return {
    x: desiredLocation[0],
    y: desiredLocation[1],
    id: data.id
  };
}


function startForce(raw, db){

  var options = Options(db);

  var grid = HexGrid(gridSpacing, raw.length);

  var svg = d3.select('#hex')
    .append('svg')
    .attr('width', 2* grid.origin.x)
    .attr('height', 2* grid.origin.y);

    var projection = d3.geoMercator()
      .scale(grid.sideLength*2200)
      .center([-0.1, 51.48])
      .translate([grid.origin.x,grid.origin.y]);

    var data = raw.map(function(d){return Node(d, projection)});

  function updateFakes(fakeNodes){
    fakeNodes.attr('transform', function(d){
      var nearest = grid.occupyNearest(d);
      d.fakeLocation = nearest;
      return 'translate('+nearest.x+','+nearest.y+') scale('+gridSpacing/2+') rotate(30) ';
    });
    svg.selectAll('.link')
  }

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
    "(locations.lat-51.48)*(locations.lat-51.48)"
    +"+(locations.long+0.1)*(locations.long+0.1)"
    +" ASC "
    //+ "LIMIT 50"
  );
  var data = [];
  while(statement.step()){
    var result = statement.getAsObject();
    data.push(result);
  }
  startForce(data, db);
};
xhr.send();
