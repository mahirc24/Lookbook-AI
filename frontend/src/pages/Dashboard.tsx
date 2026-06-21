import { Link as RouterLink } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  Badge, Box, Button, Center, Container, Heading, HStack, Image, SimpleGrid, Spinner, Text, VStack,
} from "@chakra-ui/react";
import { listJobs, mediaUrl } from "../api/client";
import Layout from "../components/Layout";
import type { Job } from "../types";

export default function Dashboard() {
  const { data: jobs, isLoading } = useQuery({ queryKey: ["jobs"], queryFn: listJobs });

  return (
    <Layout>
      <Container maxW="6xl" py={10}>
        <HStack justify="space-between" mb={8}>
          <Box>
            <Heading size="lg">Your creations</Heading>
            <Text color="gray.400">Turn a product image into a full marketing kit.</Text>
          </Box>
          <Button as={RouterLink} to="/create" colorScheme="green" size="lg">
            + New creation
          </Button>
        </HStack>

        {isLoading ? (
          <Center py={20}><Spinner /></Center>
        ) : !jobs || jobs.length === 0 ? (
          <EmptyState />
        ) : (
          <SimpleGrid columns={{ base: 1, sm: 2, md: 3, lg: 4 }} spacing={4}>
            {jobs.map((job) => <CreationCard key={job.id} job={job} />)}
          </SimpleGrid>
        )}
      </Container>
    </Layout>
  );
}

function CreationCard({ job }: { job: Job }) {
  const thumb = mediaUrl(job.assets.find((a) => a.url && a.type !== "video")?.url ?? null);
  const inProgress = job.status === "queued" || job.status === "running";
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
      <Center h="160px" bg="gray.900">
        {thumb ? (
          <Image src={thumb} alt="" maxH="160px" objectFit="contain" />
        ) : (
          <Spinner color="gray.600" />
        )}
      </Center>
      <HStack p={3} justify="space-between">
        <Text fontSize="sm" color="gray.400">{job.id.slice(0, 8)}</Text>
        <Badge colorScheme={inProgress ? "yellow" : job.status === "completed" ? "green" : "red"}>
          {job.status}
        </Badge>
      </HStack>
    </Box>
  );
}

function EmptyState() {
  return (
    <Center py={20} borderWidth="2px" borderStyle="dashed" borderColor="gray.700" borderRadius="xl">
      <VStack spacing={4}>
        <Text fontSize="4xl">🪄</Text>
        <Text color="gray.400">No creations yet.</Text>
        <Button as={RouterLink} to="/create" colorScheme="green">Create your first kit</Button>
      </VStack>
    </Center>
  );
}
