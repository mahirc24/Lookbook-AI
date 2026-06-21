import { Box, Grid, GridItem, HStack, Input, Select, Text, VStack } from "@chakra-ui/react";
import type { BrandKit } from "../types";

interface Props {
  value: BrandKit;
  onChange: (next: BrandKit) => void;
}

const ETHNICITY = ["South Asian", "East Asian", "Black", "Caucasian", "Hispanic", "Middle Eastern"];
const AGE = ["teens", "20s", "30s", "40s", "50s+"];
const BODY = ["slim", "athletic", "average", "curvy", "plus-size"];
const SCENE = ["minimal studio", "urban street", "outdoor nature", "luxury interior", "beach"];
const LIGHTING = ["soft diffused", "high-key", "dramatic", "golden hour", "studio strobe"];
const BACKGROUND = ["studio seamless", "white cyclorama", "textured wall", "on-location"];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <VStack align="stretch" spacing={1}>
      <Text fontSize="sm" color="gray.400">{label}</Text>
      {children}
    </VStack>
  );
}

export default function BrandKitForm({ value, onChange }: Props) {
  const set = (patch: Partial<BrandKit>) => onChange({ ...value, ...patch });

  return (
    <VStack align="stretch" spacing={4}>
      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={3}>
        <GridItem>
          <Field label="Ethnicity">
            <Select placeholder="any" value={value.ethnicity ?? ""} onChange={(e) => set({ ethnicity: e.target.value })}>
              {ETHNICITY.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </Field>
        </GridItem>
        <GridItem>
          <Field label="Age">
            <Select placeholder="any" value={value.age ?? ""} onChange={(e) => set({ age: e.target.value })}>
              {AGE.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </Field>
        </GridItem>
        <GridItem>
          <Field label="Body type">
            <Select placeholder="any" value={value.body_type ?? ""} onChange={(e) => set({ body_type: e.target.value })}>
              {BODY.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </Field>
        </GridItem>
      </Grid>

      <Grid templateColumns={{ base: "1fr", md: "1fr 1fr 1fr" }} gap={3}>
        <GridItem>
          <Field label="Scene">
            <Select placeholder="any" value={value.scene ?? ""} onChange={(e) => set({ scene: e.target.value })}>
              {SCENE.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </Field>
        </GridItem>
        <GridItem>
          <Field label="Lighting">
            <Select placeholder="any" value={value.lighting ?? ""} onChange={(e) => set({ lighting: e.target.value })}>
              {LIGHTING.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </Field>
        </GridItem>
        <GridItem>
          <Field label="Background">
            <Select placeholder="any" value={value.background ?? ""} onChange={(e) => set({ background: e.target.value })}>
              {BACKGROUND.map((o) => <option key={o} value={o}>{o}</option>)}
            </Select>
          </Field>
        </GridItem>
      </Grid>

      <Field label="Color palette">
        <HStack>
          {value.color_palette.map((c, i) => (
            <Box key={i} position="relative">
              <Input
                type="color"
                value={c}
                p={0}
                w="48px"
                h="40px"
                onChange={(e) => {
                  const next = [...value.color_palette];
                  next[i] = e.target.value;
                  set({ color_palette: next });
                }}
              />
            </Box>
          ))}
        </HStack>
      </Field>
    </VStack>
  );
}
