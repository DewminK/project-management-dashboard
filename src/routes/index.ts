import { createElement } from "react";
import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import Home from "../pages/Home";
import Login from "../pages/Login";

export const router = createBrowserRouter([
	{
		path: "/",
		element: createElement(Login),
	},
	{
		path: "/dashboard",
		element: createElement(
			ProtectedRoute,
			null,
			createElement(Home)
		),
	},
]);
