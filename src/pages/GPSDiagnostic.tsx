import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import GPSDiagnosticPanel from '@/components/GPSDiagnosticPanel';
import { ArrowLeft } from 'lucide-react';

export const GPSDiagnosticPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-4xl mx-auto space-y-4">
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        
        <div className="space-y-4">
          <div>
            <h1 className="text-3xl font-bold">GPS Diagnostic Tool</h1>
            <p className="text-muted-foreground mt-2">
              Use this tool to troubleshoot GPS accuracy issues. Access via: <code className="bg-muted px-2 py-1 rounded">/gps-diagnostic</code>
            </p>
          </div>

          <GPSDiagnosticPanel />

          <div className="p-4 bg-muted rounded-lg text-sm space-y-3">
            <p className="font-semibold">🔍 Troubleshooting Tips:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>Desktop/Laptop:</strong> Browsers use IP-based location (~500-2000m accuracy). This is normal.</li>
              <li><strong>Mobile Indoors:</strong> GPS needs clear sky view. Indoor accuracy: 50-200m.</li>
              <li><strong>First Fix Delay:</strong> GPS can take 5-30 seconds to acquire satellites after device restart.</li>
              <li><strong>Accuracy &lt; 20m:</strong> Excellent! Safe for turn-by-turn navigation.</li>
              <li><strong>Accuracy 20-50m:</strong> Good enough for most transit tracking.</li>
              <li><strong>Accuracy &gt; 100m:</strong> Poor signal. Move outdoors or wait longer.</li>
            </ul>
            <p className="text-xs mt-3">
              <strong>Note:</strong> The app has been configured to reject positions with accuracy worse than 100m 
              to prevent inaccurate location display on the map.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPSDiagnosticPage;
