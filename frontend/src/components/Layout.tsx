import { Link as RouterLink, useLocation } from "react-router-dom";
import { Badge, Box, Button, Circle, Flex, HStack, Text, VStack } from "@chakra-ui/react";

/* --- inline line-icons (no extra deps) ------------------------------------ */
const svg = {
  width: "18",
  height: "18",
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: "2",
  strokeLinecap: "round",
  strokeLinejoin: "round",
} as const;

function HomeIcon() {
  return (
    <svg {...svg}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M9 22V12h6v10" />
    </svg>
  );
}
function GridIcon() {
  return (
    <svg {...svg}>
      <rect x="3" y="3" width="7" height="7" />
      <rect x="14" y="3" width="7" height="7" />
      <rect x="14" y="14" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg {...svg}>
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}

const NAV = [
  { label: "Overview", to: "/", Icon: HomeIcon },
  { label: "Creations", to: "/creations", Icon: GridIcon },
];

function NavItem({ to, label, Icon, active }: { to: string; label: string; Icon: () => JSX.Element; active: boolean }) {
  return (
    <HStack
      as={RouterLink}
      to={to}
      spacing={3}
      px={3}
      py="10px"
      borderRadius="md"
      bg={active ? "whiteAlpha.200" : "transparent"}
      color={active ? "white" : "gray.400"}
      _hover={{ bg: active ? "whiteAlpha.200" : "whiteAlpha.100", color: "white" }}
      transition="all 0.15s"
    >
      <Box color={active ? "green.300" : "gray.500"}>
        <Icon />
      </Box>
      <Text fontSize="sm" fontWeight={active ? "semibold" : "medium"}>{label}</Text>
    </HStack>
  );
}

function Brand() {
  return (
    <HStack px={2} spacing={3}>
      <Circle size="30px" bgGradient="linear(to-br, green.300, teal.500)" color="black" fontWeight="bold" fontSize="sm">
        L
      </Circle>
      <Text fontWeight="bold" color="gray.100">LookBook AI</Text>
      <Badge colorScheme="green" variant="subtle" fontSize="0.6rem" rounded="full" px={2}>Studio</Badge>
    </HStack>
  );
}

function Sidebar() {
  const { pathname } = useLocation();
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  return (
    <Box
      as="aside"
      w="260px"
      h="100vh"
      position="sticky"
      top={0}
      bg="black"
      borderRight="1px solid"
      borderColor="gray.800"
      px={3}
      py={4}
      display="flex"
      flexDirection="column"
    >
      <Box mb={6}>
        <Brand />
      </Box>
      <VStack align="stretch" spacing={1}>
        {NAV.map((n) => (
          <NavItem key={n.to} {...n} active={isActive(n.to)} />
        ))}
      </VStack>
      <Button as={RouterLink} to="/create" mt={4} colorScheme="green" size="sm" leftIcon={<PlusIcon />}>
        New creation
      </Button>
      <Box flex={1} />
      <Text px={2} fontSize="xs" color="gray.600">AI content studio</Text>
    </Box>
  );
}

function MobileBar() {
  const { pathname } = useLocation();
  const isActive = (to: string) => (to === "/" ? pathname === "/" : pathname.startsWith(to));
  return (
    <Flex
      display={{ base: "flex", md: "none" }}
      align="center"
      justify="space-between"
      px={4}
      py={3}
      borderBottom="1px solid"
      borderColor="gray.800"
      bg="black"
      position="sticky"
      top={0}
      zIndex={10}
    >
      <Brand />
      <HStack spacing={1}>
        {NAV.map((n) => (
          <Button
            key={n.to}
            as={RouterLink}
            to={n.to}
            size="xs"
            variant={isActive(n.to) ? "solid" : "ghost"}
            colorScheme={isActive(n.to) ? "green" : "gray"}
          >
            {n.label}
          </Button>
        ))}
      </HStack>
    </Flex>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Flex minH="100vh" bg="gray.900" color="gray.100">
      <Box display={{ base: "none", md: "block" }}>
        <Sidebar />
      </Box>
      <Box flex={1} minW={0}>
        <MobileBar />
        <Box as="main">{children}</Box>
      </Box>
    </Flex>
  );
}
