const { AdminModel } = require("../models/adminModel");
const { msg } = require("../modules/message");
const authentication = require("../middlewares/authentication");
const utils = require('../modules/utils');
const { UserModel } = require('../models/userModel');
const { ConsultModel } = require('../models/consultModel');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const { categoryModel } = require("../models/categoryModel");
const { subscriptionModel } = require("../models/subscriptionModel");
const { bannerModel } = require("../models/bannerModel");
const { subCategoryModel } = require("../models/subCategoryModel");
const { subAdminModel } = require("../models/subAdminModel");
const { applySubscriptionModel } = require("../models/applySubscriptionModel");
const { AdminChargeModel } = require("../models/admin.charge.model");
const { callingModel } = require("../models/callingModel");
const { faqModel } = require("../models/faqModel");
const { settingModel } = require("../models/settingModel");
const { notificationModel } = require("../models/notificationModel");
const bcrypt = require("bcrypt");
const saltRounds = 10;
const moment = require("moment");
const { subSubCategoryModel } = require("../models/subSubCategoryModel");
const { CommissionModel } = require("../models/commissionModel");

exports.createAdmin = async (data) => {
    try {
        if (!data.email || data.email == '')
            throw new Error("Please enter the email");
        if (!data.password || data.password == '')
            throw new Error("Please enter the password.");
        let user = await AdminModel.findOne({});
        if (!user) {
            let pass = await utils.encryptText(data.password);
            data.password = pass;

            data.token = await authentication.generateToken('30 days');

            let adminUser = new AdminModel(data);
            let admin = await adminUser.save();
            if (!admin) {
                return { status: -1, message: "something went wrong try after sometime" };
            }
            return { data: admin, message: msg.success, status: 1 };
        } else {
            return { status: -1, message: "Admin already Created." };
        }
    } catch (err) {
        throw new Error(err.message);
    }

};

exports.loginAdmin = async (data) => {

    try {
        if (!data.password || data.password == '')
            throw new Error("Please Enter the password");

        let admin = await AdminModel.findOne({ email: data.email }).exec();
        if (!admin)
            throw new Error("Email id not Exist");

        let check = await utils.compare(data.password, admin.password);
        if (!check) {
            throw new Error(msg.invalidPass);
        }
        let token = authentication.generateToken('30 days');

        admin.token = token;
        let adminUser = await admin.save();
        if (!adminUser) {
            return { status: -1, message: "Something went wrong, Please try Later" };
        }
        return { status: 1, data: adminUser, message: "Login Successfully" };

    } catch (error) {
        throw new Error(error.message);
    }
};



exports.logoutAdmin = async (userData) => {

    let admin = await AdminModel.updateOne({ _id: userData._id }, { $set: { token: null } });
    if (!admin) {
        return { status: -1, message: "Something went wrong, Please try Later" };
    }
    return { message: msg.logoutSuccessfully };
};

exports.forgetPassword = async (data) => {
    try {
        if (!data.email || data.email == '')
            throw new Error("Please enter the email");

        let admin = await AdminModel.findOne({ email: data.email }).exec();
        if (!admin) {
            return { status: -1, message: "Email not exist" };
        }

        let tokenForLinkValidation = authentication.generateToken('2 days');
        admin.linkToken = tokenForLinkValidation;
        let saveAdmin = await admin.save();

        let baseUrl = "http://localhost:4200/reset-password/";
        let url = baseUrl + tokenForLinkValidation;
        let subject = "Forgot Password Email";
        let html =
            "<p>Hey! welcome  please Click " +
            ` <a href=${url}>here</a>` +
            " to change your password.</p>";
        let sendData = {
            toEmail: data.email,
            subject: subject,
            html: html,
        };
        await utils.sendgridSendmail(data.email, subject, html);
        return { status: 1, message: "Link is send on your Email id ." }

    } catch (error) {
        throw new Error(error.message);
    }
};

exports.resetPassword = async (data) => {
    try {
        if (!data.id || data.id == '')
            return { status: 0, message: "Invalid Link" };
        if (!data.confirmNewPassword || data.confirmNewPassword == '')
            throw new Error("Confirm Password Not be blank");
        if (!data.newPassword || data.newPassword == '')
            throw new Error("New Password Not be blank");
        let admin = await AdminModel.findOne({ linkToken: data.id });
        if (!admin || admin == null) {
            return { status: 0, message: "Invalid Link" };
        }
        if (data.confirmNewPassword === data.newPassword) {
            var password = await utils.encryptText(data.newPassword);
            admin.password = password;
            admin.linkToken = '' //remove
            let saveAdmin = admin.save();
            if (!saveAdmin) {
                throw new Error("Something went Wrong");
            }
            return { status: 1, message: "Password Changed Successfully, Please Login" };
        } else {
            throw { message: msg.fieldNotMatch };
        }

    } catch (error) {
        throw new Error(err.message);
    }
};

