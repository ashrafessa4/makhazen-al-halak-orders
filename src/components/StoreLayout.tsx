
import { ReactNode } from 'react';

interface StoreLayoutProps {
  children: ReactNode;
}

const StoreLayout = ({ children }: StoreLayoutProps) => {
  return (
    <div className="min-h-screen relative pb-24 lg:pb-8">
      {/* Enhanced Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50"></div>
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1585747733461-0524ba8de5ad?w=1200&h=800&fit=crop')] bg-cover bg-center opacity-3 blur-sm"></div>
      <div className="absolute inset-0 bg-gradient-to-t from-white/20 to-transparent"></div>
      
      <div className="container mx-auto px-4 py-6 sm:py-8 relative z-10">
        {children}
      </div>
    </div>
  );
};

export default StoreLayout;
