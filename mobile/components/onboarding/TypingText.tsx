import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Text, StyleSheet, View } from 'react-native';

import { useTheme } from '../../providers/theme-provider';

interface TypingTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
  style?: any;
}

export default function TypingText({
  text,
  speed = 30,
  onComplete,
  style,
}: TypingTextProps) {
  const { colors } = useTheme();
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const onCompleteRef = useRef(onComplete);
  const hasCalledComplete = useRef(false);

  // Keep ref updated
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    let currentIndex = 0;
    setDisplayedText('');
    setIsComplete(false);
    hasCalledComplete.current = false;

    const typeInterval = setInterval(() => {
      if (currentIndex < text.length) {
        setDisplayedText(text.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
        setIsComplete(true);
        if (!hasCalledComplete.current) {
          hasCalledComplete.current = true;
          onCompleteRef.current?.();
        }
      }
    }, speed);

    return () => clearInterval(typeInterval);
  }, [text, speed]);

  // Cursor blink effect
  useEffect(() => {
    if (!isComplete) {
      const cursorInterval = setInterval(() => {
        setShowCursor((prev) => !prev);
      }, 530);

      return () => clearInterval(cursorInterval);
    } else {
      setShowCursor(false);
    }
  }, [isComplete]);

  return (
    <View style={styles.container}>
      <Text style={[styles.text, { color: colors.text.primary }, style]}>
        {displayedText}
        {!isComplete && (
          <Text style={{ opacity: showCursor ? 1 : 0, color: colors.primary.base }}>|</Text>
        )}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // Removed flex: 1 to allow natural height
  },
  text: {
    fontSize: 18,
    lineHeight: 28,
    fontWeight: '400',
  },
});
