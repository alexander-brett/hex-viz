//var sideLength = 20;
var gridSpacing = 20;

var size = 700;

function Node(data, projection){
  var desiredLocation = projection([data.long, data.lat]);
  data.x = desiredLocation[0];
  data.y = desiredLocation[1];
  return data;
}


function startForce(dataSource){

  var grid = HexGrid(gridSpacing, dataSource.Data.length);

  var svg = d3.select('#hex')
    .append('svg')
    .attr('width', size)
    .attr('height', size);

    var projection = d3.geoMercator()
      .scale(grid.sideLength*2200)
      .center([dataSource.Centre.long, dataSource.Centre.lat])
      .translate([grid.origin.x,grid.origin.y]);

    var data = dataSource.Data.map(function(d){return Node(d, projection)});

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

    var colourGenerator = dataSource.Options.Colours("Borough");
    fakeNodes.style('fill', function(d,i){
      return colourGenerator.colour(d);
    });
};

function loadUrl(url){
  return new Promise(function(resolve, reject){
    var xhr = new XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'arraybuffer';
    xhr.onload = function(e) {
      resolve(xhr.response);
    };
    xhr.send();
  });
}

function loadDatabase(response){
  var uInt8Array = new Uint8Array(response);
  return new SQL.Database(uInt8Array);
};

function LondonDataSource(){
  var _self = this;
  var _db;
  this.Centre = {long: -0.09, lat: 51.48};
  this.NumberOfElements = function(){};
  this.Init = function(){
    return loadUrl('data.db')
      .then(loadDatabase)
      .then(function(db){
        _self.Options = LondonOptions(db);
        var statement = db.prepare(
          "SELECT * from boroughs " +
          "JOIN locations ON boroughs.id = locations.id " +
          "ORDER BY "+
          "(locations.lat-($lat))*(locations.lat-($lat))"
          +"+(locations.long-($long))*(locations.long-($long))"
          +" ASC "
          //+ "LIMIT 50"
          , {$lat: _self.Centre.lat, $long: _self.Centre.long}
        );
        while(statement.step()){
          _self.Data.push(statement.getAsObject());
        }
        return _self;
      });
  };
  this.Options = function(){};
  this.Data = [];
  return this;
}

new LondonDataSource().Init().then(startForce);
