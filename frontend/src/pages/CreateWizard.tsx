import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Box, Button, Center, Circle, Container, Flex, HStack, Heading, SimpleGrid, Spinner,
  Text, VStack, useToast,
} from "@chakra-ui/react";
import { createJob, getPresets } from "../api/client";
import type { BrandKit, ModelPreset, OptionPreset } from "../types";
import Layout from "../components/Layout";
import FlatlayUpload from "../components/FlatlayUpload";
import PresetCard from "../components/PresetCard";

const STEPS = ["Upload image", "Select model", "Background", "Pose"];
const MODEL_GLYPHS = ["🧍", "🧍‍♀️", "🧍‍♂️", "💃", "🕺", "🧑"];
const BG_GLYPH = "🏞️";
const POSE_GLYPH = "🤸";

export default function CreateWizard() {
  const navigate = useNavigate();
  const toast = useToast();
  const { data: presets, isLoading } = useQuery({ queryKey: ["presets"], queryFn: getPresets });

  const [step, setStep] = useState(0);
  const [image, setImage] = useState<File | null>(null);
  const [model, setModel] = useState<ModelPreset | null>(null);
  const [background, setBackground] = useState<OptionPreset | null>(null);
  const [pose, setPose] = useState<OptionPreset | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const canNext = [!!image, !!model, !!background, !!pose][step];

  async function generate() {
    if (!image || !model || !background || !pose) return;
    const brandKit: BrandKit = {
      ethnicity: model.ethnicity,
      age: model.age,
      body_type: model.body_type,
      background: background.value,
      pose: pose.value,
      color_palette: [],
      model_image: model.image,
      pose_image: pose.image,
      background_image: background.image,
    };
    setSubmitting(true);
    try {
      const { id } = await createJob({ outputTypes: ["on_model"], brandKit, image });
      navigate(`/jobs/${id}`);
    } catch (e: any) {
      toast({ title: "Failed to generate", description: e?.message ?? String(e), status: "error" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Layout>
      <Container maxW="4xl" py={10}>
        <Heading size="lg" mb={6}>New creation</Heading>
        <StepHeader step={step} />

        <Box bg="gray.800" borderRadius="xl" p={6} mt={6} minH="320px">
          {isLoading && step > 0 ? (
            <Center py={20}><Spinner /></Center>
          ) : step === 0 ? (
            <VStack align="stretch" spacing={3}>
              <Text color="gray.400">Upload a product / flatlay image.</Text>
              <FlatlayUpload onFile={setImage} />
            </VStack>
          ) : step === 1 ? (
            <CardGrid>
              {presets?.models.map((m, i) => (
                <PresetCard
                  key={m.id}
                  label={m.label}
                  image={m.image}
                  glyph={MODEL_GLYPHS[i % MODEL_GLYPHS.length]}
                  selected={model?.id === m.id}
                  onClick={() => setModel(m)}
                />
              ))}
            </CardGrid>
          ) : step === 2 ? (
            <VStack align="stretch" spacing={8}>
              {groupByCategory(presets?.backgrounds ?? []).map(([category, items]) => (
                <VStack key={category} align="stretch" spacing={3}>
                  <Text fontSize="sm" fontWeight="bold" color="gray.400" textTransform="uppercase" letterSpacing="wide">
                    {category}
                  </Text>
                  <CardGrid>
                    {items.map((b) => (
                      <PresetCard
                        key={b.id}
                        label={b.label}
                        image={b.image}
                        glyph={BG_GLYPH}
                        selected={background?.id === b.id}
                        onClick={() => setBackground(b)}
                      />
                    ))}
                  </CardGrid>
                </VStack>
              ))}
            </VStack>
          ) : (
            <CardGrid>
              {presets?.poses.map((p) => (
                <PresetCard
                  key={p.id}
                  label={p.label}
                  image={p.image}
                  glyph={POSE_GLYPH}
                  selected={pose?.id === p.id}
                  onClick={() => setPose(p)}
                />
              ))}
            </CardGrid>
          )}
        </Box>

        <Flex mt={6} justify="space-between">
          <Button variant="ghost" onClick={() => setStep((s) => s - 1)} isDisabled={step === 0}>
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button colorScheme="green" onClick={() => setStep((s) => s + 1)} isDisabled={!canNext}>
              Next
            </Button>
          ) : (
            <Button colorScheme="green" onClick={generate} isLoading={submitting} isDisabled={!canNext}>
              Generate image
            </Button>
          )}
        </Flex>
      </Container>
    </Layout>
  );
}

function StepHeader({ step }: { step: number }) {
  return (
    <HStack spacing={0} align="center">
      {STEPS.map((label, i) => (
        <HStack key={label} flex={i < STEPS.length - 1 ? 1 : "0 0 auto"} spacing={3}>
          <HStack spacing={2}>
            <Circle
              size="32px"
              bg={i <= step ? "green.400" : "gray.700"}
              color={i <= step ? "gray.900" : "gray.400"}
              fontWeight="bold"
              fontSize="sm"
            >
              {i + 1}
            </Circle>
            <Text fontSize="sm" color={i <= step ? "gray.100" : "gray.500"} whiteSpace="nowrap">
              {label}
            </Text>
          </HStack>
          {i < STEPS.length - 1 && <Box flex={1} h="2px" bg={i < step ? "green.400" : "gray.700"} mx={3} />}
        </HStack>
      ))}
    </HStack>
  );
}

function CardGrid({ children }: { children: React.ReactNode }) {
  return <SimpleGrid columns={{ base: 2, md: 3 }} spacing={4}>{children}</SimpleGrid>;
}

/** Group option presets by `category` (preserving first-seen order); uncategorized fall under "Other". */
function groupByCategory(items: OptionPreset[]): [string, OptionPreset[]][] {
  const groups: [string, OptionPreset[]][] = [];
  for (const item of items) {
    const key = item.category ?? "Other";
    let bucket = groups.find(([k]) => k === key);
    if (!bucket) {
      bucket = [key, []];
      groups.push(bucket);
    }
    bucket[1].push(item);
  }
  return groups;
}
