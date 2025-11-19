import { useState } from 'react';
import { Plus, X, Image, Send } from 'lucide-react';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';

export function AddNewsModal({ onAddNews }) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (title && content && category) {
      onAddNews({
        title,
        content,
        category,
        imageUrl: imageUrl || undefined,
      });
      setTitle('');
      setContent('');
      setCategory('');
      setImageUrl('');
      setOpen(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg hover:shadow-xl transition-all duration-300">
          <Plus className="w-4 h-4 mr-2" />
          Share Family News
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-orange-900 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center mr-2">
              <Plus className="w-4 h-4 text-white" />
            </div>
            Share Family News
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-orange-900">News Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="What's the news about?"
              className="border-orange-200 focus:border-orange-400 bg-white"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category" className="text-orange-900">Category</Label>
            <Select value={category} onValueChange={setCategory} required>
              <SelectTrigger className="border-orange-200 focus:border-orange-400 bg-white">
                <SelectValue placeholder="Select news category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="celebration">Celebration</SelectItem>
                <SelectItem value="achievement">Achievement</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
                <SelectItem value="tradition">Tradition</SelectItem>
                <SelectItem value="milestone">Milestone</SelectItem>
                <SelectItem value="reunion">Family Reunion</SelectItem>
                <SelectItem value="memory">Memory</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="content" className="text-orange-900">News Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Share the details of your family news..."
              className="border-orange-200 focus:border-orange-400 bg-white min-h-[100px]"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="text-orange-900">Image URL (Optional)</Label>
            <Input
              id="imageUrl"
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="border-orange-200 focus:border-orange-400 bg-white"
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="border-orange-300 text-orange-700 hover:bg-orange-100"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white"
            >
              <Send className="w-4 h-4 mr-2" />
              Share News
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}