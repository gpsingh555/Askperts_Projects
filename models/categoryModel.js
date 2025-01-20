var { mongoose, conn } = require('../configs/db');

const categorySchema = new mongoose.Schema({
    image: {
        type: String,
        default: ''
    },
    categoryName: {
        type: String,
        default: ''
    },
    categoryNameArabic: {
        type: String,
        default: ''
    },
    position: {
        type: Number,
        default: 1
    },
    is_deleted:{
        type: Boolean,
        default: false
    }
},
    {
        strict: true,
        timestamps: true,
        collection: 'category',
        versionKey: false
    }
);

exports.categoryModel = mongoose.model('category', categorySchema);