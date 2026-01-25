// Password Strength Indicator - Real-time password strength feedback

import { View, Text, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { calculatePasswordStrength } from '@petforce/auth';

export interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
}

export function PasswordStrengthIndicator({
  password,
  showRequirements = true,
}: PasswordStrengthIndicatorProps) {
  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  const requirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains uppercase & lowercase', met: /[A-Z]/.test(password) && /[a-z]/.test(password) },
    { label: 'Contains a number', met: /[0-9]/.test(password) },
    { label: 'Contains special character', met: /[^A-Za-z0-9]/.test(password) },
  ];

  if (!password) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>Password strength</Text>
        <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${(strength.score / 4) * 100}%`,
              backgroundColor: strength.color,
            },
          ]}
        />
      </View>

      {/* Requirements checklist */}
      {showRequirements && (
        <View style={styles.requirements}>
          {requirements.map((req, index) => (
            <View key={index} style={styles.requirement}>
              <Text style={[styles.checkmark, req.met && styles.checkmarkMet]}>
                {req.met ? '✓' : '○'}
              </Text>
              <Text style={[styles.requirementText, req.met && styles.requirementMet]}>
                {req.label}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerText: {
    fontSize: 13,
    color: '#6B7280',
  },
  strengthLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  requirements: {
    marginTop: 12,
    gap: 6,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 16,
    marginRight: 8,
    color: '#9CA3AF',
  },
  checkmarkMet: {
    color: '#2D9B87',
  },
  requirementText: {
    fontSize: 13,
    color: '#6B7280',
  },
  requirementMet: {
    color: '#374151',
  },
});
