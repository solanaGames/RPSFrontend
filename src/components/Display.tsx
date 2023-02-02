

        import { Box, Text, useMediaQuery } from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react';
import { ReactNode, useEffect, useState } from 'react';
import '../App.css';
import useStore from '../hooks/useStore';
import { HANDS } from './Hand';
import Loading from './Loading';

function toMultiLine(message: string) {
  return <Box height="60px" lineHeight="18px">
  {message.split('\n').map(m => <Text key={m} fontSize={24}>{m}<br/></Text>)}</Box>
}

function Display() {
    const { publicKey } = useWallet();
    const [outcome, setOutcome] = useState<{
      outcome: JSX.Element | null,
      message: JSX.Element | null,
    }>({outcome: null, message: null});
    const [isLargerThan800] = useMediaQuery('(min-width: 800px)');
    const { parsedGameState, tempStatus, setCurrentGameState } = useStore();


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
          setCurrentGameState({ status: 'empty'});
          setOutcome({
            outcome: emoji,
            message: toMultiLine(`Opponent played ${HANDS[parsedGameState.opponentHand].name}!\nYou ${outcome}!`),
          });
        }, 2000)
      }
    }, [parsedGameState.status])

    let result: ReactNode;
    let message: ReactNode;

    if (tempStatus) {
      switch(tempStatus) {
        case 'signCreate': 
          result = '✍️';
          message = toMultiLine('Stake your wager and create the game!\nYou will need to reveal your hand within 5 minutes!');
          break;
        case 'signSettle': 
          result = '✍️';
          message = toMultiLine('Opponent has commited their hand. Reveal yours!\nThis must be done within the 5 minutes.');
          break;
      }
    } else {
      switch(parsedGameState.status) {
        case 'empty':
          result = null;
          message = publicKey ? <Text fontSize={isLargerThan800 ? 24 : 16} marginBottom={-4}>
              Play against against the bot!<br/> Or share this <a style={{color:"blue", cursor: 'pointer'}}  onClick={() => {
          navigator.clipboard.writeText('challenge link');
        }}>[challenge link]</a>!</Text> : null;
          break;
        case 'initialized':
          if (false) {
            result = '✍️';
            message = toMultiLine('Stake your wager and create the game!\nYou will need to reveal your hand within 5 minutes!');
            break;
          }
          result = null;
            message = publicKey ? <Text fontSize={isLargerThan800 ? 24 : 16} marginBottom={-4}>
                Play against against the bot!<br/> Or share this <a style={{color:"blue", cursor: 'pointer'}}  onClick={() => {
            navigator.clipboard.writeText('challenge link');
          }}>[challenge link]</a>!</Text> : null;
          break;
        case 'created':
            result = '⌛';
            message = toMultiLine(`You played ${HANDS[parsedGameState.hand].name}!\nWaiting for opponent...`);
          break;
        case 'settled':
            result = HANDS[parsedGameState.opponentHand].emoji;
            message = toMultiLine(`Opponent played ${HANDS[parsedGameState.opponentHand].name}!`);

            break;
        default:
          result = '❌';
          message = <Text fontSize={24} marginBottom={-4}>
          Uh oh! Invalid game state. Click <a style={{color:"red", cursor: 'pointer'}}  onClick={() => {
            console.log('123123');
            setCurrentGameState({ status: 'empty'});
    }}>[here]</a> to reset.</Text>;
      }
    }
    
  return (
    <>
      {!result ? <Loading/> : <Box className="hand" height={170} margin-bottom={-100}>
        <Text fontSize={160}>
          {outcome.outcome ?? result}
        </Text>
    </Box>}
          {outcome.message ?? message}
      </>
  );
}

export default Display;
