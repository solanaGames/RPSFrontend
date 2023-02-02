import { Box, Flex, Spacer, Text, useMediaQuery } from '@chakra-ui/react'

function Loading() {
    const [isLargerThan800] = useMediaQuery('(min-width: 800px)');

  return <Flex marginBottom={isLargerThan800 ? undefined : -12}>
          <Box className="hand1" height={170} margin-bottom={-100}>
          <Text fontSize={isLargerThan800 ? 128 : 110} transform="rotate(90deg) scaleX(-1)">
            ✊
          </Text>
        </Box>
          <Spacer padding={4}/>
          <Box className="hand2" height={170} margin-bottom={-100}>
          <Text fontSize={isLargerThan800 ? 128 : 110} transform="rotate(-90deg)">
            ✊
          </Text>
        </Box>
          </Flex>
}

export default Loading;
