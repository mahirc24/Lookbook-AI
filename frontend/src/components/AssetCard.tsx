import { Badge, Box, Image, Link, Spinner, Text, VStack } from "@chakra-ui/react";
import { mediaUrl } from "../api/client";
import type { Asset } from "../types";

const LABELS: Record<string, string> = {
  on_model: "On-Model Photoshoot",
  ghost_mannequin: "Ghost Mannequin",
  banner: "Marketing Banner",
  video: "Promo Video",
};

const STATUS_COLOR: Record<string, string> = {
  queued: "gray",
  running: "yellow",
  completed: "green",
  failed: "red",
};

export default function AssetCard({ asset }: { asset: Asset }) {
  const url = mediaUrl(asset.url);
  const isVideo = asset.type === "video";

  return (
    <Box bg="gray.800" borderRadius="lg" overflow="hidden" borderWidth="1px" borderColor="gray.700">
      <Box position="relative" h="240px" display="flex" alignItems="center" justifyContent="center" bg="gray.900">
        {asset.status === "running" || asset.status === "queued" ? (
          <VStack color="gray.500"><Spinner /><Text fontSize="sm">{asset.status}…</Text></VStack>
        ) : asset.status === "failed" ? (
          <Text color="red.300" fontSize="sm" px={4} textAlign="center">{asset.error ?? "failed"}</Text>
        ) : isVideo && url ? (
          <video src={url} controls loop style={{ maxHeight: "240px", width: "100%" }} />
        ) : url ? (
          <Image src={url} alt={asset.type} maxH="240px" objectFit="contain" />
        ) : null}
      </Box>
      <Box p={3}>
        <VStack align="stretch" spacing={1}>
          <Text fontWeight="semibold">{LABELS[asset.type] ?? asset.type}</Text>
          <Box>
            <Badge colorScheme={STATUS_COLOR[asset.status] ?? "gray"}>{asset.status}</Badge>
            {url && asset.status === "completed" && (
              <Link href={url} isExternal ml={2} fontSize="sm" color="brand.100">download</Link>
            )}
          </Box>
        </VStack>
      </Box>
    </Box>
  );
}
