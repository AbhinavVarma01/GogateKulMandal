import React from 'react';

export default function RemembranceDayPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 text-amber-700">Remembrance Day</h1>
      <p className="mb-6 text-lg text-gray-700">Remembrance Day honors the memory of our ancestors and departed loved ones. It is a time for reflection, gratitude, and the celebration of their lasting legacy within the Gogte family.</p>
      <ul className="list-disc pl-6 text-gray-800 mb-8">
        <li>Memorial services and rituals</li>
        <li>Stories and tributes from family members</li>
        <li>Moments of silence and remembrance</li>
        <li>Preserving memories for future generations</li>
      </ul>
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
        <p className="text-amber-900 font-semibold">Share your memories or tributes with the family to keep their legacy alive.</p>
      </div>
    </div>
  );
}
