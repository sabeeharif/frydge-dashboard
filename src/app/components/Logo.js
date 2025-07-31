// components/Logo.js
export default function Logo({ isCollapsed }) {
  return (
    <div className={`flex items-center space-x-3 transition-opacity duration-300 ${
      isCollapsed ? 'opacity-0' : 'opacity-100'
    }`}>
      <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
        <span className="text-white font-bold text-lg">F</span>
      </div>
      {!isCollapsed && (
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          Frydge
        </h1>
      )}
    </div>
  );
}