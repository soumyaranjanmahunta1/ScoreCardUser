import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import IntroScreen from './src/screens/IntroScreen';
import MatchListScreen from './src/screens/MatchListScreen';
import ScoreScreen from './src/screens/ScoreScreen';
import LiveVideoScreen from './src/screens/LiveVideoScreen';

import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { LogBox } from 'react-native';
const Stack = createStackNavigator();
LogBox.ignoreAllLogs(true);
const App = () => {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Intro">
          <Stack.Screen
            name="Intro"
            component={IntroScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="MatchList"
            component={MatchListScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="Score"
            component={ScoreScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="LiveVideoScreen"
            component={LiveVideoScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
};
export default App;
