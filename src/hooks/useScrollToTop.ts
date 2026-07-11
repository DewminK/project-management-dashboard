import { useEffect, type RefObject } from "react";

export function useScrollToTop(
	ref: RefObject<HTMLElement | null>,
	deps: unknown[]
): void {
	useEffect(() => {
		ref.current?.scrollTo({ top: 0, behavior: "smooth" });
	}, deps);
}
