const userController = require('../controller/user.controller');
const express = require("express");
const app = express();
const route = express.Router();

const authentication = require("../middlewares/authentication");
const s3bucket = require("../modules/aws-s3");
const Agora = require("agora-access-token");
const { body, param } = require('express-validator');

//M1 api's
route.post("/loginUser", userController.loginUser);
route.post("/verifyOtp", authentication.verifyUserToken, userController.verifyOtp);
route.get("/sendResendOtp", authentication.verifyUserToken, userController.sendResendOtp);
route.post("/createProfile", authentication.verifyUserToken,
    [
        //body('profileImage').exists().withMessage("profileImage key not found").notEmpty().withMessage("profileImage is required"),
        // body('gender').exists().withMessage("gender key not found").notEmpty().withMessage("gender is required"),
        // body('dateOfBirth').exists().withMessage("dateOfBirth key not found").notEmpty().withMessage("dateOfBirth is required"),
        // body('country').exists().withMessage("country key not found").notEmpty().withMessage("country is required"),
        // body('nationality').exists().withMessage("nationality key not found").notEmpty().withMessage("nationality is required"),
        // body('refered_key').exists().withMessage("refered_key key not found")
    ],
    userController.registerUser);

route.get("/getCountries", userController.sendCountries);

route.post("/getImageLink", s3bucket.uploadFiles, userController.getImageLink);

route.post("/changeUserStatus", authentication.verifyUserToken,
    [
        body('active').exists().withMessage("active key not found").notEmpty().withMessage("active is required"),
    ],
    userController.changeUserStatus);

route.post("/change_notify_status", authentication.verifyUserToken,
    [
        body('notify_me').exists().withMessage("notify_me key not found").notEmpty().withMessage("notify_me is required")
    ],
    userController.notifyMe);

// route.route('/card').all(expertAuth.requiresExpert)
//     .get(expertController.getCards)
//     .post(expertController.saveCard)
//     .delete(expertController.updateCard);

/**
 * M2 Profile Managments api's
 */
route.get("/getProfile", authentication.verifyUserToken, userController.getProfile);
route.delete("/deleteProfile/:id", authentication.verifyUserToken,
    [
        param('id').exists().withMessage("id parameter not found").notEmpty().withMessage("id parameter is required")
    ],
    userController.deleteProfile);

route.post("/searchCategoryAndSubCategory", authentication.verifyUserToken,
    [
        body('search').exists().withMessage("search parameter not found").notEmpty().withMessage("search parameter is required")
    ],
    userController.searchCategoryAndSubCategory);
route.get("/category", userController.getCategories);
route.get("/getCategoryById/:id", authentication.verifyUserToken, userController.getCategoryById);
route.get('/subCategory/:id', authentication.verifyUserToken, userController.getSubCategory);
route.get('/subscription', authentication.verifyUserToken, userController.getSubscription);
route.get('/banner', authentication.verifyUserToken, userController.getBanner);

route.route('/searchHistory')
    .all(authentication.verifyUserToken)
    .get(userController.searchHistory)
    .post(userController.createHistory)
    .delete(userController.deleteAllHistory);


route.delete('/removeSearchHistory/:id', authentication.verifyUserToken, [
    param('id').exists().withMessage("id parameter not found").notEmpty().withMessage("id parameter is required")
]
    , userController.deleteHistory);
route.post('/applySubscription', [
    body('subscriptionId').exists().withMessage("subscriptionId parameter not found").notEmpty().withMessage("subscriptionId parameter is required")
], authentication.verifyUserToken, userController.applySubscription);

route.post("/availableConsultant", [
    
    body('categoryId').exists().withMessage("categoryId parameter not found").notEmpty().withMessage("categoryId parameter is required"),
    // body('category_sub').exists().withMessage("subscriptionId parameter not found").notEmpty().withMessage("sub categoryId parameter is required")
    // body('category_sub_sub').exists().withMessage("subscriptionId parameter not found").notEmpty().withMessage("sub-sub categoryId parameter is required")

], authentication.verifyUserToken, userController.availableConsultant);

route.post("/sendRequest", [
    body('categoryId').exists().withMessage("categoryId parameter not found").notEmpty().withMessage("categoryId parameter is required"),
    body('subscriptionId').exists().withMessage("subscriptionId parameter not found").notEmpty().withMessage("subscriptionId parameter is required"),
    body('category_sub').optional(),
    body('category_sub_sub').optional(),


], authentication.verifyUserToken, userController.sendRequest);

route.route('/services')
    .all(authentication.verifyUserToken)
    .get(userController.getServices)
    .patch(
        //     [
        //     body('id').exists().withMessage("id parameter not found").notEmpty().withMessage("id parameter is required"),
        //     body('status').exists().withMessage("status parameter not found").notEmpty().withMessage("status parameter is required")
        // ],
        userController.updateService);

