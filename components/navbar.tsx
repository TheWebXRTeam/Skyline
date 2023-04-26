import {
  Anchor,
  Burger,
  Container,
  createStyles,
  Group,
  Header,
  Paper,
  Switch,
  Transition,
  useMantineColorScheme,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import Link from "next/link";
import { BiMoon, BiSun } from "react-icons/bi";
import { IoLogoGithub } from "react-icons/io5";
import ThemeToggleButton from "./theme-toggle-button";

const useStyles = createStyles((theme) => ({
  root: {
    position: "relative",
    zIndex: 1,
  },
  header: {
    display: "flex",
    justifyContent: "right",
    flexDirection: "row",
    alignItems: "right",
    marginRight: "0",
    marginLeft: "auto",
    height: "100%",
    width: "100%",
  },
  links: {
    [theme.fn.smallerThan("sm")]: {
      display: "none",
    },
  },
  link: {
    display: "block",
    lineHeight: 1,
    padding: "8px 12px",
    borderRadius: theme.radius.sm,
    textDecoration: "none",
    color:
      theme.colorScheme === "dark"
        ? theme.colors.dark[0]
        : theme.colors.gray[7],
    fontSize: theme.fontSizes.sm,
    fontWeight: 500,

    "&:hover": {
      backgroundColor:
        theme.colorScheme === "dark"
          ? theme.colors.dark[6]
          : theme.colors.gray[0],
    },

    [theme.fn.smallerThan("sm")]: {
      borderRadius: 0,
      padding: theme.spacing.md,
    },
  },
  burger: {
    [theme.fn.largerThan("sm")]: {
      display: "none",
    },
  },

  dropdown: {
    position: "absolute",
    top: 60,
    left: 0,
    right: 0,
    zIndex: 0,
    borderTopRightRadius: 0,
    borderTopLeftRadius: 0,
    borderTopWidth: 0,
    overflow: "hidden",

    [theme.fn.largerThan("sm")]: {
      display: "none",
    },
  },
}));

const Navbar = (props) => {
  const { path } = props;
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  const { classes, theme } = useStyles();
  const [opened, { toggle, close }] = useDisclosure(false);

  return (
    <Header height={60} className={classes.root}>
      <Container className={classes.header}>
        <Group spacing={5} className={classes.links}>
          <Link
            href="https://github.com/lalalune/ratk-webxr-starter"
            scroll={false}
            passHref
          >
            <Anchor target="_blank" className={classes.link}>
              <IoLogoGithub /> View Source
            </Anchor>
          </Link>
          <Group position="right">
            <ThemeToggleButton />
          </Group>
        </Group>
        <Burger
          opened={opened}
          onClick={toggle}
          className={classes.burger}
          size="sm"
        />
        <Transition transition="pop-top-right" duration={200} mounted={opened}>
          {(styles) => (
            <Paper className={classes.dropdown} withBorder style={styles}>
              <Link
                href="https://github.com/eltruforce/webxr-examples"
                scroll={false}
                passHref
              >
                <Anchor target="_blank" className={classes.link}>
                  <IoLogoGithub /> View Source
                </Anchor>
              </Link>
              <Group>
                <Switch
                  color="yellow"
                  onLabel={
                    <Group spacing={5}>
                      <BiSun color={theme.white} size={18} />
                    </Group>
                  }
                  offLabel={
                    <Group spacing="xs" grow>
                      <BiMoon color={theme.colors.gray[6]} size={18} />
                    </Group>
                  }
                  checked={colorScheme === "dark"}
                  onChange={() => toggleColorScheme()}
                  size="md"
                  styles={{ root: { width: 120, margin: 11 } }}
                />
              </Group>
            </Paper>
          )}
        </Transition>
      </Container>
    </Header>
  );
};

export default Navbar;
