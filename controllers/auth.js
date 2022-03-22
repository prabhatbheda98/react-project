const User = require("../models/User");
const crypto = require("crypto");
const errorResponse = require('../utils/errorResponse')
const sendEmail = require('../utils/sendEmail')
const { OAuth2Client } = require('google-auth-library')
const fetch = require('node-fetch')
const client = new OAuth2Client("438256015775-g4v37oli5sp56neeu0e8c6dc7e5dlva1.apps.googleusercontent.com")
exports.register = async (req, res, next) => {
    const { userName, email, password } = req.body;
    try {
        const user = await User.create({
            userName,
            email,
            password,
        });
        // res.status(201).json({
        //     success: true,
        //     user,
        // });
        console.log(user.password.length)
        sendToken(user, 200, res);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'please enter proper details'
        });
    }
};
exports.login = async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        res
            .status(400)
            .json({ success: false, error: "Please provide an email and password" });
    }

    try {
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            res.status(400).json({ success: false, error: "email does not match" });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            res.status(400).json({ success: false, error: "password does not match" });
        }
        sendToken(user, 200, res);
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        })
    }
};


exports.forgotPassword = async (req, res, next) => {
    const { email } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'No email could not be sent'
            });
        }

        // Reset Token Gen and add to database hashed (private) version of token
        const resetToken = user.getResetPasswordToken();

        await user.save();

        // Create reset url to email to provided email
        const resetUrl = `http://localhost:3000/resetPassword/${resetToken}`;

        // HTML Message
        const message = `
        <h1>You have requested a password reset</h1>
        <p>Please make a put request to the following link:</p>
        <a href=${resetUrl} clicktracking=off>${resetUrl}</a>
      `;

        try {
            await sendEmail({
                to: email,
                subject: "Password Reset Request",
                text: message,
            });

            res.status(200).json({ success: true, data: "Email Sent" });
        } catch (err) {
            console.log(err);

            user.resetPasswordToken = undefined;
            user.resetPasswordExpire = undefined;

            await user.save();

            return res.status(401).json({
                success: false,
                error: 'Email could not be sent'
            });
        }
    } catch (err) {
        next(err);
    }

};
exports.resetPassword = async (req, res, next) => {
    const resetPasswordToken = crypto
        .createHash("sha256")
        .update(req.params.resetToken)
        .digest("hex");

    try {
        const user = await User.findOne({
            resetPasswordToken,
            resetPasswordExpire: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'Invalid Token'
            })
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save();

        res.status(201).json({
            success: true,
            data: "Password Updated Success",
            token: user.getSignedJwtToken(),
        });
    } catch (err) {
        next(err);
        console.log(err);
    }
};

exports.googleLogin = async (req, res) => {
    const { tokenId } = req.body
    const googleUserData = await client.verifyIdToken({ idToken: tokenId, audience: "438256015775-g4v37oli5sp56neeu0e8c6dc7e5dlva1.apps.googleusercontent.com" })
    try {
        const { email_verified, email, name } = googleUserData.payload
        if (email_verified) {
            const user = await User.findOne({ email })
            if (!user) {
                const password = email + "googleLogin";
                try {
                    const user = await User.create({
                        userName: googleUserData.payload.name,
                        email,
                        password,
                    });
                    // res.status(201).json({
                    //     success: true,
                    //     user,
                    // });
                    sendToken(user, 200, res);

                } catch (error) {
                    res.status(500).json({
                        success: false,
                        error: 'something went wrong'
                    });
                }
            } else {
                try {
                    // const user = await User.findOne({ email })
                    sendToken(user, 200, res);
                } catch (error) {
                    res.status(500).json({
                        success: false,
                        error: 'something went wrong'
                    });
                }
            }
        }
    } catch (error) {
    }
}

exports.faceBookLogin = async (req, res) => {
    const { accessToken, userID } = req.body
    const urlGraphFacebook = `https://graph.facebook.com/v2.11/${userID}/?fields=id,name,email&access_token=${accessToken}`

    try {
        const data = await fetch(urlGraphFacebook)
        const response = await data.json();
        const { name, email } = response
        const user = await User.findOne({ email })

        if (!user) {
            const password = email + "facebookLogin";
            try {
                const user = await User.create({
                    userName: name,
                    email,
                    password,
                });
                // res.status(201).json({
                //     success: true,
                //     user,
                // });
                sendToken(user, 200, res);

            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'something went wrong'
                });
            }

        }else{
            try {
                // const user = await User.findOne({ email })
                sendToken(user, 200, res);
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'something went wrong'
                });
            }
        }


    } catch (error) {

    }
}
const sendToken = (user, statusCode, res,) => {
    const token = user.getSignedJwtToken();
    res.status(statusCode).json({ success: true, token, user });
};
