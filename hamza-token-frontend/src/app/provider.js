"use client";

import { ChakraProvider, extendTheme, CSSReset } from "@chakra-ui/react";


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
    <ChakraProvider theme={theme}>
        {children}
    </ChakraProvider>
  );
};

export default Provider;
