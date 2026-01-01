import React, { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Animated, { FadeInUp } from 'react-native-reanimated';

import { OnboardingStackParamList } from '../../navigation/OnboardingStack';
import { useOnboardingStore, Equipment } from '../../../stores/onboarding-store';
import { useTheme } from '../../../providers/theme-provider';
import {
  OnboardingLayout,
  QuestionBubble,
  MultiSelectGrid,
  ContinueButton,
} from '../../../components/onboarding';

type EquipmentScreenProps = {
  navigation: NativeStackNavigationProp<OnboardingStackParamList, 'Equipment'>;
};

const EQUIPMENT_OPTIONS = [
  { id: 'barbells', label: 'Barbells', icon: '\uD83C\uDFCB\uFE0F' },
  { id: 'dumbbells', label: 'Dumbbells', icon: '\uD83D\uDCAA' },
  { id: 'kettlebells', label: 'Kettlebells', icon: '\uD83E\uDD4E' },
  { id: 'gym_machines', label: 'Gym Machines', icon: '\u2699\uFE0F' },
  { id: 'resistance_bands', label: 'Resistance Bands', icon: '\uD83E\uDE79' },
  { id: 'bodyweight_only', label: 'Bodyweight Only', icon: '\uD83E\uDDD8' },
];

export default function EquipmentScreen({ navigation }: EquipmentScreenProps) {
  const { colors } = useTheme();
  const { equipment, setEquipment, goToStep } = useOnboardingStore();

  useEffect(() => {
    goToStep(9);
  }, []);

  const handleChange = (values: string[]) => {
    setEquipment(values as Equipment[]);
  };

  const handleContinue = () => {
    navigation.navigate('WorkoutTime');
  };

  const isValid = equipment.length > 0;

  return (
    <OnboardingLayout
      mascotExpression="thinking"
      onBack={() => navigation.goBack()}
      onClose={() => navigation.getParent()?.goBack()}
    >
      <QuestionBubble>
        What equipment do you have available to you?
      </QuestionBubble>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(100).duration(300)}>
          <Text style={[styles.helperText, { color: colors.text.secondary }]}>
            Later you can get more specific to match your exact setup.
          </Text>
        </Animated.View>

        <View style={styles.gridContainer}>
          <MultiSelectGrid
            options={EQUIPMENT_OPTIONS}
            value={equipment}
            onChange={handleChange}
            exclusiveOptions={['bodyweight_only']}
            columns={2}
          />
        </View>
      </ScrollView>

      <ContinueButton
        onPress={handleContinue}
        disabled={!isValid}
      />
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  helperText: {
    fontSize: 14,
    marginBottom: 20,
    lineHeight: 20,
  },
  gridContainer: {
    paddingTop: 8,
  },
});
