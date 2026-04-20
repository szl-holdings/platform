import { useLyte } from '@/context/LyteContext';
import { useNotifications } from '@/context/NotificationContext';
import { useCriticalAlertNotifier } from '@/hooks/useCriticalAlertNotifier';

export function AlertNotifierBridge() {
  const { signals } = useLyte();
  const { permissionGranted, preferences } = useNotifications();
  useCriticalAlertNotifier(signals, permissionGranted, preferences);
  return null;
}
