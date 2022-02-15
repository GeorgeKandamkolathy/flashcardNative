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
import SearchableDropdown from 'react-native-searchable-dropdown';

export default function Home({navigation}){
    const db = useDatabase();
    const [sets, setSets] = useState();
    const [modalVisible, setModalVisiblity] = useState(false);
    const [text, onChangeText] = useState();
    const [categoryText, onChangeCategoryText] = useState();
    const isVisible = useIsFocused();


    useEffect(() => {
        db.transaction((tx) => {
            tx.executeSql(
                "create table if not exists sets (id integer primary key not null, setName text, number integer default 0, session integer default 1, category text);", [], () => {},
                (t, error) => {
                    console.log(error);
                }
            );
            tx.executeSql(
                "create table if not exists cards (id integer primary key not null, face text, back text, setID integer references sets, box integer default 0, stage integer default 1, correct integer default 0, incorrect integer default 0, category text);", [], () => {},
                (t, error) => {
                    console.log(error);
                }
            )
        });
        db.transaction((tx) => {
            tx.executeSql(
                "select * from sets;", [],
                (_, { rows: {_array} }) => {
                    var array = _array;
                    array.push({id:-1, setName:"AddSetsCard", number:-1});
                    setSets(array)
                }, (t, error) => {
                    console.log(error);
                }
            )
        })
    }, [isVisible])

    const renderItem = ({item}) => {
        return(
            item.id==-1 && item.setName=="AddSetsCard" && item.number==-1 ? 
            <Pressable onPress={() => {setModalVisiblity(true)}}>
            <View style={{height:250, width:150, borderRadius:12, borderWidth:1, marginBottom:'8%', marginHorizontal:'5%', alignItems:'center', justifyContent:'center'}}>
                <Ionicons name="add" size={70} color="black" />
            </View>
            </Pressable>
            :
            <Pressable onPress={() => navigation.navigate('SetDetail', {setID:item.id, setName:item.setName, setSession:item.session})}>
            <View style={{height:250, width:150, borderRadius:12, borderWidth:1, marginBottom:'8%', marginHorizontal:'5%', alignItems:'center', justifyContent:'center'}}>
                <Text>{item.setName}</Text>
                <Text>{item.number}</Text>
                <Text>{item.category}</Text>
            </View>
            </Pressable>
        );
    }

    const onSubmit = () => {
        db.transaction((tx) => {
            tx.executeSql(
                "insert into sets (setName, category) values (?, ?);", [text, categoryText], () => {}, (t, error) => {
                    console.log(error);
                }
            );
            tx.executeSql(
                "select * from sets;", [],
                (_, { rows: {_array} }) => {
                    var array = _array;
                    array.push({id:-1, setName:"AddSetsCard", number:-1});
                    setSets(array)
                }, (t, error) => {
                    console.log(error);
                }
            )
        })
        setModalVisiblity(false)
    }

    return(
        <View style={{flex:1}}>
            <FlatList 
            style={{marginTop:'20%'}}
            contentContainerStyle={{alignItems:'center'}}
            numColumns={2}
            data={sets}
            renderItem={renderItem}/>
            <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisiblity(false)}
            >
            <View style={styles.modalView}>
                <Pressable style={{alignSelf:'flex-start'}} onPress={() => {setModalVisiblity(false)}}>
                <Ionicons name="close-outline" size={30} color="black"/>
                </Pressable>
                <Text>New Set</Text>
                <Text style={{alignSelf:'flex-start', marginTop:'5%'}}>Set name: </Text>
                <TextInput style={styles.textInput} onChangeText={onChangeText} onSubmitEditing={onSubmit} value={text}/>
                <Text style={{alignSelf:'flex-start', marginTop:'5%'}}>Category: </Text>
                <TextInput style={styles.textInput} onChangeText={onChangeCategoryText} onSubmitEditing={onSubmit} value={categoryText}/>
                <Pressable style={{backgroundColor:'#f7ae65', paddingTop:'3%', paddingBottom:'4%', paddingHorizontal:'5%', borderRadius:50}} onPress={onSubmit}>
                <Text>Save</Text>
                </Pressable>
            </View>
            </Modal>
        </View>
    )
}

const styles = StyleSheet.create({
    textInput: {
      height: 40,
      width: '100%',
      margin: 12,
      borderColor: 'rgba(18, 18, 18, 0.2)',
      borderRadius: 5,
      borderWidth: 1,
      padding: 10,
    },
    modalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
      },
  });
  