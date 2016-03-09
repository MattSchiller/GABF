var GetData = (function (runPage) {
    
  function pullData(dir, locFile, detLocFile, awardsFile, mapFile) {
    var locReturn = new XMLHttpRequest(),
        awardsReturn = new XMLHttpRequest(),
        mapReturn = new XMLHttpRequest(),
        detLocReturn = new XMLHttpRequest(),
        myRequests = [];
        
    myRequests.push(false);
    myRequests.push(false);
    myRequests.push(false);
    myRequests.push(false);
  
    locReturn.onreadystatechange = function() {
      if (locReturn.readyState==4 && locReturn.status==200)
      {
        myRequests[0]=true;
        if (myRequests[0]===myRequests[1] && myRequests[1]===myRequests[2] && myRequests[2]===myRequests[3]) massage();
      }
    };
    awardsReturn.onreadystatechange = function() {
      if (awardsReturn.readyState==4 && awardsReturn.status==200)
      {
        myRequests[1]=true;
        if (myRequests[0]===myRequests[1] && myRequests[1]===myRequests[2] && myRequests[2]===myRequests[3]) massage();
      }
    };
    mapReturn.onreadystatechange = function() {
      if (mapReturn.readyState==4 && mapReturn.status==200)
      {
        myRequests[2]=true;
        if (myRequests[0]===myRequests[1] && myRequests[1]===myRequests[2] && myRequests[2]===myRequests[3]) massage();
      }
    };
    detLocReturn.onreadystatechange = function() {
      if (detLocReturn.readyState==4 && detLocReturn.status==200)
      {
        myRequests[3]=true;
        if (myRequests[0]===myRequests[1] && myRequests[1]===myRequests[2] && myRequests[2]===myRequests[3]) massage();
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
    
    var massage = function() {
    //Data Massage
      var latLongs =    $.csv.toObjects(locReturn.responseText),
          detLatLongs = $.csv.toObjects(detLocReturn.responseText),
          awards =      $.csv.toObjects(awardsReturn.responseText),
          map =         JSON.parse(mapReturn.responseText),
          ttl = [], myData = [];
      
      if (awards.length<2) {
        console.log('aborting due to insufficient length of awards data'); return;
      }
      
      ttl = ['show', 'year', 'style', 'medal', 'beer', 'brewery', 'city', 'state', 'LL' ];

      console.log('awards:', awards);
      
      for (let awardRow of awards) {
          let tempLL = findLL(latLongs, detLatLongs, awardRow.brewery, awardRow.city + ', ' + awardRow.state);
          if (tempLL !== false) {
            awardRow.LL = tempLL;
            awardRow.show = true;
            myData.push(awardRow);
          }
      }
      
      makeFilters(myData, ttl, map);
    };
    
    var makeFilters = function(beerData, ttl, map) {
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
      
      runPage(beerData, filterData, map);
    };
  }
       
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