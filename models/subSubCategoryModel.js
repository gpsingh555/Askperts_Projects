var { mongoose, conn } = require('../configs/db');

const subSubCategorySchema = new mongoose.Schema({
    image: {
        type: String,
        default: ''
    },
    name: {
        type: String,
        default: ''
    },
    nameArabic: {
        type: String,
        default: ''
    },
    position: {
        type: Number,
        default: 1
    },
    subCategory: {
        type: mongoose.Types.ObjectId,
        ref: 'subCategory'
    },
    is_deleted:{
        type: Boolean,
        default: false
    }
},
    {
        strict: true,
        timestamps: true,
        collection: 'subSubCategory',
        versionKey: false
    }
);

exports.subSubCategoryModel = mongoose.model('subSubCategory', subSubCategorySchema);