import { 
  StyleSheet,
  View, 
  FlatList,
  TextInput,
  Text,
  Modal,
  Pressable,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useContext } from "react";
import * as SQLite from "expo-sqlite";
import {useDatabase} from './DatabaseContext'
import EStyleSheet from 'react-native-extended-stylesheet';
import MultiSelect from 'react-native-multiple-select';
import { createIconSetFromIcoMoon } from 'react-native-vector-icons';


export default function SetDetail({navigation, route}) {
    const {setID, setName, setSession, currentCategories} = route.params;
    const db = useDatabase();
    const [cards, setCards] = useState();
    const [faceText, onFaceTextChange] = useState();
    const [backText, onBackTextChange] = useState();
    const [modalVisible, setModalVisibility] = useState(false);
    const [deleteModalVisible, setDeleteModalVisibility] = useState(false);
    const [deleteSetModalVisible, setDeleteSetModalVisibility] = useState(false);
    const [settingsModalVisible, setSettingsModalVisibility] = useState(false);
    const [setNameText, onChangeSetNameText] = useState(setName);
    const [edit, setEdit] = useState(false);
    const [search, setSearch] = useState();
    const [searchText, onSearchText] = useState();
    const [deleteCardID, setDeleteCardID] = useState();
    const [selectedCategories, onSelectedCategoriesChange] = useState([]);
	const [categories, setCategories] = useState([]);
    const [flagged, toggleFlagged] = useState(false)


    useEffect(() => {
        db.transaction((tx) => {
            tx.executeSql("select * from cards where setID=?;", [setID], 
            (_, { rows: {_array} }) => {
                var array = _array;
                array.push({id:-1, face:"addCard", back:"addCard"});
                setCards(array)
                setSearch(array)
            }, (t, error) => {
                console.log(error);
            })
            tx.executeSql(
				"select * from categories;", [],
				(_, { rows: {_array} }) => {
					setCategories(_array);
				}, (t, error) => {
						console.log(error);
				}
			)
        })
        onSelectedCategoriesChange(currentCategories.split(", "))
        navigation.setOptions({ title: setNameText, headerRight: () => {
            return (
            <View style={{flexDirection:'row'}}>
            <Pressable style={{marginRight:10}} onPress={() => {navigation.navigate('PlaySet', {setID:setID, setName:setNameText, setSession:setSession})}}> 
                <Ionicons name="play-outline" size={35} color="black" style={{paddingRight:'2%', paddingLeft:'2%'}}/>
            </Pressable>
            <Pressable onPress={() => {setEdit(false); onFaceTextChange(""); onBackTextChange("");setModalVisibility(true)}}> 
                <Ionicons name="add" size={35} color="black" style={{paddingLeft:'2%'}} />
            </Pressable>
            </View>
            )
        }
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
                    array.push({id:-1, face:"addCard", back:"addCard"});
                    setCards(array)
                    setSearch(array)
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
                    array.push({id:-1, face:"addCard", back:"addCard"});
                    setCards(array)
                    setSearch(array)
                })
            })
        }
        onFaceTextChange(null)
        onBackTextChange(null)
        setModalVisibility(false)
    }

    const onFlagToggle = (curCard) => {
        db.transaction((tx) => {
            tx.executeSql(
                "update cards set flagged=? where id=?;", [curCard.flagged, curCard.id], () => {}, (t,error) => {
                    console.log(error)
                }
            )
        })
    }

    const onSubmitSettings = () => {
        db.transaction((tx) => {
            tx.executeSql(
                "update sets set setName=?, categoryID=? where id=?;", [setNameText, selectedCategories.join(', '), setID]
            )
        })
        navigation.setOptions({ title:setNameText})
        setSettingsModalVisibility(false)
    }

    const onDeleteSet = () => {
        db.transaction((tx) => {
            tx.executeSql(
                "delete from sets where id=?;", [setID]
            );
        })
        navigation.goBack()
        setSettingsModalVisibility(false)
    }

    const deleteCard = () => {
        db.transaction((tx) => {
            tx.executeSql(
                "delete from cards where id=?;", [deleteCardID]
            );
            tx.executeSql("select * from cards where setID=?;", [setID], 
            (_, { rows: {_array} }) => {
                var array = _array;
                array.push({id:-1, face:"addCard", back:"addCard"});
                setCards(array)
                setSearch(array)
            })
        })
        setDeleteModalVisibility(false)
    }

    const renderItem = ({item}) => {
        return(
            (item.id==-1 && item.face=="addCard") ? 
            (
            <View>
                <Pressable onPress={() => {setEdit(false); onFaceTextChange(""); onBackTextChange(""); setModalVisibility(true)}}>
                <View style={styles.addCard}>
                        <Ionicons name="add" size={70} color="black" />
                </View>
                </Pressable>
            </View>
            )
            :
            (
            <View>
                <View style={styles.card}>
                    <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%'}}>
                        <Pressable style={{marginTop:'4%', marginLeft:'4%'}} onPress={() => {setEdit(item.id);onFaceTextChange(item.face);onBackTextChange(item.back);setModalVisibility(true)}}>
                        <Ionicons name="pencil-outline" size={30} color="black" />
                        </Pressable>
                        <Pressable key={flagged} style={{marginTop:'-1.5%'}} onPress={() => {onFlagToggle(item); toggleFlagged(!flagged); item.flagged = (item.flagged == 0 ? 1 : 0)}}>
                        {item.flagged == 1 ?
                            <Ionicons name="bookmark" size={50} color="red" />
                            :
                            <Ionicons name="bookmark-outline" size={50} color="red" />
                        }
                        </Pressable>
                        <Pressable style={{marginTop:'4%', marginRight:'4%'}} onPress={() => {setDeleteModalVisibility(true); setDeleteCardID(item.id)}}>
                        <Ionicons name="trash-outline" size={30} color="black" />
                        </Pressable>
                    </View>
                    <View style={{alignSelf:'center'}}>
                        <Text style={{}}>Face: {item.face}</Text>
                        <Text>Back: {item.back} </Text>
                    </View>
                    <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%'}}>
                        <Text style={{marginBottom:'4%', marginLeft:'4%'}}>Correct: {item.correct}</Text>
                        <Text style={{marginBottom:'4%', marginRight:'4%'}}>Incorrect: {item.incorrect}</Text>
                    </View>
                </View>
            </View>
            )
        );
    }

    const searchFunction = (updatedText) => {
        onSearchText(updatedText)
        var mutableSets = cards;
        var searched = []
        mutableSets.forEach((element, index) => {
            if(element.face.includes(updatedText) || element.back.includes(updatedText)){
                searched.push(element);
            }
        })
        setSearch(searched)
    }

    return(
        <View style={{flex:1}}>
            <View style={{flexDirection:'row', justifyContent:'center', alignItems:'center', marginTop:'5%'}}>
                <TextInput style={styles.searchBar} onChangeText={(updatedText) => {searchFunction(updatedText)}} value={searchText} placeholder='Search'/>
                <Pressable hitSlop={5} onPress={() => { onChangeSetNameText(setNameText); setSettingsModalVisibility(true);}}>
                    <Ionicons name="settings-outline" size={30} color="black"/>
                </Pressable>
            </View>
            <FlatList            
            data={search}
            renderItem={renderItem}
            horizontal={true}
            contentContainerStyle={{alignItems:'center'}}
            keyExtractor={item => item.id}
            initialNumToRender={10}
            />            
            <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisibility(false)}
            >
            <View style={styles.modalView}>
                <View style={{flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom:'2%'}}>
                <Pressable style={{alignSelf:'flex-start'}} onPress={() => {setModalVisibility(false)}}>
                    <Ionicons name="close-outline" size={30} color="black"/>
                </Pressable>
                <Pressable style={{backgroundColor:'#f7ae65', paddingTop:'2%', paddingBottom:'3%', paddingHorizontal:'5%', borderRadius:50}} onPress={onSubmit}>
                    <Text>Save</Text>
                </Pressable>
                </View>
                {edit ? 
                <Text> Edit Card </Text>
                : 
                <Text> Add Card </Text>
                }
                <Text style={{alignSelf:'flex-start', marginTop:'5%'}}>Card face: </Text>
                <TextInput style={styles.textInput} onChangeText={onFaceTextChange} onSubmitEditing={onSubmit} value={faceText} multiline numberOfLines={4} textAlignVertical={true}/>
                <Text style={{alignSelf:'flex-start', marginTop:'5%'}}>Card back: </Text>
                <TextInput style={styles.textInput} onChangeText={onBackTextChange} onSubmitEditing={onSubmit} value={backText} multiline numberOfLines={4} textAlignVertical={true}/>
            </View>
            </Modal>
            <Modal
            animationType="slide"
            transparent={true}
            visible={deleteModalVisible}
            onRequestClose={() => setDeleteModalVisibility(false)}
            >
            <View style={styles.deleteModalView}>
                <Pressable style={{alignSelf:'flex-start'}} onPress={() => {setDeleteModalVisibility(false)}}>
                    <Ionicons name="close-outline" size={30} color="black"/>
                </Pressable>
                <Text>Delete?</Text>
                <View style={{flexDirection:'row', marginTop:'8%'}}>
                    <Pressable style={{backgroundColor:'#f7ae65', paddingTop:'3%', paddingBottom:'4%', paddingHorizontal:'8%', borderRadius:50, marginRight:'5%'}} onPress={() => {deleteCard()}}>
                        <Text>Yes</Text>
                    </Pressable>
                    <Pressable style={{backgroundColor:'#f7ae65', paddingTop:'3%', paddingBottom:'4%', paddingHorizontal:'8%', borderRadius:50, marginLeft:'5%'}} onPress={() => {setDeleteModalVisibility(false)}}>
                        <Text>No</Text>
                    </Pressable>
                </View>

            </View>
            </Modal>
            <Modal
            animationType="slide"
            transparent={true}
            visible={settingsModalVisible}
            onRequestClose={() => setSettingsModalVisibility(false)}
            >
            <View style={styles.settingsModalView}>
                <View style={{flexDirection:'row', justifyContent:'space-between'}}>
                    <Pressable style={{alignSelf:'flex-start'}} onPress={() => {setSettingsModalVisibility(false)}}>
                        <Ionicons name="close-outline" size={30} color="black"/>
                    </Pressable>
                    <Pressable style={{backgroundColor:'#f7ae65', paddingTop:'3%', paddingBottom:'4%', paddingHorizontal:'8%', borderRadius:50, marginLeft:'5%', alignSelf:'center'}} onPress={onSubmitSettings}>
                        <Text>Save</Text>
                    </Pressable>
                </View>

                <Text style={{alignSelf:'center'}}>Settings</Text>
                <Text>Set Name</Text>
                <TextInput style={{ width: '60%',
                    marginVertical: 6,
                    borderColor: 'rgba(18, 18, 18, 0.2)',
                    borderBottomWidth: 1,
                    padding: 0,
                    marginBottom:'5%',
                }} onChangeText={onChangeSetNameText} onSubmitEditing={onSubmitSettings} value={setNameText}/>
                <Text>Set Categories</Text>
                <MultiSelect
					displayKey='categoryName'
					canAddItems={true}
					items={categories}
					uniqueKey="categoryName"
					onSelectedItemsChange={onSelectedCategoriesChange}
					selectedItems={selectedCategories}
					selectText="Pick Items"
					searchInputPlaceholderText="Search Items..."
					submitButtonText="Submit"
					styleMainWrapper={{width:"100%"}}
					tagContainerStyle={{width:"48%"}}
					onAddItem={(newCategory) => {addNewCategory(newCategory)}}
				/>
                <Pressable style={{backgroundColor:'#f53a1d', paddingTop:'3%', paddingBottom:'4%', paddingHorizontal:'8%', borderRadius:10, marginLeft:'5%', marginTop:'5%', alignSelf:'center'}} onPress={() => setDeleteSetModalVisibility(true)}>
                    <Text>Delete</Text>
                </Pressable>
            </View>
            </Modal>
            <Modal
                animationType="slide"
                transparent={true}
                visible={deleteSetModalVisible}
                onRequestClose={() => setDeleteSetModalVisibility(false)}
                >
                <View style={styles.deleteModalView}>
                    <Pressable style={{alignSelf:'flex-start'}} onPress={() => {setDeleteSetModalVisibility(false)}}>
                        <Ionicons hitSlop={5} name="close-outline" size={30} color="black"/>
                    </Pressable>
                    <Text>Delete?</Text>
                    <View style={{flexDirection:'row', marginTop:'8%'}}>
                        <Pressable style={{backgroundColor:'#f7ae65', paddingTop:'3%', paddingBottom:'4%', paddingHorizontal:'8%', borderRadius:50, marginRight:'5%'}} onPress={() => {onDeleteSet()}}>
                            <Text>Yes</Text>
                        </Pressable>
                        <Pressable style={{backgroundColor:'#f7ae65', paddingTop:'3%', paddingBottom:'4%', paddingHorizontal:'8%', borderRadius:50, marginLeft:'5%'}} onPress={() => {setDeleteSetModalVisibility(false)}}>
                            <Text>No</Text>
                        </Pressable>
                    </View>

                </View>
                </Modal> 
        </View>
    )
}

