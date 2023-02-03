

import { Box, Text, useMediaQuery } from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react';
import { ReactNode, useEffect, useState } from 'react';
import useStore from '../hooks/useStore';
import { HANDS } from './Hand';
import Loading from './Loading';

function MultiLineText({message}: {message: string}) {
  const [isLargerThan800] = useMediaQuery('(min-width: 800px)');

  return <Box height="60px" lineHeight="18px">
  {message.split('\n').map(m => <Text key={m} fontSize={isLargerThan800 ? 24 : 16}>{m}<br/></Text>)}</Box>
}

function Display() {
    const { publicKey } = useWallet();
    const [outcome, setOutcome] = useState<{
      outcome: JSX.Element | null,
      message: JSX.Element | null,
    }>({outcome: null, message: null});
    const [isLargerThan800] = useMediaQuery('(min-width: 800px)');
    const { parsedGameState, tempStatus, setCurrentGameState, expireGame } = useStore();
    const fontSize = isLargerThan800 ? 24 : 16;


    useEffect(() => { 
      if (parsedGameState.status === 'initialized') {
        setOutcome({outcome: null, message: null});
      }

      if (parsedGameState.status === 'settled') {
        setTimeout(() => {
          const outcome = parsedGameState.result;
          let emoji: JSX.Element;
          if (outcome === 'won') emoji = <>👏</>;
          if (outcome === 'lost') emoji = <>👎</>;
          if (outcome === 'tied') emoji = <>🤝</>;

          setOutcome({
            outcome: emoji,
            message: <MultiLineText message={`Opponent played ${HANDS[parsedGameState.opponentHand].name}!\nYou ${outcome}! Play again!`}/>
          });
          setCurrentGameState({status: 'empty'});
        }, 2500)
      }
    }, [parsedGameState.status])

    let result: ReactNode;
    let message: ReactNode;

    if (tempStatus) {
      switch(tempStatus) {
        case 'signCreate': 
          result = '✍️';
          message = <MultiLineText message={'Stake your wager and create the game!\nYou will need to reveal your hand within 5 minutes!'}/>
          break;
        case 'signSettle': 
          result = '✍️';
          message = <MultiLineText message={'Opponent has commited their hand. Reveal yours!\nThis must be done within the 5 minutes.'}/>
          break;
        case 'error': 
            result = '❌';
            message = <MultiLineText message={'Transaction did not go through.\nPlease refresh and try again.'}/>
            break;
        case 'signExpired': 
            result = '✍️';
            message = <MultiLineText message={'Sign transaction to return the wager to your wallet.'}/>
            break;
      }
    } else {
      switch(parsedGameState.status) {
        case 'empty':
          result = null;
          message = publicKey ? <Text fontSize={fontSize}>
              Play against against the bot!<br/> Or share this <a style={{color:"blue", cursor: 'pointer'}}  onClick={() => {
          navigator.clipboard.writeText('challenge link');
        }}>[challenge link]</a>!</Text> : null;
          break;
        case 'initialized':
          if (false) {
            result = '✍️';
            message = <MultiLineText message={'Stake your wager and create the game!\nYou will need to reveal your hand within 5 minutes!'}/>
            break;
          }
          result = null;
            message = publicKey ? <Text fontSize={fontSize}>
                Play against against the bot!<br/> Or share this <a style={{color:"blue", cursor: 'pointer'}}  onClick={() => {
            navigator.clipboard.writeText('challenge link');
          }}>[challenge link]</a>!</Text> : null;
          break;
        case 'created':
            result = '⌛';
            message = <MultiLineText message={`You played ${HANDS[parsedGameState.hand].name}!\nWaiting for opponent... Stay close! You must reveal within 5 minutes of them playing.`}/>

          break;
        case 'challengeExpired':
            result = '⏱️';
            message = <Text fontSize={fontSize}>
                      No one took your challenge in time<br/>Click <a style={{color:"green", cursor: 'pointer'}}  onClick={() => expireGame()}>[here]</a> to claim your wager back.</Text>;
          break;
        case 'revealExpired':
          result = '⏱️';
          message = <MultiLineText message={`You lost because you didn't reveal in time.\nYou must reveal within 5 minutes of your opponent.`}/>

          break;
        case 'settled':
          result = HANDS[parsedGameState.opponentHand].emoji;
          message = <MultiLineText message={`Opponent played ${HANDS[parsedGameState.opponentHand].name}!`}/>

          break;
        default:
          result = '❌';
          message = <Text fontSize={24}>
          Uh oh! Invalid game state. Click <a style={{color:"red", cursor: 'pointer'}}  onClick={() => {
            setCurrentGameState({ status: 'empty'});
    }}>[here]</a> to reset.</Text>;
      }
    }

  return (
    <>
      {(!outcome.outcome && (!result || !publicKey)) ? <Loading/> : <Box className="hand" height={170} margin-bottom={-100}>
        <Text fontSize={isLargerThan800 ? 160 : 120}>
          {outcome.outcome ?? result}
        </Text>
    </Box>}
          {publicKey ? (outcome.message ?? message) : null}
      </>
  );
}

export default Display;
