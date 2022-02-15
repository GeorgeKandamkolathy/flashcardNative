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

export default function PlaySet({navigation, route}) {
    const {setID, setName, setSession} = route.params;
    const db = useDatabase();
    const [cards, setCards] = useState();
    const [curCard, setCurCard] = useState(null);
    const [flip, setFlip] = useState(false)

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
        setCards(sessionCards)
    }

    useEffect(() => {
        db.transaction((tx) => {
          tx.executeSql(
              "select * from cards where setID=?", [setID], (_, { rows: {_array} }) => {
                getSessionCards(_array)
              }, (t, error) => {
                console.log(error);
            }
          );  
          var updateSetSession = ((setSession + 1)==11 ? 1 : (setSession + 1))
          tx.executeSql(
            "update sets set session=? where id=?", [updateSetSession, setID], () => {}, 
            (t, error) => {
              console.log(error);
            }
            );  
        })

        navigation.setOptions({title:setName})
    }, [])

    const getNextCard = () => {
        if (cards.length == 0) {
            setCurCard({face:'empty', back:'empty', box:-1, stage:-1})
            return
        }
        var selected = Math.floor(Math.random()*cards.length)
        setCurCard(cards[selected])
        var cardsDuplicate = cards
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

        getNextCard()
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
        getNextCard()
        setFlip(false)
    }

    return(
        <View>
            <Pressable onPress={() => {setFlip(!flip)}}>
            <View style={{height:600, width:350, borderRadius:12, borderWidth:1, alignItems:'center', justifyContent:'center', margin:25}}>
                    { curCard != null ?
                        flip ?
                            <View>
                            <Text>{curCard.face}</Text>
                            <Text>{curCard.back}</Text>
                            <Text>{curCard.box}</Text>
                            <Text>{curCard.stage}</Text>

                            </View>
                            :
                            <Text style={{}}>{curCard.face}</Text>
                        :
                        <Text> Loading </Text>
                    }
            </View>
            </Pressable>
            { flip ?
                <View style={{flexDirection:'row', justifyContent:'space-around'}}>
                    <Pressable onPress={onThumbsDown}>
                        <Ionicons name="thumbs-down-outline" size={50} color="black" />
                    </Pressable>
                    <Pressable onPress={onThumbsUp}>
                        <Ionicons name="thumbs-up-outline" size={50} color="black" />
                    </Pressable>
                </View>
                : null
            }


        </View>
    )
}