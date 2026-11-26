// components/RecentActivity.js
export default function RecentActivity() {
  const activities = [
    'New order #1234 received',
    'Inventory updated for Product A',
    'User John Doe registered',
    'Payment processed for Order #1233'
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200/60 overflow-hidden">
      <div className="px-4 py-4 sm:px-5 lg:p-6 border-b border-slate-100">
        <h3 className="text-base lg:text-xl font-bold text-slate-800 text-left">
          Recent Activity
        </h3>
      </div>
      <div className="px-2 sm:px-3 lg:px-4 py-1">
        <ul>
          {activities.map((activity, index) => (
            <li
              key={index}
              className={`flex items-center gap-3 px-3 py-3.5 lg:py-4 ${
                index !== activities.length - 1 ? "border-b border-slate-100" : ""
              }`}
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full shrink-0" />
              <span className="text-slate-600 text-sm flex-1 min-w-0">{activity}</span>
              <span className="text-slate-400 text-xs sm:text-sm shrink-0">
                {index + 1}h ago
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
