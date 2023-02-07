

import { Box, Text, useMediaQuery } from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL } from '@solana/web3.js';
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
    const { setBetSize, setTempStatus, parsedGameState, tempStatus, setCurrentGameState, expireGame, initializeGame } = useStore();
    const fontSize = isLargerThan800 ? 24 : 16;

    useEffect(() => {
      setOutcome({outcome: null, message: null});
    }, [tempStatus.status])

    useEffect(() => { 
      if (parsedGameState.status === 'initialized' || parsedGameState.status === 'created') {
        setOutcome({outcome: null, message: null});
      }

      if (parsedGameState.status === 'settled') {
        setTimeout(() => {
          const outcome = parsedGameState.result;
          let emoji: JSX.Element;
          if (outcome === 'won') emoji = <>👏</>;
          if (outcome === 'lost') emoji = <>👎</>;
          if (outcome === 'tied') emoji = <>🤝</>;
          const pvp = parsedGameState.gameLink

          setOutcome({
            outcome: emoji,
            message: <Text fontSize={fontSize}>
                      Opponent played {HANDS[parsedGameState.opponentHand].name}!<br/>You {outcome}! Replay opponent or
                      <br/> <a style={{color:"blue", cursor: 'pointer'}}  onClick={() => {
            setCurrentGameState({
              status: 'empty',
            });
              setOutcome({outcome: null, message: null});
          }}>[Play a bot]</a></Text>
          });
          if (!pvp) {
            setCurrentGameState({
              status: 'empty',
            });
          }
        }, 2500)
      }
    }, [parsedGameState.status])

    useEffect(() => { 
      if (tempStatus.status === 'challengedSettled') {
        setTimeout(() => {
          const outcome = tempStatus.secondaryData.result;
          let emoji: JSX.Element;
          if (outcome === 'won') emoji = <>👏</>;
          if (outcome === 'lost') emoji = <>👎</>;
          if (outcome === 'tied') emoji = <>🤝</>;

          setOutcome({
            outcome: emoji,
            message: <Text fontSize={fontSize}>
                      Opponent played {HANDS[tempStatus.secondaryData.choice].name}!<br/>You {outcome}! Waiting for opponent to replay...
                      <br/><a style={{color:"blue", cursor: 'pointer'}}  onClick={() => {
                  window.history.pushState({}, document.title, "/" );
                  setTempStatus({status: null});
          }}>[Play a bot]</a></Text>
          });
        }, 2500)
      }
    }, [tempStatus.status])

    let result: ReactNode;
    let message: ReactNode;

    if (tempStatus.status) {
      switch(tempStatus.status) {
        case 'waiting':
          result = '⌛';
          message = <MultiLineText message={`You were challenged to a game.\nWaiting for opponent...`}/>
          message = <Text fontSize={fontSize}>
                      You were challenged to a game.<br/>Waiting for opponent...<br/><a style={{color:"blue", cursor: 'pointer'}}  onClick={() => {
                  window.history.pushState({}, document.title, "/" );
                  setTempStatus({status: null});
          }}>[Play a bot]</a></Text>
          break;
        case 'challengedExpired':
          result = '⏱️';
          message = <Text fontSize={fontSize}>
                      Challenge has expired!<br/> Wait for a rematch or <a style={{color:"blue", cursor: 'pointer'}}  onClick={() => {
                  window.history.pushState({}, document.title, "/" );
          }}>[play a bot]</a>!</Text>
          break;
        case 'challengedTurn':
            result = '🫵';
            message = <MultiLineText message={`You were challenged for ${tempStatus.secondaryData.amount} SOL.\nYou have 5 minutes to make your move.`}/>
            setBetSize(tempStatus.secondaryData.amount);
            break;
        case 'challengedSettled':
          result = HANDS[tempStatus.secondaryData.choice].emoji;
          message = <MultiLineText message={`Opponent played ${HANDS[tempStatus.secondaryData.choice].name}!`}/>
          break;
        case 'acceptingReveal':
          result = '⌛';
          message = <MultiLineText message={`You chose ${HANDS[tempStatus.secondaryData.choice].name}.\nWaiting for opponent to reveal...`}/>
          break;
        case 'signCreate': 
          result = '✍️';
          message = <MultiLineText message={'Stake your wager and create the game!\nYou will need to reveal your hand within 5 minutes!'}/>
          break;
        case 'signJoin': 
          result = '✍️';
          message = <MultiLineText message={'Sign to join game.'}/>
          break;
        case 'signSettle': 
          result = '✍️';
          message = <MultiLineText message={'Opponent has commited their hand. Reveal yours!\nThis must be done within the 5 minutes.'}/>
          break;
        case 'error': 
            result = '❌';
            message = <Text fontSize={24}>
          Transaction did not go through.<br/>Please refresh and try again. Click <a style={{color:"red", cursor: 'pointer'}}  onClick={() => {
            setCurrentGameState({ status: 'empty'});
            window.location.reload();
    }}>[here]</a> to abandon current game.</Text>;
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
              Play against the bot!<br/> Or share this <a style={{color:"blue", cursor: 'pointer'}}  onClick={() => {
                  const state = initializeGame(true);
                  navigator.clipboard.writeText(state.gameLink);
          }}>[challenge link]</a>!</Text> : null;
          break;
        case 'initialized':
          result = null;
          message = publicKey ? <Text fontSize={fontSize}>
              Challenging a player!<br/>Share your <a style={{color:"blue", cursor: 'pointer'}}  onClick={() => {
                const state = initializeGame(true);
                navigator.clipboard.writeText(state.gameLink);
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
            window.location.reload();
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
