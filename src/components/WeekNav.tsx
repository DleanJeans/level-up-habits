import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDate, getDayTotal } from '../store/storage';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';

interface WeekNavProps {
  currentDate: Date;
  onChangeDate: (date: Date) => void;
  onResetToToday?: () => void;
}

interface DayInfo {
  date: Date;
  dateStr: string;
  dayOfWeek: string;
  dayNum: number;
  isToday: boolean;
  isSelected: boolean;
  stars: number;
}

// Always start week on Monday
function getWeekDays(selectedDate: Date): DayInfo[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get the start of the week (Monday)
  const startOfWeek = new Date(selectedDate);
  const currentDay = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate days to subtract to get to Monday
  let daysToSubtract = currentDay - 1;
  if (daysToSubtract < 0) {
    daysToSubtract += 7;
  }

  startOfWeek.setDate(selectedDate.getDate() - daysToSubtract);
  startOfWeek.setHours(0, 0, 0, 0);

  const days: DayInfo[] = [];
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);

    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    const compareSelected = new Date(selectedDate);
    compareSelected.setHours(0, 0, 0, 0);

    days.push({
      date,
      dateStr: formatDate(date),
      dayOfWeek: dayNames[i],
      dayNum: date.getDate(),
      isToday: compareDate.getTime() === today.getTime(),
      isSelected: compareDate.getTime() === compareSelected.getTime(),
      stars: 0,
    });
  }

  return days;
}

export default function WeekNav({ currentDate, onChangeDate, onResetToToday }: WeekNavProps) {
  const { width: windowWidth } = useWindowDimensions();
  const [weekDays, setWeekDays] = useState<DayInfo[]>(() => getWeekDays(currentDate));
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [isAnimating, setIsAnimating] = useState(false);
  const [animationDirection, setAnimationDirection] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    async function loadStars() {
      const days = getWeekDays(currentDate);
      const daysWithStars = await Promise.all(
        days.map(async (day) => ({
          ...day,
          stars: await getDayTotal(day.dateStr),
        }))
      );
      setWeekDays(daysWithStars);
    }
    loadStars();
  }, [currentDate]);

  function changeWeek(delta: number) {
    if (isAnimating) return;

    setIsAnimating(true);
    const direction = delta > 0 ? 'left' : 'right';
    setAnimationDirection(direction);

    // Full slide-in animation: slide out current, slide in new
    const slideDistance = windowWidth;

    Animated.sequence([
      // Slide out current week
      Animated.timing(slideAnim, {
        toValue: delta > 0 ? -slideDistance : slideDistance,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Update the week immediately
      const newDate = new Date(currentDate);
      newDate.setDate(currentDate.getDate() + delta * 7);
      onChangeDate(newDate);

      // Reset position to opposite side for slide-in
      slideAnim.setValue(delta > 0 ? slideDistance : -slideDistance);

      // Slide in new week
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start(() => {
        setIsAnimating(false);
        setAnimationDirection(null);
      });
    });
  }

  function selectDay(day: DayInfo) {
    onChangeDate(day.date);
  }

  // Swipe gesture for week navigation
  const swipeGesture = Gesture.Pan()
    .onEnd((event) => {
      const SWIPE_THRESHOLD = 50;
      if (event.translationX > SWIPE_THRESHOLD) {
        // Swipe right - go to previous week
        changeWeek(-1);
      } else if (event.translationX < -SWIPE_THRESHOLD) {
        // Swipe left - go to next week
        changeWeek(1);
      }
    });

  // Calculate responsive width for day cards
  const containerPadding = 32; // 16px on each side
  const gap = 8;
  const totalGaps = 6 * gap; // 6 gaps between 7 days
  const maxWidth = 600; // Max width for web landscape
  const effectiveWidth = Math.min(windowWidth - containerPadding, maxWidth);
  const dayCardWidth = (effectiveWidth - totalGaps) / 7;

  return (
    <View style={styles.container}>
      <GestureDetector gesture={swipeGesture}>
        <Animated.View
          style={[
            styles.daysWrapper,
            {
              transform: [{ translateX: slideAnim }],
            },
          ]}
        >
          <View style={[styles.daysContainer, { maxWidth, alignSelf: 'center', width: '100%' }]}>
            {weekDays.map((day) => (
              <TouchableOpacity
                key={day.dateStr}
                style={[
                  styles.dayCard,
                  { width: dayCardWidth },
                  day.isSelected && styles.dayCardSelected,
                  day.isToday && !day.isSelected && styles.dayCardToday,
                ]}
                onPress={() => selectDay(day)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.dayOfWeek,
                    day.isSelected && styles.dayOfWeekSelected,
                    day.isToday && !day.isSelected && styles.dayOfWeekToday,
                  ]}
                >
                  {day.dayOfWeek}
                </Text>
                <Text
                  style={[
                    styles.dayNum,
                    day.isSelected && styles.dayNumSelected,
                    day.isToday && !day.isSelected && styles.dayNumToday,
                  ]}
                >
                  {day.dayNum}
                </Text>
                <View style={styles.starsRow}>
                  <Text
                    style={[
                      styles.starsText,
                      day.isSelected && styles.starsTextSelected,
                      day.isToday && !day.isSelected && styles.starsTextToday,
                    ]}
                  >
                    {day.stars > 0 ? day.stars.toFixed(0) : '–'}
                  </Text>
                  {day.stars > 0 && (
                    <MaterialCommunityIcons
                      name="star"
                      size={12}
                      color={day.isSelected ? '#fbbf24' : day.isToday ? '#818cf8' : '#ca8a04'}
                    />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  daysWrapper: {
    paddingHorizontal: 16,
  },
  daysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dayCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 4,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  dayCardSelected: {
    backgroundColor: '#1e1b4b',
    borderColor: '#6366f1',
  },
  dayCardToday: {
    backgroundColor: '#1c1a14',
    borderColor: '#ca8a04',
  },
  dayOfWeek: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9ca3af',
    marginBottom: 4,
  },
  dayOfWeekSelected: {
    color: '#c4b5fd',
  },
  dayOfWeekToday: {
    color: '#fde68a',
  },
  dayNum: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#f0f0f0',
    marginBottom: 6,
  },
  dayNumSelected: {
    color: '#fff',
  },
  dayNumToday: {
    color: '#fbbf24',
  },
  starsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  starsText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#ca8a04',
  },
  starsTextSelected: {
    color: '#fbbf24',
  },
  starsTextToday: {
    color: '#818cf8',
  },
});
