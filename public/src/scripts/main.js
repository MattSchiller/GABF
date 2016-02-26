var ClientUI = React.createClass({
  getInitialState: function() {
    return ({
      filters: this.props.initFilters,
      markers: this.props.initBeerData
    });
  },
  
  _applyFilter: function(name, value) {
    var nextFilters = this.state.filters;
    for(var z=0; z<nextFilters.length; z++) {
      if (nextFilters[z].name===name) {
        for(var y=0; y<nextFilters[z].values.length; y++) {
          if (nextFilters[z].values[y][0]===value)
            nextFilters[z].values[y][1]=!nextFilters[z].values[y][1];
        }
      }
    }
    this.setState({ filters: nextFilters, markers: this._filterMarkers(nextFilters) });
  },
  
  _filterMarkers: function(nextFilters) {
    var z, excluded, checked, nextMarkers = this.state.markers;
    for (var i=0; i<nextMarkers.length; i++) {              //Iterate through each beer award record
      z = 0;
      excluded = false;
      while (z<nextFilters.length && !excluded) {           //Iterate through all of the filters (year, style, etc)
        y=0;
        checked = false;
        while (y<nextFilters[z].values.length && !excluded && !checked) {      //Iterate through all of the items within the filter (2013, 2014, etc)
          if ( nextFilters[z].values[y][0] === nextMarkers[i][ nextFilters[z].name ] ) {   //This is the filter + item for this record
            checked = true;
            if (nextFilters[z].values[y][1] === false) {
              excluded = true;
              nextMarkers[i]['show'] = false;
            } else nextMarkers[i]['show'] = true;
          }
          y++;
        }
        z++;
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
	componentDidMount(){
		this.componentDidUpdate();  // Makes sure we call update on first mount
	},
	componentDidUpdate(){
		var map = new GMaps({
			div: '#map',
			lat: 37.09024,
      lng: -95.712891,
      zoom: 4
		}),
		myMarkers = this._massageMarkers();
		
		for (var z=0; z<myMarkers.length; z++){
		  map.addMarker(myMarkers[z]);
		}
	},
	
	_massageMarkers: function() {
	  var myMarkers;// = this.props.markers;
	  for (var z=0; z<this.props.markers.length; z++) {
	    myMarkers[z] = {};
	    myMarkers[z].lat = this.props.markers[z]['LL'].lat;
	    myMarkers[z].lng = this.props.markers[z]['LL'].lng;
      myMarkers[z].infoWindow = {
        content: this.props.markers[z]['city']+', '+this.props.markers[z]['state']
      };
      myMarkers[z].mouseover = function(e){
        this.infoWindow.open(this.map, this);
      };
      myMarkers[z].mouseout = function(){
        this.infoWindow.close();
      };
	  }
	},
	
	render: function() {
		return (
			<div id="map-holder">
				<p id='loading'>Loading map...</p>
				<div id="map"></div>
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
    var nextSearch = '';
    this.setState({ mySearch:e.target.value });
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
        <input placeholder={this.props.name} onClick={this._toggleShow} onChange={this._search} data-filter={this.props.name} />
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
    this.props.notify(this.props.name, this.props.value);
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

function pullData(dir, locFile, awardsFile)
{
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
    for (var i=1; i<100; i++) {
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
    
    console.log('filter data:',filterData);
    console.log('marker data:',beerData);
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




