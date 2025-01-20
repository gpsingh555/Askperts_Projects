const config = require('../configs/config');

var aws = require('aws-sdk');
var multer = require('multer');
const multerS3 = require('multer-s3');

aws.config.update({
    secretAccessKey: config.S3_SecretKey,
    accessKeyId: config.S3_AccessKey,
    region: config.S3_Region
});

const path = require('path');
const md5 = require("md5");
var s3 = new aws.S3();

//console.log(" data :",config.S3_AccessKey);
let upload = multer({
    storage: multerS3({
        s3: s3,
        bucket: config.S3_BucketName,
        contentType: multerS3.AUTO_CONTENT_TYPE,
        LocationConstraint: multerS3.AWS_DEFAULT_REGION,
        acl: 'private',
        metadata: function (req, file, cb) {
            cb(null, {
                fieldName: file.fieldname
            });
        },
        key: function (req, file, cb) {
            console.log("Original Image :",file.originalname);
            cb(null,"Uploads/" + Date.now() + "/" + file.originalname)

        }
    })
});


exports.uploadFiles = async (req, res, next) => {
    await upload.fields([
        {
            name: 'image',
            maxCount: 15
        },
        {
            name: 'subCategoryImage',
            maxCount: 15
        },
        {
            name: 'brand_doc',
            maxCount: 1
        },
        {
            name: 'uploaded_doc_type',
            maxCount: 1
        }
    ])
        (req, res, (err, some) => {
            if (err) {
                return res.status(422).send({
                    message: err.message,
                    response: null
                });
            }
            
            next();
        });
};

exports.uploadUserFiles = async (req, res, next) => {
    await upload.fields([
        
        {
            name: 'profileImage',
            maxCount: 1
        }
       
    ])
        (req, res, (err, some) => {
            if (err) {
                return res.status(422).send({
                    message: err.message,
                    response: null
                });
            }
            
            next();
        });
};

