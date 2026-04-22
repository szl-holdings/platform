import { Feather } from '@expo/vector-icons';

type FeatherIconName =
  | 'alert-circle'
  | 'alert-triangle'
  | 'anchor'
  | 'arrow-left'
  | 'arrow-right'
  | 'bar-chart-2'
  | 'bell'
  | 'calendar'
  | 'check-circle'
  | 'chevron-right'
  | 'circle'
  | 'clock'
  | 'cloud'
  | 'compass'
  | 'dollar-sign'
  | 'eye-off'
  | 'globe'
  | 'info'
  | 'log-in'
  | 'log-out'
  | 'map'
  | 'map-pin'
  | 'navigation'
  | 'radio'
  | 'refresh-cw'
  | 'search'
  | 'server'
  | 'shield'
  | 'shield-off'
  | 'tool'
  | 'trending-up'
  | 'user'
  | 'wifi'
  | 'wifi-off'
  | 'wind'
  | 'x'
  | 'x-circle'
  | 'zap';

interface VesselIconProps {
  name: FeatherIconName;
  size?: number;
  color?: string;
  style?: object;
}

export function VesselIcon({ name, size = 16, color = '#e0f2fe', style }: VesselIconProps) {
  return <Feather name={name} size={size} color={color} style={style} />;
}

export function featherIcon(name: string): FeatherIconName {
  const valid: FeatherIconName[] = [
    'alert-circle',
    'alert-triangle',
    'anchor',
    'arrow-left',
    'arrow-right',
    'bar-chart-2',
    'bell',
    'calendar',
    'check-circle',
    'chevron-right',
    'circle',
    'clock',
    'cloud',
    'compass',
    'dollar-sign',
    'eye-off',
    'globe',
    'info',
    'log-in',
    'log-out',
    'map',
    'map-pin',
    'navigation',
    'radio',
    'refresh-cw',
    'search',
    'server',
    'shield',
    'shield-off',
    'tool',
    'trending-up',
    'user',
    'wifi',
    'wifi-off',
    'wind',
    'x',
    'x-circle',
    'zap',
  ];
  return valid.includes(name as FeatherIconName) ? (name as FeatherIconName) : 'alert-circle';
}
