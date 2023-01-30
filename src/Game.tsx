import React, { useEffect, useMemo, useState } from 'react';
import logo from './logo.svg';
import './App.css';
import { Box, Button, Card, ChakraProvider, Flex, List, ListItem, Spacer, Text, Tooltip, useMediaQuery } from '@chakra-ui/react'
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useWalletModal } from '@solana/wallet-adapter-react-ui';
import AnimatedNumbers from "react-animated-numbers";
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
import ConnectButton from './ConnectButton';
import AnimatedNumber from './AnimatedNumber';

function Game() {
    const [solBalance, setSolBalance] = useState<number | null>(0);
    const [result, setResult] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(' ');
    const [betSize, setBetSize] = useState<number | null>(0.01);
    const [chosenHand, setChosenHand] = useState<string | null>(null);
    const { publicKey, disconnect, connect, wallets} = useWallet();
    const { connection } = useConnection();
    const [isLargerThan800] = useMediaQuery('(min-width: 800px)')

    async function loadSolBalance() {
        if (publicKey) {
            const balance = await connection.getBalance(publicKey)
            setSolBalance(balance / LAMPORTS_PER_SOL);
        }
    }

    const numDisplay = useMemo(() => {
      return <AnimatedNumber number={solBalance ?? 0}/>
    }, [solBalance])

    useEffect(() => {
      loadSolBalance();
      if (!publicKey) {
        setSolBalance(0)
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
      <Flex direction="column" align="center" justify="space-evenly" position="relative" gap={12} maxWidth={800} textAlign="center">
        <Box className={(publicKey) ? "titleHidden" : "title"} height={isLargerThan800 ? 400 : undefined} paddingTop={20}>
          <Text fontSize={80} marginBottom={-12}>
            SOLRPS
          </Text>
          <Flex direction="column" align="center" paddingTop={12}>
            <Text fontSize={24}>Play the native app on Solana Saga!</Text>
            <Box width={isLargerThan800 ? 200 : 100}>
            <a href='https://play.google.com/store/apps/details?id=app.phantom&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1'>
                <img alt='Get it on Google Play' src='https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png'/></a>
                </Box>
            </Flex>
        </Box>
        </Flex>
        <Flex direction="column" align="center" justify="space-evenly" position="relative" maxWidth={800} textAlign="center" height="95vh">
        <Flex direction="column" align="center" gap={2}>
        <Box paddingTop={8}><ConnectButton/></Box>
        <Box height="92px"><Tooltip label={solBalance}>{solBalance ? <Text fontSize={36} fontFamily="inherit">Balance
      <Flex align="center" className="balance" marginTop={-4} >{numDisplay}<Box paddingRight={2}/>SOL</Flex> </Text> : ' '}</Tooltip></Box>
        </Flex>
        {result ? 
          <Box className="hand" height={170} margin-bottom={-100}>
          <Text fontSize={160}>
            {result}
          </Text>
        </Box> : <Flex>
          <Box className="hand1" height={170} margin-bottom={-100}>
          <Text fontSize={128} transform="rotate(90deg) scaleX(-1)">
            ✊
          </Text>
        </Box>
          <Spacer padding={4}/>
          <Box className="hand2" height={170} margin-bottom={-100}>
          <Text fontSize={128} transform="rotate(-90deg)">
            ✊
          </Text>
        </Box>
          </Flex>}
        <Box height="60px">{(message === ' ' && publicKey) ? <Text fontSize={24} marginBottom={-4}>Select a bet and hand!</Text> : message?.split('|').map(m => <Text fontSize={24} marginBottom={-4}>{m}<br/></Text>)}</Box>
        <Flex width="100%" 
        direction="column" align="center" gap={4}>
          
        <Flex width="100%" 
        direction="column" align="center">
        <Text fontSize={24}>{betSize ? "B" : "Select b"}et size</Text>
        <Flex gap={2} paddingBottom={2} flexWrap="wrap" width="100%" justify="center">
            {betSizes.map(size => <Box flexBasis="20%">
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
            <Text fontSize={72} className="yourHand" onClick={() => {
              setChosenHand("✊")
              setResult('⌛')
              setMessage('Waiting for opponent...')
            }}>
            ✊
          </Text>
          <Text fontSize={72} className="yourHand" onClick={() => {
            setChosenHand("✋")
            setResult('⌛')
            setMessage('Waiting for opponent...')
          }}>
            ✋
          </Text>
          <Text fontSize={72} className="yourHand" onClick={() => {
            setChosenHand("✌️")
            setResult('⌛')
            setMessage('Waiting for opponent...')
          }}>
            ✌️
          </Text>
        </Flex>}
        </Flex>
        </Flex>
        {/* <Card padding={8}>
        <Flex direction="column" align="center" gap={2}>
            <Text fontSize={24}>
                <u>Recent plays</u>
            </Text>
            <List fontSize={isLargerThan800 ? 18 : 12}>
                <ListItem>
                    <Flex justify="space-between"><Text>BigLargeHugeBig flipped 0.05 and doubled.</Text><br/><Text>11 seconds ago</Text></Flex>
                    <Flex justify="space-between"><Text>BigLargeHugeBig flipped 0.05 and doubled.</Text><br/><Text>11 seconds ago</Text></Flex>
                    <Flex justify="space-between"><Text>BigLargeHugeBig flipped 0.05 and doubled.</Text><br/><Text>11 seconds ago</Text></Flex>
                    <Flex justify="space-between"><Text>BigLargeHugeBig flipped 0.05 and doubled.</Text><br/><Text>11 seconds ago</Text></Flex>
                    <Flex justify="space-between"><Text>BigLargeHugeBig flipped 0.05 and doubled.</Text><br/><Text>11 seconds ago</Text></Flex>
                    <Flex justify="space-between"><Text>BigLargeHugeBig flipped 0.05 and doubled.</Text><br/><Text>11 seconds ago</Text></Flex>
                </ListItem>
            </List>
        </Flex>
      </Card> */}
      </Flex>
      </Flex>
      </Flex>
      </Box>
  );
}

export default Game;
