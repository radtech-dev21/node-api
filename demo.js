var mysql = require("mysql");
var conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "nodejs",
});

conn.connect(function (error) {
  if (error) throw error;
  console.log("connected to database");
  //code for fetching data from database
    conn.query('select * from users',function(err,users){
        if (err) throw error;
        console.log("My user list is :-",users[0]);
        console.log("My first user is :-",users[0].name);
    });
});

