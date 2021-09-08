const fs = require('fs');

// fs.readFile('file.txt', 'utf8', (err, data)=>{
//     console.log(err, data);
// });
// const a = fs.readFileSync('file.txt');
// console.log(a.toString());
// console.log('Finished reading file');


// fs.writeFile('file.txt','New file text created by priyanka',()=>{
//     console.log('written to the file');
// });
const a1 = fs.writeFileSync('file.txt','Hi i am writing file');
console.log(a1);
console.log('Finished writing a file');