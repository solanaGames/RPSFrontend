import { Box, Flex, Text, useMediaQuery } from '@chakra-ui/react'
import { useWallet } from '@solana/wallet-adapter-react';

function Title() {
    const { publicKey} = useWallet();
    const [isLargerThan800] = useMediaQuery('(min-width: 800px)');

  return (
      <Flex direction="column" align="center" justify="space-evenly" position="relative" gap={12} maxWidth={800} textAlign="center">
        <Box className={(publicKey) ? "titleHidden" : "title"} height={isLargerThan800 ? 400 : undefined} paddingTop={20}>
          <Text fontSize={80} marginBottom={-12}>
            SOLRPS
          </Text>
          <Flex direction="column" align="center" paddingTop={12}>
            <Text fontSize={24}>Play on-chain RPS against bots and friends!</Text>
            <Box width={isLargerThan800 ? 200 : 100}>
                <div
                style={{
                  height: 77.4
                }}
                />
                </Box>
            </Flex>
        </Box>
    </Flex>
  );
}

export default Title;
