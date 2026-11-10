import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, MotionConfig } from "framer-motion";
import Home from "./pages/Home";
import CreateRoom from "./pages/CreateRoom";
import JoinRoom from "./pages/JoinRoom";
import Room from "./pages/Room";
import AuthForm from "./pages/AuthForm";
import NotFound from "./pages/NotFound";
import Navbar from "./components/Navbar";
import Background from "./components/Background";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
    const location = useLocation();

    return (
        // Respects the OS "reduce motion" setting for every animation
        <MotionConfig reducedMotion="user">
            <Background />
            <Navbar />
            <AnimatePresence mode="wait">
                <Routes location={location} key={location.pathname}>
                    <Route path="/" element={<Home />} />
                    <Route path="/login" element={<AuthForm mode="login" />} />
                    <Route path="/register" element={<AuthForm mode="register" />} />
                    <Route path="/create" element={<ProtectedRoute><CreateRoom /></ProtectedRoute>} />
                    <Route path="/join" element={<JoinRoom />} />
                    <Route path="/room/:code" element={<Room />} />
                    <Route path="*" element={<NotFound />} />
                </Routes>
            </AnimatePresence>
        </MotionConfig>
    );
}

export default App;
