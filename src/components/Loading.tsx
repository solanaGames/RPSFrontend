import { Box, Flex, Spacer, Text, useMediaQuery } from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react';

function Loading() {
    const [isLargerThan800] = useMediaQuery('(min-width: 800px)');
    const fontSize = isLargerThan800 ? 128 : 110;
    const { publicKey } = useWallet();

  return <Flex marginBottom={isLargerThan800 ? undefined : -12} marginTop={isLargerThan800 ? undefined : -20}>
          <Box className="hand1" height={170} margin-bottom={-100}>
          <Text fontSize={fontSize} transform="rotate(90deg) scaleX(-1)">
            ✊
          </Text>
        </Box>
          <Spacer padding={4}/>
          <Box className="hand2" height={170} margin-bottom={-100}>
          <Text fontSize={fontSize} transform="rotate(-90deg)">
            ✊
          </Text>
        </Box>
          </Flex>
}

export default Loading;
