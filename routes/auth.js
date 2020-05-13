const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = mongoose.model('User');
const bcrypt = require('bcryptjs');
const crypto = require ('crypto');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/keys');
const requireLogin = require('../middleware/requireLogin');
const nodemailer = require ('nodemailer');
const sendinblueTransport = require ('nodemailer-sendinblue-transport')
const {SENDINBLE_API, EMAIL} = require('../config/keys')


// const transporter = nodemailer.createTransport(sendinblueTransport({
//     auth:{
//         api_key:SENDINBLUE_API
//     }
// }))


var SibApiV3Sdk = require('sib-api-v3-sdk');
var defaultClient = SibApiV3Sdk.ApiClient.instance;

var apiKey = defaultClient.authentications['api-key'];
apiKey.apiKey = SENDINBLE_API;

var apiInstance = new SibApiV3Sdk.SMTPApi();

var sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail(); 

// apiInstance.createEmailCampaign(emailCampaigns).then(function(data) {
//   console.log('API called successfully. Returned data: ' + data);
// }, function(error) {
//   console.error(error);
// });
router.post('/signup',(req,res) => {
    const{name,email,password,pic} = req.body
    if(!email || !password || !name){
        return res.status(422).json({error:"Please add the fields"})
    }
    User.findOne({email:email})
        .then((savedUser) => {
            if(savedUser){
                return res.status(422).json({error:"User already exists with that email"})
            }
            bcrypt.hash(password,12)
            .then(hashedpassword => {
                const user = new User({
                    email,
                    password:hashedpassword,
                    name,
                    pic
                })
                user.save()
                .then(user => {
                    // transporter.sendMail({
                    //     to:user.email,
                    //     from:"no-reply@insta.com",
                    //     subject:"Sign up Success",
                    //     html:"<h1>Welcome to Instagram</h1>"

                    sendSmtpEmail = {
                        to: [{
                            email: user.email,
                            name: user.name
                        }],
                        templateId: 59,
                        params: {
                            name: 'Ketan',
                            surname: 'Shinde'
                        },
                        headers: {
                            api_key: SENDINBLE_API,
                            content_type: application/json,
                            accept: application/json
                        }
                    };
                    })
                    res.json({message:"Saved Successfully"})
                })
                .catch(err => {
                    console.log(err);
                })
            })
            .catch(err => {
                console.log(err)
            })
            })
            


router.post('/login',(req,res) => {
    const {email,password} =req.body
    if(!email || !password){
        return res.status(422).json({error:"Please add email or password"})
    }
    User.findOne({email:email})
    .then(savedUser => {
        if(!savedUser){
            return res.status(422).json({error:"Invalid email or password"})
        }
        bcrypt.compare(password,savedUser.password)
        .then(doMatch => {
            if(doMatch){
                //res.json({message:"SuccessFully Signed in"})
                const token = jwt.sign({_id:savedUser._id},JWT_SECRET)
                const{_id,name,email,followers,following,pic} = savedUser
                res.json({token,user:{_id,name,email,followers,following,pic}})
            }
            else{
                return res.status(422).json({error:"Invalid email or password"})
            }
        })
        .catch(err => {
            console.log(err);
        })
    })
})

router.post('/reset-password',(req,res) => {
    crypto.randomBytes((err,buffer) => {
        if(err){
            console.log(err)
        }
        const token = buffer.toString("hex")
        User.findOne({email:req.body.email})
        .then(user => {
            if(!user){
                return res.status(422).json({error:"User dont exists with email"})
            }
            user.resetToken = token
            user.expireToken = Date.now() + 3600000
            user.send().then((result) => {
                transporter.sendMail({
                    to:user.email,
                    from:"no-reply@insta.com",
                    subject:"Password reset",
                    html:`
                    <p>You are request for password rest</p>
                    <h5>click on this <a href="${EMAIL}/reset/${token}">link</a> to reset password</h5>
                    `
                })
                res.json({message:"Check your email"})
            })
        })
    })
})

router.post('/new-password',(req,res) => {
    const newPassword = req.body.paassword
    const sentToken = req.body.token
    User.findOne({resetToken:sentToken,expireToken:{$gt : Date.now()}})
    .then(user => {
        if(!user){
            return res.status(422).json({error:"Try again,session timeout"})
        }
        bcrypt.hash(newPassword,12).then(hashedpassword => {
            user.password = hashedpassword
            user.resetToken = undefined
            user.expireToken = undefined
            user.save().then((savedUser) => {
                res.json({message:"Password updated successfully"})
            })
        })
    }).catch(err => {
        console.log(err)
    })
})
module.exports = router