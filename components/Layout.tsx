import { Box } from "@mantine/core";
import Head from "next/head";

const Main = ({ children, router }) => {
  return (
    <Box>
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Skyline</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <Box>{children}</Box>
    </Box>
  );
};

export default Main;
