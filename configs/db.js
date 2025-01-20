const mongoose = require('mongoose');

//live connection

const conn = mongoose.connect('mongodb://AskpertUsr:Askthala0505@127.0.0.1:27017/Askpertdb', { useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify:false });

//local code with live connection
// const conn = mongoose.connect('mongodb://AskpertUsr:Askthala0505@3.28.96.99:27017/Askpertdb', { useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify:false });

exports.mongoose = mongoose;
exports.conn = conn;
