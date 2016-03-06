var masterInfoWindow = new google.maps.InfoWindow();

var ClientUI = React.createClass({
  getInitialState: function() {
    return ({
      filters: this.props.initFilters,
      markers: this.props.initBeerData
    });
  },
  
  _applyFilter: function(name, value, asGroup) {
    //Value will be an array if multiple objects are sent at once
    var nextFilters = this.state.filters,
        nextMarkers,
        z, y, completed = false, added, nameIndex, valueIndex = false;
    
    value = [].concat(value);     //If a single value, will turn it into a list of length 1
    
    z=0;
    while (z<nextFilters.length && !completed) {                    //Iterate through each filter name to see if it's the one we changed
      if (nextFilters[z].name===name) {                             //This is our filter
        nameIndex = z;
        y=0;
        while (y<nextFilters[z].values.length && !completed) {      //Iterate though each value in the filter
          if (asGroup) {                                            //Turn on all sent values (list), turn off the rest
            if ( ~value.indexOf( nextFilters[z].values[y][0] ) )    //This value was sent
              nextFilters[z].values[y][1] = true;
            else                                                    //This value was not
              nextFilters[z].values[y][1] = false;
          } else {                                                  //Operate under the assumption of only a single value to toggle was sent
            if (nextFilters[z].values[y][0] === value[0] ) {        //This is our single value, toggle it
              nextFilters[z].values[y][1] = !nextFilters[z].values[y][1];
              valueIndex = y;
              completed = true;
            }
          }
          y++;
        }
        completed = true;
      }
      z++;
    }
    
    nextMarkers = this._filterMarkers(nextFilters, name, value, nameIndex, valueIndex);
    this.setState({ filters: nextFilters, markers: nextMarkers });
  },
  
  _filterMarkers: function(nextFilters, filterName, filterVal, nameIndex, valueIndex) {
    //Removes the markers that are no longer shown/adds those that are now shown
    //Weak to filtering on multiple values, extremely weak to filtering on multiple filters
    var j, k, potentialShow,
        nextMarkers = this.state.markers;
        
    for (var i=0; i<nextMarkers.length; i++) {                        //Iterate through each beer award record
      //console.log( 'filterName:', filterName, 'nextMarkers[i][ filterName ]:', nextMarkers[i][ filterName ], 'filterVal:', filterVal);
      
      if (filterVal.length > 1) {                               //Was an array so we have to check prior show to .values[valueIndex][0]
        j = 0;
        potentialShow = true;
        while (potentialShow && j < nextFilters.length) {             //Iterate through each filter (year, style, medal...)
          k = 0;
          while (potentialShow && k < nextFilters[j].values.length) { //Iterate through each filter item (2015, 2014, 2013...)
            if (nextFilters[j].values[k][0] === nextMarkers[i][ nextFilters[j].name ]) {
              //Filter and item for particular record, should I show it?
              potentialShow = nextFilters[j].values[k][1];
            }
            k++;
          }
          j++;
        }
        nextMarkers[i]['show'] = potentialShow;
        
      } else {                                                  //Was a single toggle, so we just need to see if this record had that value
        if ( nextMarkers[i][ filterName ] === filterVal[0] ) {        //This is a record that was affected by the most recent filter change
          //console.log('_filterMarkers on:', nextMarkers[i]);
          nextMarkers[i]['show'] = nextFilters[ nameIndex ].values[ valueIndex ][1];
        }
      }
    }
    
   return nextMarkers;
  },
  
  render: function() {
    return (
      <div id='UI'>
        <Map mapData={this.props.mapData} markers={this.state.markers} />
        <FilterBox filters={this.state.filters} notify={this._applyFilter}/>
      </div>
      );
  }
});
var Map = React.createClass({
  getInitialState: function() {
    return ({ myID: 'map' });
  },
  
  componentWillMount: function() {
    this.numMarkers = this.props.markers.length;
  },
  
  componentDidMount: function() {
    this._drawMap();
    this._massageMarkers(this.props)
    this._drawMarkers();
    window.addEventListener('resize', this._handleResize);
  },
  componentWillUnmount: function() {
    window.removeEventListener('resize', this._handleResize);
  },
  
  componentWillUpdate: function(nextProps) {
    this._massageMarkers(nextProps)
    this._drawMarkers();
  },
  
  _handleResize: function() {
    //console.log("I'll add the code for resizing later");
    d3.select('svg').remove();
    this._drawMap();
    this._drawMarkers();
  },
  
  _drawMap: function() {
    this.width = parseInt(d3.select("#"+this.state.myID).style('width'));
    this.mapRatio = 0.5;
    this.height = this.width * this.mapRatio;
        
    this.projection = d3.geo.albersUsa()
                      .scale(this.width)
                      .translate([this.width/2,this.height/2]);
    
    this.path = d3.geo.path()
                .projection(this.projection);
        
    this.zoom = d3.behavior.zoom()
                .translate(this.projection.translate())
                .scale(this.projection.scale())
                .scaleExtent([this.width, 8*this.width])
                //.on("zoom", this._zoom);
    
    this.svg = d3.select("#"+this.state.myID).append("svg")
                .attr("width", this.width)
                .attr("height", this.height);
    
    this.g = this.svg.append("g")
              .call(this.zoom);
    
    this.g.selectAll("path")
        .data(topojson.feature(this.props.mapData, this.props.mapData.objects.states).features)
      .enter()
        .append("path")
        .attr("d", this.path)
        .attr("class", "state")
      ;
      
    this.tooltip = d3.select("#"+this.state.myID)
                  	.append("div")
                  	.style("position", "absolute")
                  	.style("z-index", "10")
                  	.style("visibility", "hidden")
                  	;
  },
  
  _zoom: function() {
    //IGNORE THIS FUNCTION, IT BLOWS UP THE MARKERS LIKE A PIECE OF SHIT
    this.projection.translate(d3.event.translate).scale(d3.event.scale);
    console.log('d3.event.scale:',d3.event.scale);
    this.g.selectAll("path")
        .attr("d", this.path);
    
    
    
    this.g.selectAll(".mark")
      .transition()
        .duration(750)
        .attr("transform", function(d) {
          //var t = d3.transform(d3.select(this).attr("transform")).translate;//maintain aold marker translate
          return "translate(" + 1/parseInt(d3.event.translate[0]) +','+ 1/parseInt(d3.event.translate[1]) + ")scale("+d3.event.scale +")";//inverse the scale of parent
        });
   
    /*
    this.g.selectAll(".mark")
      .transition()
        .duration(750)
        .attr("transform", function(d) {
          //var t = d3.transform(d3.select(this).attr("transform")).translate;
          return "translate(" + d.lng +","+ d.lat// + ")scale("+ d3.event.scale
            + ")";
        });*/
  },
  
  _drawMarkers: function() {
    console.log(this.myMarkers);
    
    var svg = this.svg;
    var projection = this.projection;
    var tooltip = this.tooltip;
    
    var markers = this.g.selectAll(".mark")
                    .data(this.myMarkers)
                  .enter()
                    .append("circle")
                    .attr('class','mark')
                    .attr('r', function(d) { return Math.min(d.myCount/2, 5) + 'px';
                    })
                    .attr("transform", function(d) {
                        if ( projection([ d.lng, d.lat ]) === null) {
                          console.log('in a null circle, d:', d);
                          return 'translate(0, 0)';
                        }
                        return "translate(" + projection([ d.lng, d.lat ]) + ")";
                      })
                    .on("click", showDetails)
                    .on("mouseover", showSummary)
                    .on("mouseout", hideSummary);
                    
    function showDetails(d) {
      console.log('Showing details for "this":', this);
      
        /*
      var summary = d3.select("#map")
                      .data(this.__data__)
                    .enter()
                      .append('div')
                      .attr('class', 'summary')
                      .style('z-index', '15')
                      //.attr('transform', function(d) {
                      //    return 'translate(' + projection([ d.lng, d.lat ]) + ")";
                      //  })
                      .attr('text', function(d) { return d.hoverContent; })
                      ;
                      */
      
      
    };
    
    function showSummary(d) {
      //console.log('Showing summary for "this":', this.__data__);
      //console.log('svg:', svg);
      //console.log('proj, etc:', projection([ this.__data__.lng, this.__data__.lat ])[0]);
      
      var showTT = tooltip
                    .style("visibility", "visible")
                    .attr('class', 'summary')
                  	.text(d.hoverContent)
                  	.style("top", ( projection([ d.lng, this.__data__.lat ])[1] ) + "px" )
                  	.style("left", ( projection([ d.lng, this.__data__.lat ])[0] ) + "px" )
                  	//.attr('transform', 'translate(' + projection([ this.__data__.lng, this.__data__.lat ]) + ")")
                  	;
    };
    
    function hideSummary(d) {
      console.log('Hiding details for "this":', this);
      var hideTT = tooltip
                    .style('visibility', 'hidden')
                    .style("top", ( "0px" ) )
                  	.style("left", ( "0px" ) )
                  ;
    };
  },
  
	_massageMarkers: function(myProps) {
    var markerCount = [],
	      y = 0,
	      myLat, myLng, markerIndex;
	      
    this.myMarkers = [];
	      
	  for (var z=0; z<myProps.markers.length; z++) {                //Check each marker
	    if (myProps.markers[z]['show']===false) continue;           //Not showing, skip it
	    
	    myLat = myProps.markers[z]['LL'].lat;
	    myLng = myProps.markers[z]['LL'].lng;
	    
	    if (markerCount[ myLat +'-'+ myLng ] === undefined) {         //First time this location has been seen in the list
	      markerCount[ myLat +'-'+ myLng ] = 1;
	      this._writeMarker(myProps.markers[z], true);
        y++;
	    } else {                                                      //We've seen this location before
	      markerIndex = this._findMarker(myLat, myLng);
	      if (markerIndex > -1) {                                     //We've found our former marker index
	        this._writeMarker(myProps.markers[z], false, markerIndex);
	      }
	    }
	  }
	  
	  this.numMarkers = y;
	  this.myMarkers;
	},
	
	_findMarker: function(lat, lng) {
	  var z = 0;
	  while (z<this.myMarkers.length) {
	    if (this.myMarkers[z].lat === lat && this.myMarkers[z].lng === lng) return z;
	    z++;
	  }
	  return -1;
	},

	_writeMarker: function(awardRecord, isNew, y) {
	  //Handles converting congruent location data into a friendly marker & maintains list of awards on a marker
	  
	  if (isNew) {
	    this.myMarkers.push( {} );
	    y = this.myMarkers.length-1;
	    
      this.myMarkers[y].lat = awardRecord['LL'].lat;
      this.myMarkers[y].lng = awardRecord['LL'].lng;
      
      this.myMarkers[y].myCount = 0;
 
      /*myMarkers[y].mouseover = function(e){                                   //On hover, show: (count) City, ST
        masterInfoWindow.close();
        masterInfoWindow.setContent(this.hoverContent);
        masterInfoWindow.open(this.map, this);
      };
      */
      
      this.myMarkers[y].myAwards = '';
	  }
	  
	  
	  //Write to the marker some formatting and such
	  this.myMarkers[y].myCount++;
	  
    this.myMarkers[y].hoverContent = '(' + this.myMarkers[y].myCount + ') ' + awardRecord['city'] +', '+ awardRecord['state'];
    
    this.myMarkers[y].myAwards += (
      '<div id="awardView">' +
        '<b>Year:</b> ' + awardRecord['year'] +
        ' <b>Medal:</b> ' + awardRecord['medal'] +
        ' <b>Style:</b> ' + awardRecord['style'] +
        ' <b>Beer:</b> ' + awardRecord['beer'] +
        ' <b>Brewery:</b> ' + awardRecord['brewery'] +
      '</div>'
    );
	},
	  
  render: function() {
    console.log('rendering Map');
    return (
			<div id="map-holder">
				<p id='loading'>Loading map...</p>
				<div id={this.state.myID}></div>
				<div id='markerCounter'>{this.numMarkers}</div>
			</div>
		);
  },
});
var FilterBox = React.createClass({
  render: function() {
    //console.log("Rendering FilterBox, props:",this.props.filters);
    return(
      <div className='filterBox'>
        {
          this.props.filters.map(function(filter, i) {
            return (<Filter key={i} name={filter.name} values={filter.values} notify={this.props.notify} />);
          }.bind(this) )
        }
      </div>
    );
  }
});
var Filter = React.createClass({
  getInitialState: function() {
    return { showItems: false
            ,mySearch: ''
    };
  },
  componentDidMount: function() {
    window.addEventListener('click', this._toggleCheck);
  },
  componentWillUnmount: function() {
    window.removeEventListender('click', this._toggleCheck);
  },
  _toggleCheck: function(e) {//To close menu if user clicks anywhere else
    if (e.target.getAttribute('data-filter')!==this.props.name) this.setState({showItems:false});
    //else this.setState({showItems:true});
  },
  _toggleShow: function() {
    this.setState({showItems:!this.state.showItems});
  },
  _search: function(e) {
    e.stopPropagation();
    var keyCode = e.keyCode || e.which;
    
    if (keyCode !==13) {  //Something other than Enter
      this.setState({ mySearch: e.target.value });
      
    } else { //Enter
      var valsToSend = this.props.values.map(function(value, i) {
        
        if (~value[0].toLowerCase().indexOf(this.state.mySearch.toLowerCase() ) )
          return value[0];
      }.bind(this) );
      
      this.props.notify(this.props.name, valsToSend, true);
    }
  },
  render: function() {
    var myItems=[];
    if (this.state.showItems) {
      myItems = this.props.values.map(function(value, i) {
        if (~value[0].toLowerCase().indexOf(this.state.mySearch.toLowerCase() ) )
          return <FilterItem key={i} value={ value[0] } selected={ value[1] } name={this.props.name} notify={this.props.notify} /> ;
      }.bind(this) );
    }
    return (
      <div className='filter' filter={this.props.name} >
        <input placeholder={this.props.name} onClick={this._toggleShow} onKeyUp={this._search} data-filter={this.props.name} />
        <div className='filterSelection'> {myItems} </div>
      </div>
    );
  }
});
var FilterItem = React.createClass({
  getDefaultProps: function() {
    return { selected:true };
  },
  _handleSelection: function(e) {
    console.log('Toggling selected for',this.props.name,':',this.props.value);
    this.props.notify(this.props.name, this.props.value, false);
  },
  render: function() {
    var selectionClass = '';
    if (this.props.selected) selectionClass='filterOn';
    return (
      <div onClick={this._handleSelection} className={selectionClass} data-filter={this.props.name} >
        { this.props.value }
      </div>
    );
  }
});

