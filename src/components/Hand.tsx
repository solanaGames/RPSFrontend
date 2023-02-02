import React, { useEffect, useMemo, useState } from 'react';
import logo from './logo.svg';
import { Box, Button, Card, ChakraProvider, Flex, List, ListItem, Spacer, Text, Tooltip, useMediaQuery } from '@chakra-ui/react'
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
    const {createGame, parsedGameState} = useStore();
    const disabled = parsedGameState.status === 'created';
    return <Text  fontSize={72} className="yourHand" onClick={() => {
        if (!disabled)
            createGame(hand)
        }}>
        {HANDS[hand].emoji}
    </Text>
}

export default Hand;
