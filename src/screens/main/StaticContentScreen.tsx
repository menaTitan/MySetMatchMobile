import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { Card, PageHeader } from '../../components/ui';

const CONTENT: Record<string, { title: string; sections: { heading: string; body: string }[] }> = {
  About: {
    title: 'About MySetMatch',
    sections: [
      { heading: 'Our mission', body: 'MySetMatch is a multi-sport competition platform built to make it effortless for players to find tournaments, track ratings, and connect with the community.' },
      { heading: 'Sports we support', body: 'Table tennis, tennis, badminton, pickleball — and more on the way. Each sport has its own ratings, leaderboards, and feed.' },
      { heading: 'How ratings work', body: 'Every rated match updates your global and regional rating using a transparent ELO-style algorithm. Win against stronger opponents and your rating grows faster.' },
    ],
  },
  Privacy: {
    title: 'Privacy Policy',
    sections: [
      { heading: 'Data we collect', body: 'Account info you provide (email, name, profile), match results, and standard usage data needed to deliver the service.' },
      { heading: 'How we use it', body: 'To run the platform: matchmaking, rating updates, leaderboards, notifications, and customer support.' },
      { heading: 'Sharing', body: 'We never sell your personal data. We share with payment processors (Stripe), email providers, and analytics — only as needed.' },
      { heading: 'Your rights', body: 'You can export, correct, or delete your data at any time. Contact us via the Contact screen for account deletion.' },
    ],
  },
  Terms: {
    title: 'Terms of Service',
    sections: [
      { heading: 'Acceptance', body: 'By creating an account or using MySetMatch, you agree to these terms.' },
      { heading: 'Acceptable use', body: 'No harassment, cheating, fraudulent registrations, or spam. Tournament organizers must run events fairly.' },
      { heading: 'Payments', body: 'Tournament entry fees are processed via Stripe. Refunds follow our refunds policy.' },
      { heading: 'Liability', body: 'MySetMatch provides the platform "as is". Always follow safety guidelines at venues.' },
    ],
  },
  Refunds: {
    title: 'Refunds Policy',
    sections: [
      { heading: 'Default', body: 'You may request a full refund up to 48 hours before a tournament begins. Within 48 hours of start, refunds are at the organizer\'s discretion.' },
      { heading: 'Cancelled tournaments', body: 'If a tournament is cancelled by the organizer, all paid entries are refunded automatically.' },
      { heading: 'How to request', body: 'Open the tournament, tap "Withdraw", and contact the organizer. For unresolved cases, reach out via Support chat.' },
    ],
  },
  Rules: {
    title: 'Tournament Rules',
    sections: [
      { heading: 'Match format', body: 'Best-of-5 sets is standard. Each sport defines its winning score (e.g., 11 with win-by-2 for table tennis).' },
      { heading: 'Conduct', body: 'Be respectful to opponents and umpires. Repeated violations result in suspension.' },
      { heading: 'Scoring', body: 'Both players should agree on scores before submission. Disputed results can be appealed via the organizer.' },
      { heading: 'Equipment', body: 'Bring your own paddle/racket. Tournament-approved balls are typically provided.' },
    ],
  },
};

export default function StaticContentScreen({ route }: any) {
  const kind: string = route?.params?.kind ?? 'About';
  const c = CONTENT[kind] ?? CONTENT.About;
  const { theme } = useSport();

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title={c.title} compact />
      <ScrollView contentContainerStyle={{ padding: spacing.base, gap: spacing.sm, paddingBottom: spacing.xxl }}>
        {c.sections.map((s, i) => (
          <Card key={i}>
            <Text style={[typography.h3, { color: theme.primary, marginBottom: spacing.xs }]}>{s.heading}</Text>
            <Text style={[typography.body, { color: theme.textSecondary, lineHeight: 22 }]}>{s.body}</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({});
