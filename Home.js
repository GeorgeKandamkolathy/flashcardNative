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

export default function Home({navigation}){
    const db = useDatabase();
	const [setSelectedMix, onSetSelectedMixChange] = useState([]);
	const [categorySelectedMix, onCategorySelectedMixChange] = useState([]);
    const [sets, setSets] = useState();
	const [search, setSearch] = useState();
    const [modalVisible, setModalVisiblity] = useState(false);
    const [text, onChangeText] = useState("");
	const [categories, setCategories] = useState([]);
    const [searchText, onSearchText] = useState();
	const [selectedCategories, onSelectedCategoriesChange] = useState();
	const [mixModalVisible, setMixModalVisiblity] = useState(false);
	const [setNameError, onSetNameError] = useState(false);
	const [categoryMixChoice, onSwitchMixChoice] = useState(true);
	const isVisible = useIsFocused();

    useEffect(() => {
        db.transaction((tx) => {
			tx.executeSql(
					"create table if not exists categories (id integer primary key not null, categoryName text unique);", [], () => {},
					(t, error) => {
							console.log(error);
					}
			)
			tx.executeSql(
					"create table if not exists sets (id integer primary key not null, setName text, number integer default 0, session integer default 1, categoryID text);", [], () => {},
					(t, error) => {
							console.log(error);
					}
			);
			tx.executeSql(
					"create table if not exists cards (id integer primary key not null, face text, back text, setID integer references sets, box integer default 0, stage integer default 1, correct integer default 0, incorrect integer default 0, category text, flagged integer default 0);", [], () => {},
					(t, error) => {
							console.log(error);
					}
			)
        });
        db.transaction((tx) => {
            tx.executeSql(
                "select * from sets;", [],
                (_, { rows: {_array} }) => {
					var tempSetSelectedMix = []
					_array.forEach((element, index) => {
						tempSetSelectedMix.push({id:element.id, itemName: element.setName, selected: false})
					})
					onSetSelectedMixChange(tempSetSelectedMix)
                    var array = _array;
                    array.push({id:-1, setName:"AddSetsCard", number:-1, categoryID:""});
                    setSets(array);
					setSearch(array);
                }, (t, error) => {
                    console.log(error);
                }
            )
			tx.executeSql(
				"select * from categories;", [],
				(_, { rows: {_array} }) => {
					setCategories(_array);
					var tempCategorySelectedMix = []
					_array.forEach((element, index) => {
						tempCategorySelectedMix.push({id:index, itemName: element.categoryName, selected: false})
					})
					onCategorySelectedMixChange(tempCategorySelectedMix)
				}, (t, error) => {
						console.log(error);
				}
			)
        })

		navigation.setOptions({ title:"Flashcards", headerTitleAlign: 'center', headerRight: () => {
			return (
			<Pressable onPress={() => navigation.navigate('Settings')}> 
				<Ionicons name="settings-outline" size={28} color="black" style={{marginRight:'1%'}}/>
			</Pressable>)
		},
		headerLeft: () => {
			return (
			<Pressable hitSlop={20} style={{width:60}} onPress={() => setMixModalVisiblity(true)}> 
				<Ionicons name="albums-outline" size={28} color="black" />
			</Pressable>
			)
		}
		})
    }, [isVisible])

	const addCategorytoSelected = (categoriesList) => {
		var seen = {};
		categoriesList.filter(function(item) {
			seen.hasOwnProperty(item) ? false : (seen[item] = true);
		});
		var result = Object.keys(seen).map((key) => key);
		onSelectedCategoriesChange(result)
	}
    const renderItem = ({item}) => {
        return(
            item.id==-1 && item.setName=="AddSetsCard" && item.number==-1 ? 
            <Pressable onPress={() => {setModalVisiblity(true)}}>
            <View style={styles.addCard}>
                <Ionicons name="add" size={70} color="black" />
            </View>
            </Pressable>
            :
            <Pressable onPress={() => navigation.navigate('SetDetail', {setID:item.id, setName:item.setName, setSession:item.session, currentCategories:item.categoryID})}>
            <View style={styles.set}>
                <Text style={{marginTop:'50%'}}>{item.setName}</Text>
                <Text numberOfLines={1} style={{width:'80%', textAlign:'center'}}>{item.categoryID}</Text>
				<View style={{flexDirection:'row', alignItems:'center', alignSelf:'flex-end', marginRight:'5%'}}>
					<Text style={{marginRight:'1%'}}>{item.number}</Text>
					<Ionicons name="albums-outline" size={28} color="black" />
				</View>
            </View>
            </Pressable>
        );
    }

    const onSubmit = () => {
		onSetNameError(false)
		if (text == "") {
			onSetNameError(true)
			return
		}
        db.transaction((tx) => {
            tx.executeSql(
                "insert into sets (setName, categoryID) values (?, ?);", [text,	selectedCategories.join(', ')], () => {}, (t, error) => {
                    console.log(error);
                }
            );
            tx.executeSql(
                "select * from sets;", [],
                (_, { rows: {_array} }) => {
					var tempSetSelectedMix = []
					_array.forEach((element, index) => {
						tempSetSelectedMix.push({id:element.id, itemName: element.setName, selected: false})
					})
					onSetSelectedMixChange(tempSetSelectedMix)
                    var array = _array;
                    array.push({id:-1, setName:"AddSetsCard", number:-1, categoryID:""});
                    setSets(array)
					setSearch(array)
                }, (t, error) => {
                    console.log(error);
                }
            )
        })
		onSelectedCategoriesChange([])
		onChangeText("")
        setModalVisiblity(false)
    }

	const onRunMix = () => {
		var selected = []
		var mixSets = []
		categorySelectedMix.forEach((element) => {
			if (element.selected) {
				selected.push(element.categoryName)
			}
		})
		sets.forEach((element) => {
			if (!mixSets.includes(element.id)){
				mixSets.push(element.id)
			}
		})
		navigation.navigate('PlayMixSet', {setID:mixSets});
		setMixModalVisiblity(false)
	}

	const searchFunction = (updatedText) => {
		onSearchText(updatedText)
		var mutableSets = sets;
		var searched = []
		mutableSets.forEach((element, index) => {
			if(element.setName.includes(updatedText) || element.categoryID.includes(updatedText)){
				searched.push(element);
			}
		})
		setSearch(searched)
	}

	const addNewCategory = (newCategory) => {
		var newCategoryName = newCategory.pop()
		db.transaction((tx) => {
			tx.executeSql(
				"insert into categories (categoryName) values (?);", [newCategoryName.name], () => {
				}, (t, error) => {
					console.log(error)
				}
			);
			tx.executeSql(
				"select * from categories;", [], (_, { rows: {_array} }) => {
					setCategories(_array)
					var tempSelectedMix = []
					_array.forEach((element, index) => {
						tempSelectedMix.push({id:index, itemName: element.categoryName, selected: false})
					})
					onCategorySelectedMixChange(tempSelectedMix)
				}, (t, error) => {
					console.log(error)
				}
			)
		})
	}

	function checkbox({item}){

		const onPress = () => {
			const tempCategorySelectedMix = categorySelectedMix.map((element) => {
				if (element.itemName === item.itemName) {
					element.selected = !item.selected;
				}
				else {
					element.selected = element.selected
				}
				return element;
			});
			onCategorySelectedMixChange(tempCategorySelectedMix)

			const tempSetSelectedMix = setSelectedMix.map((element) => {
				if (element.itemName === item.itemName) {
					element.selected = !item.selected;
				}
				else {
					element.selected = element.selected
				}
				return element;
			});
			onSetSelectedMixChange(tempSetSelectedMix)
		}
		
		return (
			<View style={{flexDirection:'row', alignItems:'center'}}>
			<Pressable onPress={() => {onPress()}}>
				<View style={{height:25, width:25, borderWidth:2, justifyContent:'center', alignItems:'center', margin:10}}>
				{
					item.selected ?
					<View style={{height:16, width:16, backgroundColor:'#26fcce'}}/>
					:
					null
				}
				</View>
			</Pressable>
			<Text>{item.itemName}</Text>
			</View>
		)
	}

    return(
        <View style={{flex:1, backgroundColor:'#f5f5f5'}}>
            <TextInput style={styles.searchBar} onChangeText={(updatedText) => {searchFunction(updatedText)}} value={searchText} placeholder='Search'/>
			<FlatList 
            style={{marginTop:'10%'}}
            contentContainerStyle={{alignItems:'center'}}
            numColumns={2}
            data={search}
            renderItem={renderItem}/>
            <Modal
            animationType="slide"
            transparent={true}
            visible={modalVisible}
            onRequestClose={() => setModalVisiblity(false)}
            >
            <View style={styles.modalView}>
				<View style={{flexDirection:'row', justifyContent:'space-between', width:'100%', marginBottom:'2%'}}>
					<Pressable hitSlop={5} style={{alignSelf:'flex-start'}} onPress={() => {setModalVisiblity(false); onSelectedCategoriesChange(); onChangeText(""); onSetNameError(false);}}>
					<Ionicons name="close-outline" size={30} color="black"/>
					</Pressable>
					<Pressable style={{backgroundColor:'#f7ae65', paddingTop:'2%', paddingBottom:'3%', paddingHorizontal:'5%', borderRadius:50}} onPress={onSubmit}>
					<Text>Save</Text>
					</Pressable>
				</View>
                <Text>New Set</Text>
                <Text style={{alignSelf:'flex-start', marginTop:'5%'}}>Set name: </Text>
                <TextInput style={setNameError ? styles.setNameError : styles.textInput } onChangeText={onChangeText} onSubmitEditing={onSubmit} value={text}/>
                <Text style={{alignSelf:'flex-start', marginTop:'5%'}}>Category: </Text>
				<MultiSelect
					displayKey='categoryName'
					canAddItems={true}
					items={categories}
					uniqueKey="categoryName"
					onSelectedItemsChange={addCategorytoSelected}
					selectedItems={selectedCategories}
					selectText="Pick Items"
					searchInputPlaceholderText="Search Items..."
					submitButtonText="Submit"
					styleMainWrapper={{width:"100%"}}
					tagContainerStyle={{width:"48%"}}
					onAddItem={(newCategory) => {addNewCategory(newCategory)}}
					textInputProps={{maxLength:15}}
				/>
            </View>
            </Modal>
			<Modal
            animationType="slide"
            transparent={true}
            visible={mixModalVisible}
            onRequestClose={() => setMixModalVisiblity(false)}
            >
            <View style={styles.modalView}>
				<Pressable style={{alignSelf:'flex-start', marginBottom:'5%'}} onPress={() => {setMixModalVisiblity(false)}}>
					<Ionicons name="close-outline" size={30} color="black"/>
				</Pressable>
				<Text style={{marginBottom:'5%'}}>Select Categories or Sets to draw Cards from:</Text>
				<View style={{flexDirection:'row', justifyContent:'space-evenly', backgroundColor:'#c4c4c4', borderRadius:20, paddingVertical:'1%'}}>
					<Pressable onPress={() => {onSwitchMixChoice(true)}} style={categoryMixChoice ? styles.mixSelected : styles.mixNotSelected}>
						<Text>Categories</Text>
					</Pressable>
					<Pressable onPress={() => {onSwitchMixChoice(false)}} style={!categoryMixChoice ? styles.mixSelected : styles.mixNotSelected}>
						<Text>Sets</Text>
					</Pressable>
				</View>
				<FlatList 
				style={{marginTop:'4%'}}
				contentContainerStyle={{alignItems:'flex-start'}}
				data={categoryMixChoice ? categorySelectedMix : setSelectedMix}
				renderItem={checkbox}/>

				<Pressable style={{backgroundColor:'#f7ae65', paddingTop:'2%', paddingBottom:'3%', paddingHorizontal:'5%', borderRadius:50, marginTop:'5%'}} onPress={onRunMix}>
					<Text style={{textAlign:'center'}}>Run Mix</Text>
				</Pressable>
			</View>
			</Modal>
        </View>
    )
}

