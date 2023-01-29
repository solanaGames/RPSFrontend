import React, { useEffect, useMemo, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { Box } from '@chakra-ui/react'
import { MechanicalCounter } from "mechanical-counter";

import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import ConnectButton from './ConnectButton';

function AnimatedNumber({number}: {number: number}) {
    const [currentNumber, setCurrentNumber] = useState<number>(0);
    const [blinkColor, setBlinkColor] = useState<string | null>(null);
 
    useEffect(() => {
        if (number > currentNumber) {
            setBlinkColor('greenBlink');
        }
        if (number < currentNumber) {
            setBlinkColor('redBlink');
        }
        setCurrentNumber(number)
        setTimeout(() => {
            setBlinkColor(null);
        }, 1000)
    }, [number])

  return (<Box className={blinkColor ? blinkColor : undefined}><MechanicalCounter text={number.toFixed(4)} /></Box>
  );
}

export default AnimatedNumber;
