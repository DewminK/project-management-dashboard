import { createElement } from "react";
import { createBrowserRouter } from "react-router-dom";
import ProtectedRoute from "../components/common/ProtectedRoute";
import Backlog from "../pages/Backlog";
import Home from "../pages/Home";
import Kanban from "../pages/Kanban";
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
	{
		path: "/dashboard/kanban",
		element: createElement(
			ProtectedRoute,
			null,
			createElement(Kanban)
		),
	},
	{
		path: "/dashboard/backlog",
		element: createElement(
			ProtectedRoute,
			null,
			createElement(Backlog)
		),
	},
]);
