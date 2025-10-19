import { Suspense, lazy } from "react";
import { Navigate, useRoutes } from "react-router-dom";
import LoadingScreen from "../pages/LoadingScreen.jsx";

const Loadable = (Component) => (props) => {
  return (
    <Suspense fallback={<LoadingScreen />}>
      <Component {...props} />
    </Suspense>
  );
};

const Layout = Loadable(lazy(() => import("../Layout.jsx")));
const Lobby = Loadable(lazy(() => import("../pages/Lobby.jsx")));
const MeetingRoom = Loadable(lazy(() => import("../pages/Meeting.jsx")));
const Page404 = Loadable(lazy(() => import("../pages/Page404.jsx")));

export default function Router() {
  return useRoutes([
    {
      path: "/",
      element: <Layout />,
      children: [
        { path: "/", element: <Lobby /> },
        { path: "meeting/:meetingId", element: <MeetingRoom /> },
        { path: "404", element: <Page404 /> },
        { path: "*", element: <Navigate to="/404" replace /> },
      ],
    },
  ]);
}


