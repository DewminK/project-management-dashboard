import { useMemo, useState } from "react";

export interface UsePaginationResult<T> {
	page: number;
	totalPages: number;
	paginated: T[];
	setPage: (page: number) => void;
	reset: () => void;
	hasPrev: boolean;
	hasNext: boolean;
}

export function usePagination<T>(items: T[], pageSize = 8): UsePaginationResult<T> {
	const [page, setPage] = useState(1);
	const totalPages = Math.max(1, Math.ceil(items.length / pageSize));
	const safePage = Math.min(page, totalPages);

	const paginated = useMemo(
		() => items.slice((safePage - 1) * pageSize, safePage * pageSize),
		[items, safePage, pageSize]
	);

	return {
		page: safePage,
		totalPages,
		paginated,
		setPage,
		reset: () => setPage(1),
		hasPrev: safePage > 1,
		hasNext: safePage < totalPages,
	};
}
