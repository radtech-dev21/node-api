const express = require("express"); // to ensure that we have started server from node js
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql");
const crypto = require("crypto"); // for converting password into md5
const jwt = require("jsonwebtoken");
const app = express(); // to make sure that we have started the server with this app
require("dotenv").config();
const auth = require("./middleware/auth");
//Code for validation initialization starts
const Validator = require('validatorjs');
const validator = (body, rules, customMessages, callback) => {
    const validation = new Validator(body, rules, customMessages);
    validation.passes(() => callback(null, true));
    validation.fails(() => callback(validation.errors, false));
};
//Code for validation initialization ends


const swaggerUi = require('swagger-ui-express'),
swaggerDocument = require('./swagger.json');


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

app.use(
    '/api-docs',
    swaggerUi.serve, 
    swaggerUi.setup(swaggerDocument)
  );

app.listen(4000, function () {
    console.log('Server listening on port : 4000');
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));
app.use(cors());




//Signup Api
app.post('/signup', function (req, res, next) {
    const validationRule = {
        "uname": "required|string|alpha",
        "email": "required|email",
        "password": "required|string|min:6|confirmed",
        "password_confirmation": "required|string|min:6",
    }

    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(422)
                .send({
                    code: 422,
                    success: false,
                    message: 'Validation errors in your request',
                    data: err
                });
        } else {
            let uname = req.body.uname;
            let email = req.body.email;
            let password = crypto.createHash('md5').update(req.body.password).digest('hex');
            conn.query('Select * from users where email=?', email, function (error, results, fields) {
                if (error) {
                    console.log(error);
                } else {
                    if (results && !results.length) {
                        conn.query('INSERT into users(name, email, password) value(?, ?, ?)', [uname, email, password], function (error, results, fields) {
                            const token = jwt.sign(
                                { id: results.insertId, email: email },
                                process.env.TOKEN_KEY,
                                {
                                    expiresIn: "2h",
                                }
                            );
                            conn.query('UPDATE users SET access_token = ? WHERE email = ?', [token, email]);
                            return res.status(200).send({
                                code: 200,
                                error: false,
                                message: 'User successfully registered'
                            });
                        });
                    } else {
                        return res.status(404).send({
                            code: 404,
                            error: true,
                            message: 'User already exist'
                        });
                    }
                }

            });
        }
    });
});


//Login Api
app.post('/login', function (req, res, next) {
    const validationRule = {
        "email": "required|email",
        "password": "required|string|min:6",
    }

    validator(req.body, validationRule, {}, (err, status) => {
        if (!status) {
            res.status(422)
                .send({
                    code: 422,
                    error: true,
                    message: 'Validation errors in your request',
                    data: err
                });
        } else {
            let email = req.body.email;
            let password = crypto.createHash('md5').update(req.body.password).digest('hex');
            conn.query('Select * from users where email=? and password=?', [email, password], function (error, result, fields) {
                if (result.length > 0) {
                    const token = jwt.sign(
                        { id: result[0].id, email: email },
                        process.env.TOKEN_KEY,
                        {
                            expiresIn: "2h",
                        }
                    );
                    conn.query('UPDATE users SET access_token = ? WHERE email = ?', [token, email]);
                    return res.status(200).send({
                        code: 200,
                        error: false,
                        message: 'Login successful',
                        data: result[0]
                    });
                } else {
                    return res.status(422).send({
                        code: 422,
                        error: true,
                        message: 'Invalid Email ID or Password'
                    })
                }
            });
        }
    });
});

//Dashboard Api
app.get("/dashboard", auth, (req, res) => {
    var userID = req.user.id; //fetched id from response return by auth.js after verification
    conn.query('Select * from users where id=?', [userID], function (error, result, fields) {
        if (result.length > 0) {
            return res.status(200).send({
                code: 200,
                error: false,
                message: 'User Details',
                data: result[0]
            });
        } else {
            return res.status(422).send({
                code: 422,
                error: true,
                message: 'No data exist'
            })
        }
    });
});

module.exports = app;