const styles = EStyleSheet.create({
    addCard: {
        height:600, 
        width:350, 
        borderRadius:12, 
        borderWidth:1, 
        alignItems:'center', 
        justifyContent:'center',
        backgroundColor:'#fcfcfc', 
        borderColor:'#dbdbdb', 
        margin:25,
        elevation: 3
    },
    card: {
        height:600, 
        width:350, 
        borderRadius:12, 
        borderWidth:1, 
        alignItems:'center',
        justifyContent:'space-between', 
        backgroundColor:'#fcfcfc', 
        borderColor:'#dbdbdb', 
        margin:25,
        elevation: 3
    },
    textInput: {
        width: '100%',
        maxHeight: '30%',
        marginVertical: 10,
        borderColor: 'rgba(18, 18, 18, 0.2)',
        borderRadius: 5,
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingBottom: 5,
        textAlignVertical:'top',
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
    deleteModalView: {
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        marginTop:'75%',
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    settingsModalView: {
        justifyContent:'center',
        margin: 20,
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 5,
    },
    searchBar: {
		height: "2.5rem",
		width: '85%',
		alignSelf:'center',
		borderColor: 'rgba(18, 18, 18, 0.2)',
		borderRadius: 15,
		borderWidth: 1,
		padding: 10,
		paddingLeft: 15,
		backgroundColor:'#fafafa',
        marginRight: '2%',
    },
  });