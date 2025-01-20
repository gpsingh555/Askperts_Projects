var { mongoose, conn } = require('../configs/db');

const subCategorySchema = new mongoose.Schema({
    image: {
        type: String,
        default: ''
    },
    subCategoryName: {
        type: String,
        default: ''
    },
    subCategoryNameArabic: {
        type: String,
        default: ''
    },
    position: {
        type: Number,
        default: 1
    },
    category: {
        type: mongoose.Types.ObjectId,
        ref: 'category'
    },
    is_deleted:{
        type: Boolean,
        default: false
    }
},
    {
        strict: true,
        timestamps: true,
        collection: 'subCategory',
        versionKey: false
    }
);

exports.subCategoryModel = mongoose.model('subCategory', subCategorySchema);