function LondonOptions(database){
    function radiusFromProperty(table, column, label, size){
      return function(db){
        var query = db.exec(
          "SELECT max("+column+"), min("+column+") FROM "+table+";"
          + "SELECT "+column+" FROM "+table+" ORDER BY id ASC;"
        );
        var values = query[1].values.map(function(d){return d[0]});
        var min = query[0].values[0][1];
        var max = query[0].values[0][0];
        var convert = d3.scale.sqrt().domain([0,fix(max)]).range([0,size*scale]);
        this.caption = function(i){return values[i] + label};
        this.radius = function(i){
          return convert(fix(values[i]))
        };
        this.key = [{
          caption: min + label,
          radius: convert(fix(min))
        },{
          caption: max + label,
          radius: convert(fix(max))
        }];
        return this;
      }
    }

    function radiusWithYears(table, column, size, db){
      var query = db.exec("SELECT DISTINCT year FROM "+table+" ORDER BY year DESC");
      var availableYears =  query[0].values.map(function(d){ return d[0]});
      function doMakeRadius(){
         var query = db.exec(
          "SELECT max("+column+"), min("+column+") FROM "+table+";"
          + "SELECT "+column+" FROM "+table+" WHERE year="+doMakeRadius.year+" ORDER BY id ASC;"
        );
        var values = query[1].values.map(function(d){return d[0]});
        var min = query[0].values[0][1];
        var max = query[0].values[0][0];
        var convert = d3.scale.sqrt().domain([0,fix(max)]).range([0,size*scale]);
        this.caption = function(i){return values[i]};
        this.radius = function(i){
          return convert(fix(values[i]))
        };
        this.key = [{
          caption: min,
          radius: convert(fix(min))
        },{
          caption: max,
          radius: convert(fix(max))
        }];
        return this;
      }

      doMakeRadius.years = availableYears.map(function(d){
        return {value:d, action: function(){
          doMakeRadius.year = d
          }}
      });
      doMakeRadius.year = availableYears.filter(function(y){return y<=2016})[0];
      return doMakeRadius;
    }

    this.Radii = {
      "Area (sq. km)": radiusFromProperty("area", "area", "sq. km", 6.2),
      "Mayoral election 2016 total turnout size": radiusFromProperty("voting", "turnout", " voters", 2.5),
      "Mayoral election 2016 registered voters": radiusFromProperty("voting", "electorate", " voters", 2.2),
      "Population estimates & projections": radiusWithYears("population", "population", 3.2, database),
      "Median House Price (£)": radiusWithYears('median_house_price', 'price', 3.7, database),
    };

    var colourFromBorough = function(){
      return function(db){
        var boroughQuery = db.exec("SELECT DISTINCT borough FROM boroughs;");
        var boroughs = boroughQuery[0].values.map(function(d){return d[0]});
        var palette = d3.scaleOrdinal(d3.schemeCategory20);
        this.caption = function(d){
    			return d.borough;
    		};
        this.colour = function(d){
    			return palette(boroughs.indexOf(d.borough)%20)
    		};
        this.key = [];
        return this;
      }
    }

    var colourFromMayor = function(){
      return function(db){
        var mayorQuery = db.exec(
          "SELECT winner FROM voting ORDER BY id ASC");
        var values = mayorQuery[0].values.map(function(d){return d[0]});
        var sadiq = d3.rgb(250,15,15);
        var zac = d3.rgb(15,15,250);
        var colours = {'Sadiq Aman Khan - Labour Party' : sadiq, 'Zac Goldsmith - The Conservative Party': zac};
        this.caption = function(i){return values[i]};
        this.colour = function(i){return colours[values[i]]};
        this.key = [{
          caption:'Zac Goldsmith - The Conservative Party',
          colour: zac
        },{
          caption: 'Sadiq Aman Khan - Labour Party',
          colour: sadiq
        }];
        return this;
      }
    }

    function colourWithYears(table, column, size, db){
      var query = db.exec("SELECT DISTINCT year FROM "+table+" ORDER BY year DESC");
      var availableYears =  query[0].values.map(function(d){ return d[0]});
      function doMakeRadius(){
         var query = db.exec(
          "SELECT max("+column+"), min("+column+") FROM "+table+";"
          + "SELECT "+column+" FROM "+table+" WHERE year="+doMakeRadius.year+" ORDER BY id ASC;"
        );
        var values = query[1].values.map(function(d){return d[0]});
        var min = query[0].values[0][1];
        var max = query[0].values[0][0];
        var convert = d3.scale.sqrt().domain([fix(min),fix(max)]).range([230,20]);
        function makeColour (value){
          var n = convert(fix(value));
          return d3.rgb(n,255-n, n);
        }
        this.caption = function(i){return values[i]};
        this.colour = function(i){
          return makeColour(values[i])
        };
        this.key = [{
          caption: min,
          colour: makeColour(min)
        },{
          caption: max,
          colour: makeColour(max)
        }];
        return this;
      }

      doMakeRadius.years = availableYears.map(function(d){
        return {value:d, action: function(){
          doMakeRadius.year = d
          }}
      });
      doMakeRadius.year = availableYears.filter(function(y){return y<=2016})[0];
      return doMakeRadius;
    }

    function colourFromGenericPercent(table, column){
      return function(db){
        var query = db.exec(
          "SELECT max("+column+"), min("+column+") FROM "+table+";"
          + "SELECT "+column+" FROM "+table+" ORDER BY id ASC;"
        );
        var values = query[1].values.map(function(d){return d[0]});
        var min = query[0].values[0][1];
        var max = query[0].values[0][0];
        var convert = d3.scale.linear().domain([fix(min),fix(max)]).range([230,20]);
        function makeColour (value){
          var n = convert(fix(value));
          return d3.rgb(0,n, n);
        }
        this.caption = function(i){return values[i]};
        this.colour = function(i){
          return makeColour(values[i])
        };
        this.key = [{
          caption: min,
          colour: makeColour(min)
        },{
          caption: max,
          colour: makeColour(max)
        }];
        return this;
      }
    }

    var _colours = {
      "Borough": colourFromBorough(),
      "Proportion of social rented housing": colourWithYears(
        'housing',
        'social*100.0/(social + owned + mortgage + private_rent + other)',
        4,
        database
      ),
      "Mayoral election 2016 result": colourFromMayor(),
      "Mayoral election 2016 percentage turnout": colourFromGenericPercent('voting', 'percent_turnout'),
      "Population density (with projections)": colourWithYears('population_density', 'density', 4, database)
    };

    this.Colours = function(name){
      return _colours[name](database);
    }

    return this;
}


function LondonDataSource(){
  var _self = this;
  var _db;
  this.Centre = {long: -0.09, lat: 51.48};
  var _projection = d3.geoMercator()
        .scale(65)
        .center([_self.Centre.long, _self.Centre.lat])
        .translate([1/2,1/2]);

  this.NumberOfElements = function(){return _self.Data.length;};
  this.Init = function(){
    return loadUrl('data.db')
      .then(loadDatabase)
      .then(function(db){
        _self.Options = new LondonOptions(db);
        _self.InitialColours = _self.Options.Colours("Borough");
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
  this.InitialColours = {};
  return this.Init();
}
