import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Badge, Box, Button, Center, Container, Heading, HStack, Image, SimpleGrid, Spinner, Text, VStack,
} from "@chakra-ui/react";
import { listJobs, mediaUrl } from "../api/client";
import Layout from "../components/Layout";
import type { Job } from "../types";

const STEPS = [
  { n: 1, title: "Upload a garment", body: "Drop in a flatlay or product photo." },
  { n: 2, title: "Pick the look", body: "Choose a model, pose, and background." },
  { n: 3, title: "Generate", body: "Get a studio-quality on-model photo in seconds." },
];

export default function Home() {
  const { data: jobs } = useQuery({ queryKey: ["jobs"], queryFn: listJobs });
  const recent = (jobs ?? []).slice(0, 4);

  return (
    <Layout>
      <Container maxW="6xl" py={{ base: 8, md: 14 }}>
        {/* Hero */}
        <VStack align="start" spacing={5} mb={14}>
          <Badge colorScheme="green" variant="subtle" rounded="full" px={3} py={1}>AI content studio</Badge>
          <Heading size="2xl" lineHeight={1.1} maxW="3xl">
            Turn a flatlay into an on-model photoshoot.
          </Heading>
          <Text color="gray.400" fontSize="lg" maxW="2xl">
            Upload a product image, choose a model, pose, and background, and generate a
            studio-quality on-model photo. No shoot, no studio, no models required.
          </Text>
          <HStack spacing={3} pt={2}>
            <Button as={RouterLink} to="/create" colorScheme="green" size="lg">+ New creation</Button>
            <Button as={RouterLink} to="/creations" variant="outline" size="lg">View creations</Button>
          </HStack>
        </VStack>

        {/* How it works */}
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={4} mb={14}>
          {STEPS.map((s) => (
            <Box key={s.n} bg="gray.800" borderWidth="1px" borderColor="gray.700" borderRadius="xl" p={6}>
              <Center w="36px" h="36px" mb={4} rounded="full" bg="green.900" color="green.300" fontWeight="bold">
                {s.n}
              </Center>
              <Heading size="sm" mb={1}>{s.title}</Heading>
              <Text fontSize="sm" color="gray.400">{s.body}</Text>
            </Box>
          ))}
        </SimpleGrid>

        {/* Recent creations */}
        {recent.length > 0 && (
          <>
            <HStack justify="space-between" mb={4}>
              <Heading size="md">Recent creations</Heading>
              <Button as={RouterLink} to="/creations" variant="link" colorScheme="green">View all →</Button>
            </HStack>
            <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
              {recent.map((job) => <MiniCard key={job.id} job={job} />)}
            </SimpleGrid>
          </>
        )}
      </Container>
    </Layout>
  );
}

function MiniCard({ job }: { job: Job }) {
  const thumb = mediaUrl(job.assets.find((a) => a.url && a.type !== "video")?.url ?? null);
  return (
    <Box
      as={RouterLink}
      to={`/jobs/${job.id}`}
      bg="gray.800"
      borderRadius="lg"
      overflow="hidden"
      borderWidth="1px"
      borderColor="gray.700"
      _hover={{ borderColor: "green.400" }}
    >
      <Center h="140px" bg="gray.900">
        {thumb ? <Image src={thumb} alt="" maxH="140px" objectFit="contain" /> : <Spinner color="gray.600" />}
      </Center>
    </Box>
  );
}
