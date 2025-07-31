// components/RecentActivity.js
export default function RecentActivity() {
  const activities = [
    'New order #1234 received',
    'Inventory updated for Product A',
    'User John Doe registered',
    'Payment processed for Order #1233'
  ];

  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-200/50 overflow-hidden">
      <div className="p-6 border-b border-slate-200/50">
        <h2 className="text-xl font-bold text-slate-800">Recent Activity</h2>
      </div>
      <div className="p-6">
        <div className="space-y-4">
          {activities.map((activity, index) => (
            <div key={index} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-slate-50 transition-colors duration-200">
              <div className="w-2 h-2 bg-blue-500 rounded-full" />
              <span className="text-slate-700">{activity}</span>
              <span className="text-slate-400 text-sm ml-auto">{index + 1}h ago</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}