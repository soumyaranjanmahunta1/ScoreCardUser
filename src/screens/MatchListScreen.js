import React, { useCallback, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import axios from 'axios';
import { useFocusEffect } from '@react-navigation/native';

const MatchListScreen = ({ navigation }) => {
  const [resultData, setResultData] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchResultData = async () => {
    try {
      const response = await axios(
        'https://68e75da010e3f82fbf3ed1c5.mockapi.io/MatchLists',
      );
      setResultData(response?.data);
    } catch (error) {
      console.error('Error fetching results:', error);
    } finally {
      setTimeout(() => setLoading(false), 1000);
    }
  };

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      fetchResultData();
    }, []),
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Available Matches</Text>

      {loading ? (
        <Text style={{ color: '#fff', textAlign: 'center' }}>Loading...</Text>
      ) : (
        resultData.map(match => (
          <TouchableOpacity
            key={match.id}
            style={styles.card}
            onPress={() => navigation.navigate('Score', { match })}
          >
            <Text style={styles.vsText}>
              {match.first_team_name} 🆚 {match.second_team_name}
            </Text>

            <Text style={styles.tournament}>{match.tournament_name}</Text>

            <Text style={styles.overs}>Overs: {match.overs}</Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
};
export default MatchListScreen;
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1221',
    padding: 20,
  },
  header: {
    color: '#fff',
    fontSize: 26,
    marginTop: 20,
    marginBottom: 20,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#1c2b45',
    padding: 20,
    borderRadius: 15,
    marginBottom: 20,
  },
  vsText: {
    color: '#ffea00',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  tournament: {
    color: '#cfd8dc',
    fontSize: 16,
    marginBottom: 5,
  },
  overs: {
    color: '#00e676',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
