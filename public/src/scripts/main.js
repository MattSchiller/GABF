var RESET = '_RESET';
var MAX_NODE_R = 9;
var MIN_NODE_R = 2;
var MAX_ZOOM = 20;

var GetData = require('./getData.js');

var calculateMarkerRadius = function(count, scale) {
  var myScale = d3.scale.linear()
                  .domain([1, MAX_ZOOM])
                  .range([1, 0.3])
                  ;
  scale = scale * myScale(scale);   //Makes zoomed in markers slightly bigger
  return Math.max(MIN_NODE_R, Math.min(count/2, MAX_NODE_R) )/scale + 'px';
};

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
        awardRecord.show = potentialShow;
        if (potentialShow) {                                          //This record is what we're showing, so we add its values to the filters
          trimmedFilters = this._addToTrimmedFilters(trimmedFilters, potentialTrimmed);
        }
        
      } else {                                                  //Was a single toggle, so we just need to see if this record had that value
        
        //console.log('filterVal:', filterVal);
        if ( awardRecord[ filterName ] === filterVal[0] ) {        //This is a record that was affected by the most recent filter change
          //console.log('_filterMarkers on:', nextMarkers[i]);
          awardRecord.show = nextFilters[ nameIndex ].values[ valueIndex ][1];
        }
        if (awardRecord.show) {
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
	    if (awardRecord.show===false) continue;           //Not showing, skip it
	    
	    myLat = awardRecord.LL.lat;
	    myLng = awardRecord.LL.lng;
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
    
    //Sort markers so the big markers are rendered 'under' smaller ones
    for(var i = 0; i < cleansedMarkers.length; i++) {
      let tempMarker = cleansedMarkers[i]; //Copy of the current element.
      for(var j = (i-1); j >= 0 && (cleansedMarkers[j].myCount < tempMarker.myCount); j--) {
        //Shift the number
        cleansedMarkers[j+1] = cleansedMarkers[j];
      }
      cleansedMarkers[j+1] = tempMarker;
    }
	  
	  return cleansedMarkers;
	},
	
	_writeMarker: function(thisMarker, awardRecord, isNew, index) {
	//Handles converting congruent location data into a friendly marker & maintains list of awards on a marker
	  if (isNew) {
	    thisMarker = {};
      thisMarker.lat = awardRecord.LL.lat;
      thisMarker.lng = awardRecord.LL.lng;
      thisMarker.myCount = 0;
      thisMarker.myAwards = [];
      thisMarker.myBrewery = awardRecord.brewery;
      thisMarker.singleBrewery = true;
	  }
	  
	  //Append/Update the marker to account for another award
	  thisMarker.myCount++;
	  
	  if (thisMarker.singleBrewery && thisMarker.myBrewery === awardRecord.brewery ) {
	    thisMarker.hoverContent = '(' + thisMarker.myCount + ') ' + awardRecord.brewery
	                            + ' [' + awardRecord.city +', '+ awardRecord.state + ']';
	  } else {
	    thisMarker.singleBrewery = false;
	    thisMarker.hoverContent = '(' + thisMarker.myCount + ') ' + awardRecord.city +', '+ awardRecord.state;
	  }
	  
    thisMarker.myAwards.push (awardRecord);
    
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
    //ADD SOMETHING TO NOT SHIT BRICKS WHEN RESIZE WHILE ZOOM
    
    d3.select('svg').remove();
    this._drawMap();
    this._drawMarkers();
  },
  
  _drawMap: function() {
    this.width = parseInt(d3.select("#"+this.state.myID).style('width'));
    //this.mapRatio = 0.5;
    this.height = parseInt(d3.select("#"+this.state.myID).style('height'))//this.width * this.mapRatio;
        
    this.projection = d3.geo.albersUsa()
                      .scale(this.width)
                      .translate([this.width/2,this.height/2]);
    
    this.path = d3.geo.path()
                .projection(this.projection);
              
    let zoom = d3.behavior.zoom()
                .scale(1)
                .scaleExtent([1, MAX_ZOOM])
                .on("zoom", this._zoom);
    
    this.svg = d3.select("#"+this.state.myID).append("svg")
                .attr("width", this.width)
                .attr("height", this.height)
                .call(zoom);
    
    this.g = this.svg.append("g");
              
              
    this.g.selectAll("path")
            .data(topojson.feature(this.props.mapData, this.props.mapData.objects.states).features)
          .enter()
            .append("path")
            .attr("d", this.path)
            .attr("class", "state")
            .attr('stroke-width', '1px')
          ;
      
    this.tooltip = d3.select("body")
                  	.append("div")
                  	.style("position", "absolute")
                  	.style("z-index", "10")
                  	.style("visibility", "hidden")
                  	;
                  	
                  	
                  	//INCLUDE CODE TO MAINTAIN MAP POSITION ON RESIZE WINDOW
                  	
                  	//ADD CODE TO MAINTAIN TOOLTIP POS AFTER ZOOM
  },
  
  _zoom: function() {
    this.lastZoomScale = d3.event.scale;
      
    this.g
        .attr("transform", "translate(" + d3.event.translate + ")scale("+ d3.event.scale +")")
        ;
        
    this.g.selectAll('.mark, .state')
      //.transition()
        //.duration(750)
        .attr("stroke-width", function() {
          return (1/d3.event.scale).toFixed(2) +"px";
        })
        .attr('r', function(d) {
          return calculateMarkerRadius(d.myCount, d3.event.scale);
          //return Math.max(MIN_NODE_R, Math.min(d.myCount/2, MAX_NODE_R) )/d3.event.scale + 'px';
          })
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
                      return calculateMarkerRadius(d.myCount, lastZoomScale);
                      //return Math.max(MIN_NODE_R, Math.min(d.myCount/2, MAX_NODE_R) )/lastZoomScale + 'px';
                      })
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
                .attr('stroke', 'grey')
                .attr('opacity', '0.75')
                .attr("stroke-width", function() {
                        return (1/lastZoomScale).toFixed(2) +"px";})
                .attr('r', function(d) {
                  return calculateMarkerRadius(d.myCount, lastZoomScale);
                  //return Math.max(MIN_NODE_R, Math.min(d.myCount/2, MAX_NODE_R) )/lastZoomScale + 'px';
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
      console.log('Showing details for d:', d);
      var event = new CustomEvent('showDetails', { 'detail': d.myAwards });  //CHANGE THIS>>>>
      window.dispatchEvent(event);
    };
    
    function __showSummary(d) {
      //console.log('this:', this, 'd:', d);
      d3.select(this)
  			.attr("stroke", "red")
  			.attr('opacity', '0.95')
  			;
      
      tooltip
        .style("visibility", "visible")
        .attr('class', 'summary')
      	.text(d.hoverContent)
      	.style("left", (d3.event.pageX)+10 + "px")
        .style("top", (d3.event.pageY)-10 + "px")
      
                  	
    };
    
    function __hideSummary(d) {
      //console.log('Hiding summary for "this":', this);
      d3.select(this)
        .attr('stroke', 'grey')
        .attr('opacity', '0.75')
        ;
      
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
  }
});
var Geneology = React.createClass({
  getInitialState: function() {
    return ({ myID: 'geneology',
              data:  {
                      "name": "Top Node",
                      "children": [
                        {
                          "name": "Bob: Child of Top Node",
                          "parent": "Top Node",
                          "children": [
                            {
                              "name": "Son of Bob",
                              "parent": "Bob: Child of Top Node"
                            },
                            {
                              "name": "Daughter of Bob",
                              "parent": "Bob: Child of Top Node"
                            }
                          ]
                        },
                        {
                          "name": "Sally: Child of Top Node",
                          "parent": "Top Node"
                        }
                      ]
                    }
    })
  },
  
  componentDidMount: function() {
    this._drawGenes();
  },
  
  _drawGenes: function() {
    var margin = {top: 20, right: 20, bottom: 20, left: 20},
        width = parseInt(d3.select("#"+this.state.myID).style('width')),
        height = parseInt(d3.select("#"+this.state.myID).style('height'));
    
    var i = 0,
        duration = 750,
        root;
    
    var tree = d3.layout.tree()
                .size([height, width]);
    
    var diagonal = d3.svg.diagonal()
                    .projection(function(d) { return [d.y, d.x]; });
    
    var svg = d3.select("#"+this.state.myID).append("svg")
                .attr("width", width + margin.right + margin.left)
                .attr("height", height + margin.top + margin.bottom)
              .append("g")
                .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
      //inits our data abstraction
      root = this.state.data;
      root.x0 = height / 2;
      root.y0 = 0;
      
      //defines the collapse function
      function collapse(d) {
        if (d.children) {
          d._children = d.children;
          d._children.forEach(collapse);
          d.children = null;
        }
      }
      
      //collapses everything
      root.children.forEach(collapse);
      update(root);
    
    //unnecesssary styling
    //d3.select(self.frameElement).style("height", "800px");
    
    function update(source) {
    
      // Compute the new tree layout.
      var nodes = tree.nodes(root).reverse(),
          links = tree.links(nodes);
    
      // Normalize for fixed-depth.
      nodes.forEach(function(d) { d.y = d.depth * 180; });
    
      // Update the nodes…
      var node = svg.selectAll("g.node")
          .data(nodes, function(d) { return d.id || (d.id = ++i); });
    
      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node.enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
          .on("click", click);
    
      nodeEnter.append("circle")
          .attr("r", 1e-6)      //Why this value for r? For the transitions?
          .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
    
      nodeEnter.append("text")
          .attr("x", function(d) { return d.children || d._children ? -10 : 10; })
          .attr("dy", ".35em")      //centers text
          .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
          .text(function(d) { return d.name; })
          .style("fill-opacity", 1e-6);
    
      // Transition existing nodes to their new position.
      var nodeUpdate = node.transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });
    
      nodeUpdate.select("circle")
          .attr("r", 4.5)
          .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
    
      nodeUpdate.select("text")
          .style("fill-opacity", 1);
    
      // Transition exiting nodes to the parent's new position.
      var nodeExit = node.exit().transition()
          .duration(duration)
          .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
          .remove();
    
      nodeExit.select("circle")
          .attr("r", 1e-6);
    
      nodeExit.select("text")
          .style("fill-opacity", 1e-6);
    
      // Update the links…
      var link = svg.selectAll("path.link")
          .data(links, function(d) { return d.target.id; });
    
      // Enter any new links at the parent's previous position.
      link.enter().insert("path", "g")
          .attr("class", "link")
          .attr("d", function(d) {
            var o = {x: source.x0, y: source.y0};
            return diagonal({source: o, target: o});
          });
    
      // Transition links to their new position.
      link.transition()
          .duration(duration)
          .attr("d", diagonal);
    
      // Transition exiting nodes to the parent's new position.
      link.exit().transition()
          .duration(duration)
          .attr("d", function(d) {
            var o = {x: source.x, y: source.y};
            return diagonal({source: o, target: o});
          })
          .remove();
    
      // Stash the old positions for transition.
      nodes.forEach(function(d) {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }
    
    // Toggle children on click.
    function click(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
      } else {
        d.children = d._children;
        d._children = null;
      }
      update(d);
    }
    
  },

  render: function() {
    //console.log('rendering Map');
    return (
			<div id="gene-holder">
				<div id={this.state.myID} >GENES, BITCHES</div>
				
			</div>
		);
  },
});
var MultiGraphBox = React.createClass({
  getInitialState: function() {
    return { supportedGraphs: ['Awards', 'Geneology', 'Entries'],
             graphShowing: 'Geneology' }
  },
  
  _changeGraph: function(e) {
    let myGraph = e.target.getAttribute('data-name');
    this.setState({ graphShowing: myGraph });
  },
  
  render: function() {
    var myTabs =this.state.supportedGraphs.map(function(graph, i) {
                    //console.log('drawing tabs, state:', this.state);
                    let tabClass = '';
                    if (graph===this.state.graphShowing) tabClass = ' currTab';
                    return (
                      <div key={i} className={'graphTab'+tabClass} data-name={graph} onClick={this._changeGraph}>
                        {graph}
                      </div> );
                  }.bind(this) );
    
    if (this.state.graphShowing === 'Awards') {
      return (
        <div id='multiGraph' >
          <div id="map-frame">
            <Map markers={this.props.markers} mapData={this.props.mapData} />
            <div id='tabBox' >
              {myTabs}
            </div>
          </div>
          <div id='nonMapBoxes'>
            <FilterBox filters={this.props.filters} notify={this.props.notify}/>
            <DetailsBox />
          </div>
        </div>
      );
    } else if (this.state.graphShowing === 'Geneology') {
      return (
        <div id='multiGraph' >
          <div id='map-frame' >
            <Geneology />
            <div id='tabBox' >
              {myTabs}
            </div>
          </div>
          <div id='nonMapBoxes'>
            <FilterBox filters={this.props.filters} notify={this.props.notify}/>
            <DetailsBox />
          </div>
        </div>
        );
    }
  }
});
var DetailsBox = React.createClass({
  getInitialState: function() {
    return ({content: []})
  },
  
  componentDidMount: function() {
    window.addEventListener('showDetails', this._updateContent);
  },
  componentWillUnmount: function() {
    window.removeEventListener('showDetails', this._updateContent);
  },
  
  _updateContent: function(e) {
    this.setState({content: e.detail});
  },
  
  render: function() {
    if (this.state.content === []) return <div />
    return (
      <div id={'detailsBox'} >
        {
          this.state.content.map(function(award, i) {
            return (
              <div key={i} className="detailBoxItem" >
                <b>Year:</b>     {award.year} <br/>
                <b>Medal:</b>    {award.medal} <br/>
                <b>Style:</b>    {award.style} <br/>
                <b>Beer:</b>     {award.beer} <br/>
                <b>Brewery:</b>  {award.brewery}
              </div>
            );
          })
        }
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



//Page begin:
var dataPull = new GetData(   //This is the runPage cb-function to start the page when data is loaded
  function(beerData, filterData, mapData) {
      //Entry into site view
      ReactDOM.render(  //Render page after underlying data has loaded
        <ClientUI initBeerData={beerData} initFilters={filterData} mapData={mapData} />,
        document.getElementById('content')
      )
  }
);

dataPull.pullData('json_data/', 'lat_long_20160223.csv', 'brewery_lat_long20160308.csv', 'awards.csv', 'US.json');




