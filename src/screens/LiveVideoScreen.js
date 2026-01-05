import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import axios from 'axios';
import { WebView } from 'react-native-webview';
import Orientation from 'react-native-orientation-locker';

const API_URL = 'https://68e75da010e3f82fbf3ed1c5.mockapi.io/UpdateScore';

const LiveVideoScreen = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const { width, height } = Dimensions.get('screen');

  useEffect(() => {
    Orientation.lockToLandscape();
    StatusBar.setHidden(true);

    fetchData();
    const interval = setInterval(fetchData, 5000);

    return () => {
      Orientation.unlockAllOrientations();
      StatusBar.setHidden(false);
      clearInterval(interval);
    };
  }, []);

  const fetchData = async () => {
    try {
      const res = await axios.get(API_URL);
      setData(res.data[0]);
    } catch (e) {
      console.log(e);
    } finally {
      setLoading(false);
    }
  };

  const shortTeam = name => (name ? name.slice(0, 3).toUpperCase() : '');
  const shortPlayer = name =>
    name && name.length > 10 ? name.slice(0, 10) + '...' : name;

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#ffea00" />
      </View>
    );
  }

  if (!data?.matchStarted) {
    return (
      <View style={styles.loader}>
        <Text style={{ color: '#fff', fontSize: 22 }}>
          🏏 Match will start soon
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* VIDEO */}
      <WebView
        source={{
          uri:
            `${data?.videoUrl}` +
            '?autoplay=1&controls=0&rel=0&modestbranding=1&showinfo=0&playsinline=1&fs=0&disablekb=1',
        }}
        style={{ width, height }}
        allowsFullscreenVideo
        javaScriptEnabled
      />

      {/* LIVE BADGE */}
      <View style={styles.liveBadge}>
        <Text style={styles.liveText}>LIVE</Text>
      </View>

      {/* ================= BROADCAST STRIP ================= */}
      <View style={styles.broadcastWrapper}>
        {/* TOP STRIP */}
        <View style={styles.topStrip}>
          <View style={styles.teamBox}>
            <Text style={styles.teamText}>{shortTeam(data.teamA)}</Text>
            <Text style={styles.vs}>v</Text>
            <Text style={styles.teamText}>{shortTeam(data.teamB)}</Text>
          </View>
          <View style={styles.middleStrip}>
            <Text style={styles.inningsText}>
              {shortTeam(data.battingTeam)}{' '}
              {data.target > 0 ? '• 2nd Innings' : '• 1st Innings'}
            </Text>

            <View style={styles.middleDivider} />

            <Text style={styles.liveMini}> LIVE</Text>
          </View>
          <Text style={styles.scoreText}>
            {data.totalRun}-{data.totalWicket}
          </Text>
        </View>

        {/* BOTTOM STRIP */}
        <View style={styles.bottomStrip}>
          <Text style={styles.playerText}>
            🏏 {shortPlayer(data.batsmenA)} || 🏏 {shortPlayer(data.batsmenB)}
          </Text>

          <View style={styles.rightInfo}>
            <Text style={styles.bowlerText}>
              {' '}
              🔴 {shortPlayer(data.bowler)}
            </Text>

            {data.target > 0 && (
              <Text style={styles.targetText}>🎯 Target {data.target}</Text>
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default LiveVideoScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  middleStrip: {
    height: 32,
    backgroundColor: '#102b5c',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#1e3d73',
  },

  inningsText: {
    color: '#e3f2fd',
    fontSize: 12,
    fontWeight: '600',
    marginRight: 10,
  },

  middleDivider: {
    width: 1,
    height: 14,
    backgroundColor: '#90caf9',
    marginHorizontal: 10,
  },

  liveMini: {
    color: '#ff5252',
    fontSize: 12,
    fontWeight: 'bold',
  },

  loader: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },

  liveBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#d32f2f',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 4,
    zIndex: 10,
  },

  liveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },

  /* ===== BROADCAST ===== */

  broadcastWrapper: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
  },

  topStrip: {
    height: 38,
    backgroundColor: '#0b2d63',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },

  teamBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  teamText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },

  vs: {
    color: '#ccc',
    marginHorizontal: 6,
    fontSize: 12,
  },

  scoreText: {
    color: '#ffcc00',
    fontSize: 20,
    fontWeight: 'bold',
  },

  bottomStrip: {
    height: 35,
    backgroundColor: '#081a3a',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
  },

  playerText: {
    color: '#fff',
    fontSize: 12,
  },

  rightInfo: {
    alignItems: 'flex-end',
  },

  bowlerText: {
    color: '#cfd8dc',
    fontSize: 11,
  },

  targetText: {
    color: '#ffcc00',
    fontSize: 11,
    fontWeight: 'bold',
  },
});
