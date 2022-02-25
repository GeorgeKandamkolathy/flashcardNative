import { StatusBar } from 'expo-status-bar';
import { 
  StyleSheet,
  View, 
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useContext } from "react";
import * as SQLite from "expo-sqlite";
import {useDatabase} from './DatabaseContext'
import { useIsFocused } from "@react-navigation/native";
import MultiSelect from 'react-native-multiple-select';
import { createIconSetFromFontello } from 'react-native-vector-icons';
import EStyleSheet from 'react-native-extended-stylesheet';

export default function Settings() {
    return (
        <View style={{flex:1}}>
            <Text>Manage Categories</Text>
            <Pressable>
            </Pressable>
        </View>
    )
}