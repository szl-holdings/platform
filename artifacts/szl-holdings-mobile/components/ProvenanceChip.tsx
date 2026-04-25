import { Feather } from '@expo/vector-icons';
import type React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { giColors, giSpacing } from '@/lib/gi-bridge';

export type ProvenanceStatus = 'live' | 'cached' | 'fallback' | 'loading';

interface Props {
  status: ProvenanceStatus;
  label?: string;
  lastUpdated?: string;
}

const CONFIG: Record<
  ProvenanceStatus,
  { color: string; icon: React.ComponentProps<typeof Feather>['name']; defaultLabel: string }
> = {
  live:     { color: giColors.accent.green,  icon: 'radio',         defaultLabel: 'Live'    },
  cached:   { color: giColors.accent.blue,   icon: 'database',      defaultLabel: 'Cached'  },
  fallback: { color: giColors.accent.amber,  icon: 'alert-circle',  defaultLabel: 'Demo'    },
  loading:  { color: giColors.text.muted,    icon: 'loader',        defaultLabel: 'Loading' },
};

export function ProvenanceChip({ status, label, lastUpdated }: Props) {
  const { color, icon, defaultLabel } = CONFIG[status];
  const text = label ?? defaultLabel;

  return (
    <View style={[styles.chip, { borderColor: `${color}40`, backgroundColor: `${color}12` }]}>
      <Feather name={icon} size={9} color={color} />
      <Text style={[styles.label, { color }]}>{text}</Text>
      {lastUpdated && (
        <Text style={[styles.updated, { color: `${color}aa` }]}>{lastUpdated}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: giSpacing[1],
    paddingHorizontal: giSpacing[2],
    paddingVertical: giSpacing[1],
    borderRadius: 100,
    borderWidth: 1,
  },
  label: { fontSize: 9, fontFamily: 'Inter_500Medium', letterSpacing: 0.5 },
  updated: { fontSize: 8, fontFamily: 'Inter_300Light' },
});
