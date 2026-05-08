import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { contactApi } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { useSport } from '../../context/SportContext';
import { radii, spacing, typography } from '../../theme';
import { Button, Input, KeyboardAware, PageHeader, useToast } from '../../components/ui';

export default function ContactScreen({ navigation }: any) {
  const { theme } = useSport();
  const { player } = useAuth();
  const toast = useToast();
  const [name, setName] = useState(player?.name ?? '');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function send() {
    if (!name.trim() || !email.trim() || !message.trim()) {
      Alert.alert('Missing info', 'Name, email, and message are required.'); return;
    }
    setBusy(true);
    try {
      await contactApi.send({ name: name.trim(), email: email.trim(), subject: subject.trim(), message: message.trim() });
      toast('Message sent', 'success');
      navigation.goBack();
    } catch (err: any) {
      Alert.alert('Failed', err?.response?.data?.message ?? 'Could not send.');
    } finally { setBusy(false); }
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.pageBg }}>
      <PageHeader title="Contact us" subtitle="Send the team a message" compact />
      <KeyboardAware contentContainerStyle={{ padding: spacing.base, gap: spacing.sm }}>
        <Input label="Name" value={name} onChangeText={setName} leftIcon="person-outline" />
        <Input label="Email" value={email} onChangeText={setEmail} leftIcon="mail-outline" keyboardType="email-address" autoCapitalize="none" />
        <Input label="Subject (optional)" value={subject} onChangeText={setSubject} leftIcon="bookmark-outline" />
        <Input label="Message" value={message} onChangeText={setMessage} multiline numberOfLines={6} />
        <Button title="Send message" onPress={send} loading={busy} variant="primary" size="lg" fullWidth leftIcon="send-outline" style={{ marginTop: spacing.md }} />
      </KeyboardAware>
    </View>
  );
}

const styles = StyleSheet.create({});
