import { Database, BarChart3, Users, Package, Settings } from 'lucide-react';

export function Sidebar() {
  const menuItems = [
    { icon: BarChart3, label: 'Dashboard', active: true },
    { icon: Users, label: 'Family Members', active: false },
    { icon: Package, label: 'Genealogy', active: false },
    { icon: Settings, label: 'Settings', active: false },
  ];

  return (
    <div className="w-64 bg-gradient-to-b from-[#b8410e] to-[#c4601e] text-white p-6">
      {/* Logo */}
      <div className="flex items-center gap-3 mb-8">
        <Database className="w-8 h-8" />
        <h1 className="text-xl font-semibold">Spiritual DBA</h1>
      </div>

      {/* Navigation */}
      <nav className="space-y-2">
        {menuItems.map((item, index) => (
          <button
            key={index}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
              item.active
                ? 'bg-[#a73b10] bg-opacity-70'
                : 'hover:bg-white hover:bg-opacity-10'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}