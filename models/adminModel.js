var { mongoose, conn } = require('../configs/db');

const adminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: "Admin"
  },
  image: {
    type: String,
    default: ''
  },
  token: {
    type: String,
    default: ''
  },
  linkToken:{
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: true
  },
  passwordInWords: {
    type: String
  },
  role:{
    type:Number,
    default: 1        //1 means admin 2 means subAdmin 
  },
  mobileNumber:{
    type: String,
  },
  consultant_mngnt: {
    type:Boolean,
    default: false
  },
  user_mngnt: {
    type:Boolean,
    default: false
  },
  subcription_mngnt: {
    type:Boolean,
    default: false
  },
  category_mngnt: {
    type:Boolean,
    default: false
  },
  banner_mngnt: {
    type:Boolean,
    default: false
  },
  payment_mngnt: {
    type:Boolean,
    default: false
  },
  call:{
    type:Boolean,
    default: false
  },
  cms:{
    type:Boolean,
    default: false
  },
  report_mgnt:{
    type:Boolean,
    default: false
  },
  notification_mgnt:{
    type:Boolean,
    default: false
  },
  dashboard:{
    type:Boolean,
    default: false
  },
  is_deleted:{
    type:Boolean,
    default: false
  }
},
  {
    strict: true,
    timestamps: true,
    collection: 'admin',
    versionKey: false
  }
);

exports.AdminModel = mongoose.model('admin', adminSchema);
