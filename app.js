const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const path = require('path');
var app = express();
var cors = require('cors');
const logger = require('morgan');
const adminRoute = require('./routes/admin.routes')
const userRoute = require("./routes/user.routes");
const consultRoute = require("./routes/consult.routes");
const { dirname } = require('path');


//app.use(helmet());
app.use(cors())
app.use(bodyParser.json()); // use express
app.use(bodyParser.urlencoded({ extended: true }));
app.use(logger('dev'));

app.use('/admin', adminRoute);
app.use('/user', userRoute);
app.use('/consultant', consultRoute);

app.use('/upload', express.static(path.join(__dirname, 'upload')));
app.use('/template', express.static(path.join(__dirname, 'template')));

// app.use('', express.static(path.join(__dirname, 'dist', 'tailorLanding')));
// app.get('', (req, res) => {
//     res.sendFile(path.join(__dirname, 'dist', 'tailorLanding', 'index.html'));
// });


app.use('/adminpanel', express.static(path.join(__dirname, 'dist', 'askpertsAdmin')))
app.get('/adminpanel/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'askpertsAdmin', 'index.html'));
});


app.use('/userpanel', express.static(path.join(__dirname, 'dist', 'askpertsUser')))
app.get('/userpanel/*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'askpertsUser', 'index.html'));
});
app.get('/ping', (req, res) => {
    res.end(`<html><head><title>Tailor App</title></head><body><h1 align="center">Tailor Application On Work</h1></body></html>`);
});

app.listen(process.env.PORT || 3001, () => {
    console.log(`Server is connected....`);
});

