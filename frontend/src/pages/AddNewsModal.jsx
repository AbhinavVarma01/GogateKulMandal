import { useState, useRef } from 'react';
import { Plus, X, Image, Send, Upload, Camera, RefreshCw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { CustomSelect } from '../components/ui/select';
import { Label } from '../components/ui/label';

export function AddNewsModal({ onAddNews }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [author, setAuthor] = useState('');
  const [location, setLocation] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [tags, setTags] = useState('');
  const fileInputRef = useRef(null);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
    setImageUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted with:', { title, content, category, imageUrl, imagePreview });
    
    if (title && content && category) {
      setIsSubmitting(true);
      
      try {
        const newsData = {
          title,
          content,
          category,
          imageUrl: imageUrl || (imagePreview ? imagePreview : undefined),
          uploadedImage: uploadedImage || undefined,
          author: author || "Family Member",
          location,
          eventDate,
          tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        };
        console.log('Calling onAddNews with:', newsData);
        onAddNews(newsData);
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Reset form
        setTitle('');
        setContent('');
        setCategory('');
        setImageUrl('');
        setUploadedImage(null);
        setImagePreview(null);
        setAuthor('');
        setLocation('');
        setEventDate('');
        setTags('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        setOpen(false);
      } catch (error) {
        console.error('Error submitting news:', error);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      console.log('Form validation failed:', { title: !!title, content: !!content, category: !!category });
    }
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-6 py-3 text-lg font-semibold"
      >
        <Plus className="w-5 h-5 mr-2" />
        Share Family News
      </Button>
      
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[700px] bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-orange-900 flex items-center mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mr-3">
                <Plus className="w-5 h-5 text-white" />
              </div>
              Share Your Family Story
            </DialogTitle>
            <p className="text-orange-700 text-sm">Share detailed information about family events, achievements, celebrations, and memorable moments</p>
          </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-orange-900">{t('newsPage.addNewsModal.newsTitle')}</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t('newsPage.addNewsModal.newsTitlePlaceholder')}
              className="border-orange-200 focus:border-orange-400 bg-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category" className="text-orange-900">{t('newsPage.addNewsModal.category')}</Label>
            <CustomSelect 
              value={category} 
              onValueChange={setCategory} 
              placeholder={t('newsPage.addNewsModal.selectCategory')}
              className="border-orange-200 focus:border-orange-400 bg-white"
            >
              <div value="celebration">{t('newsPage.categories.celebration')}</div>
              <div value="achievement">{t('newsPage.categories.achievement')}</div>
              <div value="announcement">{t('newsPage.categories.announcement')}</div>
              <div value="tradition">{t('newsPage.categories.tradition')}</div>
              <div value="milestone">{t('newsPage.categories.milestone')}</div>
              <div value="reunion">{t('newsPage.categories.reunion')}</div>
              <div value="memory">{t('newsPage.categories.memory')}</div>
              <div value="general">{t('newsPage.categories.general')}</div>
            </CustomSelect>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="content" className="text-orange-900">{t('newsPage.addNewsModal.content')}</Label>
              <span className="text-sm text-orange-600">{content.length}/500</span>
            </div>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={t('newsPage.addNewsModal.contentPlaceholder')}
              className="border-orange-200 focus:border-orange-400 bg-white min-h-[100px]"
              maxLength={500}
              required
            />
          </div>

          {/* Additional Details Section */}
          <div className="border-t border-orange-200 pt-4">
            <h3 className="text-lg font-semibold text-orange-900 mb-4">Additional Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Author */}
              <div className="space-y-2">
                <Label htmlFor="author" className="text-orange-900">Author/Reporter</Label>
                <Input
                  id="author"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Your name or who is sharing this story"
                  className="border-orange-200 focus:border-orange-400 bg-white"
                />
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location" className="text-orange-900">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Where did this happen? (e.g., Mumbai, India)"
                  className="border-orange-200 focus:border-orange-400 bg-white"
                />
              </div>

              {/* Event Date */}
              <div className="space-y-2">
                <Label htmlFor="eventDate" className="text-orange-900">Event Date</Label>
                <Input
                  id="eventDate"
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="border-orange-200 focus:border-orange-400 bg-white"
                />
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-2 mt-4">
              <Label htmlFor="tags" className="text-orange-900">Tags</Label>
              <Input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="Enter tags separated by commas (e.g., wedding, celebration, achievement)"
                className="border-orange-200 focus:border-orange-400 bg-white"
              />
              <p className="text-xs text-orange-600">Tags help others find your story easily</p>
            </div>

          </div>
          
          {/* Image Upload Section */}
          <div className="space-y-4">
            <Label className="text-orange-900">Add Image</Label>
            
            {/* Image Preview */}
            {imagePreview && (
              <div className="relative">
                <img 
                  src={imagePreview} 
                  alt="Preview" 
                  className="w-full h-48 object-cover rounded-lg border border-orange-200"
                />
                <button
                  type="button"
                  onClick={handleRemoveImage}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            
            {/* Upload Options */}
            <div className="flex flex-col sm:flex-row gap-3">
              {/* File Upload */}
              <div className="flex-1">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="imageUpload"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Image
                </Button>
              </div>
              
              {/* OR Divider */}
              <div className="flex items-center justify-center text-orange-500 font-medium">
                OR
              </div>
              
              {/* URL Input */}
              <div className="flex-1">
                <Input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Paste image URL"
                  className="border-orange-200 focus:border-orange-400 bg-white"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <X className="w-4 h-4 mr-2" />
              {t('newsPage.addNewsModal.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Sharing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  {t('newsPage.addNewsModal.shareNews')}
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