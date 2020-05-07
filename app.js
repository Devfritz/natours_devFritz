// jshint esversion:es6 or es8
const path = require('path');

const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorResponse = require('./utils/error');
const globalError = require('./controllers/errorControllers');

const dotenv = require('dotenv');
dotenv.config({path:'./config/config.env'});

const connectDB = require('./config/db');


const routeTour = require('./route/tours');
const routeUser = require('./route/users');
const routeReview = require('./route/review');
const viewRoute = require('./route/viewRoute');
const routeBooking = require('./route/bookingRoutes');


process.on("uncaughtException",(err , promise) => {
  console.log('UNCAUGHT EXCEPTION!  💥 Shutting down...');
  console.log(` ${err.message}`);
    process.exit(1);

})


const app = express();





connectDB();

app.set('view engine','pug')
app.set('views',path.join(__dirname,'views'))

app.use(express.static(path.join(__dirname,'public')));

// secure HTTp headers
app.use(helmet());

if(process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}


 const limiter  = rateLimit({
   max:100,
   windowMs: 10 * 60 * 1000,
message : 'Too many requests from this Ip, please try again later.'

 })

 app.use('api',limiter);

app.use(express.json({limit:'10kb'}));
app.use(express.urlencoded({extended: true, limit: '10kb'}));

app.use(cookieParser());












 // app.use(cookieParser);
app.use(mongoSanitize());

app.use(xss());

app.use(hpp(({
  whitelist:['duration'
  ,'ratingsQuantity',
  'ratingsAverage',
  'maxGroupSize',
  'difficulty',
  'price'
]
})));





app.use((req,res,next )=> {
  req.requestTime = new Date().toISOString();
  console.log(req.cookies);
  next();
});

app.use(cors());

// Routes
app.use('/',viewRoute);
app.use('/api/v1/tours',routeTour);
app.use('/api/v1/users',routeUser);
app.use('/api/v1/review',routeReview);
app.use('/api/v1/bookings', routeBooking);



    app.all('*', (req,res,next) => {
     next(new errorResponse(`Can't find ${req.originalUrl} on this server`,404));
});  

 app.use(globalError);

const server = app.listen(3000,()=>{
console.log(`server is running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`);
});

process.on('unhandledRejection',(err,promise) => {
console.log(`error connection: ${err.name} , ${err.message} `);
server.close( () => process.exit(1) );
});



