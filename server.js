require('dotenv').config();
const express = require('express');
const app = express();
const cors = require('cors')
app.use(cors());
const port = process.env.PORT || 4000;
const connectDb = require('./config/db')
connectDb();
const router = require('./routes/auth')
const privateRouter = require('./routes/private')

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/auth',router);
app.use('/api/private',privateRouter);

app.listen(port,()=>{console.log(`Server Running At Port ${port}`)});