// components/StatsGrid.js
export default function StatsGrid() {
  const stats = [
    { title: 'Total Orders', value: '1,234', change: '+12%', color: 'blue' },
    { title: 'Revenue', value: '$45,678', change: '+8%', color: 'green' },
    { title: 'Inventory Items', value: '567', change: '-3%', color: 'purple' },
    { title: 'Active Users', value: '89', change: '+15%', color: 'orange' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <div key={index} className="bg-white rounded-xl p-6 shadow-lg border border-slate-200/50 hover:shadow-xl transition-all duration-300">
          <h3 className="text-slate-600 text-sm font-medium mb-2">{stat.title}</h3>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold text-slate-800">{stat.value}</span>
            <span className={`text-sm font-medium px-2 py-1 rounded-lg ${
              stat.change.startsWith('+') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {stat.change}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}