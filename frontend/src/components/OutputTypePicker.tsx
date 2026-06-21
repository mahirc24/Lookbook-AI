import { Checkbox, SimpleGrid, Text, VStack } from "@chakra-ui/react";

const LABELS: Record<string, string> = {
  on_model: "On-Model Photoshoot",
  ghost_mannequin: "Ghost Mannequin",
  banner: "Marketing Banner",
  video: "Promo Video",
};

interface Props {
  available: string[];
  selected: string[];
  onChange: (next: string[]) => void;
}

export default function OutputTypePicker({ available, selected, onChange }: Props) {
  function toggle(type: string) {
    onChange(selected.includes(type) ? selected.filter((t) => t !== type) : [...selected, type]);
  }

  return (
    <VStack align="stretch" spacing={2}>
      <Text fontSize="sm" color="gray.400">Output types</Text>
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={3}>
        {available.map((type) => (
          <Checkbox key={type} isChecked={selected.includes(type)} onChange={() => toggle(type)}>
            {LABELS[type] ?? type}
          </Checkbox>
        ))}
      </SimpleGrid>
    </VStack>
  );
}
