import MyMantineProvider from "../lib/Theme";
import Layout from "../components/layouts/main";
import { GetServerSidePropsContext } from "next";
import { getCookie } from "cookies-next";

const MyApp = ({ Component, pageProps, router, colorScheme }) => {
  return (
    <MyMantineProvider colorScheme={colorScheme}>
      <Layout router={router}>
        <Component {...pageProps} key={router.router} />
      </Layout>
    </MyMantineProvider>
  );
};

MyApp.getInitialProps = ({ ctx }: { ctx: GetServerSidePropsContext }) => ({
  // get color scheme from cookie
  colorScheme: getCookie("mantine-color-scheme", ctx) || "dark",
});

export default MyApp;
