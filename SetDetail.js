import { 
  StyleSheet,
  View, 
  FlatList,
  TextInput,
  Text,
  Modal,
  Pressable
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useContext } from "react";
import * as SQLite from "expo-sqlite";
import {useDatabase} from './DatabaseContext'

export default function SetDetail({navigation, route}) {
    const {setID, setName, setSession} = route.params;
    const db = useDatabase();
    const [cards, setCards] = useState();
    const [faceText, onFaceTextChange] = useState();
    const [backText, onBackTextChange] = useState();
    const [modalVisible, setModalVisiblity] = useState(false);
    const [edit, setEdit] = useState(false);

    useEffect(() => {
        db.transaction((tx) => {
            tx.executeSql("select * from cards where setID=?;", [setID], 
            (_, { rows: {_array} }) => {
                var array = _array;
                array.push({id:-1, face:"addCard"});
                setCards(array)
            }), (t, error) => {
                console.log(error);
            }
        })
        navigation.setOptions({ title:setName, headerRight: () => (
        <View style={{flexDirection:'row'}}>
        <Pressable onPress={() => {navigation.navigate('PlaySet', {setID:setID, setName:setName, setSession:setSession})}}> 
            <Ionicons name="play-outline" size={35} color="black" style={{marginLeft:'2%'}}/>
        </Pressable>
        <Pressable onPress={() => {setEdit(false); onFaceTextChange(""); onBackTextChange("");setModalVisiblity(true)}}> 
            <Ionicons name="add" size={35} color="black" />
        </Pressable>
        </View>
        ) 
        })
    }, [])


    const onSubmit = () => {
        if (edit != false) {
            db.transaction((tx) => {
                tx.executeSql(
                    "update cards set face=?, back=? where id=?;", [faceText, backText, edit]
                );
                tx.executeSql("select * from cards where setID=?;", [setID], 
                (_, { rows: {_array} }) => {
                    var array = _array;
                    array.push({id:-1, face:"addCard"});
                    setCards(array)
                })
            })
        }
        else {
            db.transaction((tx) => {
                tx.executeSql(
                    "insert into cards (face, back, setID) values (?, ?, ?);", [faceText, backText, setID]
                );
                tx.executeSql(
                    "update sets set number=number+1 where id=?;", [setID]
                )
                tx.executeSql("select * from cards where setID=?;", [setID], 
                (_, { rows: {_array} }) => {
                    var array = _array;
                    array.push({id:-1, face:"addCard"});
                    setCards(array)
                })
            })
        }
        setModalVisiblity(false)
    }

    const renderItem = ({item}) => {
        return(
            (item.id==-1 && item.face=="addCard") ? 
            (
            <View>
                <Pressable onPress={() => {setEdit(false); onFaceTextChange(""); onBackTextChange(""); setModalVisiblity(true)}}>
                <View style={{height:600, width:350, borderRadius:12, borderWidth:1, alignItems:'center', justifyContent:'center', margin:25}}>
                        <Ionicons name="add" size={70} color="black" />
                </View>
                </Pressable>
            </View>
            )
            :
            (
            <View>
                <Pressable onPress={() => {setEdit(item.id);onFaceTextChange(item.face);onBackTextChange(item.back);setModalVisiblity(true)}}>
                <View style={{height:600, width:350, borderRadius:12, borderWidth:1, alignItems:'center', justifyContent:'center', margin:25}}>
                        <Text style={{}}>Face: {item.face}</Text>
                        <Text>Back: {item.back} </Text>
                        <Text>Correct: {item.correct}</Text>
                        <Text>Incorrect: {item.incorrect}</Text>
                </View>
                </Pressable>
            </View>
            )
        );
    }

    return(
        <View style={{flex:1}}>
            <FlatList            
            data={cards}
            renderItem={renderItem}
            horizontal={true}
            contentContainerStyle={{alignItems:'center'}}
            keyExtractor={item => item.id}
            />
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
                <Text>Add Card</Text>
                <Text style={{alignSelf:'flex-start', marginTop:'5%'}}>Card face: </Text>
                <TextInput style={styles.textInput} onChangeText={onFaceTextChange} onSubmitEditing={onSubmit} value={faceText} multiline numberOfLines={4} textAlignVertical={true}/>
                <Text style={{alignSelf:'flex-start', marginTop:'5%'}}>Card back: </Text>
                <TextInput style={styles.textInput} onChangeText={onBackTextChange} onSubmitEditing={onSubmit} value={backText} multiline numberOfLines={4} textAlignVertical={true}/>
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
        width: '100%',
        margin: 12,
        borderColor: 'rgba(18, 18, 18, 0.2)',
        borderRadius: 5,
        borderWidth: 1,
        padding: 10,
        textAlignVertical:'top'
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