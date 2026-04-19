import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
	children: ReactNode;
	fallbackTitle?: string;
	fallbackMessage?: string;
}

interface ErrorBoundaryState {
	hasError: boolean;
	errorMessage: string;
}

export default class ErrorBoundary extends Component<
	ErrorBoundaryProps,
	ErrorBoundaryState
> {
	public state: ErrorBoundaryState = {
		hasError: false,
		errorMessage: "",
	};

	public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        console.log("getDerivedStateFromError 1")
		return {
			hasError: true,
			errorMessage: error.message,
		};
	}

	public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        console.log("componentDidCatch 3")
		console.error("Kanban UI crashed:", error, errorInfo);
	}

	private readonly handleRetry = (): void => {
        console.log("handleRetry 4")
		this.setState({ hasError: false, errorMessage: "" });
	};

	public render() {
        console.log("ErrorBoundary render: hasError =", this.state.hasError);
		if (this.state.hasError) {
            console.log("Rendering fallback UI with error message:", this.state.errorMessage);
			return (
				<section className="error-card" role="alert">
					<h2>{this.props.fallbackTitle ?? "Something went wrong"}</h2>
					<p>
						{this.props.fallbackMessage ??
							"The board could not be rendered. Please try again."}
					</p>
					{this.state.errorMessage && (
						<small className="error-details">{this.state.errorMessage}</small>
					)}
					<button type="button" onClick={this.handleRetry}>
						Retry
					</button>
				</section>
			);
		}

		return this.props.children;
	}
}
