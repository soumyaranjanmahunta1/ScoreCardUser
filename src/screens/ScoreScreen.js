import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';

const API_URL = 'https://68e75da010e3f82fbf3ed1c5.mockapi.io/UpdateScore';

const ScoreScreen = ({ navigation }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [lastState, setLastState] = useState(null);
  const fetchScore = async () => {
    try {
      const res = await fetch(API_URL);
      const json = await res.json();
      setData(json[0]);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScore();
  }, []);

  const putUpdate = async (updated, saveUndo = true) => {
    try {
      setUpdating(true);
      if (saveUndo) {
        setLastState(data);
      }
      await fetch(`${API_URL}/${updated.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updated),
      });
      setData(updated);
    } catch (e) {
      Alert.alert('Error', 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const undoLastAction = () => {
    if (!lastState) {
      Alert.alert('Info', 'Nothing to undo');
      return;
    }
    Alert.alert('Confirm', 'Revert last action?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Undo',
        style: 'destructive',
        onPress: () => {
          putUpdate(lastState, false);
          setLastState(null);
        },
      },
    ]);
  };

  const toggleMatchStatus = () => {
    putUpdate({ ...data, matchStarted: !data.matchStarted });
  };

  const getOvers = balls => {
    const completedOvers = Math.floor(balls / 6);
    const ballsInOver = balls % 6;
    return `${completedOvers}.${ballsInOver}`;
  };

  const getRunRate = () => {
    if (!data || data.balls === 0) return '0.00';
    const overs = data.balls / 6;
    return (data.totalRun / overs).toFixed(2);
  };

  const getStrikeRate = (runs, balls) => {
    if (balls === 0) return '0.00';
    return ((runs / balls) * 100).toFixed(2);
  };

  const getEconomy = (runs, overs, balls) => {
    const totalBalls = overs * 6 + balls;
    if (totalBalls === 0) return '0.00';
    return ((runs / totalBalls) * 6).toFixed(2);
  };

  const addRun = run => {
    if (!data.matchStarted) {
      Alert.alert('Info', 'Start match first!');
      return;
    }

    const newBalls = data.balls + 1;
    const newThisOver = [...(data.thisOver || []), String(run)];
    const isOverComplete = newBalls % 6 === 0;

    let updatedData = {
      ...data,
      totalRun: data.totalRun + run,
      balls: newBalls,
      thisOver: isOverComplete ? [] : newThisOver,
      bowlerOvers: isOverComplete ? data.bowlerOvers + 1 : data.bowlerOvers,
      bowlerRuns: data.bowlerRuns + run,
      recentBalls: String(run),
    };

    if (data.onStrike === 'A') {
      updatedData.batsmanAScore = data.batsmanAScore + run;
      updatedData.batsmanABalls = data.batsmanABalls + 1;
    } else {
      updatedData.batsmanBScore = data.batsmanBScore + run;
      updatedData.batsmanBBalls = data.batsmanBBalls + 1;
    }

    if (run % 2 === 1 || isOverComplete) {
      updatedData.onStrike = data.onStrike === 'A' ? 'B' : 'A';
    }

    putUpdate(updatedData);
  };

  const addWicket = () => {
    if (!data.matchStarted) {
      Alert.alert('Info', 'Start match first!');
      return;
    }

    const newBalls = data.balls + 1;
    const newThisOver = [...(data.thisOver || []), 'W'];
    const isOverComplete = newBalls % 6 === 0;

    const updatedData = {
      ...data,
      totalWicket: data.totalWicket + 1,
      balls: newBalls,
      thisOver: isOverComplete ? [] : newThisOver,
      bowlerOvers: isOverComplete ? data.bowlerOvers + 1 : data.bowlerOvers,
      bowlerWickets: data.bowlerWickets + 1,
      ...(data.onStrike === 'A'
        ? { batsmanAScore: 0, batsmanABalls: 0 }
        : { batsmanBScore: 0, batsmanBBalls: 0 }),
      onStrike: isOverComplete
        ? data.onStrike === 'A'
          ? 'B'
          : 'A'
        : data.onStrike,
      recentBalls: 'W',
    };

    putUpdate(updatedData);
  };

  const addExtra = (type, runs = 1) => {
    if (!data.matchStarted) {
      Alert.alert('Info', 'Start match first!');
      return;
    }

    const extras = data.extras || { wides: 0, noBalls: 0, legByes: 0, byes: 0 };
    let newThisOver = [...(data.thisOver || [])];
    let newBalls = data.balls;
    let bowlerRuns = data.bowlerRuns;

    if (type === 'wide') {
      extras.wides += runs;
      newThisOver.push('Wd');
      bowlerRuns += runs;
    } else if (type === 'noBall') {
      extras.noBalls += runs;
      newThisOver.push('Nb');
      bowlerRuns += runs;
    } else if (type === 'legBye') {
      extras.legByes += runs;
      newThisOver.push('Lb');
      newBalls += 1;
    } else if (type === 'bye') {
      extras.byes += runs;
      newThisOver.push('B');
      newBalls += 1;
    }

    const isOverComplete = newBalls % 6 === 0 && newBalls !== data.balls;

    putUpdate({
      ...data,
      totalRun: data.totalRun + runs,
      extras,
      balls: newBalls,
      thisOver: isOverComplete ? [] : newThisOver,
      bowlerOvers: isOverComplete ? data.bowlerOvers + 1 : data.bowlerOvers,
      bowlerRuns,
      onStrike: isOverComplete
        ? data.onStrike === 'A'
          ? 'B'
          : 'A'
        : data.onStrike,
    });
  };

  const swapStrike = () => {
    putUpdate({ ...data, onStrike: data.onStrike === 'A' ? 'B' : 'A' });
  };

  const updateField = (field, value) => {
    setData(prev => ({ ...prev, [field]: value }));
  };

  const saveDetails = () => {
    putUpdate(data);
    Alert.alert('Success', 'Saved!');
  };

  const getBallColor = ball => {
    if (ball === 'W') return '#ff5252';
    if (ball === '4') return '#2196f3';
    if (ball === '6') return '#9c27b0';
    if (['Wd', 'Nb', 'Lb', 'B'].includes(ball)) return '#ff9800';
    return '#00e676';
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#ffea00" />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.loader}>
        <Text style={styles.errorText}>Failed to load data</Text>
      </View>
    );
  }

  const totalExtras =
    (data.extras?.wides || 0) +
    (data.extras?.noBalls || 0) +
    (data.extras?.legByes || 0) +
    (data.extras?.byes || 0);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Live Score Update</Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => navigation.navigate('LiveVideoScreen')}
          style={styles.watchLiveCard}
        >
          <View>
            <Text style={styles.watchLiveTitle}>Watch Live</Text>
            <Text style={styles.watchLiveSub}>
              Tap to watch live match streaming
            </Text>
          </View>

          <View style={styles.livePill}>
            <Text style={styles.livePillText}>LIVE ▶</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Score Display */}
      <View style={styles.scoreCard}>
        <View style={styles.teamNames}>
          <Text style={styles.teamName}>{data.teamA}</Text>
          <Text style={styles.vs}>vs</Text>
          <Text style={styles.teamName}>{data.teamB}</Text>
        </View>
        <View style={styles.battingTeamContainer}>
          <Text style={styles.battingLabel}>Batting: {data.battingTeam}</Text>
        </View>
        <View style={styles.mainScore}>
          <Text style={styles.runs}>{data.totalRun}</Text>
          <Text style={styles.slash}>/</Text>
          <Text style={styles.wickets}>{data.totalWicket}</Text>
        </View>
        <View style={styles.oversRow}>
          <Text style={styles.overs}>({getOvers(data.balls || 0)} ov)</Text>
          <Text style={styles.runRate}>RR: {getRunRate()}</Text>
        </View>
        {data.target > 0 && (
          <View style={styles.targetRow}>
            <Text style={styles.target}>Target: {data.target}</Text>
            <Text style={styles.need}>
              Need: {data.target - data.totalRun} runs
            </Text>
          </View>
        )}
      </View>

      {/* Ball Tracker */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Over</Text>
        <View style={styles.ballsRow}>
          {(data.thisOver || []).map((ball, i) => (
            <View
              key={i}
              style={[styles.ball, { backgroundColor: getBallColor(ball) }]}
            >
              <Text style={styles.ballText}>{ball}</Text>
            </View>
          ))}
          {Array(6 - (data.thisOver?.length || 0))
            .fill(0)
            .map((_, i) => (
              <View key={`empty-${i}`} style={styles.emptyBall} />
            ))}
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#00e676' }]} />
            <Text style={styles.legendText}>Runs</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ff5252' }]} />
            <Text style={styles.legendText}>Wicket</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#2196f3' }]} />
            <Text style={styles.legendText}>Four</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#9c27b0' }]} />
            <Text style={styles.legendText}>Six</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: '#ff9800' }]} />
            <Text style={styles.legendText}>Extra</Text>
          </View>
        </View>
      </View>

      {/* Player Stats */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Batsmen</Text>
        <View style={styles.playerCard}>
          <View
            style={[
              styles.playerRow,
              data.onStrike === 'A' && styles.onStrikeRow,
            ]}
          >
            <Text style={styles.playerName}>
              {data.onStrike === 'A' && '🏏 '}
              {data.batsmenA}
            </Text>
            <Text style={styles.playerScore}>
              {data.batsmanAScore} ({data.batsmanABalls})
            </Text>
            <Text style={styles.playerSR}>
              SR: {getStrikeRate(data.batsmanAScore, data.batsmanABalls)}
            </Text>
          </View>
          <View
            style={[
              styles.playerRow,
              data.onStrike === 'B' && styles.onStrikeRow,
            ]}
          >
            <Text style={styles.playerName}>
              {data.onStrike === 'B' && '🏏 '}
              {data.batsmenB}
            </Text>
            <Text style={styles.playerScore}>
              {data.batsmanBScore} ({data.batsmanBBalls})
            </Text>
            <Text style={styles.playerSR}>
              SR: {getStrikeRate(data.batsmanBScore, data.batsmanBBalls)}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Bowler</Text>
        <View style={styles.playerCard}>
          <View style={styles.playerRow}>
            <Text style={styles.playerName}>🎯 {data.bowler}</Text>
            <Text style={styles.playerScore}>
              {data.bowlerOvers}.{(data.balls || 0) % 6}-{data.bowlerRuns}-
              {data.bowlerWickets}
            </Text>
            <Text style={styles.playerSR}>
              Econ:{' '}
              {getEconomy(
                data.bowlerRuns,
                data.bowlerOvers,
                (data.balls || 0) % 6,
              )}
            </Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Extras: {totalExtras}</Text>
        <View style={styles.extrasRow}>
          <View style={styles.extraItem}>
            <Text style={styles.extraItemText}>
              Wd: {data.extras?.wides || 0}
            </Text>
          </View>
          <View style={styles.extraItem}>
            <Text style={styles.extraItemText}>
              Nb: {data.extras?.noBalls || 0}
            </Text>
          </View>
          <View style={styles.extraItem}>
            <Text style={styles.extraItemText}>
              Lb: {data.extras?.legByes || 0}
            </Text>
          </View>
          <View style={styles.extraItem}>
            <Text style={styles.extraItemText}>
              B: {data.extras?.byes || 0}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1221',
    padding: 16,
  },
  loader: {
    flex: 1,
    backgroundColor: '#0B1221',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  errorText: {
    color: '#ff5252',
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
    flexWrap: 'wrap',
    gap: 10,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#90a4ae',
    fontSize: 13,
    marginTop: 2,
  },
  headerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  liveBtn: {
    backgroundColor: '#ff1744',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  liveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  matchToggle: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  matchToggleText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  scoreCard: {
    backgroundColor: '#1a2744',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 234, 0, 0.2)',
  },
  teamNames: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  teamName: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
  },
  vs: {
    color: '#90a4ae',
    fontSize: 13,
  },
  battingTeamContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  battingLabel: {
    color: '#00e676',
    fontSize: 13,
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },
  mainScore: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'baseline',
    gap: 4,
  },
  runs: {
    color: '#ffea00',
    fontSize: 56,
    fontWeight: 'bold',
  },
  slash: {
    color: '#90a4ae',
    fontSize: 40,
  },
  wickets: {
    color: '#ff5252',
    fontSize: 40,
    fontWeight: 'bold',
  },
  oversRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 8,
  },
  overs: {
    color: '#90a4ae',
    fontSize: 15,
  },
  runRate: {
    color: '#2196f3',
    fontSize: 15,
    fontWeight: 'bold',
  },
  targetRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  target: {
    color: '#ff9800',
    fontSize: 13,
  },
  need: {
    color: '#ff5252',
    fontSize: 13,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#1a2744',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  ballsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  ball: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  ballText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  emptyBall: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#2a3f5f',
    borderStyle: 'dashed',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendText: {
    color: '#90a4ae',
    fontSize: 11,
  },
  playerCard: {
    marginBottom: 12,
  },
  playerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  },
  onStrikeRow: {
    backgroundColor: 'rgba(0, 230, 118, 0.2)',
  },
  playerName: {
    color: '#fff',
    fontWeight: 'bold',
    flex: 1,
    fontSize: 14,
  },
  playerScore: {
    color: '#ffea00',
    fontWeight: 'bold',
    marginRight: 12,
    fontSize: 14,
  },
  playerSR: {
    color: '#90a4ae',
    fontSize: 11,
  },
  extrasRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  extraItem: {
    backgroundColor: 'rgba(255, 152, 0, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  extraItemText: {
    color: '#ff9800',
    fontSize: 13,
  },
  runRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  runBtn: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  runBtnText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000',
  },
  headerContent: {
    alignItems: 'center',
    width: '100%',
  },
  wicketBtn: {
    backgroundColor: '#ff5252',
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  wicketBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  extraBtnsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  extraBtn: {
    flex: 1,
    minWidth: 70,
    backgroundColor: '#ff9800',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  extraBtnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 13,
  },
  watchLiveCard: {
    width: '100%',
    backgroundColor: '#162447',
    borderRadius: 24,
    padding: 18,
    marginBottom: 25,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  watchLiveTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  watchLiveSub: {
    fontSize: 14,
    color: '#cfd8dc',
    marginTop: 4,
  },
  livePill: {
    backgroundColor: '#ff1744',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
  },
  livePillText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  swapBtn: {
    backgroundColor: '#7c4dff',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  swapBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  undoBtn: {
    backgroundColor: '#607d8b',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  undoBtnDisabled: {
    opacity: 0.5,
  },
  undoBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  label: {
    color: '#90a4ae',
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#1c2b45',
    color: '#fff',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 12,
    borderRadius: 10,
    fontSize: 14,
  },
  saveBtn: {
    backgroundColor: '#2196f3',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  bottomSpacer: {
    height: 40,
  },
});

export default ScoreScreen;
