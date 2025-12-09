import mongoose from 'mongoose';

const mediaSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String, required: false, trim: true },
  tags: [{ type: String, trim: true }],
  category: { type: String, required: true, trim: true },
  photographer: { type: String, trim: true },
  location: { type: String, trim: true },
  eventDate: { type: Date },
  generation: { type: String, trim: true },
  occasion: { type: String, trim: true },
  image: {
    data: { type: String, required: true }, // base64 encoded image
    mimeType: { type: String, required: true },
    originalName: { type: String, trim: true }
  },
  // Support for multiple images in a collection
  imageUrls: [{
    data: { type: String }, // base64 encoded image
    mimeType: { type: String },
    originalName: { type: String }
  }],
  isCollection: { type: Boolean, default: false },
  photoCount: { type: Number, default: 1 },
  likes: { type: Number, default: 0 },
  comments: [{ 
    user: String, 
    text: String, 
    timestamp: { type: Date, default: Date.now } 
  }],
  uploaded_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: false },
  linked_to_id: { type: mongoose.Schema.Types.ObjectId, refPath: 'linked_to_model', required: false, default: null },
  linked_to_model: { type: String, required: false, enum: [null, 'Event', 'News', 'Gallery'], default: 'Gallery' },
  uploaded_date: { type: Date, default: Date.now }
}, { timestamps: true });

mediaSchema.index({ title: 1 });
mediaSchema.index({ tags: 1 });
mediaSchema.index({ uploaded_by: 1 });
mediaSchema.index({ linked_to_id: 1 });
mediaSchema.index({ uploaded_date: -1 });
mediaSchema.index({ 'tags': 1, 'uploaded_date': -1 });

let Media;
try {
  Media = mongoose.models.Media || mongoose.model('Media', mediaSchema);
} catch (error) {
  console.error('Failed to initialize Media model:', error);
  throw error;
}

export default Media;
