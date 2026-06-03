import { Group, Pagination, Text } from "@mantine/core";

type PaginationControlsProps = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

const PaginationControls = ({ page, totalPages, onPageChange }: PaginationControlsProps) => {
  const safeTotalPages = Math.max(totalPages || 1, 1);
  const safePage = Math.min(Math.max(page || 1, 1), safeTotalPages);

  return (
    <Group justify="space-between">
      <Text size="sm" c="dimmed">
        Page {safePage} of {safeTotalPages}
      </Text>
      <Pagination value={safePage} total={safeTotalPages} onChange={onPageChange} />
    </Group>
  );
};

export default PaginationControls;
