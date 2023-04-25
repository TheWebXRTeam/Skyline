import {
  ColorScheme,
  ColorSchemeProvider,
  MantineProvider,
} from "@mantine/core";
import { setCookie } from "cookies-next";
import { useState } from "react";

const config = (initialColorScheme: ColorScheme) => {
  const [currentColorScheme, setColorScheme] =
    useState<ColorScheme>(initialColorScheme);
  const toggleColorScheme = (value?: ColorScheme) => {
    const nextColorScheme =
      value || (currentColorScheme === "dark" ? "light" : "dark");
    setColorScheme(nextColorScheme);
    setCookie("mantine-color-scheme", nextColorScheme, {
      maxAge: 60 * 60 * 24 * 30,
    });
  };

  const theme = {
    globalStyles: (theme) => ({
      body: {
        backgroundColor:
          theme.colorScheme === "dark" ? theme.colors.dark[7] : theme.white,
      },
    }),
    colorScheme: currentColorScheme,
  };
  return { currentColorScheme, toggleColorScheme, theme };
};

const MyMantineProvider = ({ children, colorScheme }) => {
  const { currentColorScheme, toggleColorScheme, theme } = config(colorScheme);
  return (
    <ColorSchemeProvider
      colorScheme={currentColorScheme}
      toggleColorScheme={toggleColorScheme}
    >
      <MantineProvider withGlobalStyles withNormalizeCSS theme={theme}>
        {children}
      </MantineProvider>
    </ColorSchemeProvider>
  );
};

export default MyMantineProvider;
