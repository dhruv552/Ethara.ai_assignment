import "@/App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import Dashboard from "@/pages/Dashboard";
import Projects from "@/pages/Projects";
import Tasks from "@/pages/Tasks";

export default function App() {
    return (
        <div className="App">
            <ThemeProvider>
                <AuthProvider>
                    <BrowserRouter>
                        <Routes>
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route
                                element={
                                    <ProtectedRoute>
                                        <Layout />
                                    </ProtectedRoute>
                                }
                            >
                                <Route
                                    path="/dashboard"
                                    element={<Dashboard />}
                                />
                                <Route
                                    path="/projects"
                                    element={<Projects />}
                                />
                                <Route
                                    path="/projects/:id"
                                    element={<Tasks />}
                                />
                            </Route>
                            <Route
                                path="*"
                                element={<Navigate to="/dashboard" replace />}
                            />
                        </Routes>
                    </BrowserRouter>
                    <Toaster richColors closeButton />
                </AuthProvider>
            </ThemeProvider>
        </div>
    );
}
