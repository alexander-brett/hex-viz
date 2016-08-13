var size = 720;

function startForce(dataSource){

  var grid = new HexGrid(size, dataSource.Data.length);

  var svg = d3.select('#hex')
    .append('svg')
    .attr('width', size)
    .attr('height', size);

      var colourGenerator = dataSource.Options.Colours("Borough");

  var fakeNodes = svg.selectAll('.fakeNode').data(dataSource.Data)
    .enter().append('polygon')
    .attr('points', '1,0 0.5,0.866 -0.5,0.866 -1,0 -0.5,-0.866 0.5,-0.866')
    .style('fill', 'rgba(0,0,0,0.2)').attr('transform', function(d){
      var nearest = grid.occupyNearest(d);
      d.fakeLocation = nearest;
      return 'translate('+nearest.x+','+nearest.y+') scale('+10+') rotate(30) ';
    }).style('fill', function(d){
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
  var _projection = d3.geoMercator()
        .scale(65*size)
        .center([_self.Centre.long, _self.Centre.lat])
        .translate([size/2,size/2]);

  this.NumberOfElements = function(){return _self.Data.length;};
  this.Init = function(){
    return loadUrl('data.db')
      .then(loadDatabase)
      .then(function(db){
        _self.Options = new LondonOptions(db);
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
          var item = statement.getAsObject();
          [item.x,item.y] = _projection([item.long, item.lat]);
          _self.Data.push(item);
        }
        return _self;
      });
  };
  this.Options = function(){};
  this.Data = [];
  return this.Init();
}

new LondonDataSource().then(startForce);
