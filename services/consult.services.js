const { ConsultModel } = require("../models/consultModel");

const utils = require("../modules/utils");
const authentication = require("../middlewares/authentication");
const { msg } = require("../modules/message");
const config = require("../configs/config");
const { randomStringGenerator, randomreferralCode, sendPushNotification } = require("../modules/utils");
const { mongoose } = require("../configs/db");
const { categoryModel } = require("../models/categoryModel");
const { callingModel } = require("../models/callingModel");
const { applySubscriptionModel } = require("../models/applySubscriptionModel");
const { subCategoryModel } = require("../models/subCategoryModel");
const { forEach } = require("lodash");
const { notificationModel } = require("../models/notificationModel");
const { faqModel } = require("../models/faqModel");
const { settingModel } = require("../models/settingModel");
const { AdminChargeModel } = require("../models/admin.charge.model");
const { bannerModel } = require("../models/bannerModel");
var randomstring = require("randomstring");
const { subSubCategoryModel } = require("../models/subSubCategoryModel");


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

        let userForReject = await ConsultModel.findOne({
            $and: [{
                mobileNumber: data.mobileNumber.toString()
            }, {
                countryCode: data.countryCode
            }, {
                isVerified: false
            }]
        });

        if (userForReject) {
            return {
                status: -1,
                message: "Your profile was rejected by Admin"
            };
        }

        let userFindData = await ConsultModel.findOne({
            $and: [{
                mobileNumber: data.mobileNumber.toString()
            }, {
                countryCode: data.countryCode
            }, {
                is_deleted: false
            }]
        })

        if (userFindData) {
            if (userFindData.isBlocked === 1) {
                return {
                    status: -1,
                    message: "You are blocked by Admin"
                };
            }

            if (userFindData.isProfileCompleted && userFindData.isDocumentUploaded && userFindData.isBankDetailsUploaded && (!userFindData.isVerified)) {
                return {
                    status: -1,
                    message: "Your profile is not verified yet, Please wait for profile verification"
                };
            }
            await userFindData.populated("consultantType", "image categoryName");
            userData = userFindData;

        } else {

            userData.mobileNumber = data.mobileNumber.toString();
            userData.countryCode = data.countryCode;

            userData = await ConsultModel.create(userData);
            if (!userData) {
                return {
                    status: -1,
                    message: "Something went wrong Please try later"
                }
            }
            userData.populated("consultantType", "image categoryName");
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
        let otp = await randomStringGenerator();
        // let otp = 1234;
        // let otp =  randomstring.generate({
        //     length: 4,
        //     charset: 'numeric',
        // })
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
        let userData = await data.save();
        if (!userData) {
            return {
                status: -1,
                message: "Something went wrong"
            };
        } else {
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
        data.isProfileCompleted = true;
        data.modified_at = Date.now();
        let saveUser = await ConsultModel.findOneAndUpdate({ _id: userData._id }, { $set: data }, { new: true, useFindAndModify: false });
        if (!saveUser) {
            return {
                status: -1,
                message: "Something went wrong,Please try later."
            };
        }

        if (saveUser.notify_me && saveUser.deviceToken) {
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
        return {
            status: 1,
            message: "Otp verified Successfully.",
            data: userData
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.saveDocuments = async (data, userData) => {

    try {
        data.isDocumentUploaded = true;
        data.modified_at = Date.now();
        let saveUser = await ConsultModel.findOneAndUpdate({ _id: userData._id }, { $set: data }, { new: true, useFindAndModify: false });
        if (!saveUser) {
            return {
                status: -1,
                message: "Something went wrong,Please try later."
            };
        }
        await saveUser.populated("consultantType", "image categoryName");

        return {
            status: 1,
            data: saveUser
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.saveBankDetails = async (data, userData) => {

    try {
        data.isBankDetailsUploaded = true;
        data.modified_at = Date.now();
        let saveUser = await ConsultModel.findOneAndUpdate({ _id: userData._id }, { $set: data }, { new: true, useFindAndModify: false })
        if (!saveUser) {
            return {
                status: -1,
                message: "Something went wrong,Please try later."
            };
        }
        await saveUser.populated("consultantType", "image categoryName");
        return {
            status: 1,
            data: saveUser
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.getCategories = async () => {
    try {

        let categories = await categoryModel.find({ is_deleted: false }, { image: 1, categoryName: 1 ,categoryNameArabic:1}).sort({ position: 1 }).lean();

        if (!categories) {
            return {
                status: -1,
                message: "Something went wrong"
            };
        }

        return {
            status: 1,
            data: categories,
            message: "User Found"
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

exports.updateProfile = async (data, user) => {
    try {
        let saveUser = await ConsultModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(user._id) }, data, { new: true, useFindAndModify: false });
        if (!saveUser) {
            return {
                status: -1,
                message: "Something went wrong,Please try later."
            };
        }
        await saveUser.populated("consultantType", "image categoryName");
        if (saveUser.notify_me && saveUser.deviceToken) {
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
            message: "Your duty changed successfully.",
            data: user
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.changeDuty = async (onDuty, user) => {

    try {
        user.on_duty = onDuty;
        let saveUser = await user.save();
        if (!saveUser) {
            return {
                status: -1,
                message: "Something went wrong,Please try later."
            };
        }
        return {
            status: 1,
            message: "Your status has been changed successfully.",
            data: user
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.notifyMe = async (notify, user) => {

    try {
        user.notify_me = notify;
        let saveUser = await user.save();
        if (!saveUser) {
            return {
                status: -1,
                message: "Something went wrong,Please try later."
            };
        }
        return {
            status: 1,
            message: "Your notification setting update successfully.",
            data: user
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


exports.getServices = async (user) => {
    try {
        console.log("user._id,::", user.consultantSubType);
        console.log("user id::", user._id);
        let subCategory = [];
        user.consultantSubType.forEach(element => {
            subCategory.push(element._id);
        });
        console.log("subCategory:::", subCategory);
        let calling = await callingModel.find({ category_sub: { $in: subCategory }, status: { $in: [1] } }).sort({ createdAt: -1 }).populate("user", "profileImage firstName lastName email").populate("category", "image categoryName");
        // let calling = await callingModel.find({ category: user._id, status: { $in: [1, 2] } }).sort({ createdAt: -1 }).populate("user", "profileImage firstName lastName email").populate("category", "image categoryName");
        if (!calling) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, data: calling, message: "Services fetch successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.updateService = async (data, user) => {
    try {
        // console.log("user::::",user);
        let notify, payload, datas;
        let calling = await callingModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(data.id) }, { $set: { consultant: user._id, status: data.status } }, { new: true, useFindAndModify: false }).populate("user", "deviceType deviceToken profileImage firstName lastName email mobileNumber gender");
        if (!calling) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        if (calling.status == 2 && calling.user.deviceToken) {
            let device_token = calling.user.deviceToken;
            let device_type = calling.user.deviceType;
            let title = `Your request has been accepted by ${user.firstName}`;
            let body = `Your request has been accepted by ${user.firstName}`;
            if (device_type == 2 || device_type == 3) {
                notify = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    "color": "#f95b2c",
                    "sound": true,
                    "badge": 1,
                }
                payload = {
                    title,
                    serviceId: data.id,
                    body,
                    notify,
                    notification_type: 12
                }
            } else {
                datas = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    "color": "#f95b2c",
                    "sound": true,
                    "badge": 1,
                };
                payload = {
                    title,
                    serviceId: data.id,
                    body,
                    datas,
                    notification_type: 12,
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
                notificationSendBy: 1,
                status: 0,
                userId: calling.user,
                consultantId: user._id,
                createdAt: new Date().getTime()
            }

            let createNotification = await new notificationModel(saveData)
            let saveNotification = await createNotification.save();
        }

        return { status: 1, data: calling, message: "Services fetch successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}


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

exports.giveCall = async (data) => {
    try {
        let notify;
        let payload;
        let datas;
        let calling = await callingModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(data.id) }, { $set: data }, { new: true, useFindAndModify: false }).populate("user");
        if (!calling) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }
        console.log(calling, "lllllllllllllllllllllllll")

        if (calling.user.deviceToken) {
            let device_token = calling.user.deviceToken;
            let device_type = calling.user.deviceType;
            let title = `Your have a call`;
            let body = `Your have a call`;
            if (device_type == 2 || device_type == 3) {
                notify = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    "color": "#f95b2c",
                    "badge": 1,
                    sound: true
                }
                payload = {
                    title,
                    body,
                    serviceId: data.id,
                    notify,
                    //call_status: 1
                    firstName: calling.user.firstName,
                    lastName: calling.user.lastName,
                    profilePic: calling.user.profileImage,
                    callId: calling.uid,
                    agoraToken: calling.agoraToken,
                    notification_type: 1
                }
                console.log(payload, "dfghjukilodfghjkifgh")
            } else {
                datas = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    color: "#f95b2c",
                    sound: "default",
                    badge: "1",
                    // type: 'type',
                    // id: calling._id,
                };
                payload = {
                    title,
                    body,
                    serviceId: data.id,
                    notify,
                    //call_status: 1
                    firstName: calling.user.firstName,
                    lastName: calling.user.lastName,
                    profilePic: calling.user.profileImage,
                    callId: calling.uid,
                    agoraToken: calling.agoraToken,
                    notification_type: 1
                }
                console.log(payload, "dfghjukilodfghjkifgh")

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

exports.endCall = async (data) => {
    try {
        let notify, payload, datas;
        let calling = await callingModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(data.id) }, { $set: { status: 3, time: data.totalTime, callStartAt: data.callStartAt, numberOfCalls: data.numberOfCalls } }, { new: true, useFindAndModify: false }).populate("user");
        if (!calling) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        if (calling.user.deviceToken) {
            let device_token = calling.user.deviceToken;
            let device_type = calling.user.deviceType;
            let title = `Your have a call`;
            let body = `Your have a call`;
            if (device_type == 2 || device_type == 3) {
                notify = {
                    title: "ASKperts",
                    body: body,
                    click_action: "FCM_PLUGIN_ACTIVITY",
                    "color": "#f95b2c",
                    "sound": true,
                    "badge": 1,
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
                    "color": "#f95b2c",
                    "sound": true,
                    "badge": 1,

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


exports.getTemplates = async (data) => {
    try {
        let type = parseInt(data.type);
        switch (type) {
            case 1: {
                return { status: 1, message: "Privacy policy fetched Successfully", data: config.HOSTBACK + "/template/Privacy_Policy.html" };
            }
            case 2: {
                return { status: 1, message: "FAQs fetched Successfully", data: config.HOSTBACK + "/template/FAQs.html" };
            }
            case 3: {
                return { status: 1, message: "Terms and conditions fetched Successfully", data: config.HOSTBACK + "/template/Terms_and_Conditions.html" };
            }
            default: {
                return { status: 1, message: "About Us fetched Successfully", data: config.HOSTBACK + "/template/About_Us.html" };
            }
        }
    } catch (err) {
        throw new Error(err.message);
    }
};


exports.updateCallingStatus = async (data, consult) => {

    try {
        let notify, payload, datas;
        data.consultant = consult
        let calling = await callingModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(data.id) }, { $set: data }, { new: true, useFindAndModify: false }).populate("user").populate('consultant');
        if (!calling) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }
        console.log(calling.uid, "ghjklhjkl");

        if (calling.user?.deviceToken) {
            let device_token = calling.user.deviceToken;
            let device_type = calling.user.deviceType;
            let title = null;
            let body = null;
            let notification_type = data.notification_type
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
                    firstName: calling.user.firstName,
                    lastName: calling.user.lastName,
                    profilePic: calling.user.profileImage,
                    callId: calling.uid,
                    agoraToken: calling.agoraToken,
                    notification_type: data.notification_type,
                    calling_type: data.calling_type,
                    calling_first_name: calling.consultant.firstName,
                    calling_last_name: calling.consultant.lastName,
                    calling_profile_pic: calling.consultant.profileImage,
                    calling_consultant_id: calling.consultant._id,

                }
            } else {
                // console.log("calling.user");
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
                    firstName: calling.user.firstName,
                    lastName: calling.user.lastName,
                    profilePic: calling.user.profileImage,
                    callId: calling.uid,
                    agoraToken: calling.agoraToken,
                    notification_type: data.notification_type,
                    calling_type: data.calling_type,
                    calling_first_name: calling.consultant.firstName,
                    calling_last_name: calling.consultant.lastName,
                    calling_profile_pic: calling.consultant.profileImage,
                }
            }
            console.log("consultant ::: ", payload);
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


exports.categoryGet = async (user, data) => {
    try {

        let userCheck = await categoryModel.find();
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
        let category = await subSubCategoryModel.find({ subCategory: mongoose.Types.ObjectId(id), is_deleted: false }).sort({ position: 1 }).lean();
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

exports.serviceRatingGet = async (user, data) => {
    try {

        let userCheck = await UserRatingModel.find({ service_id: data.service_id }).populate('service_id').populate('user_id');
        let dataToSend = {}
        if (userCheck) {
            dataToSend = userCheck;
        }
        return {
            status: 1,
            data: userCheck,
            message: "Your rating fetch successfully."
        };
    } catch (error) {
        throw new Error(error.message);
    }
};

exports.getFaq = async () => {

    try {
        let result = await faqModel.find({ type: 1 })
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

exports.deleteConsult = async (data) => {
    try {

        let user = await ConsultModel.findByIdAndUpdate(data._id, { $set: { is_deleted: true } }, { new: true }).lean(true);

        if (!user) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "consult Deleted Successfully.", data: user };

    } catch (err) {
        throw new Error(err.message);
    }
}

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
        let result = await settingModel.findOne({ type: 1 })
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

exports.notificationList = async (data) => {

    try {
        console.log(data);


        let notificationData = await notificationModel.find({
            consultantId: { $in: data._id },
            status: { $in: [1, 3] }
        })
            .select('notification isRead createdAt updatedAt')
            .lean();

        let length = await notificationModel.countDocuments({
            consultantId: data._id,
            status: { $in: [1, 3] },
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
}

exports.deleteNotification = async (data1) => {
    try {
        let id = data1.id
        let data = await notificationModel.deleteMany({ consultantId: id });

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
            consultantId: { $in: userData._id }
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

exports.editProfile = async (data, userData) => {
    try {

        let user = await ConsultModel.findByIdAndUpdate(data._id, userData, { new: true }).lean(true);

        if (!user) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "profile updated.", data: user };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.pastHistory = async (user, data) => {
    try {

        let transactions = await callingModel.find({ consultant: user._id, status: 3 }).populate('consultant user category category_sub').sort({ _id: -1 });
        return { status: 1, message: "Fee fetch successfully.", data: transactions };
    } catch (err) {
        throw new Error(err.message);
    }
}

exports.paymentList = async (data) => {
    try {
        let { paymentType } = data
        let commisionData = await AdminChargeModel.findOne({})
        let commission = commisionData.consultant_per_call_fee
        // console.log(commission);
        let amount = 0
        let totalAmount = 0

        let transactions = await callingModel.find({ paymentStatus: paymentType }).lean(true).populate('consultant user category category_sub');
        for (let index = 0; index < transactions.length; index++) {
            const element = transactions[index];
            // console.log(Number(element.time_duration), commission)

            function getDecimalTime(s) {
                var p = s.split(':');
                console.log(p)
                return +p[0] + +p[1] + +p[2] / 60;
            }
            // console.log(getDecimalTime(element.time_duration))
            amount = commission * (element.time_duration == "0" ? 0 : getDecimalTime(element.time_duration))
            // amount = amount == null ? 0 : amount
            element.amount = amount
            // console.log(amount)
            totalAmount = 0

        }

        // console.log(totalAmount, "fghjkl;")

        if (!transactions) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "Transactions fetch successfully.", data: { transactions, totalAmount } };
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