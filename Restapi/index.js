const express = require("express"); // to ensure that we have started server from node js
const bodyParser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql");
const crypto = require("crypto"); // for converting password into md5
const jwt = require("jsonwebtoken");
const app = express(); // to make sure that we have started the server with this app

//Code for validation initialization starts
const Validator = require('validatorjs');
const validator = (body, rules, customMessages, callback) => {
    const validation = new Validator(body, rules, customMessages);
    validation.passes(() => callback(null, true));
    validation.fails(() => callback(validation.errors, false));
};
//Code for validation initialization ends

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

                            return res.status(200).send({
                                code: 200,
                                error: false,
                                data: results,
                                message: 'Record has been added'
                            });
                        });
                    } else {
                        return res.status(404).send({
                            code: 404,
                            error: true,
                            message: 'Record already exist'
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
            const token = jwt.sign(
                { email: email },
                'secretkey',
                {
                    expiresIn: "2h",
                }
            );
            conn.query('Select * from users where email=? and password=?', [email, password], function (error, result, fields) {
                if (result.length > 0) {
                    conn.query('UPDATE users SET login_token = ? WHERE email = ?', [token, email]);
                    return res.status(200).send({
                        code: 200,
                        error: false,
                        message: 'Login successful',
                        token: token,
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

module.exports = app;