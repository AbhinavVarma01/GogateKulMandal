import { Heart, MessageCircle, Share2, Clock, User, Camera, MapPin, Calendar } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Avatar } from '../components/ui/avatar';

export function PhotoCard({ photo }) {
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
                {photo.photographer.charAt(0).toUpperCase()}
              </div>
            </Avatar>
            <div>
              <h3 className="font-semibold text-orange-900">{photo.photographer}</h3>
              <div className="flex items-center space-x-2 text-sm text-orange-700">
                <Clock className="w-3 h-3" />
                <span>{photo.timestamp}</span>
                <span>•</span>
                <span className="bg-orange-200 px-2 py-1 rounded-full text-xs">{photo.category}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Photo */}
        {photo.imageUrl && (
          <div className="mb-4 rounded-lg overflow-hidden border-2 border-orange-200">
            <img 
              src={photo.imageUrl} 
              alt={photo.title}
              className="w-full h-48 object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-orange-900 mb-2">{photo.title}</h2>
          <p className="text-orange-800 leading-relaxed">{photo.description}</p>
        </div>

        {/* Photo Details */}
        <div className="mb-4 space-y-2">
          {photo.location && (
            <div className="flex items-center text-sm text-orange-700">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{photo.location}</span>
            </div>
          )}
          {photo.eventDate && (
            <div className="flex items-center text-sm text-orange-700">
              <Calendar className="w-4 h-4 mr-2" />
              <span>{new Date(photo.eventDate).toLocaleDateString()}</span>
            </div>
          )}
          {photo.generation && (
            <div className="flex items-center text-sm text-orange-700">
              <Camera className="w-4 h-4 mr-2" />
              <span>{photo.generation}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {photo.tags && photo.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {photo.tags.map((tag, index) => (
              <span key={index} className="bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-orange-200">
          <div className="flex items-center space-x-6">
            <Button variant="ghost" size="sm" className="text-orange-700 hover:text-red-600 hover:bg-red-50">
              <Heart className="w-4 h-4 mr-1" />
              <span>{photo.likes}</span>
            </Button>
            <Button variant="ghost" size="sm" className="text-orange-700 hover:text-orange-900 hover:bg-orange-100">
              <MessageCircle className="w-4 h-4 mr-1" />
              <span>{photo.comments}</span>
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
