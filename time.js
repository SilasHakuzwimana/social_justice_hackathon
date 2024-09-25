// const moment = require('moment-timezone');

// // Current EAT time
// const currentEATTime = moment.tz("Africa/Kigali").format('YYYY-MM-DD HH:mm:ss');
// console.log(currentEATTime);

// // Add one hour and display in EAT
// const timing = moment.tz("Africa/Kigali").add(1, 'hour').format('YYYY-MM-DD HH:mm:ss');
// console.log(timing);

const moment = require('moment-timezone');

// Current EAT time
const currentEATTime = moment.tz("Africa/Kigali").format('YYYY-MM-DD HH:mm:ss');
console.log(currentEATTime);

// Add 30 minutes and display in EAT
const timing = moment.tz("Africa/Kigali").add(30, 'minutes').format('YYYY-MM-DD HH:mm:ss');
console.log(timing);
