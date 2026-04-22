import { BlurView } from 'expo-blur';
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useColors } from '@/hooks/useColors';

export type Section = {
  id: string;
  label: string;
};

type SectionNavProps = {
  sections: Section[];
  activeSection: string;
  onSectionPress: (id: string) => void;
};

export function SectionNav({ sections, activeSection, onSectionPress }: SectionNavProps) {
  const colors = useColors();
  const isIOS = Platform.OS === 'ios';

  return (
    <View style={[styles.wrapper, { borderBottomColor: colors.border }]}>
      {isIOS ? (
        <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(10,10,10,0.92)' }]} />
      )}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sections.map((section) => {
          const isActive = activeSection === section.id;
          return (
            <TouchableOpacity
              key={section.id}
              onPress={() => onSectionPress(section.id)}
              style={[
                styles.tab,
                isActive && { borderBottomColor: colors.silver, borderBottomWidth: 1.5 },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: isActive ? colors.silver : colors.mutedForeground },
                ]}
              >
                {section.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: 44,
    borderBottomWidth: 1,
    position: 'relative',
  },
  scrollContent: {
    paddingHorizontal: 16,
    alignItems: 'center',
    height: 44,
  },
  tab: {
    paddingHorizontal: 14,
    height: 44,
    justifyContent: 'center',
    borderBottomWidth: 1.5,
    borderBottomColor: 'transparent',
  },
  tabText: {
    fontSize: 11,
    fontFamily: 'Inter_500Medium',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
