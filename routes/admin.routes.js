const express = require('express');
const router = express.Router();

const adminController = require('../controller/admin.controller');
const authentication = require('../middlewares/authentication');
const s3bucket = require('../modules/aws-s3');
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './upload/files')
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})
var upload = multer({ storage: storage });

const { body,param } = require('express-validator');

router.post('/login', adminController.loginAdmin);
router.get('/logout', authentication.verifyAdminToken, adminController.logoutAdmin);
router.post('/forgetPassword', adminController.forgetPassword);
router.post('/resetPassword', adminController.resetPassword);
router.post('/changePassword', adminController.changePassword);
//route.post('/editProfile',s3bucket.uploadFiles,adminController.editProfile);
router.post('/adminRegisteration', adminController.createAdminReq);

/* User Management */
router.post("/userManagement", authentication.verifyAdminToken, adminController.userManagement);
router.patch("/block_Unblock_User/:id", authentication.verifyAdminToken,
[
    param('id').exists().withMessage("id parameter not found").notEmpty().withMessage("id parameter is required"),
    body('isBlocked').exists().withMessage("isBlocked key not found").notEmpty().withMessage("isBlocked is required"),
    body('type').exists().withMessage("type key not found").notEmpty().withMessage("type is required")
],
adminController.blockUser);

/* Consultant Management */
router.post("/consultantManagement", authentication.verifyAdminToken,
[
    body('type').exists().withMessage("type key not found").notEmpty().withMessage("type is required") //1 means request for accept or reject, 2 means accepted, 3 means rejected
],
adminController.consultantManagement);

router.patch("/acceptOrRejectConsultant/:id", authentication.verifyAdminToken,
[
    param('id').exists().withMessage("id parameter not found").notEmpty().withMessage("id parameter is required"),
    body('isVerified').exists().withMessage("isVerified key not found").notEmpty().withMessage("isVerified is required")  //  false means rejected , true means accepted
],
adminController.acceptOrRejectConsultant);

router.patch("/deleteConsultant/:id", authentication.verifyAdminToken,
[
    body('is_deleted').exists().withMessage("is_deleted key not found").notEmpty().withMessage("is_deleted is required")
],
adminController.deleteConsultant);

/* template Model */
router.post("/template", authentication.verifyAdminToken, adminController.addtemplate);

/* category Model */

router.route('/category')
.all(authentication.verifyAdminToken)
    .get(adminController.getCategories)
    .post(adminController.createAndUpdateCategories);

/* subCategory Model */

router.route('/subCategory/:id')
.all(authentication.verifyAdminToken)
.get(adminController.getSubCategory)
.post(adminController.createAndUpdateSubCategories);


router.route('/subSubCategory/:id')
.all(authentication.verifyAdminToken)
.get(adminController.getsubSubCategory)
.post(adminController.createAndUpdatesubSubCategories);

/* subscription Model */
router.route('/subscription')
.all(authentication.verifyAdminToken)
    .get(adminController.getSubscription)
    .post(adminController.createAndUpdateSubscription);    

/* banner Model */
router.route('/banner')
.all(authentication.verifyAdminToken)
    .get(adminController.getBanner)
    .post(adminController.createAndUpdateBanner);

router.post("/getImageLink", s3bucket.uploadFiles, adminController.getImageLink);

router.route('/subAdmin')
//.all(authentication.verifyAdminToken)
    .get(adminController.getSubAdmin)
    .post(adminController.createAndUpdateSubAdmin);

router.post('/sendEmail',
   // authentication.verifyAdminToken,
   adminController.sendEmail
);

router.get('/getTransaction',
    //authentication.verifyAdminToken,
    adminController.getTransactions);
router.post('/admin_charge',    authentication.verifyAdminToken, adminController.getFee);
router.get('/getCommision',    authentication.verifyAdminToken, adminController.getCommision);

router.post('/consultant_done',     adminController.consultantDone);
router.post('/addFaq',adminController.addFaq);
router.post('/addSettingData',authentication.verifyAdminToken,adminController.addSettingData);
router.get('/getSettingData',adminController.getSettingData)
router.get('/getFaq',adminController.getFaq)
router.post('/deleteFaq',adminController.deleteFaq)
router.get('/reportData',authentication.verifyAdminToken,adminController.reportData);
router.post('/filterReportData',authentication.verifyAdminToken,adminController.filterReportData);

router.post('/sendNotification',adminController.sendNotification);
router.get('/getNotification',adminController.getNotification)
router.post('/filterByCategory',adminController.filterByCategory)
router.get('/payout',    authentication.verifyAdminToken, adminController.payout);
router.post('/changePaymentStatus', authentication.verifyAdminToken, adminController.changePaymentStatus);
router.post('/filterPayout',  authentication.verifyAdminToken, adminController.filterPayout);
router.post('/changePasswordNew',  authentication.verifyAdminToken, adminController.changePasswordNew);

/* category Model */

router.post('/addUpdateCommission', authentication.verifyAdminToken, adminController.createAndUpdateCommissions)
router.post('/getCommission', authentication.verifyAdminToken, adminController.getCommission)
router.patch('/blockUnblockCommission', authentication.verifyAdminToken, adminController.blockCommissions)
router.delete('/deleteCommission', authentication.verifyAdminToken, adminController.deleteCommissions)

module.exports = router;