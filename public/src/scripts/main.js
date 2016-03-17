var RESET = '_RESET';
var MAX_NODE_R = 9;
var MIN_NODE_R = 2;
var MAX_ZOOM = 20;
var MIN_YEAR = 1999, MAX_YEAR = 2015, YEAR_WIDTH = 150, YEAR_DELAY = 750;

var GetData = require('./getData.js');

var calculateMarkerRadius = function(count, scale) {
  var myScale = d3.scale.linear()
                  .domain([1, MAX_ZOOM])
                  .range([1, 0.3])
                  ;
  scale = scale * myScale(scale);   //Makes zoomed in markers slightly bigger
  return Math.max(MIN_NODE_R, Math.min(count/2, MAX_NODE_R) )/scale + 'px';
};

//****************USED FOR FORMATTING ELEMENTS OVER OTHER ELEMENTS IN SVG
d3.selection.prototype.moveToBack = function() {
  return this.each(function() {
    var firstChild = this.parentNode.firstChild;
    if (firstChild) {
        this.parentNode.insertBefore(this, firstChild);
    }
  });
};
//***********************************************************************

var ClientUI = React.createClass({
  getInitialState: function() {
    return ({
      filters: this.props.initFilters,
      markers: this.props.initBeerData,
      mapMarkers: this._cleanseMarkers(),
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
  
  _cleanseMarkers: function() {
    //Takes a robust list of markers with ['show'] = T/F and pares it down to only the markers the map needs to know
    var markerCount = [],
	      myLat, myLng, cleansedMarkers = [],
	      initMarker, cleansedIndex = 0;
	 
    for (let awardRecord of this.props.initBeerData) {                //Check each marker
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
            notify={this._applyFilter} geneData={this.props.geneData} awardData={this.props.awardData} lineageData={this.props.lineageData} />
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
    //ADD SOMETHING TO NOT SHIT BRICKS WHEN RESIZE WHILE ZOOMED
    
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
    
    this.svg = d3.select("#"+this.state.myID)
                .append("svg")
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
      var event = new CustomEvent('showDetails', { 'detail': { type: 'Awards', data: d.myAwards } });
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
  getInitialState: function() { return { myID: 'geneology' }; },
  componentDidMount: function() {
    window.addEventListener('resize', this._handleResize);
    this._drawGenes();
    console.log('lineageData:', this.props.lineageData);
    if(typeof this.props.destination !== "undefined" && typeof this.props.destination.year !== "undefined")
      this._nodeScrollMain(this.props.destination);
  },
  componentWillUnmount: function() {
    window.removeEventListener('resize', this._handleResize);
  },
  _handleResize: function() {
    var margin = {top: 20, right: 20, bottom: 20, left: 30},
        height = parseInt(d3.select("#"+this.state.myID).style('height')) - margin.top - margin.bottom;
    d3.select('svg')
      .attr("height", height + margin.top + margin.bottom);
  },
  
  _nodeScrollMain: function(d) {
  //Scroll to new node
  //CLONE OF LOWER FUNCTION
    console.log('d.year:', d.year);
    var scrollYear = (parseInt(d.year) - MIN_YEAR ) * YEAR_WIDTH;
    d3.select("#"+this.state.myID)
        .transition()
        .duration(YEAR_DELAY)
        .tween("uniqueTweenName", scrollToNode(scrollYear));
  
    function scrollToNode(scrollLeft) {
      return function() {
        console.log('main this:', this);
        var i = d3.interpolateNumber(this.scrollLeft, scrollLeft);
        return function(t) { this.scrollLeft = i(t) };
      };
    };
  },
  
  _drawGenes: function() {
    var margin = {top: 5, right: 2, bottom: 5, left: 20},
        TEXT_ID_LABEL = 'LABEL',
        width = (MAX_YEAR - MIN_YEAR + 2) * YEAR_WIDTH,
        height = parseInt(d3.select("#"+this.state.myID).style('height'));// - margin.top - margin.bottom;
    
    var i = 0,
        duration = 750,
        root;
        
    var awardData = this.props.awardData;
    
    var tree = d3.layout.tree()
                .size([height, width]);
    
    var diagonal = d3.svg.diagonal()
                    .projection(function(d) { return [d.y, d.x]; });
    
    var svg = d3.select("#"+this.state.myID)
                .append("svg")
                  .attr("width", width)// + margin.right + margin.left)
                  .attr("height", height)// + margin.top + margin.bottom)
                .append("g")
                  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    //inits our data abstraction
    root = this.props.data[0];
    root.x0 = height / 2;
    root.y0 = 0;
    
    //defines the collapse function
    function collapse(d) {
      if (d.children) {
        d._children = d.children;
        d.children = null;
        d._children.forEach(collapse);
      }
    }
    function expand(d) {
      let yearDiff = parseInt(d.year) - MIN_YEAR;
      var myD = d;
      if (d._children) {
        myD.children = myD._children;
        myD._children = null;
        update(myD);
        nodeScroll(myD);
        if (myD.children[0].style == myD.style) hideText(TEXT_ID_LABEL + d.id);
  
        setTimeout( function() {
          myD.children.forEach(expand);
        }, YEAR_DELAY);
      }
    }
    
    //collapses everything
    root.children.forEach(collapse);
    
    var colorMax = [255, 0, 0], colorMin = [0, 0, 255];
    
    update(root);
    drawAxis();
    d3.selectAll('line').moveToBack();
    
    function showText(id) {
      d3.select('#'+id).select('text')
        .style('visibility', 'visible');
    }
    function hideText(id) {
      d3.select('#'+id).select('text')
        .style('visibility', 'hidden');
    }
    
    function update(source) {
    
      // Compute the new tree layout.
      var nodes = tree.nodes(root).reverse(),
          links = tree.links(nodes);
    
      // Normalize for fixed-depth.
      nodes.forEach(function(d) { d.y = d.level * YEAR_WIDTH; });
    
      // Update the nodes…
      var node = svg.selectAll("g.node")
          .data(nodes, function(d) { return d.id || (d.id = ++i); });
    
      // Enter any new nodes at the parent's previous position.
      var nodeEnter = node.enter().append("g")
          .attr("class", "node")
          .attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
          .on("click", function(d) {
                                      if (d._children) expand(d);
                                      click(d);
                                    })
          .on('dblclick', function(d) {
                                      collapse(d);
                                      update(d);
                                    })
          .on('mouseover', function(d) {
                                      showText(TEXT_ID_LABEL + d.id);
                                    })
          .attr('id', function(d) { return TEXT_ID_LABEL + d.id; } )
          .on('mouseout', function(d) {
                                      if (d.children && d.children[0].style == d.style) hideText(TEXT_ID_LABEL + d.id);
                                    })
          ;
          
      nodeEnter.append("circle")
          .attr('class', function(d) { return d.style === 'root' ? 'hidden' : ''; })
          .attr("r", 1e-6)      //Why this value for r? For the transitions?
          .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; });
    
      nodeEnter.append("text")
          .attr("x", function(d) { return d.children || d._children ? -5 : 5; })
          .attr("y", function(d) { return d.children || d._children ? 0 : 0; })
          .attr("dy", ".35em")      //centers text
          .attr("text-anchor", function(d) { return d.children || d._children ? "end" : "start"; })
          .attr('class', function(d) { return d.style === 'root' ? 'hidden' : ''})
          .text(function(d) { return d.style; })
          .style('background-color', 'green')
          //.style("fill-opacity", 1e-6);
    
    
      //to add: transparent text box behind all text with not root parents to 'hide' the green line behind it
    
    
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
          .attr('class', function(d) { return d.source.id === '0' ? 'link hidden' : 'link'; })
          .attr('stroke', 'green')
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
    function drawAxis() {
      let offset = margin.left-20;
      let z = offset + YEAR_WIDTH;
      while (z < width) {
        let myLine = svg.append("line")
                        .attr("x1", z)
                        .attr("y1", 5)
                        .attr("x2", z)
                        .attr("y2", height)
                        .attr('opacity', '0.2')
                        .style("stroke-width", 2)
                        .style("stroke", "navy")
                        .style("fill", "none");
        svg.append('text')
              .attr('x', z-35)
              .attr('y', height-10)
              .style('font-size', '12pt')
              .style('fill', 'dark-grey')
              .text(MIN_YEAR - 1 + parseInt( (z-offset)/YEAR_WIDTH ) );
          
        z += YEAR_WIDTH;
      }
    }
    
    function nodeScroll(d) {
    //Scroll to new node
      var scrollYear = ( parseInt(d.year) - MIN_YEAR ) * YEAR_WIDTH;
      d3.select("#geneology")
          .transition()
          .duration(YEAR_DELAY)
          .tween("uniqueTweenName", scrollToNode(scrollYear));
    
      function scrollToNode(scrollLeft) {
        return function() {
            console.log('lower level, this:', this);
            var i = d3.interpolateNumber(this.scrollLeft, scrollLeft);
            return function(t) { this.scrollLeft = i(t) };
        };
      };
    }
    
    // Show children on click, show details, and scroll to parent
    function click(d) {
      nodeScroll(d);
      __showDetails(d);
      
      function __showDetails(d) {
        let year = d.year,
            style = d.style,
            myAwards = [];
        
        for (let award of awardData) {
          if (award.year === year && award.style === style) myAwards.push(award);
        }
        
        var event = new CustomEvent('showDetails', { 'detail': { type: 'Geneology', data: myAwards } });
        window.dispatchEvent(event);
      }
    }
  },
  render: function() {
    //console.log('rendering Map');
    return (
			<div id="gene-holder">
				<div id={this.state.myID} />
			</div>
		);
  },
});
var MultiGraphBox = React.createClass({
  getInitialState: function() {
    return { supportedGraphs: ['Awards', 'Geneology'], //, 'Entries'],
             graphShowing: 'Geneology',
             geneDestination: undefined
            }
  },
  
  _changeGraph: function(e) {
    let myGraph = e.currentTarget.getAttribute('data-name'),
        myDestination = { year: e.currentTarget.getAttribute('data-year'),
                          style: e.currentTarget.getAttribute('data-style') };
    
    console.log('e.currentTarget:', e.currentTarget);
    console.log('myDestination:', myDestination, 'year:', myDestination.year);
    this.setState({ graphShowing: myGraph, geneDestination: myDestination });
    let event = new CustomEvent('showDetails', { 'detail': { type: myGraph, data: [] } });
      window.dispatchEvent(event);
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
                  }.bind(this) ),
        myGraph, myNonGraph;
    
    if (this.state.graphShowing === 'Awards') {
      myGraph = ( <Map markers={this.props.markers} mapData={this.props.mapData} /> );
      myNonGraph = ( <div> <FilterBox filters={this.props.filters} notify={this.props.notify} />
                     <DetailsBox type={this.state.graphShowing} toGeneology={this._changeGraph} /> </div>);
    } else if (this.state.graphShowing === 'Geneology') {
      myGraph = <Geneology data={this.props.geneData} awardData={this.props.awardData} lineageData={this.props.lineageData}
          destination={this.state.geneDestination} />;
      myNonGraph = ( <DetailsBox type={this.state.graphShowing} /> );
    }
    
    return (
      <div id='multiGraph' >
        <div id='nonMapBoxes'>
          {myNonGraph}
        </div>
        <div id="graph-frame">
          {myGraph}
          <div id='tabBox' >
            {myTabs}
          </div>
        </div>
      </div>
    );
  }
});
var DetailsBox = React.createClass({
  getInitialState: function() {
    return ({ type: '', content: [] })
  },
  
  componentDidMount: function() {
    window.addEventListener('showDetails', this._updateContent);
  },
  componentWillUnmount: function() {
    window.removeEventListener('showDetails', this._updateContent);
  },
  
  _updateContent: function(e) {
    console.log('Updating state with event.detail:', e.detail);
    this.setState({type: e.detail.type, content: e.detail.data});
  },

  render: function() {
    var tabSwitch = this.state.type === '' ? this.props.type : this.state.type;

    switch (tabSwitch) {
      case 'Awards':
        var toGenes = this.props.toGeneology;
        return ( <div id='detailsBox' >
          {
            this.state.content.map(function(award, i) {
              return (
                <div key={i} className="detailBoxItem" data-name={'Geneology'} data-year={award.year} data-style={award.style} onClick={toGenes} >
                  <b>Year:</b>     {award.year} <br/>
                  <b>Medal:</b>    {award.medal} <br/>
                  <b>Style:</b>    {award.style} <br/>
                  <b>Beer:</b>     {award.beer} <br/>
                  <b>Brewery:</b>  {award.brewery}
                </div>
              );
            })
          }
          </div> ); break;
      case 'Geneology':
        var myContent;
        if (this.state.content.length === 0) myContent = <div id='detailsBox' >Click a beer node to see awards for that year</div>
        else {
          console.log('non-empty');
          let myAwards = this.state.content.map(function(award, i) {
                return (
                  <div key={i} className="detailBoxItem" >
                    <b>Medal:</b>    {award.medal} <br/>
                    <b>Beer:</b>     {award.beer} <br/>
                    <b>Brewery:</b>  {award.brewery}
                  </div>
                );
              }),
              myYear = this.state.content[0].year,
              myStyle = this.state.content[0].style;
              console.log('this.state.content[0].year:', this.state.content[0].year);
          myContent = ( <div id='detailsBox'>
                          <div id='detailsBox'>
                            <b>Year:</b> {myYear} <br/>
                            <b>Style:</b> {myStyle} <br/>
                          </div>
                          {myAwards}
                        </div> );
        }
        return myContent; break;
      default: return <div />; break;
    }
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
    window.removeEventListener('click', this._toggleCheck);
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


//************************************************Page begin*****************************************
var dataPull = new GetData(   //This is the runPage cb-function to start the page when data is loaded
  function(beerData, filterData, mapData, geneData, awardData, lineageData) {
    //Entry into site view
    d3.select("#loading").remove();
    ReactDOM.render(  //Render page after underlying data has loaded
      <ClientUI initBeerData={beerData} initFilters={filterData} mapData={mapData} geneData={geneData} awardData={awardData}
        lineageData={lineageData} />,
      document.getElementById('content')
    )
  }
);

dataPull.pullData('json_data/', 'lat_long_20160223.csv', 'brewery_lat_long20160308.csv', 'awards.csv'
  , 'US.json', 'year_style_id_parents.csv');




