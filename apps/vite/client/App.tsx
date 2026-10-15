import { ThemeProvider } from "next-themes"
import { BrowserRouter, Route, Routes } from "./lib/router"
import Index from "./pages/Index"
import NotFound from "./pages/NotFound"
import Privacy from "./pages/Privacy"
import Terms from "./pages/Terms"
import Security from "./pages/Security"

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/security" element={<Security />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
