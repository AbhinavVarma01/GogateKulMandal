import React from 'react';

export default function NewsEventsPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 text-amber-700">News & Events</h1>
      <p className="mb-6 text-lg text-gray-700">Stay updated with the latest news, announcements, and upcoming events in the Gogte family. This page features celebrations, achievements, and important updates for all members.</p>
      <ul className="list-disc pl-6 text-gray-800 mb-8">
        <li>Annual family reunion details</li>
        <li>Recent achievements and milestones</li>
        <li>Upcoming festivals and gatherings</li>
        <li>Announcements from the Samiti</li>
      </ul>
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
        <p className="text-amber-900 font-semibold">Check back regularly for the latest updates and event information.</p>
      </div>
    </div>
  );
}
