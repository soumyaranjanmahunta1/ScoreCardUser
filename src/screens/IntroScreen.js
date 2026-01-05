import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Animated,
} from 'react-native';

const IntroScreen = ({ navigation }) => {
  const scoreX = useRef(new Animated.Value(-300)).current; // Score from left
  const cardX = useRef(new Animated.Value(300)).current; // Card from right

  const [liveText, setLiveText] = useState(''); // TYPEWRITER TEXT

  useEffect(() => {
    // Crash animation
    animateLiveText();

    Animated.parallel([
      Animated.spring(scoreX, {
        toValue: 0,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.spring(cardX, {
        toValue: 0,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // AFTER CRASH → start LIVE animation
    });

    // Navigate after 3 sec
    const timer = setTimeout(() => {
      navigation.replace('MatchList');
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  const animateLiveText = () => {
    const text = 'LIVE';
    let index = 0;

    const interval = setInterval(() => {
      setLiveText(text.substring(0, index + 1));
      index++;

      if (index === text.length) {
        clearInterval(interval);
      }
    }, 200); // letters come one by one every 200ms
  };

  return (
    <ImageBackground
      source={require('../../assets/ccdf.png')}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <View style={styles.row}>
          {/* Score Animation */}
          <Animated.Text
            style={[styles.title, { transform: [{ translateX: scoreX }] }]}
          >
            Score
          </Animated.Text>

          {/* Card Animation */}
          <Animated.Text
            style={[styles.title, { transform: [{ translateX: cardX }] }]}
          >
            Card
          </Animated.Text>
        </View>

        {/* LIVE */}
        <Text style={styles.liveText}>{liveText}</Text>
      </View>

      {/* FOOTER */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Developed By Soumya Ranjan Mahunta
        </Text>
      </View>
    </ImageBackground>
  );
};

export default IntroScreen;

const styles = StyleSheet.create({
  background: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
  },
  title: {
    fontSize: 50,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
    marginHorizontal: 5,
  },
  liveText: {
    marginTop: 20,
    fontSize: 30,
    fontWeight: 'bold',
    color: 'red',
    letterSpacing: 8,
    paddingHorizontal: 18,
    paddingVertical: 6,
    backgroundColor: 'rgba(255,255,255,0.25)', // Soft white background
    borderRadius: 8,

    // Glow + Outline
    textShadowColor: 'rgba(255,255,255,0.9)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,

    // Outer black shadow for more visibility
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },

  footer: {
    position: 'absolute',
    bottom: 80,
    width: '100%',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: 'white',
    opacity: 0.5,
    fontStyle: 'italic',
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
});
