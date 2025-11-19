import express from 'express';
import { ObjectId } from 'mongodb';
import { upload } from '../middleware/upload.js';
import { verifyToken, requireAdmin, requireVanshAccess } from '../middleware/auth.js';

const router = express.Router();

// GET /api/media - Get all photos with optional filtering
router.get('/', async (req, res) => {
  try {
    const { category, search, limit = 100 } = req.query;

    // Use the server's shared Mongo connection (set on app.locals.connectToMongo)
    const db = req.app && req.app.locals && req.app.locals.connectToMongo
      ? await req.app.locals.connectToMongo()
      : null;

    const collection = db ? db.collection('media') : null;

    // Build query
    let query = {};
    
    if (category && category !== 'all') {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { photographer: { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
        { tags: { $regex: search, $options: 'i' } }
      ];
    }

    // Fetch photos sorted by upload date (newest first)
    const photos = collection
      ? await collection.find(query).sort({ uploaded_date: -1 }).limit(parseInt(limit)).toArray()
      : [];

    res.json(photos);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: 'Failed to fetch photos' });
  }
});

// GET /api/media/:id - Get single photo by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const db = req.app && req.app.locals && req.app.locals.connectToMongo
      ? await req.app.locals.connectToMongo()
      : null;
    const collection = db ? db.collection('media') : null;

    const photo = collection ? await collection.findOne({ _id: new ObjectId(id) }) : null;

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json(photo);
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(500).json({ error: 'Failed to fetch photo' });
  }
});

// POST /api/media - Upload new photo(s)
router.post('/', upload.any(), async (req, res) => {
  try {
    const { title, description, category, photographer, location, eventDate, generation, occasion, tags } = req.body;

    // Convert uploaded files to base64
    const files = req.files || [];

    if (files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const db = req.app && req.app.locals && req.app.locals.connectToMongo
      ? await req.app.locals.connectToMongo()
      : null;
    const collection = db ? db.collection('media') : null;

    // Helper function to convert file to base64
    const fileToBase64 = (file) => ({
      data: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
      mimeType: file.mimetype,
      originalName: file.originalname
    });

    if (!collection) {
      return res.status(500).json({ error: 'Database connection not available' });
    }

    // If multiple files, create a photo collection
    if (files.length > 1) {
      const imageUrls = files.map(fileToBase64);

      const photoCollection = {
        title,
        description,
        category,
        photographer: photographer || 'Family Member',
        location,
        eventDate: eventDate ? new Date(eventDate) : new Date(),
        generation: generation || '2020s',
        occasion: occasion || 'General',
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
        image: imageUrls[0], // First image as main
        imageUrls: imageUrls,
        isCollection: true,
        photoCount: files.length,
        likes: 0,
        comments: [],
        linked_to_model: 'Gallery',
        uploaded_date: new Date()
      };

      const result = await collection.insertOne(photoCollection);
      const insertedPhoto = await collection.findOne({ _id: result.insertedId });

      res.status(201).json(insertedPhoto);
    } else {
      // Single photo upload
      const imageData = fileToBase64(files[0]);

      const photoItem = {
        title,
        description,
        category,
        photographer: photographer || 'Family Member',
        location,
        eventDate: eventDate ? new Date(eventDate) : new Date(),
        generation: generation || '2020s',
        occasion: occasion || 'General',
        tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())) : [],
        image: imageData,
        isCollection: false,
        photoCount: 1,
        likes: 0,
        comments: [],
        linked_to_model: 'Gallery',
        uploaded_date: new Date()
      };

      const result = await collection.insertOne(photoItem);
      const insertedPhoto = await collection.findOne({ _id: result.insertedId });

      res.status(201).json(insertedPhoto);
    }
  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: 'Failed to upload photo' });
  }
});

// PUT /api/media/:id/like - Like a photo
router.put('/:id/like', async (req, res) => {
  let client;
  try {
    const { id } = req.params;
    
    const { client: dbClient, db } = await getDb();
    client = dbClient;
    const collection = db.collection('media');

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $inc: { likes: 1 } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error liking photo:', error);
    res.status(500).json({ error: 'Failed to like photo' });
  } finally {
    if (client) await client.close();
  }
});

// POST /api/media/:id/comment - Add comment to photo
router.post('/:id/comment', async (req, res) => {
  let client;
  try {
    const { id } = req.params;
    const { user, text } = req.body;
    
    if (!text || !user) {
      return res.status(400).json({ error: 'User and text are required' });
    }

    const { client: dbClient, db } = await getDb();
    client = dbClient;
    const collection = db.collection('media');

    const comment = {
      user,
      text,
      timestamp: new Date()
    };

    const result = await collection.findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $push: { comments: comment } },
      { returnDocument: 'after' }
    );

    if (!result) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  } finally {
    if (client) await client.close();
  }
});

// DELETE /api/media/:id - Delete a photo
router.delete('/:id', async (req, res) => {
  let client;
  try {
    const { id } = req.params;
    
    const { client: dbClient, db } = await getDb();
    client = dbClient;
    const collection = db.collection('media');

    const result = await collection.deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: 'Failed to delete photo' });
  } finally {
    if (client) await client.close();
  }
});

export default router;
