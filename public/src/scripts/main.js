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
        <Map markers={this.state.markers} />
        <FilterBox filters={this.state.filters} notify={this._applyFilter}/>
      </div>
      );
  }
});
var Map = React.createClass({
  componentWillMount: function() {
    this.numMarkers = this.props.markers.length;
    console.log(this.numMarkers);
  },
  
  componentDidMount: function() {
    this.componentWillUpdate( this.props );
  },
  
	componentWillUpdate: function(nextProps){
		var myMarkers;
		this.map = new GMaps({
			div: '#map',
			lat: 37.09024,
      lng: -95.712891,
      zoom: 4
		});
		
		myMarkers = this._massageMarkers(nextProps);
		
		for (var z=0; z<myMarkers.length; z++){
		  this.map.addMarker(myMarkers[z]);
		}
		
		//console.log('In Map, myMarkers:', myMarkers);
	},
	
	_massageMarkers: function(nextProps) {
	  var myMarkers = [],
	      markerCount = [],
	      y = 0,
	      myLat, myLng, markerIndex;
	      
	  for (var z=0; z<nextProps.markers.length; z++) {                //Check each marker
	    if (nextProps.markers[z]['show']===false) continue;           //Not showing, skip it
	    myLat = nextProps.markers[z]['LL'].lat;
	    myLng = nextProps.markers[z]['LL'].lng;
	    if (markerCount[ myLat +'-'+ myLng ] === undefined) {         //First time this location has been seen in the list
	      markerCount[ myLat +'-'+ myLng ] = 1;
	      myMarkers = this._writeMarker(myMarkers, nextProps.markers[z], true);
        y++;
	    } else {                                                      //We've seen this location before
	      markerIndex = this._findMarker(myMarkers, myLat, myLng);
	      if (markerIndex > -1) {                                     //We've found our former marker index
	        this._writeMarker(myMarkers, nextProps.markers[z], false, markerIndex);
	      }
	    }
	  }
	  
	  this.numMarkers = y;
	  return myMarkers;
	},
	
	_findMarker: function(myMarkers, lat, lng) {
	  var z = 0;
	  while (z<myMarkers.length) {
	    if (myMarkers[z].lat === lat && myMarkers[z].lng === lng) return z;
	    z++;
	  }
	  return -1;
	},
	
	_writeMarker: function(myMarkers, awardRecord, isNew, y) {
	  //Handles converting data into the gMaps friendly marker data & maintains list of awards on a marker
	  
	  if (isNew) {
	    myMarkers.push( {} );
	    y = myMarkers.length-1;
	    
      myMarkers[y].lat = awardRecord['LL'].lat;
      myMarkers[y].lng = awardRecord['LL'].lng;
      
      myMarkers[y].myCount = 0;
 
      myMarkers[y].mouseover = function(e){                                   //On hover, show: (count) City, ST
        masterInfoWindow.close();
        masterInfoWindow.setContent(this.hoverContent);
        masterInfoWindow.open(this.map, this);
      };
      myMarkers[y].mouseout = function(){
        masterInfoWindow.close();
      };
      
      myMarkers[y].myAwards = '';
	  }
	  
	  
	  //Write to the marker some formatting and such
	  myMarkers[y].myCount++;
	    
    if (myMarkers[y].myCount > 9) myMarkers[y].label = '+';
    else myMarkers[y].label = String( myMarkers[y].myCount );
 
    myMarkers[y].hoverContent = '(' + myMarkers[y].myCount + ') ' + awardRecord['city'] +', '+ awardRecord['state'];
    
    myMarkers[y].myAwards += (
      '<div id="awardView">' +
        'Year: ' + awardRecord['year'] +
        ' Medal: ' + awardRecord['medal'] +
        ' Style: ' + awardRecord['style'] + /*
      year:     awardRecord['year'],
      medal:    awardRecord['medal'],
      beer:     awardRecord['beer'],
      brewery:  awardRecord['brewery'],
      city:     awardRecord['city'],
      state:    awardRecord['state'],
      style:    */
      '</div>'
    );
    
    myMarkers[y].click = function(e) {
      masterInfoWindow.close();
      masterInfoWindow.setContent(this.myAwards);
      masterInfoWindow.open(this.map, this);
    };
	    
	  return myMarkers;
	},
	
	render: function() {
	  //console.log('rendering, numMarkers:',this.numMarkers);
		return (
			<div id="map-holder">
				<p id='loading'>Loading map...</p>
				<div id='map'></div>
				<div id='markerCounter'>{this.numMarkers}</div>
			</div>
		);
	}

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

function pullData(dir, locFile, awardsFile) {
  var fileReturn = new XMLHttpRequest(),
      fileReturn2 = new XMLHttpRequest(),
      myRequests = [];
      
  myRequests.push(false);
  myRequests.push(false);

  fileReturn.onreadystatechange = function() {
    if (fileReturn.readyState==4 && fileReturn.status==200)
    {
      myRequests[0]=true;
      if (myRequests[0]===myRequests[1]) massage();
    }
  }
  fileReturn2.onreadystatechange = function() {
    if (fileReturn2.readyState==4 && fileReturn2.status==200)
    {
      myRequests[1]=true;
      if (myRequests[0]===myRequests[1]) massage();
    }
  }
  
  fileReturn.open("GET", dir+locFile, true);
  fileReturn.send();
  fileReturn2.open("GET", dir+awardsFile, true);
  fileReturn2.send();
  
  var massage = function() {
  //Data Massage
    var latLongs = $.csv.toObjects(fileReturn.responseText),
        awards = $.csv.toArrays(fileReturn2.responseText),
        finalData = [], row = [], year, style, ttl = [],
        gold, silver, bronze,
        rI;
        
    //console.log(awards);
        
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
        row[rI]['LL'] = findLL(latLongs, row[rI]['city'] + ', ' + row[rI]['state'])
        rI++;
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
    makeFilters(row, ttl);
  }
  
  var makeFilters = function(beerData, ttl) {
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
    runPage(beerData, filterData);
  }
  
  var runPage = function(beerData, filterData) {
    //Entry into site view
    ReactDOM.render(  //Render page after underlying data has loaded
      <ClientUI initBeerData={beerData} initFilters={filterData} />,
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
  return { lat: 0, lng: 0 };
}

//Page begin:
pullData('json_data/', 'lat_long_20160223.csv', 'compiled_info.csv');




