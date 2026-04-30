import { ForecastPanel } from '@/components/ForecastPanel';

export default function ForecastPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-foreground">Forecast Fabric</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Multi-horizon interval forecasts with calibrated confidence bounds across all Vessels maritime-intelligence heads.
        </p>
      </div>
      <ForecastPanel />
    </div>
  );
}
