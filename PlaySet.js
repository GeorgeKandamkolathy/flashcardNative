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
import { FlingGestureHandler, Directions} from 'react-native-gesture-handler';
import { Animated } from 'react-native';

export default function PlaySet({navigation, route}) {
    const {setID, setName, setSession} = route.params;
    const db = useDatabase();
    const [cards, setCards] = useState();
    const [curCard, setCurCard] = useState(null);
    const [nextCard, setNextCard] = useState(null);
    const [flip, setFlip] = useState(false)
    const [offsetX, setOffsetX] = useState(new Animated.Value(0))
    const [flagged, toggleFlagged] = useState(false)

    const boxes = [[1,3,6,10], [2,4,7,1], [3,5,8,2], [4,6,9,3], [5,7,10,4], [6,8,1,5], [7,9,2,6], [8,10,3,7], [9,1,4,8], [10,2,5,9]]

    const getSessionCards = (array) => {
        var sessionCards = [];
        var retiredCards = [];
        var retired = 0
        array.forEach((element, index) => {
            if (element.box == 0 || boxes[setSession-1].includes(element.box)){
                sessionCards.push(element);
            }
            if (element.box == 12) {
                retiredCards.push(element);
                retired += 1;
            }
        })
        if (array.length * 0.75 <= retired) {
            for(let i = 0; i < array.length * 0.4; i++) {
                var random = Math.floor(Math.random()*retiredCards.length)
                var card = retiredCards[random]
                db.transaction((tx) => {
                    tx.executeSql(
                        "update cards set box=0, stage=4 where id=?", [card.id]
                    )
                })
                retiredCards.splice(random, 1)
            }
        }
        var selected = Math.floor(Math.random()*sessionCards.length)
        setCurCard(sessionCards[selected])
        sessionCards.splice(selected, 1)
        selected = Math.floor(Math.random()*sessionCards.length)
        setNextCard(sessionCards[selected])
        sessionCards.splice(selected, 1)
        setCards(sessionCards)
    }

    useEffect(() => {
        db.transaction((tx) => {
          tx.executeSql(
              "select * from cards where setID in (?);", [setID], (_, { rows: {_array} }) => {
                getSessionCards(_array)
              }, (t, error) => {
                (error);
            }
          );  
          var updateSetSession = ((setSession + 1)==11 ? 1 : (setSession + 1))
          tx.executeSql(
            "update sets set session=? where id=?;", [updateSetSession, setID], () => {}, 
            (t, error) => {
              console.log(error);
            }
            );  
        })
        navigation.setOptions({title:setName})
    }, [])

    const getNextCard = () => {
        if (cards.length == 0) {
            setCurCard(nextCard)
            setNextCard({face:'empty', back:'empty', box:-1, stage:-1})
            return
        }
        setCurCard(nextCard)
        var selected = Math.floor(Math.random()*cards.length)
        var cardsDuplicate = cards
        setNextCard(cardsDuplicate[selected])
        cardsDuplicate.splice(selected, 1)
        setCards(cardsDuplicate)
    }

    const onThumbsUp = () => {
        db.transaction((tx) => {
            if (curCard.stage >= 4){
                tx.executeSql(
                    "update cards set box=12, stage=0 where id=?;", [curCard.id]
                )
            }
            else if (curCard.box == 0){
                tx.executeSql(
                    "update cards set box=? where id=?;", [setSession, curCard.id]
                )
            }
            else {
                tx.executeSql(
                    "update cards set stage=stage+1 where id=?;", [curCard.id]
                )
            }
            tx.executeSql(
                "update cards set correct=correct+1 where id=?", [curCard.id]
            )
        })
        Animated.timing(
            offsetX,
            { toValue: 400, 
            duration: 300,
            useNativeDriver: true }
        ).start(() => {
            getNextCard()
            Animated.timing(
                offsetX,
                { toValue: 0, 
                duration: 0,
                useNativeDriver: true }
            ).start()
        })

        setFlip(false)
    }
    
    const onThumbsDown = () => {
        db.transaction((tx) => {
            tx.executeSql(
                "update cards set box=0, stage=1 where id=?;", [curCard.id]
            );
            tx.executeSql(
                "update cards set incorrect=incorrect+1 where id=?", [curCard.id]
            );
        })
        
        Animated.timing(
            offsetX,
            { toValue: -400, 
            duration: 300,
            useNativeDriver: true }
        ).start(() => {
            getNextCard()
            Animated.timing(
                offsetX,
                { toValue: 0, 
                duration: 0,
                useNativeDriver: true }
            ).start()
        })        
        setFlip(false)
    }

    const onFlagToggle = (curFlag) => {
        db.transaction((tx) => {
            tx.executeSql(
                "update cards set flagged=? where id=?;", [curFlag == 0 ? 1 : 0, curCard.id], () => {}, (t,error) => {
                    console.log(error)
                }
            )
        })
    }

    return(
        <View style={{flex:1, width:'100%', height:'100%', flexDirection:'column', alignItems:'center'}}>
            <FlingGestureHandler
                direction={Directions.RIGHT}
                onEnded={() => {flip ? onThumbsUp() : null}}
            >
                <FlingGestureHandler
                direction={Directions.LEFT}
                onEnded={() => {flip ? onThumbsDown() : null}}
                >
                    <Pressable style={{width:'85%', height:'100%', position:'relative'}} onPress={() => {setFlip(!flip)}}>
                    <View style={styles.card}>
                            { nextCard != null ?
                                flip ?
                                    <View>
                                    <Text>{nextCard.face}</Text>
                                    <Text>{nextCard.back}</Text>
                                    </View>
                                    :
                                    <Text style={{}}>{nextCard.face}</Text>
                                :
                                <Text> Loading </Text>
                            }
                    </View>
                    <Animated.View style={{ transform: [{translateX: offsetX}], height:'92%', width:'100%', position:'absolute', elevation:2 }}>
                    <View style={styles.cardBack}>
                    { curCard != null ?
                                    flip ?
                                        <View style={{}}>
                                            <Pressable key={flagged} onPress={() => {onFlagToggle(curCard.flagged); curCard.flagged = (curCard.flagged == 0 ? 1 : 0); toggleFlagged(!flagged)}} style={{marginTop:'-1.5%', marginLeft:'-1.5%'}}>
                                                {curCard.flagged == 1 ?
                                                    <Ionicons name="bookmark" size={50} color="red" />
                                                    :
                                                    <Ionicons name="bookmark-outline" size={50} color="red" />
                                                }
                                            </Pressable>
                                        <Text style={{alignSelf:'center'}}>{curCard.face}</Text>
                                        <Text style={{alignSelf:'center', marginTop:'50%'}}>{curCard.back}</Text>
                                        </View>
                                        :
                                        <View style={{height:'100%', justifyContent:'center', alignItems:'center'}}>
                                            <Text style={{}}>{curCard.face}</Text>
                                        </View>
                                        :
                                    <Text> Loading </Text>
                                }
                    </View>
                    </Animated.View>
                    </Pressable>
                </FlingGestureHandler>
            </FlingGestureHandler>
            { flip ?
                <View style={{flexDirection:'row', justifyContent:'space-around', width:'100%', height:'6.5%', marginTop:'-12.7%'}}>
                    <Pressable style={{width:'36%', justifyContent:'center',height:'100%', borderBottomLeftRadius:10, borderBottomRightRadius:10, backgroundColor:'#42f5b0'}} onPress={onThumbsDown}>
                        <Text style={{textAlign:'center'}}>Correct</Text>
                    </Pressable>
                    <Pressable style={{width:'34.7%', justifyContent:'center', height:'100%', borderBottomLeftRadius:10, borderBottomRightRadius:10, backgroundColor:'#f54269'}} onPress={onThumbsUp}>
                        <Text style={{textAlign:'center'}}>Incorrect</Text>
                    </Pressable>
                </View>
                : null
            }


        </View>
    )
}

const styles = StyleSheet.create({
    card: {
        height:'92.1%',
        borderTopStartRadius:12,
        borderTopEndRadius:12, 
        borderWidth:1, 
        alignItems:'center', 
        justifyContent:'center', 
        marginVertical:10,
        backgroundColor:'#fcfcfc', 
        borderColor:'#dbdbdb', 
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.5,
        shadowRadius: 2,
        elevation:1
    },
    cardBack: {
        height:'99.8%',
        width:'100%',
        borderTopLeftRadius:12,
        borderTopRightRadius:12, 
        borderWidth:1, 
        borderBottomWidth:0,
        marginVertical:10,
        backgroundColor:'#fcfcfc', 
        borderColor:'#dbdbdb', 
        elevation: 2,

    },
});