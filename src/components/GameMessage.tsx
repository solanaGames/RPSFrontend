

        import { Box, Text, useMediaQuery } from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react';
import '../App.css';

function GameMessage({message}: {message: string}) {
    const { publicKey} = useWallet();
    const [isLargerThan800] = useMediaQuery('(min-width: 800px)');

  return (
    <Box height="60px" lineHeight="18px">
        {(message === ' ' && publicKey) ? <Text fontSize={isLargerThan800 ? 24 : 16} marginBottom={-4}>
            Play against against the bot!<br/> Or share this <a style={{color:"blue", cursor: 'pointer'}}  onClick={() => {
        navigator.clipboard.writeText('challenge link');
      }}>[challenge link]</a>!</Text> : message?.split('|').map(m => <Text key={m} fontSize={24} marginBottom={-4}>{m}<br/></Text>)}</Box>
  );
}

export default GameMessage;
