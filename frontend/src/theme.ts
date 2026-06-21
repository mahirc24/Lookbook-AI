import { extendTheme } from "@chakra-ui/react";

const theme = extendTheme({
  config: { initialColorMode: "dark", useSystemColorMode: false },
  fonts: {
    heading: `'Inter', -apple-system, system-ui, sans-serif`,
    body: `'Inter', -apple-system, system-ui, sans-serif`,
  },
  colors: {
    brand: {
      50: "#e8f5ee",
      100: "#c6e6d4",
      500: "#1A4D2E",
      600: "#133d24",
      700: "#0d2c1a",
    },
  },
  styles: {
    global: {
      body: { bg: "gray.900", color: "gray.100" },
    },
  },
});

export default theme;
