const consultController = require('../controller/consult.controller');
const userController = require('../controller/user.controller');
const express = require("express");
const route = express.Router();

const authentication = require("../middlewares/authentication");
const s3bucket = require("../modules/aws-s3");
const Agora = require("agora-access-token");
const { body,param } = require('express-validator');

//M1 api's
route.post("/loginUser", consultController.loginUser);
route.post("/verifyOtp", authentication.verifyToken, consultController.verifyOtp);
route.get("/sendResendOtp", authentication.verifyToken, consultController.sendResendOtp);
route.post("/createProfile", authentication.verifyToken,
[
    body('gender').exists().withMessage("gender key not found").notEmpty().withMessage("gender is required"),
    body('dateOfBirth').exists().withMessage("dateOfBirth key not found").notEmpty().withMessage("dateOfBirth is required"),
    body('country').exists().withMessage("country key not found").notEmpty().withMessage("country is required"),
    body('nationality').exists().withMessage("nationality key not found").notEmpty().withMessage("nationality is required"),
    body('address').exists().withMessage("address key not found").notEmpty().withMessage("address is required")
],
consultController.registerUser);

route.post("/saveDocuments", authentication.verifyToken,
[
    //body('profileImage').exists().withMessage("profileImage key not found").notEmpty().withMessage("profileImage is required"),
    body('consultantType').exists().withMessage("consultantType key not found").notEmpty().withMessage("consultantType is required"),
    // body('consultantSubType').exists().withMessage("consultantSubType key not found").notEmpty().withMessage("consultantSubType is required"),
    // body('consultantSubSubType').exists().withMessage("consultantSubSubType key not found").notEmpty().withMessage("consultantSubSubType is required"),
    body('consultantSubType').optional().isArray().withMessage("consultantSubType should be an array"),
    body('consultantSubSubType').optional().isArray().withMessage("consultantSubSubType should be an array"),
    body('experience').exists().withMessage("experience key not found").notEmpty().withMessage("experience is required"),
    body('language').exists().withMessage("language key not found").notEmpty().withMessage("language is required"),
    body('documents').exists().withMessage("documents key not found").notEmpty().withMessage("documents is required")
],
consultController.saveDocuments);

route.post("/saveBankDetails", authentication.verifyToken,
[
    body('accountName').exists().withMessage("accountName key not found").notEmpty().withMessage("accountName is required"),
    body('accountNumber').exists().withMessage("accountNumber key not found").notEmpty().withMessage("accountNumber is required"),
    body('ibanNumber').exists().withMessage("ibanNumber key not found").notEmpty().withMessage("ibanNumber is required")
],
consultController.saveBankDetails);

route.get("/getCountries", consultController.sendCountries);

route.post("/getImageLink", s3bucket.uploadFiles, consultController.getImageLink);

route.get("/getCategories", authentication.verifyToken, consultController.getCategories);
route.get('/getAllCategory_SubCat_subSubCat_list',authentication.verifyToken, consultController.getAllCatSubCatSubSubCate),

route.post("/changeUserStatus",authentication.verifyToken,
[
    body('active').exists().withMessage("active key not found").notEmpty().withMessage("active is required"),
],
consultController.changeUserStatus);

/**
 * M2 Profile Managments api's
 */

route.route('/profile').all(authentication.verifyToken)
    .get(consultController.getProfile)
    .post([
        body('gender').exists().withMessage("gender key not found").notEmpty().withMessage("gender is required"),
        body('dateOfBirth').exists().withMessage("dateOfBirth key not found").notEmpty().withMessage("dateOfBirth is required"),
        // body('country').exists().withMessage("country key not found").notEmpty().withMessage("country is required"),
        // body('nationality').exists().withMessage("nationality key not found").notEmpty().withMessage("nationality is required"),
        body('email').exists().withMessage("email key not found").notEmpty().withMessage("email is required"),
        body('address').exists().withMessage("address key not found").notEmpty().withMessage("address is required"),
        //body('profileImage').exists().withMessage("profileImage key not found").notEmpty().withMessage("profileImage is required"),
        body('consultantType').exists().withMessage("consultantType key not found").notEmpty().withMessage("consultantType is required"),
        // body('consultantSubType').exists().withMessage("consultantSubType key not found").notEmpty().withMessage("consultantSubType is required"),
        // body('consultantSubSubType').exists().withMessage("consultantSubSubType key not found").notEmpty().withMessage("consultantSubSubType is required"),
        body('consultantSubType').optional().isArray().withMessage("consultantSubType should be an array"),
        body('consultantSubSubType').optional().isArray().withMessage("consultantSubSubType should be an array"),
        body('experience').exists().withMessage("experience key not found").notEmpty().withMessage("experience is required"),
        //body('language').exists().withMessage("language key not found").notEmpty().withMessage("language is required"),
        body('accountName').exists().withMessage("accountName key not found").notEmpty().withMessage("accountName is required"),
        body('accountNumber').exists().withMessage("accountNumber key not found").notEmpty().withMessage("accountNumber is required"),
        body('ibanNumber').exists().withMessage("ibanNumber key not found").notEmpty().withMessage("ibanNumber is required")
    ],consultController.updateProfile);