exports.changePassword = async (data) => {
    console.log("node", data)
    let userId = data._id
    console.log(userId);
    let admin = await AdminModel.findById(userId).lean();
    //console.log(admin,"hiii")

    if (!admin || admin == null) throw { message: msg.userNotExist };


    let check = await bcrypt.compare(data.oldPassword, admin.password);
    if (!check) throw { message: msg.invalidPass };
    //console.log(check)
    if (data.newPassword === data.confirmPassword) {
        var pass = await bcrypt.hash(data.newPassword, 10);
    } else {
        throw { message: msg.fieldNotMatch };
    }


    let a = await AdminModel.update({ _id: userId }, { $set: { password: pass } });

    return { message: msg.passwordUpdated };
};

exports.userManagement = async (data) => {
    try {
        let user;
        if (data.search) {
            user = await UserModel.find({ fullName: { '$regex': data.search, '$options': 'i' }, is_deleted: false, isProfileCompleted: true }).lean();
        } else {
            user = await UserModel.find({ is_deleted: false, isProfileCompleted: true }).lean();
        }

        if (!user) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }
        return { status: 1, message: "User data fetch successfully.", data: user };
    } catch (err) {
        throw new Error(err.message);
    }
};

exports.blockUser = async (id, data) => {
    try {
        let user;
        if (parseInt(data.type) == 1)
            user = await UserModel.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: data });
        else
            user = await ConsultModel.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: data });
        if (!user) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }
        if (parseInt(data.isBlocked)) {
            return { status: 1, message: "User block successfully." };
        }
        return { status: 1, message: "User unblock successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.acceptOrRejectConsultant = async (id, data) => {
    try {

        let user = await ConsultModel.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: data });
        if (!user) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }
        if (Boolean(data.isVerified)) {
            return { status: 1, message: "consultant accepted successfully." };
        }
        return { status: 1, message: "consultant rejected successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.deleteConsultant = async (id, data) => {
    try {

        let user = await ConsultModel.updateOne({ _id: mongoose.Types.ObjectId(id) }, { $set: data });
        if (!user) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "consultant deleted successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.consultantManagement = async (data) => {
    try {
        //1 means request for accept or reject(new users), 2 means accepted, 3 means rejected
        let query = [];

        switch (parseInt(data.type)) {
            case 1:
                query = [
                    {
                        "isVerified": {
                            $exists: false
                        }
                    }, {
                        "isBankDetailsUploaded": true
                    }, {
                        "isProfileCompleted": true
                    }, {
                        "isDocumentUploaded": true
                    }, {
                        "is_deleted": false
                    }
                ]
                break;
            case 2:
                query = [
                    {
                        "isVerified": true
                    }, {
                        "isBankDetailsUploaded": true
                    }, {
                        "isProfileCompleted": true
                    }, {
                        "isDocumentUploaded": true
                    }, {
                        "is_deleted": false
                    }
                ]

                break;
            default:
                query = [
                    {
                        "isVerified": false
                    }, {
                        "isBankDetailsUploaded": true
                    }, {
                        "isProfileCompleted": true
                    }, {
                        "isDocumentUploaded": true
                    }, {
                        "is_deleted": false
                    }
                ]
        }

        if (data.search) {
            query.push({
                $or: [
                    {
                        firstName: { '$regex': data.search, '$options': 'i' }
                    }, {
                        lastName: { '$regex': data.search, '$options': 'i' }
                    }
                ]
            })
        }

        if (data.consultation_type) {
            query.push({
                consultantType: data.consultation_type
            })
        }

        let user = await ConsultModel.aggregate([
            {
                $match: {
                    $and: query
                }
            },
            {
                $lookup: {
                    from: "category",
                    localField: "consultantType",
                    foreignField: "_id",
                    as: "consultantType"
                }
            },
            // {
            //     $lookup: {
            //         from: "calling",
            //         localField: "consultant",
            //         foreignField: "_id",
            //         as: "callingData"
            //     }
            // },
            {
                "$lookup": {
                    "from": "calling",
                    "let": { "consultant": "$_id" },
                    "pipeline": [
                        { "$match": { "$expr": { "$eq": ["$consultant", "$$consultant"] } } }
                    ],
                    "as": "calling"
                }
            },
            {
                $project: {
                    "profileImage": 1,
                    "firstName": 1,
                    "lastName": 1,
                    "gender": 1,
                    "email": 1,
                    "dateOfBirth": 1,
                    "country": 1,
                    "nationality": 1,
                    "mobileNumber": 1,
                    "countryCode": 1,
                    "isProfileCompleted": 1,
                    "isDocumentUploaded": 1,
                    "isBankDetailsUploaded": 1,
                    "isBlocked": 1,
                    "address": 1,
                    "consultantType": 1,
                    "documents": 1,
                    "created_at": 1,
                    "experience": 1,
                    "language": 1,
                    "accountName": 1,
                    "accountNumber": 1,
                    "ibanNumber": 1,
                    "active": 1,
                    "isVerified": 1,
                    // "rating": 4,
                    "calling": { $size: "$calling" },
                    // "rating": { $avg: "$calling.call_rating" },
                    "rating": { $round: [{ $avg: { $ifNull: ["$calling.call_rating", 0] } }, 0] },


                    "callingData": "$calling",
                    // "ratingg": { $ceil: "$rating" },

                    // "noOfConsult": calling
                }
            }
        ]);
        if (!user) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }
        return { status: 1, message: "User data fetch successfully.", data: user };
    } catch (err) {
        throw new Error(err.message);
    }
};

