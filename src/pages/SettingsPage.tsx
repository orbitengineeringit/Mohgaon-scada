import React, { lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

const DataExportSettings = lazy(() => import('@/components/DataExportSettings'));

const SettingsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background grid-pattern">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Settings className="h-6 w-6 text-primary" />
              Settings
            </h1>
            <p className="text-sm text-muted-foreground mt-1">Data export & retention settings</p>
          </div>
        </div>

        <Suspense fallback={<Skeleton className="h-64 w-full rounded-lg" />}>
          <DataExportSettings />
        </Suspense>
      </div>
    </div>
  );
};

export default SettingsPage;
