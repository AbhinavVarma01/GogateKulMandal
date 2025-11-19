import { useState, useRef } from 'react';
import { Plus, X, Image, Send, Upload, Camera, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Label } from '../components/ui/label';

export function AddPhotoModal({ onAddPhoto }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedImages, setUploadedImages] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [tags, setTags] = useState('');
  const fileInputRef = useRef(null);

  const categories = [
    { value: 'heritage', label: 'Heritage' },
    { value: 'celebration', label: 'Celebration' },
    { value: 'wedding', label: 'Wedding' },
    { value: 'festival', label: 'Festival' },
    { value: 'family', label: 'Family Gathering' },
    { value: 'achievement', label: 'Achievement' },
    { value: 'memory', label: 'Memory' },
    { value: 'general', label: 'General' }
  ];


  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const newImages = [...uploadedImages, ...files];
      setUploadedImages(newImages);
      
      // Create previews for all images
      const newPreviews = [];
      files.forEach((file, index) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push(e.target.result);
          if (newPreviews.length === files.length) {
            setImagePreviews(prev => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleRemoveImage = (index) => {
    const newImages = uploadedImages.filter((_, i) => i !== index);
    const newPreviews = imagePreviews.filter((_, i) => i !== index);
    setUploadedImages(newImages);
    setImagePreviews(newPreviews);
  };

  const handleRemoveAllImages = () => {
    setUploadedImages([]);
    setImagePreviews([]);
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (title && description && category && uploadedImages.length > 0) {
      setIsSubmitting(true);
      
      try {
        // Prepare data with actual file objects
        const photoData = {
          title,
          description,
          category,
          photographer: "Family Member",
          location,
          eventDate,
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
          generation: '2020s',
          occasion: 'General',
          files: uploadedImages // Pass the actual File objects
        };
        
        await onAddPhoto(photoData);
        
        // Reset form
        setTitle('');
        setDescription('');
        setCategory('');
        setImageUrl('');
        setUploadedImages([]);
        setImagePreviews([]);
        setLocation('');
        setEventDate('');
        setTags('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setOpen(false);
      } catch (error) {
        console.error('Error submitting photos:', error);
        alert('Failed to upload photos. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      alert('Please fill in all required fields and upload at least one image.');
    }
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
      >
        <Plus className="w-4 h-4 mr-2" />
        Add Family Photos
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[800px] bg-gradient-to-br from-amber-50 to-orange-100 rounded-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-orange-200 p-6">
            <DialogTitle className="text-3xl font-bold text-amber-800 flex items-center mb-2">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center mr-4">
                <Camera className="w-6 h-6 text-white" />
              </div>
              Add Your Family Photos
            </DialogTitle>
            <p className="text-amber-700 text-sm">Upload multiple photos and share detailed information about your family's precious moments</p>
          </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 p-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-amber-800 text-lg font-medium">Photo Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a descriptive title for your photos"
              className="border-orange-200 focus:border-amber-500 bg-white text-gray-900 placeholder-gray-500"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category" className="text-amber-800 text-lg font-medium">Category</Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-orange-200 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 bg-white text-gray-900"
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="description" className="text-amber-800 text-lg font-medium">Description</Label>
              <span className="text-sm text-amber-600">{description.length}/500</span>
            </div>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the photos, the people in them, the occasion, and any special memories..."
              className="border-orange-200 focus:border-amber-500 bg-white text-gray-900 placeholder-gray-500 min-h-[100px]"
              maxLength={500}
              required
            />
          </div>

          {/* Additional Details Section */}
          <div className="border-t border-orange-200 pt-6">
            <h3 className="text-xl font-semibold text-amber-800 mb-6">Photo Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-amber-800 text-lg font-medium">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where were these photos taken? (e.g., Mumbai, India)"
                  className="border-orange-200 focus:border-amber-500 bg-white text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Event Date */}
              <div className="space-y-2">
                <Label htmlFor="eventDate" className="text-amber-800 text-lg font-medium">Event Date</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="border-orange-200 focus:border-amber-500 bg-white text-gray-900"
                />
              </div>

            </div>

            {/* Tags */}
            <div className="space-y-2 mt-6">
              <Label htmlFor="tags" className="text-amber-800 text-lg font-medium">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Enter tags separated by commas (e.g., wedding, celebration, family, heritage)"
                className="border-orange-200 focus:border-amber-500 bg-white text-gray-900 placeholder-gray-500"
              />
              <p className="text-xs text-amber-600">Tags help others find your photos easily</p>
            </div>
          </div>
          
          {/* Image Upload Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-amber-800 text-xl font-medium">Add Photos</Label>
              {imagePreviews.length > 0 && (
                <button
                  type="button"
                  onClick={handleRemoveAllImages}
                  className="text-red-500 hover:text-red-600 text-sm flex items-center"
                >
                  <X className="w-4 h-4 mr-1" />
                  Remove All
                </button>
              )}
            </div>
            
            {/* Image Previews Grid */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img 
                      src={preview} 
                      alt={`Preview ${index + 1}`} 
                      className="w-full h-32 object-cover rounded-xl border-2 border-orange-200"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                      {index + 1}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Upload Options */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* File Upload */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="imageUpload"
                  multiple
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-orange-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 bg-white"
                >
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Multiple Photos
                </Button>
              </div>
              
              {/* OR Divider */}
              <div className="flex items-center justify-center text-amber-600 font-medium">
                OR
              </div>
              
              {/* URL Input */}
              <div className="flex-1">
                <Input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image URL"
                  className="border-orange-200 focus:border-amber-500 bg-white text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>
            
            {imagePreviews.length > 0 && (
              <div className="text-center text-amber-600 text-sm">
                {imagePreviews.length} photo{imagePreviews.length > 1 ? 's' : ''} selected
              </div>
            )}
          </div>
          
          <div className="flex justify-end space-x-4 pt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-orange-200 text-amber-700 hover:bg-amber-50 hover:text-amber-800 bg-white"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-amber-500 hover:bg-amber-600 text-white disabled:opacity-50 disabled:cursor-not-allowed px-8"
            >
                  {isSubmitting ? (
                <> 
                  <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload Photos
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
      </Dialog>
    </>
  );
}
