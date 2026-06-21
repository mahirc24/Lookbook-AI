import { Link as RouterLink } from "react-router-dom";
import { Box, Flex, Heading, Spacer, Text } from "@chakra-ui/react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Box minH="100vh" bg="gray.900">
      <Flex
        as="header"
        align="center"
        px={8}
        py={4}
        borderBottom="1px solid"
        borderColor="gray.800"
        position="sticky"
        top={0}
        bg="gray.900"
        zIndex={10}
      >
        <RouterLink to="/">
          <Heading size="md" color="brand.100">
            LookBook<Text as="span" color="green.400"> AI</Text>
          </Heading>
        </RouterLink>
        <Spacer />
        <Text fontSize="sm" color="gray.500">AI content studio</Text>
      </Flex>
      <Box as="main">{children}</Box>
    </Box>
  );
}
