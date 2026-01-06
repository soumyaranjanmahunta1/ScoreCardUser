import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import axios from 'axios';
import { WebView } from 'react-native-webview';
import Orientation from 'react-native-orientation-locker';

const API_URL = 'https://68e75da010e3f82fbf3ed1c5.mockapi.io/UpdateScore';
const { width, height } = Dimensions.get('screen');

const LiveVideoScreen = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  // Use useRef for animated values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  const getOvers = balls => {
    const completedOvers = Math.floor(balls / 6);
    const ballsInOver = balls % 6;
    return `${completedOvers}.${ballsInOver}`;
  };

  useEffect(() => {
    Orientation.lockToLandscape();
    StatusBar.setHidden(true);

    // Pulse animation for LIVE badge
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    ).start();

    // Slide up animation for overlay
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start();

    fetchData();
    const interval = setInterval(fetchData, 3000);

    return () => {
      Orientation.unlockAllOrientations();
      StatusBar.setHidden(false);
      clearInterval(interval);

      // Clean up animations
      pulseAnim.stopAnimation();
      slideAnim.stopAnimation();
    };
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(API_URL);
      const newData = res.data[0];
      setData(newData);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const shortTeam = name => (name ? name.slice(0, 3).toUpperCase() : '');
  const shortPlayer = name =>
    name && name.length > 12 ? name.slice(0, 12) + '...' : name;

  if (loading) {
    return (
      <View style={styles.loader}>
        <View style={styles.loaderCircle}>
          <ActivityIndicator size="large" color="#ffc107" />
        </View>
        <Text style={styles.loaderText}>Loading Match...</Text>
        <View style={styles.dotsContainer}>
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          />
          <Animated.View
            style={[
              styles.dot,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [1, 1.1],
                  outputRange: [0.3, 1],
                }),
              },
            ]}
          />
        </View>
      </View>
    );
  }
  if (!data?.matchStarted) {
    return (
      <View style={styles.loader}>
        <Animated.View
          style={[
            styles.notStartedCard,
            {
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.1],
                outputRange: [0.8, 1],
              }),
            },
          ]}
        >
          <Text style={styles.cricketEmoji}>🏏</Text>
          <Text style={styles.notStartedTitle}>MATCH STARTING SOON</Text>
          <Text style={styles.notStartedSubtitle}>
            Stay tuned for live action!
          </Text>
          <Animated.View
            style={[
              styles.shimmerBar,
              {
                transform: [
                  {
                    scaleX: pulseAnim.interpolate({
                      inputRange: [1, 1.1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}
          />
        </Animated.View>
      </View>
    );
  }

  const isSecondInnings = data.target > 0;
  const runsNeeded = isSecondInnings ? data.target - data.totalRun : 0;

  return (
    <View style={styles.container}>
      {/* VIDEO */}
      <WebView
        source={{
          uri:
            `${data?.videoUrl}` +
            '?autoplay=1&controls=0&rel=0&modestbranding=1&showinfo=0&playsinline=1&fs=0&disablekb=1',
        }}
        style={styles.webview}
        allowsFullscreenVideo
        javaScriptEnabled
      />

      {/* LIVE BADGE */}
      <Animated.View
        style={[styles.liveBadge, { transform: [{ scale: pulseAnim }] }]}
      >
        <Animated.View
          style={[
            styles.liveDot,
            {
              opacity: pulseAnim.interpolate({
                inputRange: [1, 1.1],
                outputRange: [0.7, 1],
              }),
            },
          ]}
        />
        <Text style={styles.liveText}>LIVE</Text>
      </Animated.View>

      {/* ================= BROADCAST OVERLAY ================= */}
      <Animated.View
        style={[
          styles.broadcastWrapper,
          { transform: [{ translateY: slideAnim }] },
        ]}
      >
        {/* MAIN SCORE STRIP */}
        <Animated.View
          style={[
            styles.mainScoreStrip,
            {
              opacity: slideAnim.interpolate({
                inputRange: [0, 100],
                outputRange: [1, 0],
              }),
            },
          ]}
        >
          {/* Teams */}
          <View style={styles.teamsSection}>
            <View style={[styles.teamBadge, { backgroundColor: '#004BA0' }]}>
              <View style={styles.teamBattingIndicator} />
              <Text style={styles.teamCode}>{shortTeam(data.teamA)}</Text>
            </View>
            <Text style={styles.vsText}>vs</Text>
            <View style={[styles.teamBadge, { backgroundColor: '#FDB913' }]}>
              <Text style={[styles.teamCode, { color: '#000' }]}>
                {shortTeam(data.teamB)}
              </Text>
            </View>
          </View>
          <View style={styles.batsmenSection}>
            {/* Batsman A (Striker) */}
            <View style={styles.playerCard}>
              <View style={styles.playerIconContainer}>
                <Text style={styles.playerIcon}>
                  {data.onStrike === 'A' && '🏏 '}
                </Text>
              </View>
              <Text
                style={
                  data.onStrike === 'A'
                    ? styles.playerName
                    : styles.playerNameInactive
                }
              >
                {shortPlayer(data.batsmenA)}
              </Text>
              <Text
                style={
                  data.onStrike === 'A'
                    ? styles.playerScore
                    : styles.playerScoreInactive
                }
              >
                {data?.batsmanAScore || 0}
                <Text
                  style={
                    data.onStrike === 'A'
                      ? styles.playerBalls
                      : styles.playerBallsInactive
                  }
                >
                  ({data?.batsmanABalls || 0})
                </Text>
              </Text>
            </View>

            {/* Batsman B */}
            <View style={styles.playerCard}>
              <View style={styles.playerIconContainer}>
                <Text style={styles.playerIcon}>
                  {data.onStrike === 'B' && '🏏 '}
                </Text>
              </View>
              <Text
                style={
                  data.onStrike === 'B'
                    ? styles.playerName
                    : styles.playerNameInactive
                }
              >
                {shortPlayer(data.batsmenB)}
              </Text>
              <Text
                style={
                  data.onStrike === 'B'
                    ? styles.playerScore
                    : styles.playerScoreInactive
                }
              >
                {data.batsmanBScore || 0}
                <Text
                  style={
                    data.onStrike === 'B'
                      ? styles.playerBalls
                      : styles.playerBallsInactive
                  }
                >
                  ({data.batsmanBBalls || 0})
                </Text>
              </Text>
            </View>
          </View>
          <View style={styles.bowlerSection}>
            <View style={[styles.playerCard, styles.bowlerCard]}>
              <View style={styles.bowlerIconContainer}>
                <Text style={styles.bowlerIcon}>⚡</Text>
              </View>
              <Text style={styles.bowlerName}>{shortPlayer(data.bowler)}</Text>
              <Text style={styles.bowlerFigures}>
                {data.bowlerWickets || 0}-{data.bowlerRuns || 0}
                <Text style={styles.bowlerOvers}>
                  ({data.bowlerOvers || '0.0'})
                </Text>
              </Text>
              <Text style={styles.economyText}>
                Econ:{' '}
                <Text style={styles.economyValue}>
                  {data.economy || '0.00'}
                </Text>
              </Text>
            </View>
          </View>
          {/* Score */}
          <View style={styles.scoreSection}>
            <View style={styles.scoreMain}>
              <Text style={styles.scoreRuns}>{data.totalRun}</Text>
              <Text style={styles.scoreDash}>-</Text>
              <Text style={styles.scoreWickets}>{data.totalWicket}</Text>
              <Text style={styles.scoreOvers}>
                ({getOvers(data.balls || 0)} ov)
              </Text>
            </View>
            <View style={styles.rateContainer}>
              <Text style={styles.rateText}>
                CRR:{' '}
                <Text style={styles.rateValue}>{data.runRate || '0.00'}</Text>
              </Text>
              {isSecondInnings && (
                <Text style={styles.rateText}>
                  RRR:{' '}
                  <Text style={styles.rateValueGold}>
                    {data.requiredRate || '0.00'}
                  </Text>
                </Text>
              )}
            </View>
          </View>

          {/* Innings Info */}
          <View style={styles.inningsSection}>
            <View style={styles.inningsBox}>
              <Text style={styles.battingTeamCode}>
                {shortTeam(data.battingTeam)}
              </Text>
              <View style={styles.inningsDivider} />
              <Text style={styles.inningsText}>
                {isSecondInnings ? '2nd Innings' : '1st Innings'}
              </Text>
            </View>
            {isSecondInnings && (
              <View style={styles.targetBox}>
                <Text style={styles.targetIcon}>🎯</Text>
                <Text style={styles.targetText}>Target: {data.target}</Text>
              </View>
            )}
            {isSecondInnings && (
              <Text style={styles.needText}>Need {runsNeeded} runs</Text>
            )}
          </View>
        </Animated.View>

        {/* BOTTOM ACCENT */}
        <Animated.View
          style={[
            styles.bottomAccent,
            {
              transform: [
                {
                  scaleX: slideAnim.interpolate({
                    inputRange: [0, 100],
                    outputRange: [1, 0],
                  }),
                },
              ],
            },
          ]}
        />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a1628',
  },
  webview: {
    width,
    height,
  },

  // Loader
  loader: {
    flex: 1,
    backgroundColor: '#0a1628',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1a2d4a',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  loaderText: {
    color: '#94a3b8',
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 1,
  },
  dotsContainer: {
    flexDirection: 'row',
    marginTop: 16,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffc107',
    marginHorizontal: 4,
  },

  // Not Started
  notStartedCard: {
    backgroundColor: '#1a2d4a',
    paddingHorizontal: 48,
    paddingVertical: 32,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2d4a6a',
  },
  cricketEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  notStartedTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 3,
    marginBottom: 8,
  },
  notStartedSubtitle: {
    color: '#94a3b8',
    fontSize: 16,
  },
  shimmerBar: {
    width: 200,
    height: 4,
    backgroundColor: '#2d4a6a',
    borderRadius: 2,
    marginTop: 24,
  },

  // Live Badge
  liveBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d32f2f',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 6,
    zIndex: 10,
    shadowColor: '#ff1744',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  liveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
    letterSpacing: 2,
  },

  // Broadcast Wrapper
  broadcastWrapper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },

  // Main Score Strip
  mainScoreStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0d2247',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.2)',
  },

  // Teams
  teamsSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  teamBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 4,
    position: 'relative',
  },
  teamBattingIndicator: {
    position: 'absolute',
    left: -2,
    width: 3,
    height: 20,
    backgroundColor: '#ffc107',
    borderRadius: 2,
  },
  teamCode: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 7,
    letterSpacing: 2,
  },
  vsText: {
    color: '#64748b',
    fontSize: 7,
    marginHorizontal: 12,
    fontStyle: 'italic',
  },

  // Score
  scoreSection: {
    alignItems: 'center',
  },
  scoreMain: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  scoreRuns: {
    color: '#ffc107',
    fontSize: 30,
    fontWeight: 'bold',
    letterSpacing: 1,
    textShadowColor: 'rgba(255, 193, 7, 0.4)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  scoreDash: {
    color: 'rgba(255, 193, 7, 0.6)',
    fontSize: 28,
    marginHorizontal: 2,
  },
  scoreWickets: {
    color: '#ffc107',
    fontSize: 26,
    fontWeight: 'bold',
  },
  scoreOvers: {
    color: '#64748b',
    fontSize: 11,
    marginLeft: 6,
  },
  rateContainer: {
    flexDirection: 'row',
    marginTop: 4,
  },
  rateText: {
    color: '#64748b',
    fontSize: 9,
    marginHorizontal: 6,
  },
  rateValue: {
    color: '#00bcd4',
    fontWeight: 'bold',
  },
  rateValueGold: {
    color: '#ffc107',
    fontWeight: 'bold',
  },

  // Innings
  inningsSection: {
    alignItems: 'flex-end',
  },
  inningsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(13, 34, 71, 0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  battingTeamCode: {
    color: '#94a3b8',
    fontSize: 11,
  },
  inningsDivider: {
    width: 1,
    height: 12,
    backgroundColor: 'rgba(255, 193, 7, 0.3)',
    marginHorizontal: 8,
  },
  inningsText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  targetBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 193, 7, 0.3)',
    marginTop: 6,
  },
  targetIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  targetText: {
    color: '#ffc107',
    fontSize: 12,
    fontWeight: 'bold',
  },
  needText: {
    color: '#ffc107',
    fontSize: 9,
    fontWeight: 'bold',
    marginTop: 4,
  },

  // Players Strip
  playersStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#081832',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  batsmenSection: {
    flexDirection: 'column',
    gap: 2,
  },

  // Player Cards
  playerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(26, 45, 74, 0.6)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    marginRight: 8,
  },

  playerName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 8,
    minWidth: 70,
  },

  playerScore: {
    color: '#ffc107',
    fontSize: 13,
    fontWeight: 'bold',
    marginRight: 6,
  },

  playerCardInactive: {
    borderLeftColor: 'rgba(100, 116, 139, 0.3)',
  },
  playerIconContainer: {
    marginRight: 8,
  },
  playerIcon: {
    fontSize: 16,
  },

  playerNameInactive: {
    color: '#94a3b8',
    fontSize: 13,
    marginRight: 12,
    minWidth: 90,
  },

  playerScoreInactive: {
    color: '#64748b',
    fontSize: 14,
    marginRight: 10,
  },
  playerBalls: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: 'normal',
  },
  playerBallsInactive: {
    color: '#475569',
    fontSize: 11,
    fontWeight: 'normal',
  },

  // Bowler
  bowlerSection: {},
  bowlerCard: {
    borderLeftColor: 'rgba(255, 82, 82, 0.5)',
  },
  bowlerIconContainer: {
    marginRight: 8,
  },
  bowlerIcon: {
    fontSize: 14,
  },
  bowlerName: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 8,
    minWidth: 70,
  },

  bowlerFigures: {
    color: '#ff5252',
    fontSize: 13,
    fontWeight: 'bold',
  },

  bowlerOvers: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: 'normal',
  },
  economyText: {
    color: '#64748b',
    fontSize: 10,
  },
  economyValue: {
    color: '#00bcd4',
  },

  // Bottom Accent
  bottomAccent: {
    height: 4,
    backgroundColor: '#ffc107',
    shadowColor: '#ffc107',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});

export default LiveVideoScreen;
