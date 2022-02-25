import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import Home from './Home';
import SetDetail from './SetDetail';
import PlaySet from './PlaySet';
import PlayMixSet from './PlayMixSet';
import Settings from './Settings';
import * as SQLite from "expo-sqlite";
import {DatabaseProvider} from './DatabaseContext';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { gestureHandlerRootHOC, GestureHandlerRootView } from 'react-native-gesture-handler';
import EStyleSheet from 'react-native-extended-stylesheet';
import * as React from 'react';

function openDatabase() {

  if (Platform.OS === "web") {
    return {
      transaction: () => {
        return {
          executeSql: () => {},
        };
      },
    };
  }

  const db = SQLite.openDatabase("testFlash14.db");
  return db
}

const db = openDatabase();
const Stack = createNativeStackNavigator();

export default function App() {
  EStyleSheet.build({});

  return (
      <DatabaseProvider db={db}>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Home" component={Home} options={{
              headerShadowVisible: false,
            }}/>
            <Stack.Screen name="SetDetail" component={SetDetail}/>
            <Stack.Screen name="PlaySet" component={gestureHandlerRootHOC(PlaySet)}/>
            <Stack.Screen name="PlayMixSet" component={gestureHandlerRootHOC(PlayMixSet)}/>
            <Stack.Screen name="Settings" component={Settings}/>
          </Stack.Navigator>
        </NavigationContainer>
      </DatabaseProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
