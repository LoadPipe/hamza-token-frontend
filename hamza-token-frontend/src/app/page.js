
import { Box, Heading, Button, VStack } from "@chakra-ui/react";

export default function HomePage() {
  return (
    <Box 
      height="100vh" 
      display="flex" 
      justifyContent="center" 
      alignItems="center"
    >
      <VStack spacing={6} textAlign="center">
        <Heading textColor="white" mb="10" size="3xl">Hamza Token Frontend</Heading>
        <Button colorScheme="teal" size="lg" width="250px">
          Deploy New
        </Button>
        <Button colorScheme="blue" size="lg" width="250px">
          Test Existing Deployment
        </Button>
      </VStack>
    </Box>
  );
}
