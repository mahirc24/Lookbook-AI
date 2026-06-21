import { Box, Center, Image, Text, VStack } from "@chakra-ui/react";

interface Props {
  label: string;
  sublabel?: string;
  selected: boolean;
  onClick: () => void;
  /** initials/emoji shown in the placeholder thumbnail until real preset images exist */
  glyph?: string;
  /** real thumbnail image URL; takes precedence over the glyph placeholder */
  image?: string;
}

export default function PresetCard({ label, sublabel, selected, onClick, glyph, image }: Props) {
  return (
    <Box
      onClick={onClick}
      cursor="pointer"
      borderWidth="2px"
      borderColor={selected ? "green.400" : "gray.700"}
      bg={selected ? "green.900" : "gray.800"}
      borderRadius="lg"
      overflow="hidden"
      transition="all 0.15s"
      _hover={{ borderColor: selected ? "green.400" : "gray.500", transform: "translateY(-2px)" }}
    >
      <Center h="160px" bg="gray.900" borderBottom="1px solid" borderColor="gray.700" overflow="hidden">
        {image ? (
          <Image src={image} alt={label} h="100%" w="100%" objectFit="cover" loading="lazy" />
        ) : (
          <Text fontSize="2xl">{glyph ?? "🖼️"}</Text>
        )}
      </Center>
      <VStack spacing={0} align="stretch" p={3}>
        <Text fontWeight="semibold" fontSize="sm" noOfLines={1}>{label}</Text>
        {sublabel && <Text fontSize="xs" color="gray.400" noOfLines={1}>{sublabel}</Text>}
      </VStack>
    </Box>
  );
}
