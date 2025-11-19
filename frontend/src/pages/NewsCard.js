import { Heart, MessageCircle, Share2, Clock, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar } from '../components/ui/avatar';

export function NewsCard({ news }) {
  const { t } = useTranslation();
  return (
    <Card className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Decorative border pattern */}
      <div className="h-2 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-400"></div>
      
      <div className="p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Avatar className="w-12 h-12">
              <div className="w-full h-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-bold">
                {news.author.charAt(0).toUpperCase()}
              </div>
            </Avatar>
            <div>
              <h3 className="font-semibold text-orange-900">{news.author}</h3>
              <div className="flex items-center space-x-2 text-sm text-orange-700">
                <Clock className="w-3 h-3" />
                <span>{news.timestamp}</span>
                <span>•</span>
                <span className="bg-orange-200 px-2 py-1 rounded-full text-xs">{news.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-orange-900 mb-2">{news.title}</h2>
          <p className="text-orange-800 leading-relaxed">{news.content}</p>
        </div>

        {/* Image if present */}
        {news.imageUrl && (
          <div className="mb-4 rounded-lg overflow-hidden border-2 border-orange-200">
            <img 
              src={news.imageUrl} 
              alt={news.title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-orange-200">
          <div className="flex items-center space-x-6">
            <Button variant="ghost" size="sm" className="text-orange-700 hover:text-red-600 hover:bg-red-50">
              <Heart className="w-4 h-4 mr-1" />
              <span>{news.likes}</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-orange-700 hover:text-orange-900 hover:bg-orange-100">
              <MessageCircle className="w-4 h-4 mr-1" />
              <span>{news.comments}</span>
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="text-orange-700 hover:text-orange-900 hover:bg-orange-100">
            <Share2 className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}