route.post("/changeDuty",authentication.verifyToken,
[
    body('onDuty').exists().withMessage("onDuty key not found").notEmpty().withMessage("onDuty is required")
],
consultController.changeDuty);

//route.get("/getProfile",authentication.verifyUserToken,userController.getProfile)
route.delete("/deleteProfile/:id",authentication.verifyToken,
[
    param('id').exists().withMessage("id parameter not found").notEmpty().withMessage("id parameter is required")
],
consultController.deleteProfile); 

route.post("/change_notify_status",authentication.verifyToken,
[
    body('notify_me').exists().withMessage("notify_me key not found").notEmpty().withMessage("notify_me is required")
],
consultController.notifyMe);

route.route('/services')
    .all(authentication.verifyToken)
    .get(consultController.getServices)
    .patch(
        [
        body('id').exists().withMessage("id parameter not found").notEmpty().withMessage("id parameter is required"),
        body('status').exists().withMessage("status parameter not found").notEmpty().withMessage("status parameter is required")
    ],
    consultController.updateService);

    route.route('/agora-token')
    // .post(expertAuth.requiresExpert, agoraController.buildTokenWithUid)
    .post(authentication.verifyToken, (req, res) => {
        req.body.isPublisher = true;
        const appID = "08c9529af93a4b2389e28be9b9e5ecd8";
        const appCertificate = "f433d81cf8cb422ea362a8b76c9ed7c6";
        const expirationTimeInSeconds = 3600;
        const uid = Math.floor(Math.random() * 100000);
        const role = req.body.isPublisher ? Agora.RtcRole.PUBLISHER : Agora.RtcRole.SUBSCRIBER;
        const channel = req.body.channel;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const expirationTimestamp = currentTimestamp + expirationTimeInSeconds;

        const token = Agora.RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channel, uid, role, expirationTimestamp);
        res.send({ uid, token, channel });
    })

route.post('/giveCall',[
    body('id').exists().withMessage("id parameter not found").notEmpty().withMessage("id parameter is required"),
    body('uid').exists().withMessage("uid parameter not found").notEmpty().withMessage("uid parameter is required"),
    body('agoraToken').exists().withMessage("agoraToken parameter not found").notEmpty().withMessage("agoraToken parameter is required")
],authentication.verifyToken,consultController.giveCall);
route.post('/change_calling_status',[
    body('id').exists().withMessage("id parameter not found").notEmpty().withMessage("id parameter is required"),
    body('uid').exists().withMessage("uid parameter not found").notEmpty().withMessage("uid parameter is required"),
    body('agoraToken').exists().withMessage("agoraToken parameter not found").notEmpty().withMessage("agoraToken parameter is required"),
    body('notification_type').exists().withMessage("notification_type parameter not found").notEmpty().withMessage("notification_type parameter is required"),
    body('calling_type').exists().withMessage("calling_type parameter not found").notEmpty().withMessage("calling_type parameter is required")
],authentication.verifyToken,consultController.updateCallingStatus);
route.post('/endCall',[
    body('id').exists().withMessage("id parameter not found").notEmpty().withMessage("id parameter is required"),
    body('totalTime').exists().withMessage("totalTime parameter not found").notEmpty().withMessage("totalTime parameter is required"),
    body('callStartAt').exists().withMessage("callStartAt parameter not found").notEmpty().withMessage("callStartAt parameter is required")
],authentication.verifyToken,consultController.endCall);

route.get('/getServiceDetails/:id',authentication.verifyToken,consultController.getServiceDetails);

/* For template section */
route.post("/getTemplates", consultController.getTemplates);
route.get('/category_get',authentication.verifyToken,consultController.categoryGet);
route.get('/category_sub_get/:id',authentication.verifyToken,consultController.categorySubGet);
route.get('/category_sub_sub_get/:id',authentication.verifyToken,consultController.categorySubSubGet);

route.get('/rating_get',authentication.verifyToken,userController.serviceRatingGet);
route.get('/getFaq',consultController.getFaq);
route.get('/deleteConsult',authentication.verifyToken,consultController.deleteConsult);
route.get('/getSettingData',consultController.getSettingData);
route.get('/notificationList',authentication.verifyToken,consultController.notificationList);
route.post('/deleteNotification',authentication.verifyToken,consultController.deleteNotification);
route.get('/readAllNotification',authentication.verifyToken,consultController.readAllNotification);
route.post('/editProfile',authentication.verifyToken,consultController.editProfile);
route.get('/pastHistory',authentication.verifyToken,consultController.pastHistory);
route.post('/paymentList',authentication.verifyToken,consultController.paymentList);

route.get('/getBanner',authentication.verifyToken,consultController.getBanner);

route.get("/getPrice",authentication.verifyToken,consultController.getPrice);


module.exports = route;
