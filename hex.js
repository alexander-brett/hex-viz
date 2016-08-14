var size = 600;

function GridPresentation(root, dataSource){
    var grid = new HexGrid(size, dataSource.Data.length);

    grid.assign(dataSource.Data);

    root.selectAll('.fakeNode').data(dataSource.Data)
      .enter().append('polygon')
      .attr('points', '0,1 0.866,0.5 0.866,-0.5 0,-1 -0.866,-0.5 -0.866,0.5')
      .style('fill', 'rgba(0,0,0,0.2)').attr('transform', function(d){
        return 'translate('+d.screenX+','+d.screenY+') scale('+grid.gridSpacing/Math.sqrt(3)+')';
      }).style('fill', function(d){
        return dataSource.InitialColours.colour(d);
      });
}

new LondonDataSource().then(function(dataSource){
  var svg = d3.select('#hex')
    .append('svg')
    .attr('width', size)
    .attr('height', size);
  GridPresentation(svg, dataSource);
});
