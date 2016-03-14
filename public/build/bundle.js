/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	module.exports = __webpack_require__(1);


/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var _slicedToArray = function () {
	  function sliceIterator(arr, i) {
	    var _arr = [];var _n = true;var _d = false;var _e = undefined;try {
	      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
	        _arr.push(_s.value);if (i && _arr.length === i) break;
	      }
	    } catch (err) {
	      _d = true;_e = err;
	    } finally {
	      try {
	        if (!_n && _i["return"]) _i["return"]();
	      } finally {
	        if (_d) throw _e;
	      }
	    }return _arr;
	  }return function (arr, i) {
	    if (Array.isArray(arr)) {
	      return arr;
	    } else if (Symbol.iterator in Object(arr)) {
	      return sliceIterator(arr, i);
	    } else {
	      throw new TypeError("Invalid attempt to destructure non-iterable instance");
	    }
	  };
	}();

	var RESET = '_RESET';
	var MAX_NODE_R = 9;
	var MIN_NODE_R = 2;
	var MAX_ZOOM = 20;

	var GetData = __webpack_require__(2);

	var calculateMarkerRadius = function calculateMarkerRadius(count, scale) {
	  var myScale = d3.scale.linear().domain([1, MAX_ZOOM]).range([1, 0.3]);
	  scale = scale * myScale(scale); //Makes zoomed in markers slightly bigger
	  return Math.max(MIN_NODE_R, Math.min(count / 2, MAX_NODE_R)) / scale + 'px';
	};

	var ClientUI = React.createClass({
	  displayName: 'ClientUI',

	  getInitialState: function getInitialState() {
	    return {
	      filters: this.props.initFilters,
	      markers: this.props.initBeerData,
	      mapMarkers: this._cleanseMarkers(),
	      trimmedFilters: this.props.initFilters
	    };
	  },

	  _applyFilter: function _applyFilter(name, value, asGroup) {
	    //Value will be an array if multiple objects are sent at once
	    var nextFilters = this.state.filters,
	        z,
	        y,
	        completed = false,
	        added,
	        nameIndex,
	        valueIndex = false;

	    value = [].concat(value); //If a single value, will turn it into a list of length 1
	    //console.log('_applyFilter, value:', value);
	    z = 0;
	    while (z < nextFilters.length && !completed) {
	      //Iterate through each filter name to see if it's the one we changed
	      if (nextFilters[z].name === name) {
	        //This is our filter
	        nameIndex = z;
	        y = 0;
	        while (y < nextFilters[z].values.length && !completed) {
	          //Iterate though each value in the filter
	          if (asGroup) {
	            //Turn on all sent values (list), turn off the rest
	            if (~value.indexOf(nextFilters[z].values[y][0]) || value[0] === RESET) //This value was sent / RESETING ALL
	              nextFilters[z].values[y][1] = true;else //This value was not
	              nextFilters[z].values[y][1] = false;
	          } else {
	            //Operate under the assumption of only a single value to toggle was sent
	            if (nextFilters[z].values[y][0] === value[0]) {
	              //This is our single value, toggle it
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

	    var _filterMarkers = this._filterMarkers(nextFilters, name, value, nameIndex, valueIndex);

	    var _filterMarkers2 = _slicedToArray(_filterMarkers, 2);

	    var nextMarkers = _filterMarkers2[0];
	    var trimmedFilters = _filterMarkers2[1];

	    var nextMapMarkers = this._cleanseMarkers(nextMarkers);

	    /*console.log('About to update state, currFilter:', this.state.filters);
	    console.log('About to update state, nextFilters:', nextFilters);
	    console.log('About to update state, trimmedFilters:', trimmedFilters); */

	    this.setState({ filters: nextFilters, markers: nextMarkers, mapMarkers: nextMapMarkers, trimmedFilters: trimmedFilters });
	  },

	  _filterMarkers: function _filterMarkers(nextFilters, filterName, filterVal, nameIndex, valueIndex) {
	    //Removes the markers that are no longer shown/adds those that are now shown
	    //Weak to filtering on multiple values, extremely weak to filtering on multiple filters
	    var j,
	        k,
	        potentialShow,
	        nextMarkers = this.state.markers,
	        filterName,
	        awardFilterValue,
	        trimmedFilters = [],
	        potentialTrimmed = [],
	        tempPT;

	    //console.log('in _fMarkers, filterVal:', filterVal);

	    var _iteratorNormalCompletion = true;
	    var _didIteratorError = false;
	    var _iteratorError = undefined;

	    try {
	      for (var _iterator = nextFilters[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	        var filter = _step.value;
	        //Instantiate our trimmedFilters data structure
	        trimmedFilters.push({ name: filter.name, values: [] });
	        potentialTrimmed.push({ name: filter.name, values: [] });
	      }
	    } catch (err) {
	      _didIteratorError = true;
	      _iteratorError = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion && _iterator.return) {
	          _iterator.return();
	        }
	      } finally {
	        if (_didIteratorError) {
	          throw _iteratorError;
	        }
	      }
	    }

	    var _iteratorNormalCompletion2 = true;
	    var _didIteratorError2 = false;
	    var _iteratorError2 = undefined;

	    try {
	      for (var _iterator2 = nextMarkers[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	        var awardRecord = _step2.value;
	        //Iterate through each beer award record
	        if (filterVal.length > 1 || filterVal[0] == RESET) {
	          //Was an array so we have to check prior show to .values[valueIndex][0]
	          potentialTrimmed = [];
	          j = 0;
	          potentialShow = true;

	          while (potentialShow && j < nextFilters.length) {
	            //Iterate through each filter (year, style, medal...)
	            filterName = nextFilters[j].name;
	            awardFilterValue = awardRecord[filterName];
	            k = 0;

	            while (potentialShow && k < nextFilters[j].values.length) {
	              //Iterate through each filter item (2015, 2014, 2013...)
	              if (nextFilters[j].values[k][0] === awardFilterValue) {
	                //Filter and item for particular record, should app show it?
	                potentialShow = nextFilters[j].values[k][1];
	                potentialTrimmed[j] = { name: filterName,
	                  values: [awardFilterValue, potentialShow] }; //Double array to mimic data structure
	                //This creates pT[j] = { name: 'year', values: ['2013', true/false] }
	              }
	              k++;
	            }
	            j++;
	          }
	          awardRecord.show = potentialShow;
	          if (potentialShow) {
	            //This record is what we're showing, so we add its values to the filters
	            trimmedFilters = this._addToTrimmedFilters(trimmedFilters, potentialTrimmed);
	          }
	        } else {
	          //Was a single toggle, so we just need to see if this record had that value

	          //console.log('filterVal:', filterVal);
	          if (awardRecord[filterName] === filterVal[0]) {
	            //This is a record that was affected by the most recent filter change
	            //console.log('_filterMarkers on:', nextMarkers[i]);
	            awardRecord.show = nextFilters[nameIndex].values[valueIndex][1];
	          }
	          if (awardRecord.show) {
	            tempPT = JSON.parse(JSON.stringify(potentialTrimmed)); //Maintain PT as a header
	            for (var i = 0; i < tempPT.length; i++) {
	              //Scoop up all the values in this shown marker
	              //console.log('oh boy, awardRecord[ tempPT[i].name ]:', awardRecord[ tempPT[i].name ]);
	              tempPT[i].values.push(awardRecord[tempPT[i].name], true);
	            }
	            //console.log('about to run aTTF, tempPT:', tempPT); //debugger
	            trimmedFilters = this._addToTrimmedFilters(trimmedFilters, tempPT);
	          }
	        }
	      }
	      //console.log('nextFilters:', nextFilters);
	    } catch (err) {
	      _didIteratorError2 = true;
	      _iteratorError2 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion2 && _iterator2.return) {
	          _iterator2.return();
	        }
	      } finally {
	        if (_didIteratorError2) {
	          throw _iteratorError2;
	        }
	      }
	    }

	    return [nextMarkers, trimmedFilters];
	  },

	  _addToTrimmedFilters: function _addToTrimmedFilters(tF, pT) {
	    var alreadyAdded, pTVal, j;
	    //console.log('in aTTF, tF:', tF, 'pT:', pT);
	    for (var i = 0; i < tF.length; i++) {
	      //Iterate through each filter ('year', 'style')
	      j = 0;
	      alreadyAdded = false;
	      //console.log('i', i, 'pT:',pT, 'tF:', tF);
	      pTVal = pT[i].values[0];
	      //console.log('pTVal:', pTVal);
	      while (!alreadyAdded && j < tF[i].values.length) {
	        //Iterate through each value ('2013', '2014')
	        //console.log('tF[i].values[j][0] === pTVal', tF[i].values[j][0],'===', pTVal);
	        if (tF[i].values[j][0] === pTVal) {
	          alreadyAdded = true;
	        }
	        j++;
	      }
	      if (!alreadyAdded) {
	        tF[i].values.push(pT[i].values);
	      }
	    }
	    return tF;
	  },

	  _cleanseMarkers: function _cleanseMarkers() {
	    //Takes a robust list of markers with ['show'] = T/F and pares it down to only the markers the map needs to know
	    var markerCount = [],
	        myLat,
	        myLng,
	        cleansedMarkers = [],
	        initMarker,
	        cleansedIndex = 0;

	    var _iteratorNormalCompletion3 = true;
	    var _didIteratorError3 = false;
	    var _iteratorError3 = undefined;

	    try {
	      for (var _iterator3 = this.props.initBeerData[Symbol.iterator](), _step3; !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done); _iteratorNormalCompletion3 = true) {
	        var awardRecord = _step3.value;
	        //Check each marker
	        if (awardRecord.show === false) continue; //Not showing, skip it

	        myLat = awardRecord.LL.lat;
	        myLng = awardRecord.LL.lng;
	        initMarker = false;

	        if (markerCount[myLat + '-' + myLng] === undefined) {
	          initMarker = true; //First time this location has been seen in the list
	          markerCount[myLat + '-' + myLng] = cleansedIndex++;
	        }

	        var markerIndex = markerCount[myLat + '-' + myLng];
	        var currMarker = cleansedMarkers[markerIndex]; //Grab existing marker info, could be undefined

	        var newMarker = this._writeMarker(currMarker, awardRecord, initMarker, markerIndex);
	        cleansedMarkers[markerIndex] = newMarker;
	      }

	      //Sort markers so the big markers are rendered 'under' smaller ones
	    } catch (err) {
	      _didIteratorError3 = true;
	      _iteratorError3 = err;
	    } finally {
	      try {
	        if (!_iteratorNormalCompletion3 && _iterator3.return) {
	          _iterator3.return();
	        }
	      } finally {
	        if (_didIteratorError3) {
	          throw _iteratorError3;
	        }
	      }
	    }

	    for (var i = 0; i < cleansedMarkers.length; i++) {
	      var tempMarker = cleansedMarkers[i]; //Copy of the current element.
	      for (var j = i - 1; j >= 0 && cleansedMarkers[j].myCount < tempMarker.myCount; j--) {
	        //Shift the number
	        cleansedMarkers[j + 1] = cleansedMarkers[j];
	      }
	      cleansedMarkers[j + 1] = tempMarker;
	    }

	    return cleansedMarkers;
	  },

	  _writeMarker: function _writeMarker(thisMarker, awardRecord, isNew, index) {
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

	    if (thisMarker.singleBrewery && thisMarker.myBrewery === awardRecord.brewery) {
	      thisMarker.hoverContent = '(' + thisMarker.myCount + ') ' + awardRecord.brewery + ' [' + awardRecord.city + ', ' + awardRecord.state + ']';
	    } else {
	      thisMarker.singleBrewery = false;
	      thisMarker.hoverContent = '(' + thisMarker.myCount + ') ' + awardRecord.city + ', ' + awardRecord.state;
	    }

	    thisMarker.myAwards.push(awardRecord);

	    return thisMarker;
	  },

	  render: function render() {
	    return React.createElement('div', { id: 'UI' }, React.createElement(MultiGraphBox, { mapData: this.props.mapData, markers: this.state.mapMarkers, filters: this.state.trimmedFilters,
	      notify: this._applyFilter, geneData: this.props.geneData }));
	  }
	});
	var Map = React.createClass({
	  displayName: 'Map',

	  getInitialState: function getInitialState() {
	    return { myID: 'map' };
	  },

	  componentDidMount: function componentDidMount() {
	    this.lastZoomScale = 1;
	    this._drawMap();
	    this._drawMarkers();
	    window.addEventListener('resize', this._handleResize);
	  },
	  componentWillUnmount: function componentWillUnmount() {
	    window.removeEventListener('resize', this._handleResize);
	  },

	  componentDidUpdate: function componentDidUpdate() {
	    this._drawMarkers();
	  },

	  _handleResize: function _handleResize() {
	    //ADD SOMETHING TO NOT SHIT BRICKS WHEN RESIZE WHILE ZOOM

	    d3.select('svg').remove();
	    this._drawMap();
	    this._drawMarkers();
	  },

	  _drawMap: function _drawMap() {
	    this.width = parseInt(d3.select("#" + this.state.myID).style('width'));
	    //this.mapRatio = 0.5;
	    this.height = parseInt(d3.select("#" + this.state.myID).style('height')); //this.width * this.mapRatio;

	    this.projection = d3.geo.albersUsa().scale(this.width).translate([this.width / 2, this.height / 2]);

	    this.path = d3.geo.path().projection(this.projection);

	    var zoom = d3.behavior.zoom().scale(1).scaleExtent([1, MAX_ZOOM]).on("zoom", this._zoom);

	    this.svg = d3.select("#" + this.state.myID).append("svg").attr("width", this.width).attr("height", this.height).call(zoom);

	    this.g = this.svg.append("g");

	    this.g.selectAll("path").data(topojson.feature(this.props.mapData, this.props.mapData.objects.states).features).enter().append("path").attr("d", this.path).attr("class", "state").attr('stroke-width', '1px');

	    this.tooltip = d3.select("body").append("div").style("position", "absolute").style("z-index", "10").style("visibility", "hidden");

	    //INCLUDE CODE TO MAINTAIN MAP POSITION ON RESIZE WINDOW

	    //ADD CODE TO MAINTAIN TOOLTIP POS AFTER ZOOM
	  },

	  _zoom: function _zoom() {
	    this.lastZoomScale = d3.event.scale;

	    this.g.attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");

	    this.g.selectAll('.mark, .state')
	    //.transition()
	    //.duration(750)
	    .attr("stroke-width", function () {
	      return (1 / d3.event.scale).toFixed(2) + "px";
	    }).attr('r', function (d) {
	      return calculateMarkerRadius(d.myCount, d3.event.scale);
	      //return Math.max(MIN_NODE_R, Math.min(d.myCount/2, MAX_NODE_R) )/d3.event.scale + 'px';
	    });
	  },

	  _drawMarkers: function _drawMarkers() {
	    var svg = this.svg;
	    var projection = this.projection;
	    var tooltip = this.tooltip;
	    var g = this.g;
	    var lastZoomScale = this.lastZoomScale;

	    var markers = this.g.selectAll(".mark").data(this.props.markers)
	    //Update existing markers
	    .attr('class', 'mark').attr('r', function (d) {
	      return calculateMarkerRadius(d.myCount, lastZoomScale);
	      //return Math.max(MIN_NODE_R, Math.min(d.myCount/2, MAX_NODE_R) )/lastZoomScale + 'px';
	    }).attr("transform", function (d) {
	      if (projection([d.lng, d.lat]) === null) {
	        console.log('in a null circle, d:', d);
	        return 'translate(0, 0)';
	      }
	      return "translate(" + projection([d.lng, d.lat]) + ")";
	    })
	    //Stroke-Width handled in g zoom with states
	    ;

	    //Delete old markers
	    markers.exit().remove();

	    //Create newly shown markers
	    markers.enter().append("circle").attr('class', 'mark').attr('stroke', 'grey').attr('opacity', '0.75').attr("stroke-width", function () {
	      return (1 / lastZoomScale).toFixed(2) + "px";
	    }).attr('r', function (d) {
	      return calculateMarkerRadius(d.myCount, lastZoomScale);
	      //return Math.max(MIN_NODE_R, Math.min(d.myCount/2, MAX_NODE_R) )/lastZoomScale + 'px';
	    }).attr("transform", function (d) {
	      if (projection([d.lng, d.lat]) === null) {
	        console.log('in a null circle, d:', d);
	        return 'translate(0, 0)';
	      }
	      return "translate(" + projection([d.lng, d.lat]) + ")";
	    }).on("click", __showDetails).on("mouseover", __showSummary).on("mouseout", __hideSummary);

	    function __showDetails(d) {
	      console.log('Showing details for d:', d);
	      var event = new CustomEvent('showDetails', { 'detail': d.myAwards }); //CHANGE THIS>>>>
	      window.dispatchEvent(event);
	    };

	    function __showSummary(d) {
	      //console.log('this:', this, 'd:', d);
	      d3.select(this).attr("stroke", "red").attr('opacity', '0.95');

	      tooltip.style("visibility", "visible").attr('class', 'summary').text(d.hoverContent).style("left", d3.event.pageX + 10 + "px").style("top", d3.event.pageY - 10 + "px");
	    };

	    function __hideSummary(d) {
	      //console.log('Hiding summary for "this":', this);
	      d3.select(this).attr('stroke', 'grey').attr('opacity', '0.75');

	      var hideTT = tooltip.style('visibility', 'hidden').style("top", "0px").style("left", "0px");
	    };
	  },

	  render: function render() {
	    //console.log('rendering Map');
	    return React.createElement('div', { id: 'map-holder' }, React.createElement('div', { id: this.state.myID }), React.createElement('div', { id: 'markerCounter' }, this.props.markers.length));
	  }
	});
	var Geneology = React.createClass({
	  displayName: 'Geneology',

	  getInitialState: function getInitialState() {
	    return { myID: 'geneology' };
	  },
	  componentDidMount: function componentDidMount() {
	    window.addEventListener('resize', this._handleResize);
	    this._drawGenes();
	  },
	  componentWillUnmount: function componentWillUnmount() {
	    window.removeEventListener('resize', this._handleResize);
	  },
	  _handleResize: function _handleResize() {
	    var margin = { top: 20, right: 20, bottom: 20, left: 30 },
	        width = parseInt(d3.select("#" + this.state.myID).style('width')) - margin.left - margin.right,
	        height = parseInt(d3.select("#" + this.state.myID).style('height')) - margin.top - margin.bottom;
	    d3.select('svg').attr("width", width + margin.right + margin.left).attr("height", height + margin.top + margin.bottom);
	  },

	  _drawGenes: function _drawGenes() {
	    var margin = { top: 20, right: 20, bottom: 20, left: 30 },
	        width = parseInt(d3.select("#" + this.state.myID).style('width')) - margin.left - margin.right,
	        height = parseInt(d3.select("#" + this.state.myID).style('height')) - margin.top - margin.bottom;

	    var i = 0,
	        duration = 750,
	        root;

	    var tree = d3.layout.tree().size([height, width]);

	    var diagonal = d3.svg.diagonal().projection(function (d) {
	      return [d.y, d.x];
	    });

	    var svg = d3.select("#" + this.state.myID).append("svg").attr("width", width + margin.right + margin.left).attr("height", height + margin.top + margin.bottom).append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	    //inits our data abstraction
	    root = this.props.data[0];
	    root.x0 = height / 2;
	    root.y0 = 0;

	    var yearStart = parseInt(root.children[0].year);
	    console.log('yearStart:', yearStart);

	    //defines the collapse function
	    function collapse(d) {
	      if (d.children) {
	        d._children = d.children;
	        d._children.forEach(collapse);
	        d.children = null;
	      }
	    }

	    console.log('data:', this.props.data);
	    //collapses everything
	    root.children.forEach(collapse);

	    var colorMax = [255, 0, 0],
	        colorMin = [0, 0, 255];
	    var axis = [];

	    update(root);

	    //unnecesssary styling
	    //d3.select(self.frameElement).style("height", "800px");

	    function update(source) {

	      // Compute the new tree layout.
	      var nodes = tree.nodes(root).reverse(),
	          links = tree.links(nodes);

	      // Normalize for fixed-depth.
	      nodes.forEach(function (d) {
	        d.y = d.level * 150;
	      });

	      // Update the nodes…
	      var node = svg.selectAll("g.node").data(nodes, function (d) {
	        return d.id || (d.id = ++i);
	      });

	      // Enter any new nodes at the parent's previous position.
	      var nodeEnter = node.enter().append("g").attr("class", "node").attr("transform", function (d) {
	        return "translate(" + source.y0 + "," + source.x0 + ")";
	      }).on("click", click).call(_maintainAxis);

	      nodeEnter.append("circle").attr("r", 1e-6) //Why this value for r? For the transitions?
	      .style("fill", function (d) {
	        return d._children ? "lightsteelblue" : "#fff";
	      });

	      nodeEnter.append("text").attr("x", function (d) {
	        return d.children || d._children ? 5 : -5;
	      }).attr("y", function (d) {
	        return d.children || d._children ? -10 : 10;
	      }).attr("dy", ".35em") //centers text
	      .attr("text-anchor", function (d) {
	        return d.children || d._children ? "end" : "start";
	      }).text(function (d) {
	        return d.style;
	      }).style("fill-opacity", 1e-6);

	      // Transition existing nodes to their new position.
	      var nodeUpdate = node.transition().duration(duration).attr("transform", function (d) {
	        return "translate(" + d.y + "," + d.x + ")";
	      });

	      nodeUpdate.select("circle").attr("r", 4.5).style("fill", function (d) {
	        return d._children ? "lightsteelblue" : "#fff";
	      });

	      nodeUpdate.select("text").style("fill-opacity", 1);

	      // Transition exiting nodes to the parent's new position.
	      var nodeExit = node.exit().transition().duration(duration).attr("transform", function (d) {
	        return "translate(" + source.y + "," + source.x + ")";
	      }).remove();

	      nodeExit.select("circle").attr("r", 1e-6);

	      nodeExit.select("text").style("fill-opacity", 1e-6);

	      // Update the links…
	      var link = svg.selectAll("path.link").data(links, function (d) {
	        return d.target.id;
	      });

	      // Enter any new links at the parent's previous position.
	      link.enter().insert("path", "g").attr("class", "link").attr('stroke', 'green').attr("d", function (d) {
	        var o = { x: source.x0, y: source.y0 };
	        return diagonal({ source: o, target: o });
	      });

	      // Transition links to their new position.
	      link.transition().duration(duration).attr("d", diagonal);

	      // Transition exiting nodes to the parent's new position.
	      link.exit().transition().duration(duration).attr("d", function (d) {
	        var o = { x: source.x, y: source.y };
	        return diagonal({ source: o, target: o });
	      }).remove();

	      // Stash the old positions for transition.
	      nodes.forEach(function (d) {
	        d.x0 = d.x;
	        d.y0 = d.y;
	      });
	    }

	    function _maintainAxis(d) {
	      console.log('d in _mA:', d);
	      var drawnAlready = axis.indexOf(d.year);
	      if (drawnAlready === -1) {
	        axis.push(d.year);
	        svg.append("line").attr("x1", d.x) //<<== change your code here
	        .attr("y1", margin.top).attr("x2", d.x) //<<== and here
	        .attr("y2", height - margin.top - margin.bottom).style("stroke-width", 2).style("stroke", "red").style("fill", "none");
	      }
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
	  render: function render() {
	    //console.log('rendering Map');
	    return React.createElement('div', { id: 'gene-holder' }, React.createElement('div', { id: this.state.myID }));
	  }
	});
	var MultiGraphBox = React.createClass({
	  displayName: 'MultiGraphBox',

	  getInitialState: function getInitialState() {
	    return { supportedGraphs: ['Awards', 'Geneology', 'Entries'],
	      graphShowing: 'Geneology' };
	  },

	  _changeGraph: function _changeGraph(e) {
	    var myGraph = e.target.getAttribute('data-name');
	    this.setState({ graphShowing: myGraph });
	  },

	  render: function render() {
	    var myTabs = this.state.supportedGraphs.map(function (graph, i) {
	      //console.log('drawing tabs, state:', this.state);
	      var tabClass = '';
	      if (graph === this.state.graphShowing) tabClass = ' currTab';
	      return React.createElement('div', { key: i, className: 'graphTab' + tabClass, 'data-name': graph, onClick: this._changeGraph }, graph);
	    }.bind(this));

	    if (this.state.graphShowing === 'Awards') {
	      console.log('printing awards, props:', this.props);
	      return React.createElement('div', { id: 'multiGraph' }, React.createElement('div', { id: 'graph-frame' }, React.createElement(Map, { markers: this.props.markers, mapData: this.props.mapData }), React.createElement('div', { id: 'tabBox' }, myTabs)), React.createElement('div', { id: 'nonMapBoxes' }, React.createElement(FilterBox, { filters: this.props.filters, notify: this.props.notify }), React.createElement(DetailsBox, null)));
	    } else if (this.state.graphShowing === 'Geneology') {
	      return React.createElement('div', { id: 'multiGraph' }, React.createElement('div', { id: 'graph-frame' }, React.createElement(Geneology, { data: this.props.geneData }), React.createElement('div', { id: 'tabBox' }, myTabs)));
	    }
	    /* <div id='nonMapBoxes'>
	            <DetailsBox />
	          </div> */
	  }
	});
	var DetailsBox = React.createClass({
	  displayName: 'DetailsBox',

	  getInitialState: function getInitialState() {
	    return { content: [] };
	  },

	  componentDidMount: function componentDidMount() {
	    window.addEventListener('showDetails', this._updateContent);
	  },
	  componentWillUnmount: function componentWillUnmount() {
	    window.removeEventListener('showDetails', this._updateContent);
	  },

	  _updateContent: function _updateContent(e) {
	    this.setState({ content: e.detail });
	  },

	  render: function render() {
	    if (this.state.content === []) return React.createElement('div', null);
	    return React.createElement('div', { id: 'detailsBox' }, this.state.content.map(function (award, i) {
	      return React.createElement('div', { key: i, className: 'detailBoxItem' }, React.createElement('b', null, 'Year:'), '     ', award.year, ' ', React.createElement('br', null), React.createElement('b', null, 'Medal:'), '    ', award.medal, ' ', React.createElement('br', null), React.createElement('b', null, 'Style:'), '    ', award.style, ' ', React.createElement('br', null), React.createElement('b', null, 'Beer:'), '     ', award.beer, ' ', React.createElement('br', null), React.createElement('b', null, 'Brewery:'), '  ', award.brewery);
	    }));
	  }
	});

	var FilterBox = React.createClass({
	  displayName: 'FilterBox',

	  render: function render() {
	    //console.log("Rendering FilterBox, props:",this.props.filters);
	    return React.createElement('div', { className: 'filterBox' }, this.props.filters.map(function (filter, i) {
	      return React.createElement(Filter, { key: i, name: filter.name, values: filter.values, notify: this.props.notify });
	    }.bind(this)));
	  }
	});
	var Filter = React.createClass({
	  displayName: 'Filter',

	  getInitialState: function getInitialState() {
	    return { showItems: false,
	      mySearch: ''
	    };
	  },
	  componentDidMount: function componentDidMount() {
	    window.addEventListener('click', this._toggleCheck);
	  },
	  componentWillUnmount: function componentWillUnmount() {
	    window.removeEventListender('click', this._toggleCheck);
	  },
	  _toggleCheck: function _toggleCheck(e) {
	    //To close menu if user clicks anywhere else
	    if (e.target.getAttribute('data-filter') !== this.props.name) this.setState({ showItems: false });
	    //else this.setState({showItems:true});
	  },
	  _toggleShow: function _toggleShow() {
	    this.setState({ showItems: !this.state.showItems });
	  },
	  _search: function _search(e) {
	    e.stopPropagation();
	    e.preventDefault();
	    var keyCode = e.keyCode || e.which;
	    var ENTERKEY = 13,
	        TABKEY = 9; //Tab is ignored in the text boxes
	    if (keyCode !== ENTERKEY && keyCode !== TABKEY) {
	      //Something other than Enter/Tab
	      this.setState({ mySearch: e.target.value, showItems: true });
	    } else if (keyCode === ENTERKEY) {
	      //Enter
	      var valsToSend = this.props.values.map(function (value, i) {
	        if (~value[0].toLowerCase().indexOf(this.state.mySearch.toLowerCase())) return value[0];
	      }.bind(this));

	      //ABILITY TO RESET FILTER
	      if (this.state.mySearch === '') {
	        console.log('valsToSend is NULL');
	        valsToSend = RESET;
	      }

	      this.props.notify(this.props.name, valsToSend, true);
	    }
	  },
	  render: function render() {
	    var myItems = [];
	    if (this.state.showItems) {
	      //console.log('in filter render, this.props.values:', this.props.values);
	      myItems = this.props.values.map(function (value, i) {
	        //console.log('in filter render, value:', value); //debugger;
	        if (~value[0].toLowerCase().indexOf(this.state.mySearch.toLowerCase())) return React.createElement(FilterItem, { key: i, value: value[0], selected: value[1], name: this.props.name, notify: this.props.notify });
	      }.bind(this));
	    }
	    return React.createElement('div', { className: 'filter', filter: this.props.name }, React.createElement('input', { placeholder: this.props.name, onClick: this._toggleShow, onKeyUp: this._search, 'data-filter': this.props.name }), React.createElement('div', { className: 'filterSelection' }, ' ', myItems, ' '));
	  }
	});
	var FilterItem = React.createClass({
	  displayName: 'FilterItem',

	  getDefaultProps: function getDefaultProps() {
	    return { selected: true };
	  },
	  _handleSelection: function _handleSelection(e) {
	    console.log('Toggling selected for', this.props.name, ':', this.props.value);
	    this.props.notify(this.props.name, this.props.value, false);
	  },
	  render: function render() {
	    var selectionClass = '';
	    if (this.props.selected) selectionClass = 'filterOn';
	    return React.createElement('div', { onClick: this._handleSelection, className: selectionClass, 'data-filter': this.props.name }, this.props.value);
	  }
	});

	//Page begin:
	var dataPull = new GetData( //This is the runPage cb-function to start the page when data is loaded
	function (beerData, filterData, mapData, geneData) {
	  //Entry into site view
	  d3.select("#loading").remove();
	  ReactDOM.render( //Render page after underlying data has loaded
	  React.createElement(ClientUI, { initBeerData: beerData, initFilters: filterData, mapData: mapData, geneData: geneData }), document.getElementById('content'));
	});

	dataPull.pullData('json_data/', 'lat_long_20160223.csv', 'brewery_lat_long20160308.csv', 'awards.csv', 'US.json', 'year_style_id_parents_MOD.csv');

/***/ },
/* 2 */
/***/ function(module, exports) {

	"use strict";

	var GetData = function GetData(runPage) {

	  function pullData(dir, locFile, detLocFile, awardsFile, mapFile, geneFile) {
	    var locReturn = new XMLHttpRequest(),
	        awardsReturn = new XMLHttpRequest(),
	        mapReturn = new XMLHttpRequest(),
	        detLocReturn = new XMLHttpRequest(),
	        geneReturn = new XMLHttpRequest(),
	        myRequests = [],
	        numFiles = 5;

	    for (var i = 0; i < numFiles; i++) {
	      myRequests.push(false);
	    }

	    var _allReady = function _allReady() {
	      var _iteratorNormalCompletion = true;
	      var _didIteratorError = false;
	      var _iteratorError = undefined;

	      try {
	        for (var _iterator = myRequests[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
	          var fileReceived = _step.value;

	          if (!fileReceived) return false;
	        }
	      } catch (err) {
	        _didIteratorError = true;
	        _iteratorError = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion && _iterator.return) {
	            _iterator.return();
	          }
	        } finally {
	          if (_didIteratorError) {
	            throw _iteratorError;
	          }
	        }
	      }

	      return true;
	    };

	    locReturn.onreadystatechange = function () {
	      if (locReturn.readyState == 4 && locReturn.status == 200) {
	        myRequests[0] = true;
	        if (_allReady()) massage();
	      }
	    };
	    awardsReturn.onreadystatechange = function () {
	      if (awardsReturn.readyState == 4 && awardsReturn.status == 200) {
	        myRequests[1] = true;
	        if (_allReady()) massage();
	      }
	    };
	    mapReturn.onreadystatechange = function () {
	      if (mapReturn.readyState == 4 && mapReturn.status == 200) {
	        myRequests[2] = true;
	        if (_allReady()) massage();
	      }
	    };
	    detLocReturn.onreadystatechange = function () {
	      if (detLocReturn.readyState == 4 && detLocReturn.status == 200) {
	        myRequests[3] = true;
	        if (_allReady()) massage();
	      }
	    };
	    geneReturn.onreadystatechange = function () {
	      if (geneReturn.readyState == 4 && geneReturn.status == 200) {
	        myRequests[4] = true;
	        if (_allReady()) massage();
	      }
	    };

	    locReturn.open("GET", dir + locFile, true);
	    locReturn.send();
	    awardsReturn.open("GET", dir + awardsFile, true);
	    awardsReturn.send();
	    mapReturn.open("GET", dir + mapFile, true);
	    mapReturn.send();
	    detLocReturn.open('GET', dir + detLocFile, true);
	    detLocReturn.send();
	    geneReturn.open('GET', dir + geneFile, true);
	    geneReturn.send();

	    var massage = function massage() {
	      //Data Massage
	      var latLongs = $.csv.toObjects(locReturn.responseText),
	          detLatLongs = $.csv.toObjects(detLocReturn.responseText),
	          awards = $.csv.toObjects(awardsReturn.responseText),
	          map = JSON.parse(mapReturn.responseText),
	          geneology = $.csv.toObjects(geneReturn.responseText),
	          ttl = [],
	          myData = [];

	      if (awards.length < 2) {
	        console.log('aborting due to insufficient length of awards data');return;
	      }

	      console.table(geneology);

	      ttl = ['show', 'year', 'style', 'medal', 'beer', 'brewery', 'city', 'state', 'LL'];

	      var _iteratorNormalCompletion2 = true;
	      var _didIteratorError2 = false;
	      var _iteratorError2 = undefined;

	      try {
	        for (var _iterator2 = awards[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
	          var awardRow = _step2.value;

	          var tempLL = findLL(latLongs, detLatLongs, awardRow.brewery, awardRow.city + ', ' + awardRow.state);
	          if (tempLL !== false) {
	            awardRow.LL = tempLL;
	            awardRow.show = true;
	            myData.push(awardRow);
	          } // else console.log('Record missing LL:', awardRow);
	        }
	      } catch (err) {
	        _didIteratorError2 = true;
	        _iteratorError2 = err;
	      } finally {
	        try {
	          if (!_iteratorNormalCompletion2 && _iterator2.return) {
	            _iterator2.return();
	          }
	        } finally {
	          if (_didIteratorError2) {
	            throw _iteratorError2;
	          }
	        }
	      }

	      geneology = treeify(geneology);

	      makeFilters(myData, ttl, map, geneology);
	    };

	    var makeFilters = function makeFilters(beerData, ttl, map, geneology) {
	      var filterData = [],
	          theseVals = [],
	          myValues = [],
	          temp;

	      for (var y = 1; y < ttl.length - 1; y++) {
	        theseVals = [];
	        myValues[ttl[y]] = [];

	        for (var z = 0; z < beerData.length; z++) {
	          //Ignore 'show' andf 'LL' for filters
	          temp = beerData[z][ttl[y]];
	          if (theseVals.indexOf(temp) === -1) {
	            //If value not represented, add it
	            theseVals.push(temp);
	            myValues[ttl[y]].push([temp, true]);
	          }
	        }
	      }

	      for (var x = 1; x < ttl.length - 1; x++) {
	        filterData.push({
	          name: ttl[x],
	          values: myValues[ttl[x]]
	        });
	      }

	      //console.log('filter data:',filterData);
	      //console.log('marker data:',beerData);

	      runPage(beerData, filterData, map, geneology);
	    };

	    var treeify = function treeify(data) {
	      //Convert flat data into a nice tree
	      var YEAR_START = 1998;
	      var dataMap = data.reduce(function (map, node) {
	        node.level = parseInt(node.year) - YEAR_START;
	        map[node.id] = node;
	        return map;
	      }, {});

	      var treeRoot = { style: 'root', id: '0', level: 0 };
	      dataMap['0'] = treeRoot;

	      // create the tree array
	      var treeData = [];
	      treeData.push(treeRoot);

	      data.forEach(function (node) {
	        // add to parent
	        var parent = dataMap[node.parent];

	        if (!parent) parent = dataMap['0'];
	        // create child array if it doesn't exist
	        (parent.children || (parent.children = [])).
	        // add node to child array
	        push(node);
	        /*
	        if (parent) {
	        	// create child array if it doesn't exist
	        	(parent.children || (parent.children = []))
	        		// add node to child array
	        		.push(node);
	        } else {
	        	// parent is null or missing
	        	treeData.push(node);
	        }
	        */
	      });

	      return treeData;
	    };
	  }

	  var findLL = function findLL(latLongs, detLatLongs, brewery, location) {
	    var z = 0;
	    brewery += ', ' + location;
	    while (z < detLatLongs.length) {
	      //Preferred pass on brewery
	      if (detLatLongs[z].brewery_city == brewery) return { lat: detLatLongs[z].lat, lng: detLatLongs[z].lng };
	      z++;
	    }
	    z = 0;
	    while (z < latLongs.length) {
	      //Consolation pass on city/state
	      if (latLongs[z].location == location) return { lat: latLongs[z].lat, lng: latLongs[z].lng };
	      z++;
	    }
	    //console.log('no lat long found for:',location);
	    return false;
	  };

	  return {
	    pullData: pullData
	  };
	};

	module.exports = GetData;

/***/ }
/******/ ]);