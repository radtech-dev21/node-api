const express = require('express');
const app = express();

app.listen(4000, function(){
    console.log('Server listening at port 4000');
});

app.set('view engine', 'ejs');

app.get('/', function(req, res){
    res.render('index');
});

app.get('/register', function(req, res){
    res.render('register');
});