route.route('/agora-token')
    // .post(expertAuth.requiresExpert, agoraController.buildTokenWithUid)
    .post(authentication.verifyUserToken, (req, res) => {
        req.body.isPublisher = true;
        const appID = "6f6c5aaae7354f7c8a393b07a0c964c5";
        const appCertificate = "cd662f89a6e846c384a6b202f4ea0e34";
        const expirationTimeInSeconds = 3600;
        const uid = Math.floor(Math.random() * 100000);
        const role = req.body.isPublisher ? Agora.RtcRole.PUBLISHER : Agora.RtcRole.SUBSCRIBER;
        const channel = req.body.channel;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const expirationTimestamp = currentTimestamp + expirationTimeInSeconds;

        const token = Agora.RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channel, uid, role, expirationTimestamp);
        res.send({ uid, token, channel });
    })

/* For templates */
route.post("/getTemplates", userController.getTemplates);

route.post('/giveCall', [
    body('id').exists().withMessage("id parameter not found").notEmpty().withMessage("id parameter is required"),
    body('uid').exists().withMessage("uid parameter not found").notEmpty().withMessage("uid parameter is required"),
    body('agoraToken').exists().withMessage("agoraToken parameter not found").notEmpty().withMessage("agoraToken parameter is required")
], authentication.verifyUserToken, userController.giveCall);
route.post('/change_calling_status', [
    body('id').exists().withMessage("id parameter not found").notEmpty().withMessage("id parameter is required"),
    body('uid').exists().withMessage("uid parameter not found").notEmpty().withMessage("uid parameter is required"),
    body('agoraToken').exists().withMessage("agoraToken parameter not found").notEmpty().withMessage("agoraToken parameter is required"),
    body('notification_type').exists().withMessage("notification_type parameter not found").notEmpty().withMessage("notification_type parameter is required"),
    body('calling_type').exists().withMessage("calling_type parameter not found").notEmpty().withMessage("calling_type parameter is required")
], authentication.verifyUserToken, userController.updateCallingStatus);

route.post('/endCall', [
    body('id').exists().withMessage("id parameter not found").notEmpty().withMessage("id parameter is required"),
    body('totalTime').exists().withMessage("totalTime parameter not found").notEmpty().withMessage("totalTime parameter is required"),
    body('callStartAt').exists().withMessage("callStartAt parameter not found").notEmpty().withMessage("callStartAt parameter is required")
], authentication.verifyUserToken, userController.endCall);

route.get('/getServiceDetails/:id', authentication.verifyUserToken, userController.getServiceDetails);

route.patch("/updateCallNumberWhileCall", authentication.verifyUserToken,
    [
        body('id').exists().withMessage("id parameter not found").notEmpty().withMessage("id parameter is required"),
    ],
    userController.updateCallNumberWhileCall);


route.post('/service_rating', [
    body('service_id').exists().withMessage("service_id parameter not found").notEmpty().withMessage("service_id parameter is required"),
    body('user_rating_message').exists().withMessage("user_rating_message parameter not found").notEmpty().withMessage("user_rating_message parameter is required"),
    body('user_rating_number').exists().withMessage("user_rating_number parameter not found").notEmpty().withMessage("user_rating_number parameter is required"),
    body('sub_category_id').exists().withMessage("user_rating_number parameter not found").notEmpty().withMessage("sub_category_id parameter is required"),
    body('call_id').exists().withMessage("call_id parameter not found").notEmpty().withMessage("call_id parameter is required")

], authentication.verifyUserToken, userController.serviceRating);
route.get('/category_get', authentication.verifyUserToken, userController.categoryGet);
route.get('/category_sub_get/:id', authentication.verifyUserToken, userController.categorySubGet);
route.get('/category_sub_sub_get/:id', authentication.verifyUserToken, userController.categorySubSubGet);

route.get('/callHistory', authentication.verifyUserToken, userController.callHistory);
route.get('/send_invitation', authentication.verifyUserToken, userController.sendRefferalInviatation);
route.post('/call_history_update', authentication.verifyUserToken, userController.callHistoryUpdate);
route.post('/call_history_rating', authentication.verifyUserToken, userController.callHistoryRating);
route.post('/referral_user', authentication.verifyUserToken, userController.referralUser);
route.get('/getSubscriptionList', authentication.verifyUserToken, userController.getSubscriptionList);
route.get('/deleteUser', authentication.verifyUserToken, userController.deleteUser);
route.post('/editProfile', authentication.verifyUserToken, userController.editProfile);
route.get('/getFaq', userController.getFaq);
route.get('/getSettingData', userController.getSettingData);
route.get('/notificationList', authentication.verifyUserToken, userController.notificationList);
route.post('/deleteNotification', authentication.verifyUserToken, userController.deleteNotification);
route.get('/readAllNotification', authentication.verifyUserToken, userController.readAllNotification);

route.post('/referAndEarn', authentication.verifyUserToken, userController.referAndEarn);
route.get('/getSettingData1', userController.getSettingData1);
route.post('/updateSubscription', authentication.verifyUserToken, userController.updateSubscription);











module.exports = route;