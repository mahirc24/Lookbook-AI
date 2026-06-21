import { useRef, useState } from "react";
import { Box, Image, Input, Text, VStack } from "@chakra-ui/react";

interface Props {
  onFile: (file: File | null) => void;
}

export default function FlatlayUpload({ onFile }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  function handleFiles(files: FileList | null) {
    const file = files?.[0] ?? null;
    onFile(file);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  return (
    <Box
      border="2px dashed"
      borderColor="gray.600"
      borderRadius="lg"
      p={6}
      textAlign="center"
      cursor="pointer"
      _hover={{ borderColor: "brand.500" }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => {
        e.preventDefault();
        handleFiles(e.dataTransfer.files);
      }}
    >
      <Input
        ref={inputRef}
        type="file"
        accept="image/*"
        display="none"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {preview ? (
        <Image src={preview} alt="flatlay preview" maxH="220px" mx="auto" borderRadius="md" />
      ) : (
        <VStack spacing={1} color="gray.400">
          <Text fontWeight="semibold">Drop a flatlay / product image</Text>
          <Text fontSize="sm">or click to browse</Text>
        </VStack>
      )}
    </Box>
  );
}
