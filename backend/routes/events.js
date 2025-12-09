import express from 'express';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Helper function to convert 24hr time to 12hr format
const convertTo12Hour = (time24) => {
  if (!time24) return '';
  const [hours, minutes] = time24.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12.toString().padStart(2, '0')}:${minutes} ${ampm}`;
};

// Get all events (public)
router.get('/', async (req, res) => {
  try {
    const { eventType, status, limit = 100, vansh } = req.query;
    
    const db = req.app.locals.db || await req.app.locals.connectToMongo();
    const eventsCollection = db.collection('events');
    
    // Create index for better performance on date queries
    await eventsCollection.createIndex({ date: 1, fromTime: 1 });
    
    const filter = {};
    
    if (eventType && eventType !== 'all') {
      filter.eventType = eventType;
    }
    
    // Translate status filter to date-based conditions (approximation)
    if (status && status !== 'all') {
      const now = new Date();
      // Normalize to midnight for date-only comparison
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (status === 'Upcoming') {
        filter.date = { $gte: today };
      } else if (status === 'Completed') {
        filter.date = { $lt: today };
      } else if (status === 'Ongoing') {
        // Treat events on the same calendar day as ongoing
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        filter.date = { $gte: today, $lt: tomorrow };
      }
    }
    
    const visibilityFilter = [];
    if (vansh !== undefined && vansh !== null && vansh !== '') {
      const vanshValue = parseInt(vansh);
      if (!isNaN(vanshValue)) {
        visibilityFilter.push({ vansh: vanshValue });
        visibilityFilter.push({ vanshNumber: vanshValue });
        visibilityFilter.push({ createdByVanshNo: vanshValue });
        visibilityFilter.push({ visibleToAllVansh: true });  // Include events visible to all vanshes
      }
    }

    if (visibilityFilter.length) {
      filter.$or = visibilityFilter;
    }

    const events = await eventsCollection
      .find(filter)
      // Exclude large image data in list view for better performance
      .project({
        eventImage: 0  // Exclude images from list to reduce payload size
      })
      .sort({ date: 1, fromTime: 1 })
      .limit(parseInt(limit))
      .toArray();
    
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    res.json({ success: true, data: events });
  } catch (error) {
    console.error('[EVENTS] Error fetching events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch events', error: error.message });
  }
});

// Get single event by ID
router.get('/:id', async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const db = req.app.locals.db || await req.app.locals.connectToMongo();
    const eventsCollection = db.collection('events');
    
    const event = await eventsCollection.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch event', error: error.message });
  }
});

// Create event (protected)
router.post('/', verifyToken, async (req, res) => {
  try {
    const {
      title,
      eventName,
      description,
      location,
      venue,
      address,
      date,
      fromTime,
      toTime,
      createdByVanshNo,
      createdByName,
      eventType,
      priority,
      eventImage,
      visibleToAllVansh,
      vansh
    } = req.body;
    
    if (!title || !title.trim() || !description || !description.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description'
      });
    }
    
    const cleanedTitle = title.trim();
    const cleanedDescription = description.trim();
    const cleanedEventName = eventName && typeof eventName === 'string' ? eventName.trim() : '';
    const cleanedLocation = location && typeof location === 'string' ? location.trim() : '';
    const cleanedVenue = venue && typeof venue === 'string' ? venue.trim() : '';
    const cleanedAddress = address && typeof address === 'string' ? address.trim() : '';
    const eventDateValue = date ? new Date(date) : null;
    const fromTimeValue = fromTime ? convertTo12Hour(fromTime) : '';
    const toTimeValue = toTime ? convertTo12Hour(toTime) : '';
    const createdByNameValue = createdByName && typeof createdByName === 'string' ? createdByName.trim() : 'Anonymous';
    const createdByVanshNoValue = createdByVanshNo === undefined || createdByVanshNo === null || createdByVanshNo === ''
      ? null
      : Number.isNaN(Number(createdByVanshNo))
        ? null
        : Number(createdByVanshNo);
    const eventTypeValue = eventType || 'Other';
    const priorityValue = priority || 'Medium';
    const images = Array.isArray(eventImage) ? eventImage : eventImage ? [eventImage] : [];
    const vanshValue = vansh !== undefined && vansh !== null && vansh !== '' ? Number(vansh) : null;
    
    const eventData = {
      title: cleanedTitle,
      eventName: cleanedEventName || cleanedTitle,
      description: cleanedDescription,
      createdByVanshNo: createdByVanshNoValue,
      createdByName: createdByNameValue || 'Anonymous',
      eventType: eventTypeValue,
      priority: priorityValue,
      visibleToAllVansh: visibleToAllVansh === true,
      vansh: vanshValue,
      createdAt: new Date()
    };

    if (cleanedLocation) eventData.location = cleanedLocation;
    if (cleanedVenue) eventData.venue = cleanedVenue;
    if (cleanedAddress) eventData.address = cleanedAddress;
    if (eventDateValue instanceof Date && !Number.isNaN(eventDateValue.getTime())) {
      eventData.date = eventDateValue;
    }
    if (fromTimeValue) {
      eventData.fromTime = fromTimeValue;
    }
    if (toTimeValue) {
      eventData.toTime = toTimeValue;
    }
    if (images.length > 0) {
      eventData.eventImage = images;
    }
    
    // Direct MongoDB insertion
    const db = req.app.locals.db || await req.app.locals.connectToMongo();
    const eventsCollection = db.collection('events');
    const result = await eventsCollection.insertOne(eventData);
    
    const insertedEvent = await eventsCollection.findOne({ _id: result.insertedId });
    
    res.status(201).json({ success: true, data: insertedEvent, message: 'Event created successfully' });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ success: false, message: 'Failed to create event', error: error.message });
  }
});

// Update event (protected)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const db = req.app.locals.db || await req.app.locals.connectToMongo();
    const eventsCollection = db.collection('events');
    
    const event = await eventsCollection.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    const {
      title,
      eventName,
      description,
      location,
      venue,
      address,
      date,
      fromTime,
      toTime,
      eventType,
      priority,
      eventImage,
      visibleToAllVansh,
      vansh
    } = req.body;
    
    const updateData = {};
    if (title) updateData.title = title;
    if (eventName) updateData.eventName = eventName;
    if (description) updateData.description = description;
    if (location) updateData.location = location;
    if (venue) updateData.venue = venue;
    if (address) updateData.address = address;
    if (date) updateData.date = new Date(date);
    if (fromTime) updateData.fromTime = convertTo12Hour(fromTime);
    if (toTime) updateData.toTime = convertTo12Hour(toTime);
    if (eventType) updateData.eventType = eventType;
    if (priority) updateData.priority = priority;
    if (eventImage !== undefined) updateData.eventImage = eventImage;
    if (visibleToAllVansh !== undefined) updateData.visibleToAllVansh = visibleToAllVansh === true;
    if (vansh !== undefined) updateData.vansh = vansh !== null && vansh !== '' ? Number(vansh) : null;
    updateData.updatedAt = new Date();
    
    await eventsCollection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: updateData }
    );
    
    const updatedEvent = await eventsCollection.findOne({ _id: new ObjectId(req.params.id) });
    
    res.json({ success: true, data: updatedEvent, message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ success: false, message: 'Failed to update event', error: error.message });
  }
});

// Delete event (protected)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const { ObjectId } = await import('mongodb');
    const db = req.app.locals.db || await req.app.locals.connectToMongo();
    const eventsCollection = db.collection('events');
    
    const event = await eventsCollection.findOne({ _id: new ObjectId(req.params.id) });
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    await eventsCollection.deleteOne({ _id: new ObjectId(req.params.id) });
    
    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ success: false, message: 'Failed to delete event', error: error.message });
  }
});

export default router;
