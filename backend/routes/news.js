import express from 'express';
import { verifyToken, requireAdmin, requireVanshAccess } from '../middleware/auth.js';

const router = express.Router();

// Get all published news (public)
router.get('/', async (req, res) => {
  try {
    const { category, limit = 100, vansh } = req.query;
    
    const db = req.app.locals.db || await req.app.locals.connectToMongo();
    
    const newsCollection = db.collection('news');
    
    // Create index for better performance
    await newsCollection.createIndex({ publishDate: -1, createdAt: -1 });
    await newsCollection.createIndex({ isPublished: 1, category: 1 });
    
    const filter = { isPublished: true };
    if (category && category !== 'all') {
      filter.category = category;
    }
    if (vansh !== undefined && vansh !== null && vansh !== '') {
      const vanshValue = parseInt(vansh);
      if (!isNaN(vanshValue)) {
        filter.$or = [
          { vansh: vanshValue },
          { authorVanshNo: vanshValue },
          { visibleToAllVansh: true }  // Include news visible to all vanshes
        ];
      }
    }
    
    const news = await newsCollection
      .find(filter)
      // Exclude large image data in list view for better performance
      .project({
        images: 0  // Exclude images from list to reduce payload size
      })
      .sort({ publishDate: -1, createdAt: -1 })
      .limit(parseInt(limit))
      .toArray();
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({ success: true, data: news });
  } catch (error) {
    console.error('[NEWS] Error fetching news:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch news', error: error.message });
  }
});

// Get single news by ID
router.get('/:id', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const db = req.app.locals.db || await req.app.locals.connectToMongo();
    const newsCollection = db.collection('news');
    
    const news = await newsCollection.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }
    
    // Increment view count
    await newsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $inc: { views: 1 } }
    );
    news.views = (news.views || 0) + 1;
    
    res.json({ success: true, data: news });
  } catch (error) {
    console.error('Error fetching news:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch news', error: error.message });
  }
});

// Create news (protected)
router.post('/', verifyToken, async (req, res) => {
  try {
    console.log('[NEWS POST] Received request body:', JSON.stringify(req.body, null, 2));
    const { title, content, summary, category, priority, tags, authorVanshNo, authorName, visibleToAllVansh, images, vansh } = req.body;
    
    console.log('[NEWS POST] Validation - title:', !!title, 'content:', !!content);
    
    if (!title || !content) {
      console.log('[NEWS POST] Validation failed - title:', title, 'content:', content);
      return res.status(400).json({ success: false, message: 'Title and content are required' });
    }
    
    const newsData = {
      title,
      content,
      summary,
      category: category || 'General',
      priority: priority || 'Medium',
      tags: tags || [],
      isPublished: true,
      publishDate: Date.now(),
      authorVanshNo: authorVanshNo || null,
      authorName: authorName || 'Anonymous',
      visibleToAllVansh: visibleToAllVansh === true,
      vansh: vansh !== undefined && vansh !== null && vansh !== '' ? Number(vansh) : null,
      images: images || []
    };
    
    // Direct MongoDB insertion to match your schema
    const db = req.app.locals.db || await req.app.locals.connectToMongo();
    const newsCollection = db.collection('news');
    const result = await newsCollection.insertOne(newsData);
    
    const insertedNews = await newsCollection.findOne({ _id: result.insertedId });
    
    res.status(201).json({ success: true, data: insertedNews, message: 'News created successfully' });
  } catch (error) {
    console.error('Error creating news:', error);
    res.status(500).json({ success: false, message: 'Failed to create news', error: error.message });
  }
});

// Update news (protected)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const db = req.app.locals.db || await req.app.locals.connectToMongo();
    const newsCollection = db.collection('news');
    
    const news = await newsCollection.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }
    
    const { title, content, summary, category, priority, tags, isPublished, images, visibleToAllVansh } = req.body;
    
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (summary !== undefined) updateData.summary = summary;
    if (category) updateData.category = category;
    if (priority) updateData.priority = priority;
    if (tags) updateData.tags = tags;
    if (images !== undefined) updateData.images = images;
    if (visibleToAllVansh !== undefined) updateData.visibleToAllVansh = visibleToAllVansh === true;
    if (isPublished !== undefined) {
      updateData.isPublished = isPublished;
      if (isPublished && !news.publishDate) {
        updateData.publishDate = new Date();
      }
    }
    updateData.updatedAt = new Date();
    
    await newsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    
    const updatedNews = await newsCollection.findOne({ _id: new ObjectId(req.params.id) });
    
    res.json({ success: true, data: updatedNews, message: 'News updated successfully' });
  } catch (error) {
    console.error('Error updating news:', error);
    res.status(500).json({ success: false, message: 'Failed to update news', error: error.message });
  }
});

// Delete news (protected)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const db = req.app.locals.db || await req.app.locals.connectToMongo();
    const newsCollection = db.collection('news');
    
    const news = await newsCollection.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }
    
    await newsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    
    res.json({ success: true, message: 'News deleted successfully' });
  } catch (error) {
    console.error('Error deleting news:', error);
    res.status(500).json({ success: false, message: 'Failed to delete news', error: error.message });
  }
});

// Like/Unlike news (protected)
router.post('/:id/like', verifyToken, async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const db = req.app.locals.db || await req.app.locals.connectToMongo();
    const newsCollection = db.collection('news');
    
    const news = await newsCollection.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }
    
    const likes = news.likes || [];
    const userSerNo = req.user.serialnumber || req.user.sub;
    const userLikeIndex = likes.findIndex(like => like.toString() === userSerNo.toString());
    
    let operation;
    if (userLikeIndex > -1) {
      // Unlike - remove user from likes array
      operation = { $pull: { likes: userSerNo } };
    } else {
      // Like - add user to likes array
      operation = { $push: { likes: userSerNo } };
    }
    
    await newsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      operation
    );
    
    const updatedNews = await newsCollection.findOne({ _id: new ObjectId(req.params.id) });
    
    res.json({ 
      success: true, 
      data: { likes: (updatedNews.likes || []).length }, 
      message: 'Like updated' 
    });
  } catch (error) {
    console.error('Error liking news:', error);
    res.status(500).json({ success: false, message: 'Failed to update like', error: error.message });
  }
});

// Add comment to news (protected)
router.post('/:id/comment', verifyToken, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Comment text is required' });
    }
    
    const { ObjectId } = await import('mongodb');
    const db = req.app.locals.db || await req.app.locals.connectToMongo();
    const newsCollection = db.collection('news');
    
    const news = await newsCollection.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!news) {
      return res.status(404).json({ success: false, message: 'News not found' });
    }
    
    const comment = {
      userSerNo: req.user.serialnumber || req.user.sub,
      userName: req.user.firstName + ' ' + req.user.lastName || 'Anonymous',
      text: text.trim(),
      createdAt: new Date()
    };
    
    await newsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $push: { comments: comment } }
    );
    
    const updatedNews = await newsCollection.findOne({ _id: new ObjectId(req.params.id) });
    
    res.json({ success: true, data: updatedNews.comments, message: 'Comment added successfully' });
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ success: false, message: 'Failed to add comment', error: error.message });
  }
});

export default router;
