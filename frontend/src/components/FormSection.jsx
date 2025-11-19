import React from 'react';

const FormSection = ({ title, children }) => (
  <section
    aria-label={title}
    className="rounded-3xl bg-white p-8 shadow-card ring-1 ring-slate-100"
  >
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-slate-900">{title}</h2>
      {children}
    </div>
  </section>
);

export default FormSection;