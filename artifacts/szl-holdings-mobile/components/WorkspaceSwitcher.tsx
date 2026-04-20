import { router } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useWorkspace, WORKSPACES, type WorkspaceDomain } from '@/context/WorkspaceContext';
import { useColors } from '@/hooks/useColors';

const SCREEN_W = Dimensions.get('window').width;
const DRAWER_W = Math.min(300, SCREEN_W * 0.78);

export function WorkspaceSwitcher() {
  const { drawerOpen, closeDrawer, activeWorkspace, setActiveWorkspace, badges } = useWorkspace();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(-DRAWER_W)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: drawerOpen ? 0 : -DRAWER_W,
        useNativeDriver: true,
        bounciness: 0,
        speed: 20,
      }),
      Animated.timing(backdropAnim, {
        toValue: drawerOpen ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  }, [drawerOpen, slideAnim, backdropAnim]);

  if (!drawerOpen && (slideAnim as any)._value === -DRAWER_W) return null;

  const handleSelect = (ws: (typeof WORKSPACES)[number]) => {
    setActiveWorkspace(ws.id as WorkspaceDomain);
    closeDrawer();
    router.navigate(ws.route as never);
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents={drawerOpen ? 'auto' : 'none'}>
      <Animated.View
        style={[styles.backdrop, { opacity: backdropAnim }]}
        pointerEvents={drawerOpen ? 'auto' : 'none'}
      >
        <Pressable style={StyleSheet.absoluteFillObject} onPress={closeDrawer} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            width: DRAWER_W,
            backgroundColor: colors.card,
            borderRightColor: colors.border,
            paddingTop: insets.top + 16,
            paddingBottom: insets.bottom + 24,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.logoRow}>
            <View
              style={[
                styles.logoMark,
                { backgroundColor: 'rgba(201,168,76,0.1)', borderColor: 'rgba(201,168,76,0.2)' },
              ]}
            >
              <Text style={[styles.logoText, { color: colors.gold }]}>C</Text>
            </View>
            <View>
              <Text style={[styles.appName, { color: colors.foreground }]}>CORTEX</Text>
              <Text style={[styles.appSub, { color: colors.mutedForeground }]}>
                Unified Command
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
          {WORKSPACES.map((ws) => {
            const isActive = ws.id === activeWorkspace;
            const badge = badges[ws.id as WorkspaceDomain] ?? 0;

            return (
              <TouchableOpacity
                key={ws.id}
                onPress={() => handleSelect(ws)}
                style={[
                  styles.item,
                  isActive && {
                    backgroundColor: `${ws.accent}14`,
                    borderColor: `${ws.accent}30`,
                  },
                  !isActive && { borderColor: 'transparent' },
                ]}
                activeOpacity={0.7}
              >
                <View style={[styles.iconWrap, { backgroundColor: `${ws.accent}18` }]}>
                  <Text style={styles.iconText}>{ws.icon}</Text>
                </View>
                <View style={styles.itemContent}>
                  <Text
                    style={[
                      styles.itemLabel,
                      {
                        color: isActive ? ws.accent : colors.foreground,
                        fontFamily: isActive ? 'Inter_600SemiBold' : 'Inter_400Regular',
                      },
                    ]}
                  >
                    {ws.label}
                  </Text>
                  <Text
                    style={[styles.itemDesc, { color: colors.mutedForeground }]}
                    numberOfLines={1}
                  >
                    {ws.description}
                  </Text>
                </View>
                {badge > 0 && (
                  <View style={[styles.badge, { backgroundColor: ws.accent }]}>
                    <Text style={styles.badgeText}>{badge > 99 ? '99+' : String(badge)}</Text>
                  </View>
                )}
                {isActive && <View style={[styles.activeDot, { backgroundColor: ws.accent }]} />}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
            SZL Holdings Ecosystem
          </Text>
        </View>
      </Animated.View>
    </View>
  );
}

export function WorkspaceTrigger({
  accentColor,
  size = 36,
}: {
  accentColor?: string;
  size?: number;
}) {
  const { toggleDrawer, activeWorkspace, totalBadges } = useWorkspace();
  const colors = useColors();
  const ws = WORKSPACES.find((w) => w.id === activeWorkspace);
  const accent = accentColor ?? ws?.accent ?? colors.gold;

  return (
    <TouchableOpacity
      onPress={toggleDrawer}
      style={[
        styles.trigger,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${accent}18`,
          borderColor: `${accent}30`,
        },
      ]}
      activeOpacity={0.7}
    >
      <Text style={[styles.triggerIcon, { color: accent, fontSize: size * 0.45 }]}>
        {ws?.icon ?? '⬡'}
      </Text>
      {totalBadges > 0 && (
        <View style={[styles.triggerBadge, { backgroundColor: '#ef4444' }]}>
          <Text style={styles.triggerBadgeText}>
            {totalBadges > 9 ? '9+' : String(totalBadges)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    borderRightWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 20,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoMark: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 18,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
  },
  appName: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 2,
  },
  appSub: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  divider: {
    height: 1,
    marginHorizontal: 20,
    marginVertical: 8,
  },
  list: {
    flex: 1,
    paddingHorizontal: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 4,
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 16,
  },
  itemContent: {
    flex: 1,
    gap: 2,
  },
  itemLabel: {
    fontSize: 14,
  },
  itemDesc: {
    fontSize: 11,
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  footerText: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  trigger: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerIcon: {
    fontFamily: 'Inter_400Regular',
  },
  triggerBadge: {
    position: 'absolute',
    top: -3,
    right: -3,
    minWidth: 14,
    height: 14,
    borderRadius: 7,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  triggerBadgeText: {
    color: '#fff',
    fontSize: 8,
    fontFamily: 'Inter_600SemiBold',
  },
});
