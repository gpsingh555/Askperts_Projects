const userService = require("../services/user.services");
var csc = require('country-state-city').default // Returns an array of country names.
const { validationResult } = require('express-validator');
const { applySubscriptionModel } = require("../models/applySubscriptionModel");
const Joi = require('joi');
var axios = require('axios');

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

        let userData = await userService.registerUser(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData, messsage: "Profile Created Successfully" });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};


exports.loginUser = async (req, res) => {
    try {
        let userData = await userService.loginUser(req);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        let validTo = '30 days';
        let user = await userService.saveToken(userData.data, validTo);
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
        let userData = await userService.sendResendOtp(req.userData);
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
        let userData = await userService.verifyOtp(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.changeUserStatus = async (req, res) => {
    try {
        let userData = await userService.changeUserStatus(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.notifyMe = async (req, res) => {
    try {
        let userData = await userService.notifyMe(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
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

exports.getProfile = async (req, res) => {
    try {
        let response = {
            _id: req.userData._id,
            profileImage: req.userData.profileImage,
            firstName: req.userData.firstName,
            lastName: req.userData.lastName,
            email: req.userData.email,
            gender: req.userData.gender,
            dateOfBirth: req.userData.dateOfBirth,
            country: req.userData.country,
            nationality: req.userData.nationality,
            mobileNumber: req.userData.mobileNumber,
            countryCode: req.userData.countryCode,
            deviceType: req.userData.deviceType,
            deviceToken: req.userData.deviceToken,
            active: req.userData.active,
            created_at: req.userData.created_at,
            modified_at: req.userData.modified_at,
            refered_key: req.userData?.refered_key
        };

        let subscription = await applySubscriptionModel.findOne({
            user: req.userData._id
        }).sort({ _id: -1 });
        if (subscription) {
            response.subscription = subscription;
        }

        res.status(200).json({ response: response, message: "Get profile Details" });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.deleteProfile = async (req, res) => {
    try {
        let userData = await userService.deleteProfile(req.params.id, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        let category = await userService.getCategories();
        if (category.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: category.data, message: category.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getCategoryById = async (req, res) => {
    try {
        let category = await userService.getCategoryById(req.params.id);
        if (category.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: category.data, message: category.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.searchCategoryAndSubCategory = async (req, res) => {
    try {
        let category = await userService.searchCategoryAndSubCategory(req.body.search, req.userData);
        if (category.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: category.data, message: category.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getSubCategory = async (req, res) => {
    try {
        let category = await userService.getSubCategory(req.params.id);
        if (category.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: category.data, message: category.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getSubscription = async (req, res) => {
    try {
        let category = await userService.getSubscription();
        if (category.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: category.data, message: category.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getBanner = async (req, res) => {
    try {
        let banner = await userService.getBanner();
        if (banner.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: banner.data, message: banner.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.searchHistory = async (req, res) => {
    try {
        let history = await userService.searchHistory(req.userData);
        if (history.status === -1) {
            throw new Error(history.message);
        }
        res.status(200).json({ response: history.data, message: history.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.createHistory = async (req, res) => {
    try {
        let history = await userService.createHistory(req.userData, req.body.search);
        if (history.status === -1) {
            throw new Error(history.message);
        }
        res.status(200).json({ response: history.data, message: history.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.deleteAllHistory = async (req, res) => {
    try {
        let history = await userService.deleteAllHistory(req.userData._id);
        if (history.status === -1) {
            throw new Error(history.message);
        }
        res.status(200).json({ response: history.data, message: history.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.deleteHistory = async (req, res) => {
    try {
        let history = await userService.deleteHistory(req.params.id);
        if (history.status === -1) {
            throw new Error(history.message);
        }
        res.status(200).json({ response: history.data, message: history.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.applySubscription = async (req, res) => {
    try {
        let subscription = await userService.applySubscription(req.userData, req.body);
        if (subscription.status === -1) {
            throw new Error(subscription.message);
        }
        res.status(200).json({ response: subscription.data, message: subscription.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.updateSubscription = async (req, res) => {
    try {
        let subscription = await userService.updateSubscription(req.userData, req.body);
        if (subscription.status === -1) {
            throw new Error(subscription.message);
        }
        res.status(200).json({ response: subscription.data, message: subscription.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.availableConsultant = async (req, res) => {
    try {
        let request = await userService.availableConsultant(req.userData, req.body);
        if (request.status === -1) {
            throw new Error(request.message);
        }
        res.status(200).json({ response: request.data, message: request.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.sendRequest = async (req, res) => {
    try {
        let request = await userService.sendRequest(req.userData, req.body);
        if (request.status === -1) {
            throw new Error(request.message);
        }
        res.status(200).json({ response: request.data, message: request.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getServices = async (req, res) => {
    try {
        let request = await userService.getServices(req.userData);
        if (request.status === -1) {
            throw new Error(request.message);
        }
        res.status(200).json({ response: request.data, message: request.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.updateCallNumberWhileCall = async (req, res) => {
    try {
        let bookConsult = await userService.updateCallNumberWhileCall(req.body);
        if (bookConsult.status == -1) {
            throw new Error(userData.message);
        }
        res.status(201).json({ response: bookConsult.data, message: bookConsult.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}
exports.serviceRating = async (req, res) => {
    try {
        let bookConsult = await userService.serviceRating(req.userData, req.body);
        if (bookConsult.status == -1) {
            throw new Error(userData.message);
        }
        res.status(201).json({ response: bookConsult.data, message: bookConsult.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}
exports.serviceRatingGet = async (req, res) => {
    try {
        let bookConsult = await userService.serviceRatingGet(req.userData, req.body);
        if (bookConsult.status == -1) {
            throw new Error(userData.message);
        }
        res.status(201).json({ response: bookConsult.data, message: bookConsult.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}
exports.categoryGet = async (req, res) => {
    try {
        let bookConsult = await userService.categoryGet(req.userData, req.body);
        if (bookConsult.status == -1) {
            throw new Error(userData.message);
        }
        res.status(201).json({ response: bookConsult.data, message: bookConsult.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}
exports.categorySubGet = async (req, res) => {
    try {
        let bookConsult = await userService.categorySubGet(req.userData, req.params.id);
        if (bookConsult.status == -1) {
            throw new Error(userData.message);
        }
        res.status(201).json({ response: bookConsult.data, message: bookConsult.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

exports.categorySubSubGet = async (req, res) => {
    try {
        let bookConsult = await userService.categorySubSubGet(req.userData, req.params.id);
        if (bookConsult.status == -1) {
            throw new Error(userData.message);
        }
        res.status(201).json({ response: bookConsult.data, message: bookConsult.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
}

exports.updateService = async (req, res) => {
    try {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new Error(errors.array()[0].msg);
        }
        let request = await userService.updateService(req.body);
        if (request.status === -1) {
            throw new Error(request.message);
        }
        res.status(200).json({ response: request.data, message: request.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.giveCall = async (req, res) => {
    try {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new Error(errors.array()[0].msg);
        }
        let request = await userService.giveCall(req.body);
        if (request.status === -1) {
            throw new Error(request.message);
        }
        res.status(200).json({ response: request.data, message: request.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};
exports.updateCallingStatus = async (req, res) => {
    try {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new Error(errors.array()[0].msg);
        }
        let request = await userService.updateCallingStatus(req.body);
        if (request.status === -1) {
            throw new Error(request.message);
        }
        res.status(200).json({ response: request.data, message: request.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.endCall = async (req, res) => {
    try {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new Error(errors.array()[0].msg);
        }
        let request = await userService.endCall(req.body);
        if (request.status === -1) {
            throw new Error(request.message);
        }
        res.status(200).json({ response: request.data, message: request.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getServiceDetails = async (req, res) => {
    try {

        let request = await userService.getServiceDetail(req.params.id);
        if (request.status === -1) {
            throw new Error(request.message);
        }
        res.status(200).json({ response: request.data, message: request.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};


exports.getTemplates = async (req, res) => {
    try {
        let templates = await userService.getTemplates(req.body);
        if (templates == -1) {
            throw new Error(templates.message);
        }
        res.status(200).send({ url: templates.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.callHistory = async (req, res) => {
    try {
        let callHistory = await userService.callHistory(req.userData);
        if (callHistory.status === -1) {
            throw new Error(callHistory.message);
        }
        res.status(200).json({ response: callHistory.data, message: callHistory.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}


exports.sendRefferalInviatation = async (req, res) => {
    try {
        let userData = await userService.sendRefferalInviatation(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};
exports.callHistoryUpdate = async (req, res) => {
    try {
        console.log("history ............")
        const schema = Joi.object().keys({
            _id: Joi.string().min(24).max(24).required(),
            service_id: Joi.string().required(),
            call_id: Joi.string().required(),
            no_of_calls: Joi.string().required(),
            time_duration: Joi.string().required(),
            call_start_at: Joi.string().required(),
            call_mode: Joi.string(),

        })

        let da = await schema.validateAsync(req.body);
        let userData = await userService.callHistoryUpdate(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};
exports.callHistoryRating = async (req, res) => {
    try {
        console.log("history ............")
        const schema = Joi.object().keys({
            _id: Joi.string().min(24).max(24).required(),
            call_rating: Joi.string().required(),
            call_review: Joi.string().required(),

        })

        let da = await schema.validateAsync(req.body);
        let userData = await userService.callHistoryRating(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.referralUser = async (req, res) => {
    try {
        // console.log("history ............")
        const schema = Joi.object().keys({
            refered_key: Joi.string().required(),
            _id: Joi.string().required(),

        })

        let da = await schema.validateAsync(req.body);
        let userData = await userService.referralUser(req.body, req.userData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (error) {
        res.status(403).json({ message: error.message });
    }
};

exports.getSubscriptionList = async (req, res) => {
    try {
        let subscriptionList = await userService.getSubscriptionList(req.userData);
        if (subscriptionList.status === -1) {
            throw new Error(transactions.message);
        }
        res.status(200).json({ response: subscriptionList.data, message: subscriptionList.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}
exports.deleteUser = async (req, res) => {
    try {
        let user = await userService.deleteUser(req.userData);
        if (user.status === -1) {
            throw new Error(user.message);
        }
        res.status(200).json({ response: user.data, message: user.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.editProfile = async (req, res) => {
    try {
        let user = await userService.editProfile(req.userData, req.body);
        if (user.status === -1) {
            throw new Error(user.message);
        }
        res.status(200).json({ response: user.data, message: user.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}
exports.getFaq = async (req, res) => {
    try {
        let user = await userService.getFaq();
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
        let user = await userService.getSettingData(req);
        if (user.status === -1) {
            throw new Error(user.message);
        }
        res.status(200).send(user.data);
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}
exports.getSettingData1 = async(req,res)=>{
    try {
     let data = await userService.getSettingData1(req)
     if(data.status == -1){
         throw new Error(data.message)
     }
     res.status(200).json({response:data.data,message:data.message})
    } catch (err) {
     res.status(403).json({message:err.message})
    }
 }

exports.notificationList = async (req, res) => {
    try {
        let user = await userService.notificationList(req.userData);
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
        let user = await userService.deleteNotification(req.body);
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
        let user = await userService.readAllNotification(req.body, req.userData);
        if (user.status === -1) {
            throw new Error(user.message);
        }
        res.status(200).json({ message: user.message, response: user.data });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}


exports.referAndEarn = async (req, res) => {
    try {
        let referKey = req.body.referalKey

        var data = JSON.stringify({ "dynamicLinkInfo": { "domainUriPrefix": "https://askpertuser.page.link", "link": "https://askpertuser.page.link/welcome?refered_key=" + referKey, "androidInfo": { "androidPackageName": "com.consultantuser" }, "iosInfo": { "iosBundleId": "com.consultUser", "iosAppStoreId": "1234" } } });

        var config = {
            method: 'post',
            url: 'https://firebasedynamiclinks.googleapis.com/v1/shortLinks?key=AIzaSyDhhNIyp8JccNP4l3aW8ByK7elPz8hR4UQ',
            headers: {
                'Content-Type': 'application/json'
            },
            data: data
        };

        axios(config)
            .then(function (response) {
                console.log(response.data);
                res.status(200).json({ message: "Dynamic link", response: response.data });

            })
            .catch(function (error) {
                console.log(error);
            });
    } catch (error) {
        res.status(403).json({ message: err.message });
    }

}



