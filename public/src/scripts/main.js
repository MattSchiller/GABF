var RESET = '_RESET';

var ClientUI = React.createClass({
  getInitialState: function() {
    return ({
      filters: this.props.initFilters,
      markers: this.props.initBeerData,
      mapMarkers: this._cleanseMarkers(this.props.initBeerData),
      trimmedFilters: this.props.initFilters
    });
  },
  
  _applyFilter: function(name, value, asGroup) {
    //Value will be an array if multiple objects are sent at once
    var nextFilters = this.state.filters,
        z, y, completed = false, added, nameIndex, valueIndex = false;
    
    value = [].concat(value);     //If a single value, will turn it into a list of length 1
    //console.log('_applyFilter, value:', value);
    z=0;
    while (z<nextFilters.length && !completed) {                    //Iterate through each filter name to see if it's the one we changed
      if (nextFilters[z].name===name) {                             //This is our filter
        nameIndex = z;
        y=0;
        while (y<nextFilters[z].values.length && !completed) {      //Iterate though each value in the filter
          if (asGroup) {                                            //Turn on all sent values (list), turn off the rest
            if ( ~value.indexOf( nextFilters[z].values[y][0] ) || value[0] === RESET)    //This value was sent / RESETING ALL
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
    
    let [nextMarkers, trimmedFilters] = this._filterMarkers(nextFilters, name, value, nameIndex, valueIndex);
    let nextMapMarkers = this._cleanseMarkers(nextMarkers);
    
    /*console.log('About to update state, currFilter:', this.state.filters);
    console.log('About to update state, nextFilters:', nextFilters);
    console.log('About to update state, trimmedFilters:', trimmedFilters); */
    
    
    this.setState({ filters: nextFilters, markers: nextMarkers, mapMarkers: nextMapMarkers, trimmedFilters: trimmedFilters });
  },
  
  _filterMarkers: function(nextFilters, filterName, filterVal, nameIndex, valueIndex) {
    //Removes the markers that are no longer shown/adds those that are now shown
    //Weak to filtering on multiple values, extremely weak to filtering on multiple filters
    var j, k, potentialShow,
        nextMarkers = this.state.markers,
        filterName, awardFilterValue, trimmedFilters = [], potentialTrimmed =[], tempPT;
    
    //console.log('in _fMarkers, filterVal:', filterVal);
    
    for (let filter of nextFilters) {                       //Instantiate our trimmedFilters data structure
      trimmedFilters.push({ name: filter.name, values: [] });
      potentialTrimmed.push({ name: filter.name, values: [] });
    }
    
    for (let awardRecord of nextMarkers) {                            //Iterate through each beer award record
      if (filterVal.length > 1 || filterVal[0] == RESET) {      //Was an array so we have to check prior show to .values[valueIndex][0]
        potentialTrimmed = [];
        j = 0;
        potentialShow = true;
        
        while (potentialShow && j < nextFilters.length) {             //Iterate through each filter (year, style, medal...)
          filterName = nextFilters[j].name;
          awardFilterValue = awardRecord[ filterName ];
          k = 0;
          
          while (potentialShow && k < nextFilters[j].values.length) { //Iterate through each filter item (2015, 2014, 2013...)
            if (nextFilters[j].values[k][0] === awardFilterValue) {
              //Filter and item for particular record, should app show it?
              potentialShow = nextFilters[j].values[k][1];
              potentialTrimmed[j] = { name: filterName,
                                      values: [ awardFilterValue, potentialShow ] };   //Double array to mimic data structure
              //This creates pT[j] = { name: 'year', values: ['2013', true/false] }
            }
            k++;
          }
          j++;
        }
        awardRecord['show'] = potentialShow;
        if (potentialShow) {                                          //This record is what we're showing, so we add its values to the filters
          trimmedFilters = this._addToTrimmedFilters(trimmedFilters, potentialTrimmed);
        }
        
      } else {                                                  //Was a single toggle, so we just need to see if this record had that value
        
        //console.log('filterVal:', filterVal);
        if ( awardRecord[ filterName ] === filterVal[0] ) {        //This is a record that was affected by the most recent filter change
          //console.log('_filterMarkers on:', nextMarkers[i]);
          awardRecord['show'] = nextFilters[ nameIndex ].values[ valueIndex ][1];
        }
        if (awardRecord['show']) {
          tempPT = JSON.parse(JSON.stringify(potentialTrimmed));  //Maintain PT as a header
          for (var i=0; i<tempPT.length; i++) {                   //Scoop up all the values in this shown marker
            //console.log('oh boy, awardRecord[ tempPT[i].name ]:', awardRecord[ tempPT[i].name ]);
            tempPT[i].values.push( awardRecord[ tempPT[i].name ], true );
          }
          //console.log('about to run aTTF, tempPT:', tempPT); //debugger
          trimmedFilters = this._addToTrimmedFilters(trimmedFilters, tempPT);
        }
      }
    }
    //console.log('nextFilters:', nextFilters);
   return [nextMarkers, trimmedFilters];
  },
  
  _addToTrimmedFilters: function(tF, pT) {
    var alreadyAdded, pTVal, j;
    //console.log('in aTTF, tF:', tF, 'pT:', pT);
    for (var i=0; i<tF.length; i++) {                             //Iterate through each filter ('year', 'style')
      j = 0;
      alreadyAdded = false;
      //console.log('i', i, 'pT:',pT, 'tF:', tF);
      pTVal = pT[i].values[0];
      //console.log('pTVal:', pTVal);
      while (!alreadyAdded && j < tF[i].values.length) {          //Iterate through each value ('2013', '2014')
        //console.log('tF[i].values[j][0] === pTVal', tF[i].values[j][0],'===', pTVal);
        if (tF[i].values[j][0] === pTVal) {
          alreadyAdded = true;
        }
        j++;
      }
      if (!alreadyAdded) {
        tF[i].values.push( pT[i].values );
      }
    }
    return tF;
  },
  
  _cleanseMarkers: function(markerData) {
    //Takes a robust list of markers with ['show'] = T/F and pares it down to only the markers the map needs to know
    var markerCount = [],
	      myLat, myLng, cleansedMarkers = [],
	      initMarker, cleansedIndex = 0;
	 
    for (let awardRecord of markerData) {                //Check each marker
	    if (awardRecord['show']===false) continue;           //Not showing, skip it
	    
	    myLat = awardRecord['LL'].lat;
	    myLng = awardRecord['LL'].lng;
	    initMarker = false;
	    
	    if (markerCount[ myLat +'-'+ myLng ] === undefined) {
	      initMarker = true;        //First time this location has been seen in the list
	      markerCount[ myLat +'-'+ myLng ] = cleansedIndex++;
	    }
	    
	    let markerIndex = markerCount[ myLat +'-'+ myLng ];
	    let currMarker = cleansedMarkers[ markerIndex ];     //Grab existing marker info, could be undefined
	    
	    let newMarker = this._writeMarker(currMarker, awardRecord, initMarker, markerIndex);
      cleansedMarkers[markerIndex] = newMarker;
    }
	  
	  //console.log('cleansedMarkers:', cleansedMarkers);
	  return cleansedMarkers;
	},
	
	_writeMarker: function(thisMarker, awardRecord, isNew, index) {
	//Handles converting congruent location data into a friendly marker & maintains list of awards on a marker
	  if (isNew) {
	    thisMarker = {};
      thisMarker.lat = awardRecord['LL'].lat;
      thisMarker.lng = awardRecord['LL'].lng;
      thisMarker.myCount = 0;
      thisMarker.myAwards = '';
	  }
	  //Append/Update the marker to account for another award
	  thisMarker.myCount++;
    thisMarker.hoverContent = '(' + thisMarker.myCount + ') ' + awardRecord['city'] +', '+ awardRecord['state'];
    
    thisMarker.myAwards += (
      '<div className="detailBoxItem">' +
        '<b>Year:</b> ' + awardRecord['year'] +
        ' <b>Medal:</b> ' + awardRecord['medal'] +
        ' <b>Style:</b> ' + awardRecord['style'] +
        ' <b>Beer:</b> ' + awardRecord['beer'] +
        ' <b>Brewery:</b> ' + awardRecord['brewery'] +
      '</div>'
    );
    
    return thisMarker;
	},
  
  render: function() {
    return (
      <div id='UI'>
        <MultiGraphBox mapData={this.props.mapData} markers={this.state.mapMarkers} filters={this.state.trimmedFilters}
            notify={this._applyFilter}/>
      </div>
      );
  }
});
var Map = React.createClass({
  getInitialState: function() {
    return ({ myID: 'map' });
  },

  componentDidMount: function() {
    this.lastZoomScale = 1;
    this._drawMap();
    this._drawMarkers();
    window.addEventListener('resize', this._handleResize);
  },
  componentWillUnmount: function() {
    window.removeEventListener('resize', this._handleResize);
  },
  
  componentDidUpdate: function() {
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
              
    let zoom = d3.behavior.zoom()
                .scale(1)
                .scaleExtent([1, 8])
                .on("zoom", this._zoom);
    
    this.svg = d3.select("#"+this.state.myID).append("svg")
                .attr("width", this.width)
                .attr("height", this.height);
    
    this.g = this.svg.append("g")
              .call(zoom);
              
    this.g.selectAll("path")
            .data(topojson.feature(this.props.mapData, this.props.mapData.objects.states).features)
          .enter()
            .append("path")
            .attr("d", this.path)
            .attr("class", "state")
            .attr('stroke-width', '1px')
          ;
      
    this.tooltip = d3.select("#"+this.state.myID)
                  	.append("div")
                  	.style("position", "absolute")
                  	.style("z-index", "10")
                  	.style("visibility", "hidden")
                  	;
                  	
                  	
                  	//INCLUDE CODE TO MAINTAIN MAP POSITION ON RESIZE WINDOW
  },
  
  _zoom: function() {
    this.lastZoomScale = d3.event.scale;
    
    this.g
      .transition()
        .duration(750)
        .attr("transform", function() {
          var t = d3.event.translate;
          return "translate(" + parseInt(t[0]) +','+ parseInt(t[1]) + ")scale("+ d3.event.scale +")";
        })
        ;
        
    this.g.selectAll('.mark, .state')
      .transition()
        .duration(750)
        .attr("stroke-width", function() {
          return (1/d3.event.scale).toFixed(2) +"px";
        })
        .attr('r', function(d) {
          return Math.max(2, Math.min(d.myCount/2, 6) )/d3.event.scale + 'px'; })
        ;
  },
  
  _drawMarkers: function() {
    var svg = this.svg;
    var projection = this.projection;
    var tooltip = this.tooltip;
    var g = this.g;
    var lastZoomScale = this.lastZoomScale;
    
    var markers = this.g.selectAll(".mark")
                    .data(this.props.markers)
        //Update existing markers
                    .attr('class','mark')
                    .attr('r', function(d) {
                      return Math.max(2, Math.min(d.myCount/2, 6) )/lastZoomScale + 'px'; })
                    .attr("transform", function(d) {
                        if ( projection([ d.lng, d.lat ]) === null) {
                          console.log('in a null circle, d:', d);
                          return 'translate(0, 0)';
                        }
                        return "translate(" + projection([ d.lng, d.lat ]) + ")";
                      })
                      //Stroke-Width handled in g zoom with states
                    ;
                    
        //Delete old markers
        markers.exit().remove();
         
        //Create newly shown markers
        markers.enter()
                .append("circle")
                .attr('class','mark')
                .attr("stroke-width", function() {
                        return (1/lastZoomScale).toFixed(2) +"px";})
                .attr('r', function(d) {
                  return Math.max(2, Math.min(d.myCount/2, 6) )/lastZoomScale + 'px';
                })
                .attr("transform", function(d) {
                    if ( projection([ d.lng, d.lat ]) === null) {
                      console.log('in a null circle, d:', d);
                      return 'translate(0, 0)';
                    }
                    return "translate(" + projection([ d.lng, d.lat ]) + ")";
                  })
                .on("click", __showDetails)
                .on("mouseover", __showSummary)
                .on("mouseout", __hideSummary)
                ;

    function __showDetails(d) {
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
    
    function __showSummary(d) {
      var showTT = tooltip
                    .style("visibility", "visible")
                    .attr('class', 'summary')
                  	.text(d.hoverContent)
                  	.style("top", ( projection([ d.lng, this.__data__.lat ])[1] -10) + "px" )   //-10 so is above cursor
                  	.style("left", ( projection([ d.lng, this.__data__.lat ])[0] +10) + "px" )
                  	;
    };
    
    function __hideSummary(d) {
      console.log('Hiding summary for "this":', this);
      var hideTT = tooltip
                    .style('visibility', 'hidden')
                    .style("top", ( "0px" ) )
                  	.style("left", ( "0px" ) )
                  ;
    };
  },
	  
  render: function() {
    //console.log('rendering Map');
    return (
			<div id="map-holder">
				<div id={this.state.myID} />
				<div id='markerCounter'>{this.props.markers.length}</div>
			</div>
		);
  },
});
var MultiGraphBox = React.createClass({
  getInitialState: function() {
    return { supportedGraphs: ['Awards', 'Entries'],
             graphShowing: 'Awards' }
  },
  
  _changeGraph: function(e) {
    let myGraph = e.target.getAttribute('data-name');
    this.setState({ graphShowing: myGraph });
  },
  
  render: function() {
    let graphToShow = {};
    return (
      <div id='multiGraph' >
        <div id="map-frame">
          <Map markers={this.props.markers} mapData={this.props.mapData} />
          <div id='tabBox' >
            {
              this.state.supportedGraphs.map(function(graph, i) {
                //console.log('drawing tabs, state:', this.state);
                let tabClass = '';
                if (graph===this.state.graphShowing) tabClass = ' currTab';
                return (
                  <div key={i} className={'graphTab'+tabClass} data-name={graph} onClick={this._changeGraph}>
                    {graph}
                  </div> );
              }.bind(this) )
            }
          </div>
        </div>
        <FilterBox filters={this.props.filters} notify={this.props.notify}/>
        <DetailsBox content={} />
      </div>
    );
  }
})
var DetailsBox - React.createClass({
  render: function() {
    if (this.props.content === 'BLANK') return <div />
    return (
      <div id={'detailsBox'} >
        {this.props.content}
      </div>
      );
  }
  
})

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
    e.preventDefault();
    var keyCode = e.keyCode || e.which;
    let ENTERKEY = 13, TABKEY = 9;                    //Tab is ignored in the text boxes
    if (keyCode !==ENTERKEY && keyCode !==TABKEY) {   //Something other than Enter/Tab
      this.setState({ mySearch: e.target.value, showItems: true });
      
    } else if (keyCode===ENTERKEY) { //Enter
      var valsToSend = this.props.values.map(function(value, i) {
        if (~value[0].toLowerCase().indexOf(this.state.mySearch.toLowerCase() ) )
          return value[0];
      }.bind(this) );
      
      //ABILITY TO RESET FILTER
      if (this.state.mySearch === '') {
        console.log('valsToSend is NULL');
        valsToSend = RESET;
      }
      
      this.props.notify(this.props.name, valsToSend, true);
    }
  },
  render: function() {
    var myItems=[];
    if (this.state.showItems) {
      //console.log('in filter render, this.props.values:', this.props.values);
      myItems = this.props.values.map(function(value, i) {
        //console.log('in filter render, value:', value); //debugger;
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




