var express = require('express'),
    app = express(),
    path = require('path');

app.use(express.static(__dirname + '/public'));

/*app.get('/', function(req, res){
  res.render('index.html');
});*/

app.listen(8000, function () {
  console.log('GABF listening on port 8000...');
});