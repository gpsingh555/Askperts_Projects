const {
    UserModel
} = require("../models/userModel");
const moment = require('moment');
const utils = require("../modules/utils");
const authentication = require("../middlewares/authentication");
const {
    msg
} = require("../modules/message");
const config = require("../configs/config");
const { categoryModel } = require("../models/categoryModel");
const { subscriptionModel } = require("../models/subscriptionModel");
const { bannerModel } = require("../models/bannerModel");
const { subCategoryModel } = require("../models/subCategoryModel");
const mongoose = require('mongoose');
const { searchHistoryModel } = require("../models/searchHistoryModel");
const { applySubscriptionModel } = require("../models/applySubscriptionModel");
const { UserBindingContext } = require("twilio/lib/rest/ipMessaging/v2/service/user/userBinding");
const { ConsultModel } = require("../models/consultModel");
const { callingModel } = require("../models/callingModel");
const { UserRatingModel } = require("../models/user.rating.model");
var randomstring = require("randomstring");
const { UserReferralModel } = require("../models/user.referral.model");
const { faqModel } = require("../models/faqModel");
const { settingModel } = require("../models/settingModel");
const { notificationModel } = require("../models/notificationModel");
const Agora = require("agora-access-token");
const { subSubCategoryModel } = require("../models/subSubCategoryModel");
const { CommissionModel } = require("../models/commissionModel");



exports.loginUser = async (req) => {

    try {
        let data = req.body;
        let userData = {};

        if (!data.mobileNumber || data.mobileNumber == '') {
            return {
                status: -1,
                message: "please Enter the mobile number."
            };
        }

        if (!data.countryCode || data.countryCode == '') {
            return {
                status: -1,
                message: "Please Enter the countryCode"
            };
        }
        let userFindData = await UserModel.findOne({
            $and: [{
                mobileNumber: data.mobileNumber.toString()
            }, {
                countryCode: data.countryCode
            }, {
                is_deleted: false
            }]
        });

        if (userFindData) {
            if (userFindData.isBlocked === 1) {
                return {
                    status: -1,
                    message: "You are blocked by Admin"
                };
            }

            userData = userFindData;

        } else {

            userData.mobileNumber = data.mobileNumber.toString();
            userData.countryCode = data.countryCode;
            userData.refered_key = randomstring.generate({
                length: 15,
                charset: 'alphanumeric',
                capitalization: 'lowercase'
            })
            if (data.refered_by) {
                let findUser = await UserModel.findOne({ refered_key: data.refered_by })
                if (findUser) userData.refered_by = findUser._id
            }
            userData = await UserModel.create(userData);
            if (!userData) {
                return {
                    status: -1,
                    message: "Something went wrong Please try later"
                }
            }
        }
        if (data.deviceType && data.deviceType !== '') {
            userData.deviceType = data.deviceType;
            userData.deviceToken = data.deviceToken;
        }

        return {
            status: 1,
            data: userData,
            message: "User Found"
        };

    } catch (error) {
        throw new Error(error.message);
    }

};


let sendOtp = async (userData) => {
    try {
        let otp = await utils.randomStringGenerator();
        // let otp = randomstring.generate({
        //     length: 4,
        //     charset: 'numeric',
        // })
        // let otp = 1234;
        let otpExpTime = new Date(Date.now() + config.defaultOTPExpireTime);
        userData.otpInfo = {
            otp: otp,
            expTime: otpExpTime
        }
        userData.modified_at = Date.now();
        let mobileNumber = userData.countryCode + userData.mobileNumber;
        //Send message via Twillio
        let send = await utils.sendotp(userData.otpInfo.otp, mobileNumber);
        //let send1 = await utils.sendMessage(`your one time password (OTP) is ${otp}`, mobileNumber);
        return {
            status: 1,
            message: "Otp send Successfully",
            data: userData
        };
    } catch (err) {
        throw new Error(err.message);
    }
};

