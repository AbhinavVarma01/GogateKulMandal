const mongoose = require('mongoose');

const RelationshipSchema = new mongoose.Schema({
  fromSerNo: {
    type: Number,
    required: true
  },
  toSerNo: {
    type: Number,
    required: true
  },
  relation: {
    type: String,
    required: true,
    trim: true
  },
  relationMarathi: {
    type: String,
    trim: true,
    default: ''
  },
  level: {
    type: Number,
    default: null
  }
}, {
  timestamps: true,
  collection: 'relationships' // Explicitly specify the collection name
});

// Compound index for efficient relationship queries
RelationshipSchema.index({ fromSerNo: 1, toSerNo: 1 });
RelationshipSchema.index({ fromSerNo: 1, relation: 1 });
RelationshipSchema.index({ toSerNo: 1, relation: 1 });

// Static method to find relationships for a member
RelationshipSchema.statics.findRelationshipsFor = function(serNo) {
  return this.find({
    $or: [
      { fromSerNo: serNo },
      { toSerNo: serNo }
    ]
  });
};

// Static method to find specific relationship between two members
RelationshipSchema.statics.findRelationshipBetween = function(fromSerNo, toSerNo) {
  return this.findOne({ fromSerNo, toSerNo });
};

// Static method to find all children of a member
RelationshipSchema.statics.findChildren = function(parentSerNo) {
  return this.find({
    fromSerNo: parentSerNo,
    relation: { $in: ['father', 'mother'] }
  });
};

// Static method to find parents of a member
RelationshipSchema.statics.findParents = function(childSerNo) {
  return this.find({
    toSerNo: childSerNo,
    relation: { $in: ['father', 'mother'] }
  });
};

// Static method to find spouse of a member
RelationshipSchema.statics.findSpouse = function(memberSerNo) {
  return this.findOne({
    fromSerNo: memberSerNo,
    relation: { $in: ['husband', 'wife'] }
  });
};

module.exports = mongoose.model('Relationship', RelationshipSchema);