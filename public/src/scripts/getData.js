var GetData = (function (runPage) {
    
  function pullData(dir, locFile, detLocFile, awardsFile, mapFile, geneFile) {
    var locReturn = new XMLHttpRequest(),
        awardsReturn = new XMLHttpRequest(),
        mapReturn = new XMLHttpRequest(),
        detLocReturn = new XMLHttpRequest(),
        geneReturn = new XMLHttpRequest(),
        myRequests = [],
        numFiles = 5;
    
    for (let i=0; i<numFiles; i++) {
      myRequests.push(false);
    }
    
    var _allReady = function() {
      for (let fileReceived of myRequests) {
        if (!fileReceived) return false;
      }
      return true;
    };
    
    locReturn.onreadystatechange = function() {
      if (locReturn.readyState==4 && locReturn.status==200)
      {
        myRequests[0]=true;
        if (_allReady()) massage();
      }
    };
    awardsReturn.onreadystatechange = function() {
      if (awardsReturn.readyState==4 && awardsReturn.status==200)
      {
        myRequests[1]=true;
        if (_allReady()) massage();
      }
    };
    mapReturn.onreadystatechange = function() {
      if (mapReturn.readyState==4 && mapReturn.status==200)
      {
        myRequests[2]=true;
        if (_allReady()) massage();
      }
    };
    detLocReturn.onreadystatechange = function() {
      if (detLocReturn.readyState==4 && detLocReturn.status==200)
      {
        myRequests[3]=true;
        if (_allReady()) massage();
      }
    };
    geneReturn.onreadystatechange = function() {
      if (geneReturn.readyState==4 && geneReturn.status==200)
      {
        myRequests[4]=true;
        if (_allReady()) massage();
      }
    };
    
    locReturn.open("GET", dir+locFile, true);
    locReturn.send();
    awardsReturn.open("GET", dir+awardsFile, true);
    awardsReturn.send();
    mapReturn.open("GET", dir+mapFile, true);
    mapReturn.send();
    detLocReturn.open('GET', dir+detLocFile, true);
    detLocReturn.send();
    geneReturn.open('GET', dir+geneFile, true);
    geneReturn.send();
    
    var massage = function() {
    //Data Massage
      var latLongs =    $.csv.toObjects(locReturn.responseText),
          detLatLongs = $.csv.toObjects(detLocReturn.responseText),
          awards =      $.csv.toObjects(awardsReturn.responseText),
          map =         JSON.parse(mapReturn.responseText),
          geneology =   $.csv.toObjects(geneReturn.responseText),
          ttl = [], myData = [];
      
      if (awards.length<2) {
        console.log('aborting due to insufficient length of awards data'); return;
      }
      
      console.table(geneology);
      
      ttl = ['show', 'year', 'style', 'medal', 'beer', 'brewery', 'city', 'state', 'LL' ];

      for (let awardRow of awards) {
          let tempLL = findLL(latLongs, detLatLongs, awardRow.brewery, awardRow.city + ', ' + awardRow.state);
          if (tempLL !== false) {
            awardRow.LL = tempLL;
            awardRow.show = true;
            myData.push(awardRow);
          } // else console.log('Record missing LL:', awardRow);
      }
      
      geneology = treeify(geneology);
      
      makeFilters(myData, ttl, map, geneology, awards);
    };
    
    var makeFilters = function(beerData, ttl, map, geneData, awardsData) {
      var filterData = [],
          theseVals = [], myValues = [],
          temp;
      
      for (var y=1; y<ttl.length-1; y++) {
        theseVals = [];
        myValues[ ttl[y] ] = [];
        
        for (var z=0; z<beerData.length; z++) {              //Ignore 'show' andf 'LL' for filters
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
      
      runPage(beerData, filterData, map, geneData, awardsData);
    };
    
    var treeify = function(data) {
    //Convert flat data into a nice tree
      var YEAR_START = 1998;
      var dataMap = data.reduce(function(map, node) {
        node.level = parseInt(node.year) - YEAR_START;
      	map[node.id] = node;
      	return map;
      }, {});
      
      var treeRoot = { style:'root', id: '0', level: 0};
      dataMap['0'] = treeRoot;
      
      // create the tree array
      var treeData = [];
      treeData.push(treeRoot);

      data.forEach(function(node) {
      	// add to parent
      	var parent = dataMap[node.parent];
      	
      	if (!parent) parent = dataMap['0'];
    		// create child array if it doesn't exist
    		(parent.children || (parent.children = []))
    			// add node to child array
    			.push(node);
      });
      
      console.log('treeData, pre:', treeData);
      
      treeData = inFillNodes(treeData, awardsData);
      
      return treeData;
    };
  }
  
  var inFillNodes = function(treeData, awardsData) {
  //Fills in the gap-spaces with the same 'node' as the parent, should it have children down the line
    var sourceNode = JSON.parse(JSON.stringify(treeData[0])),
        sourceYear = parseInt(sourceNode.year),
        sourceStyle = sourceNode.style,
        doIContinue = findAward(sourceNode.year, sourceStyle, awardsData);
        
    
    
    if (sourceNode.children)
    
    let childNode = sourceNode.children[0] {
      if (parseInt(childNode.year) > (sourceYear+1) ) {         //We need to create infill
        let myNode
      }
    }
    */
    
  };
  
  var findAward = function(year, style, awardsData) {
    var i = 0;
    while (i < awardsData.length) {
      if (awardsData[i].year === year && awardsData[i].style === style) return true;
      i++;
    }
    return false;
  };
  
  var findLL = function(latLongs, detLatLongs, brewery, location) {
    var z = 0;
    brewery += ', '+location;
    while (z < detLatLongs.length) {      //Preferred pass on brewery
      if (detLatLongs[z].brewery_city == brewery) return { lat: detLatLongs[z].lat, lng: detLatLongs[z].lng };
      z++;
    }
    z=0;
    while (z < latLongs.length) {         //Consolation pass on city/state
      if (latLongs[z].location == location) return { lat: latLongs[z].lat, lng: latLongs[z].lng };
      z++;
    }
    //console.log('no lat long found for:',location);
    return false;
  };
  
  return {
        pullData: pullData
    };
    
});

module.exports = GetData;