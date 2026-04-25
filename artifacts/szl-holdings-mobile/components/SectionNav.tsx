
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';
import { giColors, giSpacing } from '@/lib/gi-bridge';

export interface Section {
  id: string;
  label: string;
  icon?: string;
}

interface SectionNavProps {
  sections: Section[];
  activeId: string;
  onSelect: (id: string) => void;
  containerStyle?: object;
  accentColor?: string;
}

export function SectionNav({
  sections,
  activeId,
  onSelect,
  containerStyle,
  accentColor,
}: SectionNavProps) {
  const colors = useColors();
  const accent = accentColor ?? giColors.accent.blue;

  return (
    <View
      style={[
        styles.container,
        { borderBottomColor: colors.borderSubtle },
        containerStyle,
      ]}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {sections.map((s) => {
          const isActive = activeId === s.id;
          return (
            <TouchableOpacity
              key={s.id}
              style={[
                styles.tab,
                isActive && { borderBottomColor: accent, borderBottomWidth: 2 },
              ]}
              onPress={() => onSelect(s.id)}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? accent : colors.mutedForeground },
                  isActive && styles.activeTabText,
                ]}
              >
                {s.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
  },
  tab: { paddingHorizontal: giSpacing[4], paddingVertical: 10 },
  tabText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  activeTabText: { fontFamily: 'Inter_600SemiBold' },
});
