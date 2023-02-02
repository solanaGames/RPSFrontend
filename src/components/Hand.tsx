import React, { useEffect, useMemo, useState } from 'react';
import logo from './logo.svg';
import { Box, Button, Card, ChakraProvider, Flex, List, ListItem, Spacer, Text, Tooltip, useMediaQuery } from '@chakra-ui/react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import ConnectButton from './ConnectButton';
import AnimatedNumber from './AnimatedNumber';
import useStore from '../hooks/useStore';
import { useToast } from '@chakra-ui/react'
import Title from './Title';
import Loading from './Loading';

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
