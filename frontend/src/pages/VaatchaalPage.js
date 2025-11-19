import React from 'react';

export default function VaatchaalPage() {
  return (
    <div className="p-8 max-w-3xl mx-auto">
      <h1 className="text-4xl font-bold mb-4 text-amber-700">Vaatchaal</h1>
      <p className="mb-6 text-lg text-gray-700">Vaatchaal is a platform for sharing stories, experiences, and creative works from the Gogte family. It celebrates our collective voice and encourages the expression of ideas, memories, and aspirations.</p>
      <ul className="list-disc pl-6 text-gray-800 mb-8">
        <li>Family stories and anecdotes</li>
        <li>Poems, essays, and creative writing</li>
        <li>Achievements and milestones</li>
        <li>Contributions from all generations</li>
      </ul>
      <div className="bg-amber-50 border-l-4 border-amber-400 p-4 rounded">
        <p className="text-amber-900 font-semibold">Submit your stories or creative works to be featured in Vaatchaal.</p>
      </div>
    </div>
  );
}
