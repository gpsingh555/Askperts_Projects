var { mongoose, conn } = require('../configs/db');

const subAdminSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true
  },
  name: {
    type: String,
    default: "Admin"
  },
  token: {
    type: String,
    default: ''
  },
  mobileNumber:{
    type: String,
    required: true
  },
  linkToken:{
    type: String,
    default: ''
  },
  password: {
    type: String,
    required: true
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
  is_deleted:{
    type:Boolean,
    default: false
  }
},
  {
    strict: true,
    collection: 'subAdmin',
    versionKey: false
  }
);

exports.subAdminModel = mongoose.model('subAdmin', subAdminSchema);
