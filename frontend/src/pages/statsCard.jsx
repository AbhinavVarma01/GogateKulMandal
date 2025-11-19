import { Users, GitBranch, Eye, TrendingUp } from 'lucide-react';

export function StatsCards({ stats = {} }) {
  const statsData = [
    {
      label: 'Total Members',
      value: stats.totalMembers || 0,
      icon: Users,
      bgColor: 'bg-orange-100',
      iconColor: 'text-orange-600'
    },
    {
      label: 'Living Members',
      value: stats.livingMembers || 0,
      icon: Eye,
      bgColor: 'bg-amber-100',
      iconColor: 'text-amber-600'
    },
    {
      label: 'Deceased Members',
      value: stats.deceasedMembers || 0,
      icon: GitBranch,
      bgColor: 'bg-yellow-100',
      iconColor: 'text-yellow-600'
    },
    {
      label: 'Recent Additions',
      value: stats.recentAdditions || 0,
      icon: TrendingUp,
      bgColor: 'bg-orange-200',
      iconColor: 'text-orange-700'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsData.map((stat, index) => (
        <div key={index} className={`${stat.bgColor} rounded-xl p-6 border border-orange-200`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[#a0651e] text-sm mb-1">{stat.label}</p>
              <p className="text-2xl text-[#8b4513]">{stat.value}</p>
            </div>
            <stat.icon className={`w-8 h-8 ${stat.iconColor}`} />
          </div>
        </div>
      ))}
    </div>
  );
}