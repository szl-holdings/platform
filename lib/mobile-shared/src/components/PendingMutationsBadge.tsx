import { useContext } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SyncEngineContext } from '../context/SyncEngineContext';

interface Props {
  color?: string;
  textColor?: string;
  size?: number;
}

export function PendingMutationsBadge({ color = '#6366f1', textColor = '#fff', size = 18 }: Props) {
  const ctx = useContext(SyncEngineContext);
  const pending = ctx?.pending ?? 0;
  const conflicts = ctx?.conflicts?.length ?? 0;
  const total = pending + conflicts;

  if (total === 0) return null;

  const badgeColor = conflicts > 0 ? '#ef4444' : color;
  const label = total > 99 ? '99+' : String(total);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: badgeColor,
          width: size,
          height: size,
          borderRadius: size / 2,
        },
      ]}
    >
      <Text style={[styles.text, { color: textColor, fontSize: size * 0.55 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '700',
    lineHeight: undefined,
  },
});