exports.addtemplate = async (data) => {
    try {
        let title = data.title;
        let template = data.template;
        fs.writeFileSync(path.join(__dirname, '../', '/template/' + title + '.html'), template);
        return { status: 1, message: "Template Added Successfully." };
    } catch (error) {
        throw new Error(error.message);
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

exports.getSubscription = async () => {
    try {

        let subscription = await subscriptionModel.find({ is_deleted: false }).sort({ position: 1 }).lean();
        if (!subscription) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, data: subscription, message: "Subscription fetch successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.createAndUpdateCategories = async (data) => {
    try {
        let position = data.position
        if (!data._id) {
            let findPosition = await categoryModel.findOne({ position: data.position })
            if (findPosition) {
                return { status: -1, message: "Position already exist." };
            }
            let findCategory = await categoryModel.findOne({ categoryName: data.categoryName })
            if (findCategory) {
                return { status: -1, message: "Category already exist." };
            }
            
            let category = await categoryModel.create(data);
            if (!category) {
                return { status: -1, message: "Something went wrong, Please try later." };
            }

            return { status: 1, message: "Category added successfully." };
        }


        let findPosition = await categoryModel.findOne({ position: position })
        if (findPosition) {
            let findPositionById = await categoryModel.findById(data?._id)
            let updatePosition = await categoryModel.findByIdAndUpdate(findPosition?._id, { $set: { position: (findPositionById?.position + 1) } }, { new: true })
        }
        let updateData = {
            position: data?.position
        }
        if(data.categoryName){
            updateData.categoryName =  data.categoryName
        }
        if(data.categoryNameArabic){
            updateData.categoryNameArabic =  data.categoryNameArabic
        }
        if(data.image){
            updateData.image =  data.image
        }
        let category = await categoryModel.updateOne({ _id: mongoose.Types.ObjectId(data._id) }, { $set: updateData}, { new: true, useFindAndModify: false });
        if (!category) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }



        return { status: 1, message: "Category updated successfully.", data: category };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.createAndUpdateSubscription = async (data) => {
    try {
        let position = data.position

        if (!data._id) {
            let findPosition = await subscriptionModel.findOne({ position: data.position, isDeleted: false })
            if (findPosition) {
                return { status: -1, message: "Position already exist." };
            }
            let subscription = await subscriptionModel.create(data);
            if (!subscription) {
                return { status: -1, message: "Something went wrong, Please try later." };
            }

            return { status: 1, message: "Subscription added successfully." };
        }

        let findPosition = await subscriptionModel.findOne({ position: position })
        // if (findPosition) {
        //     let findPositionById = await subscriptionModel.findById(data?._id)
        //     let updatePosition = await subscriptionModel.findByIdAndUpdate(findPosition?._id, { $set: { position: findPositionById?.position } }, { new: true })
        // }

        // let subscription = await subscriptionModel.updateOne({ _id: mongoose.Types.ObjectId(data._id) }, { $set: { position: data?.position } }, { new: true, useFindAndModify: false });

        let subscription = await subscriptionModel.updateOne({ _id: mongoose.Types.ObjectId(data._id) }, { $set: data }, { new: true, useFindAndModify: false });

        if (!subscription) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "Subscription updated successfully.", data: subscription };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.getSubCategory = async (id) => {
    try {

        let category = await subCategoryModel.find({ category: mongoose.Types.ObjectId(id), is_deleted: false }).sort({ position: 1 }).lean();
        if (!category) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, data: category, message: "SubCategory fetch successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.getsubSubCategory = async (id) => {
    try {

        let category = await subSubCategoryModel.find({ subCategory: mongoose.Types.ObjectId(id), is_deleted: false }).sort({ position: 1 }).lean();
        if (!category) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, data: category, message: "subSubCategory fetch successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.createAndUpdateSubCategories = async (data) => {
    try {
        let position = data.position


        if (!data._id) {
            let findPosition = await subCategoryModel.findOne({ position: data.position, category: data.category ,is_deleted:false})
            if (findPosition) {
                return { status: -1, message: "Position already exist." };
            }
            let category = await subCategoryModel.create(data);
            if (!category) {
                return { status: -1, message: "Something went wrong, Please try later." };
            }

            return { status: 1, message: "subCategory added successfully." };
        }
        let findPosition = await subCategoryModel.findOne({ position: position, category: data.category })
        if (findPosition) {
            let findPositionById = await subCategoryModel.findById(data?._id)
            let updatePosition = await subCategoryModel.findByIdAndUpdate(findPosition?._id, { $set: { position: findPositionById?.position } }, { new: true })
        }

        let category = await subCategoryModel.updateOne({ _id: mongoose.Types.ObjectId(data._id) }, data, { new: true, useFindAndModify: false });
        if (!category) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "subCategory updated successfully.", data: category };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.createAndUpdatesubSubCategories = async (data) => {
    try {
        let position = data.position

        if (!data._id) {
            let findPosition = await subSubCategoryModel.findOne({ position: data.position, subCategory: data.subCategory, is_deleted:false })
            if (findPosition) {
                return { status: -1, message: "Position already exist." };
            }
            let category = await subSubCategoryModel.create(data);
            if (!category) {
                return { status: -1, message: "Something went wrong, Please try later." };
            }

            return { status: 1, message: "subSubCategory added successfully." };
        }

        let findPosition = await subSubCategoryModel.findOne({ position: position, subCategory: data.subCategory })
        if (findPosition) {
            let findPositionById = await subSubCategoryModel.findById(data?._id)
            let updatePosition = await subSubCategoryModel.findByIdAndUpdate(findPosition?._id, { $set: { position: findPositionById?.position } }, { new: true })
        }

        let category = await subSubCategoryModel.updateOne({ _id: mongoose.Types.ObjectId(data._id) }, data, { new: true, useFindAndModify: false });
        if (!category) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "subSubCategory updated successfully.", data: category };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.getBanner = async () => {
    try {

        let subscription = await bannerModel.find({ is_deleted: false }).lean();
        if (!subscription) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, data: subscription, message: "Banners fetch successfully." };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.createAndUpdateBanner = async (data) => {
    try {

        if (!data._id) {
            let category = await bannerModel.create(data);
            if (!category) {
                return { status: -1, message: "Something went wrong, Please try later." };
            }

            return { status: 1, message: "Banner added successfully." };
        }

        let category = await bannerModel.updateOne({ _id: mongoose.Types.ObjectId(data._id) }, { $set: data }, { new: true, useFindAndModify: false });
        if (!category) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "Banner updated successfully.", data: category };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.createAndUpdateSubAdmin = async (data) => {
    try {

        if (!data._id) {

            let pass = await utils.encryptText(data.password);
            data.passwordInWords = data.password;
            data.password = pass;
            data.role = 2;
            data.token = await authentication.generateToken('30 days');

            let subAdmin = await AdminModel.create(data);
            if (!subAdmin) {
                return { status: -1, message: "Something went wrong, Please try later." };
            }

            return { status: 1, message: "subAdmin added successfully." };
        }
        if (data.passwordUpdated) {
            let pass = await utils.encryptText(data.password);
            data.passwordInWords = data.password;
            data.password = pass;
            data.token = await authentication.generateToken('30 days');
        } else {
            delete data.password
        }
        let subAdmin = await AdminModel.updateOne({ _id: mongoose.Types.ObjectId(data._id) }, { $set: data }, { new: true, useFindAndModify: false });
        if (!subAdmin) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "subAdmin updated successfully.", data: subAdmin };

    } catch (err) {
        throw new Error(err.message);
    }
};

exports.getSubAdmin = async () => {
    try {
        let subAdmins = await AdminModel.find({ role: 2, is_deleted: false }).lean();
        if (!subAdmins) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "subAdmin updated successfully.", data: subAdmins };
    } catch (err) {
        throw new Error(err.message);
    }
};

exports.sendEmail = async (data) => {
    try {
        let subAdminData = await AdminModel.findOne({ email: data.email })
        console.log("sunadmin datatttttttttt", subAdminData.name);
        let subject = "Your subAdmin credentials";
        let link = "http://3.28.96.99:3001/adminpanel/login"
        let html =
            `<p>Dear <strong>${subAdminData.name} </strong>, A new account has been created for you in <span><strong>ASKPERTS</strong></span></p>

             <h3>Use the below credentials for login your account </h3><p><b>Email :</b><span>${data.email}</span></p> <p><b>Password :</b><span>${data.password}</span></p> <p><b>URL :</b><span>${"http://3.28.96.99:3001/adminpanel/login"}</span></p>
             


            
          
             <div style="margin-bottom: 10px;"><strong>________________</strong></div>
            <p style="color: #666;">Regards,</p>
            <p style="color: #666;">ASKPERTS</p>
          </div>`
        // let sendData = {
        //   toEmail: data.email,
        //   subject: subject,
        //   html: html, 
        // };


        await utils.sendgridSendmail(data.email, subject, html, data.password, link);
        // console.log(data.email,data.password,"Send Grid Mailllllllllllllllllllllllllllllllllllllllll")
        return { status: 1, message: "Email Successfully Send to the recipiend ." }
    } catch (err) {
        throw new Error(err.message);
    }
}

exports.getTransactions = async () => {
    try {
        let transactions = await applySubscriptionModel.find().populate("user", "profileImage email firstName lastName");

        if (!transactions) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "Transactions fetch successfully.", data: transactions };
    } catch (err) {
        throw new Error(err.message);
    }
}
exports.getFee = async (data) => {
    try {
        let saveObj = {
            consultant_per_call_fee: data.consultant_per_call_fee,
            modified_at: new Date().getTime()
        }
        let checkFee = await AdminChargeModel.find();
        let transactions = null;
        let trans = new AdminChargeModel(saveObj);

        // transactions = trans;
        console.log("legth :::: ", checkFee.length);
        if (checkFee.length <= 0) {
            trans = await trans.save();
            transactions = trans;
        } else {
            let update = await AdminChargeModel.findByIdAndUpdate(checkFee[0]?._id, saveObj, { new: true });
            transactions = update;
        }


        return { status: 1, message: "Fee fetch successfully.", data: transactions };
    } catch (err) {
        throw new Error(err.message);
    }
}

exports.consultantDone = async (data) => {
    try {
        let page_limit = parseInt(data.page_limit);
        let page_number = parseInt(data.page_number);
        let skip = 0;
        if (page_number > 1) {
            skip = (page_number - 1) * page_limit
        }
        let transactions = await callingModel.find().populate('consultant').populate('user').sort({ _id: -1 }).skip(skip).limit(page_limit);
        return { status: 1, message: "Fee fetch successfully.", data: transactions };
    } catch (err) {
        throw new Error(err.message);
    }
}

exports.addFaq = async (data) => {
    try {
        let { id, panel, question, answer } = data;
        if (!['0', '1', , 0, 1,].includes(panel)) {
            res.status(403).json({ message: "please enter correct type", success: false, data: {} })
            return
        }

        let saveData = {
            type: panel,
            question,
            answer

        }
        let faqData
        if (id) {
            faqData = await faqModel.findByIdAndUpdate(id, saveData, { new: true });
        } else {
            faqData = await faqModel.create(saveData);
        }

        return { status: 1, message: "Faq Added", data: faqData };


        // res.status(200).json({status: 1, message: "faq Added", success: true, data: faqData })


    } catch (err) {
        throw new Error(err.message);
    }
}

exports.addSettingData = async (data) => {
    try {

        let { panel, type, value, email, mobile, country_code } = data;
        if (![0, 1].includes(panel) || ![0, 1, 2, 3, 4].includes(type)) {
            res.status(403).json({ message: "please send correct panel", success: false, data: {} })

        }
        let settingData = await settingModel.findOne({ type: panel });
        let query = {
            type: panel
        }
        if (type == 0) {
            query.termsAndCondtion = value
        }
        else if (type == 1) {
            query.privacyPolicy = value
        }
        else if (type == 2) {
            query.legal = value
        }
        else if (type == 3) {
            query.help = value
        } else {
            query.aboutUs = {
                email, mobile, country_code
            }
        }

        // let settingData = await SettingModel.findOne({})
        if (settingData) {
            let updateData = await settingModel.findByIdAndUpdate(settingData._id, query, { new: true })
            if (updateData) {
                // res.status(200).json({ message: "setting Data Updated", success: true, data: updateData })
                return { status: 1, message: "setting Data updated", data: updateData };


            }
        } else {
            let save_user = await settingModel.create(query)
            save_user.save();
            // res.status(200).json({ message: "setting Data Added", success: true, data: save_user })
            return { status: 1, message: "setting Data Added", data: save_user };



        }


    } catch (err) {
        throw new Error(err.message);
    }
}

exports.getSettingData = async () => {
    try {
        let data = await settingModel.find();

        if (!data) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }
        let userData = data.filter(ele => {
            return ele.type == 0
        })
        let consultantData = data.filter(ele => {
            return ele.type == 1
        })

        return { status: 1, message: "setting Data", data: { userData, consultantData } };



    } catch (err) {
        throw new Error(err.message);
    }
}
exports.getFaq = async () => {
    try {
        let data = await faqModel.find();

        if (!data) {
            return { status: -1, message: "Something went wrong, Please try later." };

        }
        return { status: 1, message: "Faq Data", data: data };


    } catch (err) {
        throw new Error(err.message);
    }
}

exports.deleteFaq = async (data1) => {
    try {
        let id = data1.id
        let data = await faqModel.findByIdAndDelete(id);

        if (!data) {
            return { status: -1, message: "Something went wrong, Please try later." };

        }
        return { status: 1, message: "Faq Deleted", data: data };


    } catch (err) {
        throw new Error(err.message);
    }
}

exports.reportData = async () => {
    try {

        let userData = await UserModel.find({ is_deleted: false, isProfileCompleted: true });
        let userCount = await UserModel.find({ is_deleted: false, isProfileCompleted: true }).count();

        let consultantData = await ConsultModel.find();
        let consultantCount = await ConsultModel.find().count();

        let consulatDone = await callingModel.find().populate('consultant user');
        let consulatDneCount = await callingModel.find().populate('consultant user').count();

        let revenue1 = 0;

        let revenueData = await applySubscriptionModel.find()

        revenueData.map(ele => {
            return revenue1 = ele.amount + revenue1
        })

        let tduration = 0

        for (let i = 0; i < consulatDone.length; i++) {
            const element = consulatDone[i];
            console.log(element.time_duration, "lllllllllllllllllll")

            var a = element.time_duration.split(':'); // split it at the colons

            // minutes are worth 60 seconds. Hours are worth 60 minutes.
            var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);

            //if you want hours
            var minutes = (seconds) / 60;

            console.log(minutes);

            tduration = tduration + minutes

        }
        console.log(tduration)

        // let avg = tduration.minutes()/consulatDneCount
        // console.log(Math.round(avg))

        return {
            status: 1, message: "Report Data", data: {
                userData,
                userCount,
                consultantData,
                consultantCount,
                consulatDone,
                consulatDneCount,
                revenue1,
                tduration: Math.round(tduration) + ' minutes'


            }
        };


    } catch (err) {
        throw new Error(err.message);
    }
}

exports.sendNotification = async (data) => {
    try {

        let userId = JSON.parse(data.userId)
        let consultantId = JSON.parse(data.consultantId)

        let adminData = await AdminModel.findOne()
        let notificationPayload = {
            title: data.title,
            body: data.description
        }

        let deviceToken = [];
        let userData = [];
        userArr = []
        consultArr = []


        userD = []



        if (userId.length > 0) {
            let t = await Promise.all(userId.map(async (id) => {
                let d = await UserModel.findById(id).lean();
                if (d.notify_me == true) {
                    userData.push(d)
                } else {
                    let uIdd = d._id.toString()
                    var index = userId.indexOf(uIdd);
                    if (index !== -1) {
                        userId.splice(index, 1);
                    }
                }
            }))
        }

        if (consultantId.length > 0) {
            let t = await Promise.all(consultantId.map(async (id) => {
                let d = await ConsultModel.findById(id).lean();
                userData.push(d)
            }))
        }

        deviceToken = userData.map(uData => {
            return uData.deviceToken
        })

        let saveData = {
            notification: notificationPayload,
            notificationSendBy: 2,
            status: 3
        }

        saveData['admin'] = adminData._id
        saveData['userId'] = userId
        saveData['consultantId'] = consultantId
        saveData['createdAt'] = new Date().getTime();




        let test = await utils.commonNotificationSend(deviceToken, notificationPayload, saveData)
        let createNotification = new notificationModel(saveData)
        let saveNotification = createNotification.save();

        // res.status(200).json({
        //     message: "notification send successfully",
        //     success: true,
        //     data: {}
        // })
        return {
            status: 1, message: "notification send succesfully", data: saveNotification

        };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.getNotification = async () => {
    try {
        let data = await notificationModel.find({ notificationSendBy: 2 });

        if (!data) {
            return { status: -1, message: "Something went wrong, Please try later." }

        }
        return { status: 1, message: "Faq Data", data: data };


    } catch (err) {
        throw new Error(err.message);
    }
}

exports.filterReportData = async (data) => {
    try {
        let { from, to } = data
        from = new Date(parseInt(from)).setHours(0, 0, 0, 0);
        to = new Date(parseInt(to)).setHours(23, 59, 59, 0);

        let userData = await UserModel.find({ is_deleted: false, isProfileCompleted: true, created_at: { $gte: from, $lte: to } });
        let userCount = await UserModel.find({ is_deleted: false, isProfileCompleted: true, created_at: { $gte: from, $lte: to } }).count();

        let consultantData = await ConsultModel.find({ created_at: { $gte: from, $lte: to } });
        let consultantCount = await ConsultModel.find({ created_at: { $gte: from, $lte: to } }).count();

        let consulatDone = await callingModel.find({ createdAt: { $gte: from, $lte: to } }).populate('consultant user');
        let consulatDneCount = await callingModel.find({ createdAt: { $gte: from, $lte: to } }).populate('consultant user').count();

        let revenue1 = 0;

        let revenueData = await applySubscriptionModel.find({ createdAt: { $gte: from, $lte: to } })

        revenueData.map(ele => {
            return revenue1 = ele.amount + revenue1
        })

        let tduration = 0

        for (let i = 0; i < consulatDone.length; i++) {
            const element = consulatDone[i];
            console.log(element.time_duration, "lllllllllllllllllll")

            var a = element.time_duration.split(':'); // split it at the colons

            // minutes are worth 60 seconds. Hours are worth 60 minutes.
            var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2]);

            //if you want hours
            var minutes = (seconds) / 60;

            console.log(minutes);

            tduration = tduration + minutes

        }
        console.log(tduration)

        return {
            status: 1, message: "Report Data", data: {
                userData,
                userCount,
                consultantData,
                consultantCount,
                consulatDone,
                consulatDneCount,
                revenue1,
                tduration: Math.round(tduration) + ' minutes'

            }
        };


    } catch (error) {
        throw new Error(err.message);


    }
}

exports.filterByCategory = async (data) => {
    try {
        let { categoryId } = data

        let findMenu = await ConsultModel.find({ consultantType: categoryId }).populate('consultantType');
        if (findMenu) {
            return { status: 1, message: "Consult Data", data: findMenu };

        } else {
            return { status: -1, message: "Something went wrong, Please try later." };

        }

    } catch (err) {
        throw new Error(err.message);


    }
}

exports.payout = async () => {
    try {
        let commisionData = await AdminChargeModel.findOne({})
        let commission = commisionData.consultant_per_call_fee
        // console.log(commission);
        let amount = 0
        let total = 0
        let pending = 0
        let transactions = await callingModel.find({}).lean(true).populate('consultant user category category_sub');
        for (let index = 0; index < transactions.length; index++) {
            const element = transactions[index];
            console.log(Number(element.time_duration), commission)

            function getDecimalTime(s) {
                var p = s.split(':');
                return +p[0] + +p[1] + +p[2] / 60;
            }
            amount = commission * getDecimalTime(element.time_duration)
            // amount = amount == null ? 0 : amount
            element.amount = Math.round(amount)
            if (element.paymentStatus == 0) {
                pending = pending + Math.round(amount)
            } else {
                total = total + Math.round(amount)
            }

        }

        if (!transactions) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "Transactions fetch successfully.", data: transactions, pending, total };
    } catch (err) {
        throw new Error(err.message);
    }
}



exports.changePaymentStatus = async (data) => {
    try {

        var { id, paymentStatus } = data
        let updateUser = await callingModel.findOneAndUpdate({ _id: id }, { $set: { paymentStatus } }, { new: true })
        if (!updateUser) {
            return { status: -1, message: "user not blocked" };

        } else {
            if (paymentStatus == 1) {
                return { status: 1, message: "payment paid" };


            } else {
                return { status: 1, message: "payment unpaid" };

            }
        }


    } catch (err) {
        throw new Error(err.message);


    }
}

// exports.payout = async () => {
//     try {
//         let commisionData = await AdminChargeModel.findOne({})
//         let commission = commisionData.consultant_per_call_fee
//         // console.log(commission);
//         let amount = 0

//         let transactions = await callingModel.find({}).lean(true).populate('consultant user category category_sub');
//         for (let index = 0; index < transactions.length; index++) {
//             const element = transactions[index];
//             console.log(Number(element.time_duration), commission)

//             function getDecimalTime(s) {
//                 var p = s.split(':');
//                 return +p[0] + +p[1]+ +p[2] / 60;
//             }
//             amount = commission * getDecimalTime(element.time_duration)
//             // amount = amount == null ? 0 : amount
//             element.amount = amount

//         }

//           if (!transactions) {
//             return { status: -1, message: "Something went wrong, Please try later." };
//         }

//         return { status: 1, message: "Transactions fetch successfully.", data: transactions };
//     } catch (err) {
//         throw new Error(err.message);
//     }
// }

exports.filterPayout = async (data) => {
    try {
        let { from, to } = data
        from = new Date(parseInt(from)).setHours(0, 0, 0, 0);
        to = new Date(parseInt(to)).setHours(23, 59, 59, 0);

        let commisionData = await AdminChargeModel.findOne({})
        let commission = commisionData.consultant_per_call_fee
        // console.log(commission);
        let amount = 0

        let transactions = await callingModel.find({ createdAt: { $gte: from, $lte: to } }).lean(true).populate('consultant user category category_sub');
        for (let index = 0; index < transactions.length; index++) {
            const element = transactions[index];
            console.log(Number(element.time_duration), commission)

            function getDecimalTime(s) {
                var p = s.split(':');
                return +p[0] + +p[1] + +p[2] / 60;
            }
            amount = commission * getDecimalTime(element.time_duration)
            // amount = amount == null ? 0 : amount
            element.amount = amount

        }

        if (!transactions) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "Transactions fetch successfully.", data: transactions };


    } catch (error) {
        throw new Error(err.message);


    }
}




exports.getCommision = async () => {
    try {
        let data = await AdminChargeModel.findOne({});

        if (!data) {
            return { status: -1, message: "Something went wrong, Please try later." }

        }
        return { status: 1, message: "commision data", data: data };


    } catch (err) {
        throw new Error(err.message);
    }
}

exports.changePasswordNew = async (user, data) => {
    try {
        let userData = user;
        console.log(userData, "ghjk");
        let {
            password,
            newPassword
        } = data;


        if (!userData.password) {

            return { status: -1, message: "First create your password." };


        }
        var pass = await bcrypt.hash(data.newPassword, 10);

        console.log(userData.password);

        // let compair = password == userData.password;
        let compair = await utils.compare(password, userData.password);


        if (!compair) {
            return { status: -1, message: "Plz Enter correct old password" };

        }

        let result = await AdminModel.findOneAndUpdate({
            _id: userData._id
        }, {

            $set: {
                password: pass,

            }
        }, {
            new: true
        })


        if (!result) {
            return { status: -1, message: "Something went wrong" };

        }

        return { status: 1, message: "password changed successfully" };


    } catch (err) {
        throw new Error(err.message);

    }

}

exports.createAndUpdateCommissions = async (data) => {
    try {
        let {category, subCategory, subSubCategory, commission } = data;
        if(!category || category == ""){
            return { status: -1, message: "Category is required" };
        }
        if(!commission || commission == ""){
            return { status: -1, message: "Commission is required" };
        }
        if (!data._id) {

            let commision = await CommissionModel.create(data);
            if (!commision) {
                return { status: -1, message: "Something went wrong, Please try later." };
            }

            return { status: 1, message: "Commision added successfully." };
        }

        let commision = await CommissionModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(data._id) }, { $set: data }, { new: true, useFindAndModify: false });

        if (!commision) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "Commision updated successfully.", data: commision };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.getCommission = async (data) => {
    try {
        let {category, subCategory, subSubCategory } = data;
        
        let findData = { 
            isDeleted: false,
        }
        if(category){
            findData.category = category
        }
        if(subCategory){
            findData.subCategory = subCategory
        }
        if(subSubCategory){
            findData.subSubCategory = subSubCategory
        }

        let commision = await CommissionModel.find(findData)
            .populate("category", "categoryName image categoryNameArabic")
            .populate("subCategory", "subCategoryName image subCategoryNameArabic")
            .populate("subSubCategory", "name image nameArabic").lean();

        if (!commision) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }

        return { status: 1, message: "Commision fetched successfully.", data: commision };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.blockCommissions = async (data) => {
    try {
        let { _id, isBlocked } = data;
        if(!_id || _id == ""){
            return { status: -1, message: "_id is required" };
        }
        let commision = await CommissionModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(data._id) }, { $set: { isBlocked: isBlocked  } }, { new: true, useFindAndModify: false });

        if (!commision) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }
        let message = (isBlocked == true) ? "Commision blocked successfully." : "Commision unblocked successfully."

        return { status: 1, message: message, data: commision };

    } catch (err) {
        throw new Error(err.message);
    }
}

exports.deleteCommissions = async (data) => {
    try {
        let { _id } = data;
        if(!_id || _id == ""){
            return { status: -1, message: "_id is required" };
        }
        let commision = await CommissionModel.findOneAndUpdate({ _id: mongoose.Types.ObjectId(data._id) }, { $set: { isDeleted: true  } }, { new: true, useFindAndModify: false });

        if (!commision) {
            return { status: -1, message: "Something went wrong, Please try later." };
        }
        let message =  "Commision deleted successfully."

        return { status: 1, message: message, data: commision };

    } catch (err) {
        throw new Error(err.message);
    }
}



