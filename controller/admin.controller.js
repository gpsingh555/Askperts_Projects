const adminService = require('../services/admin.services');
const { validationResult } = require('express-validator');
const Joi = require('joi');
exports.createAdminReq = async (req, res) => {
    try {
        let userData = await adminService.createAdmin(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: "Login Successfully" });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}
exports.loginAdmin = async (req, res) => {
    try {
        let userData = await adminService.loginAdmin(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        if (userData.status == 0) {
            let userData = await adminService.createAdmin(req.body);
            if (userData.status == -1) {
                throw new Error(userData.message);
            }
            res.status(200).json({ response: userData.data, message: "Login Successfully" });
        }
        res.status(200).json({ response: userData.data, message: "Login Successfully" });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.logoutAdmin = async (req, res) => {
    try {
        let userData = await adminService.logoutAdmin(req.adminData);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: "Logout Successfully" });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.forgetPassword = async (req, res) => {
    try {
        let userData = await adminService.forgetPassword(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        let userData = await adminService.resetPassword(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        if (userData.status == 0) {
            return res.status(401).json({ message: userData.message });
        }
        res.status(200).json({ message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.changePassword = async (req, res) => {
    try {
        console.log("d", req.body)
        let userData = await adminService.changePassword(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: "Login Successfully" });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.userManagement = async (req, res) => {
    try {
        let userData = await adminService.userManagement(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.blockUser = async (req, res) => {
    try {

        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new Error(errors.array()[0].msg);
        }

        let userData = await adminService.blockUser(req.params.id, req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: null, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.consultantManagement = async (req, res) => {
    try {
        let userData = await adminService.consultantManagement(req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.acceptOrRejectConsultant = async (req, res) => {
    try {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new Error(errors.array()[0].msg);
        }

        let userData = await adminService.acceptOrRejectConsultant(req.params.id, req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: null, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.deleteConsultant = async (req, res) => {
    try {
        let errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new Error(errors.array()[0].msg);
        }

        let userData = await adminService.deleteConsultant(req.params.id, req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        res.status(200).json({ response: userData.data, message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.addtemplate = async (req, res) => {
    try {
        let template = await adminService.addtemplate(req.body);
        if (template.status === -1) {
            throw new Error(template.message);
        }
        res.status(200).json({ message: template.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getCategories = async (req, res) => {
    try {
        let category = await adminService.getCategories();
        if (category.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: category.data, message: category.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.createAndUpdateCategories = async (req, res) => {
    try {
        let category = await adminService.createAndUpdateCategories(req.body);
        if (category.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: category.data, message: category.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getSubCategory = async (req, res) => {
    try {
        let category = await adminService.getSubCategory(req.params.id);
        if (category.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: category.data, message: category.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getsubSubCategory = async (req, res) => {
    try {
        let category = await adminService.getsubSubCategory(req.params.id);
        if (category.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: category.data, message: category.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}


exports.createAndUpdateSubCategories = async (req, res) => {
    try {
        let category = await adminService.createAndUpdateSubCategories(req.body);
        if (category.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: category.data, message: category.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.createAndUpdatesubSubCategories = async (req, res) => {
    try {
        let category = await adminService.createAndUpdatesubSubCategories(req.body);
        if (category.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: category.data, message: category.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getSubscription = async (req, res) => {
    try {
        let category = await adminService.getSubscription();
        if (category.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: category.data, message: category.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.createAndUpdateSubscription = async (req, res) => {
    try {
        let category = await adminService.createAndUpdateSubscription(req.body);
        if (category.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: category.data, message: category.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getBanner = async (req, res) => {
    try {
        let banner = await adminService.getBanner();
        if (banner.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: banner.data, message: banner.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.createAndUpdateBanner = async (req, res) => {
    try {
        let banner = await adminService.createAndUpdateBanner(req.body);
        if (banner.status === -1) {
            throw new Error(banner.message);
        }
        res.status(200).json({ response: banner.data, message: banner.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

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

exports.createAndUpdateSubAdmin = async (req, res) => {
    try {
        let subAdmin = await adminService.createAndUpdateSubAdmin(req.body);
        if (subAdmin.status === -1) {
            throw new Error(subAdmin.message);
        }
        res.status(200).json({ response: subAdmin.data, message: subAdmin.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getSubAdmin = async (req, res) => {
    try {
        let subAdmin = await adminService.getSubAdmin();
        if (subAdmin.status === -1) {
            throw new Error(subAdmin.message);
        }
        res.status(200).json({ response: subAdmin.data, message: subAdmin.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.sendEmail = async (req, res) => {
    try {
        let link="http://3.28.96.99:3001/adminpanel/login"

        let subAdmin = await adminService.sendEmail(req.body);
        if (subAdmin.status === -1) {
            throw new Error(subAdmin.message);
        }
        res.status(200).json({ response: subAdmin.data, message: subAdmin.message ,url:link});
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getTransactions = async (req, res) => {
    try {
        let transactions = await adminService.getTransactions();
        if (transactions.status === -1) {
            throw new Error(transactions.message);
        }
        res.status(200).json({ response: transactions.data, message: transactions.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getFee = async (req, res) => {
    try {
        let transactions = await adminService.getFee(req.body);
        if (transactions.status === -1) {
            throw new Error(transactions.message);
        }
        res.status(200).json({ response: transactions.data, message: transactions.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}
exports.consultantDone = async (req, res) => {
    try {
        const schema = Joi.object().keys({
            page_limit: Joi.number().required(),
            page_number: Joi.number().required(),

        })

        let da = await schema.validateAsync(req.body);
        let transactions = await adminService.consultantDone(req.body);
        if (transactions.status === -1) {
            throw new Error(transactions.message);
        }
        res.status(200).json({ response: transactions.data, message: transactions.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}


// exports.getCategories = async (req, res) => {
//     try{
//         let category = await adminService.getCategories();
//         if(category.status === -1){
//             throw new Error(category.message);
//         }
//         res.status(200).json({ response: category.data, message: category.message });
//     }catch (err) {
//         res.status(403).json({ message: err.message });
//     }
// }

exports.addFaq = async (req, res) => {
    try {
        let faq = await adminService.addFaq(req.body);
        if (faq.status === -1) {
            throw new Error(faq.message);
        }
        res.status(200).json({ response: faq.data, message: faq.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}
exports.addSettingData = async (req, res) => {
    try {
        let faq = await adminService.addSettingData(req.body);
        if (faq.status === -1) {
            throw new Error(faq.message);
        }
        res.status(200).json({ response: faq.data, message: faq.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getSettingData = async (req, res) => {
    try {
        let data = await adminService.getSettingData()
        if (data.status == -1) {
            throw new Error(data.message)
        }
        res.status(200).json({ response: data.data, message: data.message })
    } catch (error) {
        res.status(403).json({ message: err.message })
    }
}


exports.getFaq = async (req, res) => {
    try {
        let data = await adminService.getFaq()
        if (data.status == -1) {
            throw new Error(data.message)
        }
        res.status(200).json({ response: data.data, message: data.message })
    } catch (error) {
        res.status(403).json({ message: err.message })
    }
}

exports.deleteFaq = async (req, res) => {
    try {
        let data = await adminService.deleteFaq(req.body)
        if (data.status == -1) {
            throw new Error(data.message)
        }
        res.status(200).json({ response: data.data, message: data.message })
    } catch (err) {
        res.status(403).json({ message: err.message })
    }
}
exports.reportData = async (req, res) => {
    try {
        let data = await adminService.reportData()
        if (data.status == -1) {
            throw new Error(data.message)
        }
        res.status(200).json({ response: data.data, message: data.message })
    } catch (err) {
        res.status(403).json({ message: err.message })
    }
}

exports.sendNotification = async (req, res) => {
    try {
        let data = await adminService.sendNotification(req.body)
        if (data.status == -1) {
            throw new Error(data.message)
        }
        res.status(200).json({ response: data.data, message: data.message })
    } catch (err) {
        res.status(403).json({ message: err.message })
    }
}
exports.getNotification = async (req, res) => {
    try {
        let data = await adminService.getNotification()
        if (data.status == -1) {
            throw new Error(data.message)
        }
        res.status(200).json({ response: data.data, message: data.message })
    } catch (err) {
        res.status(403).json({ message: err.message })
    }
}

exports.filterReportData = async (req, res) => {
    try {
        let data = await adminService.filterReportData(req.body)
        if (data.status == -1) {
            throw new Error(data.message)
        }
        res.status(200).json({ response: data.data, message: data.message })
    } catch (err) {
        res.status(403).json({ message: err.message })
    }
}

exports.filterByCategory = async (req, res) => {
    try {
        let data = await adminService.filterByCategory(req.body)
        if (data.status == -1) {
            throw new Error(data.message)
        }
        res.status(200).json({ response: data.data, message: data.message })
    } catch (err) {
        res.status(403).json({ message: err.message })
    }
}
exports.payout = async (req, res) => {
    try {
        let data = await adminService.payout()
        if (data.status == -1) {
            throw new Error(data.message)
        }
        res.status(200).json({ response: data.data, total: data.total, pending: data.pending, message: data.message })
    } catch (err) {
        res.status(403).json({ message: err.message })
    }
}

exports.changePaymentStatus = async (req, res) => {
    try {
        let data = await adminService.changePaymentStatus(req.body)
        if (data.status == -1) {
            throw new Error(data.message)
        }
        res.status(200).json({ response: data.data, message: data.message })
    } catch (err) {
        res.status(403).json({ message: err.message })
    }
}

exports.filterPayout = async (req, res) => {
    try {
        let transactions = await adminService.filterPayout(req.body);
        if (transactions.status === -1) {
            throw new Error(transactions.message);
        }
        res.status(200).json({ response: transactions.data, message: transactions.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.getCommision = async (req, res) => {
    try {
        let data = await adminService.getCommision()
        if (data.status == -1) {
            throw new Error(data.message)
        }
        res.status(200).json({ response: data.data, message: data.message })
    } catch (err) {
        res.status(403).json({ message: err.message })
    }
}

exports.changePasswordNew = async (req, res) => {
    try {
        let userData = await adminService.changePasswordNew(req.adminData, req.body);
        if (userData.status == -1) {
            throw new Error(userData.message);
        }
        if (userData.status == 0) {
            return res.status(401).json({ message: userData.message });
        }
        res.status(200).json({ message: userData.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.getCommission = async (req, res) => {
    try {
        let category = await adminService.getCommission(req.body);
        if (category.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: category.data, message: category.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
};

exports.createAndUpdateCommissions = async (req, res) => {
    try {
        let category = await adminService.createAndUpdateCommissions(req.body);
        if (category.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: category.data, message: category.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.blockCommissions = async (req, res) => {
    try {
        let category = await adminService.blockCommissions(req.body);
        if (category.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: category.data, message: category.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}

exports.deleteCommissions = async (req, res) => {
    try {
        let category = await adminService.deleteCommissions(req.body);
        if (category.status === -1) {
            throw new Error(category.message);
        }
        res.status(200).json({ response: category.data, message: category.message });
    } catch (err) {
        res.status(403).json({ message: err.message });
    }
}


