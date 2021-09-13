const express = require("express"); // to ensure that we have started server from node js
const bodyParser = require("body-parser");
const { check, validationResult } = require('express-validator');
const myValidationResult = validationResult.withDefaults({
    formatter: error => {
      return {
          msg: error.msg
      };
    },
  });
const cors = require("cors");
const mysql = require("mysql");
const crypto = require("crypto"); // for converting password into md5
const jwt = require("jsonwebtoken");

const app = express(); // to make sure that we have started the server with this app

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'user_management'
});

conn.connect(function (error) {
    if (error) throw error;
    //console.log('database connected');
});

app.listen(4000, function () {
    console.log('Server listening on port : 4000');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cors());

app.get('/', function (req, res) {
    return res.send({
        error: false,
        message: 'hello this is priyanka'
    });
});

//Fetch all records
app.get('/allrecords', function (req, res) {
    conn.query('Select * from users', function (error, results) {
        if (error) throw error;
        return res.send({
            error: false,
            data: results,
            message: 'user list'
        });
    });
});

//Fetch record by id
app.get('/single/:id', function (req, res) {
    let id = req.params.id;
    if (!id) {
        return res.status(400).send({
            error: true,
            message: 'Id is required'
        });
    }
    conn.query('Select * from users where id=?', id, function (error, results, fields) {
        if (error) throw error;
        return res.status(200).send({
            error: false,
            data: results,
            message: 'single user'
        });
    });
});

//Signup api
app.post('/signup', [
    check('uname')
          .exists()
          .withMessage('Username is required')
          .isLength({ min: 3 })
          .withMessage('Username must be at least 3 chars long')
          .matches(/^[A-Za-z\s]+$/)
          .withMessage('Username must be alphabetic'),
    check('email', 'Email required in valid format')
        .isEmail(),
    check('password')
        .isLength({ min: 5 })
        .withMessage('Password must be at least 5 chars long'),
    check('cpassword')
    .isLength({ min: 5 })
    .withMessage('Confirm Password must be at least 5 chars long')
    .custom(async (cpassword, {req}) => {
        const password = req.body.password
        if(password !== cpassword){
          throw new Error('Confirm Password must be same as Password')
        }
      })
], function (req, res) {
    const errors = myValidationResult(req);
    
    if (!errors.isEmpty()) {
        return res.status(400).jsonp({
            status : 400,
            "message": "Validation errors in your request",
            bodyValidationErrors: errors.array({ onlyFirstError: true })
        });
        
    } else {
        let uname = req.body.uname;
        let email = req.body.email;
        let password = crypto.createHash('md5').update(req.body.password).digest('hex');
        let cpassword = crypto.createHash('md5').update(req.body.cpassword).digest('hex');
        conn.query('Select * from users where email=?', email, function (error, results, fields) {
            if (error) {
                console.log(error);
            } else {
                if (results && !results.length) {
                    conn.query('INSERT into users(name, email, password) value(?, ?, ?)', [uname, email, password], function (error, results, fields) {

                        return res.status(200).send({
                            status: 200,
                            data: results,
                            message: 'Record has been added'
                        });
                    });
                } else {
                    return res.status(404).send({
                        error: 404,
                        message: 'Record already exist'
                    });
                }
            }

        });
    }
});

//Login api 
app.post('/login', [
    check('email', 'Email required in valid format')
        .isEmail(),
    check('password')
        .exists()
        .withMessage('Password is required')
        .isLength({ min: 5 })
        .withMessage('Password must be at least 5 chars long')
], function (req, res) {

    const errors = myValidationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).jsonp({
            status : 400,
            "message": "Validation errors in your request",
            bodyValidationErrors: errors.array({ onlyFirstError: true })
        });
    } else {
        let email = req.body.email;
        let password = crypto.createHash('md5').update(req.body.password).digest('hex');
        conn.query('Select * from users where email=? and password=?', [email, password], function (error, result, fields) {
            if (result.length > 0) {
                const token = jwt.sign(
                    {email : email},
                    'secretkey',
                    {
                      expiresIn: "2h",
                    }
                  );
                return res.status(200).send({
                    status: 200,
                    message: 'Login successful',
                    token : token,
                    data : result[0]
                });
            } else {
                return res.status(404).send({
                    status: 404,
                    message: 'Invalid Email ID or Password'
                })
            }
        });
    }
});

module.exports = app;