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
            <Text fontSize={24}>Play the native app on Solana Saga!</Text>
            <Box width={isLargerThan800 ? 200 : 100}>
            <a href='https://play.google.com/store/apps/details?id=app.phantom&pcampaignid=pcampaignidMKT-Other-global-all-co-prtnr-py-PartBadge-Mar2515-1'>
                <img alt='Get it on Google Play' src='https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png'/></a>
                </Box>
            </Flex>
        </Box>
    </Flex>
  );
}

export default Title;
