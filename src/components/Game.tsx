import React, { useEffect, useMemo, useState } from 'react';
import logo from './logo.svg';
import '../App.css';
import { Box, Button, Card, ChakraProvider, Flex, List, ListItem, Spacer, Text, Tooltip, useMediaQuery } from '@chakra-ui/react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import ConnectButton from './ConnectButton';
import AnimatedNumber from './AnimatedNumber';
import useStore from '../hooks/useStore';
import { useToast } from '@chakra-ui/react'
import Title from './Title';
import Loading from './Loading';
import Hand from './Hand';
import GameMessage from './GameMessage';

function Game() {
    const [result, setResult] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(' ');
    const [chosenHand, setChosenHand] = useState<string | null>(null);
    const [aboutOpen, setAboutOpen] = useState<boolean>(false);
    const { publicKey} = useWallet();
    const toast = useToast();
    const { connection } = useConnection();
    const [isLargerThan800] = useMediaQuery('(min-width: 800px)');
    const { createGame, betSize, setBetSize, solBalance, setSolBalance } = useStore();

    useEffect(() => {
      if (!publicKey) {
        setMessage(' ')
      }
    }, [publicKey]);

    useEffect(() => {
      if(chosenHand){
        setTimeout(() => {
          const rand = Math.floor(Math.random() * 3);
          const opponentHand = ['✊',
          '✋',
          '✌️'][rand];
  
          setResult(opponentHand)
          const newMessage = 'Opponent threw '.concat(opponentHand);
          setMessage(newMessage);
  
          setTimeout(() => {
            if (chosenHand) {
              if (chosenHand === opponentHand) {
                setResult("🤝")
                setMessage(newMessage.concat("|It's a tie!"))
              } else {
                if ((chosenHand.charCodeAt(0) - 1)%3 === (opponentHand.charCodeAt(0)%3)) {
                  setResult("👏")
                  setMessage(newMessage.concat("|You win!"))
                  setSolBalance((solBalance ?? 0) + (betSize ?? 0));
                } else {
                  setResult("👎")
                  setMessage(newMessage.concat("|Unlucky! You lost..."))
                  setSolBalance((solBalance ?? 0) - (betSize ?? 0));
                }
              }
            }

            setTimeout(() => {
              setResult(null);
              setChosenHand(null);
              setMessage(' ');
            }, 2000)
          }, 2000)
        }, 2000);
      }
    }, [chosenHand]);

    const betSizes = [0.01,0.05,0.1,0.5,1,5,10, 100];

  return (
    <Box overflow="hidden" height="100vh" bg="#bb81be">
      <Flex bg="#bb81be" paddingY="10%" paddingX={10} paddingTop="0" justify="center" position="relative" overflow="hidden" >
      <Box className='bg' height="100vh"/>
      <Flex direction="column" align="center">
      <Title/>
        <Flex direction="column" align="center" justify="space-evenly" position="relative" maxWidth={800} textAlign="center" height="95vh">
        <Flex direction="column" align="center" gap={2}>
        <Box paddingTop={8} position="relative"><ConnectButton/></Box>
        <Box className={publicKey ? "balanceBox" : "balanceBoxHidden"}><Tooltip label={solBalance}>{solBalance ? <Box><Text fontSize={36} fontFamily="inherit">Balance </Text>
      <Flex align="center" className="balance" marginTop={-4} >
      <AnimatedNumber number={solBalance ?? 0}/><Box paddingRight={2}/><Text fontSize={36} fontFamily="inherit">SOL</Text></Flex></Box> : ' '}</Tooltip></Box>
        </Flex>
        {result ? 
          <Box className="hand" height={170} margin-bottom={-100}>
          <Text fontSize={160}>
            {result}
          </Text>
        </Box> : <Loading/>}
        {<GameMessage message={message}/>}
        <Flex width="100%" 
        direction="column" align="center" gap={4}>
          
        <Flex width="100%" 
        direction="column" align="center" marginBottom={publicKey ? undefined : -24}>
        <Text fontSize={24}>{betSize ? "B" : "Select b"}et size</Text>
        <Flex gap={2} paddingBottom={2} flexWrap="wrap" width="100%" justify="center">
            {betSizes.map(size => <Box flexBasis="20%" key={size}>
                <Button width="64px" onClick={() => setBetSize(size)} bg={betSize === size ? "var(--chakra-colors-gray-400) !important" : undefined} size="sm"> {size} SOL</Button>
            </Box>)}
        </Flex>
        </Flex>
        <Flex width="100%" 
        direction="column" align="center">
        <Text fontSize={24}>{"Choose your hand"}</Text>
        {chosenHand ? <Flex width="100%" justify="center">
            <Text fontSize={72} className="yourHand" onClick={() => setChosenHand(null)}>{chosenHand}</Text>
        </Flex> : <Flex width="100%" justify="space-between">
            <Hand hand={0}/>
            <Hand hand={1}/>
            <Hand hand={2}/>
        </Flex>}
        </Flex>
        </Flex>
      </Flex>
      </Flex>
      </Flex>
      {publicKey && <Flex justify="center" position="absolute" width="100%" bottom="4">
      <Tooltip isOpen={aboutOpen} label="SolRPS is an onchain Rock, Paper, Scissors game. Each players' chosen hand is encrypted and only revealed after both player has commited (commit-reveal scheme). When playing directly against the site, an offchain service will play a random hand after your encrypted hand is commited."><Text  onClick={() => {setAboutOpen(!aboutOpen)}} fontSize={24} cursor="pointer"><u>Help</u></Text></Tooltip>
      </Flex>}
      </Box>
  );
}

export default Game;
