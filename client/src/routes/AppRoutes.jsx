import { Routes, Route } from "react-router-dom";
import App from "../App";
import Register from "../pages/Register/Register";

const AppRoutes = () => {
    return (
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/register" element={<Register />} />
        </Routes>
    );
};

export default AppRoutes;