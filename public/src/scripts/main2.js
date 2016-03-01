var ClientUI = React.createClass({
  getInitialState: function() {
    return ({ filters: [
              { name: 'year', values: [ [ '2013',true ], [ '2014',true ], [ '2015',true ] ] }
             ,{ name: 'style', values: [ [ 'American Pale',true ], [ 'Irish Stout',true ], [ 'English Bitter',true ], [ 'Hefewiezen',true ] ] }
            ]
    });
  },
  componentDidMount: function() {
    this._pullData('json_data/lat_long_20160223.csv', this.setState());
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
    this.setState({filters:nextFilters});
  },
  
  _pullData: function(filepath, updateMe) {
    var fileReturn = new XMLHttpRequest();
    fileReturn.onreadystatechange = function()
    {
      if (fileReturn.readyState==4 && fileReturn.status==200)
      {
        var entireDataFile = $.csv.toObjects(fileReturn.responseText);
        
        //Data Massage
        for (var z=0; z<entireDataFile.length; z++) {
         entireDataFile[z].infoWindow = {
            content: entireDataFile[z].location
          };
          entireDataFile[z].mouseover = function(e){
            this.infoWindow.open(this.map, this);
          };
          entireDataFile[z].mouseout = function(){
            this.infoWindow.close();
          };
        }
        updateMe({})
      }
    }
    fileReturn.open("GET", x, true);
    fileReturn.send();
  },
  
  render: function() {
    return (
      <div id='UI'>
        <Map locData={this.props.locData} />
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
		});
		for (var z=0; z<this.props.locData.length; z++){
		  map.addMarker(this.props.locData[z]);
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


ReactDOM.render(  //Render page after underlying data has loaded
  <ClientUI locData={entireDataFile} />,
  document.getElementById('content')
);

