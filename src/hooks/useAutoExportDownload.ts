import { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logError } from '@/lib/errorLogger';

/**
 * Checks for pending data exports on app load.
 * If an export exists that hasn't been downloaded, prompts the user to download it.
 */
export const useAutoExportDownload = () => {
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    const checkPendingExports = async () => {
      try {
        const { data: pendingExports } = await supabase
          .from('data_exports')
          .select('*')
          .eq('downloaded', false)
          .eq('status', 'exported')
          .order('created_at', { ascending: false })
          .limit(1);

        if (pendingExports && pendingExports.length > 0) {
          const exp = pendingExports[0] as any;

          toast.info(
            `📊 Data export available (${exp.record_count?.toLocaleString() || 0} records)`,
            {
              duration: 15000,
              action: {
                label: 'Download Now',
                onClick: async () => {
                  try {
                    const { data } = await supabase.functions.invoke('export-historian-data', {
                      body: { action: 'get_download_url', filePath: exp.file_path },
                    });

                    if (data?.downloadUrl) {
                      window.open(data.downloadUrl, '_blank');

                      await supabase.functions.invoke('export-historian-data', {
                        body: { action: 'mark_downloaded', exportId: exp.id },
                      });

                      toast.success('Download started — export confirmed');
                    }
                  } catch (error) {
                    logError('AutoExportDownload', error);
                    toast.error('Failed to download export');
                  }
                },
              },
            }
          );
        }
      } catch (error) {
        logError('AutoExportDownload.check', error);
      }
    };

    // Check after a short delay (don't block initial render)
    const timer = setTimeout(checkPendingExports, 5000);
    return () => clearTimeout(timer);
  }, []);
};
