import { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

type ConfettiProps = {
  active: boolean;
  onComplete?: () => void;
};

const CONFETTI_PIECES = 50;
const COLORS = ['#E63946', '#FFD700', '#10B981', '#2A7DE1', '#F59E0B', '#FF6B9D'];

export function Confetti({ active, onComplete }: ConfettiProps) {
  const pieces = useRef(
    Array.from({ length: CONFETTI_PIECES }, () => ({
      translateY: useRef(new Animated.Value(-100)).current,
      translateX: useRef(new Animated.Value(Math.random() * width)).current,
      rotate: useRef(new Animated.Value(0)).current,
      opacity: useRef(new Animated.Value(1)).current,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      size: Math.random() * 10 + 5,
    }))
  ).current;

  useEffect(() => {
    if (active) {
      const animations = pieces.flatMap((piece) => [
        Animated.timing(piece.translateY, {
          toValue: height + 100,
          duration: 3000 + Math.random() * 2000,
          useNativeDriver: true,
        }),
        Animated.timing(piece.rotate, {
          toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
          duration: 2000 + Math.random() * 1000,
          useNativeDriver: true,
        }),
        Animated.timing(piece.opacity, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ]);

      Animated.parallel(animations).start(() => {
        if (onComplete) onComplete();
        pieces.forEach((piece) => {
          piece.translateY.setValue(-100);
          piece.translateX.setValue(Math.random() * width);
          piece.rotate.setValue(0);
          piece.opacity.setValue(1);
        });
      });
    }
  }, [active]);

  if (!active) return null;

  return (
    <View style={styles.container} pointerEvents="none">
      {pieces.map((piece, index) => (
        <Animated.View
          key={index}
          style={[
            styles.piece,
            {
              backgroundColor: piece.color,
              width: piece.size,
              height: piece.size,
              transform: [
                { translateX: piece.translateX },
                { translateY: piece.translateY },
                {
                  rotate: piece.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  }),
                },
              ],
              opacity: piece.opacity,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  piece: {
    position: 'absolute',
    borderRadius: 2,
  },
});
