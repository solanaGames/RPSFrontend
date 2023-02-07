import React, { useEffect, useMemo, useState } from 'react';
import { Text } from '@chakra-ui/react'
import useStore from '../hooks/useStore';

export const HANDS = {
    0: {
        enum: 0,
        name: 'rock',
        emoji: '✊'
    },
    1: {
        enum: 1,
        name: 'paper',
        emoji: '✋'
    },
    2: {
        enum: 2,
        name: 'scissor',
        emoji: '✌️'
    },
}

function Hand({hand} : {hand: number}) {
    const { acceptChallenge, createGame, parsedGameState, tempStatus } = useStore();
    const enabled = (tempStatus.status === 'challengedTurn') || !(parsedGameState.status !== 'empty' && parsedGameState.status !== 'initialized' && parsedGameState.status !== 'settled' && parsedGameState.status !== 'revealExpired');
    return <Text  fontSize={72} className="yourHand" onClick={() => {
        if (enabled)
            if (tempStatus.status === 'challengedTurn') {
                acceptChallenge(hand)
                return;
            } 
            createGame(hand)
            
        }}>
        {HANDS[hand].emoji}
    </Text>
}

export default Hand;
