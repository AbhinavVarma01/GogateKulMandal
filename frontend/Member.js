const mongoose = require('mongoose');

const imageSchema = new mongoose.Schema({
  data: { type: String },
  mimeType: { type: String },
  originalName: { type: String }
}, { _id: false });

const personalDetailsSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  middleName: { type: String },
  lastName: { type: String },
  gender: { type: String },
  dateOfBirth: { type: Date },
  confirmDateOfBirth: { type: String },
  isAlive: { type: String },
  dateOfDeath: { type: Date },
  confirmDateOfDeath: { type: String },
  email: { type: String },
  mobileNumber: { type: String },
  alternateMobileNumber: { type: String },
  country: { type: String },
  state: { type: String },
  district: { type: String },
  city: { type: String },
  area: { type: String },
  colonyStreet: { type: String },
  flatPlotNumber: { type: String },
  buildingNumber: { type: String },
  pinCode: { type: String },
  aboutYourself: { type: String },
  qualifications: { type: String },
  profession: { type: String },
  profileImage: { type: imageSchema },
  everMarried: { type: String }
}, { _id: false });

const parentsInformationSchema = new mongoose.Schema({
  description: { type: String },
  fatherFirstName: { type: String },
  fatherMiddleName: { type: String },
  fatherLastName: { type: String },
  fatherEmail: { type: String },
  fatherMobileNumber: { type: String },
  fatherDateOfBirth: { type: Date },
  fatherProfileImage: { type: imageSchema },
  motherFirstName: { type: String },
  motherMiddleName: { type: String },
  motherLastName: { type: String },
  motherMobileNumber: { type: String },
  motherDateOfBirth: { type: Date },
  motherProfileImage: { type: imageSchema }
}, { _id: false });

const marriedDetailsSchema = new mongoose.Schema({
  description: { type: String },
  spouseFirstName: { type: String },
  spouseMiddleName: { type: String },
  spouseLastName: { type: String },
  spouseGender: { type: String },
  dateOfMarriage: { type: Date },
  spouseDateOfBirth: { type: Date },
  spouseProfileImage: { type: imageSchema },
  spouseEmail: { type: String },
  spouseMobileNumber: { type: String },
  everDivorced: { type: String }
}, { _id: false });

const divorcedDetailsSchema = new mongoose.Schema({
  description: { type: String },
  spouseFirstName: { type: String },
  spouseMiddleName: { type: String },
  spouseLastName: { type: String },
  dateOfDivorce: { type: Date },
  marriageDate: { type: String },
  everWidowed: { type: String },
  spouseProfileImage: { type: imageSchema }
}, { _id: false });

const remarriedDetailsSchema = new mongoose.Schema({
  description: { type: String },
  spouseFirstName: { type: String },
  spouseMiddleName: { type: String },
  spouseLastName: { type: String },
  spouseGender: { type: String },
  dateOfMarriage: { type: Date },
  spouseDateOfBirth: { type: Date },
  spouseEmail: { type: String },
  spouseMobileNumber: { type: String },
  spouseProfileImage: { type: imageSchema }
}, { _id: false });

const widowedDetailsSchema = new mongoose.Schema({
  description: { type: String },
  spouseFirstName: { type: String },
  spouseMiddleName: { type: String },
  spouseLastName: { type: String },
  spouseGender: { type: String },
  spouseDateOfDeath: { type: Date },
  dateOfMarriage: { type: Date },
  spouseDateOfBirth: { type: Date },
  spouseEmail: { type: String },
  spouseMobileNumber: { type: String },
  spouseProfileImage: { type: imageSchema },
  everRemarried: { type: String }
}, { _id: false });

const memberSchema = new mongoose.Schema({
  personalDetails: { type: personalDetailsSchema, required: true },
  parentsInformation: { type: parentsInformationSchema, default: undefined },
  marriedDetails: { type: marriedDetailsSchema, default: undefined },
  divorcedDetails: { type: divorcedDetailsSchema, default: undefined },
  remarriedDetails: { type: remarriedDetailsSchema, default: undefined },
  widowedDetails: { type: widowedDetailsSchema, default: undefined },
  isapproved: { type: Boolean, default: false },
  sNo: { type: Number },
  vansh: { type: String },
  serNo: { type: Number },
  fatherSerNo: { type: Number, default: null },
  motherSerNo: { type: Number, default: null },
  spouseSerNo: { type: Number, default: null },
  childrenSerNos: [{ type: Number }],
  level: { type: Number, default: null }
}, {
  timestamps: true,
  minimize: true,
  collection: 'members'
});

memberSchema.virtual('firstName').get(function() {
  return this.personalDetails?.firstName || '';
});

memberSchema.virtual('middleName').get(function() {
  return this.personalDetails?.middleName || '';
});

memberSchema.virtual('lastName').get(function() {
  return this.personalDetails?.lastName || '';
});

memberSchema.virtual('fullName').get(function() {
  const parts = [this.firstName, this.middleName, this.lastName].filter(Boolean);
  return parts.join(' ').trim();
});

memberSchema.virtual('name').get(function() {
  return this.fullName;
});

memberSchema.virtual('profileImageData').get(function() {
  return this.personalDetails?.profileImage?.data || '';
});

memberSchema.virtual('email').get(function() {
  return this.personalDetails?.email || '';
});

memberSchema.index({ serNo: 1 }, { unique: true });
memberSchema.index({ sNo: 1 });

memberSchema.set('toJSON', { virtuals: true });
memberSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Member', memberSchema);
