import { ThemeProvider } from "next-themes"
import { BrowserRouter, Route, Routes } from "./lib/router"
import Index from "./pages/Index"
import Privacy from "./pages/Privacy"
import Terms from "./pages/Terms"
import NotFound from "./pages/NotFound"

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  )
}
