import mongoose from "mongoose";

const imageSchema = new mongoose.Schema(
  {
    data: String,
    mimeType: String,
    originalName: String,
  },
  { _id: false }
);

const personalDetailsSchema = new mongoose.Schema(
  {
    firstName: String,
    middleName: String,
    lastName: String,
    gender: String,
    dateOfBirth: Date,
    confirmDateOfBirth: String,
    isAlive: String,
    confirmDateOfDeath: String,
    email: String,
    mobileNumber: String,
    country: String,
    state: String,
    district: String,
    city: String,
    area: String,
    colonyStreet: String,
    flatPlotNumber: String,
    buildingNumber: String,
    pinCode: String,
    aboutYourself: String,
    qualifications: String,
    profession: String,
    profileImage: imageSchema,
    everMarried: String,
  },
  { _id: false }
);

const parentsInformationSchema = new mongoose.Schema(
  {
    description: String,
    fatherFirstName: String,
    fatherMiddleName: String,
    fatherLastName: String,
    fatherEmail: String,
    fatherMobileNumber: String,
    fatherDateOfBirth: Date,
    fatherProfileImage: imageSchema,
    fatherSerNo: Number, // Link to father's serNo in family tree
    motherFirstName: String,
    motherMiddleName: String,
    motherLastName: String,
    motherMobileNumber: String,
    motherDateOfBirth: Date,
    motherProfileImage: imageSchema,
    motherSerNo: Number, // Link to mother's serNo in family tree
  },
  { _id: false }
);

const marriedDetailsSchema = new mongoose.Schema(
  {
    description: String,
    spouseFirstName: String,
    spouseMiddleName: String,
    spouseLastName: String,
    spouseGender: String,
    dateOfMarriage: Date,
    spouseDateOfBirth: Date,
    spouseProfileImage: imageSchema,
    spouseEmail: String,
    spouseMobileNumber: String,
    everDivorced: String,
  },
  { _id: false }
);

const membersSchema = new mongoose.Schema(
  {
    sNo: Number,
    isapproved: Boolean,
    username: String,
    password: String,
    personalDetails: personalDetailsSchema,
    parentsInformation: parentsInformationSchema,
    marriedDetails: marriedDetailsSchema,
    divorcedDetails: mongoose.Schema.Types.Mixed,
    remarriedDetails: mongoose.Schema.Types.Mixed,
    widowedDetails: mongoose.Schema.Types.Mixed,
    vansh: String,
    serNo: {
      type: Number,
      unique: true,
      sparse: true,
    },
    fatherSerNo: {
      type: Number,
      default: null,
    },
    motherSerNo: {
      type: Number,
      default: null,
    },
    spouseSerNo: {
      type: Number,
      default: null,
    },
    childrenSerNos: {
      type: [Number],
      default: [],
    },
    level: Number,
  },
  {
    collection: "members",
    timestamps: true,
  }
);

// Indexes to speed up parent/name searches. We index `vansh` (used as the
// primary filter) and name fields so queries that filter by vansh and match
// on name regexes only need to scan the subset for the given vansh.
// Also add a text index for name token searches if later needed.
membersSchema.index({ vansh: 1, "personalDetails.firstName": 1, "personalDetails.lastName": 1, "personalDetails.middleName": 1 });
membersSchema.index({ "personalDetails.firstName": "text", "personalDetails.middleName": "text", "personalDetails.lastName": "text" });

let Members;
try {
  Members = mongoose.models.Members || mongoose.model("Members", membersSchema);
} catch (error) {
  console.error("Failed to initialize Members model:", error);
  throw error;
}

export default Members;
