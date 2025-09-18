
import BottomNav from '../components/BottomNav';
import TopNavConsumer from '../components/TopNavConsumer';

const PublicLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top navigation for desktop */}
      <TopNavConsumer />
      
      {/* Main content */}
      <main className="pb-20 md:pb-0">
        <div className="md:pt-0">
          {children}
        </div>
      </main>

      {/* Bottom navigation for mobile */}
      <BottomNav />
    </div>
  );
};

export default PublicLayout;