import { Navigate, Route, Routes } from "react-router-dom"
import Layout from "./components/Layout"
import HomePage from "./pages/HomePage"
import PortfolioPage from "./pages/PortfolioPage"
import VenturesPage from "./pages/VenturesPage"
import AboutPage from "./pages/AboutPage"
import AIPage from "./pages/AIPage"
import LabPage from "./pages/LabPage"
import BlogPage from "./pages/BlogPage"
import BlogPostPage from "./pages/BlogPostPage"
import ContactPage from "./pages/ContactPage"

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/work" element={<Navigate to="/portfolio" replace />} />
        <Route path="/ventures" element={<VenturesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/ai" element={<AIPage />} />
        <Route path="/lab" element={<LabPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
