import mongoose from 'mongoose';

const NewsSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true, maxlength: 200 },
  content: { type: String, required: true, maxlength: 5000 },
  summary: { type: String, maxlength: 300 },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, enum: ['General', 'Announcement', 'Achievement', 'Milestone', 'Memorial', 'Celebration'], default: 'General' },
  images: [{ media_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' } }],
  isPublished: { type: Boolean, default: false },
  publishDate: { type: Date, default: Date.now },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  tags: [{ type: String, trim: true }],
  vansh: { type: Number, default: null },
  likes: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, date: { type: Date, default: Date.now } }],
  comments: [{ user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, text: { type: String, required: true, maxlength: 500 }, date: { type: Date, default: Date.now } }],
  views: { type: Number, default: 0 }
}, { timestamps: true });

NewsSchema.index({ title: 'text', content: 'text' });
NewsSchema.index({ category: 1, publishDate: -1 });

let NewsModel;
try {
  NewsModel = mongoose.models.News || mongoose.model('News', NewsSchema);
} catch (error) {
  console.error('Failed to initialize News model:', error);
  throw error;
}

export default NewsModel;
