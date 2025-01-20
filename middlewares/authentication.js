const jwt = require('jsonwebtoken'); // used to create, sign, and verify tokens
const config = require('../configs/config'); // get our config file
const { ConsultModel } = require("../models/consultModel");
const { AdminModel } = require('../models/adminModel');
const { UserModel } = require('../models/userModel');

exports.verifyToken = async(req, res, next) => {

    // check header or url parameters or post parameters for token
    let {access_token} = req.headers;
    if (!access_token) return res.status(401).send({ auth: false, message: 'No token provided' });

    // verifies secret and check expiration
    jwt.verify(access_token, config.JWT_PRIVATE_KEY,async function (err, decoded) {
        if (!err){
            let user = await ConsultModel.findOne({ is_deleted:false, token: access_token }).populate("consultantType","image categoryName categoryNameArabic").populate('consultantSubType');
          
                if (!user) {
                    res.status(401).json({message: "Unauthorized Access."});
                    return;
                }
                //await user.populated("consultantType","image categoryName");
                req.userData = user;
                if(!user.active){
                    user.active = true;
                    user.modified_at = Date.now();
                    await user.save();
                }
                next();
        }else{
            return res.status(401).json({ auth: false, message: 'Token has been expired' });
        }
        // if everything is good, save to request for use in other routes
    });
};

exports.verifyAdminToken = async(req, res, next) => {
    // check header or url parameters or post parameters for token
    let {access_token} = req.headers;
    if (!access_token) return res.status(401).send({ auth: false, message: 'No token provided' });

    // verifies secret and check expiration
    jwt.verify(access_token, config.JWT_PRIVATE_KEY,async function (err, decoded) {
        if (!err){
            let user = await AdminModel.findOne({ token: access_token });
            if(!user){
                res.status(401).json({message: "Invalid access_token."});
                return;
            }
            req.adminData = user;
            next();
        }else{
            return res.status(401).json({ auth: false, message: 'Token has been expired' });
        }
        // if everything is good, save to request for use in other routes
    });
};

exports.verifyUserToken = async(req, res, next) => {

    // check header or url parameters or post parameters for token
    let {access_token} = req.headers;
    if (!access_token) return res.status(401).send({ auth: false, message: 'No token provided' });

    // verifies secret and check expiration
    jwt.verify(access_token, config.JWT_PRIVATE_KEY,async function (err, decoded) {
        if (!err){
            let user = await UserModel.findOne({is_deleted:false, token: access_token })
                if (!user) {
                    res.status(401).json({message: "Invalid access_token."});
                    return;
                }
                req.userData = user;
                if(!user.active){
                    user.active = true;
                    user.modified_at = Date.now();
                    await user.save();
                }
                next();
        }else{
            return res.status(401).json({ auth: false, message: 'Token has been expired' });
        }
        // if everything is good, save to request for use in other routes
    });
};

exports.generateToken = (days) => {
    let token = jwt.sign({ access: 'access-' }, config.JWT_PRIVATE_KEY, { expiresIn: days });
    return token;
}
