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
/***/ function(module, exports) {

	'use strict';

	var ClientUI = React.createClass({
	  displayName: 'ClientUI',

	  getInitialState: function getInitialState() {
	    return { filters: [{ name: 'year', values: [['2013', true], ['2014', true], ['2015', true]] }, { name: 'style', values: [['American Pale', true], ['Irish Stout', true], ['English Bitter', true], ['Hefewiezen', true]] }]
	    };
	  },
	  _applyFilter: function _applyFilter(name, value) {
	    var nextFilters = this.state.filters;
	    for (var z = 0; z < nextFilters.length; z++) {
	      if (nextFilters[z].name === name) {
	        for (var y = 0; y < nextFilters[z].values.length; y++) {
	          if (nextFilters[z].values[y][0] === value) nextFilters[z].values[y][1] = !nextFilters[z].values[y][1];
	        }
	      }
	    }
	    this.setState({ filters: nextFilters });
	  },

	  render: function render() {
	    return React.createElement('div', { id: 'UI' }, React.createElement(Map, { locData: this.props.locData }), React.createElement(FilterBox, { filters: this.state.filters, notify: this._applyFilter }));
	  }
	});
	var Map = React.createClass({
	  displayName: 'Map',
	  componentDidMount: function componentDidMount() {
	    this.componentDidUpdate(); // Makes sure we call update on first mount
	  },
	  componentDidUpdate: function componentDidUpdate() {
	    var map = new GMaps({
	      div: '#map',
	      lat: 37.09024,
	      lng: -95.712891,
	      zoom: 4
	    });
	    for (var z = 0; z < this.props.locData.length; z++) {
	      map.addMarker(this.props.locData[z]);
	    }
	  },

	  render: function render() {
	    return React.createElement('div', { id: 'map-holder' }, React.createElement('p', { id: 'loading' }, 'Loading map...'), React.createElement('div', { id: 'map' }));
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
	    var nextSearch = '';
	    this.setState({ mySearch: e.target.value });
	  },
	  render: function render() {
	    var myItems = [];
	    if (this.state.showItems) {
	      myItems = this.props.values.map(function (value, i) {
	        if (~value[0].toLowerCase().indexOf(this.state.mySearch.toLowerCase())) return React.createElement(FilterItem, { key: i, value: value[0], selected: value[1], name: this.props.name, notify: this.props.notify });
	      }.bind(this));
	    }
	    return React.createElement('div', { className: 'filter', filter: this.props.name }, React.createElement('input', { placeholder: this.props.name, onClick: this._toggleShow, onChange: this._search, 'data-filter': this.props.name }), React.createElement('div', { className: 'filterSelection' }, ' ', myItems, ' '));
	  }
	});
	var FilterItem = React.createClass({
	  displayName: 'FilterItem',

	  getDefaultProps: function getDefaultProps() {
	    return { selected: true };
	  },
	  _handleSelection: function _handleSelection(e) {
	    console.log('Toggling selected for', this.props.name, ':', this.props.value);
	    this.props.notify(this.props.name, this.props.value);
	  },
	  render: function render() {
	    var selectionClass = '';
	    if (this.props.selected) selectionClass = 'filterOn';
	    return React.createElement('div', { onClick: this._handleSelection, className: selectionClass, 'data-filter': this.props.name }, this.props.value);
	  }
	});

	function pullData(x) {
	  var fileReturn = new XMLHttpRequest();
	  fileReturn.onreadystatechange = function () {
	    if (fileReturn.readyState == 4 && fileReturn.status == 200) {
	      var entireDataFile = $.csv.toObjects(fileReturn.responseText);

	      for (var z = 0; z < entireDataFile.length; z++) {
	        entireDataFile[z].infoWindow = {
	          content: entireDataFile[z].location
	        };
	        entireDataFile[z].mouseover = function (e) {
	          this.infoWindow.open(this.map, this);
	        };
	        entireDataFile[z].mouseout = function () {
	          this.infoWindow.close();
	        };
	      }

	      console.log(entireDataFile);

	      ReactDOM.render( //Render page after underlying data has loaded
	      React.createElement(ClientUI, { locData: entireDataFile }), document.getElementById('content'));
	    }
	  };
	  fileReturn.open("GET", x, true);
	  fileReturn.send();
	}

	//Page begin:
	pullData('json_data/lat_long_20160223.csv');

/***/ }
/******/ ]);