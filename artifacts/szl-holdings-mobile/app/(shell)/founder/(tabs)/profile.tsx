import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const ACCENT = '#6366f1';
const BG = '#0a0a0a';
const BORDER = 'rgba(255,255,255,0.06)';
const TEXT = '#e8e8f0';
const TEXT_DIM = 'rgba(255,255,255,0.45)';

const SOCIAL_LINKS = [
  { label: 'LinkedIn', icon: 'linkedin' as const, url: 'https://linkedin.com/in/stephenlutar' },
  { label: 'GitHub', icon: 'github' as const, url: 'https://github.com/stephenlutar' },
  { label: 'Twitter / X', icon: 'twitter' as const, url: 'https://twitter.com/stephenlutar' },
  { label: 'Website', icon: 'globe' as const, url: 'https://stephenlutar.com' },
];

function useApiBase() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  return domain ? `https://${domain}` : '';
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const base = useApiBase();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Missing fields', 'Please fill in all fields before sending.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(`${base}/api/stephen/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message }),
      });
      if (res.ok) {
        setSubmitted(true);
        setName('');
        setEmail('');
        setMessage('');
      } else {
        Alert.alert('Error', 'Could not send message. Please try again.');
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    }
    setSubmitting(false);
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={['rgba(99,102,241,0.08)', 'transparent']}
        style={styles.headerGradient}
        pointerEvents="none"
      />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroSection}>
          <View style={styles.avatarRing}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>SL</Text>
            </View>
          </View>
          <Text style={styles.name}>Stephen Lutar</Text>
          <Text style={styles.title}>Founder & CEO · SZL Holdings</Text>
          <Text style={styles.bio}>
            Builder of domain-specific enterprise platforms across maritime intelligence,
            cybersecurity, real estate, and AI operations. Infrastructure-first, operator-minded.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Connect</Text>
          {SOCIAL_LINKS.map((link) => (
            <TouchableOpacity
              key={link.label}
              style={styles.socialRow}
              onPress={() => Linking.openURL(link.url)}
              activeOpacity={0.75}
            >
              <Feather name={link.icon} size={16} color={ACCENT} />
              <Text style={styles.socialLabel}>{link.label}</Text>
              <Feather
                name="external-link"
                size={12}
                color={TEXT_DIM}
                style={{ marginLeft: 'auto' }}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Get in Touch</Text>
          {submitted ? (
            <View style={styles.successCard}>
              <Feather name="check-circle" size={24} color="#10b981" />
              <Text style={styles.successText}>Message sent. I'll be in touch soon.</Text>
            </View>
          ) : (
            <View style={styles.contactForm}>
              <TextInput
                style={styles.input}
                placeholder="Your name"
                placeholderTextColor={TEXT_DIM}
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={styles.input}
                placeholder="Email address"
                placeholderTextColor={TEXT_DIM}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Your message…"
                placeholderTextColor={TEXT_DIM}
                value={message}
                onChangeText={setMessage}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <TouchableOpacity
                style={[styles.submitBtn, submitting && { opacity: 0.6 }]}
                onPress={handleSubmit}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.submitText}>Send Message</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  headerGradient: { ...StyleSheet.absoluteFillObject, height: 300 },
  scroll: { flex: 1 },
  heroSection: { alignItems: 'center', paddingTop: 40, paddingBottom: 32, paddingHorizontal: 24 },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1.5,
    borderColor: ACCENT + '50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: ACCENT + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: ACCENT },
  name: { fontSize: 24, fontWeight: '700', color: TEXT, marginBottom: 4 },
  title: { fontSize: 13, color: ACCENT, fontWeight: '500', marginBottom: 12 },
  bio: { fontSize: 14, color: TEXT_DIM, textAlign: 'center', lineHeight: 22, maxWidth: 300 },
  section: { marginTop: 8, paddingHorizontal: 16 },
  sectionLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: TEXT_DIM,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    paddingHorizontal: 4,
    paddingTop: 16,
    paddingBottom: 8,
  },
  socialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginBottom: 8,
  },
  socialLabel: { fontSize: 14, fontWeight: '500', color: TEXT },
  contactForm: { gap: 10 },
  input: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: TEXT,
  },
  textArea: { height: 100, paddingTop: 12 },
  submitBtn: {
    backgroundColor: ACCENT,
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 4,
  },
  submitText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  successCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(16,185,129,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(16,185,129,0.2)',
    borderRadius: 12,
    padding: 16,
  },
  successText: { color: '#10b981', fontSize: 14, fontWeight: '500', flex: 1 },
});