function pullData(dir, locFile, awardsFile, mapFile) {
  var fileReturn = new XMLHttpRequest(),
      fileReturn2 = new XMLHttpRequest(),
      mapReturn = new XMLHttpRequest(),
      myRequests = [];
      
  myRequests.push(false);
  myRequests.push(false);
  myRequests.push(false);

  fileReturn.onreadystatechange = function() {
    if (fileReturn.readyState==4 && fileReturn.status==200)
    {
      myRequests[0]=true;
      if (myRequests[0]===myRequests[1] && myRequests[1]===myRequests[2]) massage();
    }
  }
  fileReturn2.onreadystatechange = function() {
    if (fileReturn2.readyState==4 && fileReturn2.status==200)
    {
      myRequests[1]=true;
      if (myRequests[0]===myRequests[1] && myRequests[1]===myRequests[2]) massage();
    }
  }
  mapReturn.onreadystatechange = function() {
    if (mapReturn.readyState==4 && mapReturn.status==200)
    {
      myRequests[2]=true;
      //console.log('just got mapData:', mapReturn.responseText);
      if (myRequests[0]===myRequests[1] && myRequests[1]===myRequests[2]) massage();
    }
  }
  
  fileReturn.open("GET", dir+locFile, true);
  fileReturn.send();
  fileReturn2.open("GET", dir+awardsFile, true);
  fileReturn2.send();
  mapReturn.open("GET", dir+mapFile, true);
  mapReturn.send();
  
  var massage = function() {
  //Data Massage
    var latLongs = $.csv.toObjects(fileReturn.responseText),
        awards = $.csv.toArrays(fileReturn2.responseText),
        map = JSON.parse(mapReturn.responseText),
        finalData = [], row = [], year, style, ttl = [],
        gold, silver, bronze,
        rI,
        tempLL;
    
    if (awards.length<2) {
      console.log('aborting due to length'); return;
    }
    
    ttl = ['show', 'year', 'style', 'medal', 'beer', 'brewery', 'city', 'state', 'LL' ];
    
    rI = 0;
    for (var i=1; i<awards.length; i++) {
      gold = false; silver = false; bronze = false;
      for (var j=0; j<awards[0].length; j++) {
        switch (awards[0][j]) {
          case 'year':
           year = awards[i][j]; break;      //dat['year'] = '2013'
          case 'cat_name':
            style = awards[i][j]; break;   //dat['style'] = 'IPA'
          case 'gold_beer':
            if (awards[i][j]!=='') gold = true; break;
          case 'silver_beer':
            if (awards[i][j]!=='') silver = true; break;
          case 'bronze_beer':
            if (awards[i][j]!=='') bronze = true; break;
        }
      }
        
      //Copy contest data into entry record
      if (gold) {
        row[rI] = [];
        row[rI]['show'] = true;
        row[rI]['year'] = year;
        row[rI]['style'] = style;
        row[rI]['medal'] = 'gold';
        row[rI]['beer'] = awards[i][4];           //gold_beer
        row[rI]['brewery'] = awards[i][5];        //gold_brewery
        row[rI]['city'] = awards[i][6];           //gold_city
        row[rI]['state'] = awards[i][7];          //gold_state
        tempLL = findLL(latLongs, row[rI]['city'] + ', ' + row[rI]['state'])
        if (tempLL !== false) {
          row[rI]['LL'] = tempLL;
          rI++;
        } else row[rI] = [];
      }
      if (silver) {
        row[rI] = [];
        row[rI]['show'] = true;
        row[rI]['year'] = year;
        row[rI]['style'] = style;
        row[rI]['medal'] = 'silver';
        row[rI]['beer'] = awards[i][8];            //_beer
        row[rI]['brewery'] = awards[i][9];         //_brewery
        row[rI]['city'] = awards[i][10];           //_city
        row[rI]['state'] = awards[i][11];          //_state
        row[rI]['LL'] = findLL(latLongs, row[rI]['city'] + ', ' + row[rI]['state'])
        rI++;
      }
      if (bronze) {
        row[rI] = [];
        row[rI]['show'] = true;
        row[rI]['year'] = year;
        row[rI]['style'] = style;
        row[rI]['medal'] = 'bronze';
        row[rI]['beer'] = awards[i][12];           //_beer
        row[rI]['brewery'] = awards[i][13];        //_brewery
        row[rI]['city'] = awards[i][14];           //_city
        row[rI]['state'] = awards[i][15];          //_state
        row[rI]['LL'] = findLL(latLongs, row[rI]['city'] + ', ' + row[rI]['state'])
        rI++;
      }
    }
    makeFilters(row, ttl, map);
  }
  
  var makeFilters = function(beerData, ttl, map) {
    var filterData = [],
        theseVals = [], myValues = [],
        temp;
    
    for (var y=1; y<ttl.length-1; y++) {
      theseVals = [];
      myValues[ ttl[y] ] = [];
      
      for (var z=0; z<beerData.length; z++) {                               //Ignore 'show' andf 'LL' for filters
        temp = beerData[z][ ttl[y] ];
        if (theseVals.indexOf( temp ) === -1 )  {          //If value not represented, add it
          theseVals.push( temp );
          myValues[ ttl[y] ].push( [ temp, true ] );
        }
      }
    }
    
    for (var x=1; x<ttl.length-1; x++) {
      filterData.push(
          {
            name: ttl[x],
            values: myValues[ ttl[x] ]
          }
        );
    }
    
    //console.log('filter data:',filterData);
    //console.log('marker data:',beerData);
    runPage(beerData, filterData, map);
  }
  
  var runPage = function(beerData, filterData, mapData) {
    //Entry into site view
    ReactDOM.render(  //Render page after underlying data has loaded
      <ClientUI initBeerData={beerData} initFilters={filterData} mapData={mapData} />,
      document.getElementById('content')
    );
  }
}
     
var findLL = function(latLongs, location) {
  var z = 0, found = false;
  while (z < latLongs.length && !found) {
    if (latLongs[z].location == location) {
      found=true;
      return { lat: latLongs[z].lat, lng: latLongs[z].lng };
    }
    z++;
  }
  //console.log('no lat long found for:',location);
  return false;
}

//Page begin:
pullData('json_data/', 'lat_long_20160223.csv', 'compiled_info.csv', 'US.json');




