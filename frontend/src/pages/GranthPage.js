import React from 'react';

export default function GranthPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 text-amber-700">Granth</h1>
      <p className="mb-6 text-lg text-gray-700">The Granth is a treasured compilation of our family history, traditions, and stories. It preserves the wisdom, values, and achievements of generations, serving as a guide and inspiration for the present and future.</p>
      <ul className="list-disc pl-6 text-gray-800 mb-8">
        <li>Historical records and family trees</li>
        <li>Biographies of notable ancestors</li>
        <li>Important events and milestones</li>
        <li>Photographs and rare documents</li>
      </ul>
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
        <p className="text-amber-900 font-semibold">To contribute to the Granth or request a copy, please contact the Kulvruttant Samiti.</p>
      </div>
    </div>
  );
}
