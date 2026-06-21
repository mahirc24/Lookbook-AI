import { Link as RouterLink, useParams } from "react-router-dom";
import {
  Badge, Box, Button, Container, Heading, HStack, Progress, SimpleGrid, Spinner, Text, VStack,
} from "@chakra-ui/react";
import { useJob } from "../hooks/useJob";
import AssetCard from "../components/AssetCard";
import Layout from "../components/Layout";

export default function Results() {
  const { id } = useParams();
  const { data: job, isLoading, isError } = useJob(id);

  if (isLoading) return <Layout><Centered><Spinner /><Text mt={3}>Loading job…</Text></Centered></Layout>;
  if (isError || !job) return <Layout><Centered><Text color="red.300">Job not found.</Text></Centered></Layout>;

  const done = job.assets.filter((a) => a.status === "completed" || a.status === "failed").length;
  const pct = job.assets.length ? Math.round((done / job.assets.length) * 100) : 0;
  const inProgress = job.status === "queued" || job.status === "running";

  return (
    <Layout>
    <Container maxW="5xl" py={10}>
      <VStack align="stretch" spacing={6}>
        <HStack justify="space-between">
          <Box>
            <Heading size="lg">Marketing Kit</Heading>
            <Text color="gray.400" fontSize="sm">job {job.id.slice(0, 8)}</Text>
          </Box>
          <HStack>
            <Badge colorScheme={inProgress ? "yellow" : job.status === "completed" ? "green" : "red"}>
              {job.status}
            </Badge>
            <Button as={RouterLink} to="/" size="sm" variant="outline">New kit</Button>
          </HStack>
        </HStack>

        {inProgress && <Progress value={pct} size="sm" colorScheme="green" borderRadius="full" hasStripe isAnimated />}

        <SimpleGrid columns={{ base: 1, sm: 2, lg: 3 }} spacing={4}>
          {job.assets.map((a) => <AssetCard key={a.type} asset={a} />)}
        </SimpleGrid>
      </VStack>
    </Container>
    </Layout>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <VStack justify="center" minH="60vh" color="gray.400">
      {children}
    </VStack>
  );
}