const styles = EStyleSheet.create({
	mixSelected: {
		backgroundColor:'#ededed', 
		paddingHorizontal:'8%', 
		borderRadius:20, 
		elevation:2
	},
	mixNotSelected: {
		backgroundColor:'#c4c4c4', 
		paddingHorizontal:'8%', 
		borderRadius:20, 
	},
	set: {
		height:"17rem",
		width:"11rem",
		borderRadius:12,
		borderWidth:1, 
		borderColor:'#d4d4d4', 
		marginBottom:'8%', 
		marginLeft:'5%',
		alignItems:'center', 
		justifyContent: 'space-between', 
		backgroundColor:'#fcfcfc', 
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.8,
		shadowRadius: 2,  
		elevation: 5,
		padding: "0.2rem",
	},
	addCard: {
		height:"17rem",
		width:"11rem",
		borderRadius:12,
		borderWidth:1, 
		borderColor:'#d4d4d4', 
		marginBottom:'8%', 
		marginLeft:'5%',
		alignItems:'center', 
		justifyContent: 'center', 
		backgroundColor:'#fcfcfc', 
		shadowColor: '#000',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.8,
		shadowRadius: 2,  
		elevation: 5,
		padding: "0.2rem",
	},
	searchBar: {
		marginTop: '5%',
		height: '2.5rem',
		width: '85%',
		alignSelf:'center',
		borderColor: 'rgba(18, 18, 18, 0.2)',
		borderRadius: 15,
		borderWidth: 1,
		padding: 10,
		paddingLeft: 15,
		backgroundColor:'#fafafa'
	},
	textInput: {
		width: '60%',
		marginVertical: 6,
		borderColor: 'rgba(18, 18, 18, 0.2)',
		borderBottomWidth: 1,
		padding: 0,
		marginBottom:'5%',
	},
	setNameError: {
		height: 40,
		width: '100%',
		margin: 12,
		borderColor: 'red',
		borderRadius: 5,
		borderWidth: 1,
		padding: 10,
	},
	modalView: {
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
});
  