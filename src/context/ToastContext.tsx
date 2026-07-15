import { createContext, useCallback, useContext, useState } from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";

interface Toast {
	id: number;
	message: string;
	type: "success" | "error";
}

interface ToastContextValue {
	showToast: (message: string, type?: Toast["type"]) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

interface ToastProviderProps {
	children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
	const [toasts, setToasts] = useState<Toast[]>([]);

	const showToast = useCallback((message: string, type: Toast["type"] = "success") => {
		const id = Date.now();
		setToasts((current) => [...current, { id, message, type }]);

		setTimeout(() => {
			setToasts((current) => current.filter((toast) => toast.id !== id));
		}, 3000);
	}, []);

	return (
		<ToastContext.Provider value={{ showToast }}>
			{children}
			{createPortal(
				<div
					style={{
						position: "fixed",
						top: "1rem",
						right: "1rem",
						zIndex: 9999,
						display: "flex",
						flexDirection: "column",
						gap: "0.5rem",
					}}
				>
					{toasts.map((toast) => (
						<div
							key={toast.id}
							style={{
								borderRadius: "6px",
								padding: "0.75rem 1rem",
								fontSize: "0.875rem",
								color: "#fff",
								boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
								backgroundColor: toast.type === "success" ? "#16a34a" : "#dc2626",
							}}
						>
							{toast.message}
						</div>
					))}
				</div>,
				document.body
			)}
		</ToastContext.Provider>
	);
}

export function useToast() {
	const context = useContext(ToastContext);
	if (!context) {
		throw new Error("useToast must be used within ToastProvider");
	}
	return context;
}
