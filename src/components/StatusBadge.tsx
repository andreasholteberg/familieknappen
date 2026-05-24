import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fontSize, radius, spacing } from '@/theme/theme';
import type { RequestStatus } from '@/types/models';

interface StatusBadgeProps {
  status: RequestStatus;
}

/** Brukervennlig etikett + farge per forespørselsstatus. */
const LABEL: Record<RequestStatus, { text: string; bg: string; fg: string }> = {
  CREATED: { text: 'Oppretter', bg: colors.surfaceSoft, fg: colors.inkSoft },
  SENT: { text: 'Sendt', bg: colors.brandSoft, fg: colors.brandDark },
  DELIVERED: { text: 'Ny', bg: colors.brand, fg: colors.white },
  VIEWED: { text: 'Sett', bg: colors.brandSoft, fg: colors.brandDark },
  ANSWERED: { text: 'Besvart', bg: colors.calmGreenSoft, fg: colors.calmGreen },
  ESCALATED: { text: 'Prøver en annen', bg: colors.attentionSoft, fg: colors.attention },
  CLOSED: { text: 'Lukket', bg: colors.surfaceSoft, fg: colors.inkFaint },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const s = LABEL[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.fg }]}>{s.text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing(2.5),
    paddingVertical: spacing(1.5),
    borderRadius: radius.l,
    alignSelf: 'flex-start',
  },
  text: { fontSize: fontSize.sm, fontWeight: '800' },
});
