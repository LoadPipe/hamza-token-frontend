"use client";

import { ChakraProvider, extendTheme, CSSReset } from "@chakra-ui/react";
import { Web3Provider } from "./Web3Context";


const theme = extendTheme({
  styles: {
    global: {
      body: {
        bg:"gray.900",
        color: "white",
      },
    },
  },
});

const Provider = ({ children }) => {
  return (
    <Web3Provider>
      <ChakraProvider theme={theme}>
          {children}
      </ChakraProvider>
    </Web3Provider>
  );
};

export default Provider;
