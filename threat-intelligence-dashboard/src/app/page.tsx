import React from 'react';
import IpInputForm from '@/components/IpInputForm';
import ThreatDataDisplay from '@/components/ThreatDataDisplay';
import SearchHistory from '@/components/SearchHistory';
import { APP_STRINGS } from '@/utils/strings';
import ReduxProvider from './ReduxProvider';

// Layout classes
const MAIN_CONTAINER_CLASSES = 'min-h-screen bg-gray-100 py-10';
const DASHBOARD_HEADER_CLASSES = 'text-3xl font-extrabold text-gray-900 mb-8 text-center';

const HomePage: React.FC = () => {
  return (
    <ReduxProvider>
      <main className={MAIN_CONTAINER_CLASSES}>
        <h1 className={DASHBOARD_HEADER_CLASSES}>
          {APP_STRINGS.APP_TITLE}
        </h1>

        <div className="container mx-auto px-4">
          <IpInputForm />
          <ThreatDataDisplay />
          <SearchHistory />
        </div>
      </main>
    </ReduxProvider>
  );
};

export default HomePage;