var express = require('express'),
    app = express(),
    path = require('path');

app.use(express.static(__dirname));

/*app.get('/', function(req, res){
  res.render('index.html');
});*/

var serverPath = process.env.PORT || 8000;
app.listen(serverPath, function () {
  console.log('GABF listening on port ',serverPath,'...');
});