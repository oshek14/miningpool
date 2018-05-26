
// var moment = require('moment');
var userDate = new Date();
var userOffset = userDate.getTimezoneOffset();

console.log(userOffset);

// var date =new Date(1527252949000);
// console.log(new Date(date+userOffset));
// // 1527173522
var a = new Date(1527252949000);
console.log(a.getHours()," " ,a.getMinutes())

var z = new Date(1527252949000+(60000*240));
console.log(z.getHours()," " ,z.getMinutes())


