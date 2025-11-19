import { useState } from 'react';
import { NewsCard } from './NewsCard';
import { AddNewsModal } from './AddNewsModal';

export default function App() {
  const [news, setNews] = useState([
    {
      id: '1',
      title: 'Wedding Bells Ring for Priya and Arjun!',
      content: 'We are delighted to announce the marriage of Priya Gogte and Arjun Sharma. The beautiful ceremony was held at the ancestral temple, following all traditional rituals. The entire family came together to celebrate this joyous occasion with great pomp and grandeur.',
      author: 'Rajesh Gogte',
      timestamp: '2 hours ago',
      likes: 24,
      comments: 8,
      imageUrl: 'https://images.unsplash.com/photo-1586934280706-262a90ddd743?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0cmFkaXRpb25hbCUyMGluZGlhbiUyMHdlZGRpbmd8ZW58MXx8fHwxNzU3MTg2NDE3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      category: 'celebration'
    },
    {
      id: '2',
      title: 'Ananya Graduates with Honors in Engineering',
      content: 'Proud to share that our beloved Ananya has graduated with highest honors from IIT Mumbai with a degree in Computer Science Engineering. She has also received multiple offers from top tech companies. The family is incredibly proud of her achievements.',
      author: 'Meera Gogte',
      timestamp: '1 day ago',
      likes: 45,
      comments: 15,
      imageUrl: 'https://images.unsplash.com/photo-1590012314607-cda9d9b699ae?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxncmFkdWF0aW9uJTIwY2VyZW1vbnl8ZW58MXx8fHwxNzU3MTc2MTU2fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      category: 'achievement'
    },
    {
      id: '3',
      title: 'Annual Family Reunion Planning Begins',
      content: 'The organizing committee for our annual family reunion has been formed. This year\'s reunion will be held in Goa from December 15-17. We expect over 150 family members to attend. Registration opens next week with early bird discounts available.',
      author: 'Sunil Gogte',
      timestamp: '3 days ago',
      likes: 18,
      comments: 12,
      category: 'announcement'
    },
    {
      id: '4',
      title: 'Grandpa\'s 90th Birthday Celebration',
      content: 'Join us in celebrating our beloved patriarch\'s 90th birthday! The celebration will include traditional prayers, family stories, and a grand feast. His wisdom and guidance have been the foundation of our family\'s success across generations.',
      author: 'Kavita Gogte',
      timestamp: '5 days ago',
      likes: 67,
      comments: 23,
      imageUrl: 'https://images.unsplash.com/photo-1704927768400-abefa412fd31?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmRpYW4lMjBmYW1pbHklMjBjZWxlYnJhdGlvbnxlbnwxfHx8fDE3NTcxODY0MTR8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral',
      category: 'milestone'
    },
    {
      id: '5',
      title: 'New Addition to Our Family Tree',
      content: 'We welcome baby Aditya born to Rohit and Sneha Gogte on January 8th. Both mother and baby are healthy and doing well. This is their first child and our family\'s newest member. May he bring joy and prosperity to our lineage.',
      author: 'Ashish Gogte',
      timestamp: '1 week ago',
      likes: 89,
      comments: 34,
      category: 'celebration'
    }
  ]);

  const handleAddNews = (newNews) => {
    const newsItem = {
      id: Date.now().toString(),
      title: newNews.title,
      content: newNews.content,
      author: 'Family Member', // In a real app, this would be the logged-in user
      timestamp: 'Just now',
      likes: 0,
      comments: 0,
      imageUrl: newNews.imageUrl,
      category: newNews.category
    };
    
    setNews([newsItem, ...news]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-amber-50 to-yellow-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Family News & Updates</h1>
            <p className="text-xl text-orange-100 max-w-2xl mx-auto">
              Stay connected with your family heritage. Share moments, celebrate achievements, and preserve memories for future generations.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Add News Section */}
        <div className="mb-8 flex justify-center">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-orange-200">
            <div className="text-center mb-4">
              <h2 className="text-2xl font-bold text-orange-900 mb-2">Share Your Family Story</h2>
              <p className="text-orange-700">Have something special to share with the family? Let everyone know!</p>
            </div>
            <AddNewsModal onAddNews={handleAddNews} />
          </div>
        </div>

        <div className="my-8 h-px bg-orange-200"></div>

        {/* News Feed */}
        <div className="space-y-6">
          <div className="text-center mb-6">
            <h2 className="text-3xl font-bold text-orange-900 mb-2">Latest Family News</h2>
            <p className="text-orange-700">Catch up on what's happening in our family</p>
          </div>
          
          <div className="max-h-[800px] overflow-y-auto">
            <div className="space-y-6 pr-4">
              {news.map((item) => (
                <NewsCard key={item.id} news={item} />
              ))}
            </div>
          </div>
        </div>

        {/* Family Stats */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white p-6 rounded-xl shadow-lg text-center">
            <div className="text-3xl font-bold mb-2">{news.length}</div>
            <div className="text-orange-100">Total News Shared</div>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-yellow-500 text-white p-6 rounded-xl shadow-lg text-center">
            <div className="text-3xl font-bold mb-2">{news.reduce((acc, item) => acc + item.likes, 0)}</div>
            <div className="text-amber-100">Total Hearts</div>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-red-500 text-white p-6 rounded-xl shadow-lg text-center">
            <div className="text-3xl font-bold mb-2">{news.reduce((acc, item) => acc + item.comments, 0)}</div>
            <div className="text-orange-100">Total Comments</div>
          </div>
        </div>
      </div>
    </div>
  );
}