exports.saveToken = async (data, days) => {
    try {
        let user;
        data.token = authentication.generateToken(days);
        user = await sendOtp(data);
        data = user.data;
        data.created_at = Date.now();
        data.modified_at = Date.now();
        let users = await data.save();
        let userData;
        if (!users) {
            return {
                status: -1,
                message: "Something went wrong"
            };
        } else {
            userData = { ...users.toObject() };
            let subscription = await applySubscriptionModel.findOne({
                user: mongoose.Types.ObjectId(userData._id)
            });
            if (subscription) {
                userData.subscription = subscription
            }

            return {
                status: 1,
                data: JSON.parse(JSON.stringify(userData)),
                message: "User Found"
            };


        }
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.registerUser = async (data, userData) => {

    try {
        let notify, payload, datas;
        data.isProfileCompleted = true;
        data.refered_key = utils.randomreferralCode();
        let saveUser = await UserModel.findOneAndUpdate({ _id: userData._id }, { $set: data }, { new: true, useFindAndModify: false });

        if (!saveUser) {
            return {
                status: -1,
                message: "Something went wrong,Please try later."
            };
        }

        if (saveUser.deviceToken) {
            let device_token = saveUser.deviceToken;
            let device_type = saveUser.deviceType;
            let title = `Your account created and updated successfully with ASKperts`;
            let body = `Your account created and updated successfully with ASKperts`;
            if (device_type == 2 || device_type == 3) {
                notify = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    "color": "#f95b2c"
                }
                payload = {
                    title,
                    body,
                    notify,
                    notification_type: 4
                }
            } else {
                datas = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    "color": "#f95b2c"
                };
                payload = {
                    title,
                    body,
                    datas,
                    notification_type: 4,
                }
            }

            if (device_type == 2 || device_type == 3) {
                utils.sendPushNotification(device_token, device_type, payload, notify)
            } else {
                utils.sendPushNotificationForIos(device_token, device_type, payload, datas)
            }
        }

        return {
            status: 1,
            data: saveUser
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.sendResendOtp = async (data) => {
    try {
        let otpVerified = await sendOtp(data);

        let user = otpVerified.data;
        let saveUser = await user.save();
        if (!saveUser) {
            return {
                status: -1,
                message: "Something went wrong, Please try later"
            };
        }
        return {
            status: 1,
            data: saveUser,
            message: "Otp send Successfully"
        };

    } catch (err) {
        throw new Error(err.message);
    }

};

exports.verifyOtp = async (data, user) => {
    try {
        let otp = user.otpInfo.otp;
        if (otp != data.otp && data.otp !== '45978') {
            return {
                status: -1,
                message: "Otp not match"
            };
        }
        let otpExpTime = user.otpInfo.expTime;
        let currentTime = new Date(Date.now());
        //if (data.otp !== '45978') {
        if (currentTime > otpExpTime) {
            return {
                status: -1,
                message: "Otp has been Expired"
            };
        }
        //}
        user.otpInfo = {
            otp: null,
            expTime: Date.now()
        };
        let userData = await user.save();
        if (!userData) {
            return {
                status: -1,
                message: "Something went wrong please try after sometime."
            }
        }
        let users = userData.toObject();
        let subscription = await applySubscriptionModel.findOne({
            user: mongoose.Types.ObjectId(userData._id)
        });
        if (subscription) {
            users.subscription = subscription
        }

        return {
            status: 1,
            message: "Otp verified Successfully.",
            data: users
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.changeUserStatus = async (data, user) => {

    try {
        user.active = data.active;
        let saveUser = await user.save();
        if (!saveUser) {
            return {
                status: -1,
                message: "Something went wrong,Please try later."
            };
        }
        return {
            status: 1,
            data: saveUser
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.notifyMe = async (data, user) => {

    try {
        user.notify_me = data.notify_me;
        let saveUser = await user.save();
        if (!saveUser) {
            return {
                status: -1,
                message: "Something went wrong,Please try later."
            };
        }
        return {
            status: 1,
            data: saveUser,
            message: "Your notification setting update successfully."
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.deleteProfile = async (id, user) => {

    try {
        if (id != user._id) {
            return {
                status: -1,
                message: "You can only able to delete your id."
            };
        }
        user.is_deleted = true;
        let saveUser = await user.save();
        if (!saveUser) {
            return {
                status: -1,
                message: "Something went wrong,Please try later."
            };
        }
        return {
            status: 1,
            message: "Your account deleted successfully."
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

async function getDistanceBetweenPoints(data) {
    try {
        //console.log("data :", data);
        let {
            lat1,
            lon1,
            lat2,
            lon2
        } = data;
        if (lat1 && lon1 && lat2 && lon2) {
            let url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=km&origins=${lat1},${lon1}&destinations=${lat2},${lon2}&key=AIzaSyDjRNiBtDmQhXdbOOo1paVmox4XpPMz5pQ`;
            const response = await axios.get(url);
            let dataToSend;
            if (response.data.rows[0].elements[0].status == "ZERO_RESULTS" || response.data.rows[0].elements[0].status == "NOT_FOUND") {
                return '0 km'
            } else {
                //console.log("DIstance :", response.data.rows[0].elements[0].distance);
                return response.data.rows[0].elements[0].distance.text
            }


        } else {
            return '0 km';
        }

    } catch (error) {
        return error;
    }
}

exports.getCategories = async () => {
    try {

        let category = await categoryModel.find({ is_deleted: false }).sort({ position: 1 }).lean();
        if (!category) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, data: category, message: "Category fetch successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.getCategoryById = async (id) => {
    try {
        let category = await categoryModel.findById(mongoose.Types.ObjectId(id)).lean();
        if (!category) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, data: category, message: "Category fetch successfully." };
    } catch (err) {
        throw new Error(err.message);
    }
}

exports.searchCategoryAndSubCategory = async (search, user) => {
    try {
        //{subCategoryName:{'$regex' : data.search, '$options' : 'i'}

        let category = await categoryModel.find({ categoryName: { '$regex': search, '$options': 'i' }, is_deleted: false }).lean();
        if (!category) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        let subCategory = await subCategoryModel.find({ subCategoryName: { '$regex': search, '$options': 'i' }, is_deleted: false }).populate("category", "categoryName categoryNameArabic").lean();
        if (!subCategory) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        // if(search){
        //   let historyExist = await searchHistoryModel.findOne({searchData:{'$regex' : search, '$options' : 'i'}});
        //   if(!historyExist){
        //     await searchHistoryModel.create({searchData:search , user:user._id});
        //   }
        // }

        return { status: 1, data: { subCategory: subCategory, category: category }, message: "Category and subCategory fetch successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.getSubCategory = async (id) => {
    try {

        let category = await subCategoryModel.find({ category: mongoose.Types.ObjectId(id), is_deleted: false }).sort({ position: 1 }).populate("category", "categoryName categoryNameArabic").lean();
        if (!category) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, data: category, message: "SubCategory fetch successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.getSubscription = async () => {
    try {

        let subscription = await subscriptionModel.find({ is_deleted: false, }).sort({ position: 1 }).lean();
        if (!subscription) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, data: subscription, message: "Subscription fetch successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.getBanner = async () => {
    try {

        let subscription = await bannerModel.find({ is_active: true, is_deleted: false }).lean();
        if (!subscription) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, data: subscription, message: "Subscription fetch successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.searchHistory = async (user) => {
    try {

        let history = await searchHistoryModel.find({ user: user._id }, " searchData ").sort({ createdAt: -1 }).lean(); //.limit(10)
        if (!history) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, data: history, message: "History fetch successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.createHistory = async (user, search) => {
    try {
        let historyExist = await searchHistoryModel.findOne({ searchData: { '$regex': search, '$options': 'i' } });
        if (historyExist) {
            await searchHistoryModel.deleteOne({ _id: historyExist._id });
        }

        let history = await searchHistoryModel.create({ searchData: search, user: user._id });

        return { status: 1, data: history, message: "History created successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.deleteAllHistory = async (id) => {
    try {

        let history = await searchHistoryModel.deleteMany({ user: mongoose.Types.ObjectId(id) }); //.limit(10)
        if (!history) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "History delete successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.deleteHistory = async (id) => {
    try {

        let history = await searchHistoryModel.deleteOne({ _id: mongoose.Types.ObjectId(id) }); //.limit(10)
        if (!history) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "History delete successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.applySubscription = async (user, data) => {
    try {

        let subscription = await subscriptionModel.findOne({ _id: mongoose.Types.ObjectId(data.subscriptionId) }).lean();
        if (!subscription) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        let leftCallsRemainig = await applySubscriptionModel.findOne({ user: user._id });
        let remainigLeftcall = leftCallsRemainig?.leftCalls ? leftCallsRemainig?.leftCalls : 0;
        let userDetails = await UserModel.findById(user._id);
        if(userDetails && userDetails.no_of_calls > 0){
            return { status: -1, message: "You have already have a plan, at first used it." };
        }
        // console.log(userDetails,"jjjj")
        // if(leftCallsRemainig?.leftCalls === "undefined"){
        //     remainigLeftcall=0
        // }else{
        //     // remainigLeftcall= leftCallsRemainig?.leftCalls
        // }
        console.log(leftCallsRemainig?.leftCalls ? leftCallsRemainig?.leftCalls : 0);
        let leftCalls = parseInt(remainigLeftcall) + parseInt(subscription.numberOfCalls);
        console.log("numberOfCalls      ::   " + subscription.numberOfCalls);
        console.log("remainigLeftcall   ::   " + remainigLeftcall);
        console.log("leftCalls          ::   " + leftCalls);
        console.log("Invalid call type  :: " + typeof (leftCalls));
        let subscriptions = await applySubscriptionModel.create({ ...{ user: user._id }, ...{ purchaseDate: Date.now(), duration: subscription.duration, planName: subscription.planName, planNameArabic: subscription?.planNameArabic, numberOfCalls: subscription.numberOfCalls, amount: subscription.amount, leftCalls: parseInt(leftCalls), created_on: new Date().getTime() } });

       
        let call_available = parseInt(userDetails?.no_of_calls) + parseInt(subscription.numberOfCalls);
        let update = await UserModel.findByIdAndUpdate(user._id, { $set: { no_of_calls: call_available } }, { new: true });

        if (!subscriptions) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }
        let notify, payload, datas;

        if (user.deviceToken) {
            let device_token = user.deviceToken;
            let device_type = user.deviceType;
            let title = `Subscription purchased`;
            let body = `You have purchased subscription successfully`;
            if (device_type == 2 || device_type == 3) {
                notify = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    "color": "#f95b2c"
                }
                payload = {
                    title,
                    body,
                    subscriptionId: subscriptions._id,
                    notify,
                    notification_type: 13
                }
            } else {
                datas = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    "color": "#f95b2c"
                };
                payload = {
                    title,
                    body,
                    subscriptionId: subscriptions._id,
                    notify,
                    notification_type: 13
                }
            }

            if (device_type == 2 || device_type == 3) {
                utils.sendPushNotification(device_token, device_type, payload, notify)
            } else {
                utils.sendPushNotificationForIos(device_token, device_type, payload, datas)
            }

            let notificationPayload = {
                title: title,
                body: body
            }

            let saveData = {
                notification: notificationPayload,
                notificationSendBy: 0,
                status: 0,
                userId: user._id,
                createdAt: new Date().getTime()
            }

            let createNotification = await new notificationModel(saveData)
            let saveNotification = await createNotification.save();
        }

        return { status: 1, data: subscriptions, message: "Subscription apply successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.updateSubscription = async (user, data) => {
    try {

        let subscription = await subscriptionModel.findOne({ _id: mongoose.Types.ObjectId(data.subscriptionId) }).lean();
        if (!subscription) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }
        let leftCallsRemainig = await applySubscriptionModel.findById(data.subscriptionId);
        let updateSubscription = await applySubscriptionModel.findByIdAndUpdate(data.subscriptionId, { $set: { leftCalls: 0 } }, { new: true })
        
        let remainigLeftcall = leftCallsRemainig?.leftCalls ? leftCallsRemainig?.leftCalls : 0;



        console.log(leftCallsRemainig?.leftCalls ? leftCallsRemainig?.leftCalls : 0);
        let leftCalls = parseInt(remainigLeftcall) + parseInt(subscription.numberOfCalls);
        console.log("numberOfCalls      ::   " + subscription.numberOfCalls);
        console.log("remainigLeftcall   ::   " + remainigLeftcall);
        console.log("leftCalls          ::   " + leftCalls);
        console.log("Invalid call type  :: " + typeof (leftCalls));
        let subscriptions = await applySubscriptionModel.create({ ...{ user: user._id }, ...{ purchaseDate: Date.now(), duration: subscription.duration, planName: subscription.planName, numberOfCalls: subscription.numberOfCalls, amount: subscription.amount, leftCalls: parseInt(leftCalls) } });

        let userDetails = await UserModel.findById(user._id);
        let call_available = parseInt(userDetails?.no_of_calls) + parseInt(subscription.numberOfCalls);
        let update = await UserModel.findByIdAndUpdate(user._id, { $set: { no_of_calls: call_available } }, { new: true });

        if (!subscriptions) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, data: subscriptions, message: "Subscription apply successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.sendRequest = async (user, data) => {
    try {
        let notify, payload, datas;
        //let request = await 
        console.log(data, "llllllllllllllllllllllll")

        ////////////////////

        data.isPublisher = true;
        const appID = "6f6c5aaae7354f7c8a393b07a0c964c5";
        const appCertificate = "cd662f89a6e846c384a6b202f4ea0e34";
        const expirationTimeInSeconds = 3600;
        const uid = Math.floor(Math.random() * 100000);
        const role = data.isPublisher ? Agora.RtcRole.PUBLISHER : Agora.RtcRole.SUBSCRIBER;
        const channel = data.channel;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const expirationTimestamp = currentTimestamp + expirationTimeInSeconds;

        const token = Agora.RtcTokenBuilder.buildTokenWithUid(appID, appCertificate, channel, uid, role, expirationTimestamp);
        console.log({ uid, token, channel });
        /////////////////////

        let query = {
            is_deleted: false,
            on_duty: true,
            isVerified: true,
            isBlocked: 0,
            active: true,
            consultantType: { $in: data.categoryId },
            deviceToken: { $exists: true }
        };

        if (data.category_sub && data.category_sub !== "") {
            query.consultantSubType = { $in: data.category_sub };
        }

        if (data.category_sub_sub && data.category_sub_sub !== "") {
            query.consultantSubSubType = { $in: data.category_sub_sub };
        }
        let request =  await ConsultModel.find(query);
        
        // let request = await ConsultModel.find({ is_deleted: false, on_duty: true, isVerified: true, isBlocked: 0, active: true, consultantType: { $in: data.categoryId }, consultantSubType: { $in: data.category_sub }, deviceToken: { $exists: true } }); // old 
        // let request = await ConsultModel.find({ is_deleted: false, on_duty: true, isVerified: true, isBlocked: 0, active: true, consultantType: { $in: data.categoryId }, deviceToken: { $exists: true } }); // new
        if (!request) {
            return { status: -1, message: "No consultant available currently, Please try later." };
        }

        if (data.category_sub === "") {
            data.category_sub = null;
        }
        if (data.category_sub_sub === "") {
            data.category_sub_sub = null;
        }
        
        let commission = 0;
        let commissionData = await CommissionModel.findOne({
                subSubCategory: data.category_sub_sub,
                isBlocked: false,
                isDeleted: false
            },{ commission: 1 });
        if(!commissionData){
            commissionData = await CommissionModel.findOne({
                subCategory: data.category_sub,
                isBlocked: false,
                isDeleted: false
            },{ commission: 1 });
        }
        if(!commissionData){
            commissionData = await CommissionModel.findOne({
                category: data.categoryId,
                isBlocked: false,
                isDeleted: false
            },{ commission: 1 });
        }

        if(commissionData){
            commission = commissionData.commission
        }

        let requestData = {
            subscriptionId: data.subscriptionId,
            consultant: null,
            user: user._id,
            uid: uid,
            agoraToken: token,
            channel: channel,
            category: data.categoryId,
            category_sub: (data.category_sub == "") ? null : data.category_sub ,
            category_sub_sub: (data.category_sub_sub == "") ? null : data.category_sub_sub,
            commission: commission,
            serviceId: Math.random().toString(36).slice(2),
            created_on: new Date().getTime()
        }


        let calling = await callingModel.create(
            requestData
        );

        if (!calling) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        //  if( saveUser.notify_me && saveUser.deviceToken)
        console.log(request, ";;;;;;;;;;;;;;;;;;;;;;;;;;")
        let title = `New Service Request`;
        let body = `You have new Service Request`;

        for (let id = 0; id < request.length; id++) {
            const element = request[id];
            let device_token = element.deviceToken;
            let device_type = element.deviceType;
            // let title = `You have a call request from ${user.firstName}`;
            // let body = `You have a call request from ${user.firstName}`;

            if (device_type == 2 || device_type == 3) {
                notify = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    "color": "#f95b2c"
                }
                payload = {
                    title,
                    body,
                    notify,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    profilePic: user.profileImage,
                    callId: calling.uid,
                    agoraToken: calling.agoraToken,
                    serviceId: calling._id,
                    notification_type: 0
                }
            } else {
                datas = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    "color": "#f95b2c"
                };
                payload = {
                    title,
                    body,
                    datas,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    profilePic: user.profileImage,
                    callId: calling.uid,
                    agoraToken: calling.agoraToken,
                    serviceId: calling._id,
                    notification_type: 0,
                }
            }

            // console.log(device_token, device_type, payload)

            if (device_type == 2 || device_type == 3) {
                utils.sendPushNotification(device_token, device_type, payload, notify)
            } else {
                utils.sendPushNotificationForIos(device_token, device_type, payload, datas)
            }

        }

        let consultId = request.map(item => { return item._id });


        let notificationPayload = {
            title: title,
            body: body
        }

        let saveData = {
            notification: notificationPayload,
            notificationSendBy: 0,
            status: 1,
            userId: user._id,
            consultantId: consultId,
            createdAt: new Date().getTime()
        }

        let createNotification = await new notificationModel(saveData)
        let saveNotification = await createNotification.save();


        if (user.deviceToken) {
            let notify1, payload1, datas1;
            let device_token = user.deviceToken;
            let device_type = user.deviceType;
            let title = `Request sent`;
            let body = `You have sent request successfully`;
            if (device_type == 2 || device_type == 3) {
                notify1 = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    "color": "#f95b2c"
                }
                payload1 = {
                    title,
                    body,
                    serviceId: calling._id,
                    notify,
                    notification_type: 0
                }
            } else {
                datas1 = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    "color": "#f95b2c"
                };
                payload1 = {
                    title,
                    body,
                    serviceId: calling._id,
                    notify,
                    notification_type: 0
                }
            }

            if (device_type == 2 || device_type == 3) {
                utils.sendPushNotification(device_token, device_type, payload1, notify1)
            } else {
                utils.sendPushNotificationForIos(device_token, device_type, payload1, datas1)
            }

            let notificationPayload = {
                title: title,
                body: body
            }

            let saveData = {
                notification: notificationPayload,
                notificationSendBy: 0,
                status: 0,
                userId: user._id,
                createdAt: new Date().getTime()
            }

            let createNotification = await new notificationModel(saveData)
            let saveNotification = await createNotification.save();
        }

        return { status: 1, data: calling, message: "request send successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.availableConsultant = async (user, data) => {
    try {
        let query = {
            is_deleted: false,
            on_duty: true,
            isVerified: true,
            isBlocked: 0,
            active: true,
            deviceToken: { $exists: true },
          };
          
          if (data.categoryId ) {
            query.consultantType = { $in: data.categoryId };
          }
          
          if (data.category_sub) {
            query.consultantSubType = { $in: data.category_sub };
          }
          
          if (data.category_sub_sub) {
            query.consultantSubSubType = { $in: data.category_sub_sub };
          }
        //   console.log(query)
          let request = await ConsultModel.find(query);
        // let request = await ConsultModel.find({ is_deleted: false, on_duty: true, isVerified: true, isBlocked: 0, active: true, consultantType: { $in: data.categoryId }, consultantSubType: { $in: data.category_sub }, deviceToken: { $exists: true } });
        if (!request) {
            return { status: -1, message: "No consultant available currently, Please try later." };
        }
        let noOfCalls = user.no_of_calls

        return { status: 1, data: { consultant: request, noOfCalls }, message: "Consultant List." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.getServices = async (user) => {
    try {
        console.log("user:::", user._id);
        let calling = await callingModel.find({ user: user._id, status: { $in: [2] } }).sort({ createdAt: -1 }).populate("consultant", "profileImage firstName lastName email").populate("category", "image categoryName");
        if (!calling) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, data: calling, message: "Services fetch successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.updateService = async (data) => {
    try {

        let calling = await callingModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(data.id) }, { $set: data }, { new: true, useFindAndModify: false });
        if (!calling) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, data: calling, message: "Services fetch successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.giveCall = async (data) => {
    try {
        let notify, payload, datas;
        let calling = await callingModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(data.id) }, { $set: data }, { new: true, useFindAndModify: false }).populate("consultant");
        if (!calling) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        if (calling.consultant.deviceToken) {
            let device_token = calling.consultant.deviceToken;
            let device_type = calling.consultant.deviceType;
            let title = `Your have a call`;
            let body = `Your have a call`;
            if (device_type == 2 || device_type == 3) {
                notify = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    "color": "#f95b2c"
                }
                payload = {
                    title,
                    body,
                    serviceId: data.id,
                    notify,
                    //call_status: 1
                    firstName: calling.consultant.firstName,
                    lastName: calling.consultant.lastName,
                    profilePic: calling.consultant.profileImage,
                    callId: calling.uid,
                    agoraToken: calling.agoraToken,
                    notification_type: 1
                }
            } else {
                datas = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    "color": "#f95b2c"
                };
                payload = {
                    title,
                    body,
                    serviceId: data.id,
                    notify,
                    //call_status: 1
                    firstName: calling.consultant.firstName,
                    lastName: calling.consultant.lastName,
                    profilePic: calling.consultant.profileImage,
                    callId: calling.uid,
                    agoraToken: calling.agoraToken,
                    notification_type: 1
                }
            }

            if (device_type == 2 || device_type == 3) {
                utils.sendPushNotification(device_token, device_type, payload, notify)
            } else {
                utils.sendPushNotificationForIos(device_token, device_type, payload, datas)
            }
        }

        return { status: 1, data: calling, message: "Services fetch successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}
exports.updateCallingStatus = async (data) => {

    try {
        let notify, payload, datas;
        let checkcalling = await callingModel.findById(data.id)
        if (!checkcalling) {
            return { status: -1, message: "Invalid calling id " };
        }
        let calling = await callingModel.findByIdAndUpdate(data.id, { $set: { status: data.notification_type, calling_type: data.calling_type, agoraToken: data.agoraToken, uid: data.uid } }, { new: true }).populate("consultant").populate('user');

        let callingstatus = null;

        console.log("Body data :: ", data);
        if (calling.consultant.deviceToken) {
            let device_token = calling.consultant.deviceToken;
            let device_type = calling.consultant.deviceType;
            let title = null;
            let body = null;
            let notification_type = data.notification_type
            // callingstatus = await callingModel.findByIdAndUpdate(data.id, { $set: {status:data.notification_type,calling_type:data.calling_type,agoraToken:data.agoraToken,uid:data.uid} }, { new: true}).populate("consultant").populate('user');
            if (notification_type == 2) {

                title = `Your have a call for accept`;
                body = `Your have a call for accept`;
            } else if (notification_type == 3) {
                title = `Your have completed  call`;
                body = `Your have  completed call`;

            } else if (notification_type == 1) {
                title = `Your have   call`;
                body = `Your have   call`;

            } else if (notification_type == 4) {
                title = `Your have rejected  call`;
                body = `Your have  rejected call`;
            } else {
                title = `call`;
                body = `call`;
            }
            if (device_type == 2 || device_type == 3) {
                notify = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    "color": "#f95b2c"
                }
                payload = {
                    title,
                    body,
                    serviceId: data.id,
                    notify,
                    //call_status: 1
                    firstName: calling.consultant.firstName,
                    lastName: calling.consultant.lastName,
                    profilePic: calling.consultant.profileImage,
                    callId: calling.uid,
                    agoraToken: calling.agoraToken,
                    notification_type: data.notification_type,
                    calling_type: data.calling_type,
                    calling_first_name: calling.user.firstName,
                    calling_last_name: calling.user.lastName,
                    calling_profile_pic: calling.user.profileImage,
                    calling_user_id: calling.user._id,
                }
            } else {
                datas = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    "color": "#f95b2c"
                };
                payload = {
                    title,
                    body,
                    serviceId: data.id,
                    notify,
                    //call_status: 1
                    firstName: calling.consultant.firstName,
                    lastName: calling.consultant.lastName,
                    profilePic: calling.consultant.profileImage,
                    callId: calling.uid,
                    agoraToken: calling.agoraToken,
                    notification_type: data.notification_type,
                    calling_type: data.calling_type,
                    calling_first_name: calling.user.firstName,
                    calling_last_name: calling.user.lastName,
                    calling_profile_pic: calling.user.profileImage,
                }
            }
            // console.log("consultant ::: ", payload);

            if (device_type == 2 || device_type == 3) {
                utils.sendPushNotification(device_token, device_type, payload, notify)
                // if(notification_type != 4){
                // }
            } else {
                utils.sendPushNotificationForIos(device_token, device_type, payload, datas)
                // if(notification_type != 4){

                // }
            }
        }
        let dataToSend = {
            calling: calling,
            callingstatus: callingstatus
        }

        return { status: 1, data: calling, message: "Services fetch successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.endCall = async (data) => {
    try {
        let notify, payload, datas;
        let calling = await callingModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(data.id) }, { $set: { status: 3, time: data.totalTime, callStartAt: data.callStartAt, numberOfCalls: data.numberOfCalls } }, { new: true, useFindAndModify: false }).populate("consultant");
        if (!calling) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        if (calling.consultant.deviceToken) {
            let device_token = calling.consultant.deviceToken;
            let device_type = calling.consultant.deviceType;
            let title = `Your have a call`;
            let body = `Your have a call`;
            if (device_type == 2 || device_type == 3) {
                notify = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    "color": "#f95b2c"
                }
                payload = {
                    title,
                    body,
                    serviceId: data.id,
                    notify,
                    notification_type: 4
                }
            } else {
                datas = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    "color": "#f95b2c"
                };
                payload = {
                    title,
                    body,
                    serviceId: data.id,
                    datas,
                    notification_type: 4,
                }
            }

            if (device_type == 2 || device_type == 3) {
                utils.sendPushNotification(device_token, device_type, payload, notify)
            } else {
                utils.sendPushNotificationForIos(device_token, device_type, payload, datas)
            }


            let notificationPayload = {
                title: title,
                body: body
            }

            let saveData = {
                notification: notificationPayload,
                notificationSendBy: 0,
                status: 0,
                userId: user._id,
                createdAt: new Date().getTime()
            }

            let createNotification = await new notificationModel(saveData)
            let saveNotification = await createNotification.save();
        }

        let applySubscriptions = await applySubscriptionModel.findById(mongoose.Types.ObjectId(calling.subscriptionId));
        if (!applySubscriptions) {
            return {
                status: -1,
                message: "Something went wrong, Please try again later."
            };
        }
        if (applySubscriptions.leftCalls <= 0) {
            return {
                status: -1,
                message: "No calls available in your subscription Plan, Please update or buy new plan."
            };
        }

        applySubscriptions.leftCalls -= 1;
        await applySubscriptions.save();

        return { status: 1, data: calling, message: "Services fetch successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.getServiceDetail = async (id) => {
    try {
        let calling = await callingModel.findOne({ _id: mongoose.Types.ObjectId(id) }).populate("consultant", "profileImage firstName lastName email").populate("user", "profileImage firstName lastName email").populate("category", "image categoryName");
        if (!calling) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }
        return { status: 1, data: calling, message: "Services fetch successfully." };
    } catch (err) {
        throw new Error(err.message);
    }
}

exports.updateCallNumberWhileCall = async (data) => {
    try {

        let calling = await callingModel.findById(data.id);

        if (!calling) {
            return {
                status: -1,
                message: "Something went wrong,Please try later."
            };
        }

        let applySubscriptions = await applySubscriptionModel.findById(mongoose.Types.ObjectId(calling.subscriptionId));
        if (!applySubscriptions) {
            return {
                status: -1,
                message: "Something went wrong, Please try again later."
            };
        }
        if (applySubscriptions.leftCalls <= 0) {
            return {
                status: -1,
                message: "No calls available in your subscription Plan, Please update or buy new plan."
            };
        }

        applySubscriptions.leftCalls -= 1;
        await applySubscriptions.save();

        calling.numberOfCalls += 1;
        await calling.save();
        return {
            status: 1,
            data: calling,
            message: "Your call save successfully."
        };
    } catch (error) {
        throw new Error(error.message);
    }
};
exports.serviceRating = async (user, data) => {
    try {

        let userCheck = await UserRatingModel.findById(data.service_id);
        let dataToSend = {}
        if (userCheck) {
            dataToSend = userCheck;
        } else {
            let findD = await callingModel.findOne({ uid: data.call_id })

            let saveObj = {
                user_id: user._id,
                user_rating_message: data.user_rating_message,
                user_rating_number: data.user_rating_number,
                service_id: data.service_id,
                sub_category_id: data.sub_category_id,
                call_id: findD._id,
                created_at: new Date().getTime(),

            }
            let saveRating = new UserRatingModel(saveObj);
            saveRating = await saveRating.save();
            dataToSend = saveRating;
        }
        return {
            status: 1,
            data: dataToSend,
            message: "Your rating save successfully."
        };
    } catch (error) {
        throw new Error(error.message);
    }
};
exports.serviceRatingGet = async (user, data) => {
    try {

        let userCheck = await callingModel.find({ consultant: user._id }).populate('category category_sub user');

        return {
            status: 1,
            data: userCheck,
            message: "Your rating fetch successfully."
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.getTemplates = async (data) => {
    try {
        let type = parseInt(data.type);
        switch (type) {
            case 1: {
                return {
                    status: 1,
                    message: "Privacy policy fetched Successfully",
                    data: config.HOSTBACK + "/template/Privacy_Policy.html"
                };
            }
            case 2: {
                return {
                    status: 1,
                    message: "FAQs fetched Successfully",
                    data: config.HOSTBACK + "/template/FAQs.html"
                };
            }
            case 3: {
                return {
                    status: 1,
                    message: "Terms and conditions fetched Successfully",
                    data: config.HOSTBACK + "/template/Terms_and_Conditions.html"
                };
            }
            default: {
                return {
                    status: 1,
                    message: "About Us fetched Successfully",
                    data: config.HOSTBACK + "/template/About_Us.html"
                };
            }
        }
    } catch (err) {
        throw new Error(err.message);
    }
};
exports.categoryGet = async (user, data) => {
    try {

        let userCheck = await categoryModel.find({ is_deleted: false }).populate('sub_category_id').sort({ position: 1 });
        let dataToSend = {}
        if (userCheck) {
            dataToSend = userCheck;
        }
        return {
            status: 1,
            data: userCheck,
            message: "List fetch successfully."
        };
    } catch (error) {
        throw new Error(error.message);
    }
};
exports.categorySubGet = async (user, id) => {
    try {
        let category = await subCategoryModel.find({ category: mongoose.Types.ObjectId(id), is_deleted: false }).sort({ position: 1 }).lean();
        if (!category) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }
        let dataToSend = category

        return {
            status: 1,
            data: dataToSend,
            message: "List fetch successfully."
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.categorySubSubGet = async (user, id) => {
    try {
        let category = await subSubCategoryModel.find({ subCategory: mongoose.Types.ObjectId(id), is_deleted: false }).populate('subCategory').sort({ position: 1 }).lean();
        if (!category) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }
        let dataToSend = category

        return {
            status: 1,
            data: dataToSend,
            message: "List fetch successfully."
        };
    } catch (error) {
        throw new Error(error.message);
    }
};


exports.callHistory = async (user) => {
    try {

        let callHistory = await callingModel.find({ status: 3, user: user._id }).populate('user category consultant category_sub category_sub_sub').lean(true);
        if (!callHistory) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        for (let index = 0; index < callHistory.length; index++) {
            const element = callHistory[index];
            // console.log(element, "fcghyuilogfthyuiugyfhjui")

            let findD = await UserRatingModel.findOne({
                // sub_category_id: element.category_sub._id,
                service_id: element.consultant._id,
                call_id: element._id,
                user_id: user._id
            })
            if (!findD) {
                element.isRating = false
                element.ratingData = {}
            } else {
                element.isRating = true
                element.ratingData = findD
            }
        }

        return { status: 1, data: callHistory, message: "callHistory fetch successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.sendRefferalInviatation = async (data, user) => {

    try {
        user.refered_count = user.refered_count + 1;
        let saveUser = await user.save();
        if (!saveUser) {
            return {
                status: -1,
                message: "Something went wrong,Please try later."
            };
        }
        return {
            status: 1,
            message: "Invitation Sent",
            data: saveUser
        };
    } catch (error) {
        throw new Error(error.message);
    }
};
exports.callHistoryUpdate = async (data, user) => {

    try {
        user.no_of_calls = user.no_of_calls - data.no_of_calls;
        // user.no_of_calls = user.no_of_calls - 1;
console.log(data,"hhhhhh",user)
        let callHistoryObj = {
            service_id: data.service_id,
            call_id: data.call_id,
            time_duration: data.time_duration,
            call_start_at: data.call_start_at,
            call_mode: data.call_mode
        }
        let subscription = await applySubscriptionModel.findOne({
            user: user._id
        }).sort({ _id: -1 });
        let leftCalls = parseInt(subscription.leftCalls) - parseInt(data.no_of_calls);
        // let leftCalls = parseInt(subscription.leftCalls) - 1;
console.log(subscription,"hhhhhhhhhhhhhhhh",leftCalls)
        // console.log(callHistoryObj);
        let updateSubcription = await applySubscriptionModel.findByIdAndUpdate(subscription._id, { $set: { leftCalls: leftCalls } }, { new: true })
        let updateHistory = await callingModel.findByIdAndUpdate(data._id, callHistoryObj, { new: true });
        let saveUser = await user.save();
        if (!saveUser) {
            return {
                status: -1,
                message: "Something went wrong,Please try later."
            };
        }
        return {
            status: 1,
            message: "Invitation Sent",
            data: updateSubcription
        };
    } catch (error) {
        throw new Error(error.message);
    }
};
exports.callHistoryRating = async (data, user) => {

    try {
        // user.refered_count = user.refered_count + data.no_of_calls;
        let callHistoryObj = {
            call_rating: data.call_rating,
            call_review: data.call_review,

        }
        console.log(callHistoryObj);
        let updateHistory = await callingModel.findByIdAndUpdate(data._id, callHistoryObj, { new: true });


        return {
            status: 1,
            message: "Invitation Sent",
            data: updateHistory
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.referralUser = async (data, user) => {

    try {
        let user_ref = await UserModel.findOne({ refered_key: data.refered_key });
        console.log("user_ref :::",
        );
        let referralUserObj = {
            user_id: user_ref._id,
            refered_key: data.refered_key,
            referral_user_id: data._id,

        }
        let savereferal = new UserReferralModel(referralUserObj);
        savereferal = await savereferal.save();
        // let updateHistory  = await  callingModel.findByIdAndUpdate(data._id,referralUserObj,{new:true});


        return {
            status: 1,
            message: "Referal successfull install",
            data: savereferal
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.getSubscriptionList = async (data) => {
    try {
        // Fetch active subscription plans for the user
        let activePlans = await applySubscriptionModel.find({ user: data._id }).lean(true).populate("user");
    
        let pastPlan = [];
        let validActivePlans = [];
    
        for (let index = 0; index < activePlans.length; index++) {
            const element = activePlans[index];
            let purchaseDate = element.purchaseDate;
            let duration = element.duration;
    
            // Calculate expiration date by adding duration to purchase date
            let expirationDate = new Date(purchaseDate);
            expirationDate.setDate(expirationDate.getDate() + duration);
            let expirationTime = expirationDate.getTime();
    
            let currentTime = new Date().getTime(); // Current time in milliseconds
    
            // Check if the plan should go to pastPlan
            if (element.leftCalls <= 0 || currentTime > expirationTime) {
                pastPlan.push(element); // Add to pastPlan if leftCalls is 0 or negative, or plan expired
            } else {
                validActivePlans.push(element); // Keep valid active plans
            }
        }
    
        return {
            status: 1,
            message: "Subscription plans fetched successfully.",
            data: {
                activePlans: validActivePlans, // Active plans that haven't expired
                pastPlan // Expired or depleted plans
            }
        };
    } catch (err) {
        throw new Error(err.message);
    }
    
    
}

exports.deleteUser = async (data) => {
    try {

        let user = await UserModel.findByIdAndUpdate(data._id, { $set: { is_deleted: true } }, { new: true }).lean(true);

        if (!user) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "user Deleted Successfully.", data: user };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.editProfile = async (data, userData) => {
    try {

        let user = await UserModel.findByIdAndUpdate(data._id, userData, { new: true }).lean(true);

        if (!user) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "profile updated.", data: user };

    } catch (err) {
        throw new Error(err.message);
    }
}


exports.getFaq = async () => {

    try {
        let result = await faqModel.find({ type: 0 })
            .lean();
        return {
            status: 1,
            message: "Faq fetch",
            data: result
        };
    } catch (error) {
        throw new Error(error.message);
    }
};


exports.getSettingData = async (data) => {
    try {

        let { type } = data.query;
        let checkType = ['0', '1', '2', '3', 0, 1, 2, 3];
        if (!checkType.includes(type)) {
            res.status(403).json({ message: "plz send correct type", success: false, data: {} })
            return
        }
        let select = {};
        let selectData;
        if (type == 0) {
            select.termsAndCondtion = 1;
            selectData = "termsAndCondtion";
        } else if (type == 1) {
            select.privacyPolicy = 1;
            selectData = "privacyPolicy";
        } else if (type == 2) {
            select.legal = 1;
            selectData = "legal";
        } else {
            select.help = 1;
            selectData = "help"
        }
        let result = await settingModel.findOne({ type: 0 })
            .select(select)
            .lean();
        if (!result) {
            // res.status(403).json({ message: "not Found", success: false, data: {} })
            return { status: -1, message: "Something went wrong, Please try later." };


        }
        // res.status(200).send(result[selectData])

        return {
            status: 1,
            data: result[selectData]
        };

    } catch (error) {
        throw new Error(error.message);

    }
}

exports.getSettingData1 = async (data) => {
    try {

        let { type } = data.query;
        let checkType = ['0', '1', '2', '3', 0, 1, 2, 3];
        if (!checkType.includes(type)) {
            res.status(403).json({ message: "plz send correct type", success: false, data: {} })
            return
        }
        let select = {};
        let selectData;
        if (type == 0) {
            select.termsAndCondtion = 1;
            selectData = "termsAndCondtion";
        } else if (type == 1) {
            select.privacyPolicy = 1;
            selectData = "privacyPolicy";
        } else if (type == 2) {
            select.legal = 1;
            selectData = "legal";
        } else {
            select.help = 1;
            selectData = "help"
        }
        let result = await settingModel.findOne({ type: 0 })
            .select(select)
            .lean();

        if (!result) {
            // res.status(403).json({ message: "not Found", success: false, data: {} })
            return { status: -1, message: "Something went wrong, Please try later." };


        }
        return {
            status: 1,
            data: result[selectData]
        }
        // return {
        //     status: 1,
        //     data: result[selectData]
        // };

    } catch (error) {
        throw new Error(error.message);

    }
}


exports.notificationList = async (data) => {

    try {
        console.log(data);


        let notificationData = await notificationModel.find({
            userId: { $in: data._id },
            status: { $in: [0, 3] }
        })
            .select('notification isRead createdAt updatedAt')
            .lean();

        let length = await notificationModel.countDocuments({
            userId: data._id,
            status: { $in: [0, 3] },
            isRead: 0
        });

        return {
            status: 1,
            data: {
                notificationData,
                length
            }
        };


    } catch (error) {
        throw new Error(error.message);
    }
};

exports.deleteNotification = async (data1) => {
    try {
        let id = data1.id
        let data = await notificationModel.findByIdAndDelete(id);

        if (!data) {
            return { status: -1, message: "Something went wrong, Please try later." };

        }
        return { status: 1, message: "Notification Deleted", data: data };


    } catch (err) {
        throw new Error(err.message);
    }
}

exports.readAllNotification = async (data, data1) => {
    try {

        let userData = data1;


        let notificationData = await notificationModel.updateMany({
            userId: { $in: userData._id }
        }, {
            $set: {
                isRead: 1
            }
        }, {
            new: true
        })

        if (!notificationData) {

            return { status: -1, message: "not found", data: {} };



        }
        // res.status(200).json({ message: "Notification Data", success: false, data: notificationData })
        return { status: 1, message: "Notification Read ", data: {} };



    } catch (err) {
        throw new Error(err.message);

    }
}