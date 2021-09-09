const express = require("express"); // to ensure that we have started server from node js
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql");
const crypto = require("crypto");

const app = express(); // to make sure that we have started the server with this app

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'user_management'
});

conn.connect(function(error){
    if(error) throw error;
    //console.log('database connected');
});

app.listen(4000, function(){
    console.log('Server listening on port : 4000');
});

app.use(bodyParser.json());
app.use(cors());
app.use(bodyParser.urlencoded({
    extended : true
}));

app.get('/', function(req, res){
    return res.send({
        error : false,
        message : 'hello this is priyanka'
    });
});

//Fetch all users
app.get('/users', function(req, res){
    conn.query('Select * from users', function(error, results){
        if(error) throw error;
        return res.send({
            error : false,
            data : results,
            message : 'user list'
        });
    });
});

//Fetch user by id
app.get('/single/:id', function(req, res){
    let id = req.params.id;
    if(!id){
        return res.status(400).send({
            error : true,
            message : 'Id is required'
        });
    }
    conn.query('Select * from users where id=?', id, function(error, results, fields){
        if(error) throw error;
        return res.status(200).send({
            error : false,
            data : results,
            message : 'single user'
        });
    });
});

//Signup api
app.post('/signup', function(req, res){
    let uname = req.body.uname;
    let email = req.body.email;
    let password = crypto.createHash('md5').update(req.body.password).digest('hex');
    let cpassword = crypto.createHash('md5').update(req.body.cpassword).digest('hex');
    if(!uname && !email && !password && !cpassword){
        return res.status(400).send({
            error : true,
            message : 'Please provide all the information'
        });
    }

    conn.query('Select * from users where email=?', email, function(error, results, fields){
        if(error){
            console.log(error);
        }else{
            if (results && !results.length) {
                conn.query('INSERT into users(name, email, password) value(?, ?, ?)', [uname, email, password], function(error, results, fields){
                
                        return res.status(200).send({
                            error : false,
                            data : results,
                            message : 'Record has been added'
                        });
                    });
                }else{
                    return res.status(200).send({
                        error : true,
                        message : 'Record already exis'
                    });
                }
        }
        
    });

    
});

module.exports = app;