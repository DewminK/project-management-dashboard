import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuthStore } from "../../store/authStore";

interface ProtectedRouteProps {
	children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

	if (!isAuthenticated) {
		return <Navigate to="/" replace />;
	}

	return children;
}
