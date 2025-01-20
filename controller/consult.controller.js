const { applySubscriptionModel } = require('../models/applySubscriptionModel');
const { callingModel } = require('../models/callingModel');
const { categoryModel } = require('../models/categoryModel');
const { ConsultModel } = require('../models/consultModel');
const { subCategoryModel } = require('../models/subCategoryModel');
const { subSubCategoryModel } = require('../models/subSubCategoryModel');
const consultService = require('../services/consult.services');
var csc = require('country-state-city').default // Returns an array of country names.
const { validationResult } = require('express-validator');

exports.sendCountries = async (req, res) => {
    try {
        countrys = await csc.getAllCountries();
        res.status(200).json({ response: countrys, message: "All Countries Fetch" });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.registerUser = async (req, res) => {
    try {

        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new Error(errors.array()[0].msg);
        }

        let userData = await consultService.registerUser(req.body,req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        } 
        res.status(200).json({ response: userData, messsage: "Profile Created Successfully" });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.saveDocuments = async (req,res) => {
    try {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new Error(errors.array()[0].msg);
        }

        let userData = await consultService.saveDocuments(req.body,req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        } 
        res.status(200).json({ response: userData, messsage: "Document updated successfully" });
    }catch(error){
        res.status(403).json({ message: error.message });
    }
}

exports.saveBankDetails = async (req,res) => {
    try {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new Error(errors.array()[0].msg);
        }

        let userData = await consultService.saveBankDetails(req.body,req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        } 
        res.status(200).json({ response: userData, messsage: "Document updated successfully" });
    }catch(error){
        res.status(403).json({ message: error.message });
    }
}


exports.loginUser = async (req, res) => {
    try {
        let userData = await consultService.loginUser(req);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        let validTo = '30 days';
        let user = await consultService.saveToken(userData.data, validTo);
        if (user.status == -1) {
            throw new Error(user.message);
        }
        res.status(200).json({ response: user.data, messsage: "successfully Login" });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.sendResendOtp = async (req, res) => {
    try {
        let userData = await consultService.sendResendOtp(req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.verifyOtp = async (req, res) => {
    try {
        let userData = await consultService.verifyOtp(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data,message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getImageLink = async (req, res) => {
    try {
        if (req.files) {
            if (req.files.image != undefined || req.files.image != null) {
                req.body.image = req.files.image[0].location ? req.files.image[0].location : ''
            }
        }

        if (!req.body.image || req.body.image == '') {
            throw new Error("Please upload the image");
        }
        res.status(200).json({ data: req.body.image, message: "Image uploaded successfully" });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getCategories = async (req, res) => {
    try {

        let categories = await consultService.getCategories();
        if (categories.status == -1) {
            throw new Error(categories.message);
        } 
        res.status(200).json({ response: categories, messsage: "Categories fetch Successfully" });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getAllCatSubCatSubSubCate = async (req, res) => {
    try {
            const categories = await await categoryModel.find({ is_deleted: false }, { image: 1, categoryName: 1 ,categoryNameArabic:1}).sort({ position: 1 }).lean();
        
            for (const category of categories) {
                const subCategories = await subCategoryModel.find({ category: category._id, is_deleted: false }).lean();
        
                for (const subCategory of subCategories) {
                const subSubCategories = await subSubCategoryModel.find({ subCategory: subCategory._id, is_deleted: false }).lean();
                subCategory.subSubCategories = subSubCategories;
                }
        
                category.subCategories = subCategories;
            }
            // res.json(categories);
        res.status(200).json({ response: categories, message: "Categor list fetch successfully." });

        } catch (error) {
            res.status(500).send(error.message);
        }
}

exports.changeUserStatus = async (req, res) => {
    try {
        let userData = await consultService.changeUserStatus(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data,message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getProfile = async(req,res) =>{
    try{ 
        const user = await ConsultModel.findOne({ _id : req.userData._id },{ _id : 1,profileImage : 1, firstName : 1, lastName : 1, email : 1, gender: 1, dateOfBirth : 1, country : 1, nationality: 1, mobileNumber: 1, countryCode: 1, isProfileCompleted : 1, isDocumentUploaded : 1, isBankDetailsUploaded : 1, documents : 1, otherDocuments :1, isVerified: 1, address : 1, consultantType : 1, consultantSubType : 1, consultantSubSubType: 1, experience : 1, language : 1, accountName : 1, accountName :1, accountNumber : 1,  ibanNumber : 1, on_duty : 1, notify_me : 1, created_at : 1 } ).populate('consultantType consultantSubType consultantSubSubType')
        const totalCalling = await callingModel.countDocuments({consultant: user._id,status: 3});

        const userObject = user.toObject();

        userObject.totalCalling = totalCalling;
        // let response = {
        //     _id:req.userData._id,
        //     profileImage:req.userData.profileImage,
        //     firstName: req.userData.firstName,
        //     lastName: req.userData.lastName,
        //     email:req.userData.email,
        //     gender:req.userData.gender ,
        //     dateOfBirth:req.userData.dateOfBirth ,
        //     country:req.userData.country,
        //     nationality:req.userData.nationality ,
        //     mobileNumber:req.userData.mobileNumber ,
        //     countryCode:req.userData.countryCode ,
        //     isProfileCompleted:req.userData.isProfileCompleted ,
        //     isDocumentUploaded:req.userData.isDocumentUploaded,
        //     isBankDetailsUploaded:req.userData.isBankDetailsUploaded,
        //     documents:req.userData.documents,
        //     otherDocuments: req.userData.otherDocuments,
        //     isVerified:req.userData.isVerified,       
        //     address:req.userData.address,
        //     consultantType:req.userData.consultantType,
        //     consultantSubType:req.userData.consultantSubType,
        //     consultantSubSubType :req.userData.consultantSubSubType,
        //     experience:req.userData.experience,
        //     language:req.userData.language,
        //     accountName:req.userData.accountName,
        //     accountNumber:req.userData.accountNumber,
        //     ibanNumber:req.userData.ibanNumber,
        //     on_duty:req.userData.on_duty,
        //     notify_me:req.userData.notify_me,
        //     created_at:req.userData.created_at
        // };
        
        res.status(200).json({ response: userObject, message: "Get profile Details" });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

exports.updateProfile = async (req, res) => {
    try {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new Error(errors.array()[0].msg);
        }
        let userData = await consultService.updateProfile(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data,message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.changeDuty = async (req, res) => {
    try {
        let userData = await consultService.changeDuty(req.body.onDuty, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data,message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.notifyMe = async (req,res) => {
    try {
        let userData = await consultService.notifyMe(req.body.notify_me, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data,message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

exports.deleteProfile = async (req, res) => {
    try {
        let userData = await consultService.deleteProfile(req.params.id, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data,message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getServices = async (req,res) => {
    try{
        let request = await consultService.getServices(req.userData);
        if(request.status === -1){
            throw new Error(request.message);
        }
        res.status(200).json({ response: request.data, message: request.message });
    }catch (err) {
        res.status(403).json({message: err.message});
    }
};

exports.updateService = async (req,res) => {
    try{
        let request = await consultService.updateService(req.body,req.userData);
        if(request.status === -1){
            throw new Error(request.message);
        }
        res.status(200).json({ response: request.data, message: request.message });
    }catch (err) {
        res.status(403).json({message: err.message});
    }
};

exports.giveCall = async (req,res) => {
    try{
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new Error(errors.array()[0].msg);
        }
        let request = await consultService.giveCall(req.body);
        if(request.status === -1){
            throw new Error(request.message);
        }
        res.status(200).json({ response: request.data, message: request.message });
    }catch (err) {
        res.status(403).json({message: err.message});
    }
};
exports.updateCallingStatus = async (req,res) => {
    try{
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new Error(errors.array()[0].msg);
        }
        let request = await consultService.updateCallingStatus(req.body, req.userData);
        if(request.status === -1){
            throw new Error(request.message);
        }
        res.status(200).json({ response: request.data, message: request.message });
    }catch (err) {
        res.status(403).json({message: err.message});
    }
};



exports.endCall = async (req,res) => {
    try{
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new Error(errors.array()[0].msg);
        }
        let request = await consultService.endCall(req.body);
        if(request.status === -1){
            throw new Error(request.message);
        }
        res.status(200).json({ response: request.data, message: request.message });
    }catch (err) {
        res.status(403).json({message: err.message});
    }
};

exports.getServiceDetails = async (req,res) => {
    try{
        
        let request = await consultService.getServiceDetail(req.params.id);
        if(request.status === -1){
            throw new Error(request.message);
        }
        res.status(200).json({ response: request.data, message: request.message });
    }catch (err) {
        res.status(403).json({message: err.message});
    }
};


exports.getTemplates = async (req, res) => {
    try {
        let templates = await consultService.getTemplates(req.body);
        if (templates == -1) {
            throw new Error(templates.message);
        }
        res.status(200).send({ url: templates.data });
    } catch (err){
        res.status(403).json({ message: err.message });
    }
}

exports.categoryGet = async (req,res) => {
    try{
        let categoryList = await consultService.categoryGet(req.userData,req.body);
        if (categoryList.status == -1) {
            throw new Error(userData.message);
        }
        res.status(201).json({ response: categoryList.data,message: categoryList.message });
    }catch(error){
        res.status(403).json({ message: error.message });
    }
}
exports.categorySubGet = async (req,res) => {
    try{
        let categoryList = await consultService.categorySubGet(req.userData,req.params.id);
        if (categoryList.status == -1) {
            throw new Error(userData.message);
        }
        res.status(201).json({ response: categoryList.data,message: categoryList.message });
    }catch(error){
        res.status(403).json({ message: error.message });
    }
}

exports.categorySubSubGet = async (req,res) => {
    try{
        let categoryList = await consultService.categorySubSubGet(req.userData,req.params.id);
        if (categoryList.status == -1) {
            throw new Error(userData.message);
        }
        res.status(201).json({ response: categoryList.data,message: categoryList.message });
    }catch(error){
        res.status(403).json({ message: error.message });
    }
}

exports.serviceRatingGet = async (req,res) => {
    try{
        let bookConsult = await consultService.serviceRatingGet(req.userData,req.body);
        if (bookConsult.status == -1) {
            throw new Error(userData.message);
        }
        res.status(201).json({ response: bookConsult.data,message: bookConsult.message });
    }catch(error){
        res.status(403).json({ message: error.message });
    }
}

exports.getFaq = async (req, res) => {
    try {
        let user = await consultService.getFaq();
        if (user.status === -1) {
            throw new Error(user.message);
        }
        res.status(200).json({ response: user.data, message: user.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.deleteConsult = async (req, res) => {
    try {
        let user = await consultService.deleteConsult(req.userData);
        if (user.status === -1) {
            throw new Error(user.message);
        }
        res.status(200).json({ response: user.data, message: user.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getSettingData = async (req, res) => {
    try {
        let user = await consultService.getSettingData(req);
        if (user.status === -1) {
            throw new Error(user.message);
        }
        res.status(200).send(user.data);
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.notificationList = async (req, res) => {
    try {
        let user = await consultService.notificationList(req.userData);
        if (user.status === -1) {
            throw new Error(user.message);
        }
        // res.status(200).send( user.data);
        res.status(200).json({ message: user.message, response: user.data });

    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}
exports.deleteNotification = async (req, res) => {
    try {
        let user = await consultService.deleteNotification(req.body);
        if (user.status === -1) {
            throw new Error(user.message);
        }
        res.status(200).json({ message: user.message, response: user.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.readAllNotification = async (req, res) => {
    try {
        let user = await consultService.readAllNotification(req.body, req.userData);
        if (user.status === -1) {
            throw new Error(user.message);
        }
        res.status(200).json({ message: user.message, response: user.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.editProfile = async (req, res) => {
    try {
        let user = await consultService.editProfile(req.userData, req.body);
        if (user.status === -1) {
            throw new Error(user.message);
        }
        res.status(200).json({ response: user.data, message: user.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.pastHistory = async(req,res)=>{
    try{
       let transactions = await consultService.pastHistory(req.userData, req.body);
        if(transactions.status === -1){
            throw new Error(transactions.message);
        }
        res.status(200).json({ response: transactions.data, message: transactions.message });
    }catch (err){
        res.status(403).json({message: err.message});
    }
}

exports.paymentList = async(req,res)=>{
    try{
       let transactions = await consultService.paymentList(req.body);
        if(transactions.status === -1){
            throw new Error(transactions.message);
        }
        res.status(200).json({ response: transactions.data, message: transactions.message });
    }catch (err){
        res.status(403).json({message: err.message});
    }
}

exports.getBanner = async(req,res)=>{
    try{
       let transactions = await consultService.getBanner();
        if(transactions.status === -1){
            throw new Error(transactions.message);
        }
        res.status(200).json({ response: transactions.data, message: transactions.message });
    }catch (err){
        res.status(403).json({message: err.message});
    }
}

exports.getPrice = async(req,res)=>{
    try{
       let {callingId} = req.query;
       const subcription = await callingModel.findOne({_id: callingId})
            .populate("category", "categoryName categoryNameArabic")
            .populate("category_sub", "subCategoryName subCategoryNameArabic")
            .populate("category_sub_sub", "name nameArabic")
            .sort({ createdAt: -1 });
       if(subcription){
        const price = await applySubscriptionModel.findById(subcription.subscriptionId).select("amount numberOfCalls");
        let amountForCommission = (Number(price.amount)/ Number(price.numberOfCalls))
        let commission = subcription ? subcription.commission : 0;
        // let commissionAmount = ((Number(commission) * Number(price.amount)) / 100)
        // price.amount = (Number(price.amount) - Number(commissionAmount));
        let commissionAmount = ((Number(commission) * Number(amountForCommission)) / 100)
        amountForCommission = (Number(amountForCommission) - Number(commissionAmount));

        let dataToSend = {
            _id: price._id,
            amount: amountForCommission,
            category: subcription.category,
            subCategory: subcription.category_sub,
            subSubcategory: subcription.category_sub_sub
        }
        return res.status(200).json({ response: dataToSend, message: "Amount fetched successfully!" });
       }
       return res.status(501).json({ response: "price", message: "Amount not found!" });
        
    }catch (err){
        res.status(403).json({message: err.message});
    }
}