
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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
}

export function SectionNav({ sections, activeId, onSelect, containerStyle }: SectionNavProps) {
  return (
    <View style={[styles.container, containerStyle]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {sections.map((s) => (
          <TouchableOpacity
            key={s.id}
            style={[styles.tab, activeId === s.id && styles.activeTab]}
            onPress={() => onSelect(s.id)}
          >
            <Text style={[styles.tabText, activeId === s.id && styles.activeTabText]}>
              {s.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  tab: { paddingHorizontal: 16, paddingVertical: 10 },
  activeTab: { borderBottomWidth: 2, borderBottomColor: '#38bdf8' },
  tabText: { color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: '600' },
  activeTabText: { color: '#38bdf8' },
});
