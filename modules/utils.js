const bcrypt = require("bcrypt");
const saltRounds = 10;
// var base64ToImage = require('base64-to-image');
var path = require("path");
var express = require('express');
var twilio = require('twilio');
var FCM = require('fcm-node');
var sns = require('aws-node-sns');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey("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");

const { accountSid, authToken, twilio_no } = require('../configs/config');
const { notificationModel } = require("../models/notificationModel");
const serverKey = "AAAAuakKKtE:APA91bFkctbWKfU6npHKaXqmGeyY6iXVVj_BBMT0l2vasZU0EojLQ8JFP3qg0PRsGVsS34thRnVZ0M_V2UVHHR7dJxp-dra4gtD87LNI6Qh_cYSWa3HN3P5tHE1syFnAjt16NYeLVu0n";

// var nodemailer = require("nodemailer");
// var mandrillTransport = require('nodemailer-mandrill-transport');
// var request = require('request');

exports.encryptText = async (plaintext) => {
    let encryptedPass = await bcrypt.hash(plaintext, saltRounds);
    return encryptedPass;
}

// OTP messaging 
exports.sendMessage = async (text, mobile) => {
    sns.createClient({
        accessKeyId: "AKIAU6EROOBVVGGB7TCE",
        secretAccessKey: "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",
        region: "me-south-1"
    });

    sns.sendSMS(text, mobile, "Taylor", 'Transactional', function (error, data) {
        if (error) {
            console.log('eroorrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrrr', error)
        } else {
            console.log('MessageID', data)
        }
    });
}

exports.compare = async (plaintext, encryptText) => {
    let matched = await bcrypt.compare(plaintext, encryptText);
    return matched;
}

exports.randomStringGenerator = () => {
    return Math.floor(1000 + Math.random() * 9000);
};

exports.randomreferralCode = () => {
    return Math.random().toString(36).substring(2);
};

// exports.sendotp = async (varification_code, mobile_number) => {

//     //var accountSid = accountSid; Your Account SID from www.twilio.com/console
//     //var authToken = authToken;   Your Auth Token from www.twilio.com/console
//     //console.log("AccountSid :",twilio_no );
//     var client = new twilio(accountSid, authToken);
//     await client.messages.create({
//         body: "your one time password(OTP) is  " + varification_code + "  valid for 2 days do not disclose it",
//         to: mobile_number, // Text this number
//         // from: twilio_no // From a valid Twilio number,
//         from:'Askperts'
//     }).then(async (message) => {
//         return message.sid;
//     }).catch(async (error) => {
//         // Handle any error from any of the steps...
//         console.error('Buying the number failed. Reason: ', error);
//         if (error.code == 21614 || error.code == 21211) { throw new Error(`${mobile_number} not a valid mobile Number`) };
//         throw new Error(error.message);
//     });
// }

exports.sendotp = async (varification_code, mobile_number) => {     
    var client = new twilio(accountSid, authToken);
    await client.messages.create({
        body: "your one time password(OTP) is " + varification_code + " valid for 2 days do not disclose it",
        to: mobile_number, // Text this number
        from: 'Askperts' // Set alphanumeric sender ID
    }).then(async (message) => {
        return message.sid;
    }).catch(async (error) => {
        console.error('Message sending failed. Reason: ', error);
        if (error.code == 21614 || error.code == 21211) {
            throw new Error(`${mobile_number} not a valid mobile Number`);
        }
        throw new Error(error.message);
    });
};

exports.sendgridSendmail = async (email_id, subject, message) => {

    const msg = {
        to: email_id, // Change to your recipient
        // to: "susheelkumar2466@gmail.com",
        from: "ryehya@askperts.com", // Change to your verified sender  // info@coachedin.com //getcoachedin@gmail.com
        subject: subject,
        text: message,
        html: message,
    }

    await sgMail
        .send(msg)
        .then(async (response) => {
            console.log(response[0].statusCode)
            console.log(response[0].headers)
            return response;
        })
        .catch(async (error) => {

            console.error(error)
            throw new Error(error.message);
        })
}

// Android push notification

exports.sendPushNotification = function (token, device_type, payload, notify) {
    //console.log({payload});
    console.log("send notification Android calling")
    //console.log(serverKey, token, device_type, payload, notify);
    var fcm = new FCM(serverKey);
    var message = {
        to: token,
        collapse_key: 'your_collapse_key',
        notification: notify,
        data: payload,
    };
    // console.log(message,"dfghjkl;")

    // console.log(' a => ');
    fcm.send(message, function (err, response) {
        if (err) {

            console.log("=======================Android error comming===================")
            console.log(null, err);
            console.log('Shaitan')
        } else {
            console.log("=======================Android===================")
            console.log(null, response)
        }
    });

}

//Ios push notification

exports.sendPushNotificationForIos = function (token, device_type, payload, notify) {
    //console.log({payload});
    //console.log(serverKey, token, device_type, payload, notify);
    var fcm = new FCM(serverKey);
    var message = {
        to: token,
        // collapse_key: 'your_collapse_key',
        // "content-available": true,
        // "mutable-content": true,
        priority: 'high',//imp
        content_available: true,
        notification: notify,
        data: payload,
    };
    //console.log(message)
    fcm.send(message, function (err, response) {
        if (err) {
            console.log("=======================IOS===================")
            console.log(null, err);
        } else {
            console.log("=======================IOS===================")
            console.log(null, response)
        }
    });

}

exports.commonNotificationSend = function (token, notificationPayload, saveData) {

    var fcm = new FCM(serverKey);
    var message = {
        registration_ids: token,
        collapse_key: 'your_collapse_key',
        notification: {
            title: notificationPayload.title,
            body: notificationPayload.body
        },

        data: { //you can send only notification or only data(or include both)
            my_key: 'my value',
            my_another_key: 'my another value'
        }
    };
    //console.log(message)
    fcm.send(message, function (err, response) {
        if (err) {
            console.log("Admin")
            console.log(null, err);
        } else {
            console.log("===========Admin Response")
            console.log(null, response)
           

            return response
        }
    });

}