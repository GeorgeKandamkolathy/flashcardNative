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

export default function PlayMixSet({navigation, route}) {
    const {setID} = route.params;
    const db = useDatabase();
    const [cards, setCards] = useState();
    const [curCard, setCurCard] = useState(null);
    const [nextCard, setNextCard] = useState(null);
    const [flip, setFlip] = useState(false)
    const [offsetX, setOffsetX] = useState(new Animated.Value(0))


    const getSessionCards = (array) => {
        var sessionCards = array;

        var selected = Math.floor(Math.random()*sessionCards.length)
        setCurCard(sessionCards[selected])
        sessionCards.splice(selected, 1)
        selected = Math.floor(Math.random()*sessionCards.length)
        setNextCard(sessionCards[selected])
        sessionCards.splice(selected, 1)
        setCards(sessionCards)
    }

    useEffect(() => {
        var sets = "("
        sets = sets.concat("?") 
        for (var i = 1; i < setID.length; i++) {
            sets = sets.concat(", ?")
        }
        sets = sets.concat(");")
        console.log(sets)
        db.transaction((tx) => {
          tx.executeSql(
              "select * from cards where setID in " + sets, setID, (_, { rows: {_array} }) => {
                getSessionCards(_array)
              }, (t, error) => {
                console.log(error);
            }
          );  
        })

        navigation.setOptions({title:'MixSet'})
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
                                        <View>
                                        <Text>{curCard.face}</Text>
                                        <Text>{curCard.back}</Text>
                                        </View>
                                        :
                                        <Text style={{}}>{curCard.face}</Text>
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
        alignItems:'center', 
        justifyContent:'center', 
        elevation: 2,

    },
});