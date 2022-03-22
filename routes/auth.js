const express = require('express');
const router = express.Router();
const {register,login,forgotPassword,resetPassword,googleLogin,faceBookLogin} = require('../controllers/auth')

router.post('/register',register);
router.post('/login',login);
router.post('/forgotPassword',forgotPassword);
router.put('/resetPassword/:resetToken',resetPassword);
router.post('/googleLogin',googleLogin);
router.post('/faceBookLogin',faceBookLogin);

module.exports = router;