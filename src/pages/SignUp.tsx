import { useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useSignupMutation } from "../hooks/useAuth";
import { UserRoles } from "../types/auth";
import type { SignupRequest, UserRoles as UserRoleType } from "../types/auth";

interface SignUpProps {
	onSwitchToLogin: () => void;
}

interface SignupFormState {
	name: string;
	email: string;
	password: string;
	confirmPassword: string;
	role: UserRoleType;
}

const INITIAL_FORM: SignupFormState = {
	name: "",
	email: "",
	password: "",
	confirmPassword: "",
	role: UserRoles.TeamMember,
};

export default function SignUp({ onSwitchToLogin }: SignUpProps) {
	const signupMutation = useSignupMutation();
	const [form, setForm] = useState<SignupFormState>(INITIAL_FORM);
	const [validationError, setValidationError] = useState("");

	const isSubmitting = signupMutation.isPending;

	const hintText = useMemo(
		() =>
			form.role === UserRoles.ProjectManager
				? "Project managers can create and assign projects."
				: "Team members can view assigned projects.",
		[form.role]
	);

	const onSubmit = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		setValidationError("");

		if (!form.name.trim() || !form.email.trim() || !form.password || !form.confirmPassword) {
			setValidationError("All fields are required.");
			return;
		}

		if (form.password.length < 8) {
			setValidationError("Password must be at least 8 characters.");
			return;
		}

		if (form.password !== form.confirmPassword) {
			setValidationError("Passwords do not match.");
			return;
		}

		const payload: SignupRequest = {
			name: form.name,
			email: form.email,
			password: form.password,
			confirmPassword: form.confirmPassword,
			role: form.role,
		};

		signupMutation.mutate(payload);
	};

	return (
		<div className="auth-card">
			<h1>Create account</h1>
			<p className="auth-subtitle">Sign up and continue to your role-based dashboard.</p>

			<form className="auth-form" onSubmit={onSubmit}>
				<label>
					Name
					<input
						value={form.name}
						onChange={(event) =>
							setForm((current) => ({ ...current, name: event.target.value }))
						}
						placeholder="Your name"
						type="text"
					/>
				</label>

				<label>
					Email
					<input
						value={form.email}
						onChange={(event) =>
							setForm((current) => ({ ...current, email: event.target.value }))
						}
						placeholder="you@example.com"
						type="email"
					/>
				</label>

				<label>
					Password
					<input
						value={form.password}
						onChange={(event) =>
							setForm((current) => ({ ...current, password: event.target.value }))
						}
						placeholder="Minimum 8 characters"
						type="password"
					/>
				</label>

				<label>
					Confirm Password
					<input
						value={form.confirmPassword}
						onChange={(event) =>
							setForm((current) => ({ ...current, confirmPassword: event.target.value }))
						}
						placeholder="Re-enter password"
						type="password"
					/>
				</label>

				<label>
					Role
					<select
						onChange={(event) =>
							setForm((current) => ({
								...current,
								role: event.target.value as UserRoleType,
							}))
						}
						value={form.role}
					>
						<option value={UserRoles.TeamMember}>Team Member</option>
						<option value={UserRoles.ProjectManager}>Project Manager</option>
					</select>
				</label>

				<small>{hintText}</small>

				{validationError && <p className="state-message error">{validationError}</p>}
				{signupMutation.isError && (
					<p className="state-message error">{(signupMutation.error as Error).message}</p>
				)}

				<button disabled={isSubmitting} type="submit">
					{isSubmitting ? "Creating account..." : "Sign Up"}
				</button>
			</form>

			<button className="link-button" onClick={onSwitchToLogin} type="button">
				Already have an account? Login
			</button>
		</div>
	);
}
