// app/dashboard/layout.js
import NavigationWrapper from '../components/NavigationWrapper';
import Topbar from '../components/Topbar';

export default function DashboardLayout({ children }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <NavigationWrapper />
      <Topbar />
      
      {/* Main Content - with proper spacing for fixed sidebar and topbar on desktop */}
      <main className="lg:ml-72 lg:pt-20 p-4 lg:p-8 pb-20 lg:pb-8 min-h-screen">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}