import { Box, Flex, Spacer, Text } from '@chakra-ui/react'

function Loading() {
  return <Flex>
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
          </Flex>
}

export default Loading;
